"""
AfriLaunch AI — Agent de Base
Tous les agents spécialisés héritent de cette classe.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain.tools import Tool
from langchain.memory import ConversationBufferWindowMemory
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
import uuid
import tiktoken
from datetime import datetime

from memory.manager import MemoryManager


class BaseAgent(ABC):
    # Métadonnées à définir dans chaque sous-classe
    NAME: str = "Agent"
    DESCRIPTION: str = ""
    AVATAR_URL: str = ""
    SKILLS: List[str] = []
    PRICING: Dict[str, Any] = {}
    WORK_MODELS: List[str] = []
    SYSTEM_PROMPT: str = ""

    def __init__(
        self,
        organization_id: str,
        memory: MemoryManager,
        language: str = "fr",
        model: str = "gpt-4o",
    ):
        self.organization_id = organization_id
        self.memory = memory
        self.language = language
        self.session_id = str(uuid.uuid4())
        self.decision_log: List[Dict] = []
        self.actions_taken: List[Dict] = []
        self.total_tokens = 0
        self.total_cost = 0.0

        # Modèle LLM principal
        self.llm = ChatOpenAI(
            model=model,
            temperature=0.7,
            max_tokens=4096,
        )

        # Modèle de fallback
        self.fallback_llm = ChatAnthropic(
            model="claude-3-5-sonnet-20241022",
            temperature=0.7,
            max_tokens=4096,
        )

        # Mémoire de conversation (10 derniers échanges)
        self.conversation_memory = ConversationBufferWindowMemory(
            k=10,
            return_messages=True,
        )

        # Charger la mémoire du projet
        self.project_memory = {}
        self.local_memory = {}

    async def invoke(self, message: str, context: Dict[str, Any] = {}) -> Dict[str, Any]:
        """Point d'entrée principal pour invoquer l'agent."""
        # Charger la mémoire
        self.project_memory = await self.memory.load_project_memory()
        self.local_memory = await self.memory.load_local_memory(self.session_id)

        # Construire les messages
        messages = self._build_messages(message, context)

        # Appeler le LLM avec gestion d'erreur et fallback
        response = await self._call_llm(messages)

        # Exécuter les actions dérivées
        actions = await self.execute_actions(response, context)

        # Calculer les coûts
        self._calculate_cost()

        # Mettre à jour la mémoire
        await self.memory.save(
            session_id=self.session_id,
            messages=messages,
            memory=self.local_memory,
            project_memory=self.project_memory,
        )

        return {
            "session_id": self.session_id,
            "agent_type": self.NAME.lower(),
            "response": response,
            "actions_taken": self.actions_taken,
            "decision_log": self.decision_log,
            "suggestions": await self.generate_suggestions(response, context),
            "tokens_used": self.total_tokens,
            "cost_usd": self.total_cost,
            "messages": messages,
            "memory": self.local_memory,
        }

    def _build_messages(self, message: str, context: Dict) -> List[Dict]:
        """Construire la liste de messages pour le LLM."""
        system_content = self._build_system_prompt(context)
        history = self.conversation_memory.load_memory_variables({}).get("history", [])

        messages = [SystemMessage(content=system_content)]
        messages.extend(history)
        messages.append(HumanMessage(content=message))

        return messages

    def _build_system_prompt(self, context: Dict) -> str:
        """Construire le prompt système enrichi avec le contexte."""
        brand_info = self.project_memory.get("brand", {})
        base_prompt = f"""{self.SYSTEM_PROMPT}

### Contexte de l'organisation
- ID: {self.organization_id}
- Langue: {self.language}
- Date: {datetime.now().strftime('%Y-%m-%d')}

### Identité de marque
{self._format_brand_context(brand_info)}

### Mémoire du projet
{self._format_project_memory()}

### Instructions générales
- Réponds toujours en {self.language}
- Sois concis, actionnable et adapté au marché africain
- Fournis des recommandations pratiques et réalisables
- Tiens compte des spécificités culturelles et économiques africaines
- Priorise les solutions accessibles et économiques
"""
        if context:
            base_prompt += f"\n### Contexte additionnel\n{context}"

        return base_prompt

    def _format_brand_context(self, brand: Dict) -> str:
        if not brand:
            return "Aucune identité de marque définie pour le moment."
        return f"""
- Nom: {brand.get('businessName', 'Non défini')}
- Slogan: {brand.get('slogan', 'Non défini')}
- Secteur: {brand.get('industry', 'Non défini')}
- Audience: {brand.get('targetAudience', 'Non définie')}
- Voix de marque: {brand.get('brandVoice', 'Non définie')}
"""

    def _format_project_memory(self) -> str:
        if not self.project_memory:
            return "Aucune mémoire de projet disponible."
        items = []
        for key, value in self.project_memory.items():
            if key != "brand" and value:
                items.append(f"- {key}: {str(value)[:100]}...")
        return "\n".join(items) if items else "Projet en cours de configuration."

    async def _call_llm(self, messages: List) -> str:
        """Appeler le LLM avec fallback automatique."""
        try:
            response = await self.llm.ainvoke(messages)
            self._log_decision("LLM_CALL", "OpenAI GPT-4o", {"success": True})
            return response.content
        except Exception as e:
            self._log_decision("LLM_FALLBACK", "Anthropic Claude", {"error": str(e)})
            try:
                response = await self.fallback_llm.ainvoke(messages)
                return response.content
            except Exception as e2:
                raise Exception(f"Both LLM providers failed: {e} | {e2}")

    @abstractmethod
    async def execute_actions(self, response: str, context: Dict) -> List[Dict]:
        """Exécuter les actions spécifiques à l'agent."""
        pass

    async def generate_suggestions(self, response: str, context: Dict) -> List[str]:
        """Générer des suggestions de prochaines étapes."""
        return []

    def _log_decision(self, action: str, target: str, metadata: Dict = {}):
        """Journaliser une décision de l'agent."""
        self.decision_log.append({
            "timestamp": datetime.now().isoformat(),
            "action": action,
            "target": target,
            "metadata": metadata,
        })

    def _log_action(self, action: str, result: Any):
        """Journaliser une action exécutée."""
        self.actions_taken.append({
            "timestamp": datetime.now().isoformat(),
            "action": action,
            "result": result,
        })

    def _calculate_cost(self):
        """Calculer le coût estimé en USD."""
        # Prix GPT-4o: $5/1M input tokens, $15/1M output tokens
        self.total_cost = (self.total_tokens / 1_000_000) * 10  # Moyenne simplifiée
