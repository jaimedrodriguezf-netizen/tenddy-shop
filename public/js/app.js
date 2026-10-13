/**
 * AYME INDUSTRIAS PET - Controlador Principal, Vistas y WhatsApp B2B
 */

class App {
    constructor() {
        this.currentView = 'home';
        this.init();
    }

    init() {
        this.setupNavigation();
        this.renderHomeFeatured();
        this.renderTestimonials();
        this.renderFaqs();
        this.setupFaqAccordion();
        this.setupContactForm();
        this.setupFloatingWhatsApp();
        this.setupMobileMenu();
        this.handleHashChange();
        window.addEventListener('hashchange', () => this.handleHashChange());

        window.addEventListener('scroll', () => {
            const headerWrapper = document.getElementById('fixed-header-wrapper');
            if (headerWrapper) {
                if (window.scrollY > 40) {
                    headerWrapper.classList.add('scrolled');
                } else {
                    headerWrapper.classList.remove('scrolled');
                }
            }
        });
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('[data-nav-target]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.dataset.navTarget;
                window.location.hash = target;
                this.switchView(target);
                const mobileMenu = document.getElementById('mobile-nav-menu');
                const overlay = document.getElementById('mobile-menu-overlay');
                if (mobileMenu) mobileMenu.classList.remove('active');
                if (overlay) overlay.classList.remove('active');
            });
        });
    }

    handleHashChange() {
        const hash = window.location.hash.replace('#', '') || 'home';
        const validViews = ['home', 'servicios', 'productos', 'contacto'];
        if (validViews.includes(hash)) {
            this.switchView(hash);
        } else {
            this.switchView('home');
        }
    }

    switchView(viewName) {
        this.currentView = viewName;
        
        const views = document.querySelectorAll('.page-view');
        views.forEach(v => {
            if (v.id === `view-${viewName}`) {
                v.classList.add('active');
            } else {
                v.classList.remove('active');
            }
        });

        const navLinks = document.querySelectorAll('[data-nav-target]');
        navLinks.forEach(link => {
            if (link.dataset.navTarget === viewName) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        const headerWrapper = document.getElementById('fixed-header-wrapper');
        if (headerWrapper) {
            if (viewName === 'home') {
                headerWrapper.classList.remove('solid-header');
            } else {
                headerWrapper.classList.add('solid-header');
            }
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (viewName === 'productos' && productCatalog) {
            productCatalog.renderProducts();
        }
    }

    renderHomeFeatured() {
        const container = document.getElementById('home-featured-products');
        if (!container) return;

        const list = window.PRODUCTS || (typeof PRODUCTS !== 'undefined' ? PRODUCTS : []) || [];
        const featured = list.slice(0, 5);

        if (featured.length === 0) {
            container.innerHTML = '';
            return;
        }

        if (window.productCatalog) {
            container.innerHTML = featured.map(prod => window.productCatalog.generateCardHTML(prod)).join('');
        } else {
            const cats = window.CATEGORIES || (typeof CATEGORIES !== 'undefined' ? CATEGORIES : []) || [];
            container.innerHTML = featured.map(prod => {
                const categoryName = prod.categoryName || cats.find(c => c && c.id === prod.category)?.name || 'Catálogo General';
                const specPill = prod.specs?.boca ? `Boca: ${prod.specs.boca}` : (prod.specs?.ancho ? `Medida: ${prod.specs.ancho}` : (prod.badge || 'Producto'));

                return `
                <article class="product-card technical-b2b-card" data-id="${escapeHtml(prod.id)}">
                    <div class="product-card-media">
                        ${prod.badge ? `<span class="product-badge">${escapeHtml(prod.badge)}</span>` : ''}
                        <button type="button" class="btn-quick-view" data-action="quick-view" data-product-id="${escapeHtml(prod.id)}" title="Ver Ficha Técnica">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                            Ficha Técnica & Plano
                        </button>
                        <img src="${escapeHtml(prod.image)}" alt="${escapeHtml(prod.name)}" class="product-img" loading="lazy">
                    </div>
                    <div class="product-card-body">
                        <div class="product-meta">
                            <span class="product-tag">${escapeHtml(categoryName)}</span>
                            <span class="product-tag tag-accent-pill">
                                ${escapeHtml(specPill)}
                            </span>
                        </div>
                        <h3 class="product-title" data-action="quick-view" data-product-id="${escapeHtml(prod.id)}" title="${escapeHtml(prod.name)}">
                            ${escapeHtml(prod.name)}
                        </h3>
                        <div class="product-card-footer-technical" style="margin-top: auto; padding-top: 1rem;">
                            <button type="button" class="btn btn-outline btn-block" data-action="quick-view" data-product-id="${escapeHtml(prod.id)}" style="font-size: 0.84rem; padding: 0.55rem;">
                                📋 Ver Plano Técnico
                            </button>
                            <button type="button" class="btn btn-whatsapp btn-block" data-action="direct-wa" data-product-id="${escapeHtml(prod.id)}" style="font-size: 0.84rem; padding: 0.55rem;">
                                💬 Cotizar por WhatsApp
                            </button>
                        </div>
                    </div>
                </article>
            `;
            }).join('');
        }

        if (!container.dataset.listenerAttached) {
            container.dataset.listenerAttached = 'true';
            container.addEventListener('click', (e) => {
                const qvBtn = e.target.closest('[data-action="quick-view"]');
                if (qvBtn) {
                    const card = qvBtn.closest('.product-card');
                    const pid = qvBtn.dataset.productId || card?.dataset.id;
                    if (pid && window.productCatalog) window.productCatalog.openQuickView(pid);
                    return;
                }
                const waBtn = e.target.closest('[data-action="direct-wa"]');
                if (waBtn) {
                    const card = waBtn.closest('.product-card');
                    const pid = waBtn.dataset.productId || card?.dataset.id;
                    if (pid && window.productCatalog) window.productCatalog.handleDirectWhatsApp(pid);
                    return;
                }
            });
        }
    }

    renderTestimonials() {
        const container = document.getElementById('testimonials-grid');
        if (!container) return;

        container.innerHTML = TESTIMONIALS.map(t => `
            <div class="testimonial-card">
                <div class="testimonial-stars">★★★★★</div>
                <p class="testimonial-quote">"${escapeHtml(t.text)}"</p>
                <div class="testimonial-author">
                    <img src="${escapeHtml(t.avatar)}" alt="${escapeHtml(t.name)}" class="author-avatar" loading="lazy">
                    <div class="author-info">
                        <h4 class="author-name">${escapeHtml(t.name)}</h4>
                        <span class="author-pet" style="color: var(--accent); font-weight: 600;">${escapeHtml(t.company || t.pet || '')}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderFaqs() {
        const container = document.getElementById('faqs-accordion-container');
        if (!container) return;

        container.innerHTML = FAQS.map((faq, idx) => `
            <div class="faq-item ${idx === 0 ? 'active' : ''}">
                <button type="button" class="faq-question">
                    <span>${escapeHtml(faq.q)}</span>
                    <span class="faq-icon">${idx === 0 ? '−' : '+'}</span>
                </button>
                <div class="faq-answer" style="${idx === 0 ? 'max-height: 250px;' : 'max-height: 0;'}">
                    <p>${escapeHtml(faq.a)}</p>
                </div>
            </div>
        `).join('');
    }

    setupFaqAccordion() {
        const container = document.getElementById('faqs-accordion-container');
        if (!container) return;

        container.addEventListener('click', (e) => {
            const btn = e.target.closest('.faq-question');
            if (!btn) return;

            const item = btn.parentElement;
            const isOpen = item.classList.contains('active');
            const answer = item.querySelector('.faq-answer');
            const icon = item.querySelector('.faq-icon');

            container.querySelectorAll('.faq-item').forEach(otherItem => {
                otherItem.classList.remove('active');
                const otherAns = otherItem.querySelector('.faq-answer');
                const otherIcon = otherItem.querySelector('.faq-icon');
                if (otherAns) otherAns.style.maxHeight = '0';
                if (otherIcon) otherIcon.textContent = '+';
            });

            if (!isOpen) {
                item.classList.add('active');
                if (answer) answer.style.maxHeight = `${answer.scrollHeight + 30}px`;
                if (icon) icon.textContent = '−';
            }
        });
    }

    setupContactForm() {
        const generalForm = document.getElementById('general-contact-form');
        if (generalForm) {
            generalForm.addEventListener('submit', (e) => {
                e.preventDefault();

                const name = document.getElementById('contact-name')?.value.trim();
                const company = document.getElementById('contact-company')?.value.trim();
                const phone = document.getElementById('contact-phone')?.value.trim();
                const email = document.getElementById('contact-email')?.value.trim();
                const city = document.getElementById('contact-city')?.value.trim();
                const subject = document.getElementById('contact-subject')?.value;
                const message = document.getElementById('contact-message')?.value.trim();

                let waMsg = `🏭 *SOLICITUD DE COTIZACIÓN - ${CONFIG.businessName}*\n`;
                waMsg += `👤 *Contacto:* ${name}\n`;
                if (company) waMsg += `🏢 *Empresa:* ${company}\n`;
                waMsg += `📱 *Teléfono:* ${phone}\n`;
                if (email) waMsg += `📧 *Email:* ${email}\n`;
                if (city) waMsg += `📍 *Ciudad:* ${city}\n`;
                waMsg += `📦 *Requerimiento:* ${subject}\n`;
                waMsg += `💬 *Detalles:* ${message}\n\n`;
                waMsg += `Solicito cotización y asesoría comercial.`;

                const waUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(waMsg)}`;
                window.open(waUrl, '_blank');
                generalForm.reset();
            });
        }

        const homeForm = document.getElementById('home-contact-form');
        if (homeForm) {
            homeForm.addEventListener('submit', (e) => {
                e.preventDefault();

                const name = document.getElementById('home-contact-name')?.value.trim();
                const company = document.getElementById('home-contact-company')?.value.trim();
                const phone = document.getElementById('home-contact-phone')?.value.trim();
                const city = document.getElementById('home-contact-city')?.value.trim();
                const type = document.getElementById('home-contact-type')?.value;
                const msg = document.getElementById('home-contact-msg')?.value.trim();

                let waMsg = `🏭 *CONSULTA DIRECTA - ${CONFIG.businessName}*\n`;
                waMsg += `👤 *Contacto:* ${name}\n`;
                if (company) waMsg += `🏢 *Empresa:* ${company}\n`;
                waMsg += `📱 *Teléfono:* ${phone}\n`;
                if (city) waMsg += `📍 *Ciudad:* ${city}\n`;
                waMsg += `📦 *Línea Solicitada:* ${type}\n`;
                waMsg += `💬 *Detalle / Cantidad:* ${msg}\n\n`;
                waMsg += `Solicito atención comercial y cotización mayorista.`;

                const waUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(waMsg)}`;
                window.open(waUrl, '_blank');
                homeForm.reset();
            });
        }
    }

    setupFloatingWhatsApp() {
        const toggleBtn = document.getElementById('wa-floating-btn');
        const popover = document.getElementById('wa-chat-popover');
        const closeBtn = document.getElementById('wa-popover-close');

        if (toggleBtn && popover) {
            toggleBtn.addEventListener('click', () => {
                popover.classList.toggle('active');
            });
        }

        if (closeBtn && popover) {
            closeBtn.addEventListener('click', () => {
                popover.classList.remove('active');
            });
        }

        const quickActions = document.querySelectorAll('[data-wa-action]');
        quickActions.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.waAction;
                let text = `¡Hola ${CONFIG.businessName}! `;

                if (action === 'catalog') {
                    text += "Quiero solicitar el catálogo completo de envases PET, tapas y cotización mayorista.";
                } else if (action === 'services') {
                    text += "Quiero cotizar la fabricación de un molde a medida o maquila de soplado para mi producto.";
                } else if (action === 'samples') {
                    text += "Quisiera solicitar un kit de muestras físicas de envases para pruebas de envasado.";
                } else if (action === 'general') {
                    text += "Tengo una consulta comercial sobre despachos y tiempos de entrega.";
                }

                const waUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
                window.open(waUrl, '_blank');
                if (popover) popover.classList.remove('active');
            });
        });
    }

    setupMobileMenu() {
        const menuBtn = document.getElementById('mobile-menu-toggle');
        const closeBtn = document.getElementById('mobile-menu-close');
        const mobileMenu = document.getElementById('mobile-nav-menu');
        const overlay = document.getElementById('mobile-menu-overlay');

        if (menuBtn && mobileMenu) {
            menuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('active');
                if (overlay) overlay.classList.toggle('active');
            });
        }

        if (closeBtn && mobileMenu) {
            closeBtn.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                if (overlay) overlay.classList.remove('active');
            });
        }

        if (overlay && mobileMenu) {
            overlay.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                overlay.classList.remove('active');
            });
        }
    }
}

let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new App();
});
window.App = App;
if (document.readyState === "complete" || document.readyState === "interactive") {
    if (!window.appInstance) window.appInstance = new App();
} else {
    document.addEventListener("DOMContentLoaded", () => {
        if (!window.appInstance) window.appInstance = new App();
    });
}
