# AfriLaunch AI — Checklist de Configuration Complète

Ce document liste **toutes les clés API et configurations** nécessaires pour que l'application AfriLaunch AI soit **100% opérationnelle**.

- **URL production** : https://afrilaunchia.vercel.app
- **Repo GitHub** : https://github.com/alljob367-cyber/AfriLaunch-AI
- **Page admin** : https://afrilaunchia.vercel.app/admin/login
  - Email : `admin@albermon.com`
  - Mot de passe : `Albermon2026!`

---

## 🚦 État actuel (testé le 28/08/2025)

| Composant | État | Notes |
|---|---|---|
| OpenRouter | ✅ Fonctionne | Clé active, `minimax/minimax-m3:free` testée OK avec streaming |
| Mistral | ⏳ À configurer | Endpoint joignable, clé à obtenir |
| Groq | ❌ Clé invalide | Clé testée = 403 Forbidden — en générer une nouvelle |
| Supabase | ✅ Fonctionne | kv_store persistant |
| Vercel | ✅ Fonctionne | Auto-deploy depuis GitHub main |
| Twilio WhatsApp | ⏳ Sandbox | +1 415 523 8886, code "join question-drive" |
| Telegram | ⏳ À configurer | Token bot à créer via @BotFather |
| Stripe | ❌ Non configuré | Paiements CB internationaux |
| Flutterwave | ❌ Non configuré | Paiements Afrique (Mobile Money) |
| SMTP Email | ❌ Non configuré | Pour notifications |

---

## 🔑 1. Providers IA (OBLIGATOIRE — au moins 1)

### OpenRouter (déjà configuré ✅)
- **Console** : https://openrouter.ai/keys
- **Clé actuelle** : `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`
- **Plan** : Free tier (0$) — 1000 req/jour sur modèles `:free`
- **Modèle utilisé** : `minimax/minimax-m3:free` (testé OK avec streaming)
- **Bonus recommandé** : Déposer 10$ (jamais consommé car modèles `:free` sont gratuits) → débloque 1000 req/jour au lieu de 50
- **Admin → AI** : `/admin/ai` → section « OpenRouter » → coller la clé + activer

### Groq (HAUTEMENT RECOMMANDÉ — vitesse 6x)
- **Console** : https://console.groq.com/keys
- **Plan** : Free tier (0$) — 30 req/min, ~43 200 req/jour
- **Modèle utilisé** : `llama-3.3-70b-versatile`
- **Clé à générer** : Create API Key → copier `gsk_...`
- **⚠️ Test dernière clé** : la clé fournie précédemment retourne 403 Forbidden (révoquée) — en générer une nouvelle
- **Admin → AI** : `/admin/ai` → section « Groq » → coller la clé + activer

### Mistral (RECOMMANDÉ — fallback francophone)
- **Console** : https://console.mistral.ai/api-keys
- **Plan** : Free tier (0$) — ~500 req/jour
- **Modèle utilisé** : `mistral-small-latest` (chat) / `mistral-large-latest` (qualité)
- **Clé à générer** : New API Key → copier `...`
- **Admin → AI** : `/admin/ai` → section « Mistral » → coller la clé + activer

**Capacité totale avec les 3 providers** : ~44 700 req/jour ≈ **894 utilisateurs Starter actifs/jour**

---

## 💬 2. WhatsApp Business (Twilio)

### Twilio (déjà configuré en sandbox ⏳)
- **Console** : https://console.twilio.com
- **Account SID** : à récupérer sur la console
- **Auth Token** : à récupérer sur la console
- **Numéro WhatsApp sandbox** : +1 415 523 8886
- **Code d'activation** : envoyer "join question-drive" au numéro sandbox
- **Webhook à configurer** :
  - URL : `https://afrilaunchia.vercel.app/api/whatsapp-agent/webhook`
  - Méthode : POST
  - Quand : "When a message comes in"
- **Admin → WhatsApp Agent** : `/admin/whatsapp-agent` → coller SID + token + activer

---

## 📨 3. Telegram Bot

### Créer un bot via @BotFather
1. Ouvrir Telegram → chercher `@BotFather`
2. Envoyer `/newbot`
3. Choisir un nom (ex. "AfriLaunch AI Bot")
4. Choisir un username (ex. `AfriLaunchAI_bot` — doit finir par `_bot`)
5. **Copier le token** : `123456789:ABCdefGHIjklMNOpqrsTUVwxyz` (format)
6. Définir le webhook :
   ```
   curl -s "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://afrilaunchia.vercel.app/api/telegram/webhook"
   ```
7. **Admin → Telegram** : `/admin/telegram` → coller le token + activer

---

## 💳 4. Paiements

