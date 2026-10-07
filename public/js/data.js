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

// Los productos del catálogo se sincronizan en vivo desde la base de datos de Supabase (/api/store/ayme-pet/products)
const PRODUCTS = [];

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
