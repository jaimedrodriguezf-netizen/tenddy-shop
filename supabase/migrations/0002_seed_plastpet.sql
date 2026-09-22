-- ==========================================================
-- SEED DATA: Primer Tenant (PlastPET Industrial)
-- ==========================================================

DO $$
DECLARE
    plastpet_tenant_id UUID;
    cat_bebidas_id UUID;
    cat_farma_id UUID;
    cat_cosmetica_id UUID;
    cat_quimicos_id UUID;
    cat_alimentos_id UUID;
    cat_tapas_id UUID;
    branch_cali_id UUID;
    branch_bogota_id UUID;
    branch_medellin_id UUID;
BEGIN
    -- 1. Insertar Tenant PlastPET
    INSERT INTO tenants (
        slug,
        name,
        industry_type,
        logo_url,
        theme_config,
        landing_config,
        settings
    ) VALUES (
        'plastpet',
        'PlastPET Industrial S.A.S',
        'plastics',
        '/assets/logo-plastpet.png',
        '{
            "primary_color": "#0284c7",
            "secondary_color": "#06b6d4",
            "accent_color": "#10b981",
            "font_family": "Inter, sans-serif",
            "border_radius": "0.5rem"
        }'::jsonb,
        '{
            "hero_title": "Fabricantes de Envases, Botellas y Tapas en PET y PP",
            "hero_subtitle": "Soluciones de empaque industrial y cosmético. Despachos por mayor y maquila de soplado e inyección a gran escala.",
            "hero_video_url": "/process-video.mp4",
            "hero_image_url": "/hero-machine.jpg",
            "whatsapp_default": "573100000000",
            "show_catalog": true,
            "show_branches": true,
            "show_services": true
        }'::jsonb,
        '{
            "currency": "COP",
            "currency_symbol": "$",
            "requires_quote_approval": true,
            "enable_whatsapp_rfq": true
        }'::jsonb
    )
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO plastpet_tenant_id;

    -- 2. Dominios para PlastPET
    INSERT INTO tenant_domains (tenant_id, domain, is_primary, is_verified)
    VALUES 
        (plastpet_tenant_id, 'plastpet.tenddy.shop', TRUE, TRUE),
        (plastpet_tenant_id, 'plastpet.localhost', FALSE, TRUE)
    ON CONFLICT (domain) DO NOTHING;

    -- 3. Sucursales de PlastPET
    INSERT INTO branches (tenant_id, slug, name, branch_type, city, address, phone_number, phone_whatsapp, email, is_main_branch)
    VALUES
        (plastpet_tenant_id, 'planta-cali', 'Planta Matriz Yumbo - Cali', 'plant', 'Cali / Yumbo', 'Zona Industrial Acopi, Cl. 15 #32-10', '+57 2 660 0000', '573151234567', 'ventas.cali@plastpet.com', TRUE)
    ON CONFLICT (tenant_id, slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO branch_cali_id;

    INSERT INTO branches (tenant_id, slug, name, branch_type, city, address, phone_number, phone_whatsapp, email, is_main_branch)
    VALUES
        (plastpet_tenant_id, 'bodega-bogota', 'Centro Logístico Bogotá', 'warehouse', 'Bogotá D.C.', 'Autopista Medellín Km 3.5, Parque Industrial San Diego', '+57 1 740 0000', '573181234567', 'ventas.bogota@plastpet.com', FALSE)
    ON CONFLICT (tenant_id, slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO branch_bogota_id;

    INSERT INTO branches (tenant_id, slug, name, branch_type, city, address, phone_number, phone_whatsapp, email, is_main_branch)
    VALUES
        (plastpet_tenant_id, 'sede-medellin', 'Sede Distribución Medellín', 'store', 'Medellín / Itagüí', 'Carrera 42 #54A-71', '+57 4 444 0000', '573201234567', 'ventas.medellin@plastpet.com', FALSE)
    ON CONFLICT (tenant_id, slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO branch_medellin_id;

    -- 4. Categorías Industriales
    INSERT INTO categories (tenant_id, slug, name, description)
    VALUES (plastpet_tenant_id, 'bebidas-jugos', 'Bebidas & Jugos', 'Botellas cilíndricas y cuadradas para agua, jugos cold-press y bebidas')
    ON CONFLICT (tenant_id, slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO cat_bebidas_id;

    INSERT INTO categories (tenant_id, slug, name, description)
    VALUES (plastpet_tenant_id, 'farmaceutica', 'Farmacéutica & Salud', 'Frascos ámbar con protección UV y tapas de seguridad')
    ON CONFLICT (tenant_id, slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO cat_farma_id;

    INSERT INTO categories (tenant_id, slug, name, description)
    VALUES (plastpet_tenant_id, 'cosmetica', 'Cosmética & Cuidado Personal', 'Botellas Boston Round, frascos con válvula cremera y atomizadores')
    ON CONFLICT (tenant_id, slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO cat_cosmetica_id;

    INSERT INTO categories (tenant_id, slug, name, description)
    VALUES (plastpet_tenant_id, 'tapas-accesorios', 'Tapas & Accesorios', 'Tapas rosca 28mm PCO 1881, bombas cremeras y atomizadores trigger')
    ON CONFLICT (tenant_id, slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO cat_tapas_id;

    -- 5. Productos Representativos con Atributos Flexibles
    INSERT INTO products (
        tenant_id, category_id, slug, name, sku, description,
        attributes, price_tiers, min_order_qty, units_per_package, is_featured
    ) VALUES (
        plastpet_tenant_id, cat_bebidas_id, 'botella-pet-cilindrica-500ml',
        'Botella PET Cilíndrica 500ml', 'PET-CIL-500',
        'Envase cristal de alta transparencia para agua purificada, néctares y jugos naturales.',
        '{
            "material": "PET 100% Virgen (Grado Alimenticio FDA)",
            "capacidad": "500 ml",
            "cuello_rosca": "28mm PCO 1881",
            "gramaje": "24 gramos",
            "altura": "210 mm",
            "diametro": "64 mm",
            "colores_disponibles": ["Cristal Transparente", "Ámbar", "Azul Cobalto"]
        }'::jsonb,
        '[
            {"min_qty": 500, "price": 420},
            {"min_qty": 2000, "price": 380},
            {"min_qty": 10000, "price": 340}
        ]'::jsonb,
        500, 100, TRUE
    )
    ON CONFLICT (tenant_id, slug) DO NOTHING;

    INSERT INTO products (
        tenant_id, category_id, slug, name, sku, description,
        attributes, price_tiers, min_order_qty, units_per_package, is_featured
    ) VALUES (
        plastpet_tenant_id, cat_farma_id, 'frasco-ambar-pet-120ml',
        'Frasco Ámbar PET 120ml Protección UV', 'PET-AMB-120',
        'Frasco para jarabes farmacéuticos y soluciones fotosensibles con barrera UV.',
        '{
            "material": "PET Grado Farmacéutico",
            "capacidad": "120 ml",
            "cuello_rosca": "28mm DIN",
            "gramaje": "18 gramos",
            "altura": "115 mm",
            "diametro": "48 mm",
            "proteccion_uv": "Alta"
        }'::jsonb,
        '[
            {"min_qty": 1000, "price": 310},
            {"min_qty": 5000, "price": 280}
        ]'::jsonb,
        1000, 200, TRUE
    )
    ON CONFLICT (tenant_id, slug) DO NOTHING;

    INSERT INTO products (
        tenant_id, category_id, slug, name, sku, description,
        attributes, price_tiers, min_order_qty, units_per_package, is_featured
    ) VALUES (
        plastpet_tenant_id, cat_tapas_id, 'tapa-rosca-28mm-pco-1881-precinto',
        'Tapa Rosca 28mm PCO 1881 con Precinto', 'TAP-PCO-28',
        'Tapa plástica en Polipropileno (PP) con cintillo de seguridad rompible.',
        '{
            "material": "Polipropileno (PP)",
            "cuello_compatible": "28mm PCO 1881",
            "tipo_sellado": "Linerless (Auto-sellante)",
            "precinto": "Anillo de seguridad desprendible",
            "colores_disponibles": ["Blanco", "Azul", "Rojo", "Verde", "Negro"]
        }'::jsonb,
        '[
            {"min_qty": 2000, "price": 95},
            {"min_qty": 10000, "price": 82}
        ]'::jsonb,
        2000, 500, TRUE
    )
    ON CONFLICT (tenant_id, slug) DO NOTHING;

END $$;
