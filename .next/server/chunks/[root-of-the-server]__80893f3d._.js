module.exports=[18622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},70406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},14747,(e,t,r)=>{t.exports=e.x("path",()=>require("path"))},93695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},22734,(e,t,r)=>{t.exports=e.x("fs",()=>require("fs"))},52946,78642,e=>{"use strict";var t=e.i(22734),r=e.i(14747),a=e.i(54799);let n={free:{id:"free",name:"Free",priceMonthly:0,priceAnnual:0,creditsPerMonth:50,features:["50 crédits IA / mois","1 organisation","Accès aux 13 agents IA de base","Bot Telegram partagé","Support communauté"],botType:"shared",whiteLabel:!1,maxTeamMembers:1,apiAccess:!1},starter:{id:"starter",name:"Starter",priceMonthly:9.99,priceAnnual:95.9,creditsPerMonth:500,features:["500 crédits IA / mois","2 organisations","13 agents IA + marketplace","Bot Telegram partagé","3 agents IA en parallèle","Planification de contenu","Support email 48h"],botType:"shared",whiteLabel:!1,maxTeamMembers:1,apiAccess:!1},pro:{id:"pro",name:"Pro",priceMonthly:29.99,priceAnnual:287.9,creditsPerMonth:5e3,features:["5 000 crédits IA / mois","5 organisations","Tous les agents IA + marketplace","Bot Telegram dédié (votre token)","Campagnes marketing IA","Analytics avancés","Accès API limité","Support prioritaire 24h"],popular:!0,botType:"dedicated",whiteLabel:!1,maxTeamMembers:5,apiAccess:!0},business:{id:"business",name:"Business",priceMonthly:79.99,priceAnnual:767.9,creditsPerMonth:5e4,features:["50 000 crédits IA / mois","Organisations illimitées","Tous les agents + marketplace premium","Bot Telegram white-label","Marque blanche disponible","Intégrations CRM","Analytics avancés","Manager de compte dédié","SLA 99.9%","Accès API complet"],botType:"dedicated",whiteLabel:!0,maxTeamMembers:20,apiAccess:!0},enterprise:{id:"enterprise",name:"Enterprise",priceMonthly:299,priceAnnual:2870,creditsPerMonth:-1,features:["Crédits illimités","Organisations illimitées","Déploiement sur site","SLA personnalisé","Intégrations sur mesure","Formation personnalisée","Support 24/7 dédié"],botType:"dedicated",whiteLabel:!0,maxTeamMembers:-1,apiAccess:!0}};e.s(["CREDIT_PACKS",0,[{id:"pack_1000",credits:1e3,price:4.99,discount:0},{id:"pack_5000",credits:5e3,price:19.99,discount:20,popular:!0},{id:"pack_25000",credits:25e3,price:89.99,discount:30},{id:"pack_100000",credits:1e5,price:299.99,discount:40}],"PLANS",0,n],78642);let i=r.default.join("/home/z/my-project/data","users.json");async function s(){try{let e=await t.promises.readFile(i,"utf-8");return JSON.parse(e)}catch{return{users:[]}}}async function o(e){await t.promises.mkdir(r.default.dirname(i),{recursive:!0}),await t.promises.writeFile(i,JSON.stringify(e,null,2),"utf-8")}function l(e){return a.default.createHash("sha256").update(e).digest("hex")}async function d(e){let t,r,i,d=await s();if(d.users.find(t=>t.email.toLowerCase()===e.email.toLowerCase()))return{ok:!1,error:"Un compte existe déjà avec cet email"};if(e.referredBy&&!(t=d.users.find(t=>t.referralCode===e.referredBy)))return{ok:!1,error:"Code de parrainage invalide"};let c=new Date().toISOString(),u=new Date;u.setMonth(u.getMonth()+1);let p={id:"usr_"+a.default.randomBytes(12).toString("hex"),email:e.email,firstName:e.firstName,lastName:e.lastName,passwordHash:l(e.password),createdAt:c,plan:"free",planStatus:"active",planStartedAt:c,planEndsAt:null,credits:n.free.creditsPerMonth,creditsUsedThisMonth:0,creditsResetAt:u.toISOString(),referralCode:(r=e.firstName.toLowerCase().replace(/[^a-z]/g,"").slice(0,6)||"user",i=a.default.randomBytes(3).toString("hex"),`${r}${i}`),referredBy:e.referredBy??null,referralCount:0,referralCreditsEarned:0,installedAgents:[],lastLoginAt:null,updatedAt:c};return d.users.push(p),t&&(t.credits+=100,t.referralCount+=1,t.referralCreditsEarned+=100,t.updatedAt=c),await o(d),{ok:!0,user:p}}async function c(e,t){let r=await s(),a=r.users.find(t=>t.email.toLowerCase()===e.toLowerCase());return a&&a.passwordHash===l(t)?(a.lastLoginAt=new Date().toISOString(),await o(r),a):null}async function u(e){return(await s()).users.find(t=>t.id===e)??null}async function p(e){return(await s()).users.find(t=>t.telegramUserId===e)??null}async function m(e,t){let r=await s(),a=r.users.find(t=>t.id===e);return a?(Object.assign(a,t,{updatedAt:new Date().toISOString()}),await o(r),a):null}async function f(e,t,r){return m(e,{plan:t,planStatus:"active",planStartedAt:new Date().toISOString(),credits:-1===n[t].creditsPerMonth?999999:n[t].creditsPerMonth,creditsUsedThisMonth:0,creditsResetAt:new Date(Date.now()+2592e6).toISOString()})}async function h(e,t){let r=await s(),a=r.users.find(t=>t.id===e);return a?(a.credits+=t,a.updatedAt=new Date().toISOString(),await o(r),a):null}async function g(e,t){let r=await s(),a=r.users.find(t=>t.id===e);if(!a)return{ok:!1,user:null,error:"Utilisateur introuvable"};if(new Date(a.creditsResetAt)<new Date){let e=n[a.plan].creditsPerMonth;a.credits=-1===e?999999:e,a.creditsUsedThisMonth=0,a.creditsResetAt=new Date(Date.now()+2592e6).toISOString()}return a.credits<t?{ok:!1,user:a,error:"Crédits insuffisants. Rechargez votre compte."}:(a.credits-=t,a.creditsUsedThisMonth+=t,a.updatedAt=new Date().toISOString(),await o(r),{ok:!0,user:a})}async function w(e,t,r){return m(e,{telegramUserId:t,telegramUsername:r,telegramLinkedAt:new Date().toISOString()})}async function x(e,t){let r=await s(),a=r.users.find(t=>t.id===e);return a?(a.installedAgents.includes(t)||(a.installedAgents.push(t),a.updatedAt=new Date().toISOString(),await o(r)),a):null}async function y(e,t){let r=await s(),a=r.users.find(t=>t.id===e);return a?(a.installedAgents=a.installedAgents.filter(e=>e!==t),a.updatedAt=new Date().toISOString(),await o(r),a):null}let b=r.default.join("/home/z/my-project/data","user-sessions.json");async function A(){try{let e=await t.promises.readFile(b,"utf-8");return JSON.parse(e)}catch{return[]}}async function v(e){await t.promises.mkdir(r.default.dirname(b),{recursive:!0}),await t.promises.writeFile(b,JSON.stringify(e,null,2),"utf-8")}async function S(e,t=168){let r=a.default.randomBytes(32).toString("hex"),n=Date.now(),i=await A();return i.push({token:r,userId:e,createdAt:n,expiresAt:n+60*t*6e4}),await v(i),r}async function R(e){if(!e)return null;let t=await A(),r=Date.now(),a=t.find(t=>t.token===e&&t.expiresAt>r);if(!a)return null;let n=t.filter(e=>e.expiresAt>r);return n.length!==t.length&&await v(n),u(a.userId)}async function C(e){let t=(await A()).filter(t=>t.token!==e);await v(t)}function k(e){let{passwordHash:t,...r}=e;return r}e.s(["addCredits",()=>h,"authenticateUser",()=>c,"changeUserPlan",()=>f,"consumeCredits",()=>g,"createUser",()=>d,"createUserSession",()=>S,"destroyUserSession",()=>C,"getUserByTelegramId",()=>p,"installAgent",()=>x,"linkTelegramAccount",()=>w,"sanitizeUser",()=>k,"uninstallAgent",()=>y,"validateUserSession",()=>R],52946)},21779,e=>{"use strict";var t=e.i(47909),r=e.i(74017),a=e.i(96250),n=e.i(59756),i=e.i(61916),s=e.i(14444),o=e.i(37092),l=e.i(69741),d=e.i(16795),c=e.i(87718),u=e.i(95169),p=e.i(32084),m=e.i(66012),f=e.i(70101),h=e.i(26937),g=e.i(10372),w=e.i(93695);e.i(52474);var x=e.i(220),y=e.i(89171);e.i(52946);var b=e.i(78642);function A(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}async function v(e){let t=new URL(e.url),r=t.searchParams.get("type")??"",a=t.searchParams.get("itemId")??"",n=t.searchParams.get("userId")??"",i=t.searchParams.get("billingCycle")??"monthly",s="Article",o=0,l="";if("plan"===r){let e=b.PLANS[a];e&&(s=`Plan ${e.name}`,o="annual"===i?e.priceAnnual:e.priceMonthly,l=`${-1===e.creditsPerMonth?"Crédits illimités":`${e.creditsPerMonth} cr\xe9dits/mois`} — ${"annual"===i?"facturation annuelle":"facturation mensuelle"}`)}else if("pack"===r){let e=b.CREDIT_PACKS.find(e=>e.id===a);e&&(s=`Pack ${e.credits.toLocaleString("fr-FR")} cr\xe9dits`,o=e.price,l=`Top-up de ${e.credits.toLocaleString("fr-FR")} cr\xe9dits${e.discount?` (-${e.discount}%)`:""}`)}let d=o>0?`$${o.toFixed(2)}`:"Gratuit",c=`<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Paiement — AfriLaunch AI</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    background: #0a0a0a;
    color: #f5f5f5;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
  }
  .card {
    width: 100%;
    max-width: 480px;
    background: linear-gradient(180deg, #18181b 0%, #0f0f12 100%);
    border: 1px solid #27272a;
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 24px 64px -16px rgba(0,0,0,0.6);
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #f59e0b;
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.3);
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    margin-bottom: 1.25rem;
  }
  h1 {
    margin: 0 0 0.5rem;
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1.25;
  }
  .desc {
    margin: 0 0 1.5rem;
    font-size: 0.9375rem;
    color: #a1a1aa;
  }
  .price-row {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    padding: 1rem 1.25rem;
    background: #18181b;
    border: 1px solid #27272a;
    border-radius: 12px;
    margin-bottom: 1.5rem;
  }
  .price {
    font-size: 2rem;
    font-weight: 800;
    color: #fafafa;
  }
  .currency { font-size: 0.9rem; color: #a1a1aa; }
  button {
    width: 100%;
    padding: 0.875rem 1rem;
    font-size: 1rem;
    font-weight: 600;
    color: #0a0a0a;
    background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: transform 0.05s ease, filter 0.15s ease;
  }
  button:hover { filter: brightness(1.08); }
  button:active { transform: translateY(1px); }
  .meta {
    margin-top: 1rem;
    font-size: 0.75rem;
    color: #71717a;
    text-align: center;
  }
  .meta code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    color: #a1a1aa;
    background: #18181b;
    padding: 0.1rem 0.35rem;
    border-radius: 4px;
    border: 1px solid #27272a;
  }
</style>
</head>
<body>
  <main class="card" role="main">
    <span class="badge">💳 Paiement Flutterwave (simul\xe9)</span>
    <h1>${A(s)}</h1>
    <p class="desc">${A(l)}</p>
    <div class="price-row">
      <span class="price">${A(d)}</span>
      <span class="currency">USD</span>
    </div>
    <form method="POST" action="/api/checkout/flutterwave-confirm">
      <input type="hidden" name="type" value="${A(r)}" />
      <input type="hidden" name="itemId" value="${A(a)}" />
      <input type="hidden" name="userId" value="${A(n)}" />
      <button type="submit">Payer maintenant</button>
    </form>
    <p class="meta">Mode d\xe9mo — aucun paiement r\xe9el ne sera trait\xe9.<br />
      User: <code>${A(n||"—")}</code>
    </p>
  </main>
</body>
</html>`;return new y.NextResponse(c,{status:200,headers:{"Content-Type":"text/html; charset=utf-8"}})}e.s(["GET",()=>v],39802);var S=e.i(39802);let R=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/checkout/flutterwave-redirect/route",pathname:"/api/checkout/flutterwave-redirect",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/app/api/checkout/flutterwave-redirect/route.ts",nextConfigOutput:"",userland:S}),{workAsyncStorage:C,workUnitAsyncStorage:k,serverHooks:P}=R;function T(){return(0,a.patchFetch)({workAsyncStorage:C,workUnitAsyncStorage:k})}async function I(e,t,a){R.isDev&&(0,n.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let y="/api/checkout/flutterwave-redirect/route";y=y.replace(/\/index$/,"")||"/";let b=await R.prepare(e,t,{srcPage:y,multiZoneDraftMode:!1});if(!b)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:A,params:v,nextConfig:S,parsedUrl:C,isDraftMode:k,prerenderManifest:P,routerServerContext:T,isOnDemandRevalidate:I,revalidateOnlyGenerated:M,resolvedPathname:E,clientReferenceManifest:O,serverActionsManifest:D}=b,N=(0,l.normalizeAppPath)(y),U=!!(P.dynamicRoutes[N]||P.routes[E]),$=async()=>((null==T?void 0:T.render404)?await T.render404(e,t,C,!1):t.end("This page could not be found"),null);if(U&&!k){let e=!!P.routes[E],t=P.dynamicRoutes[N];if(t&&!1===t.fallback&&!e){if(S.experimental.adapterPath)return await $();throw new w.NoFallbackError}}let _=null;!U||R.isDev||k||(_="/index"===(_=E)?"/":_);let j=!0===R.isDev||!U,L=U&&!j;D&&O&&(0,s.setReferenceManifestsSingleton)({page:y,clientReferenceManifest:O,serverActionsManifest:D,serverModuleMap:(0,o.createServerModuleMap)({serverActionsManifest:D})});let q=e.method||"GET",H=(0,i.getTracer)(),F=H.getActiveScopeSpan(),B={params:v,prerenderManifest:P,renderOpts:{experimental:{authInterrupts:!!S.experimental.authInterrupts},cacheComponents:!!S.cacheComponents,supportsDynamicResponse:j,incrementalCache:(0,n.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:S.cacheLife,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,a)=>R.onRequestError(e,t,a,T)},sharedContext:{buildId:A}},z=new d.NodeNextRequest(e),K=new d.NodeNextResponse(t),G=c.NextRequestAdapter.fromNodeNextRequest(z,(0,c.signalFromNodeResponse)(t));try{let s=async e=>R.handle(G,B).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=H.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==u.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=r.get("next.route");if(a){let t=`${q} ${a}`;e.setAttributes({"next.route":a,"http.route":a,"next.span_name":t}),e.updateName(t)}else e.updateName(`${q} ${y}`)}),o=!!(0,n.getRequestMeta)(e,"minimalMode"),l=async n=>{var i,l;let d=async({previousCacheEntry:r})=>{try{if(!o&&I&&M&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let i=await s(n);e.fetchMetrics=B.renderOpts.fetchMetrics;let l=B.renderOpts.pendingWaitUntil;l&&a.waitUntil&&(a.waitUntil(l),l=void 0);let d=B.renderOpts.collectedTags;if(!U)return await (0,m.sendResponse)(z,K,i,B.renderOpts.pendingWaitUntil),null;{let e=await i.blob(),t=(0,f.toNodeOutgoingHttpHeaders)(i.headers);d&&(t[g.NEXT_CACHE_TAGS_HEADER]=d),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==B.renderOpts.collectedRevalidate&&!(B.renderOpts.collectedRevalidate>=g.INFINITE_CACHE)&&B.renderOpts.collectedRevalidate,a=void 0===B.renderOpts.collectedExpire||B.renderOpts.collectedExpire>=g.INFINITE_CACHE?void 0:B.renderOpts.collectedExpire;return{value:{kind:x.CachedRouteKind.APP_ROUTE,status:i.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:a}}}}catch(t){throw(null==r?void 0:r.isStale)&&await R.onRequestError(e,t,{routerKind:"App Router",routePath:y,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:L,isOnDemandRevalidate:I})},T),t}},c=await R.handleResponse({req:e,nextConfig:S,cacheKey:_,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:P,isRoutePPREnabled:!1,isOnDemandRevalidate:I,revalidateOnlyGenerated:M,responseGenerator:d,waitUntil:a.waitUntil,isMinimalMode:o});if(!U)return null;if((null==c||null==(i=c.value)?void 0:i.kind)!==x.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==c||null==(l=c.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});o||t.setHeader("x-nextjs-cache",I?"REVALIDATED":c.isMiss?"MISS":c.isStale?"STALE":"HIT"),k&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let u=(0,f.fromNodeOutgoingHttpHeaders)(c.value.headers);return o&&U||u.delete(g.NEXT_CACHE_TAGS_HEADER),!c.cacheControl||t.getHeader("Cache-Control")||u.get("Cache-Control")||u.set("Cache-Control",(0,h.getCacheControlHeader)(c.cacheControl)),await (0,m.sendResponse)(z,K,new Response(c.value.body,{headers:u,status:c.value.status||200})),null};F?await l(F):await H.withPropagatedContext(e.headers,()=>H.trace(u.BaseServerSpan.handleRequest,{spanName:`${q} ${y}`,kind:i.SpanKind.SERVER,attributes:{"http.method":q,"http.target":e.url}},l))}catch(t){if(t instanceof w.NoFallbackError||await R.onRequestError(e,t,{routerKind:"App Router",routePath:N,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:L,isOnDemandRevalidate:I})}),U)throw t;return await (0,m.sendResponse)(z,K,new Response(null,{status:500})),null}}e.s(["handler",()=>I,"patchFetch",()=>T,"routeModule",()=>R,"serverHooks",()=>P,"workAsyncStorage",()=>C,"workUnitAsyncStorage",()=>k],21779)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__80893f3d._.js.map