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
                            slug: p.slug || (p.sku ? p.sku.toLowerCase() : p.id),
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
                    <a href="/store/ayme-pet/producto/${encodeURIComponent(prod.slug || (prod.sku ? prod.sku.toLowerCase() : prod.id))}" target="_top" class="btn-quick-view" title="Ver Ficha Técnica">
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

                    <h3 class="product-title" title="${escapeHtml(prod.name)}">
                        <a href="/store/ayme-pet/producto/${encodeURIComponent(prod.slug || (prod.sku ? prod.sku.toLowerCase() : prod.id))}" target="_top" style="color: inherit; text-decoration: none;">${escapeHtml(prod.name)}</a>
                    </h3>
                    
                    <div class="product-card-footer-technical" style="margin-top: auto; padding-top: 1rem;">
                        <a href="/store/ayme-pet/producto/${encodeURIComponent(prod.slug || (prod.sku ? prod.sku.toLowerCase() : prod.id))}" target="_top" class="btn btn-outline btn-block" style="font-size: 0.84rem; padding: 0.55rem; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 0.4rem;">
                            📋 Ver Ficha Técnica
                        </a>
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
        const prod = sourceList.find(p => p.id === productId || p.dbId === productId);
        if (!prod) return;

        const slug = prod.slug || (prod.sku ? prod.sku.toLowerCase() : (prod.dbId || prod.id));
        const targetUrl = `/store/ayme-pet/producto/${encodeURIComponent(slug)}`;

        // Navegar a la página completa del producto en la ventana principal
        try {
            if (window.top && window.top !== window) {
                window.top.location.href = targetUrl;
                return;
            }
        } catch (e) {
            // Fallback
        }
        window.location.href = targetUrl;
        return;

        const modal = document.getElementById('product-modal');
        const container = document.getElementById('product-modal-details');

        if (!modal || !container) return;

        const modalContainer = modal.querySelector('.pet-modal-container');
        if (modalContainer) modalContainer.classList.add('marketplace-modal');

        const cats = window.CATEGORIES || (typeof CATEGORIES !== 'undefined' ? CATEGORIES : []) || [];
        const categoryName = prod.categoryName || cats.find(c => c && c.id === prod.category)?.name || 'Catálogo General';
        const specs = prod.specs || {};

        // Variantes y opciones
        const packOptions = ['Paquete de 15', 'Paquete de 10', 'Paquete de 5'];
        const colorOptions = ['Tapas Negras', 'Tapas Blancas'];
        this.modalSelectedPack = packOptions[0];
        this.modalSelectedColor = colorOptions[0];
        this.modalQty = 1;

        // Imágenes de galería
        const galleryImages = [
            prod.image,
            '/assets/products/ayme-002.svg',
            '/assets/products/ayme-003.svg',
            '/assets/products/ayme-004.svg'
        ];

        // Reseñas de compras verificadas solicitadas
        const reviews = [
            {
                user: '98***28',
                date: 'el 24 abr 2026',
                stars: 5,
                headline: 'Excelente',
                comment: 'bonitos botes, frasco un tanto delicado pero muy chéveres'
            },
            {
                user: 'Lissett',
                date: 'el 2 abr 2026',
                stars: 5,
                headline: 'Excelente',
                comment: 'Están muy bonitos eficientes para guardar juguitos'
            },
            {
                user: 'ruben alvarez',
                date: 'el 22 ene 2026',
                stars: 5,
                headline: 'Excelente',
                comment: 'llego muy bien gracias'
            },
            {
                user: 'Ndeer Hp',
                date: 'el 29 abr 2026',
                stars: 4,
                headline: 'Bueno',
                comment: 'JAJAJA otra vez pensé q sería más grandesito pero por su precio está bastante bien, cumple su función.'
            }
        ];

        container.innerHTML = `
            <!-- BREADCRUMB JERÁRQUICO TEMU / MARKETPLACE -->
            <nav class="marketplace-breadcrumb">
                <span>Inicio</span> <span class="bc-sep">›</span>
                <span>${escapeHtml(categoryName || 'Hogar y cocina')}</span> <span class="bc-sep">›</span>
                <span>${escapeHtml(specs.subcategoria || specs.sector || 'Cristalería y copas')}</span> <span class="bc-sep">›</span>
                <span class="bc-active">${escapeHtml(prod.name.slice(0, 32))}...</span>
            </nav>

            <div class="marketplace-pdp-layout">
                <!-- COLUMNA IZQUIERDA: GALERÍA MULTI-ÁNGULO -->
                <div class="marketplace-gallery-card">
                    <div class="marketplace-main-img-box">
                        <span class="marketplace-deal-tag">🔥 Oferta de temporada</span>
                        <img id="modal-active-img" src="${escapeHtml(prod.image)}" alt="${escapeHtml(prod.name)}">
                    </div>
                    <div class="marketplace-thumbs-row">
                        ${galleryImages.map((imgUrl, idx) => `
                            <button type="button" class="marketplace-thumb-btn ${idx === 0 ? 'active' : ''}" data-thumb-src="${escapeHtml(imgUrl)}">
                                <img src="${escapeHtml(imgUrl)}" alt="thumb ${idx}">
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- COLUMNA DERECHA: PRECIOS, URGENCIA, VARIANTES Y COMPRA -->
                <div class="marketplace-info-card">
                    <h1 class="marketplace-title-h1">${escapeHtml(prod.name)}</h1>

                    <!-- BARRA DE REPUTACIÓN Y PRUEBA SOCIAL -->
                    <div class="marketplace-social-bar">
                        <span class="marketplace-rating-badge">★ 4,8</span>
                        <strong style="color: #0f172a;">843 reseñas</strong>
                        <span>•</span>
                        <strong style="color: #0f172a;">14K+ ventas</strong>
                        <span>•</span>
                        <span class="marketplace-verified-badge">✓ Compras verificadas</span>
                    </div>

                    <!-- BLOQUE DE PRECIOS & DESCUENTO TIEMPO LIMITADO -->
                    <div class="marketplace-pricing-box">
                        <div class="marketplace-prices-row">
                            <span class="marketplace-current-price">$3.14</span>
                            <span class="marketplace-orig-price">$5.99</span>
                            <span class="marketplace-discount-pill">47% DE DESCUENTO tiempo limitado</span>
                        </div>
                        <div class="marketplace-stock-row">
                            <span class="marketplace-almost-gone">🔥 CASI AGOTADO(S)</span>
                            <span style="font-size: 0.75rem; color: #64748b;">${prod.id ? `Ref: ${escapeHtml(prod.id.toUpperCase())}` : ''}</span>
                        </div>
                        <div class="marketplace-countdown-strip">
                            <span>⏱️ Oferta de temporada</span>
                            <span class="marketplace-timer-digits" id="modal-countdown">18:06:33:22</span>
                        </div>
                        <div style="font-size: 0.72rem; color: #64748b; text-align: right;">
                            Termina el 31 oct a las 11:59 pm
                        </div>
                    </div>

                    <!-- SELECTOR DE VARIANTES -->
                    <div class="marketplace-variants-block">
                        <div class="marketplace-var-group">
                            <label>
                                <span>Presentación:</span>
                                <strong id="modal-pack-label" style="color: #ea580c;">Paquete de 15</strong>
                            </label>
                            <div class="marketplace-pills-wrap" id="modal-pack-pills">
                                ${packOptions.map((po, idx) => `
                                    <button type="button" class="marketplace-pill-opt ${idx === 0 ? 'active' : ''}" data-variant-type="pack" data-val="${escapeHtml(po)}">${escapeHtml(po)}</button>
                                `).join('')}
                            </div>
                        </div>

                        <div class="marketplace-var-group">
                            <label>
                                <span>Color de Tapas:</span>
                                <strong id="modal-color-label" style="color: #ea580c;">Tapas Negras</strong>
                            </label>
                            <div class="marketplace-pills-wrap" id="modal-color-pills">
                                ${colorOptions.map((co, idx) => `
                                    <button type="button" class="marketplace-pill-opt ${idx === 0 ? 'active' : ''}" data-variant-type="color" data-val="${escapeHtml(co)}">${escapeHtml(co)}</button>
                                `).join('')}
                            </div>
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 0.25rem;">
                            <span style="font-size: 0.8rem; font-weight: 700; color: #1e293b;">Cantidad:</span>
                            <div class="marketplace-qty-control">
                                <button type="button" class="marketplace-qty-btn" id="modal-btn-qty-minus">−</button>
                                <span class="marketplace-qty-val" id="modal-qty-display">1</span>
                                <button type="button" class="marketplace-qty-btn" id="modal-btn-qty-plus">+</button>
                            </div>
                        </div>
                    </div>

                    <!-- BOTONES DE ACCIÓN -->
                    <div style="display: flex; flex-direction: column; gap: 0.5rem; padding-top: 0.25rem;">
                        <button type="button" class="btn btn-accent btn-block" data-action="modal-add-cart" style="background: #ea580c; border-color: #ea580c; font-weight: 800; padding: 0.75rem;">
                            🛒 Agregar al Carrito (<span id="modal-btn-qty-label">1 paquete</span>)
                        </button>
                        <button type="button" class="btn btn-whatsapp btn-block" data-action="direct-wa" data-product-id="${escapeHtml(prod.id)}" style="padding: 0.7rem; font-weight: 700;">
                            💬 Cotizar por WhatsApp
                        </button>
                    </div>

                    <!-- TARJETA DE LOGÍSTICA & ENVÍO A DOMICILIO -->
                    <div class="marketplace-logistics-box">
                        <div class="marketplace-delivery-head">
                            <span>🚚 A domicilio</span>
                            <span class="marketplace-free-tag">Envío gratis para este artículo</span>
                        </div>
                        <div style="color: #64748b;">
                            Entrega estimada: <strong style="color: #0f172a;">27 oct - 25 nov</strong>
                        </div>
                        <div>
                            <span style="font-size: 0.72rem; color: #64748b; font-weight: 700; display: block; margin-bottom: 0.3rem;">Transportistas autorizados:</span>
                            <div class="marketplace-couriers-row">
                                <span class="marketplace-courier-chip">FAR International</span>
                                <span class="marketplace-courier-chip">LAARCOURIER</span>
                                <span class="marketplace-courier-chip">URBANO ENVÍOS</span>
                            </div>
                        </div>
                        <div class="marketplace-trust-grid">
                            <div class="marketplace-trust-item">🔒 Pagos seguros</div>
                            <div class="marketplace-trust-item">🛡️ Privacidad segura</div>
                            <div class="marketplace-trust-item">📦 Garantía de pedidos</div>
                        </div>
                    </div>

                    <!-- TARJETA DEL FABRICANTE / VENDEDOR -->
                    <div class="marketplace-vendor-strip">
                        <div>
                            <div class="marketplace-vendor-name">WL damai • AYME INDUSTRIAS PET</div>
                            <div class="marketplace-vendor-stats">
                                <span><strong>66</strong> Seguidores</span>
                                <span>•</span>
                                <span><strong>83K+</strong> Vendidos</span>
                                <span>•</span>
                                <span style="color: #f59e0b; font-weight: 800;">★ 4.8</span>
                            </div>
                        </div>
                        <div style="font-size: 0.72rem; color: #64748b; font-weight: 600;">
                            Comenzó hace 1 año
                        </div>
                    </div>

                    <!-- FICHA TÉCNICA & DETALLES DEL PRODUCTO -->
                    <div style="border-top: 1px solid #f1f5f9; padding-top: 0.75rem;">
                        <div style="font-size: 0.85rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem;">
                            Detalles del producto
                        </div>
                        <table class="marketplace-specs-table">
                            <tr>
                                <td>Material:</td>
                                <td>${escapeHtml(specs.material || 'Plástico (PET / PP)')}</td>
                            </tr>
                            <tr>
                                <td>Reutilizable:</td>
                                <td>${escapeHtml(specs.reutilizable || 'Reutilizable 100%')}</td>
                            </tr>
                            <tr>
                                <td>Forma:</td>
                                <td>${escapeHtml(specs.forma || 'Redondo / Cilíndrico')}</td>
                            </tr>
                            <tr>
                                <td>Capacidad:</td>
                                <td>${escapeHtml(specs.capacidad || '2 Oz (60 ml)')}</td>
                            </tr>
                            <tr>
                                <td>Boca / Tapa:</td>
                                <td>${escapeHtml(specs.boca || 'Con Tapas Negras/Blancas')}</td>
                            </tr>
                            <tr>
                                <td>Uso Recomendado:</td>
                                <td>Jengibre, Muestras, Jugos, Farma, Whisky</td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>

            <!-- MURO DE RESEÑAS DE CLIENTES VERIFICADAS -->
            <div class="marketplace-reviews-section">
                <div class="marketplace-reviews-header">
                    <div>
                        <strong style="font-size: 0.95rem; color: #0f172a;">843 reseñas • ★ 4,8</strong>
                        <div style="font-size: 0.72rem; color: #15803d; font-weight: 700; margin-top: 2px;">
                            Todas las reseñas son de compras verificadas
                        </div>
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                    ${reviews.map(r => `
                        <div class="marketplace-review-card">
                            <div class="marketplace-review-user">
                                <span>${escapeHtml(r.user)} <span class="marketplace-verified-badge" style="font-size: 0.65rem; margin-left: 4px;">Compra verificada</span></span>
                                <span style="font-size: 0.72rem; color: #94a3b8;">${escapeHtml(r.date)}</span>
                            </div>
                            <div class="marketplace-review-stars">
                                ${'★'.repeat(r.stars)} <strong style="color: #0f172a; font-size: 0.8rem; margin-left: 4px;">${escapeHtml(r.headline)}</strong>
                            </div>
                            <div class="marketplace-review-text">
                                ${escapeHtml(r.comment)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Iniciar temporizador regresivo de oferta en vivo (18:06:33:22)
        if (this.modalTimer) clearInterval(this.modalTimer);
        let secondsTotal = 18 * 86400 + 6 * 3600 + 33 * 60 + 22;
        const countdownEl = document.getElementById('modal-countdown');
        this.modalTimer = setInterval(() => {
            secondsTotal--;
            if (secondsTotal <= 0) {
                clearInterval(this.modalTimer);
                return;
            }
            const d = Math.floor(secondsTotal / 86400);
            const h = Math.floor((secondsTotal % 86400) / 3600);
            const m = Math.floor((secondsTotal % 3600) / 60);
            const s = secondsTotal % 60;
            const pad = n => String(n).padStart(2, '0');
            if (countdownEl) countdownEl.textContent = `${pad(d)}:${pad(h)}:${pad(m)}:${pad(s)}`;
        }, 1000);

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeQuickView() {
        if (this.modalTimer) {
            clearInterval(this.modalTimer);
            this.modalTimer = null;
        }
        const modal = document.getElementById('product-modal');
        if (modal) {
            modal.classList.remove('active');
            const modalContainer = modal.querySelector('.pet-modal-container');
            if (modalContainer) modalContainer.classList.remove('marketplace-modal');
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

                // Cambiar miniatura activa
                const thumbBtn = e.target.closest('[data-thumb-src]');
                if (thumbBtn) {
                    const src = thumbBtn.dataset.thumbSrc;
                    const activeImg = document.getElementById('modal-active-img');
                    if (activeImg && src) activeImg.src = src;
                    thumbBtn.parentElement?.querySelectorAll('.marketplace-thumb-btn').forEach(b => b.classList.remove('active'));
                    thumbBtn.classList.add('active');
                    return;
                }

                // Selección de variante
                const pillBtn = e.target.closest('[data-variant-type]');
                if (pillBtn) {
                    const type = pillBtn.dataset.variantType;
                    const val = pillBtn.dataset.val;
                    if (type === 'pack') {
                        this.modalSelectedPack = val;
                        const lbl = document.getElementById('modal-pack-label');
                        if (lbl) lbl.textContent = val;
                    } else if (type === 'color') {
                        this.modalSelectedColor = val;
                        const lbl = document.getElementById('modal-color-label');
                        if (lbl) lbl.textContent = val;
                    }
                    pillBtn.parentElement?.querySelectorAll('.marketplace-pill-opt').forEach(b => b.classList.remove('active'));
                    pillBtn.classList.add('active');
                    return;
                }

                // Control de cantidad
                const minusBtn = e.target.closest('#modal-btn-qty-minus');
                if (minusBtn) {
                    this.modalQty = Math.max(1, (this.modalQty || 1) - 1);
                    const disp = document.getElementById('modal-qty-display');
                    const btnLbl = document.getElementById('modal-btn-qty-label');
                    if (disp) disp.textContent = String(this.modalQty);
                    if (btnLbl) btnLbl.textContent = `${this.modalQty} ${this.modalQty === 1 ? 'paquete' : 'paquetes'}`;
                    return;
                }
                const plusBtn = e.target.closest('#modal-btn-qty-plus');
                if (plusBtn) {
                    this.modalQty = (this.modalQty || 1) + 1;
                    const disp = document.getElementById('modal-qty-display');
                    const btnLbl = document.getElementById('modal-btn-qty-label');
                    if (disp) disp.textContent = String(this.modalQty);
                    if (btnLbl) btnLbl.textContent = `${this.modalQty} paquetes`;
                    return;
                }

                // Agregar al carrito
                const addCartBtn = e.target.closest('[data-action="modal-add-cart"]');
                if (addCartBtn && this.selectedProduct) {
                    if (window.cartManager) {
                        window.cartManager.addItem(this.selectedProduct.id, this.modalQty || 1);
                        window.cartManager.openDrawer();
                        this.closeQuickView();
                    }
                    return;
                }

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
