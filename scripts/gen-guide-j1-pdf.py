#!/usr/bin/env python3
"""
AfriLaunch AI — Guide J+1 : Rotation clés API + Supabase
PDF imprimable avec check-list step-by-step.
"""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_LEFT, TA_JUSTIFY, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak,
    HRFlowable, KeepTogether,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

FONT_DIR = '/usr/share/fonts/truetype'
pdfmetrics.registerFont(TTFont('NotoSerifSC',      f'{FONT_DIR}/noto-serif-sc/NotoSerifSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('NotoSerifSC-Bold', f'{FONT_DIR}/noto-serif-sc/NotoSerifSC-Bold.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans',       f'{FONT_DIR}/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans-Bold',  f'{FONT_DIR}/dejavu/DejaVuSans-Bold.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuMono',       f'{FONT_DIR}/dejavu/DejaVuSansMono.ttf'))
registerFontFamily('NotoSerifSC', normal='NotoSerifSC', bold='NotoSerifSC-Bold')

BODY = 'NotoSerifSC'
BODY_BOLD = 'NotoSerifSC-Bold'
MONO = 'DejaVuMono'

# Palette AfriLaunch
HEADER_FILL = colors.HexColor('#1E1B4B')
COVER_BLOCK = colors.HexColor('#312E81')
ACCENT = colors.HexColor('#6366F1')
ACCENT_2 = colors.HexColor('#A855F7')
ACCENT_3 = colors.HexColor('#22D3EE')
TEXT_PRIMARY = colors.HexColor('#0F172A')
TEXT_MUTED = colors.HexColor('#64748B')
BORDER = colors.HexColor('#CBD5E1')
CARD_BG = colors.HexColor('#F0F2F8')
SEM_SUCCESS = colors.HexColor('#16A34A')
SEM_WARNING = colors.HexColor('#D97706')
SEM_ERROR = colors.HexColor('#DC2626')

def st(name, **kw):
    base = dict(fontName=BODY, fontSize=10, leading=15, textColor=TEXT_PRIMARY, spaceAfter=4)
    base.update(kw)
    return ParagraphStyle(name, **base)

s_h1 = st('h1', fontName=BODY_BOLD, fontSize=18, leading=24, textColor=HEADER_FILL, spaceBefore=14, spaceAfter=8)
s_h2 = st('h2', fontName=BODY_BOLD, fontSize=13, leading=18, textColor=COVER_BLOCK, spaceBefore=10, spaceAfter=5)
s_h3 = st('h3', fontName=BODY_BOLD, fontSize=11, leading=15, textColor=ACCENT, spaceBefore=8, spaceAfter=3)
s_body = st('body', alignment=TA_JUSTIFY)
s_muted = st('muted', fontSize=9, leading=13, textColor=TEXT_MUTED)
s_caption = st('caption', fontSize=8, leading=11, textColor=TEXT_MUTED)
s_table = st('table', fontSize=9, leading=12, alignment=TA_LEFT)
s_table_bold = st('table_bold', fontName=BODY_BOLD, fontSize=9, leading=12)
s_mono = st('mono', fontName=MONO, fontSize=8.5, leading=12, textColor=COVER_BLOCK)
s_callout = st('callout', fontSize=9.5, leading=14, textColor=COVER_BLOCK)

def p(text, style=s_body):
    return Paragraph(text, style)

def h1(text): return p(text, s_h1)
def h2(text): return p(text, s_h2)
def h3(text): return p(text, s_h3)

def callout(text, color=ACCENT, bg=CARD_BG):
    t = Table([[Paragraph(text, s_callout)]], colWidths=[170*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LINEBEFORE', (0,0), (0,-1), 3, color),
    ]))
    return t

def step_table(steps):
    """Tableau check-list avec cases à cocher."""
    data = [['☐', 'Étape', 'Détail']]
    for i, (title, detail) in enumerate(steps, 1):
        data.append([f'☐', f'<b>{i}. {title}</b>', detail])
    t = Table(data, colWidths=[10*mm, 55*mm, 105*mm])
    t.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('GRID', (0,0), (-1,-1), 0.3, BORDER),
        ('BACKGROUND', (0,0), (-1,0), HEADER_FILL),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), BODY_BOLD),
        ('FONTSIZE', (0,0), (-1,0), 10),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
        ('FONTSIZE', (0,1), (0,-1), 14),
        ('TEXTCOLOR', (0,1), (0,-1), ACCENT),
        ('FONTNAME', (1,1), (-1,-1), BODY),
        ('FONTSIZE', (1,1), (-1,-1), 9),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8F9FC')]),
    ]))
    return t

