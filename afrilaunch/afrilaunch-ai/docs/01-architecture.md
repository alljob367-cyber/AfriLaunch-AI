# AfriLaunch AI — Architecture Complète

## Vue d'ensemble

AfriLaunch AI est une plateforme SaaS multi-tenant, microservices, conçue pour l'Afrique.
Elle permet à tout entrepreneur de lancer sa présence numérique en quelques minutes.

---

## Diagramme d'Architecture Global

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENTS                                        │
│   Browser (Next.js)  │  Mobile (PWA)  │  API Partners  │  Webhooks     │
└──────────────────────┬──────────────────────────────────────────────────┘
                       │
              ┌────────▼────────┐
              │  Cloudflare CDN │  (DDoS, WAF, Edge Cache)
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │  API Gateway    │  (Kong / Nginx)
              │  Rate Limiting  │
              │  Auth Middleware│
              └────────┬────────┘
                       │
     ┌─────────────────┼──────────────────┐
     │                 │                  │
┌────▼────┐     ┌──────▼──────┐   ┌──────▼──────┐
│  Auth   │     │   Core API  │   │  AI Engine  │
│ Service │     │  (NestJS)   │   │  (Python)   │
└────┬────┘     └──────┬──────┘   └──────┬──────┘
     │                 │                  │
     └─────────────────┼──────────────────┘
                       │
     ┌─────────────────┼──────────────────────────────┐
     │                 │                              │
┌────▼────┐     ┌──────▼──────┐              ┌───────▼──────┐
│ Redis   │     │ PostgreSQL  │              │  Supabase /  │
│ Cache   │     │  (Primary)  │              │  R2 Storage  │
└─────────┘     └─────────────┘              └──────────────┘
```

---

## Microservices

| Service             | Technologie     | Port  | Rôle                                |
|---------------------|-----------------|-------|-------------------------------------|
| auth-service        | NestJS          | 3001  | Auth, OAuth, MFA, RBAC              |
| identity-service    | NestJS          | 3002  | Marque, Logo, Charte graphique      |
| social-service      | NestJS          | 3003  | Connexion réseaux sociaux           |
| payment-service     | NestJS          | 3004  | Paiements, Abonnements              |
| content-service     | NestJS          | 3005  | Génération de contenu               |
| website-service     | NestJS          | 3006  | Génération de site web              |
| ai-orchestrator     | Python FastAPI   | 8000  | Orchestration multi-agents IA       |
| agent-service       | Python FastAPI   | 8001  | Agents IA spécialisés               |
| notification-service| NestJS          | 3007  | Email, SMS, WhatsApp, Push          |
| analytics-service   | NestJS          | 3008  | Métriques, Stats, Rapports          |
| billing-service     | NestJS          | 3009  | Plans, Facturation, Affiliés        |
| gateway             | Kong/Nginx      | 80/443| Point d'entrée unique               |

---

## Stack Technique Détaillé

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 3.x + CSS Variables
- **Components**: ShadCN UI + Radix UI
- **Animations**: Framer Motion 11
- **State**: Zustand + React Query (TanStack)
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React + custom SVGs
- **i18n**: next-intl (FR, EN, PT, AR, SW)
- **Testing**: Vitest + Playwright

### Backend
- **Framework**: NestJS 10 (par service)
- **ORM**: Prisma
- **Database**: PostgreSQL 16 + TimescaleDB
- **Cache**: Redis 7 + BullMQ (queues)
- **Search**: Elasticsearch / Typesense
- **Events**: Apache Kafka
- **Storage**: Supabase Storage + Cloudflare R2

### IA
- **Orchestrateur**: LangChain + LangGraph
- **LLM**: OpenAI GPT-4o + Anthropic Claude (fallback)
- **Embeddings**: OpenAI text-embedding-3-large
- **Vector DB**: Pinecone / pgvector
- **Image Gen**: DALL-E 3 + Stability AI
- **Vision**: GPT-4 Vision

### Infrastructure
- **Containers**: Docker + Docker Compose
- **Orchestration**: Kubernetes (K8s)
- **CI/CD**: GitHub Actions
- **Cloud**: AWS / GCP (Africa regions)
- **Monitoring**: Prometheus + Grafana + Sentry
- **Logs**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Secrets**: HashiCorp Vault

---

## Flux de Données Principal

```
User → Gateway → Auth Middleware → Service → AI Orchestrator → Response
                                      ↓
                               Event Bus (Kafka)
                                      ↓
                         Analytics + Notification Services
```

---

## Sécurité — Couches de Protection

1. **Cloudflare**: DDoS, WAF, Bot Management
2. **API Gateway**: Rate limiting, IP Whitelist, SSL/TLS
3. **Auth Service**: JWT RS256, MFA (TOTP), RBAC
4. **Application**: AES-256, Input validation, CSRF tokens
5. **Database**: Row Level Security (RLS), Encryption at rest
6. **Audit**: Logs immuables, alertes en temps réel
