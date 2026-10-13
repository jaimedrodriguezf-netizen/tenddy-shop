/**
 * PlastPET - Servicios Industriales de Inyección, Soplado y Moldes
 */

class ServicesManager {
    constructor() {
        this.selectedService = null;
        this.init();
    }

    init() {
        this.renderServices();
        this.setupEventListeners();
    }

    renderServices() {
        const grid = document.getElementById('services-grid');
        if (!grid) return;

        grid.innerHTML = SERVICES.map(serv => `
            <article class="service-card" data-id="${escapeHtml(serv.id)}">
                <div class="service-card-media">
                    <img src="${escapeHtml(serv.image)}" alt="${escapeHtml(serv.title)}" class="service-img" loading="lazy">
                    <div class="service-icon-bubble">${escapeHtml(serv.icon)}</div>
                    <div class="service-duration-badge">⏱️ ${escapeHtml(serv.duration)}</div>
                </div>
                <div class="service-card-body">
                    <h3 class="service-title">${escapeHtml(serv.title)}</h3>
                    <p class="service-tagline">${escapeHtml(serv.tagline || '')}</p>
                    
                    <div class="service-features-box">
                        <h4>¿Qué incluye el servicio industrial?</h4>
                        <ul class="service-feature-list">
                            ${(serv.features || []).map(f => `
                                <li>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="check-icon"><polyline points="20 6 9 17 4 12"/></svg>
                                    <span>${escapeHtml(f)}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>

                    <div class="service-card-actions">
                        <button type="button" class="btn btn-whatsapp btn-block" data-action="book-service" data-service-id="${escapeHtml(serv.id)}">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.057-2.148-.528-1.517-.613-2.508-2.143-2.584-2.245-.075-.101-.616-.818-.616-1.56 0-.742.39-1.107.528-1.258.138-.151.301-.189.402-.189.101 0 .202.002.29.006.094.005.22-.036.344.263.126.302.43 1.05.468 1.127.038.077.063.167.013.268-.05.101-.076.164-.151.252-.076.088-.16.196-.228.263-.076.076-.155.158-.067.31.088.151.393.649.843 1.049.578.514 1.066.673 1.217.749.151.075.24.063.328-.038.089-.101.378-.44.479-.592.101-.151.202-.126.34-.075.138.05 8.78 4.14 1.026.479.076.038.126.063.151.101.025.038.025.227-.119.632z"/></svg>
                            Cotizar Servicio por WhatsApp
                        </button>
                    </div>
                </div>
            </article>
        `).join('');
    }

    openBookingModal(serviceId) {
        const serv = SERVICES.find(s => s.id === serviceId);
        if (!serv) return;
        this.selectedService = serv;

        const modal = document.getElementById('service-booking-modal');
        const titleEl = document.getElementById('booking-modal-service-title');
        const priceEl = document.getElementById('booking-modal-service-price');
        const iconEl = document.getElementById('booking-modal-service-icon');

        if (titleEl) titleEl.textContent = serv.title;
        if (priceEl) priceEl.textContent = `⏱️ ${serv.duration}`;
        if (iconEl) iconEl.textContent = serv.icon;

        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeBookingModal() {
        const modal = document.getElementById('service-booking-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
        this.selectedService = null;
    }

    setupEventListeners() {
        const grid = document.getElementById('services-grid');
        if (grid) {
            grid.addEventListener('click', (e) => {
                const bookBtn = e.target.closest('[data-action="book-service"]');
                if (bookBtn) {
                    const servId = bookBtn.dataset.serviceId;
                    if (servId) this.openBookingModal(servId);
                }
            });
        }

        const bookingForm = document.getElementById('service-booking-form');
        if (bookingForm) {
            bookingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.sendBookingWhatsApp();
            });
        }

        const closeBtns = document.querySelectorAll('.trigger-booking-close');
        closeBtns.forEach(b => b.addEventListener('click', () => this.closeBookingModal()));

        const modal = document.getElementById('service-booking-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeBookingModal();
            });
        }
    }

    sendBookingWhatsApp() {
        if (!this.selectedService) return;

        const name = document.getElementById('booking-contact-name')?.value.trim();
        const company = document.getElementById('booking-company')?.value.trim();
        const phone = document.getElementById('booking-phone')?.value.trim();
        const city = document.getElementById('booking-city')?.value.trim();
        const volume = document.getElementById('booking-volume')?.value;
        const notes = document.getElementById('booking-details')?.value.trim();

        if (!name || !phone || !city) {
            if (cartManager) cartManager.showToast('Por favor completa los campos requeridos (*)', 'error');
            return;
        }

        let msg = `⚙️ *SOLICITUD DE SERVICIO INDUSTRIAL - ${CONFIG.businessName.toUpperCase()}* ⚙️\n\n`;
        msg += `✨ *Servicio:* ${this.selectedService.title}\n\n`;
        msg += `👤 *Contacto:* ${name}\n`;
        msg += `🏢 *Empresa / Proyecto:* ${company || 'Particular / En emprendimiento'}\n`;
        msg += `📱 *Teléfono:* ${phone}\n`;
        msg += `📍 *Ciudad / Ubicación:* ${city}\n`;
        msg += `📊 *Volumen / Escala requerida:* ${volume || 'Por definir'}\n`;
        if (notes) {
            msg += `📝 *Detalles del proyecto / requerimiento:* ${notes}\n`;
        }
        msg += `\nSolicito asesoría técnica y cotización. ¡Muchas gracias!`;

        const waUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
        window.open(waUrl, '_blank');
        this.closeBookingModal();
        if (cartManager) cartManager.showToast('¡Redirigiendo a WhatsApp para coordinar tu servicio industrial!', 'success');
    }
}

let servicesManager;
document.addEventListener('DOMContentLoaded', () => {
    servicesManager = new ServicesManager();
});
window.ServicesManager = ServicesManager;
if (document.readyState === "complete" || document.readyState === "interactive") {
    if (!window.servicesManager) window.servicesManager = new ServicesManager();
} else {
    document.addEventListener("DOMContentLoaded", () => {
        if (!window.servicesManager) window.servicesManager = new ServicesManager();
    });
}