# ─── Cover ───────────────────────────────────────────────────────
def draw_cover(canvas, doc):
    c = canvas
    W, H = A4
    steps = 60
    for i in range(steps):
        ratio = i / steps
        r = int(30 + (76 - 30) * ratio)
        g = int(27 + (29 - 27) * ratio)
        b = int(75 + (145 - 75) * ratio)
        c.setFillColorRGB(r/255, g/255, b/255)
        c.rect(0, H - (i+1)*(H/steps), W, H/steps + 1, fill=1, stroke=0)
    c.setFillColor(ACCENT_3); c.rect(0, H - 6, W, 6, fill=1, stroke=0)
    c.setFillColor(ACCENT_2); c.rect(0, 0, W, 6, fill=1, stroke=0)
    # Pixels décoratifs
    c.setFillColor(colors.HexColor('#22D3EE')); c.rect(W - 80, H - 200, 12, 12, fill=1, stroke=0)
    c.setFillColor(colors.HexColor('#A855F7')); c.rect(W - 60, H - 180, 8, 8, fill=1, stroke=0)
    c.setFillColor(colors.HexColor('#6366F1')); c.rect(W - 100, H - 160, 10, 10, fill=1, stroke=0)
    # Brand
    c.setFillColor(colors.white); c.setFont(BODY_BOLD, 11)
    c.drawString(40, H - 80, 'AFRILAUNCH AI')
    c.setFillColor(colors.HexColor('#A5B4FC')); c.setFont(BODY, 9)
    c.drawString(40, H - 96, 'GUIDE J+1  ·  ROTATION CLES API  ·  SUPABASE')
    # Title
    c.setFillColor(colors.white); c.setFont(BODY_BOLD, 30)
    c.drawString(40, H - 200, 'Guide de mise')
    c.drawString(40, H - 238, 'en production')
    c.setFillColor(colors.HexColor('#C7D2FE')); c.setFont(BODY, 13)
    c.drawString(40, H - 275, 'Rotation des 4 cles API IA + creation')
    c.drawString(40, H - 295, 'du projet Supabase pour la persistance.')
    # Duration block
    c.setFillColor(colors.HexColor('#A5B4FC')); c.setFont(BODY_BOLD, 10)
    c.drawString(40, H - 360, 'DUREE ESTIMEE')
    c.setFillColor(colors.white); c.setFont(BODY_BOLD, 26)
    c.drawString(40, H - 390, '2 heures')
    c.setFillColor(colors.HexColor('#A5B4FC')); c.setFont(BODY, 9)
    c.drawString(40, H - 405, '30 min rotation cles + 1h Supabase + 30 min verif')
    # Footer
    c.setFillColor(colors.HexColor('#94A3B8')); c.setFont(BODY, 9)
    c.drawString(40, 40, 'Jour 1 du plan de lancement  ·  Version 1.0')
    c.drawString(40, 26, 'AfriLaunch AI - Direction technique')

