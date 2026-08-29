// AfriLaunch AI — Website HTML assembler
// Takes a WebsiteConfig and produces a complete, functional HTML site
// with real user data (services, prices, reservation, contact).
//
// The HTML is assembled from pre-built templates (not AI-generated)
// to guarantee: functional JavaScript, responsive design, SEO, and
// working reservation/booking system.

import {
  type WebsiteConfig,
  type ServiceItem,
  type BusinessType,
  getBusinessTypeInfo,
  FIELD_LABELS,
} from './website-builder';

export function assembleWebsiteHtml(config: WebsiteConfig): string {
  const biz = getBusinessTypeInfo(config.businessType);
  const color = config.primaryColor;

  // Build services HTML
  const servicesHtml = config.services.length > 0
    ? config.services.map((s) => `
        <div class="service-card glass">
          <div class="service-emoji">${s.imageEmoji || '✨'}</div>
          <h3>${escapeHtml(s.name)}</h3>
          <p>${escapeHtml(s.description)}</p>
          ${s.price ? `<p class="service-price">${escapeHtml(s.price)}</p>` : ''}
          ${config.reservation.enabled ? `<button onclick="scrollToReservation('${escapeHtml(s.name)}')" class="btn-book">Réserver</button>` : ''}
        </div>
      `).join('')
    : '<p class="text-gray-400 text-center">Contactez-nous pour nos services.</p>';

  // Build pricing HTML (if applicable)
  const pricingHtml = biz.hasPricing && config.pricingPlans.length > 0
    ? `
      <section id="pricing" class="section">
        <div class="container">
          <h2 class="section-title">Nos <span class="gradient-text">Tarifs</span></h2>
          <p class="section-subtitle">Des prix adaptés à votre budget</p>
          <div class="pricing-grid">
            ${config.pricingPlans.map((plan) => `
              <div class="pricing-card ${plan.popular ? 'popular' : ''}">
                ${plan.popular ? '<span class="popular-badge">⭐ Populaire</span>' : ''}
                <h3>${escapeHtml(plan.name)}</h3>
                <p class="price">${escapeHtml(plan.price)}</p>
                <ul>
                  ${plan.features.map((f) => `<li>✓ ${escapeHtml(f)}</li>`).join('')}
                </ul>
                ${config.reservation.enabled ? `<button onclick="scrollToReservation('${escapeHtml(plan.name)}')" class="btn-book">Choisir</button>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </section>`
    : '';

  // Build gallery HTML (if applicable)
  const galleryHtml = biz.hasGallery && config.gallery.length > 0
    ? `
      <section id="gallery" class="section">
        <div class="container">
          <h2 class="section-title">Notre <span class="gradient-text">Galerie</span></h2>
          <div class="gallery-grid">
            ${config.gallery.map((g) => `
              <div class="gallery-item glass">
                <span class="gallery-emoji">${g.emoji}</span>
                <p>${escapeHtml(g.caption)}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>`
    : '';

  // Build reservation form HTML
  const reservationHtml = config.reservation.enabled
    ? buildReservationForm(config)
    : '';

  // Build contact HTML
  const contactHtml = buildContactSection(config);

  // Assemble full HTML
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(config.businessName)} — ${escapeHtml(config.tagline || config.industry)}</title>
  <meta name="description" content="${escapeHtml(config.description || config.tagline)}">
  <meta property="og:title" content="${escapeHtml(config.businessName)}">
  <meta property="og:description" content="${escapeHtml(config.description)}">
  <meta property="og:type" content="website">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --primary: ${color};
      --primary-dark: ${darkenColor(color)};
      --bg: #0a0a0f;
      --bg-card: rgba(255,255,255,0.04);
      --text: #f0f0f5;
      --text-muted: #9ca3af;
      --border: rgba(255,255,255,0.08);
    }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'Inter', sans-serif;
      overflow-x: hidden;
    }
    h1, h2, h3, h4 { font-family: 'Space Grotesk', sans-serif; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
    .section { padding: 80px 0; }
    .section-title { font-size: 40px; font-weight: 700; text-align: center; margin-bottom: 12px; }
    .section-subtitle { text-align: center; color: var(--text-muted); margin-bottom: 48px; font-size: 18px; }
    .gradient-text {
      background: linear-gradient(135deg, var(--primary), #a855f7);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .glass { background: var(--bg-card); backdrop-filter: blur(16px); border: 1px solid var(--border); border-radius: 20px; }
    .btn-primary {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 14px 28px; background: linear-gradient(135deg, var(--primary), #a855f7);
      color: white; font-weight: 700; border-radius: 14px; text-decoration: none;
      border: none; cursor: pointer; font-size: 16px; font-family: 'Space Grotesk', sans-serif;
      transition: transform 0.2s; box-shadow: 0 8px 32px rgba(99,102,241,0.3);
    }
    .btn-primary:hover { transform: scale(1.03); }
    .btn-book {
      padding: 10px 20px; background: linear-gradient(135deg, var(--primary), #a855f7);
      color: white; font-weight: 600; border-radius: 12px; border: none; cursor: pointer;
      font-size: 14px; margin-top: 12px; transition: transform 0.2s;
    }
    .btn-book:hover { transform: scale(1.03); }
    /* Nav */
    nav { position: fixed; top: 0; left: 0; right: 0; z-index: 50; background: rgba(10,10,15,0.8); backdrop-filter: blur(16px); border-bottom: 1px solid var(--border); }
    nav .container { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; }
    .nav-logo { font-family: 'Space Grotesk'; font-weight: 700; font-size: 20px; }
    .nav-links { display: flex; gap: 24px; align-items: center; }
    .nav-links a { color: var(--text-muted); text-decoration: none; font-size: 14px; transition: color 0.2s; }
    .nav-links a:hover { color: white; }
    .hamburger { display: none; background: none; border: none; color: white; font-size: 24px; cursor: pointer; }
    @media (max-width: 768px) {
      .nav-links { display: none; position: absolute; top: 100%; left: 0; right: 0; flex-direction: column; background: var(--bg); padding: 16px; gap: 12px; }
      .nav-links.open { display: flex; }
      .hamburger { display: block; }
    }
    /* Hero */
    #hero { min-height: 100vh; display: flex; align-items: center; text-align: center; padding-top: 80px; position: relative; overflow: hidden; }
    .hero-content { position: relative; z-index: 1; }
    .hero h1 { font-size: 56px; line-height: 1.1; margin-bottom: 20px; }
    .hero p { font-size: 20px; color: var(--text-muted); max-width: 600px; margin: 0 auto 32px; }
    .hero-buttons { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
    .hero-stats { display: flex; gap: 48px; justify-content: center; margin-top: 48px; }
    .stat { text-align: center; }
    .stat-num { font-size: 36px; font-weight: 700; font-family: 'Space Grotesk'; }
    .stat-label { font-size: 13px; color: var(--text-muted); }
    .glow { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.15; pointer-events: none; }
    /* Services */
    .services-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; }
    .service-card { padding: 32px; text-align: center; transition: transform 0.2s; }
    .service-card:hover { transform: translateY(-4px); }
    .service-emoji { font-size: 48px; margin-bottom: 16px; }
    .service-card h3 { font-size: 20px; margin-bottom: 8px; }
    .service-card p { color: var(--text-muted); font-size: 14px; line-height: 1.6; margin-bottom: 12px; }
    .service-price { font-size: 20px; font-weight: 700; color: var(--primary); font-family: 'Space Grotesk'; }
    /* Pricing */
    .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; max-width: 900px; margin: 0 auto; }
    .pricing-card { padding: 32px; text-align: center; position: relative; }
    .pricing-card.popular { border-color: var(--primary); box-shadow: 0 0 32px rgba(99,102,241,0.15); }
    .popular-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: var(--primary); color: white; padding: 4px 12px; border-radius: 100px; font-size: 12px; font-weight: 700; }
    .pricing-card h3 { font-size: 22px; margin-bottom: 12px; }
    .pricing-card .price { font-size: 32px; font-weight: 700; font-family: 'Space Grotesk'; margin-bottom: 20px; }
    .pricing-card ul { list-style: none; text-align: left; margin-bottom: 24px; }
    .pricing-card li { padding: 6px 0; color: var(--text-muted); font-size: 14px; }
    /* Gallery */
    .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
    .gallery-item { padding: 24px; text-align: center; }
    .gallery-emoji { font-size: 56px; display: block; margin-bottom: 8px; }
    .gallery-item p { font-size: 13px; color: var(--text-muted); }
    /* Reservation form */
    .reservation-form { max-width: 600px; margin: 0 auto; padding: 40px; }
    .form-group { margin-bottom: 20px; }
    .form-group label { display: block; font-size: 13px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; }
    .form-group input, .form-group select, .form-group textarea {
      width: 100%; padding: 12px 16px; background: rgba(255,255,255,0.05); border: 1px solid var(--border);
      border-radius: 12px; color: white; font-size: 15px; font-family: 'Inter', sans-serif; outline: none;
      transition: border-color 0.2s;
    }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: var(--primary); }
    .form-group textarea { resize: vertical; min-height: 80px; }
    .form-success {
      padding: 16px; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3);
      border-radius: 12px; color: #10b981; text-align: center; margin-top: 16px; font-weight: 600;
    }
    /* Contact */
    .contact-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; max-width: 800px; margin: 0 auto; }
    .contact-item { text-align: center; padding: 24px; }
    .contact-icon { font-size: 32px; margin-bottom: 8px; }
    .contact-item h4 { font-size: 16px; margin-bottom: 4px; }
    .contact-item p { color: var(--text-muted); font-size: 14px; }
    /* Footer */
    footer { background: rgba(0,0,0,0.3); border-top: 1px solid var(--border); padding: 40px 0; text-align: center; }
    footer .container { display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .footer-links { display: flex; gap: 20px; }
    .footer-links a { color: var(--text-muted); text-decoration: none; font-size: 13px; }
    .copyright { color: var(--text-muted); font-size: 12px; }
    @media (max-width: 640px) {
      .hero h1 { font-size: 36px; }
      .hero p { font-size: 16px; }
      .section-title { font-size: 28px; }
      .hero-stats { gap: 24px; }
    }
  </style>
</head>
<body>
  <!-- Nav -->
  <nav>
    <div class="container">
      <span class="nav-logo">${escapeHtml(config.businessName)}</span>
      <button class="hamburger" onclick="toggleMenu()">☰</button>
      <div class="nav-links" id="navLinks">
        <a href="#services">${biz.type === 'restaurant' ? 'Menu' : 'Services'}</a>
        ${biz.hasPricing ? '<a href="#pricing">Tarifs</a>' : ''}
        ${biz.hasGallery ? '<a href="#gallery">Galerie</a>' : ''}
        ${config.reservation.enabled ? `<a href="#reservation">${escapeHtml(config.reservation.buttonText)}</a>` : ''}
        <a href="#contact">Contact</a>
        ${config.reservation.enabled ? `<a href="#reservation" class="btn-primary" style="padding:8px 20px;font-size:14px">${escapeHtml(config.reservation.buttonText)}</a>` : ''}
      </div>
    </div>
  </nav>

  <!-- Hero -->
  <section id="hero">
    <div class="glow" style="width:500px;height:500px;background:${color};top:-100px;right:-100px;"></div>
    <div class="glow" style="width:400px;height:400px;background:#a855f7;bottom:-100px;left:-100px;"></div>
    <div class="container hero-content">
      <h1>${escapeHtml(config.businessName)}<br><span class="gradient-text">${escapeHtml(config.tagline || biz.label)}</span></h1>
      <p>${escapeHtml(config.description || `Bienvenue chez ${config.businessName}, votre ${biz.label.toLowerCase()} de confiance en ${config.country}.`)}</p>
      <div class="hero-buttons">
        ${config.reservation.enabled ? `<a href="#reservation" class="btn-primary">${escapeHtml(config.reservation.buttonText)} →</a>` : ''}
        <a href="#services" class="btn-primary" style="background:rgba(255,255,255,0.08);border:1px solid var(--border)">Découvrir</a>
      </div>
      ${config.services.length > 0 ? `
      <div class="hero-stats">
        <div class="stat"><div class="stat-num">${config.services.length}</div><div class="stat-label">Services</div></div>
        <div class="stat"><div class="stat-num">${escapeHtml(config.country)}</div><div class="stat-label">Pays</div></div>
        <div class="stat"><div class="stat-num">24/7</div><div class="stat-label">Disponible</div></div>
      </div>` : ''}
    </div>
  </section>

  <!-- Services -->
  <section id="services" class="section">
    <div class="container">
      <h2 class="section-title">Nos <span class="gradient-text">${biz.type === 'restaurant' ? 'Plats' : 'Services'}</span></h2>
      <p class="section-subtitle">${escapeHtml(config.industry || biz.label)} — ${escapeHtml(config.country)}</p>
      <div class="services-grid">${servicesHtml}</div>
    </div>
  </section>

  ${pricingHtml}
  ${galleryHtml}
  ${reservationHtml}
  ${contactHtml}

  <!-- Footer -->
  <footer>
    <div class="container">
      <span class="nav-logo">${escapeHtml(config.businessName)}</span>
      <div class="footer-links">
        ${config.socialFacebook ? `<a href="${escapeHtml(config.socialFacebook)}" target="_blank">Facebook</a>` : ''}
        ${config.socialInstagram ? `<a href="${escapeHtml(config.socialInstagram)}" target="_blank">Instagram</a>` : ''}
        ${config.socialTikTok ? `<a href="${escapeHtml(config.socialTikTok)}" target="_blank">TikTok</a>` : ''}
      </div>
      <p class="copyright">© ${new Date().getFullYear()} ${escapeHtml(config.businessName)}. Tous droits réservés.</p>
      <p class="copyright" style="font-size:11px;opacity:0.5;">Site créé avec AfriLaunch AI 🚀</p>
    </div>
  </footer>

  <script>
    // Menu mobile
    function toggleMenu() {
      document.getElementById('navLinks').classList.toggle('open');
    }
    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(function(link) {
      link.addEventListener('click', function(e) {
        var href = this.getAttribute('href');
        if (href === '#' || href.length < 2) return;
        var target = document.querySelector(href);
        if (target) { e.preventDefault(); target.scrollIntoView({behavior:'smooth',block:'start'}); }
        document.getElementById('navLinks').classList.remove('open');
      });
    });
    // Scroll to reservation with pre-selected service
    function scrollToReservation(serviceName) {
      var target = document.getElementById('reservation');
      if (target) target.scrollIntoView({behavior:'smooth',block:'start'});
      var serviceSelect = document.querySelector('#reservation-form select[name="service"]');
      if (serviceSelect) {
        for (var i = 0; i < serviceSelect.options.length; i++) {
          if (serviceSelect.options[i].text === serviceName) {
            serviceSelect.selectedIndex = i; break;
          }
        }
      }
    }
    // Active nav highlight
    window.addEventListener('scroll', function() {
      var sections = document.querySelectorAll('section[id]');
      var navItems = document.querySelectorAll('.nav-links a[href^="#"]');
      var current = '';
      sections.forEach(function(s) { if (window.scrollY >= s.offsetTop - 100) current = s.id; });
      navItems.forEach(function(item) {
        item.classList.remove('text-white');
        if (item.getAttribute('href') === '#' + current) item.classList.add('text-white');
      });
    });
    ${config.reservation.enabled ? buildReservationJs(config) : ''}
  </script>
</body>
</html>`;
}

function buildReservationForm(config: WebsiteConfig): string {
  const r = config.reservation;
  const biz = getBusinessTypeInfo(config.businessType);

  const fieldsHtml = r.fields.map((fieldKey) => {
    const field = FIELD_LABELS[fieldKey];
    if (!field) return '';

    if (field.type === 'select' || fieldKey === 'service') {
      const options = config.services.map((s) => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)}${s.price ? ' — ' + escapeHtml(s.price) : ''}</option>`).join('');
      return `
        <div class="form-group">
          <label>${field.label}</label>
          <select name="${fieldKey}" required>
            <option value="">Choisir...</option>
            ${options}
          </select>
        </div>`;
    }
    if (field.type === 'textarea') {
      return `
        <div class="form-group">
          <label>${field.label}</label>
          <textarea name="${fieldKey}" placeholder="${field.placeholder}"></textarea>
        </div>`;
    }
    return `
      <div class="form-group">
        <label>${field.label}</label>
        <input type="${field.type}" name="${fieldKey}" placeholder="${field.placeholder}" required>
      </div>`;
  }).join('');

  return `
    <section id="reservation" class="section">
      <div class="container">
        <h2 class="section-title">${escapeHtml(r.buttonText) === 'Réserver' ? 'Réserver' : 'Nous <span class="gradient-text">Contacter</span>'}</h2>
        <p class="section-subtitle">Remplissez le formulaire et nous vous répondrons rapidement</p>
        <div class="reservation-form glass">
          <form id="reservation-form" onsubmit="return handleReservation(event)">
            ${fieldsHtml}
            <button type="submit" class="btn-primary" style="width:100%;justify-content:center">${escapeHtml(r.buttonText)} →</button>
          </form>
          <div id="form-success" style="display:none"></div>
        </div>
      </div>
    </section>`;
}

function buildReservationJs(config: WebsiteConfig): string {
  const r = config.reservation;
  let js = `
    function handleReservation(e) {
      e.preventDefault();
      var form = e.target;
      var inputs = form.querySelectorAll('input, select, textarea');
      var message = 'Bonjour ' + ${JSON.stringify(config.businessName)} + '!\\n\\nJe souhaite ${r.buttonText.toLowerCase()}.\\n\\n';
      inputs.forEach(function(input) {
        if (input.value && input.type !== 'submit') {
          var label = input.previousElementSibling ? input.previousElementSibling.textContent : input.name;
          message += label + ': ' + input.value + '\\n';
        }
      });
      message += '\\nMerci de me confirmer la disponibilité.';

      var successDiv = document.getElementById('form-success');
      successDiv.style.display = 'block';
      successDiv.className = 'form-success';

  `;

  if (r.type === 'whatsapp' && r.whatsappNumber) {
    const phone = r.whatsappNumber.replace(/[^0-9]/g, '');
    js += `
      successDiv.innerHTML = '✓ Demande envoyée ! Redirection vers WhatsApp...';
      var url = 'https://wa.me/${phone}?text=' + encodeURIComponent(message);
      setTimeout(function() { window.location.href = url; }, 1500);
    `;
  } else if (r.type === 'phone' && r.phoneNumber) {
    js += `
      successDiv.innerHTML = '✓ Demande envoyée ! Appelez-nous au ${r.phoneNumber}';
      var url = 'tel:${r.phoneNumber.replace(/[^0-9+]/g, '')}';
      setTimeout(function() { window.location.href = url; }, 1500);
    `;
  } else if (r.type === 'email' && r.email) {
    js += `
      successDiv.innerHTML = '✓ Redirection vers votre email...';
      var url = 'mailto:${r.email}?subject=Reservation&body=' + encodeURIComponent(message);
      setTimeout(function() { window.location.href = url; }, 1500);
    `;
  } else {
    js += `
      successDiv.innerHTML = '✓ Demande envoyée ! Nous vous répondrons rapidement.';
    `;
  }

  js += `
      form.reset();
      return false;
    }
  `;
  return js;
}

function buildContactSection(config: WebsiteConfig): string {
  const items: string[] = [];
  if (config.contactPhone) items.push(`<div class="contact-item glass"><div class="contact-icon">📞</div><h4>Téléphone</h4><p><a href="tel:${config.contactPhone.replace(/[^0-9+]/g, '')}" style="color:inherit;text-decoration:none">${escapeHtml(config.contactPhone)}</a></p></div>`);
  if (config.contactEmail) items.push(`<div class="contact-item glass"><div class="contact-icon">✉️</div><h4>Email</h4><p><a href="mailto:${config.contactEmail}" style="color:inherit;text-decoration:none">${escapeHtml(config.contactEmail)}</a></p></div>`);
  if (config.contactAddress) items.push(`<div class="contact-item glass"><div class="contact-icon">📍</div><h4>Adresse</h4><p>${escapeHtml(config.contactAddress)}</p></div>`);
  if (config.contactWhatsApp) items.push(`<div class="contact-item glass"><div class="contact-icon">💬</div><h4>WhatsApp</h4><p><a href="https://wa.me/${config.contactWhatsApp.replace(/[^0-9]/g, '')}" target="_blank" style="color:inherit;text-decoration:none">${escapeHtml(config.contactWhatsApp)}</a></p></div>`);

  if (items.length === 0) return '';

  return `
    <section id="contact" class="section">
      <div class="container">
        <h2 class="section-title">Nous <span class="gradient-text">Contacter</span></h2>
        <p class="section-subtitle">${escapeHtml(config.businessName)} — ${escapeHtml(config.country)}</p>
        <div class="contact-grid">${items.join('')}</div>
      </div>
    </section>`;
}

// ─── Utils ─────────────────────────────────────────────────────────────
function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function darkenColor(hex: string): string {
  // Simple darkening: reduce each channel by 20%
  const match = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!match) return hex;
  const r = Math.round(parseInt(match[1], 16) * 0.7).toString(16).padStart(2, '0');
  const g = Math.round(parseInt(match[2], 16) * 0.7).toString(16).padStart(2, '0');
  const b = Math.round(parseInt(match[3], 16) * 0.7).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}
