# 🏗️ AfriLaunch AI — Fichier de Construction & Modifications

> **Usage** : Cochez les cases au fur et à mesure.  
> **Convention** : `[x]` = fait, `[ ]` = à faire.  
> **Dernière mise à jour** : 3 septembre 2026

---

## ✅ MODIFICATIONS TERMINÉES (historique)

### Sprint 1 — Sécurité (7 fixes critiques)
- [x] **S1.1** Fix bypass paiement `flutterwave-confirm` → `app/api/checkout/flutterwave-confirm/route.ts`
  - Ajout auth user + IDOR check + verify API Flutterwave + idempotency
- [x] **S1.2** Créer route `/api/payment-manual/upload` → `app/api/payment-manual/upload/route.ts`
  - Multipart, validation type/taille, ownership check
- [x] **S1.3** Supprimer backdoor admin → `lib/config-store.ts`
  - Retiré `if (password === 'Albermon2026!') return true;` ligne 574
  - Retiré `admin123` fallback ligne 569
- [x] **S1.4** Déplacer clés API en env vars → `lib/config-store.ts`
  - Créé `applyEnvApiKeys()` qui injecte depuis `process.env`
  - Vidé secrets de `data/app-config.json`
- [x] **S1.5** Sanitize `/api/admin/config` GET → `app/api/admin/config/route.ts`
  - Masque secrets en `{ has, preview }` au lieu de no-op
- [x] **S1.6** Créer middleware → `proxy.ts` (Next 16)
  - Protection routes + CSP + rate limit (10/min)
- [x] **S1.7** Supprimer fallback localStorage → `components/providers/auth-provider.tsx`

### Sprint 2 — Configs prod
- [x] **S2.1** Créer `lib/validators.ts`
- [x] **S2.2** Password policy sur `/api/auth/register`
- [x] **S2.3** `appUrl` utilise `NEXT_PUBLIC_APP_URL` env var

### Sprint 3 — Paiement
- [x] **S3.1** Idempotency `stripe-webhook` (table `processed-stripe-events`)
- [x] **S3.2** Idempotency `flutterwave-confirm` (table `processed-flw-txs`)

### Sprint 4 — Intégrations
- [x] **S4.1** Ajouter Groq au load balancer
- [x] **S4.2** Routing LLM par plan (OpenRouter pour tous)
- [x] **S4.3** Prompt Branding Agent amélioré

### Sprint 5 — UX/SEO
- [x] **S5.1** `app/robots.ts`
- [x] **S5.2** `app/sitemap.ts`
- [x] **S5.3** `app/not-found.tsx` (404 FR)
- [x] **S5.4** Skip-link accessibilité
- [x] **S5.5** Header sticky `app/legal/layout.tsx`
- [x] **S5.6** PWA icons (192, 512, apple-touch)
- [x] **S5.7** `og-image.png` régénérée
- [x] **S5.8** Fix liens morts footer
- [x] **S5.9** Fix `/api/users/daily-usage`

### Sprint 6 — Landing V2
- [x] **S6.1** `components/landing/mobile-mockup.tsx`
- [x] **S6.2** `components/landing/dashboard-preview.tsx`
- [x] **S6.3** `components/landing/floating-modules.tsx`
- [x] **S6.4** `components/landing/particles.tsx`
- [x] **S6.5** `components/landing/plans-marquee.tsx`
- [x] **S6.6** Logo PRO + `components/logo-lockup.tsx`

### Sprint 7 — Bug fixes
- [x] **S7.1** Fix WhatsApp Agent crash (modèle OpenRouter retiré)
- [x] **S7.2** Fix onboarding 0% (`useDashboardData` stub → réel fetch)
- [x] **S7.3** Fix dashboard crash `Cannot read properties of undefined`
- [x] **S7.4** Créer `/api/youtube/upload` route manquante
- [x] **S7.5** Fix Agent WhatsApp spinner infini (état `loadError`)

---

## 🔲 MODIFICATIONS À FAIRE (priorité décroissante)

### Sprint 8 — Ops production (BLOQUANT)
- [ ] **S8.1** Rotate `OPENROUTER_API_KEY` (compromise dans git history)
  - Aller sur https://openrouter.ai/keys
  - Revoke ancienne clé `sk-or-v1-e991077c...`
  - Créer nouvelle clé
  - Mettre à jour `.env` + Vercel env vars
  - Ajouter $10 crédits (couvre 1000 Pro users)

- [ ] **S8.2** Créer projet Supabase
  - Aller sur https://supabase.com → New Project
  - Nom: `afrilaunch-prod`
  - Région: `eu-central-1` (Frankfurt — proche Afrique)
  - Copier `NEXT_PUBLIC_SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY`
  - Exécuter `supabase-schema.sql` dans SQL Editor
  - Ajouter les 2 vars dans Vercel project settings

- [ ] **S8.3** Activer Flutterwave
  - Créer compte sur https://dashboard.flutterwave.com
  - Aller dans Settings → API
  - Copier Public Key, Secret Key, Encryption Key
  - Ajouter dans Vercel: `FLW_PUBLIC_KEY`, `FLW_SECRET_KEY`, `FLW_ENCRYPTION_KEY`
  - Tester en sandbox d'abord (POST `/api/checkout/session`)
  - Passer en production quand OK

