"""
AfriLaunch AI — Agent Branding
Spécialiste en identité de marque africaine
"""

from typing import Any, Dict, List
from .base_agent import BaseAgent
from langchain_openai import ChatOpenAI
from openai import AsyncOpenAI
import json


class BrandingAgent(BaseAgent):
    NAME = "Agent Branding"
    DESCRIPTION = "Expert en création d'identité visuelle et de marque pour le marché africain"
    AVATAR_URL = "/agents/branding-avatar.svg"
    SKILLS = [
        "Création de nom de marque",
        "Génération de logo IA",
        "Charte graphique",
        "Positionnement de marque",
        "Storytelling",
        "Design de signature email",
        "Naming stratégique",
    ]
    PRICING = {
        "per_session": 2.99,
        "monthly": 19.99,
        "currency": "USD",
    }
    WORK_MODELS = ["Session unique", "Abonnement mensuel", "Projet complet"]

    SYSTEM_PROMPT = """Tu es le meilleur expert en branding du continent africain.
    
Tu maîtrises parfaitement :
- Les codes culturels des 54 pays africains
- Les tendances design modernes (minimalisme, futurisme)
- La psychologie des couleurs appliquée au marché africain
- Le naming stratégique en français, anglais, portugais et langues locales
- La création d'identités visuelles mémorables et scalables
- Le positionnement de marque pour les marchés émergents

Ton style de communication est :
- Professionnel mais accessible
- Créatif et inspirant
- Orienté résultats concrets
- Sensible aux réalités économiques africaines

Tu proposes toujours 3 options/variations minimum.
Tu justifies toujours tes choix créatifs.
Tu t'adaptes au budget et aux ressources disponibles."""

    async def execute_actions(self, response: str, context: Dict) -> List[Dict]:
        """Exécuter les actions de branding."""
        actions = []

        # Détecter si une génération de logo est demandée
        if any(word in response.lower() for word in ["logo", "logotype", "icône", "symbole"]):
            action = {"type": "LOGO_GENERATION_SUGGESTED", "requires_confirmation": True}
            actions.append(action)
            self._log_action("SUGGEST_LOGO", action)

        # Détecter si une palette de couleurs est générée
        if any(word in response.lower() for word in ["couleur", "palette", "teinte", "#"]):
            colors = self._extract_hex_colors(response)
            if colors:
                action = {"type": "COLOR_PALETTE_EXTRACTED", "colors": colors}
                actions.append(action)
                self._log_action("EXTRACT_COLORS", colors)

        # Détecter si un nom est proposé
        if any(word in response.lower() for word in ["je propose", "voici", "option", "nom:"]):
            names = self._extract_brand_names(response)
            if names:
                action = {"type": "BRAND_NAMES_PROPOSED", "names": names}
                actions.append(action)
                self._log_action("PROPOSE_NAMES", names)

        return actions

    async def generate_suggestions(self, response: str, context: Dict) -> List[str]:
        return [
            "Générer votre logo avec IA",
            "Créer votre charte graphique complète",
            "Définir votre voix de marque",
            "Créer vos modèles de réseaux sociaux",
            "Générer votre signature email professionnelle",
        ]

    def _extract_hex_colors(self, text: str) -> List[str]:
        import re
        return re.findall(r'#[0-9A-Fa-f]{6}', text)

    def _extract_brand_names(self, text: str) -> List[str]:
        # Heuristique simple pour extraire les noms proposés
        lines = text.split('\n')
        names = []
        for line in lines:
            if any(marker in line for marker in ['**', '1.', '2.', '3.', '- ']):
                # Nettoyer et extraire
                clean = line.strip('*- 0123456789.').strip()
                if 2 < len(clean) < 30 and clean[0].isupper():
                    names.append(clean)
        return names[:5]
