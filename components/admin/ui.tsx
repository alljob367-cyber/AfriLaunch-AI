// AfriLaunch AI — Admin UI primitives
'use client';

import { motion } from 'framer-motion';
import { Loader2, Check, AlertCircle, Save, FlaskConical } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function AdminPageHeader({ title, description, icon: Icon, color }: {
  title: string; description: string; icon: React.ElementType; color: string;
}) {
  return (
    <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
      <div className="flex items-center gap-4">
        <div className={cn('w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg', color)}>
          <Icon className="w-6 h-6 text-white" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
          <p className="text-sm text-gray-400 mt-1 max-w-2xl">{description}</p>
        </div>
      </div>
    </motion.header>
  );
}

export function AdminCard({ title, description, children, action }: {
  title?: string; description?: string; children: ReactNode; action?: ReactNode;
}) {
  return (
    <motion.section initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 border border-white/5">
      {(title || action) && (
        <div className="flex items-start justify-between mb-4 gap-4">
          <div>
            {title && <h2 className="font-bold text-base">{title}</h2>}
            {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </motion.section>
  );
}

export function AdminInput({ label, value, onChange, type = 'text', placeholder, required, secret, hint, id }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
  placeholder?: string; required?: boolean; secret?: boolean; hint?: string; id?: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const inputId = id || `inp-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  const inputType = secret ? (revealed ? 'text' : 'password') : type;
  return (
    <div>
      <label htmlFor={inputId} className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="flex items-center gap-2 glass rounded-xl px-4 py-2.5 border border-white/5 focus-within:border-red-500/40 transition-colors">
        <input id={inputId} type={inputType} required={required} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="bg-transparent flex-1 outline-none text-sm placeholder:text-gray-600 font-mono" />
        {secret && value && (
          <button type="button" onClick={() => setRevealed((v) => !v)} aria-label={revealed ? 'Masquer' : 'Afficher'} className="text-xs text-gray-500 hover:text-white">
            {revealed ? '🙈' : '👁'}
          </button>
        )}
        {value && !secret && <Check className="w-4 h-4 text-green-500" aria-hidden="true" />}
      </div>
      {hint && <p className="text-[11px] text-gray-600 mt-1">{hint}</p>}
    </div>
  );
}

export function AdminSelect({ label, value, onChange, options, hint, id }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; hint?: string; id?: string;
}) {
  const inputId = id || `sel-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  return (
    <div>
      <label htmlFor={inputId} className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide">{label}</label>
      <select id={inputId} value={value} onChange={(e) => onChange(e.target.value)} className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-red-500/40 outline-none text-sm bg-[#0a0a0f]">
        {options.map((opt) => (<option key={opt.value} value={opt.value} className="bg-[#0a0a0f]">{opt.label}</option>))}
      </select>
      {hint && <p className="text-[11px] text-gray-600 mt-1">{hint}</p>}
    </div>
  );
}

export function AdminToggle({ label, description, checked, onChange }: {
  label: string; description?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <button type="button" onClick={() => onChange(!checked)} aria-pressed={checked} aria-label={`${checked ? 'Désactiver' : 'Activer'} ${label}`} className={cn('relative w-11 h-6 rounded-full transition-colors flex-shrink-0', checked ? 'bg-green-500' : 'bg-gray-700')}>
        <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform', checked ? 'translate-x-5' : 'translate-x-0.5')} />
      </button>
    </div>
  );
}

export function AdminNumber({ label, value, onChange, min, max, step, hint }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; hint?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} min={min} max={max} step={step} className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-red-500/40 outline-none text-sm font-mono" />
      {hint && <p className="text-[11px] text-gray-600 mt-1">{hint}</p>}
    </div>
  );
}

export function AdminTextarea({ label, value, onChange, rows = 3, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string; hint?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase tracking-wide">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder} className="w-full glass rounded-xl px-4 py-2.5 border border-white/5 focus:border-red-500/40 outline-none text-sm font-mono resize-y" />
      {hint && <p className="text-[11px] text-gray-600 mt-1">{hint}</p>}
    </div>
  );
}

export function SaveBar({ onSave, saving, dirty }: { onSave: () => void; saving: boolean; dirty: boolean; }) {
  return (
    <div className="sticky bottom-4 z-20 mt-8">
      <div className={cn('glass rounded-2xl p-4 border flex items-center justify-between gap-4 transition-all', dirty ? 'border-red-500/40 shadow-lg shadow-red-500/10' : 'border-white/5 opacity-60')}>
        <div className="flex items-center gap-2 text-sm">
          {dirty ? (<><AlertCircle className="w-4 h-4 text-amber-400" aria-hidden="true" /><span className="text-amber-300">Modifications non enregistrées</span></>) : (<><Check className="w-4 h-4 text-green-500" aria-hidden="true" /><span className="text-gray-400">Tous les changements sont enregistrés</span></>)}
        </div>
        <button type="button" onClick={onSave} disabled={saving || !dirty} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-500 to-orange-600 hover:scale-105 transition-transform shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Enregistrement...</> : <><Save className="w-4 h-4" aria-hidden="true" /> Enregistrer</>}
        </button>
      </div>
    </div>
  );
}

export function TestButton({ onTest, label = 'Tester la connexion' }: {
  onTest: () => Promise<{ ok: boolean; message: string }>; label?: string;
}) {
  const [testing, setTesting] = useState(false);
  return (
    <button type="button" onClick={async () => { setTesting(true); try { await onTest(); } finally { setTesting(false); } }} disabled={testing} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold glass border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50">
      {testing ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <FlaskConical className="w-4 h-4" aria-hidden="true" />}
      {testing ? 'Test en cours...' : label}
    </button>
  );
}

export function LoadingState() {
  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto mb-3" aria-hidden="true" />
        <p className="text-sm text-gray-500">Chargement de la configuration...</p>
      </div>
    </div>
  );
}

export function StatusBadge({ ok, label }: { ok: boolean; label?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide', ok ? 'bg-green-500/15 text-green-400 border border-green-500/30' : 'bg-gray-500/15 text-gray-500 border border-gray-500/30')}>
      <span className={cn('w-1.5 h-1.5 rounded-full', ok ? 'bg-green-500' : 'bg-gray-500')} aria-hidden="true" />
      {label || (ok ? 'Configuré' : 'Non configuré')}
    </span>
  );
}
