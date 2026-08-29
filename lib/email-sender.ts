// AfriLaunch AI — Best-effort email sender
// Supports Resend (preferred) + SendGrid + SMTP. Falls back to console.log
// if no provider is configured — alerts are still visible in Vercel Logs.

import { getConfig } from './config-store';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(payload: EmailPayload): Promise<{ ok: boolean; error?: string; provider?: string }> {
  const config = await getConfig();
  const email = config.email;

  if (email.provider === 'none' || !email.from) {
    // No provider configured — log to console (visible in Vercel Logs)
    console.warn('[EMAIL ALERT — no provider configured]', {
      to: payload.to,
      subject: payload.subject,
      text: (payload.text || payload.html).slice(0, 300),
    });
    return { ok: false, error: 'Aucun provider email configuré. Alerte loggée dans Vercel Logs.' };
  }

  // ── Resend ────────────────────────────────────────────────────────
  if (email.provider === 'resend' && email.resend.apiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${email.resend.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: email.from,
          to: payload.to,
          reply_to: email.replyTo || undefined,
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        return { ok: false, error: `Resend HTTP ${res.status}: ${errBody.slice(0, 200)}`, provider: 'resend' };
      }
      return { ok: true, provider: 'resend' };
    } catch (err) {
      return { ok: false, error: `Resend réseau: ${(err as Error).message}`, provider: 'resend' };
    }
  }

  // ── SendGrid ──────────────────────────────────────────────────────
  if (email.provider === 'sendgrid' && email.sendgrid.apiKey) {
    try {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${email.sendgrid.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: payload.to }] }],
          from: { email: email.from },
          reply_to: email.replyTo ? { email: email.replyTo } : undefined,
          subject: payload.subject,
          content: [
            { type: 'text/plain', value: payload.text || payload.html.replace(/<[^>]+>/g, '') },
            { type: 'text/html', value: payload.html },
          ],
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        return { ok: false, error: `SendGrid HTTP ${res.status}: ${errBody.slice(0, 200)}`, provider: 'sendgrid' };
      }
      return { ok: true, provider: 'sendgrid' };
    } catch (err) {
      return { ok: false, error: `SendGrid réseau: ${(err as Error).message}`, provider: 'sendgrid' };
    }
  }

  // ── SMTP ──────────────────────────────────────────────────────────
  // SMTP requires a running mail server — we can't easily call it from
  // Vercel serverless. Log + recommend Resend instead.
  if (email.provider === 'smtp') {
    console.warn('[EMAIL ALERT — SMTP not supported on serverless]', {
      to: payload.to,
      subject: payload.subject,
      text: (payload.text || payload.html).slice(0, 300),
    });
    return { ok: false, error: 'SMTP non supporté sur Vercel serverless. Configurez Resend dans /admin/email.', provider: 'smtp' };
  }

  return { ok: false, error: 'Provider email invalide' };
}
