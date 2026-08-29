// AfriLaunch AI — Server-side input validation helpers
// Lightweight (no external deps) validators for API routes.

export interface ValidationResult<T> {
  ok: boolean;
  value?: T;
  error?: string;
}

// ─── Email ────────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function validateEmail(email: unknown): ValidationResult<string> {
  if (typeof email !== 'string' || !email.trim()) {
    return { ok: false, error: 'Email requis' };
  }
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length > 320) {
    return { ok: false, error: 'Email trop long' };
  }
  if (!EMAIL_RE.test(trimmed)) {
    return { ok: false, error: 'Email invalide' };
  }
  return { ok: true, value: trimmed };
}

// ─── Password policy ─────────────────────────────────────────────────
// At least 8 chars, 1 uppercase, 1 lowercase, 1 digit.
export function validatePassword(password: unknown): ValidationResult<string> {
  if (typeof password !== 'string') {
    return { ok: false, error: 'Mot de passe requis' };
  }
  if (password.length < 8) {
    return { ok: false, error: 'Le mot de passe doit contenir au moins 8 caractères' };
  }
  if (password.length > 256) {
    return { ok: false, error: 'Mot de passe trop long (max 256 caractères)' };
  }
  if (!/[A-Z]/.test(password)) {
    return { ok: false, error: 'Le mot de passe doit contenir au moins une majuscule' };
  }
  if (!/[a-z]/.test(password)) {
    return { ok: false, error: 'Le mot de passe doit contenir au moins une minuscule' };
  }
  if (!/\d/.test(password)) {
    return { ok: false, error: 'Le mot de passe doit contenir au moins un chiffre' };
  }
  return { ok: true, value: password };
}

// ─── First name ──────────────────────────────────────────────────────
export function validateFirstName(name: unknown): ValidationResult<string> {
  if (typeof name !== 'string' || !name.trim()) {
    return { ok: false, error: 'Prénom requis' };
  }
  const trimmed = name.trim().slice(0, 80);
  if (trimmed.length < 2) {
    return { ok: false, error: 'Le prénom doit contenir au moins 2 caractères' };
  }
  return { ok: true, value: trimmed };
}

// ─── Plan ID ─────────────────────────────────────────────────────────
import { PLANS, CREDIT_PACKS, type PlanId } from './user-types';

export function validatePlanId(id: unknown): ValidationResult<PlanId> {
  if (typeof id !== 'string' || !(id in PLANS)) {
    return { ok: false, error: `Plan invalide. Plans supportés: ${Object.keys(PLANS).join(', ')}` };
  }
  return { ok: true, value: id as PlanId };
}

export function validatePackId(id: unknown): ValidationResult<string> {
  if (typeof id !== 'string') {
    return { ok: false, error: 'Pack ID invalide' };
  }
  const pack = CREDIT_PACKS.find((p) => p.id === id);
  if (!pack) {
    return { ok: false, error: `Pack invalide. Packs supportés: ${CREDIT_PACKS.map((p) => p.id).join(', ')}` };
  }
  return { ok: true, value: id };
}

// ─── Generic string ──────────────────────────────────────────────────
export function validateString(
  value: unknown,
  opts: { field: string; min?: number; max?: number; required?: boolean } = { field: 'Champ' },
): ValidationResult<string> {
  const { field, min = 1, max = 10_000, required = true } = opts;
  if (typeof value !== 'string' || !value.trim()) {
    if (required) return { ok: false, error: `${field} requis` };
    return { ok: true, value: '' };
  }
  const trimmed = value.trim();
  if (trimmed.length < min) {
    return { ok: false, error: `${field} doit contenir au moins ${min} caractères` };
  }
  if (trimmed.length > max) {
    return { ok: false, error: `${field} trop long (max ${max} caractères)` };
  }
  return { ok: true, value: trimmed };
}

// ─── Referral code ───────────────────────────────────────────────────
export function validateReferralCode(code: unknown): ValidationResult<string | undefined> {
  if (typeof code !== 'string' || !code.trim()) {
    return { ok: true, value: undefined };
  }
  const trimmed = code.trim();
  if (!/^[a-z0-9]{3,32}$/i.test(trimmed)) {
    return { ok: false, error: 'Code de parrainage invalide' };
  }
  return { ok: true, value: trimmed };
}