def on_page(canvas, doc):
    canvas.saveState()
    W, H = A4
    canvas.setFillColor(TEXT_MUTED); canvas.setFont(BODY, 8)
    canvas.drawString(20*mm, H - 12*mm, 'AfriLaunch AI — Guide J+1')
    canvas.drawRightString(W - 20*mm, H - 12*mm, '31/08/2026')
    canvas.setStrokeColor(BORDER); canvas.setLineWidth(0.4)
    canvas.line(20*mm, H - 14*mm, W - 20*mm, H - 14*mm)
    canvas.setFont(BODY, 8); canvas.setFillColor(TEXT_MUTED)
    canvas.drawString(20*mm, 12*mm, 'Confidentiel - Interne')
    canvas.drawRightString(W - 20*mm, 12*mm, f'Page {doc.page}')
    canvas.line(20*mm, 14*mm, W - 20*mm, 14*mm)
    canvas.restoreState()

# ─── Story ───────────────────────────────────────────────────────
story = []
story.append(Spacer(1, 1))
story.append(PageBreak())

# ════════════════════════════════════════════════════════════════
# PARTIE 1 — ROTATION DES CLÉS API
# ════════════════════════════════════════════════════════════════
story.append(h1('Partie 1 — Rotation des 4 cles API IA'))

story.append(p(
    "<b>Pourquoi rotate les cles ?</b> Les 4 cles API IA actuelles "
    "(Cerebras, OpenRouter, Mistral, Groq) ont ete commitees en clair dans "
    "l'historique git du repository GitHub. N'importe qui avec acces au repo "
    "(public ou compromise) peut les extraire et les utiliser a tes frais. "
    "La rotation = revoke les anciennes cles + creer de nouvelles cles + "
    "mettre a jour les variables d'environnement. Cette operation est "
    "<b>obligatoire avant le lancement</b>."
))
story.append(Spacer(1, 6))

story.append(callout(
    "<b>Ordre recommande :</b> Cerebras (30 sec) → OpenRouter (1 min) → "
    "Mistral (1 min) → Groq (1 min). Total rotation : ~5 min. Ajout des "
    "nouvelles cles dans Vercel : ~5 min. Test de fonctionnement : 10 min.",
    color=SEM_WARNING, bg=colors.HexColor('#FFFBEB')
))
story.append(Spacer(1, 8))

# ─── 1.1 Cerebras ───────────────────────────────────────────────
story.append(h2('1.1 Cerebras (ultra-rapide, 1000+ tok/s)'))
story.append(p(
    "Cerebras est le provider le plus rapide (1000+ tokens/seconde sur "
    "Llama 3.1 8B). Il sert de fallback ultra-rapide pour le plan Starter. "
    "Cle actuelle compromise : <font face='DejaVuMono' size='8'>csk-63wkc28r...</font>"
))
story.append(step_table([
    ('Aller sur cerebras.ai',
     "Ouvre <b>https://cerebras.ai</b> dans ton navigateur et connecte-toi avec ton compte."),
    ('Dashboard → API Keys',
     "Clique sur ton avatar en haut a droite → <b>API Keys</b> (ou vas directement sur "
     "<font face='DejaVuMono' size='8'>https://inference.cerebras.ai/dashboard/api-keys</font>)."),
    ('Revoke l\'ancienne cle',
     "Trouve la cle qui commence par <font face='DejaVuMono' size='8'>csk-63wkc28r...</font> "
     "→ clique sur <b>Delete</b> ou <b>Revoke</b>. Confirme. L'ancienne cle ne marche plus "
     "immediatement."),
    ('Creer une nouvelle cle',
     "Clique sur <b>+ Create new API key</b> → nomme-la <b>AfriLaunch-Prod-2026</b> "
     "(pour l'identifier) → copie la valeur qui commence par <font face='DejaVuMono' size='8'>csk-</font>."),
    ('Stocker la nouvelle cle',
     "Colle la nouvelle cle dans un gestionnaire de mots de passe (1Password, Bitwarden, "
     "Keepass). <b>Ne la commit jamais dans git.</b> On l'ajoutera a Vercel plus tard."),
]))
story.append(Spacer(1, 6))

