/**
 * AYME INDUSTRIAS PET - Solutions in Packaging
 * Catálogo Oficial B2B con Especificaciones Técnicas y Medidas Exactas
 */

const CONFIG = {
    businessName: "AYME INDUSTRIAS PET",
    subtitle: "Solutions in Packaging",
    whatsappNumber: "593998722324",
    displayPhone: "0998722324",
    internationalPhone: "+593 99 872 2324",
    address: "Llano Grande, Sector Calderón, Quito - Ecuador",
    email: "ventas@aymeindustriaspet.com",
    phone: "0998722324 / +593 99 872 2324",
    hours: "Lunes a Viernes: 8:00 AM - 5:30 PM | Sábados: 8:30 AM - 1:00 PM",
    plantLocation: "Llano Grande, Quito - Ecuador (Despachos a nivel nacional)"
};

const CATEGORIES = [
    { id: "all", name: "Todos los Envases", icon: "📦" },
    { id: "bebidas", name: "Bebidas & Jugos", icon: "🥤" },
    { id: "farma", name: "Farmacéutica & Salud", icon: "💊" },
    { id: "cosmetica", name: "Cosmética & Cuidado", icon: "🧴" },
    { id: "alimentos", name: "Alimentos & Salsas", icon: "🍯" },
    { id: "quimicos", name: "Químicos & Galones", icon: "🧪" },
    { id: "tapas", name: "Tapas & Válvulas", icon: "🔘" },
    { id: "preformas", name: "Preformas PET", icon: "⚙️" }
];

const SECTOR_TYPES = [
    { id: "all", name: "Todos los Sectores" },
    { id: "bebidas", name: "🥤 Bebidas & Alimentos" },
    { id: "farma_cosmetica", name: "🧴 Farma & Cosmética" },
    { id: "industrial", name: "🧪 Químicos & Agro" }
];

