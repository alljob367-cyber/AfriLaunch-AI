"""
AfriLaunch AI — Orchestrateur Multi-Agents
Architecture: LangChain + LangGraph + FastAPI
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import asyncio
import redis.asyncio as redis
import json
from datetime import datetime

from agents.branding_agent import BrandingAgent
from agents.marketing_agent import MarketingAgent
from agents.seo_agent import SeoAgent
from agents.content_agent import ContentAgent
from agents.youtube_agent import YouTubeAgent
from agents.tiktok_agent import TikTokAgent
from agents.facebook_agent import FacebookAgent
from agents.instagram_agent import InstagramAgent
from agents.crm_agent import CRMAgent
from agents.support_agent import SupportAgent
from agents.analytics_agent import AnalyticsAgent
from agents.accounting_agent import AccountingAgent
from agents.business_agent import BusinessAgent
from agents.advertising_agent import AdvertisingAgent
from orchestrator.graph import build_orchestration_graph
from memory.manager import MemoryManager
from database.prisma import get_prisma
from auth.middleware import verify_jwt

app = FastAPI(
    title="AfriLaunch AI — Agent Orchestrator",
    description="Système multi-agents IA pour entrepreneurs africains",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://afrilaunch.ai", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Registre des agents ─────────────────────────────────────────
AGENT_REGISTRY = {
    "branding": BrandingAgent,
    "marketing": MarketingAgent,
    "advertising": AdvertisingAgent,
    "seo": SeoAgent,
    "youtube": YouTubeAgent,
    "tiktok": TikTokAgent,
    "facebook": FacebookAgent,
    "instagram": InstagramAgent,
    "crm": CRMAgent,
    "support": SupportAgent,
    "analytics": AnalyticsAgent,
    "accounting": AccountingAgent,
    "business": BusinessAgent,
    "content": ContentAgent,
}

# ─── Schémas Pydantic ─────────────────────────────────────────────
class AgentRequest(BaseModel):
    agent_type: str = Field(..., description="Type d'agent à invoquer")
    message: str = Field(..., description="Message de l'utilisateur")
    organization_id: str
    session_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = {}
    language: str = "fr"

class OrchestratedRequest(BaseModel):
    objective: str = Field(..., description="Objectif principal")
    organization_id: str
    context: Optional[Dict[str, Any]] = {}
    agents: Optional[List[str]] = None  # Si None, auto-sélection
    language: str = "fr"

class AgentResponse(BaseModel):
    session_id: str
    agent_type: str
    response: str
    actions_taken: List[Dict[str, Any]]
    decision_log: List[Dict[str, Any]]
    suggestions: List[str]
    tokens_used: int
    cost_usd: float

# ─── Routes ──────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.post("/api/v1/agent/invoke", response_model=AgentResponse)
async def invoke_agent(
    request: AgentRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(verify_jwt),
):
    """Invoquer un agent spécialisé directement."""
    if request.agent_type not in AGENT_REGISTRY:
        raise HTTPException(
            status_code=400,
            detail=f"Agent '{request.agent_type}' inconnu. Agents disponibles: {list(AGENT_REGISTRY.keys())}"
        )

    agent_class = AGENT_REGISTRY[request.agent_type]
    memory = MemoryManager(
        organization_id=request.organization_id,
        session_id=request.session_id,
    )

    agent = agent_class(
        organization_id=request.organization_id,
        memory=memory,
        language=request.language,
    )

    try:
        result = await agent.invoke(
            message=request.message,
            context=request.context or {},
        )

        # Sauvegarder en base en arrière-plan
        background_tasks.add_task(
            save_agent_session,
            organization_id=request.organization_id,
            session_id=result["session_id"],
            agent_type=request.agent_type,
            result=result,
        )

        return AgentResponse(**result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/orchestrate")
async def orchestrate_multi_agent(
    request: OrchestratedRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(verify_jwt),
):
    """Orchestration automatique multi-agents pour un objectif complexe."""
    graph = build_orchestration_graph(
        available_agents=list(AGENT_REGISTRY.keys()),
        organization_id=request.organization_id,
        language=request.language,
    )

    initial_state = {
        "objective": request.objective,
        "organization_id": request.organization_id,
        "context": request.context,
        "agents_requested": request.agents,
        "messages": [],
        "results": {},
        "decision_log": [],
    }

    final_state = await graph.ainvoke(initial_state)

    return {
        "objective": request.objective,
        "results": final_state["results"],
        "agents_used": final_state.get("agents_used", []),
        "total_tokens": final_state.get("total_tokens", 0),
        "decision_log": final_state.get("decision_log", []),
        "recommendations": final_state.get("recommendations", []),
    }


@app.get("/api/v1/agents")
async def list_agents(user_id: str = Depends(verify_jwt)):
    """Lister tous les agents disponibles avec leurs métadonnées."""
    agents_info = []
    for agent_type, agent_class in AGENT_REGISTRY.items():
        agents_info.append({
            "type": agent_type,
            "name": agent_class.NAME,
            "description": agent_class.DESCRIPTION,
            "avatar": agent_class.AVATAR_URL,
            "skills": agent_class.SKILLS,
            "pricing": agent_class.PRICING,
            "models": agent_class.WORK_MODELS,
        })
    return {"agents": agents_info}


@app.get("/api/v1/agent/{agent_type}/sessions")
async def get_agent_sessions(
    agent_type: str,
    organization_id: str,
    user_id: str = Depends(verify_jwt),
):
    """Récupérer l'historique des sessions d'un agent."""
    prisma = await get_prisma()
    sessions = await prisma.agentsession.find_many(
        where={
            "organizationId": organization_id,
            "agentType": agent_type.upper(),
        },
        order_by={"createdAt": "desc"},
        take=20,
    )
    return {"sessions": sessions}


async def save_agent_session(
    organization_id: str,
    session_id: str,
    agent_type: str,
    result: dict,
):
    """Sauvegarder la session d'agent en base de données."""
    prisma = await get_prisma()
    try:
        await prisma.agentsession.upsert(
            where={"id": session_id},
            create={
                "id": session_id,
                "organizationId": organization_id,
                "agentType": agent_type.upper(),
                "messages": result.get("messages", []),
                "memory": result.get("memory", {}),
                "decisionLog": result.get("decision_log", []),
                "tokensUsed": result.get("tokens_used", 0),
                "cost": result.get("cost_usd", 0),
            },
            update={
                "messages": result.get("messages", []),
                "memory": result.get("memory", {}),
                "decisionLog": result.get("decision_log", []),
                "tokensUsed": result.get("tokens_used", 0),
                "cost": result.get("cost_usd", 0),
                "updatedAt": datetime.utcnow(),
            },
        )
    except Exception as e:
        print(f"Error saving agent session: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        workers=4,
        log_level="info",
    )