# ─── 1.2 OpenRouter ────────────────────────────────────────────
story.append(h2('1.2 OpenRouter (acces a GPT-5, Claude, Mistral, Llama)'))
story.append(p(
    "OpenRouter est le provider principal pour les plans Pro et Enterprise "
    "(Claude Haiku 4.5 et GPT-5). Il faut un compte avec credits payants "
    "(minimum 5 $) pour utiliser les modeles premium. Cle actuelle compromise : "
    "<font face='DejaVuMono' size='8'>sk-or-v1-e991077c...</font>"
))
story.append(step_table([
    ('Aller sur openrouter.ai',
     "Ouvre <b>https://openrouter.ai</b> et connecte-toi. Si tu n'as pas de compte, "
     "cree-en un avec ton email."),
    ('Credits — ajouter des fonds',
     "Va sur <b>Credits</b> → <b>Add credits</b> → ajoute au moins <b>10 $</b> "
     "(Stripe ou carte). Sans credits, seuls les modeles ':free' marchent."),
    ('Keys — revoke l\'ancienne',
     "Va sur <b>Keys</b> (<font face='DejaVuMono' size='8'>https://openrouter.ai/keys</font>) "
     "→ trouve <font face='DejaVuMono' size='8'>sk-or-v1-e991077c...</font> → clique "
     "<b>Revoke</b>. L'ancienne cle ne marche plus."),
    ('Creer une nouvelle cle',
     "Clique sur <b>Create Key</b> → nomme-la <b>afrilaunch-prod</b> → "
     "fixe un plafond de credits (ex: 50 $/mois) pour eviter les abus → "
     "copie la valeur <font face='DejaVuMono' size='8'>sk-or-v1-...</font>."),
    ('Stocker la nouvelle cle',
     "Colle dans ton gestionnaire de mots de passe. <b>Ne jamais committer.</b>"),
]))
story.append(Spacer(1, 6))

# ─── 1.3 Mistral ──────────────────────────────────────────────
story.append(h2('1.3 Mistral (FR-native, RGPD, Business plan)'))
story.append(p(
    "Mistral AI est un provider francais (RGPD-compliant) ideal pour le "
    "plan Business. Leur modele Mistral Large 2 est excellent en francais. "
    "Cle actuelle compromise : <font face='DejaVuMono' size='8'>nmob0QUV...</font>"
))
story.append(step_table([
    ('Aller sur console.mistral.ai',
     "Ouvre <b>https://console.mistral.ai</b> et connecte-toi. Cree un compte "
     "si besoin (email + verification)."),
    ('Billing — ajouter des fonds',
     "Va sur <b>Billing</b> → <b>Add payment method</b> → ajoute une carte "
     "→ ajoute au moins <b>10 EUR</b> de credits. Sans credits, l'API "
     "retourne 402 Payment Required."),
    ('API Keys — revoke l\'ancienne',
     "Va sur <b>API Keys</b> → trouve la cle qui commence par "
     "<font face='DejaVuMono' size='8'>nmob0QUV...</font> → clique <b>Delete</b>."),
    ('Creer une nouvelle cle',
     "Clique sur <b>+ Create new API key</b> → nomme-la <b>afrilaunch-prod</b> → "
     "copie la valeur (chaine de 32 caracteres)."),
    ('Stocker la nouvelle cle',
     "Colle dans ton gestionnaire de mots de passe. <b>Ne jamais committer.</b>"),
]))
story.append(Spacer(1, 6))

