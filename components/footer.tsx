// AfriLaunch AI — Footer PRO complet (tous modules)
// Bilingue FR/EN • Newsletter • Social • Langues • Back-to-top • Payments • Status
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Mail, MapPin, MessageCircle, ArrowRight, ArrowUp,
  Twitter, Linkedin, Instagram, Facebook, Youtube,
  Palette, Globe, PenSquare, Share2, CreditCard,
  BarChart3, MessageSquare, Mic, Bot, Store,
  FileText, BookOpen, Code, LifeBuoy,
  Video, Briefcase,
  ShieldCheck, Lock, Scale, Cookie, Check,
} from 'lucide-react';
import { Logo } from '@/components/logo';
import { LogoLockup } from '@/components/logo-lockup';
import { STRINGS, type Lang } from '@/lib/landing-i18n';
import { cn } from '@/lib/utils';

type Variant = 'full' | 'compact';

interface FooterProps {
  lang?: Lang;
  variant?: Variant;
  onLangChange?: (lang: Lang) => void;
  className?: string;
}

const SOCIALS = [
  { icon: Twitter, label: 'X / Twitter', href: 'https://twitter.com/afrilaunch_ai' },
  { icon: Linkedin, label: 'LinkedIn', href: 'https://www.linkedin.com/company/afrilaunch-ai' },
  { icon: Instagram, label: 'Instagram', href: 'https://instagram.com/afrilaunch.ai' },
  { icon: Facebook, label: 'Facebook', href: 'https://facebook.com/afrilaunch.ai' },
  { icon: Youtube, label: 'YouTube', href: 'https://youtube.com/@afrilaunch-ai' },
];

const PAYMENTS = ['MTN MoMo', 'Orange Money', 'Wave', 'Virement bancaire'];