### Flutterwave (Mobile Money Afrique) — RECOMMANDÉ
- **Console** : https://dashboard.flutterwave.com/dashboard/settings/apis
- **Plan** : Commission 1.4% par transaction (pas d'abonnement)
- **Clés à récupérer** :
  - Public Key : `FLWPUBK-...`
  - Secret Key : `FLWSECK-...`
  - Webhook hash : à définir
- **Webhook à configurer** :
  - URL : `https://afrilaunchia.vercel.app/api/checkout/flutterwave-webhook`
- **Admin → Paiements** : `/admin/payments` → coller les clés + activer
- **Pays supportés** : Cameroun, Sénégal, Côte d'Ivoire, Nigeria, Ghana, Kenya, etc.

### Stripe (CB internationales) — OPTIONNEL
- **Console** : https://dashboard.stripe.com/apikeys
- **Plan** : 2.9% + 0.30$ par transaction
- **Clés à récupérer** :
  - Publishable key : `pk_live_...` ou `pk_test_...`
  - Secret key : `sk_live_...` ou `sk_test_...`
  - Webhook secret : `whsec_...`
- **Webhook à configurer** :
  - URL : `https://afrilaunchia.vercel.app/api/checkout/stripe-webhook`
  - Événements : `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted`
- **Admin → Paiements** : `/admin/payments` → coller les clés + activer

### Paiement manuel (Mobile Money Cameroun) — DÉJÀ ACTIF ✅
- MTN MoMo, Orange Money, Virement bancaire
- Upload de preuve (capture d'écran)
- Validation manuelle par l'admin dans `/admin/payments-manual`
- **Aucune clé à configurer** — fonctionne out of the box

---

## 📧 5. Email (SMTP) — OPTIONNEL mais recommandé

### Resend (recommandé, 3000 emails/mois gratuits)
- **Console** : https://resend.com/api-keys
- **Clé** : `re_...`
- **Domaine à vérifier** : ajouter les enregistrements DNS fournis
- **Admin → Email** : `/admin/email` → coller la clé + activer

### Alternatives
- **Brevo** (ex-Sendinblue) : https://app.brevo.com/settings/keys/api — 300 emails/jour gratuits
- **SendGrid** : https://app.sendgrid.com/settings/api_keys — 100 emails/jour gratuits

---

## 📱 6. Réseaux Sociaux (publication automatique)

### Facebook (Pages)
- **Console** : https://developers.facebook.com/apps
- **Créer une app** → type "Business"
- **Permissions** : `pages_manage_posts`, `pages_read_engagement`
- **Récupérer** :
  - Page Access Token (long-lived)
  - Page ID
- **Admin → Réseaux sociaux** : `/admin/social` → section Facebook → coller token + Page ID + activer

### Instagram (Business)
- **Nécessite** : un compte Instagram Business lié à une Page Facebook
- **Console** : same as Facebook (Graph API)
- **Récupérer** :
  - Instagram Business Account ID
  - Access Token (même que Facebook)
- **Admin → Réseaux sociaux** : `/admin/social` → section Instagram

### LinkedIn
- **Console** : https://www.linkedin.com/developers/apps
- **Créer une app** → récupérer Client ID + Client Secret
- **OAuth 2.0** : générer un Access Token
- **Admin → Réseaux sociaux** : `/admin/social` → section LinkedIn

### X (Twitter)
- **Console** : https://developer.x.com/en/portal/dashboard
- **Plan** : Free (limite 50 tweets/24h, 1 projet)
- **Récupérer** :
  - API Key : `xxx`
  - API Key Secret : `xxx`
  - Access Token : `xxx`
  - Access Token Secret : `xxx`
  - Bearer Token : `xxx`
- **Admin → Réseaux sociaux** : `/admin/social` → section X

### WhatsApp Cloud API ( OPTIONNEL — Twilio déjà configuré)
- **Console** : https://developers.facebook.com/apps
- **Créer une app** → type "Business" → ajouter WhatsApp
- **Récupérer** :
  - Phone Number ID
  - Access Token (system user)
- **Admin → Réseaux sociaux** : `/admin/social` → section WhatsApp

---

## 🗄️ 7. Base de données (Supabase) — DÉJÀ CONFIGURÉ ✅

- **URL projet** : `https://vrlloijhdjoevqbvyjvs.supabase.co`
- **anon key** : configurée dans les variables d'environnement Vercel
- **service_role** : configurée dans les variables d'environnement Vercel
- **Table** : `kv_store` (créée via `supabase-schema.sql`)
- **RLS** : activée, policies configurées

### Variables d'environnement Vercel (à vérifier)
Aller sur https://vercel.com/afrilaunchia → Settings → Environment Variables :
- `SUPABASE_URL` = `https://vrlloijhdjoevqbvyjvs.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = `eyJhbGci...` (clé service_role complète)
- `NODE_ENV` = `production`

---

## 🤖 8. Agents IA vocaux (ElevenLabs) — OPTIONNEL

### ElevenLabs (voix naturelles)
- **Console** : https://elevenlabs.io/app/settings/api-keys
- **Plan** : Free tier (10 000 caractères/mois)
- **Clé** : `sk_...`
- **Admin → AI** : `/admin/ai` → section ElevenLabs
- **⚠️ Note** : L'app utilise déjà Web Speech API (gratuit, illimité) comme alternative — ElevenLabs est optionnel pour une meilleure qualité vocale

---

## 📊 9. Analytics (OPTIONNEL)

### Vercel Analytics — DÉJÀ ACTIF ✅
- Auto-intégré au déploiement Vercel
- Visible sur https://vercel.com/afrilaunchia → Analytics

### Google Analytics 4
- **Console** : https://analytics.google.com
- **Measurement ID** : `G-XXXXXXX`
- **Admin → Général** : `/admin/general` → coller le Measurement ID

---

## ✅ Checklist finale (ordre de priorité)

### CRITIQUE (sans ça, l'app ne fonctionne pas)
- [ ] **OpenRouter** ✅ fait — clé active
- [ ] **Supabase** ✅ fait — KV store opérationnel
- [ ] **Vercel** ✅ fait — auto-deploy actif
- [ ] **Admin** ✅ fait — accessible via `/admin/login`

### HAUTE PRIORITÉ (recommandé pour production)
- [ ] **Groq** — générer nouvelle clé sur https://console.groq.com/keys (l'ancienne est révoquée)
- [ ] **Flutterwave** — pour paiements Mobile Money automatiques (Cameroun, Sénégal, CI, etc.)
- [ ] **Twilio WhatsApp** — passer de la sandbox au compte payant pour usage réel

### MOYENNE PRIORITÉ (pour fonctionnalités avancées)
- [ ] **Mistral** — fallback IA francophone (gratuit)
- [ ] **Telegram bot** — créer via @BotFather
- [ ] **Email SMTP** (Resend) — pour notifications
- [ ] **Facebook + Instagram Graph API** — pour publication automatique

### BASSE PRIORITÉ (nice-to-have)
- [ ] **Stripe** — pour clients hors Afrique (CB internationales)
- [ ] **LinkedIn API** — publication LinkedIn
- [ ] **X (Twitter) API** — publication Twitter
- [ ] **ElevenLabs** — voix IA de meilleure qualité (Web Speech API suffit pour démarrer)
- [ ] **Google Analytics 4** — analytics avancés

---

## 🛠️ Comment configurer chaque clé

1. **Se connecter à l'admin** : https://afrilaunchia.vercel.app/admin/login
   - Email : `admin@albermon.com`
   - Mot de passe : `Albermon2026!`

2. **Aller dans la section correspondante** :
   - `/admin/ai` → OpenRouter, Groq, Mistral, ElevenLabs
   - `/admin/social` → Facebook, Instagram, LinkedIn, X, WhatsApp Cloud
   - `/admin/payments` → Flutterwave, Stripe
   - `/admin/telegram` → Telegram bot token
   - `/admin/whatsapp-agent` → Twilio WhatsApp
   - `/admin/email` → SMTP / Resend
   - `/admin/general` → Google Analytics, autres

3. **Tester chaque provider** :
   - Bouton « Tester » à côté de chaque provider dans l'admin
   - Voir le panneau « Santé des providers » dans `/admin/ai` pour les IA

4. **Pour les webhooks** (Twilio, Stripe, Flutterwave, Telegram) :
   - URL à configurer dans la console du provider
   - Format : `https://afrilaunchia.vercel.app/api/<service>/<webhook>`

---

## 📈 Capacité estimée après configuration complète

| Configuration | Req/jour IA | Utilisateurs Starter actifs/jour |
|---|---|---|
| OpenRouter seul (actuel) | 1 000 | ~20 |
| + Groq | 44 200 | ~884 |
| + Mistral | 44 700 | ~894 |
| + Paid OpenRouter (10$) | 44 700 | ~894 |

**Cibles business** :
- 100 utilisateurs payants × 5 000 FCFA = 500 000 FCFA/mois (~833$)
- 500 utilisateurs payants × 5 000 FCFA = 2 500 000 FCFA/mois (~4 167$)

---

## 🆘 Support

- **Repo** : https://github.com/alljob367-cyber/AfriLaunch-AI
- **Worklog** : `worklog.md` à la racine du repo (historique complet des modifications)
- **Logs Vercel** : https://vercel.com/afrilaunchia → Logs
- **Supabase logs** : https://supabase.com/dashboard/project/vrlloijhdjoevqbvyjvs

Pour toute question technique, consulter le code source ou les commentaires dans les fichiers `lib/*.ts`.