# ─── 1.4 Groq ─────────────────────────────────────────────────
story.append(h2('1.4 Groq (ultra-rapide, 300 tok/s, Starter plan)'))
story.append(p(
    "Groq est le provider principal pour le plan Starter. Leur Llama 3.3 70B "
    "est ultra-rapide (300 tokens/sec) et tres peu cher ($0.59/$0.79 par "
    "million de tokens). Cle actuelle compromise : "
    "<font face='DejaVuMono' size='8'>gsk_hd8B5xXUVrBw...</font>"
))
story.append(step_table([
    ('Aller sur console.groq.com',
     "Ouvre <b>https://console.groq.com</b> et connecte-toi. Cree un compte "
     "si besoin (email + verification)."),
    ('API Keys — revoke l\'ancienne',
     "Va sur <b>API Keys</b> (<font face='DejaVuMono' size='8'>https://console.groq.com/keys</font>) "
     "→ trouve <font face='DejaVuMono' size='8'>gsk_hd8B5xXUVrBw...</font> → "
     "clique sur l'icône poubelle → confirme."),
    ('Creer une nouvelle cle',
     "Clique sur <b>Create API Key</b> → nomme-la <b>afrilaunch-prod</b> → "
     "copie la valeur <font face='DejaVuMono' size='8'>gsk_...</font>."),
    ('Stocker la nouvelle cle',
     "Colle dans ton gestionnaire de mots de passe. <b>Ne jamais committer.</b>"),
    ('Verifier les limites',
     "Groq free tier : 14 400 requetes/jour + 6 000 tokens/min. Pour la beta "
     "privee (20-50 clients), c'est suffisant. Pour scale, il faudra un plan payant."),
]))
story.append(Spacer(1, 10))

# ─── 1.5 Ajout dans Vercel ────────────────────────────────────
story.append(h2('1.5 Ajouter les nouvelles cles dans Vercel'))
story.append(p(
    "Une fois les 4 nouvelles cles recuperees, il faut les ajouter dans les "
    "variables d'environnement du projet Vercel (ou de ton hebergeur). "
    "C'est obligatoire : sans ca, l'app ne peut pas appeler les LLM."
))
story.append(step_table([
    ('Aller sur vercel.com',
     "Ouvre <b>https://vercel.com</b> → connecte-toi → clique sur ton projet "
     "<b>AfriLaunch-AI</b>."),
    ('Settings → Environment Variables',
     "Onglet <b>Settings</b> → <b>Environment Variables</b> dans le menu de gauche."),
    ('Ajouter CEREBRAS_API_KEY',
     "Clique <b>+ Add New</b> → Key: <font face='DejaVuMono' size='8'>CEREBRAS_API_KEY</font> → "
     "Value: colle la nouvelle cle Cerebras → coche <b>Production</b>, <b>Preview</b>, "
     "<b>Development</b> → <b>Save</b>."),
    ('Ajouter OPENROUTER_API_KEY',
     "Meme procedure → Key: <font face='DejaVuMono' size='8'>OPENROUTER_API_KEY</font> → "
     "Value: colle la nouvelle cle OpenRouter → 3 environnements coches → <b>Save</b>."),
    ('Ajouter MISTRAL_API_KEY',
     "Meme procedure → Key: <font face='DejaVuMono' size='8'>MISTRAL_API_KEY</font> → "
     "Value: colle la nouvelle cle Mistral → 3 environnements → <b>Save</b>."),
    ('Ajouter GROQ_API_KEY',
     "Meme procedure → Key: <font face='DejaVuMono' size='8'>GROQ_API_KEY</font> → "
     "Value: colle la nouvelle cle Groq → 3 environnements → <b>Save</b>."),
    ('Redeploy',
     "Va sur <b>Deployments</b> → clique sur le menu ⋯ du dernier deploy → "
     "<b>Redeploy</b> → confirme. L'app redemarre avec les nouvelles cles."),
]))
story.append(Spacer(1, 6))

story.append(callout(
    "<b>Verifier :</b> apres le redeploy, ouvre <b>https://afrilaunch.ai/admin/ai</b> "
    "(connecte-toi en admin) → les 4 providers doivent etre <b>Enabled: true, API Key: true</b>. "
    "Clique sur <b>Test</b> a cote de chaque provider pour verifier qu'ils repondent.",
    color=SEM_SUCCESS, bg=colors.HexColor('#F0FDF4')
))

story.append(PageBreak())

# ════════════════════════════════════════════════════════════════
# PARTIE 2 — SUPABASE
# ════════════════════════════════════════════════════════════════
story.append(h1('Partie 2 — Creation du projet Supabase'))