export function Footer({ lang: langProp, variant = 'full', onLangChange, className }: FooterProps) {
  const [lang, setLang] = useState<Lang>(langProp ?? 'fr');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const t = STRINGS[lang];

  // Sync lang with prop / localStorage
  useEffect(() => {
    if (langProp) { setLang(langProp); return; }
    const saved = typeof window !== 'undefined' ? localStorage.getItem('afrilaunch.lang') as Lang | null : null;
    if (saved === 'fr' || saved === 'en') setLang(saved);
  }, [langProp]);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('afrilaunch.lang', lang);
  }, [lang]);

  // Show "back to top" button after scroll
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      return () => window.removeEventListener('scroll', onScroll);
    }
  }, []);

  const changeLang = (l: Lang) => {
    setLang(l);
    onLangChange?.(l);
  };

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    // Persist locally (the real backend can be wired later)
    try {
      const list = JSON.parse(localStorage.getItem('afrilaunch.newsletter') || '[]');
      list.push({ email, at: new Date().toISOString() });
      localStorage.setItem('afrilaunch.newsletter', JSON.stringify(list));
    } catch { /* noop */ }
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 5000);
  };

  const scrollToTop = () => {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cols: Array<{
    title: string;
    links: Array<{ label: string; href: string; icon?: React.ComponentType<{ className?: string }> }>;
  }> = [
    {
      title: t.footer_product,
      links: [
        { label: t.footer_l_features, href: '/#features', icon: Palette },
        { label: t.footer_l_agents, href: '/#agents', icon: Bot },
        { label: t.footer_l_pricing, href: '/#pricing', icon: CreditCard },
        { label: t.footer_l_usecases, href: '/#usecases', icon: Briefcase },
        { label: t.footer_l_faq, href: '/#faq', icon: LifeBuoy },
        { label: t.footer_l_demo, href: '/#demo', icon: Video },
      ],
    },
    {
      title: t.footer_modules,
      links: [
        { label: t.footer_l_identity, href: '/dashboard/identity', icon: Palette },
        { label: t.footer_l_brand_kit, href: '/dashboard/media-kit', icon: Store },
        { label: t.footer_l_website, href: '/dashboard/website', icon: Globe },
        { label: t.footer_l_content, href: '/dashboard/content', icon: PenSquare },
        { label: t.footer_l_social, href: '/dashboard/social', icon: Share2 },
        { label: t.footer_l_whatsapp, href: '/dashboard/whatsapp-agent', icon: MessageCircle },
        { label: t.footer_l_voice, href: '/dashboard/voice', icon: Mic },
        { label: t.footer_l_analytics, href: '/dashboard/analytics', icon: BarChart3 },
        { label: t.footer_l_payments, href: '/dashboard/payments', icon: CreditCard },
        { label: t.footer_l_my_agents, href: '/dashboard/agents', icon: Bot },
        { label: t.footer_l_marketplace, href: '/dashboard/marketplace', icon: Store },
      ],
    },
    {
      title: t.footer_resources,
      links: [
        { label: t.footer_l_blog, href: '/blog', icon: BookOpen },
        { label: t.footer_l_docs, href: '/api-docs', icon: FileText },
        { label: t.footer_l_api, href: '/api-docs', icon: Code },
        { label: t.footer_l_help, href: 'mailto:contact@afrilaunch.ai?subject=Help', icon: LifeBuoy },
      ],
    },
    {
      title: t.footer_company,
      links: [
        { label: t.footer_l_about, href: '/about', icon: Briefcase },
        { label: t.footer_l_contact, href: 'mailto:contact@afrilaunch.ai', icon: Mail },
      ],
    },
    {
      title: t.footer_legal,
      links: [
        { label: t.footer_l_terms, href: '/legal/terms', icon: FileText },
        { label: t.footer_l_privacy, href: '/legal/privacy', icon: Lock },
        { label: t.footer_l_security, href: '/legal/security', icon: ShieldCheck },
        { label: t.footer_l_rgpd, href: '/legal/rgpd', icon: Scale },
        { label: t.footer_l_cookies, href: '/legal/privacy#cookies', icon: Cookie },
      ],
    },
  ];

  // Compact variant (used on auth pages)
  if (variant === 'compact') {
    return (
      <footer className={cn('border-t border-white/5 bg-[#050508] text-white', className)}>
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-3">
                <Logo size={28} compact />
                <span className="font-bold text-sm">AfriLaunch <span className="gradient-text">AI</span></span>
              </Link>
              <p className="text-[11px] text-gray-500 leading-relaxed mb-3">{t.footer_tagline}</p>
              <div className="flex items-center gap-2">
                {SOCIALS.slice(0, 4).map(({ icon: Icon, label, href }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                    aria-label={label}
                    className="w-7 h-7 rounded-lg glass border border-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">{t.footer_product}</p>
              <ul className="space-y-1.5 list-none p-0 m-0">
                {cols[0].links.slice(0, 5).map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-[11px] text-gray-500 hover:text-white transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">{t.footer_company}</p>
              <ul className="space-y-1.5 list-none p-0 m-0">
                {cols[3].links.map((l) => (
                  <li key={l.label}>
                    {l.href.startsWith('http') || l.href.startsWith('mailto') ? (
                      <a href={l.href} className="text-[11px] text-gray-500 hover:text-white transition-colors">{l.label}</a>
                    ) : (
                      <Link href={l.href} className="text-[11px] text-gray-500 hover:text-white transition-colors">{l.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">{t.footer_legal}</p>
              <ul className="space-y-1.5 list-none p-0 m-0">
                {cols[4].links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-[11px] text-gray-500 hover:text-white transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-6 border-t border-white/5">
            <p className="text-[11px] text-gray-600">© {new Date().getFullYear()} AfriLaunch AI. {t.footer_rights}</p>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 glass rounded-lg p-0.5 text-[10px] font-semibold">
                <button type="button" onClick={() => changeLang('fr')}
                  className={cn('px-2 py-0.5 rounded-md transition-colors', lang === 'fr' ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white')}>FR</button>
                <button type="button" onClick={() => changeLang('en')}
                  className={cn('px-2 py-0.5 rounded-md transition-colors', lang === 'en' ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white')}>EN</button>
              </div>
              <span className="text-gray-700 text-[10px]">·</span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />{t.footer_status_ok}
              </span>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  // Full variant (landing page)
  return (
    <footer className={cn('relative border-t border-white/5 bg-[#050508] text-white overflow-hidden', className)}>
      {/* Decorative gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-indigo-500/10 to-violet-500/10 blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-r from-cyan-500/5 to-blue-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">

        {/* ─── Newsletter band (top) ─── */}
        <div className="py-10 border-b border-white/5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            <div>
              <h3 className="text-xl md:text-2xl font-bold mb-2">{t.footer_newsletter_title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{t.footer_newsletter_desc}</p>
            </div>
            <div>
              {subscribed ? (
                <div className="glass rounded-2xl p-5 border border-emerald-500/30 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="w-5 h-5 text-emerald-400" aria-hidden="true" />
                  </div>
                  <p className="text-sm text-emerald-300 font-medium">{t.footer_newsletter_success}</p>
                </div>
              ) : (
                <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 flex items-center gap-2 glass rounded-xl px-4 py-3 border border-white/5 focus-within:border-indigo-500/50 transition-colors">
                    <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" aria-hidden="true" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.footer_newsletter_placeholder}
                      className="bg-transparent flex-1 outline-none text-sm placeholder:text-gray-600"
                      aria-label={t.footer_newsletter_placeholder}
                    />
                  </div>
                  <button type="submit"
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 transition-all duration-300 hover:scale-105 shadow-lg shadow-indigo-500/25 font-semibold text-sm flex items-center gap-2 justify-center">
                    {t.footer_newsletter_button}
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </form>
              )}
              <p className="text-[11px] text-gray-600 mt-2">{t.footer_newsletter_consent}</p>
            </div>
          </div>
        </div>

        {/* ─── Main grid: brand + 5 columns ─── */}
        <div className="py-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">

          {/* Brand block */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link href="/" className="block mb-4 group" aria-label="AfriLaunch AI — accueil">
              <LogoLockup
                iconSize={36}
                variant="horizontal"
                showSlogan
                slogan={t.footer_slogan}
                animated
                className="transition-transform group-hover:scale-105"
              />
            </Link>
            <p className="text-xs text-gray-500 leading-relaxed mb-5">{t.footer_tagline}</p>

            {/* Contact info */}
            <div className="space-y-2 mb-5">
              <a href="mailto:contact@afrilaunch.ai"
                className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors">
                <Mail className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
                contact@afrilaunch.ai
              </a>
              <a href="https://wa.me/237600000000" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                +237 6XX XXX XXX (WhatsApp)
              </a>
              <p className="flex items-center gap-2 text-xs text-gray-500">
                <MapPin className="w-3.5 h-3.5 text-fuchsia-400" aria-hidden="true" />
                Douala, Cameroun · Remote-friendly
              </p>
            </div>

            {/* System status badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-emerald-500/20 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-emerald-300 font-semibold">{t.footer_status_ok}</span>
              <span className="text-gray-600">· 99.9%</span>
            </div>
          </div>

          {/* 5 link columns */}
          {cols.map((col) => (
            <div key={col.title}>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">{col.title}</p>
              <ul className="space-y-2 list-none p-0 m-0">
                {col.links.map((l) => {
                  const isExternal = l.href.startsWith('http') || l.href.startsWith('mailto');
                  const Icon = l.icon;
                  return (
                    <li key={l.label}>
                      {isExternal ? (
                        <a href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined}
                          rel="noopener noreferrer"
                          className="group flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors">
                          {Icon && <Icon className="w-3 h-3 text-gray-600 group-hover:text-indigo-400 transition-colors" aria-hidden="true" />}
                          <span>{l.label}</span>
                        </a>
                      ) : (
                        <Link href={l.href}
                          className="group flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors">
                          {Icon && <Icon className="w-3 h-3 text-gray-600 group-hover:text-indigo-400 transition-colors" aria-hidden="true" />}
                          <span>{l.label}</span>
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* ─── Social row ─── */}
        <div className="py-6 border-t border-white/5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-3">
              <p className="text-xs font-semibold text-gray-400">{t.footer_follow_us}</p>
              <div className="flex items-center gap-2">
                {SOCIALS.map(({ icon: Icon, label, href }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                    aria-label={label}
                    className="w-9 h-9 rounded-xl glass border border-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:bg-gradient-to-br hover:from-indigo-500 hover:to-violet-600 hover:border-transparent hover:scale-110 transition-all duration-300">
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>

            {/* Language switcher */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-600 uppercase tracking-wider">{t.footer_lang}</span>
              <div className="flex items-center gap-1 glass rounded-lg p-0.5 text-xs font-semibold">
                <button type="button" onClick={() => changeLang('fr')}
                  className={cn('px-2.5 py-1 rounded-md transition-colors', lang === 'fr' ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white')}>FR</button>
                <button type="button" onClick={() => changeLang('en')}
                  className={cn('px-2.5 py-1 rounded-md transition-colors', lang === 'en' ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white')}>EN</button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Bottom bar: copyright + payments + made-in ─── */}
        <div className="py-6 border-t border-white/5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
              <p className="text-xs text-gray-600">
                © {new Date().getFullYear()} AfriLaunch AI. {t.footer_rights}
              </p>
              <span className="hidden sm:inline text-gray-700">·</span>
              <p className="text-xs text-gray-600 flex items-center gap-1.5">
                {t.footer_made_in}
              </p>
            </div>

            {/* Payments */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-[10px] text-gray-600 uppercase tracking-wider">{t.footer_payments}:</span>
              {PAYMENTS.map((p, i) => (
                <span key={p}
                  className="px-2.5 py-1 rounded-md glass border border-white/5 text-[10px] font-semibold text-gray-400">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Back to top button ─── */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label={t.footer_back_to_top}
        className={cn(
          'fixed bottom-6 right-6 z-40 w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30 flex items-center justify-center text-white transition-all duration-300 hover:scale-110',
          showTop ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        <ArrowUp className="w-5 h-5" aria-hidden="true" />
      </button>
    </footer>
  );
}
