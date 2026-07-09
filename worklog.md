---
Task ID: audit-1
Agent: general-purpose code auditor
Task: Audit AfriLaunch AI Next.js project for bugs and anti-patterns

Work Log:
- Read all 34 source files listed in the audit scope (layout, pages, providers, components, hooks, lib, configs).
- Checked each file for: hydration mismatches, unused imports/variables, missing key props, stale closures, race conditions in async handlers, form button types, accessibility (labels, alt, aria, contrast), TypeScript type holes, React anti-patterns, logic bugs, and dead code.
- Cross-referenced imports across files to identify dead code (components imported but never rendered, fallback defaults never triggered).
- Verified the greeting hydration pattern (`useState(null)` + `?? 'Bonjour'`) is correct.
- Verified pricing annual/monthly toggle math (−20% discount is correct for all paid plans).
- Verified the stats-grid prop bug (displayStats computed but defaultStats rendered).
- Verified the onboarding banner threshold bug (3/10 = 30%, banner hidden by `< 30` condition).
- Verified the content-calendar hardcoding (July 2025 only, navigation breaks other months — but component is never rendered).
- Verified the social-accounts TikTok/YouTube icon mismatch.
- Verified `tsconfig.json` has `strict: false` despite the claim of "strict TypeScript checking".
- Verified `enableSystem` + hardcoded dark colors would break light mode.
- Compiled findings into a prioritized CRITICAL / HIGH / MEDIUM / LOW report.
- Did NOT modify any source files (read-only audit).

Stage Summary:
- 0 CRITICAL issues (nothing crashes at runtime).
- 4 HIGH issues: stats-grid ignores its `stats` prop (shows wrong numbers); login/register race condition (redirect fires before async auth resolves); light mode is broken (enableSystem + hardcoded dark colors); content-calendar hardcoded to July 2025 (mitigated: component is never rendered).
- 15 MEDIUM issues: ~23 unused imports across 3 files, 2 imported-but-never-rendered components, `orgLoading` unused variable, onboarding banner threshold logic bug, TikTok uses Youtube icon, multiple accessibility gaps (unassociated labels, icon-only buttons without aria-label, toasts without role=alert, gray-600 contrast failure), dead buttons (no onClick), dead nav anchors, `tsconfig.json` strict:false, `stats?: any` type hole.
- 7 LOW issues: unnecessary suppressHydrationWarning, dead fallback defaults, non-existent tailwind content path, hardcoded year, toast timeout not cleaned up, `Image` import shadows global, `/register?plan=` param ignored.
- Greeting hydration fix is correct — no mismatch.
- Pricing math is correct (−20% annual discount verified for all plans).
- Auth provider's lack of persistence is acceptable for a demo but should be documented.