const PRODUCTS = [
    {
        id: "ayme-001",
        name: "Botella PET Cilíndrica 500ml Boca 28mm PCO",
        category: "bebidas",
        sector: "bebidas",
        packSize: 100,
        moq: 500,
        image: "/assets/products/ayme-001.svg",
        badge: "Alta Rotación",
        specs: {
            capacidad: "500 ml (16.9 oz)",
            altura: "205 mm",
            diametro: "Ø 64.2 mm",
            boca: "28 mm PCO 1881",
            gramaje: "21.0 g ± 0.5g",
            material: "PET 100% Virgen Grado Alimenticio",
            empaque: "Fardo termoencogible x 100 uds",
            acabado: "Cristal Ultra Transparente",
            resistencia: "Hasta 4.0 Bar (Apta Gasificada)"
        },
        description: "Envase PET cilíndrico estándar de alta transparencia y simetría perfecta. Diseñado para embotellado de agua purificada, jugos pasteurizados, bebidas isotónicas, té frío y sodas.",
        features: [
            "Inocuidad certificada para contacto directo con bebidas y alimentos",
            "Homogeneidad en la distribución del espesor de pared",
            "Rosca estándar PCO 1881 compatible con tapas con anillo de seguridad",
            "Disponible en cristal transparente, azul cielo o verde botillería"
        ]
    },
    {
        id: "ayme-002",
        name: "Botella PET Boston Round 250ml Boca 24/410 Cosmética",
        category: "cosmetica",
        sector: "farma_cosmetica",
        packSize: 150,
        moq: 600,
        image: "/assets/products/ayme-002.svg",
        badge: "Línea Cosmética",
        specs: {
            capacidad: "250 ml (8.4 oz)",
            altura: "152 mm",
            diametro: "Ø 56.0 mm",
            boca: "24/410 mm Cosmética",
            gramaje: "24.0 g",
            material: "PET de Alto Brillo",
            empaque: "Caja máster corrugada x 150 uds",
            acabado: "Cristalino / Ámbar / Blanco Opaco",
            resistencia: "Excelente barrera aromática y química"
        },
        description: "Clásico formato Boston Round con hombros redondeados continuos. Optimizado para líneas de cosmética, geles antibacteriales, lociones corporales, shampoos y tónicos.",
        features: [
            "Acabado superficial liso de alto brillo para serigrafía o etiquetas autoadhesivas",
            "Compatibilidad total con válvulas dosificadoras, atomizadores spray y tapas disc-top",
            "Rigidez estructural ante compresión y vaciado",
            "Opción de fabricación en color cristal, ámbar fotoprotector o blanco opaco"
        ]
    },
    {
        id: "ayme-003",
        name: "Frasco PET Farmacéutico Ámbar 120ml Boca 28mm",
        category: "farma",
        sector: "farma_cosmetica",
        packSize: 200,
        moq: 1000,
        image: "/assets/products/ayme-003.svg",
        badge: "Protección UV",
        specs: {
            capacidad: "120 ml (4.0 oz)",
            altura: "112 mm",
            diametro: "Ø 49.5 mm",
            boca: "28 mm DIN / PCO",
            gramaje: "18.5 g",
            material: "PET Grado Farmacéutico",
            empaque: "Caja higiénica termo-sellada x 200 uds",
            acabado: "Ámbar con Filtro UV Activo",
            resistencia: "Inerte a jarabes, soluciones y alcoholes"
        },
        description: "Envase farmacéutico tipo jarabe con barrera fotoquímica contra radiación UV. Especialmente diseñado para laboratorios farmacéuticos, jarabes pediátricos y fórmulas magistrales.",
        features: [
            "Protección contra degradación por luz ultravioleta",
            "Inviolabilidad con tapa rosca precintada y copas dosificadoras",
            "Producción en ambiente de grado limpio con control de partículas",
            "Certificación de no migración de polímeros"
        ]
    },
    {
        id: "ayme-004",
        name: "Garrafa / Galón PET 4 Litros con Asa Integrada Reforzada",
        category: "quimicos",
        sector: "industrial",
        packSize: 30,
        moq: 300,
        image: "/assets/products/ayme-004.svg",
        badge: "Uso Industrial Pesado",
        specs: {
            capacidad: "4.000 ml (1 Galón Americano)",
            altura: "315 mm",
            diametro: "Ø 155 mm x 132 mm (Oval)",
            boca: "38 mm Rosca de 3 Hilos",
            gramaje: "115.0 g ± 2g",
            material: "PET Virgen Reforzado",
            empaque: "Paca protegida x 30 uds",
            acabado: "Cristalino con Nervaduras Anticolapso",
            resistencia: "Apilamiento hasta 4 niveles estibados"
        },
        description: "Galón PET rígido de alto gramaje con asa ergonómica inyectada. Diseñado para productos químicos de limpieza, desinfectantes, lubricantes, aceites comestibles y cloro.",
        features: [
            "Asa resistente a caídas y esfuerzos mecánicos de transporte",
            "Fondo nervado anticolapso para llenado a presión y líquidos densos",
            "Rosca 38mm con sello de anillo de seguridad y liner de inducción",
            "Transparencia total para visualizar el nivel y color del producto envasado"
        ]
    },
    {
        id: "ayme-005",
        name: "Botella PET Cuadrada 1 Litro Boca 38mm Juice & Dairy",
        category: "bebidas",
        sector: "bebidas",
        packSize: 80,
        moq: 400,
        image: "/assets/products/ayme-005.svg",
        badge: "Línea Lácteos & Jugos",
        specs: {
            capacidad: "1.000 ml (33.8 oz)",
            altura: "235 mm",
            diametro: "78 mm x 78 mm (Base Cuadrada)",
            boca: "38 mm Boca Ancha",
            gramaje: "32.0 g",
            material: "PET Grado Alimenticio",
            empaque: "Fardo x 80 uds",
            acabado: "Cristal / Blanco Lechoso",
            resistencia: "Apta para llenado en caliente (Hot-fill)"
        },
        description: "Envase PET de sección cuadrada que maximiza el espacio en estanterías y pallets. Boca ancha de 38mm para llenado rápido de leche, yogures, jugos espesos y salsas.",
        features: [
            "Optimización de hasta un 25% de espacio en empaque secundario",
            "Panel plano para etiquetado envolvente de alta visibilidad",
            "Apta para tapas de 38mm con cierre de seguridad hermético"
        ]
    },
    {
        id: "ayme-006",
        name: "Frasco PET Boca Ancha 500ml para Alimentos & Salsas",
        category: "alimentos",
        sector: "bebidas",
        packSize: 120,
        moq: 500,
        image: "/assets/products/ayme-006.svg",
        badge: "Línea Alimentos",
        specs: {
            capacidad: "500 ml (16.9 oz)",
            altura: "138 mm",
            diametro: "Ø 82.0 mm",
            boca: "63 mm Rosca Continua",
            gramaje: "36.0 g",
            material: "PET Grado Alimentario",
            empaque: "Caja corrugada x 120 uds",
            acabado: "Cristal de Alta Transparencia",
            resistencia: "Sellado por Inducción"
        },
        description: "Pote / tarro PET de boca extra ancha de 63mm. Perfecto para envasado de miel, mermeladas, mayonesas, salsas, frutos secos, polvos nutricionales y golosinas.",
        features: [
            "Fácil dosificación y extracción del producto con cuchara",
            "Compatible con tapas rosca plásticas y sellos termosellables de aluminio",
            "Ligero e irrompible frente a los tradicionales frascos de vidrio"
        ]
    },
    {
        id: "ayme-007",
        name: "Tapa Rosca 28mm PCO 1881 con Precinto de Seguridad",
        category: "tapas",
        sector: "bebidas",
        packSize: 5000,
        moq: 10000,
        image: "/assets/products/ayme-007.svg",
        badge: "Inyección PP",
        specs: {
            capacidad: "Cierre Estándar PCO 1881",
            altura: "15.5 mm",
            diametro: "Ø 30.5 mm Exterior",
            boca: "28 mm PCO",
            gramaje: "2.4 g",
            material: "Polipropileno (PP) Copolímero",
            empaque: "Caja máster x 5.000 uds",
            acabado: "Estriado Antideslizante",
            resistencia: "Retención de gas hasta 4.5 bar"
        },
        description: "Tapas plásticas inyectadas en PP virgen con banda de seguridad autodestructible al abrir. Garantiza inviolabilidad y cierre 100% hermético para bebidas.",
        features: [
            "Colores disponibles: Rojo, Azul, Blanco, Negro, Verde, Amarillo y Dorado",
            "Liner estanco para evitar fugas de líquidos y gas",
            "Compatible con taponadoras automáticas de alta velocidad"
        ]
    },
    {
        id: "ayme-008",
        name: "Preformas PET 28mm PCO (18g - 21g - 28g - 36g)",
        category: "preformas",
        sector: "industrial",
        packSize: 8000,
        moq: 20000,
        image: "/assets/products/ayme-008.svg",
        badge: "Materia Prima Inyectada",
        specs: {
            capacidad: "Para soplado de 250ml a 1500ml",
            altura: "88 mm a 125 mm",
            diametro: "Ø 24 mm a 28 mm",
            boca: "28 mm PCO 1881 / 1810",
            gramaje: "18g / 21g / 28g / 36g",
            material: "Resina PET Virgen Grado Botella (IV 0.80 - 0.84)",
            empaque: "Octabin / Caja industrial x 8.000 uds",
            acabado: "Transparente Cristal / Azul / Ámbar",
            resistencia: "Bi-orientación homogénea"
        },
        description: "Preformas inyectadas con maquinaria europea de alta precisión y moldes de canal caliente multicanal. Libres de rebabas y con viscosidad intrínseca óptima.",
        features: [
            "Excelente procesabilidad en sopladoras lineales y rotativas",
            "Bajo nivel de acetaldehído (AA) para no alterar sabor ni olor del agua",
            "Disponibilidad continua por pallet o despacho en camión completo"
        ]
    }
];