story.append(p(
    "<b>Pourquoi Supabase ?</b> Actuellement, l'app stocke toutes les donnees "
    "(users, sessions, payments, config IA, brand kits, sites web, etc.) dans "
    "des fichiers JSON locaux. En developpement, ca marche. En production sur "
    "Vercel, le filesystem est <b>read-only</b> → chaque cold start efface "
    "toutes les donnees. Supabase fournit une base PostgreSQL managed avec "
    "une API REST gratuite (500 MB stockage + 50 000 lignes/mois en free tier)."
))
story.append(Spacer(1, 6))

story.append(callout(
    "<b>Plan recommande :</b> Free tier pour la beta (suffisant pour 100 users). "
    "Passe au Pro plan (25 $/mois) quand tu depasses 500 MB ou 50 000 requetes/mois. "
    "Le free tier n'a pas de limite de temps — c'est gratuit pour toujours.",
    color=ACCENT, bg=colors.HexColor('#EEF2FF')
))
story.append(Spacer(1, 8))

# ─── 2.1 Création du projet ───────────────────────────────────
story.append(h2('2.1 Creer le projet Supabase'))
story.append(step_table([
    ('Aller sur supabase.com',
     "Ouvre <b>https://supabase.com</b> → clique sur <b>Start your project</b> → "
     "connecte-toi avec GitHub (recommande) ou email."),
    ('New Project',
     "Clique sur <b>+ New Project</b> en haut a droite."),
    ('Configurer le projet',
     "<b>Organization:</b> ton organisation (ou cree-en une)<br/>"
     "<b>Project Name:</b> <font face='DejaVuMono' size='8'>afrilaunch-ai</font><br/>"
     "<b>Database Password:</b> genere un mot de passe fort (32 caracteres) → "
     "<b>stocke-le dans ton gestionnaire de mots de passe</b><br/>"
     "<b>Region:</b> <b>Frankfurt (eu-central-1)</b> (le plus proche de l'Afrique de l'Ouest)<br/>"
     "<b>Plan:</b> <b>Free</b>"),
    ('Attendre le provisionnement',
     "Clique sur <b>Create new project</b> → patiente ~2 minutes (Supabase provisionne "
     "la base). Tu recevras un email quand c'est pret."),
    ('Recuperer les cles',
     "Une fois le projet pret, va sur <b>Project Settings</b> (icône engrenage) → "
     "<b>API</b>. Note les 2 valeurs suivantes :<br/>"
     "<b>Project URL</b> (format: <font face='DejaVuMono' size='8'>https://xxx.supabase.co</font>)<br/>"
     "<b>service_role</b> secret (clique sur <b>Reveal</b> pour l'afficher)"),
]))
story.append(Spacer(1, 6))

# ─── 2.2 Exécution du schema ──────────────────────────────────
story.append(h2('2.2 Executer le schema SQL'))
story.append(p(
    "Le fichier <b>supabase-schema.sql</b> est deja present a la racine du projet. "
    "Il cree la table <font face='DejaVuMono' size='8'>kv_store</font> qui stocke "
    "toutes les donnees de l'app (users, sessions, config, etc.) sous forme de "
    "paires key-value JSONB. La securite RLS (Row-Level Security) est activee "
    "pour bloquer tout acces public — seul le service_role (server-side) peut "
    "lire/ecrire."
))
story.append(step_table([
    ('Ouvrir le SQL Editor',
     "Dans Supabase, clique sur <b>SQL Editor</b> dans le menu de gauche "
     "(icône <b>&lt;/&gt;</b>)."),
    ('Creer une nouvelle query',
     "Clique sur <b>+ New query</b> en haut a droite."),
    ('Copier le schema',
     "Ouvre le fichier <b>supabase-schema.sql</b> a la racine du projet AfriLaunch AI "
     "→ copie tout le contenu (26 lignes)."),
    ('Coller dans Supabase',
     "Colle le contenu dans l'editeur SQL de Supabase."),
    ('Executer',
     "Clique sur <b>Run</b> (bouton vert en bas) ou fais <b>Ctrl+Enter</b>. "
     "Tu dois voir le message <b>Schema created successfully!</b> dans l'onglet Results."),
    ('Verifier la table',
     "Va sur <b>Table Editor</b> (icône table) → tu dois voir la table "
     "<b>kv_store</b> avec les colonnes <font face='DejaVuMono' size='8'>key</font>, "
     "<font face='DejaVuMono' size='8'>value</font>, <font face='DejaVuMono' size='8'>updated_at</font>."),
]))
story.append(Spacer(1, 6))

