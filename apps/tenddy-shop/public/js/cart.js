/**
 * AYME INDUSTRIAS PET - Gestor de Lista de Cotización Mayorista (B2B sin precios)
 */

class CartManager {
    constructor() {
        this.items = this.loadCart();
        this.init();
    }

    init() {
        this.updateBadge();
        this.renderDrawer();
        this.setupEventListeners();
    }

    loadCart() {
        try {
            const saved = localStorage.getItem('ayme_pet_quote_list');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    }

    saveCart() {
        try {
            localStorage.setItem('ayme_pet_quote_list', JSON.stringify(this.items));
        } catch (e) {
            console.error('Error saving quote list', e);
        }
        this.updateBadge();
        this.renderDrawer();
    }

    addItem(productId, quantity = 1) {
        const prodList = window.PRODUCTS || (typeof PRODUCTS !== 'undefined' ? PRODUCTS : []) || [];
        const prod = prodList.find(p => p.id === productId || p.dbId === productId);
        if (!prod) return;

        const existing = this.items.find(item => item.id === prod.id || (prod.dbId && item.dbId === prod.dbId));
        if (existing) {
            existing.quantity += quantity;
        } else {
            this.items.push({
                id: prod.id,
                dbId: prod.dbId || (typeof prod.id === 'string' && prod.id.length === 36 ? prod.id : undefined),
                sku: prod.sku || prod.id,
                name: prod.name,
                image: prod.image,
                packSize: prod.packSize || 100,
                specs: prod.specs || {},
                quantity: quantity
            });
        }
        this.saveCart();
        this.showToast(`Agregado a la lista de cotización: ${prod.name}`, 'success');
    }

    updateQuantity(productId, newQty) {
        if (newQty <= 0) {
            this.removeItem(productId);
            return;
        }
        const item = this.items.find(i => i.id === productId);
        if (item) {
            item.quantity = newQty;
            this.saveCart();
        }
    }

    removeItem(productId) {
        this.items = this.items.filter(i => i.id !== productId);
        this.saveCart();
        this.showToast('Referencia eliminada de la lista', 'info');
    }

    clearCart() {
        this.items = [];
        this.saveCart();
    }

    getTotalItemCount() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    getTotalEstimatedUnits() {
        return this.items.reduce((sum, item) => sum + (item.quantity * item.packSize), 0);
    }

    updateBadge() {
        const count = this.items.length;
        const badges = document.querySelectorAll('.cart-badge-count');
        badges.forEach(b => {
            b.textContent = count;
            b.style.display = count > 0 ? 'inline-flex' : 'none';
        });
    }

    renderDrawer() {
        const container = document.getElementById('cart-items-container');
        const emptyState = document.getElementById('cart-empty-state');
        const summarySection = document.getElementById('cart-summary-section');
        const unitsVal = document.getElementById('cart-total-units-val');
        const itemsCountVal = document.getElementById('cart-total-items-val');

        if (!container) return;

        if (this.items.length === 0) {
            if (emptyState) emptyState.style.display = 'flex';
            if (summarySection) summarySection.style.display = 'none';
            container.innerHTML = '';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';
        if (summarySection) summarySection.style.display = 'flex';

        const totalUnits = this.getTotalEstimatedUnits();
        if (unitsVal) unitsVal.textContent = `${totalUnits.toLocaleString()} unidades aprox.`;
        if (itemsCountVal) itemsCountVal.textContent = `${this.items.length} modelo(s)`;

        container.innerHTML = this.items.map(item => `
            <div class="cart-item" data-id="${escapeHtml(item.id)}">
                <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" class="cart-item-img">
                <div class="cart-item-info">
                    <h4 class="cart-item-title">${escapeHtml(item.name)}</h4>
                    <div class="cart-item-unit-price">
                        ${item.specs?.boca ? `Boca: ${escapeHtml(item.specs.boca)} | ` : ''}Fardo x ${escapeHtml(item.packSize)} u.
                    </div>
                    <div class="cart-item-actions">
                        <div class="quantity-controller">
                            <button type="button" class="btn-qty" data-action="qty-minus" data-id="${escapeHtml(item.id)}" title="Reducir paquetes">−</button>
                            <span class="qty-display">${escapeHtml(item.quantity)} paq.</span>
                            <button type="button" class="btn-qty" data-action="qty-plus" data-id="${escapeHtml(item.id)}" title="Aumentar paquetes">+</button>
                        </div>
                        <div style="font-size: 0.8rem; font-weight: 700; color: var(--primary);">
                            ${(item.quantity * item.packSize).toLocaleString()} u.
                        </div>
                        <button type="button" class="btn-remove-item" data-action="remove-item" data-id="${escapeHtml(item.id)}" title="Eliminar referencia">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    openDrawer() {
        const drawer = document.getElementById('cart-drawer');
        const overlay = document.getElementById('cart-overlay');
        if (drawer && overlay) {
            drawer.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeDrawer() {
        const drawer = document.getElementById('cart-drawer');
        const overlay = document.getElementById('cart-overlay');
        if (drawer && overlay) {
            drawer.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    setupEventListeners() {
        const openBtns = document.querySelectorAll('.trigger-cart-open');
        openBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openDrawer();
            });
        });

        const closeBtns = document.querySelectorAll('.trigger-cart-close');
        closeBtns.forEach(btn => {
            btn.addEventListener('click', () => this.closeDrawer());
        });

        const overlay = document.getElementById('cart-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.closeDrawer());
        }

        const itemsContainer = document.getElementById('cart-items-container');
        if (itemsContainer) {
            itemsContainer.addEventListener('click', (e) => {
                const itemEl = e.target.closest('.cart-item');
                const id = itemEl?.dataset.id;
                if (!id) return;

                const item = this.items.find(i => i.id === id);
                if (!item) return;

                const minusBtn = e.target.closest('[data-action="qty-minus"]');
                if (minusBtn) {
                    this.updateQuantity(id, item.quantity - 1);
                    return;
                }

                const plusBtn = e.target.closest('[data-action="qty-plus"]');
                if (plusBtn) {
                    this.updateQuantity(id, item.quantity + 1);
                    return;
                }

                const removeBtn = e.target.closest('[data-action="remove-item"]');
                if (removeBtn) {
                    this.removeItem(id);
                    return;
                }
            });
        }

        const checkoutForm = document.getElementById('whatsapp-checkout-form');
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.sendWhatsAppQuotation();
            });
        }
    }

    sendWhatsAppQuotation() {
        if (this.items.length === 0) {
            this.showToast('Tu lista de cotización está vacía', 'error');
            return;
        }

        const name = document.getElementById('cust-name')?.value.trim();
        const company = document.getElementById('cust-company')?.value.trim();
        const phone = document.getElementById('cust-phone')?.value.trim();
        const city = document.getElementById('cust-city')?.value.trim();
        const color = document.getElementById('cust-color')?.value;
        const notes = document.getElementById('cust-notes')?.value.trim();

        if (!name || !phone || !city) {
            this.showToast('Por favor completa los campos requeridos (*)', 'error');
            return;
        }

        let msg = `🏭 *SOLICITUD DE COTIZACIÓN - ${CONFIG.businessName}* 🏭\n`;
        msg += `*${CONFIG.subtitle}*\n\n`;
        msg += `👤 *Contacto:* ${name}\n`;
        msg += `🏢 *Empresa:* ${company || 'Particular / En emprendimiento'}\n`;
        msg += `📱 *Teléfono:* ${phone}\n`;
        msg += `📍 *Ciudad de Destino:* ${city}\n`;
        msg += `🎨 *Preferencia de Color:* ${color || 'Cristal Transparente'}\n`;
        if (notes) {
            msg += `📝 *Notas:* ${notes}\n`;
        }
        msg += `\n📦 *LISTA DE ENVASES SOLICITADOS:*\n`;
        msg += `------------------------------------\n`;

        this.items.forEach((item, index) => {
            const units = item.quantity * item.packSize;
            msg += `${index + 1}. *${item.name}*\n`;
            msg += `   • Cantidad: ${item.quantity} paq. (${units.toLocaleString()} unidades)\n`;
            if (item.specs?.boca) msg += `   • Boca/Rosca: ${item.specs.boca}\n`;
            if (item.specs?.gramaje) msg += `   • Gramaje: ${item.specs.gramaje}\n`;
            msg += `\n`;
        });

        const totalUnits = this.getTotalEstimatedUnits();
        msg += `------------------------------------\n`;
        msg += `📊 *Total de Envases Requeridos:* ~${totalUnits.toLocaleString()} unidades\n\n`;
        msg += `Agradecemos nos compartan disponibilidad y cotización formal por escala mayorista.`;

        // Registrar cotización en Supabase para trazabilidad en el backoffice de AYME PET
        const tenantId = window.TENANT_ID || 'c2f7cdd7-d590-4a73-a8e8-0c3f120a7dbe';
        const quotePayload = {
            tenant_id: tenantId,
            customer_name: name,
            company_name: company || null,
            customer_phone: phone,
            delivery_city: city || null,
            notes: [
                color ? `Preferencia de color: ${color}` : '',
                notes ? `Notas: ${notes}` : ''
            ].filter(Boolean).join(' | ') || null,
            items: this.items.map(item => ({
                product_id: item.dbId || (typeof item.id === 'string' && item.id.length === 36 ? item.id : undefined),
                name: item.name,
                sku: item.sku || item.id,
                package_count: item.quantity,
                units_per_package: item.packSize || 100,
                total_units: item.quantity * (item.packSize || 100),
                selected_color: color || undefined,
                specs: item.specs || {}
            })),
            _form_rendered_at: Date.now() - 3000,
        };

        try {
            fetch('/api/quotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(quotePayload)
            })
            .then(res => res.json())
            .then(data => {
                if (data && data.success) {
                    console.log('Cotización registrada en sistema con consecutivo:', data.quote?.quote_number);
                }
            })
            .catch(err => {
                console.warn('Registro de cotización offline/silencioso:', err);
            });
        } catch (e) {
            // Ignorar errores de red para no interrumpir el flujo del usuario hacia WhatsApp
        }

        const waUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
        window.open(waUrl, '_blank');
        this.showToast('¡Cotización registrada y redirigiendo a WhatsApp!', 'success');
        this.closeDrawer();
    }

    showToast(message, type = 'info') {
        let container = document.getElementById('toast-notifications-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-notifications-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `pet-toast toast-${type}`;
        
        let icon = 'ℹ️';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '⚠️';

        toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;
        container.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }
}

let cartManager;
document.addEventListener('DOMContentLoaded', () => {
    cartManager = new CartManager();
});
window.CartManager = CartManager;
if (document.readyState === "complete" || document.readyState === "interactive") {
    if (!window.cartManager) window.cartManager = new CartManager();
} else {
    document.addEventListener("DOMContentLoaded", () => {
        if (!window.cartManager) window.cartManager = new CartManager();
    });
}
