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
        const prod = PRODUCTS.find(p => p.id === productId);
        if (!prod) return;

        const existing = this.items.find(item => item.id === productId);
        if (existing) {
            existing.quantity += quantity;
        } else {
            this.items.push({
                id: prod.id,
                name: prod.name,
                image: prod.image,
                packSize: prod.packSize,
                specs: prod.specs,
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
            <div class="cart-item" data-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-info">
                    <h4 class="cart-item-title">${item.name}</h4>
                    <div class="cart-item-unit-price">
                        ${item.specs?.boca ? `Boca: ${item.specs.boca} | ` : ''}Fardo x ${item.packSize} u.
                    </div>
                    <div class="cart-item-actions">
                        <div class="quantity-controller">
                            <button type="button" class="btn-qty" onclick="cartManager.updateQuantity('${item.id}', ${item.quantity - 1})" title="Reducir paquetes">−</button>
                            <span class="qty-display">${item.quantity} paq.</span>
                            <button type="button" class="btn-qty" onclick="cartManager.updateQuantity('${item.id}', ${item.quantity + 1})" title="Aumentar paquetes">+</button>
                        </div>
                        <div style="font-size: 0.8rem; font-weight: 700; color: var(--primary);">
                            ${(item.quantity * item.packSize).toLocaleString()} u.
                        </div>
                        <button type="button" class="btn-remove-item" onclick="cartManager.removeItem('${item.id}')" title="Eliminar referencia">
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

        const waUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
        window.open(waUrl, '_blank');
        this.showToast('¡Redirigiendo a WhatsApp para enviar tu cotización!', 'success');
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

        toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
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
