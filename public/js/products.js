/**
 * AYME INDUSTRIAS PET - Catálogo Técnico Industrial de Envases Plásticos
 */

class ProductCatalog {
    constructor() {
        this.currentCategory = 'all';
        this.currentSector = 'all';
        this.searchQuery = '';
        this.sortBy = 'featured';
        this.selectedProduct = null;
        this.init();
    }

    async init() {
        this.renderCategoryPills();
        this.renderSectorTabs();
        this.renderProducts();
        this.setupEventListeners();

        // Sincronización automática con la base de datos de Supabase
        await this.syncWithDatabase();
    }

    async syncWithDatabase() {
        try {
            const res = await fetch('/api/store/ayme-pet/products');
            if (!res.ok) return;
            const data = await res.json();
            if (data && data.success) {
                if (data.tenant && data.tenant.id) {
                    window.TENANT_ID = data.tenant.id;
                }
                // Sincronizar categorías si vienen de Supabase
                if (Array.isArray(data.categories)) {
                    const iconMap = {
                        'bebidas': '🥤',
                        'farma': '💊',
                        'cosmetica': '🧴',
                        'alimentos': '🍯',
                        'quimicos': '🧪',
                        'tapas': '🔘',
                        'preformas': '⚙️',
                    };
                    const mappedCats = data.categories.map(c => ({
                        id: c.slug || c.id,
                        name: c.name,
                        icon: iconMap[c.slug] || '📦'
                    }));
                    window.CATEGORIES = [{ id: 'all', name: 'Todos los Envases', icon: '📦' }, ...mappedCats];
                    if (typeof CATEGORIES !== 'undefined') CATEGORIES = window.CATEGORIES;
                    this.renderCategoryPills();

                    // Sincronizar opciones del selector de contacto
                    const contactSelect = document.getElementById('home-contact-type');
                    if (contactSelect && mappedCats.length > 0) {
                        contactSelect.innerHTML = `
                            <option value="Cotización General de Envases">📦 Cotización General de Envases</option>
                            ${mappedCats.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.icon)} Línea ${escapeHtml(c.name)}</option>`).join('')}
                            <option value="Fabricación de Molde Personalizado">📐 Fabricación de Molde Personalizado 3D</option>
                        `;
                    }

                    // Sincronizar enlaces de categorías en el footer
                    const footerList = document.getElementById('footer-categories-list');
                    if (footerList && mappedCats.length > 0) {
                        footerList.innerHTML = mappedCats.map(c => `
                            <li><a href="#productos" data-nav-target="productos" data-cat-id="${escapeHtml(c.id)}" class="footer-cat-filter">${escapeHtml(c.name)}</a></li>
                        `).join('');
                    }
                }

                // Sincronizar productos en vivo desde Supabase
                // Si la base de datos está vacía (productos eliminados), se refleja fielmente sin reinyectar datos viejos
                if (Array.isArray(data.products)) {
                    const mappedProducts = data.products.map(p => {
                        const specs = p.attributes?.specs || {};
                        const catObj = data.categories?.find(c => c.id === p.category_id);
                        const catSlug = catObj?.slug || (p.category_id ? String(p.category_id) : 'general');
                        const catName = catObj?.name || (p.attributes?.brand || 'Catálogo General');

                        return {
                            id: p.sku ? p.sku.toLowerCase() : p.id,
                            dbId: p.id,
                            sku: p.sku || '',
                            name: p.name,
                            category: catSlug,
                            categoryName: catName,
                            sector: p.attributes?.sector || 'all',
                            packSize: p.units_per_package || 100,
                            moq: p.min_order_qty || 500,
                            image: p.images?.[0] || '/assets/products/ayme-001.svg',
                            badge: p.attributes?.badge || null,
                            specs: {
                                ...specs,
                                empaque: specs.empaque || `Fardo x ${p.units_per_package || 100} uds`,
                            },
                            description: p.description || '',
                            features: Array.isArray(p.attributes?.features) ? p.attributes.features : [
                                'Inocuidad certificada para contacto directo',
                                'Homogeneidad en la distribución del espesor de pared',
                                'Rosca estándar compatible con tapas de seguridad'
                            ]
                        };
                    });

                    window.PRODUCTS = mappedProducts;
                    if (typeof PRODUCTS !== 'undefined') PRODUCTS = window.PRODUCTS;
                    this.renderProducts();

                    // Sincronizar productos destacados del home
                    if (window.appInstance && typeof window.appInstance.renderHomeFeatured === 'function') {
                        window.appInstance.renderHomeFeatured();
                    } else if (window.app && typeof window.app.renderHomeFeatured === 'function') {
                        window.app.renderHomeFeatured();
                    }
                }
            }
        } catch (e) {
            console.log('Catálogo en modo local/offline activo');
        }
    }

    renderSectorTabs() {
        const container = document.getElementById('pet-type-tabs');
        if (!container) return;

        if (!SECTOR_TYPES || SECTOR_TYPES.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'flex';
        container.innerHTML = SECTOR_TYPES.map(s => `
            <button type="button" class="pet-tab ${this.currentSector === s.id ? 'active' : ''}" data-sector="${escapeHtml(s.id)}">
                ${escapeHtml(s.name)}
            </button>
        `).join('');
    }

    renderCategoryPills() {
        const container = document.getElementById('category-filter-pills');
        if (!container) return;

        const cats = window.CATEGORIES || (typeof CATEGORIES !== 'undefined' ? CATEGORIES : []);
        container.innerHTML = cats.map(cat => `
            <button type="button" class="filter-pill ${this.currentCategory === cat.id ? 'active' : ''}" data-category="${escapeHtml(cat.id)}">
                <span>${escapeHtml(cat.icon)}</span>
                <span>${escapeHtml(cat.name)}</span>
            </button>
        `).join('');
    }

    getFilteredProducts() {
        const sourceList = window.PRODUCTS || (typeof PRODUCTS !== 'undefined' ? PRODUCTS : []) || [];
        let list = [...sourceList];

        if (this.currentSector !== 'all') {
            list = list.filter(p => p.sector === this.currentSector);
        }

        if (this.currentCategory !== 'all') {
            list = list.filter(p => p.category === this.currentCategory);
        }

        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            list = list.filter(p => 
                p.name.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q) ||
                (p.specs?.boca && p.specs.boca.toLowerCase().includes(q)) ||
                (p.specs?.capacidad && p.specs.capacidad.toLowerCase().includes(q)) ||
                (p.specs?.altura && p.specs.altura.toLowerCase().includes(q)) ||
                (p.specs?.diametro && p.specs.diametro.toLowerCase().includes(q)) ||
                (p.specs?.gramaje && p.specs.gramaje.toLowerCase().includes(q))
            );
        }

        if (this.sortBy === 'name-asc') {
            list.sort((a, b) => a.name.localeCompare(b.name));
        } else if (this.sortBy === 'capacity-desc') {
            list.sort((a, b) => (parseInt(b.specs?.capacidad) || 0) - (parseInt(a.specs?.capacidad) || 0));
        }

        return list;
    }

    renderProducts() {
        const grid = document.getElementById('products-grid');
        const emptyState = document.getElementById('products-empty');
        const countLabel = document.getElementById('products-result-count');

        if (!grid) return;

        const filtered = this.getFilteredProducts();

        if (countLabel) {
            countLabel.textContent = `Mostrando ${filtered.length} referencias de envases industriales`;
        }

        if (filtered.length === 0) {
            grid.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        grid.innerHTML = filtered.map(prod => this.generateCardHTML(prod)).join('');
    }

    generateCardHTML(prod) {
        const categoryName = prod.categoryName || (window.CATEGORIES || (typeof CATEGORIES !== 'undefined' ? CATEGORIES : [])).find(c => c && c.id === prod.category)?.name || 'Catálogo General';
        const specPill = prod.specs?.boca ? `Boca: ${prod.specs.boca}` : (prod.specs?.ancho ? `Medida: ${prod.specs.ancho}` : 'Accesorio');

        return `
            <article class="product-card technical-b2b-card" data-id="${escapeHtml(prod.id)}">
                <div class="product-card-media">
                    ${prod.badge ? `<span class="product-badge">${escapeHtml(prod.badge)}</span>` : ''}
                    <button type="button" class="btn-quick-view" data-action="quick-view" data-product-id="${escapeHtml(prod.id)}" title="Ver Plano y Ficha Técnica">
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
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.057-2.148-.528-1.517-.613-2.508-2.143-2.584-2.245-.075-.101-.616-.818-.616-1.56 0-.742.39-1.107.528-1.258.138-.151.301-.189.402-.189.101 0 .202.002.29.006.094.005.22-.036.344.263.126.302.43 1.05.468 1.127.038.077.063.167.013.268-.05.101-.076.164-.151.252-.076.088-.16.196-.228.263-.076.076-.155.158-.067.31.088.151.393.649.843 1.049.578.514 1.066.673 1.217.749.151.075.24.063.328-.038.089-.101.378-.44.479-.592.101-.151.202-.126.34-.075.138.05 8.78 4.14 1.026.479.076.038.126.063.151.101.025.038.025.227-.119.632z"/></svg>
                            <span>Cotizar por WhatsApp</span>
                        </button>
                    </div>
                </div>
            </article>
        `;
    }

    openQuickView(productId) {
        const sourceList = window.PRODUCTS || (typeof PRODUCTS !== 'undefined' ? PRODUCTS : []) || [];
        const prod = sourceList.find(p => p.id === productId);
        if (!prod) return;

        this.selectedProduct = prod;

        const modal = document.getElementById('product-modal');
        const container = document.getElementById('product-modal-details');

        if (!modal || !container) return;

        const cats = window.CATEGORIES || (typeof CATEGORIES !== 'undefined' ? CATEGORIES : []) || [];
        const categoryName = prod.categoryName || cats.find(c => c && c.id === prod.category)?.name || 'Catálogo General';
        const badgeTag = prod.badge 
            ? `<span class="product-tag" style="background: var(--accent-light); color: var(--accent); font-weight: 700;">${escapeHtml(prod.badge)}</span>` 
            : (prod.specs?.material ? `<span class="product-tag" style="background: var(--accent-light); color: var(--accent); font-weight: 700;">${escapeHtml(prod.specs.material)}</span>` : '');

        const dimText = prod.specs?.capacidad 
            ? `Capacidad: ${escapeHtml(prod.specs.capacidad)}` 
            : (prod.specs?.ancho ? `Dimensiones: ${escapeHtml(prod.specs.ancho)} x ${escapeHtml(prod.specs.alto || '')}` : 'Especificación de Fábrica');

        const packText = prod.specs?.empaque 
            ? escapeHtml(prod.specs.empaque) 
            : `Fardo x ${escapeHtml(prod.packSize)} unidades`;

        container.innerHTML = `
            <div class="product-modal-grid">
                <div class="product-modal-gallery">
                    <img src="${escapeHtml(prod.image)}" alt="${escapeHtml(prod.name)}" class="product-modal-img">
                    ${prod.badge ? `<span class="product-modal-badge">${escapeHtml(prod.badge)}</span>` : ''}
                </div>
                <div class="product-modal-info">
                    <div class="product-modal-tags">
                        <span class="product-tag">${escapeHtml(categoryName)}</span>
                        ${badgeTag}
                    </div>

                    <h2 class="product-modal-title">${escapeHtml(prod.name)}</h2>

                    <div style="background: var(--bg-soft); padding: 0.85rem 1rem; border-radius: var(--radius-sm); margin-bottom: 1.25rem; border-left: 4px solid var(--accent);">
                        <div style="font-size: 0.95rem; font-weight: 700; color: var(--primary); margin-bottom: 0.2rem;">
                            ${dimText}
                        </div>
                        <div style="font-size: 0.82rem; color: var(--text-muted);">
                            Presentación: ${packText}
                        </div>
                    </div>

                    <p class="product-modal-desc">${escapeHtml(prod.description)}</p>

                    <div class="product-modal-features">
                        <h4>📐 Plano Técnico & Dimensiones de Fábrica:</h4>
                        <table style="width: 100%; font-size: 0.86rem; border-collapse: collapse; margin-top: 0.65rem;">
                            ${Object.entries(prod.specs || {}).map(([key, val]) => `
                                <tr style="border-bottom: 1px solid var(--border);">
                                    <td style="padding: 0.4rem 0; font-weight: 700; color: var(--primary); text-transform: capitalize;">${escapeHtml(key)}:</td>
                                    <td style="padding: 0.4rem 0; color: var(--text-dark); font-weight: 600; text-align: right;">${escapeHtml(val)}</td>
                                </tr>
                            `).join('')}
                        </table>
                    </div>

                    <div class="product-modal-features" style="margin-top: 1rem;">
                        <h4>✅ Normas de Inocuidad y Resistencia:</h4>
                        <ul class="modal-feature-list" style="margin-top: 0.5rem; padding-left: 1.2rem; font-size: 0.86rem; color: var(--text-muted);">
                            ${(prod.features || []).map(f => `<li style="margin-bottom: 0.25rem;">${escapeHtml(f)}</li>`).join('')}
                        </ul>
                    </div>

                    <div class="product-modal-stock" style="margin-top: 1.25rem; font-size: 0.85rem; color: var(--primary); font-weight: 600;">
                        <span class="stock-dot"></span>
                        <span>Fabricación y stock continuo en planta</span>
                    </div>

                    <div class="product-modal-cta" style="margin-top: 1.25rem;">
                        <button type="button" class="btn btn-whatsapp btn-lg btn-block" data-action="direct-wa" data-product-id="${escapeHtml(prod.id)}">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.057-2.148-.528-1.517-.613-2.508-2.143-2.584-2.245-.075-.101-.616-.818-.616-1.56 0-.742.39-1.107.528-1.258.138-.151.301-.189.402-.189.101 0 .202.002.29.006.094.005.22-.036.344.263.126.302.43 1.05.468 1.127.038.077.063.167.013.268-.05.101-.076.164-.151.252-.076.088-.16.196-.228.263-.076.076-.155.158-.067.31.088.151.393.649.843 1.049.578.514 1.066.673 1.217.749.151.075.24.063.328-.038.089-.101.378-.44.479-.592.101-.151.202-.126.34-.075.138.05 8.78 4.14 1.026.479.076.038.126.063.151.101.025.038.025.227-.119.632z"/></svg>
                            <span>Solicitar Cotización por WhatsApp</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeQuickView() {
        const modal = document.getElementById('product-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
        this.selectedProduct = null;
    }

    handleDirectWhatsApp(productId) {
        const sourceList = window.PRODUCTS || (typeof PRODUCTS !== 'undefined' ? PRODUCTS : []) || [];
        const prod = sourceList.find(p => p.id === productId);
        if (!prod) return;

        let msg = `¡Hola *${CONFIG.businessName}*! Deseo solicitar cotización para este envase:\n\n`;
        msg += `📦 *Producto:* ${prod.name}\n`;
        if (prod.specs?.capacidad) msg += `🧴 *Capacidad:* ${prod.specs.capacidad}\n`;
        if (prod.specs?.altura) msg += `📏 *Altura:* ${prod.specs.altura}\n`;
        if (prod.specs?.diametro) msg += `⭕ *Diámetro:* ${prod.specs.diametro}\n`;
        if (prod.specs?.boca) msg += `⚙️ *Boca:* ${prod.specs.boca}\n`;
        if (prod.specs?.gramaje) msg += `⚖️ *Gramaje:* ${prod.specs.gramaje}\n`;
        msg += `📦 *Empaque:* ${prod.specs?.empaque || `Fardo x ${prod.packSize} u.`}\n\n`;
        msg += `¿Podrían indicarme disponibilidad y cotización por volumen? Gracias.`;

        const waUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
        window.open(waUrl, '_blank');
    }

    setupEventListeners() {
        const sectorContainer = document.getElementById('pet-type-tabs');
        if (sectorContainer) {
            sectorContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('.pet-tab');
                if (!btn) return;
                this.currentSector = btn.dataset.sector;
                this.renderSectorTabs();
                this.renderProducts();
            });
        }

        const catContainer = document.getElementById('category-filter-pills');
        if (catContainer) {
            catContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('.filter-pill');
                if (!btn) return;
                this.currentCategory = btn.dataset.category;
                this.renderCategoryPills();
                this.renderProducts();
            });
        }

        const searchInput = document.getElementById('product-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.trim();
                this.renderProducts();
            });
        }

        const sortSelect = document.getElementById('product-sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.renderProducts();
            });
        }

        const closeBtns = document.querySelectorAll('.trigger-modal-close');
        closeBtns.forEach(b => b.addEventListener('click', () => this.closeQuickView()));

        const modal = document.getElementById('product-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeQuickView();
                const waBtn = e.target.closest('[data-action="direct-wa"]');
                if (waBtn) {
                    const pid = waBtn.dataset.productId;
                    if (pid) this.handleDirectWhatsApp(pid);
                }
            });
        }

        // Delegación de eventos para la grilla de productos
        const grid = document.getElementById('products-grid');
        if (grid) {
            grid.addEventListener('click', (e) => {
                const qvBtn = e.target.closest('[data-action="quick-view"]');
                if (qvBtn) {
                    const card = qvBtn.closest('.product-card');
                    const pid = qvBtn.dataset.productId || card?.dataset.id;
                    if (pid) this.openQuickView(pid);
                    return;
                }
                const waBtn = e.target.closest('[data-action="direct-wa"]');
                if (waBtn) {
                    const card = waBtn.closest('.product-card');
                    const pid = waBtn.dataset.productId || card?.dataset.id;
                    if (pid) this.handleDirectWhatsApp(pid);
                    return;
                }
            });
        }

        // Delegación de eventos para categorías en el footer
        const footerList = document.getElementById('footer-categories-list');
        if (footerList) {
            footerList.addEventListener('click', (e) => {
                const link = e.target.closest('.footer-cat-filter');
                if (!link) return;
                const catId = link.dataset.catId;
                if (catId) {
                    this.currentCategory = catId;
                    this.renderCategoryPills();
                    this.renderProducts();
                }
            });
        }
    }
}

let productCatalog;
document.addEventListener('DOMContentLoaded', () => {
    productCatalog = new ProductCatalog();
});
window.ProductCatalog = ProductCatalog;
if (document.readyState === "complete" || document.readyState === "interactive") {
    if (!window.productCatalog) window.productCatalog = new ProductCatalog();
} else {
    document.addEventListener("DOMContentLoaded", () => {
        if (!window.productCatalog) window.productCatalog = new ProductCatalog();
    });
}