# ─── 2.3 Ajout dans Vercel ────────────────────────────────────
story.append(h2('2.3 Ajouter les cles Supabase dans Vercel'))
story.append(p(
    "Maintenant que Supabase est pret, il faut dire a l'app d'utiliser cette "
    "base au lieu des fichiers JSON locaux. Ca se fait via 2 variables "
    "d'environnement."
))
story.append(step_table([
    ('Retourner sur Vercel',
     "Ouvre <b>https://vercel.com</b> → projet <b>AfriLaunch-AI</b> → "
     "<b>Settings</b> → <b>Environment Variables</b>."),
    ('Ajouter NEXT_PUBLIC_SUPABASE_URL',
     "<b>+ Add New</b> → Key: <font face='DejaVuMono' size='8'>NEXT_PUBLIC_SUPABASE_URL</font><br/>"
     "Value: colle le <b>Project URL</b> de Supabase "
     "(<font face='DejaVuMono' size='8'>https://xxx.supabase.co</font>)<br/>"
     "Coche Production + Preview + Development → <b>Save</b>."),
    ('Ajouter SUPABASE_SERVICE_ROLE_KEY',
     "<b>+ Add New</b> → Key: <font face='DejaVuMono' size='8'>SUPABASE_SERVICE_ROLE_KEY</font><br/>"
     "Value: colle la cle <b>service_role</b> de Supabase (la longue, pas la anon)<br/>"
     "Coche Production + Preview + Development → <b>Save</b>."),
    ('Redeploy',
     "<b>Deployments</b> → menu ⋯ du dernier deploy → <b>Redeploy</b> → confirme."),
]))
story.append(Spacer(1, 6))

# ─── 2.4 Vérification ────────────────────────────────────────
story.append(h2('2.4 Verifier que Supabase fonctionne'))
story.append(p(
    "Apres le redeploy, il faut verifier que l'app ecrit bien dans Supabase "
    "et plus dans les fichiers JSON locaux. Voici 3 tests simples :"
))
story.append(step_table([
    ('Test 1 — Inscription user',
     "Ouvre <b>https://afrilaunch.ai/register</b> → cree un compte test "
     "(email: <font face='DejaVuMono' size='8'>supabase-test@test.com</font>, "
     "password: <font face='DejaVuMono' size='8'>Test1234!</font>) → "
     "tu dois recevoir un toast <b>Compte cree!</b>."),
    ('Test 2 — Verifier dans Supabase',
     "Retourne sur Supabase → <b>Table Editor</b> → <b>kv_store</b> → "
     "tu dois voir une ligne avec <font face='DejaVuMono' size='8'>key=users</font>. "
     "Clique dessus → dans la colonne value, tu dois voir ton user test."),
    ('Test 3 — Verifier la persistence',
     "Attend 5 minutes (laisse l'app faire un cold start) → reconnecte-toi "
     "avec le meme user → tu dois etre connecte. Si tu ne l'es pas, c'est "
     "que Supabase n'est pas bien configure (verifie les 2 variables d'env)."),
]))
story.append(Spacer(1, 8))