const TESTIMONIALS = [
    {
        name: "Ing. Carlos Villavicencio",
        company: "Embotelladora Andina de Jugos",
        text: "AYME INDUSTRIAS PET es nuestro proveedor estratégico para la botella 500ml y 1L. La uniformidad de los espesores y el cierre de las roscas han reducido a cero las fallas en nuestra línea de embotellado continuo.",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
    },
    {
        name: "Dra. Mariana Benítez",
        company: "Laboratorios FarmaPlus",
        text: "Los frascos ámbar con protección UV cumplen con todas las especificaciones de inocuidad y hermeticidad que exige nuestra línea médica. Destaco la puntualidad en los despachos.",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80"
    },
    {
        name: "Lcdo. Fernando Alarcón",
        company: "Químicos & Limpieza del Pacífico",
        text: "Las garrafas de 4L tienen un asa reforzada insuperable para el transporte de cloro y detergentes. Excelente atención comercial y respuesta inmediata por WhatsApp.",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80"
    }
];

const FAQS = [
    {
        q: "¿Cuál es el pedido mínimo (MOQ) para envases estándar?",
        a: "Para referencias en stock despachamos desde 1 fardo o caja (100 a 200 unidades según el modelo). Para entregas al por mayor con escala de fábrica los mínimos sugeridos van desde 1.000 a 5.000 unidades."
    },
    {
        q: "¿Realizan despachos a nivel nacional?",
        a: "Sí, despachamos pedidos a todo el Ecuador a través de transporte logístico seguro o entrega directa en planta para retiro de transporte propio."
    },
    {
        q: "¿Pueden fabricar un molde con diseño exclusivo de mi marca?",
        a: "Por supuesto. Contamos con departamento de ingeniería para desarrollo 3D, prototipado y mecanizado CNC de moldes de soplado e inyección en aluminio aeronáutico y acero."
    },
    {
        q: "¿Los envases son aptos para contacto con alimentos y medicinas?",
        a: "100% sí. Empleamos únicamente resina virgen de primera calidad con certificaciones internacionales de no migración para contacto alimenticio y farmacéutico."
    }
];
const SERVICES = [
    {
        id: "serv-001",
        title: "Diseño 3D & Fabricación de Moldes CNC",
        icon: "📐",
        duration: "15 - 25 Días",
        image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
        description: "Desarrollo de matrices y moldes en aluminio aeronáutico y acero para envases exclusivos de marca propia.",
        features: ["Modelado CAD/CAM paramétrico", "Prototipado rápido 3D en resina", "Mecanizado CNC de alta precisión", "Pruebas de soplado y control de espesores"]
    },
    {
        id: "serv-002",
        title: "Maquila de Soplado e Inyección PET/PP",
        icon: "🏭",
        duration: "Producción Continua",
        image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80",
        description: "Líneas de soplado de alta velocidad para grandes volúmenes de botellas, frascos y galones industriales.",
        features: ["Capacidad +12.000 BPH", "Inyección de tapas y preformas", "Control de calidad óptico y de hermeticidad", "Entrega paletizada con film termoencogible"]
    },
    {
        id: "serv-003",
        title: "Pigmentación & Desarrollo de Color Personalizado",
        icon: "🎨",
        duration: "3 - 5 Días",
        image: "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80",
        description: "Formulación de masterbatch para tonalidades transparentes, ámbar con filtro UV, colores opacos y traslúcidos.",
        features: ["Igualación de color Pantone", "Filtro UV grado farmacéutico", "Resinas 100% virgen certificadas FDA", "Estabilidad térmica en proceso"]
    },
    {
        id: "serv-004",
        title: "Serigrafía Industrial & Termoencogible",
        icon: "🏷️",
        duration: "5 - 7 Días",
        image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80",
        description: "Decoración directa en envases y aplicación de manga termoencogible (shrink sleeve) 360 grados.",
        features: ["Impresión UV hasta 4 tintas", "Túnel de termocontracción de vapor", "Alta resistencia al frote y humedad", "Acabados brillantes y mate"]
    }
];