- [ ] **S8.4** Configurer Twilio (WhatsApp Agent)
  - Créer compte sur https://console.twilio.com
  - Acheter un numéro WhatsApp Business
  - Copier Account SID + Auth Token
  - Ajouter `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`

- [ ] **S8.5** Créer bot Telegram
  - Ouvrir Telegram → @BotFather
  - `/newbot` → nom: `AfriLaunchAI Bot`
  - Copier le bot token
  - Ajouter `TELEGRAM_BOT_TOKEN` dans Vercel

- [ ] **S8.6** Configurer ElevenLabs (Voix IA)
  - Créer compte sur https://elevenlabs.io
  - Copier API key
  - Ajouter `ELEVENLABS_API_KEY` dans Vercel

- [ ] **S8.7** Configurer Resend (email)
  - Créer compte sur https://resend.com
  - Ajouter domaine `afrilaunch.ai` (vérifier DNS)
  - Copier API key
  - Ajouter `RESEND_API_KEY` + `EMAIL_FROM` dans Vercel

### Sprint 9 — Améliorations qualité (non bloquant)
- [ ] **S9.1** Activer `strict: true` dans `tsconfig.json`
- [ ] **S9.2** Câbler `hooks/use-stats.ts` aux vraies API
- [ ] **S9.3** Implémenter `hooks/use-config.ts`
- [ ] **S9.4** Supprimer `components/dashboard/header.tsx` (mort)
- [ ] **S9.5** Étoffer `app/about/page.tsx` (équipe, story, images)
- [ ] **S9.6** Créer articles `app/blog/page.tsx` (ou cacher le lien)
- [ ] **S9.7** Ajouter menu mobile hamburger dans `app/(dashboard)/layout.tsx`
- [ ] **S9.8** Wrapper `app/api-docs/page.tsx` en dark theme
- [ ] **S9.9** Migrer SHA256 → bcrypt (cost≥12) dans `lib/user-store.ts`
- [ ] **S9.10** Ajouter email verification + reset password
- [ ] **S9.11** Implémenter vrais OAuth flows Social (Meta Graph API, TikTok...)
- [ ] **S9.12** Refactorer fichiers >500 lignes (extraire sous-composants)
- [ ] **S9.13** Ajouter tests unitaires (vitest)
- [ ] **S9.14** Configurer Sentry pour error tracking prod
- [ ] **S9.15** Ajouter analytics (PostHog ou Vercel Analytics)

### Sprint 10 — Growth (post-launch)
- [ ] **S10.1** Lancer bêta privée 20 clients pilotes (J+7)
- [ ] **S10.2** Collecter feedback onboarding + first-run
- [ ] **S10.3** Itérer en 1 semaine selon feedback
- [ ] **S10.4** Lancement public (J+30)
- [ ] **S10.5** Campagne marketing (Instagram, WhatsApp groups)
- [ ] **S10.6** Programme de parrainage (déjà implémenté — activer)

---

## 📐 CONVENTIONS DE CODE

### Structure des fichiers
```
app/api/[module]/[action]/route.ts    → API route
app/(dashboard)/dashboard/[module]/page.tsx  → Page dashboard
lib/[module]-store.ts                  → Store serveur
components/[domain]/[component].tsx    → Composant UI
hooks/use-[feature].ts                → Hook React
```

### Nommage
- **API routes** : kebab-case (`/api/payment-manual/upload`)
- **Components** : PascalCase (`MobileMockup`, `PlansMarquee`)
- **Hooks** : camelCase préfixé `use` (`useDashboardData`)
- **Lib** : kebab-case avec suffixe `-store` (`brand-kit-store.ts`)

### Sécurité
- **Toujours** utiliser `requireUser(req)` ou `requireAdmin(req)` en début de route
- **Toujours** valider les inputs avec `lib/validators.ts`
- **Jamais** exposer les secrets dans les réponses API (utiliser `sanitizeForRead`)
- **Toujours** utiliser `credentials: 'include'` côté client

### Commits
```
feat: [description courte] — nouvelle fonctionnalité
fix: [description courte] — correction de bug
docs: [description courte] — documentation
refactor: [description courte] — refactor sans changement fonctionnel
```

---

## 🚀 DÉPLOIEMENT

### Build local
```bash
npm run build
npm run start  # Port 3000 par défaut
```

### Déploiement Vercel
1. Push sur `main` → Vercel auto-déploie
2. Vérifier le build dans Vercel dashboard
3. Tester la nouvelle version sur https://afrilaunchia.vercel.app

### Variables d'environnement Vercel
Voir `.env.production.example` pour la liste complète.

### Commandes utiles
```bash
# Build local
npm run build

# Start production
npm run start

# Type checking
npm run lint:types

# Tests unitaires
npm run test:unit

# Dev mode
npm run dev
```

---

## 📊 ÉTAT ACTUEL (3 septembre 2026)

| Indicateur | Valeur |
|---|---|
| Build status | ✅ OK (0 erreurs TypeScript) |
| Pages fonctionnelles | 42/42 |
| API routes | 83 |
| Lignes de code | 41 887 |
| Commits | 18+ |
| Note globale | 82/100 |
| Prêt pour bêta | ✅ Oui (après Sprint 8) |

---

*Document maintenu à jour à chaque modification du code.*
