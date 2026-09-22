-- ==========================================================
-- SEED DATA: 2do Tenant (Dulcelandia Mayorista - Confitería & Caramelos)
-- Prueba de agnosticidad total del modelo de datos B2B
-- ==========================================================

DO $$
DECLARE
    dulce_tenant_id UUID;
    cat_chocolates_id UUID;
    cat_gomitas_id UUID;
    cat_caramelos_id UUID;
    branch_bog_id UUID;
    branch_med_id UUID;
BEGIN
    -- 1. Insertar Tenant de Confitería
    INSERT INTO tenants (
        slug,
        name,
        industry_type,
        logo_url,
        theme_config,
        landing_config,
        settings
    ) VALUES (
        'dulcelandia',
        'Dulcelandia Confitería & Chocolates Mayorista',
        'confectionery',
        '/assets/logo-dulce.png',
        '{
            "primary_color": "#e11d48",
            "secondary_color": "#f43f5e",
            "accent_color": "#fbbf24",
            "font_family": "Inter, sans-serif",
            "border_radius": "0.75rem"
        }'::jsonb,
        '{
            "hero_title": "Distribución Mayorista de Caramelos, Chocolates y Golosinas",
            "hero_subtitle": "Abastecimiento B2B directo de fábrica para distribuidores, cadenas y canal tradicional. Venta por cajas máster y pallets completos.",
            "hero_video_url": null,
            "hero_image_url": "/assets/hero-candy.jpg",
            "whatsapp_default": "573129876543",
            "display_phone": "3129876543",
            "international_phone": "+57 312 987 6543",
            "email": "ventas@dulcelandiamayorista.com",
            "address": "Parque Industrial Calle 80, Módulo C-12, Bogotá",
            "hours": "Lunes a Viernes: 7:00 AM - 5:00 PM | Sábados: 8:00 AM - 12:00 PM",
            "plant_location": "Centro de Distribución Nacional Bogotá",
            "show_catalog": true,
            "show_branches": true,
            "show_services": false
        }'::jsonb,
        '{
            "currency": "COP",
            "currency_symbol": "$",
            "requires_quote_approval": true,
            "enable_whatsapp_rfq": true
        }'::jsonb
    )
    ON CONFLICT (slug) DO UPDATE SET 
        name = EXCLUDED.name,
        theme_config = EXCLUDED.theme_config,
        landing_config = EXCLUDED.landing_config
    RETURNING id INTO dulce_tenant_id;

    -- 2. Dominios para Dulcelandia
    INSERT INTO tenant_domains (tenant_id, domain, is_primary, is_verified)
    VALUES 
        (dulce_tenant_id, 'dulcelandia.tenddy.shop', TRUE, TRUE),
        (dulce_tenant_id, 'dulcelandia.localhost', FALSE, TRUE)
    ON CONFLICT (domain) DO NOTHING;

    -- 3. Sucursales / Bodegas de Despacho
    INSERT INTO branches (tenant_id, slug, name, branch_type, city, address, phone_number, phone_whatsapp, email, is_main_branch)
    VALUES
        (dulce_tenant_id, 'bodega-bogota', 'CEDI Central Bogotá', 'warehouse', 'Bogotá D.C.', 'Parque Industrial Calle 80, Módulo C-12', '+57 1 890 0000', '573129876543', 'bogota@dulcelandia.com', TRUE)
    ON CONFLICT (tenant_id, slug) DO UPDATE SET phone_whatsapp = EXCLUDED.phone_whatsapp
    RETURNING id INTO branch_bog_id;

    INSERT INTO branches (tenant_id, slug, name, branch_type, city, address, phone_number, phone_whatsapp, email, is_main_branch)
    VALUES
        (dulce_tenant_id, 'bodega-medellin', 'CEDI Occidente Medellín', 'warehouse', 'Medellín / Guayabal', 'Cra. 52 #14-20', '+57 4 333 1111', '573147778899', 'medellin@dulcelandia.com', FALSE)
    ON CONFLICT (tenant_id, slug) DO UPDATE SET phone_whatsapp = EXCLUDED.phone_whatsapp
    RETURNING id INTO branch_med_id;

    -- 4. Categorías de Confitería
    INSERT INTO categories (tenant_id, slug, name, description)
    VALUES (dulce_tenant_id, 'chocolates', 'Chocolates & Bombones', 'Barras, tabletas y bombones rellenos por display y caja master')
    ON CONFLICT (tenant_id, slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO cat_chocolates_id;

    INSERT INTO categories (tenant_id, slug, name, description)
    VALUES (dulce_tenant_id, 'gomitas', 'Gomitas & Gelatinas', 'Gomitas ácidas, frutales y aros azucarados')
    ON CONFLICT (tenant_id, slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO cat_gomitas_id;

    INSERT INTO categories (tenant_id, slug, name, description)
    VALUES (dulce_tenant_id, 'caramelos', 'Caramelos Duros & Chupetas', 'Chupetines rellenos, caramelos macizos y mentas')
    ON CONFLICT (tenant_id, slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO cat_caramelos_id;

    -- 5. Productos con Atributos de Confitería
    INSERT INTO products (
        tenant_id, category_id, slug, name, sku, description,
        attributes, price_tiers, min_order_qty, units_per_package, is_featured
    ) VALUES (
        dulce_tenant_id, cat_chocolates_id, 'tableta-chocolate-leche-100g-caja',
        'Tableta de Chocolate con Leche 100g (Caja Master x 24 Displays)', 'CHOC-LECHE-100',
        'Chocolate fino de aroma 42% cacao. Presentación especial para cadenas de supermercados y distribuidores mayoristas.',
        '{
            "specs": {
                "presentacion": "Caja Master x 24 Displays (288 tabletas)",
                "cacao": "42% Fino de Aroma",
                "peso_neto": "28.8 Kg por caja",
                "vida_util": "18 Meses",
                "registro_sanitario": "RS-CONF-2024-9988",
                "almacenamiento": "16°C a 20°C en lugar seco"
            },
            "features": [
                "100% Manteca de cacao pura sin sustitutos",
                "Display listo para exhibición en punto de venta",
                "Código de barras EAN-13 individual y EAN-14 en corrugado"
            ],
            "badge": "Top Ventas"
        }'::jsonb,
        '[
            {"min_qty": 288, "price": 2800},
            {"min_qty": 1440, "price": 2450}
        ]'::jsonb,
        288, 12, TRUE
    )
    ON CONFLICT (tenant_id, slug) DO NOTHING;

    INSERT INTO products (
        tenant_id, category_id, slug, name, sku, description,
        attributes, price_tiers, min_order_qty, units_per_package, is_featured
    ) VALUES (
        dulce_tenant_id, cat_gomitas_id, 'gomitas-aritos-acidos-fresa-kilo',
        'Gomitas Aritos Ácidos Fresa & Manzana 1 Kg (Bolsa Mayorista)', 'GOM-ARO-1KG',
        'Gomitas masticables cubiertas con azúcar ácida. Alto rendimiento para reempaque o dulcerías tradicionales.',
        '{
            "specs": {
                "presentacion": "Caja Master x 12 Bolsas de 1 Kg",
                "sabores": "Fresa y Manzana Verde",
                "peso_neto": "12 Kg por caja",
                "vida_util": "12 Meses",
                "textura": "Masticable Suave (Gelatina Premium)"
            },
            "features": [
                "Bolsa trilaminada con barrera de humedad para frescura",
                "Colores y aromas grado alimenticio aprobados",
                "Ideal para reempaque y venta al por mayor"
            ],
            "badge": "Línea Ácida"
        }'::jsonb,
        '[
            {"min_qty": 12, "price": 18500},
            {"min_qty": 60, "price": 16200}
        ]'::jsonb,
        12, 1, TRUE
    )
    ON CONFLICT (tenant_id, slug) DO NOTHING;

    INSERT INTO products (
        tenant_id, category_id, slug, name, sku, description,
        attributes, price_tiers, min_order_qty, units_per_package, is_featured
    ) VALUES (
        dulce_tenant_id, cat_caramelos_id, 'chupeta-frutal-rellena-chicle-bolsa-50uds',
        'Chupeta Frutal Rellena de Chicle (Bolsa x 50 uds / Caja x 20 Bolsas)', 'CHUP-CHIC-50',
        'Chupetín redondo con centro de chicle globo sabor a mora azul, cereza y uva.',
        '{
            "specs": {
                "presentacion": "Caja Master x 20 Bolsas (1,000 unidades)",
                "centro": "Goma de Mascar Globo",
                "peso_neto": "18g / unidad (18 Kg por caja)",
                "vida_util": "24 Meses",
                "sabores": "Mora Azul, Cereza y Uva"
            },
            "features": [
                "Envoltorio hermético individual resistente a la humedad",
                "Excelente rotación en canal tradicional y tiendas",
                "Chicle de fácil soplado con sabor prolongado"
            ],
            "badge": "Gran Rotación"
        }'::jsonb,
        '[
            {"min_qty": 1000, "price": 450},
            {"min_qty": 5000, "price": 380}
        ]'::jsonb,
        1000, 50, TRUE
    )
    ON CONFLICT (tenant_id, slug) DO NOTHING;

END $$;
