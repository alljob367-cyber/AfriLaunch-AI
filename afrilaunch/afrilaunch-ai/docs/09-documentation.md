# AfriLaunch AI — Documentation Technique Complète

## 📋 Table des matières

1. [Guide de démarrage rapide](#démarrage)
2. [Architecture](#architecture)
3. [Configuration](#configuration)
4. [API Reference](#api)
5. [Modules](#modules)
6. [Sécurité](#sécurité)
7. [Déploiement](#déploiement)
8. [FAQ](#faq)

---

## 🚀 Démarrage Rapide

### Prérequis

```bash
- Node.js >= 20.x
- Python >= 3.11
- Docker & Docker Compose
- PostgreSQL 16
- Redis 7
```

### Installation en développement

```bash
# 1. Cloner le projet
git clone https://github.com/afrilaunch/afrilaunch-ai.git
cd afrilaunch-ai

# 2. Copier les variables d'environnement
cp .env.example .env
# → Éditer .env avec vos clés API

# 3. Démarrer les services avec Docker Compose
docker-compose -f infrastructure/docker/docker-compose.yml up -d

# 4. Appliquer les migrations Prisma
cd src/backend/auth-service
npx prisma migrate dev

# 5. Démarrer le frontend
cd src/frontend
npm install && npm run dev

# 6. Démarrer l'orchestrateur IA
cd src/backend/ai-orchestrator
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Variables d'environnement requises

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/afrilaunch_db

# Redis
REDIS_URL=redis://:password@localhost:6379

# JWT (RS256 - générer avec: openssl genrsa -out private.pem 2048)
JWT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----..."
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----..."

# OAuth
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
FACEBOOK_APP_ID=xxx
FACEBOOK_APP_SECRET=xxx
APPLE_CLIENT_ID=xxx
MICROSOFT_CLIENT_ID=xxx
MICROSOFT_CLIENT_SECRET=xxx

# IA
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx

# Paiements
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-xxx
FLUTTERWAVE_SECRET_KEY=FLWSECK-xxx
PAYSTACK_SECRET_KEY=sk_live_xxx
LEMON_SQUEEZY_API_KEY=xxx

# Stockage
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=xxx
CLOUDFLARE_R2_ACCOUNT_ID=xxx
CLOUDFLARE_R2_ACCESS_KEY=xxx
CLOUDFLARE_R2_SECRET_KEY=xxx
CLOUDFLARE_R2_BUCKET=afrilaunch-assets

# Notifications
SENDGRID_API_KEY=xxx
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
WHATSAPP_BUSINESS_TOKEN=xxx

# App
NEXT_PUBLIC_API_URL=http://localhost:80
APP_URL=http://localhost:3000
```

---

## 🏗️ Architecture

### Structure du projet

```
afrilaunch-ai/
├── src/
│   ├── frontend/                 # Next.js 14 App
│   │   ├── app/                  # App Router
│   │   │   ├── (marketing)/      # Pages publiques
│   │   │   ├── (dashboard)/      # Pages authentifiées
│   │   │   └── api/              # API Routes Next.js
│   │   ├── components/           # Composants React
│   │   ├── hooks/                # Custom hooks
│   │   ├── stores/               # Zustand stores
│   │   └── lib/                  # Utilitaires
│   │
│   └── backend/
│       ├── auth-service/         # NestJS - Authentification
│       ├── identity-service/     # NestJS - Identité de marque
│       ├── social-service/       # NestJS - Réseaux sociaux
│       ├── payment-service/      # NestJS - Paiements
│       ├── content-service/      # NestJS - Génération contenu
│       ├── website-service/      # NestJS - Sites web
│       ├── notification-service/ # NestJS - Notifications
│       ├── analytics-service/    # NestJS - Analytics
│       ├── billing-service/      # NestJS - Facturation
│       └── ai-orchestrator/      # Python FastAPI - IA
│           ├── agents/           # 13 agents spécialisés
│           ├── orchestrator/     # LangGraph orchestration
│           ├── memory/           # Gestion mémoire
│           └── tools/            # Outils des agents
│
├── database/
│   └── schema.prisma            # Schéma PostgreSQL complet
│
├── infrastructure/
│   ├── docker/                  # Docker Compose
│   ├── k8s/                     # Kubernetes manifests
│   ├── ci-cd/                   # GitHub Actions
│   └── monitoring/              # Prometheus + Grafana
│
├── tests/
│   ├── e2e/                     # Playwright E2E
│   ├── unit/                    # Vitest unit tests
│   └── integration/             # Tests d'intégration
│
└── docs/
    ├── 01-architecture.md
    ├── 07-ai-prompts.md
    └── 09-documentation.md      # Ce fichier
```

---

## 🔌 API Reference

### Authentication Service (port 3001)

```http
POST /auth/register
POST /auth/login
POST /auth/logout
POST /auth/refresh
POST /auth/forgot-password
POST /auth/reset-password
POST /auth/verify-email
POST /auth/mfa/setup
POST /auth/mfa/confirm
POST /auth/mfa/verify
GET  /auth/oauth/google
GET  /auth/oauth/facebook
GET  /auth/oauth/apple
GET  /auth/oauth/microsoft
GET  /auth/me
PUT  /auth/me
GET  /health
```

### Identity Service (port 3002)

```http
POST /identity/generate          # Générer identité complète
GET  /identity/:orgId            # Obtenir identité
PUT  /identity/:orgId            # Mettre à jour
POST /identity/:orgId/logo       # Régénérer logo
POST /identity/:orgId/palette    # Générer palette
GET  /identity/:orgId/export     # Exporter brand kit
```

### AI Orchestrator (port 8000)

```http
GET  /health
POST /api/v1/agent/invoke        # Invoquer un agent
POST /api/v1/orchestrate         # Orchestration multi-agents
GET  /api/v1/agents              # Lister les agents
GET  /api/v1/agent/{type}/sessions  # Historique sessions
DELETE /api/v1/session/{id}      # Supprimer session
```

### Content Service (port 3005)

```http
POST /content/generate           # Générer contenu
GET  /content/:orgId             # Lister contenus
GET  /content/:orgId/:id         # Obtenir contenu
PUT  /content/:orgId/:id         # Mettre à jour
DELETE /content/:orgId/:id       # Supprimer
POST /content/:orgId/:id/publish # Publier
```

### Payment Service (port 3004)

```http
GET  /payments/recommendations/:country  # Recommandations par pays
POST /payments/stripe/subscription       # Créer abonnement Stripe
POST /payments/flutterwave/initiate      # Initier paiement Flutterwave
POST /payments/paystack/initiate         # Initier paiement Paystack
POST /payments/webhook/stripe            # Webhook Stripe
POST /payments/webhook/flutterwave       # Webhook Flutterwave
GET  /payments/virtual-cards             # Cartes virtuelles disponibles
GET  /payments/virtual-numbers           # Numéros virtuels disponibles
```

---

## 📦 Modules

### Module 1 — Tableau de Bord
- Progression en temps réel avec checklist gamifiée
- Statistiques cross-platform (tous réseaux sociaux)
- Recommandations IA personnalisées selon l'activité
- Widget d'activités récentes

### Module 2 — Création d'Identité
- **Input**: Type d'entreprise, secteur, pays, description
- **Output**: Nom, slogan, description, logo PNG+SVG, palette 3 variations, polices, signature email
- **IA utilisée**: GPT-4o (texte) + DALL-E 3 (logo)
- **Stockage**: Cloudflare R2

### Module 3 — Réseaux Sociaux
Les connexions utilisent UNIQUEMENT les OAuth officiels:
- YouTube → OAuth Google (scope: youtube.readonly, youtube.upload)
- Facebook/Instagram → Facebook Login + Graph API
- TikTok → TikTok for Developers OAuth
- LinkedIn → LinkedIn OAuth 2.0
- Pinterest → Pinterest OAuth
- X (Twitter) → Twitter OAuth 2.0
- WhatsApp Business → WhatsApp Business API (Meta)
- Telegram → Bot API (pas d'OAuth direct)

### Module 4 — Solutions de Paiement
Recommandations basées sur le pays de l'utilisateur.
Aucune automatisation de création de compte — guides et liens directs.
Conformité totale aux CGU de chaque provider.

### Module 5 — Cartes Virtuelles
Fournisseurs partenaires avec API officielle:
- Chipper Cash (Afrique sub-saharienne)
- Sudo Africa (API de carte bancaire)
- Barter by Flutterwave
- Payoneer Virtual Card

### Module 6 — Numéros Virtuels
Fournisseurs légaux et réglementés:
- Twilio (global)
- Vonage/Nexmo (global)
- Africa's Talking (Afrique)
- SMSLive247 (Afrique de l'Ouest)

### Module 7 — Génération de Contenu
15 types de contenus supportés. Voir ContentService pour détails.

### Module 8 — Sites Web
7 types de sites. Génération automatique via IA + templates.
Hébergement sur sous-domaine: {slug}.afrilaunch.site
Domaine personnalisé: configurable via DNS.

### Module 9 — Agents IA
13 agents spécialisés. Architecture LangChain + LangGraph.
Mémoire locale (session) + mémoire projet (persistante).
Capacité d'appeler d'autres agents (orchestration).

---

## 🔒 Sécurité

### Couches de protection

| Couche | Technologie | Protection |
|--------|-------------|------------|
| Edge | Cloudflare | DDoS, WAF, Bot |
| Transport | TLS 1.3 | MITM |
| Auth | JWT RS256 + MFA | Usurpation |
| API | Rate Limiting | Abus |
| App | CORS, CSRF, XSS | Injections |
| Data | AES-256, RLS | Fuite données |
| Audit | Logs immuables | Forensics |

### Authentification
- Tokens JWT RS256 (15 min expiry)
- Refresh tokens rotatifs (30 jours)
- MFA obligatoire pour les plans Pro+
- Sessions révocables à tout moment
- Détection brute-force (blocage IP)

### RBAC
```
SUPER_ADMIN → Tout
ADMIN → Gestion org, membres, settings
MEMBER → Accès complet aux modules
VIEWER → Lecture seule
```

---

## 🚀 Déploiement Production

### Checklist pré-déploiement

```bash
☐ Variables d'environnement configurées
☐ Certificats SSL installés
☐ DNS configuré (Cloudflare)
☐ Base de données migrée
☐ Redis configuré (sentinel ou cluster)
☐ Monitoring actif (Prometheus + Grafana + Sentry)
☐ Backups automatiques configurés (24h)
☐ Tests E2E validés en staging
☐ Rate limiting configuré (Kong/Nginx)
☐ WAF règles activées
☐ Scan sécurité Trivy validé
☐ Docs API à jour (Swagger)
```

### Commandes de déploiement

```bash
# Tag de release
git tag -a v1.0.0 -m "Release v1.0.0 — Production"
git push origin v1.0.0

# Le CI/CD GitHub Actions prend le relais automatiquement

# Vérification manuelle si besoin
kubectl rollout status deployment/frontend -n afrilaunch-prod
kubectl rollout status deployment/auth-service -n afrilaunch-prod
kubectl rollout status deployment/ai-orchestrator -n afrilaunch-prod
```

### Rollback d'urgence

```bash
# Revenir à la version précédente
kubectl rollout undo deployment/frontend -n afrilaunch-prod

# Ou spécifier une version
kubectl rollout undo deployment/frontend --to-revision=2 -n afrilaunch-prod
```

---

## ❓ FAQ

**Q: AfriLaunch AI crée-t-il automatiquement des comptes sur les réseaux sociaux ?**
R: NON. La plateforme guide l'utilisateur via les OAuth officiels pour CONNECTER ses comptes existants. Toute création de compte se fait directement sur les plateformes concernées, conformément à leurs CGU.

**Q: Les paiements sont-ils sécurisés ?**
R: Oui. Nous n'stockons jamais les numéros de carte. Stripe et les autres providers sont certifiés PCI-DSS. Toutes les transactions sont chiffrées.

**Q: Dans quels pays est disponible AfriLaunch AI ?**
R: Dans tous les 54 pays africains, avec des recommandations adaptées à chaque pays.

**Q: Quelle est la politique de confidentialité des données ?**
R: Vos données sont stockées dans des régions AWS/GCP en Afrique (af-south-1, etc.). Conformité RGPD et lois africaines de protection des données.

**Q: Les agents IA ont-ils accès à mes données personnelles ?**
R: Les agents utilisent uniquement les données de votre organisation que vous avez autorisées. Aucune donnée n'est partagée entre organisations.