story.append(callout(
    "<b>Si ca ne marche pas :</b> verifie que (1) les 2 variables Supabase sont "
    "bien dans Vercel avec les 3 environnements coches, (2) tu as bien colle la "
    "cle <b>service_role</b> (pas la anon), (3) tu as redeploye apres avoir ajoute "
    "les variables. Si le probleme persiste, regarde les logs Vercel "
    "(Functions → /api/auth/register → Logs).",
    color=SEM_WARNING, bg=colors.HexColor('#FFFBEB')
))

story.append(Spacer(1, 12))
story.append(HRFlowable(width='100%', thickness=0.5, color=BORDER))
story.append(Spacer(1, 6))

# ─── Récap ────────────────────────────────────────────────────
story.append(h1('Recapitulatif J+1'))
story.append(p(
    "A la fin de cette journee, tu dois avoir :"
))
recap = [
    ['☐', 'Action', 'Verificateur'],
    ['☐', '4 anciennes cles API revoquees', '/admin/ai → les 4 providers en erreur 401'],
    ['☐', '4 nouvelles cles API creees', 'Stockees dans gestionnaire mots de passe'],
    ['☐', '4 cles ajoutees dans Vercel', 'Environment Variables → 4 entrees visible'],
    ['☐', 'Redeploy effectue', 'Deployments → nouveau deploy en vert'],
    ['☐', 'Test /admin/ai OK', 'Les 4 providers Enabled: true, API Key: true'],
    ['☐', 'Projet Supabase cree', 'https://app.supabase.com → projet visible'],
    ['☐', 'Schema SQL execute', 'Table kv_store visible dans Table Editor'],
    ['☐', '2 vars Supabase dans Vercel', 'NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY'],
    ['☐', 'Redeploy final effectue', 'Deployments → nouveau deploy en vert'],
    ['☐', 'Test inscription user OK', 'User visible dans Supabase > kv_store > users'],
    ['☐', 'Test persistence OK', 'Reconnexion apres cold start fonctionne'],
]
recap_t = Table(recap, colWidths=[10*mm, 80*mm, 80*mm])
recap_t.setStyle(TableStyle([
    ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ('LEFTPADDING', (0,0), (-1,-1), 5),
    ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ('TOPPADDING', (0,0), (-1,-1), 5),
    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ('GRID', (0,0), (-1,-1), 0.3, BORDER),
    ('BACKGROUND', (0,0), (-1,0), HEADER_FILL),
    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
    ('FONTNAME', (0,0), (-1,0), BODY_BOLD),
    ('FONTSIZE', (0,0), (-1,0), 10),
    ('ALIGN', (0,0), (0,-1), 'CENTER'),
    ('FONTSIZE', (0,1), (0,-1), 14),
    ('TEXTCOLOR', (0,1), (0,-1), SEM_SUCCESS),
    ('FONTNAME', (1,1), (-1,-1), BODY),
    ('FONTSIZE', (1,1), (-1,-1), 9.5),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8F9FC')]),
]))
story.append(recap_t)
story.append(Spacer(1, 10))

story.append(callout(
    "<b>Prochaine etape (J+2) :</b> Activer Flutterwave sandbox, tester le flux "
    "paiement complet (creation session → paiement → webhook → fulfillment), "
    "puis passer en production avec de vraies cles. Duree estimee : 2 heures.",
    color=ACCENT_2, bg=colors.HexColor('#FAF5FF')
))

# ─── Build ──────────────────────────────────────────────────────
OUTPUT = '/home/z/my-project/download/guide-j1-rotation-supabase.pdf'
doc = SimpleDocTemplate(
    OUTPUT, pagesize=A4,
    leftMargin=20*mm, rightMargin=20*mm,
    topMargin=18*mm, bottomMargin=18*mm,
    title='AfriLaunch AI - Guide J+1 Rotation cles API + Supabase',
    author='AfriLaunch AI',
    subject='Guide de mise en production - Jour 1',
    creator='AfriLaunch AI - Direction Technique',
)
doc.build(story, onFirstPage=draw_cover, onLaterPages=on_page)
print(f'✓ PDF generated: {OUTPUT}')
print(f'  Size: {os.path.getsize(OUTPUT) // 1024} KB')
