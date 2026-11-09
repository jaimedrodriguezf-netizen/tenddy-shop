'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  Factory,
  Menu,
  X,
  ChevronUp,
  Boxes,
  FileText,
  SlidersHorizontal,
  Search,
  ExternalLink,
  HelpCircle,
  Home,
  Play,
  Pause,
  ShieldCheck,
  Zap,
  Snowflake
} from 'lucide-react';
import { buildStorefrontThemeCSS } from '@/lib/theme-tokens';
import { resolveLandingSections, LandingSectionsConfig } from '@/lib/types';

interface AymeLandingProps {
  initialSections?: Partial<LandingSectionsConfig>;
}

// Catálogo oficial de envases y preformas de AYME INDUSTRIAS PET sincronizado con Supabase (43 referencias activas)
const AYME_PRODUCTS = [
  {
    id: "6b93781b-0547-469e-86fe-30f356bb07c9",
    sku: "AYME-001",
    name: "Cuchara Plástica 11.5 cm Color Crema",
    category: "CUBIERTO",
    type: "horeca",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "/assets/products/ayme-001.svg",
    formValue: "Cuchara Plástica 11.5 cm Color Crema",
    description: "El Cuchara Plástica 11.5 cm Color Crema está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría CUBIERTO, uso comercial, gastronómico o industrial.",
  },
  {
    id: "26cd4c7d-b0dd-4099-8f6f-7774606d7eee",
    sku: "AYME-002",
    name: "Cuchara Pequeña de Plástico 4.5 cm",
    category: "CUBIERTO",
    type: "horeca",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/16KMP005VJvnj-TflzzYi_jyxCC0YSANt=w800",
    formValue: "Cuchara Pequeña de Plástico 4.5 cm",
    description: "El Cuchara Pequeña de Plástico 4.5 cm está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría CUBIERTO, uso comercial, gastronómico o industrial.",
  },
  {
    id: "85a8ebca-96b4-40d3-8f55-e32544c36ec4",
    sku: "AYME-003",
    name: "Cuchara Plástica 11.5 cm Color Blanco",
    category: "CUBIERTO",
    type: "horeca",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/1Stb_5JO5ND1VY_Yihts0VYx89L3_SSez=w800",
    formValue: "Cuchara Plástica 11.5 cm Color Blanco",
    description: "El Cuchara Plástica 11.5 cm Color Blanco está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría CUBIERTO, uso comercial, gastronómico o industrial.",
  },
  {
    id: "7cc11a7b-a6b6-4eae-97a1-2fe991956df2",
    sku: "AYME-004",
    name: "Envase PET 355 ml Alto 15.5 cm",
    category: "ENVASES PET",
    type: "envases",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/1zOHnytNcANoUk0c-lEVh_RtCGOPJzG9H=w800",
    formValue: "Envase PET 355 ml Alto 15.5 cm",
    description: "El Envase PET 355 ml Alto 15.5 cm está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría ENVASES PET, uso comercial, gastronómico o industrial.",
  },
  {
    id: "008ff747-99f9-47be-a36d-758ebb5570d1",
    sku: "AYME-005",
    name: "Envase Plástico PET 270 ml Cilíndrico",
    category: "ENVASES PET",
    type: "envases",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/1JUm9ime9XmzgWOOPl4_BddmY8P8vh3x5=w800",
    formValue: "Envase Plástico PET 270 ml Cilíndrico",
    description: "El Envase Plástico PET 270 ml Cilíndrico está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría ENVASES PET, uso comercial, gastronómico o industrial.",
  },
  {
    id: "ffeead7f-2228-4d1c-82d3-0829613fd23b",
    sku: "AYME-006",
    name: "Envase PET 355 ml Alto 12 cm",
    category: "ENVASES PET",
    type: "envases",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/1pYdjFZdorPS--JVYcLY4Yd-neddrPLMF=w800",
    formValue: "Envase PET 355 ml Alto 12 cm",
    description: "El Envase PET 355 ml Alto 12 cm está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría ENVASES PET, uso comercial, gastronómico o industrial.",
  },
  {
    id: "50a6e4de-9ffe-4d9d-953c-1b8b4ad9660c",
    sku: "AYME-007",
    name: "Envase Plástico PET Cilíndrico Botella 500 ml",
    category: "ENVASES PET",
    type: "botellas",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/1HvPJDjsxUgHMXrIUQShLV4YuQk1Ppbaf=w800",
    formValue: "Envase Plástico PET Cilíndrico Botella 500 ml",
    description: "El Envase Plástico PET Cilíndrico Botella 500 ml está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría ENVASES PET, uso comercial, gastronómico o industrial.",
  },
  {
    id: "231d084b-42aa-4c07-8cf2-b07899264002",
    sku: "AYME-008",
    name: "Envase Plástico PET Tipo Campana",
    category: "ENVASES PET",
    type: "envases",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/1MwHXlSvupBu3KTje6-wZTIJ52SW1Qw9T=w800",
    formValue: "Envase Plástico PET Tipo Campana",
    description: "El Envase Plástico PET Tipo Campana está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría ENVASES PET, uso comercial, gastronómico o industrial.",
  },
  {
    id: "1804a1fb-61b2-4fbb-8019-fb065341c88c",
    sku: "AYME-009",
    name: "Envase Plástico PET 400 ml Cuadrado (Tapa Roja)",
    category: "ENVASES PET",
    type: "cierres",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/1fvxvKe1NflOpGGTHRNMUKC192J_0Gf7F=w800",
    formValue: "Envase Plástico PET 400 ml Cuadrado (Tapa Roja)",
    description: "El Envase Plástico PET 400 ml Cuadrado (Tapa Roja) está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría ENVASES PET, uso comercial, gastronómico o industrial.",
  },
  {
    id: "10bab8a7-6995-44ba-aa36-24384c878515",
    sku: "AYME-010",
    name: "Peine Triangular Texturizador con 2 Bordes Dentados 10 cm - Repostería",
    category: "Horeca",
    type: "reposteria",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/1tNPfvJq5BCn6A3BGz4ZuIe0OiQWiPoTM=w800",
    formValue: "Peine Triangular Texturizador con 2 Bordes Dentados 10 cm - Repostería",
    description: "El Peine Triangular Texturizador con 2 Bordes Dentados 10 cm - Repostería está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría Horeca, uso comercial, gastronómico o industrial.",
  },
  {
    id: "b1f2e7c4-36d3-408e-9bc2-21d5c966eaaa",
    sku: "AYME-011",
    name: "Espátula Plana Rasqueta con Base Rectangular 18 cm - Pastelería HORECA",
    category: "Horeca",
    type: "reposteria",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/1nlanjwg6xDZDKW7SaPOJn8brTaua9NCr=w800",
    formValue: "Espátula Plana Rasqueta con Base Rectangular 18 cm - Pastelería HORECA",
    description: "El Espátula Plana Rasqueta con Base Rectangular 18 cm - Pastelería HORECA está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría Horeca, uso comercial, gastronómico o industrial.",
  },
  {
    id: "2524c6db-e1aa-4e95-b759-7cf11745cbb1",
    sku: "AYME-012",
    name: "Espátula Decoradora de Tortas Diseño Corazón 9,7 cm - Repostería",
    category: "Horeca",
    type: "reposteria",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/1ck-iEpLtWzVEoFBt3kNqO9uxDQtIr2aJ=w800",
    formValue: "Espátula Decoradora de Tortas Diseño Corazón 9,7 cm - Repostería",
    description: "El Espátula Decoradora de Tortas Diseño Corazón 9,7 cm - Repostería está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría Horeca, uso comercial, gastronómico o industrial.",
  },
  {
    id: "2dae9d66-00f1-47e7-bf55-ce0f60d02a3b",
    sku: "AYME-013",
    name: "Espátula Curva Ergonómica de Plástico para Repostería 26 cm",
    category: "Horeca",
    type: "reposteria",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/1bmbDIASOKr5QuPyZ64Me52Y4jt5mD2FY=w800",
    formValue: "Espátula Curva Ergonómica de Plástico para Repostería 26 cm",
    description: "El Espátula Curva Ergonómica de Plástico para Repostería 26 cm está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría Horeca, uso comercial, gastronómico o industrial.",
  },
  {
    id: "00085103-c9a6-451e-a513-63a99c4f5c56",
    sku: "AYME-014",
    name: "Paleta y Espátula Plástica para Repostería 19 cm Color Fucsia",
    category: "Horeca",
    type: "reposteria",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/1o4vYbvuDsfxdoHDCDbXEpdMZPLTiK2CC=w800",
    formValue: "Paleta y Espátula Plástica para Repostería 19 cm Color Fucsia",
    description: "El Paleta y Espátula Plástica para Repostería 19 cm Color Fucsia está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría Horeca, uso comercial, gastronómico o industrial.",
  },
  {
    id: "8906e2bb-62ca-4d99-96f2-5b8b4402dbe5",
    sku: "AYME-015",
    name: "Espátula Plástica Profesional para Cocina y Repostería 18 cm (Roja)",
    category: "Horeca",
    type: "reposteria",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/1jEXW9xAVkGJoIpMIdDTRTunq0Qqg_n3U=w800",
    formValue: "Espátula Plástica Profesional para Cocina y Repostería 18 cm (Roja)",
    description: "El Espátula Plástica Profesional para Cocina y Repostería 18 cm (Roja) está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría Horeca, uso comercial, gastronómico o industrial.",
  },
  {
    id: "43b22fe6-4b70-4940-bf7f-6d3ef934c4bd",
    sku: "AYME-016",
    name: "Peine Triangular Dentado Grande Bakels 12 cm para Decoración de Tortas",
    category: "Horeca",
    type: "reposteria",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/1IuujaEPhxRb5koHSctNhjV1Uw5zTKWHd=w800",
    formValue: "Peine Triangular Dentado Grande Bakels 12 cm para Decoración de Tortas",
    description: "El Peine Triangular Dentado Grande Bakels 12 cm para Decoración de Tortas está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría Horeca, uso comercial, gastronómico o industrial.",
  },
  {
    id: "fefa65e3-9e08-4160-b92f-b13604d5a8a2",
    sku: "AYME-017",
    name: "Peine Decorador Rectangular Bakels de 14 cm para Tortas y Repostería",
    category: "Horeca",
    type: "reposteria",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/11LJ2j-tHqjrb-JCCUrpe2UrJoiCTcv-o=w800",
    formValue: "Peine Decorador Rectangular Bakels de 14 cm para Tortas y Repostería",
    description: "El Peine Decorador Rectangular Bakels de 14 cm para Tortas y Repostería está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría Horeca, uso comercial, gastronómico o industrial.",
  },
  {
    id: "ce39a93a-a8a4-4d54-b05e-dec65c96a0f7",
    sku: "AYME-018",
    name: "Peine alisador y espátula de plástico para repostería y decoración de tortas - Bakels",
    category: "Horeca",
    type: "reposteria",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/1agN-uucuvNtynKx_irV_GtxDcM7mGq1A=w800",
    formValue: "Peine alisador y espátula de plástico para repostería y decoración de tortas - Bakels",
    description: "El Peine alisador y espátula de plástico para repostería y decoración de tortas - Bakels está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría Horeca, uso comercial, gastronómico o industrial.",
  },
  {
    id: "14506fb0-8f1e-401a-afd0-c552e747a7f2",
    sku: "AYME-019",
    name: "Balde Blanco Plástico Multiuso 1.200 ml (1.2 L) con Tapa",
    category: "PLASTICO",
    type: "galones",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/1qN1iesxq1tGoutUuljElVvlUmqJen--T=w800",
    formValue: "Balde Blanco Plástico Multiuso 1.200 ml (1.2 L) con Tapa",
    description: "El Balde Blanco Plástico Multiuso 1.200 ml (1.2 L) con Tapa está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría PLASTICO, uso comercial, gastronómico o industrial.",
  },
  {
    id: "1172bd19-f143-4ee4-8721-52733f710a02",
    sku: "AYME-020",
    name: "Balde Blanco Plástico Multiuso 3.500 ml (3.5 L) con Tapa y Asa",
    category: "PLASTICO",
    type: "galones",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/1Y8PhGGjhJBDBrqbRs9ri5qxwAuOuf6G5=w800",
    formValue: "Balde Blanco Plástico Multiuso 3.500 ml (3.5 L) con Tapa y Asa",
    description: "El Balde Blanco Plástico Multiuso 3.500 ml (3.5 L) con Tapa y Asa está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría PLASTICO, uso comercial, gastronómico o industrial.",
  },
  {
    id: "e76965ff-f0a3-4d38-8b9e-5a2917ac7221",
    sku: "AYME-021",
    name: "Preforma Plástica PET 100 g",
    category: "PLASTICO",
    type: "preformas",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/1BtpgLsXnUb7UmrHXrEnX9TdHJHErrJzo=w800",
    formValue: "Preforma Plástica PET 100 g",
    description: "El Preforma Plástica PET 100 g está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría PLASTICO, uso comercial, gastronómico o industrial.",
  },
  {
    id: "45fd5ee9-11f4-48cc-b84f-9bc12007669b",
    sku: "AYME-022",
    name: "Preforma Plástica PET 13 g",
    category: "PLASTICO",
    type: "preformas",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/1XQz5zSMmVM5NBoQe-L6S9p_8-0pPBu-P=w800",
    formValue: "Preforma Plástica PET 13 g",
    description: "El Preforma Plástica PET 13 g está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría PLASTICO, uso comercial, gastronómico o industrial.",
  },
  {
    id: "dcd9780a-021a-4f86-9013-9f11e997f895",
    sku: "AYME-023",
    name: "Preforma Plástica PET 14.5 g",
    category: "PLASTICO",
    type: "preformas",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/15dyElb8G9Ez8XuxtuQh9Wbubq_tx5tSC=w800",
    formValue: "Preforma Plástica PET 14.5 g",
    description: "El Preforma Plástica PET 14.5 g está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría PLASTICO, uso comercial, gastronómico o industrial.",
  },
  {
    id: "df3f4ce9-0ea0-40a5-91a1-12fec25e71a0",
    sku: "AYME-024",
    name: "Preforma Plástica PET 17.7 g (Pico 1881)",
    category: "PLASTICO",
    type: "preformas",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/1cOU8yxFaXpx2XPxE9kcks7fOMtnqrQhw=w800",
    formValue: "Preforma Plástica PET 17.7 g (Pico 1881)",
    description: "El Preforma Plástica PET 17.7 g (Pico 1881) está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría PLASTICO, uso comercial, gastronómico o industrial.",
  },
  {
    id: "242940df-8871-4677-b2a6-5e41fa9f7bbd",
    sku: "AYME-025",
    name: "Preforma Plástica PET 19.7 g",
    category: "PLASTICO",
    type: "preformas",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/1awsr_C7QhgHHSmOzXO4LJFj6giO9RfaJ=w800",
    formValue: "Preforma Plástica PET 19.7 g",
    description: "El Preforma Plástica PET 19.7 g está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría PLASTICO, uso comercial, gastronómico o industrial.",
  },
  {
    id: "8e32cbae-89d7-464e-9235-c5cfce2ad6b1",
    sku: "AYME-026",
    name: "Preforma Plástica PET 30 g (Pico 38 mm)",
    category: "PLASTICO",
    type: "preformas",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/15j0i8lTKotpQoAmtv-uf6Cl23z4zBywv=w800",
    formValue: "Preforma Plástica PET 30 g (Pico 38 mm)",
    description: "El Preforma Plástica PET 30 g (Pico 38 mm) está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría PLASTICO, uso comercial, gastronómico o industrial.",
  },
  {
    id: "0b9ece67-9d8e-435e-ae86-d04b12afa43f",
    sku: "AYME-027",
    name: "Preforma Plástica PET 43 g",
    category: "PLASTICO",
    type: "preformas",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/1yWC-UvLrPPKZe1NyFExUSgX_ARwaMg1o=w800",
    formValue: "Preforma Plástica PET 43 g",
    description: "El Preforma Plástica PET 43 g está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría PLASTICO, uso comercial, gastronómico o industrial.",
  },
  {
    id: "44f5e0b1-485d-43b4-ba05-7f95764597b5",
    sku: "AYME-028",
    name: "Preforma Plástica PET 46 g",
    category: "PLASTICO",
    type: "preformas",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/1djV8zsyTu69XE_CzY_PUZ9MK0JxS8LcU=w800",
    formValue: "Preforma Plástica PET 46 g",
    description: "El Preforma Plástica PET 46 g está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría PLASTICO, uso comercial, gastronómico o industrial.",
  },
  {
    id: "6d44075d-7923-46d1-9556-9bc31fd8527a",
    sku: "AYME-029",
    name: "Preforma Plástica PET 90 g",
    category: "PLASTICO",
    type: "preformas",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/16OTVQT4d7iIMuV7lexvas9TFnd297D2F=w800",
    formValue: "Preforma Plástica PET 90 g",
    description: "El Preforma Plástica PET 90 g está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría PLASTICO, uso comercial, gastronómico o industrial.",
  },
  {
    id: "43ee1ee8-6320-4dcd-a317-bda8797b8730",
    sku: "AYME-030",
    name: "Envase Plástico Oso 200 ml (Translúcido con Tapa Rosca)",
    category: "POLIETILENO",
    type: "cierres",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/1GBnxoVL4cEKTBt0qL-eNNenFww65txoN=w800",
    formValue: "Envase Plástico Oso 200 ml (Translúcido con Tapa Rosca)",
    description: "El Envase Plástico Oso 200 ml (Translúcido con Tapa Rosca) está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría POLIETILENO, uso comercial, gastronómico o industrial.",
  },
  {
    id: "f1511142-f447-45e1-a7e3-af84fcfab508",
    sku: "AYME-031",
    name: "Envase Plástico Cilíndrico 500 ml (Tapa Amarilla Polietileno)",
    category: "POLIETILENO",
    type: "cierres",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/1fBaFa0YR2AeGeL-3mrPQZCcCsfoRBu3R=w800",
    formValue: "Envase Plástico Cilíndrico 500 ml (Tapa Amarilla Polietileno)",
    description: "El Envase Plástico Cilíndrico 500 ml (Tapa Amarilla Polietileno) está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría POLIETILENO, uso comercial, gastronómico o industrial.",
  },
  {
    id: "5c0f0479-22c6-44fe-8bf1-9078da014be4",
    sku: "AYME-032",
    name: "Envase Plástico Oso Rojo 200 ml (con Pico Dosificador)",
    category: "POLIETILENO",
    type: "envases",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/1m_BNtbArUwMCgOSYRNjYgyRDym_S9wbu=w800",
    formValue: "Envase Plástico Oso Rojo 200 ml (con Pico Dosificador)",
    description: "El Envase Plástico Oso Rojo 200 ml (con Pico Dosificador) está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría POLIETILENO, uso comercial, gastronómico o industrial.",
  },
  {
    id: "6f421ef3-9ec6-48ac-8f8b-7f23edae5120",
    sku: "AYME-033",
    name: "Envase Plástico Oso Rojo 400 ml con Pico Dosificador",
    category: "POLIETILENO",
    type: "envases",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/1Pzu2TNqd7IPA6c_Xh_7zvQrlL8EhQ4yA=w800",
    formValue: "Envase Plástico Oso Rojo 400 ml con Pico Dosificador",
    description: "El Envase Plástico Oso Rojo 400 ml con Pico Dosificador está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría POLIETILENO, uso comercial, gastronómico o industrial.",
  },
  {
    id: "14c80188-891a-4077-86e6-3320480d99b2",
    sku: "AYME-034",
    name: "Envase Plástico Galón 3.500 ml (1 Galón)",
    category: "POLIETILENO",
    type: "galones",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/1HFXcLqgG-lXCb_YohWFL332GniStkRHQ=w800",
    formValue: "Envase Plástico Galón 3.500 ml (1 Galón)",
    description: "El Envase Plástico Galón 3.500 ml (1 Galón) está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría POLIETILENO, uso comercial, gastronómico o industrial.",
  },
  {
    id: "f92d95f1-9472-4a1b-87f3-2ee9b03e2973",
    sku: "AYME-035",
    name: "Sello Industrial / Separador y Disco Plástico",
    category: "SELLO INDUSTRIAL",
    type: "cierres",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/1svTt7sgM6Sk79gwnVXbOBusA9YbJfpcz=w800",
    formValue: "Sello Industrial / Separador y Disco Plástico",
    description: "El Sello Industrial / Separador y Disco Plástico está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría SELLO INDUSTRIAL, uso comercial, gastronómico o industrial.",
  },
  {
    id: "0a8bec8d-aa26-4cb9-b85a-ece32f664bf4",
    sku: "AYME-036",
    name: "Envase Plástico Rectangular 1.000 ml (Tapa Roja)",
    category: "VASOS POLIPROPILENO",
    type: "horeca",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/1npWrRVC8e06-9SubAHlgx7SkyrxhH-pE=w800",
    formValue: "Envase Plástico Rectangular 1.000 ml (Tapa Roja)",
    description: "El Envase Plástico Rectangular 1.000 ml (Tapa Roja) está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría VASOS POLIPROPILENO, uso comercial, gastronómico o industrial.",
  },
  {
    id: "1b074205-c92c-43aa-97cc-451650d2835f",
    sku: "AYME-037",
    name: "Envase Plástico Rectangular 450 ml (Tapa Azul)",
    category: "VASOS POLIPROPILENO",
    type: "horeca",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/1-yhNQRLW3TFpoQK7pIM-Lr7SSpdw_0Sp=w800",
    formValue: "Envase Plástico Rectangular 450 ml (Tapa Azul)",
    description: "El Envase Plástico Rectangular 450 ml (Tapa Azul) está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría VASOS POLIPROPILENO, uso comercial, gastronómico o industrial.",
  },
  {
    id: "4b1f4247-238c-4950-ba26-4413ceddf0a0",
    sku: "AYME-038",
    name: "Envase Plástico para Muestra",
    category: "VASOS POLIPROPILENO",
    type: "horeca",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/18YqaqCJF1f1NHXvzSBJ50XlCACt8_moe=w800",
    formValue: "Envase Plástico para Muestra",
    description: "El Envase Plástico para Muestra está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría VASOS POLIPROPILENO, uso comercial, gastronómico o industrial.",
  },
  {
    id: "5ef92d79-a75e-466b-97b9-b4dfb553ba78",
    sku: "AYME-039",
    name: "Envase Plástico Ovalado 450 ml (Tapa Verde)",
    category: "VASOS POLIPROPILENO",
    type: "horeca",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/1lsio-1cqkPPcJneVgIxGXPR-haur1D3K=w800",
    formValue: "Envase Plástico Ovalado 450 ml (Tapa Verde)",
    description: "El Envase Plástico Ovalado 450 ml (Tapa Verde) está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría VASOS POLIPROPILENO, uso comercial, gastronómico o industrial.",
  },
  {
    id: "26ac5ad9-ddb0-4aa1-b521-a019fa277119",
    sku: "AYME-040",
    name: "Pajilla / Sorvete Mezcladora de Plástico",
    category: "VASOS POLIPROPILENO",
    type: "horeca",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/19NjnXWw-DOOcBNCvdrCRr618hARk6bdi=w800",
    formValue: "Pajilla / Sorvete Mezcladora de Plástico",
    description: "El Pajilla / Sorvete Mezcladora de Plástico está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría VASOS POLIPROPILENO, uso comercial, gastronómico o industrial.",
  },
  {
    id: "01b0f10f-63a8-4d56-a706-3d80d5a4b9ba",
    sku: "AYME-041",
    name: "Vaso Plástico Negro 250 ml",
    category: "VASOS POLIPROPILENO",
    type: "horeca",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/1UxZF2GU8FI9mJj_Jn0wZJVG7yxGG7lZl=w800",
    formValue: "Vaso Plástico Negro 250 ml",
    description: "El Vaso Plástico Negro 250 ml está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría VASOS POLIPROPILENO, uso comercial, gastronómico o industrial.",
  },
  {
    id: "1d4346cd-b41a-4c68-9016-1edab3f4d2d7",
    sku: "AYME-042",
    name: "Vaso de Polipropileno 250 ml (Ron Abuelo)",
    category: "VASOS POLIPROPILENO",
    type: "horeca",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/1G1Ft5UoglfXDs1N2KAJOZLt2Ff5ROHnV=w800",
    formValue: "Vaso de Polipropileno 250 ml (Ron Abuelo)",
    description: "El Vaso de Polipropileno 250 ml (Ron Abuelo) está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría VASOS POLIPROPILENO, uso comercial, gastronómico o industrial.",
  },
  {
    id: "c961fe8c-bd12-4f3d-b93e-1953be494563",
    sku: "AYME-043",
    name: "Vaso de Polipropileno 180 ml (Tapa Roja)",
    category: "VASOS POLIPROPILENO",
    type: "horeca",
    neck: "Rosca Estándar Industrial",
    weight: "Estándar",
    height: "Cota estándar de ingeniería",
    diameter: "Diámetro estándar",
    packaging: "12 uds / fardo",
    palletQty: "3.600 uds / palet americano",
    image: "https://lh3.googleusercontent.com/d/1H0cpw7VSXWoJks6stjv40GA0NML1sLYp=w800",
    formValue: "Vaso de Polipropileno 180 ml (Tapa Roja)",
    description: "El Vaso de Polipropileno 180 ml (Tapa Roja) está diseñado para ofrecer máxima resistencia, durabilidad y practicidad en aplicaciones de la categoría VASOS POLIPROPILENO, uso comercial, gastronómico o industrial.",
  },
];

// Preguntas frecuentes industriales B2B
const AYME_FAQS = [
  {
    q: '¿Cuál es el pedido mínimo (MOQ) para envases en stock y bajo pedido?',
    a: 'Para referencias estándar en stock despachamos desde 1 fardo (80 a 200 unidades según el modelo). Para corridas de producción a gran escala con precios mayoristas de planta, el mínimo sugerido es de 1.000 a 5.000 unidades.',
  },
  {
    q: '¿Realizan despachos paletizados a provincias fuera de Pichincha / Quito?',
    a: 'Sí, despachamos a todo el territorio ecuatoriano a través de logística de carga paletizada protegida con film termoencogible, o mediante retiro directo en la bodega de nuestra planta en Calderón.',
  },
  {
    q: '¿Los envases cuentan con certificaciones de inocuidad y grado alimenticio?',
    a: '100% sí. Empleamos exclusivamente resina PET y PP 100% virgen con certificados internacionales de no migración química, aptos para contacto directo con alimentos, bebidas, fármacos y cosméticos.',
  },
  {
    q: '¿Pueden fabricar un molde exclusivo con diseño y logo propio de mi marca?',
    a: 'Por supuesto. Nuestro departamento de ingeniería realiza modelado 3D CAD/CAM paramétrico, prototipado y mecanizado CNC en aluminio aeronáutico para matrices de 1 a 4 cavidades.',
  },
];

export default function AymeCorporateLandingPage({ initialSections }: AymeLandingProps) {
  const sections = resolveLandingSections(initialSections, 'AYME INDUSTRIAS PET', 'ayme-pet');
  const primaryColor = '#A61C2E';
  const secondaryColor = '#8C1625';
  const themeStyles = buildStorefrontThemeCSS(primaryColor, secondaryColor);

  const [contactName, setContactName] = useState('');
  const [contactCompany, setContactCompany] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactProduct, setContactProduct] = useState('Botella PET 500ml');
  const [contactVolume, setContactVolume] = useState('5.000 a 10.000 uds/mes');

  // Control de video de fondo y secuencia de scroll 60fps
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<HTMLElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(true);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [frameIndex, setFrameIndex] = useState<number>(1);

  const toggleVideoPlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsVideoPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
  };

  const scrollToPhase = (targetProgressRatio: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const trackTop = rect.top + scrollTop;
    const totalScrollable = rect.height - window.innerHeight;
    if (totalScrollable <= 0) return;
    const targetScroll = trackTop + totalScrollable * targetProgressRatio;
    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
  };

  // Control de menú móvil
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Control de Smart Hide y Sólido en Header para AYME
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isHeaderSolid, setIsHeaderSolid] = useState(false);

  // Scroll Spy: sección activa en navegación
  const [activeSection, setActiveSection] = useState('inicio');

  // Filtrado y búsqueda de catálogo
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal B2B de Ficha Técnica
  const [technicalModalProduct, setTechnicalModalProduct] = useState<(typeof AYME_PRODUCTS)[number] | null>(null);

  // Acordeón de FAQs
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Feedback visual al cotizar un producto
  const [highlightForm, setHighlightForm] = useState(false);

  // Navegación secuencial en Modal de Ficha Técnica
  const openProductModal = (prod: (typeof AYME_PRODUCTS)[number]) => {
    setTechnicalModalProduct(prod);
    try {
      if (typeof window !== 'undefined') {
        window.history.pushState({ modal: 'product', id: prod.id }, '', '#catalogo');
      }
    } catch {}
  };

  const handlePrevProduct = () => {
    if (!technicalModalProduct) return;
    const currentIndex = AYME_PRODUCTS.findIndex((p) => p.id === technicalModalProduct.id);
    const prevIndex = (currentIndex - 1 + AYME_PRODUCTS.length) % AYME_PRODUCTS.length;
    setTechnicalModalProduct(AYME_PRODUCTS[prevIndex]);
  };

  const handleNextProduct = () => {
    if (!technicalModalProduct) return;
    const currentIndex = AYME_PRODUCTS.findIndex((p) => p.id === technicalModalProduct.id);
    const nextIndex = (currentIndex + 1) % AYME_PRODUCTS.length;
    setTechnicalModalProduct(AYME_PRODUCTS[nextIndex]);
  };

  // Escuchar teclas para modal (Esc para cerrar, flechas para hojear)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTechnicalModalProduct(null);
      } else if (e.key === 'ArrowLeft' && technicalModalProduct) {
        handlePrevProduct();
      } else if (e.key === 'ArrowRight' && technicalModalProduct) {
        handleNextProduct();
      }
    };
    const handlePopState = () => {
      if (technicalModalProduct) {
        setTechnicalModalProduct(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [technicalModalProduct]);

  useEffect(() => {
    let prevY = window.scrollY;

    const handleScrollEvents = () => {
      const currentY = window.scrollY;
      const diff = currentY - prevY;

      // Smart Header: visibilidad y opacidad
      if (currentY <= 60) {
        setIsHeaderVisible(true);
        setIsHeaderSolid(false);
      } else {
        setIsHeaderSolid(true);
        if (diff > 8 && currentY > 120) {
          setIsHeaderVisible(false);
        } else if (diff < -6) {
          setIsHeaderVisible(true);
        }
      }

      // Scroll Spy: detección de sección activa
      const sectionIds = ['inicio', 'catalogo', 'faqs', 'cotizar'];
      const scrollThreshold = currentY + 160;

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const id = sectionIds[i];
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollThreshold) {
          setActiveSection(id);
          break;
        }
      }

      prevY = currentY;
    };

    window.addEventListener('scroll', handleScrollEvents, { passive: true });
    handleScrollEvents();
    return () => window.removeEventListener('scroll', handleScrollEvents);
  }, []);

  // Listener para la Secuencia de Scroll con Lerp continuo a 60fps optimizado
  useEffect(() => {
    let currentProgress = 0;
    let targetProgress = 0;
    let rafId: number | null = null;

    const calculateProgress = () => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      if (rect.bottom < 0) {
        targetProgress = 1;
        return;
      }
      if (rect.top > windowHeight) {
        targetProgress = 0;
        return;
      }

      const totalScrollable = rect.height - windowHeight;
      if (totalScrollable <= 0) return;
      const scrolled = -rect.top;
      targetProgress = Math.max(0, Math.min(1, scrolled / totalScrollable));
    };

    const tick = () => {
      const diff = targetProgress - currentProgress;
      if (Math.abs(diff) < 0.001) {
        currentProgress = targetProgress;
        rafId = null;
      } else {
        currentProgress += diff * 0.35;
        rafId = requestAnimationFrame(tick);
      }
      setScrollProgress(currentProgress);
      const fIndex = Math.min(144, Math.max(1, Math.floor(currentProgress * 143) + 1));
      setFrameIndex(fIndex);
    };

    const onScroll = () => {
      calculateProgress();
      if (!rafId && Math.abs(targetProgress - currentProgress) >= 0.001) {
        rafId = requestAnimationFrame(tick);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  // Cálculo de opacidades y traslaciones de las tarjetas del Hero interactivo
  const introOpacity = scrollProgress <= 0.22
    ? (scrollProgress > 0.12 ? Math.max(0, Math.min(1, (0.22 - scrollProgress) / 0.10)) : 1)
    : 0;
  const introTranslate = (1 - introOpacity) * -25;

  const step1Opacity = (scrollProgress >= 0.22 && scrollProgress <= 0.58)
    ? (scrollProgress < 0.32 ? (scrollProgress - 0.22) / 0.10 : (scrollProgress > 0.48 ? (0.58 - scrollProgress) / 0.10 : 1))
    : 0;
  const step1Translate = (1 - step1Opacity) * 25;

  const step2Opacity = (scrollProgress >= 0.58 && scrollProgress <= 0.98)
    ? (scrollProgress < 0.68 ? (scrollProgress - 0.58) / 0.10 : (scrollProgress > 0.88 ? (0.98 - scrollProgress) / 0.10 : 1))
    : 0;
  const step2Translate = (1 - step2Opacity) * 25;

  const mainWhatsapp = '593998722324';
  const displayPhone = '099 872 2324';

  const handleSelectProductAndQuote = (productName: string) => {
    setContactProduct(productName);
    setTechnicalModalProduct(null);
    setHighlightForm(true);

    const target = document.getElementById('cotizar');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }

    setTimeout(() => {
      setHighlightForm(false);
    }, 2800);
  };

  const handleSendRFQ = (e: React.FormEvent) => {
    e.preventDefault();
    let msg = `¡Hola AYME INDUSTRIAS PET!\n\n`;
    msg += `Deseo solicitar una cotización industrial desde su portal oficial:\n`;
    msg += `👤 *Contacto:* ${contactName}\n`;
    msg += `🏢 *Empresa:* ${contactCompany || 'Particular'}\n`;
    msg += `📱 *Teléfono:* ${contactPhone}\n`;
    msg += `📦 *Requerimiento:* ${contactProduct}\n`;
    msg += `📊 *Volumen mensual estimado:* ${contactVolume}\n\n`;
    msg += `Por favor envíenme ficha técnica y disponibilidad de entrega.`;

    const url = `https://wa.me/${mainWhatsapp}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const filteredProducts = AYME_PRODUCTS.filter((prod) => {
    let matchesCategory = selectedCategoryTab === 'all' || prod.type === selectedCategoryTab;
    if (selectedCategoryTab === 'botellas') {
      matchesCategory = prod.type === 'botellas' || prod.type === 'envases';
    } else if (selectedCategoryTab === 'preformas-tapas') {
      matchesCategory = prod.type === 'preformas' || prod.type === 'cierres';
    }
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      prod.name.toLowerCase().includes(q) ||
      prod.sku.toLowerCase().includes(q) ||
      prod.neck.toLowerCase().includes(q) ||
      prod.category.toLowerCase().includes(q) ||
      prod.description.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div id="inicio" style={themeStyles} className="min-h-screen bg-[#0a1128] text-slate-100 font-sans selection:bg-[#A61C2E] selection:text-white">
      {/* 1 & 2. CABECERA FLOTANTE CON SMART HIDE Y SCROLL SPY */}
      <div
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isHeaderSolid ? 'shadow-2xl' : ''
        }`}
        style={{
          transform: isHeaderVisible ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease',
          opacity: isHeaderVisible ? 1 : 0,
          pointerEvents: isHeaderVisible ? 'auto' : 'none',
        }}
      >
        {/* 1. TOP PROMO BAR CORPORATIVA */}
        {sections.top_bar.enabled && (
          <div
            style={{ backgroundColor: sections.top_bar.bg_color || '#8C1625' }}
            className="text-white text-[11px] font-bold py-1.5 px-4 text-center border-b border-white/10 flex items-center justify-center gap-2"
          >
            <span>{sections.top_bar.text}</span>
          </div>
        )}

        {/* 2. HEADER CORPORATIVO INTERACTIVO */}
        {sections.header.enabled && (
          <header className={`backdrop-blur-md border-b border-white/10 transition-colors duration-300 ${
            isHeaderSolid ? 'bg-[#0a1128]/98 shadow-xl' : 'bg-[#0a1128]/85'
          }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
              {/* Logo y Enlace a Inicio */}
              <a
                href="#inicio"
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-3 group transition-transform hover:opacity-95"
                title="AYME INDUSTRIAS PET - Inicio"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A61C2E] to-[#8C1625] flex items-center justify-center font-black text-white text-lg shadow-md border border-white/20 group-hover:scale-105 transition-transform">
                  A
                </div>
                <div>
                  <h1 className="font-extrabold text-base tracking-tight text-white leading-tight">
                    AYME INDUSTRIAS PET
                  </h1>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {sections.header.custom_subtitle || 'Solutions in Packaging • B2B'}
                  </p>
                </div>
              </a>

              {/* Navegación Desktop con Scroll Spy Reactivo */}
              <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className={`transition-colors cursor-pointer py-1 relative ${
                    activeSection === 'inicio' ? 'text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Inicio
                  {activeSection === 'inicio' && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#A61C2E] rounded-full" />
                  )}
                </button>
                <a
                  href="#catalogo"
                  className={`transition-colors py-1 relative ${
                    activeSection === 'catalogo' ? 'text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Catálogo de Envases
                  {activeSection === 'catalogo' && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#A61C2E] rounded-full" />
                  )}
                </a>
                <a
                  href="#faqs"
                  className={`transition-colors py-1 relative ${
                    activeSection === 'faqs' ? 'text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Preguntas Frecuentes
                  {activeSection === 'faqs' && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#A61C2E] rounded-full" />
                  )}
                </a>
                {sections.rfq_and_map.enabled && (
                  <a
                    href="#cotizar"
                    className={`transition-colors py-1 relative ${
                      activeSection === 'cotizar' ? 'text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Cotizar & Planta
                    {activeSection === 'cotizar' && (
                      <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#A61C2E] rounded-full" />
                    )}
                  </a>
                )}
              </nav>

              {/* Alternador Móvil */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden p-2 rounded-xl bg-white/10 text-white hover:bg-white/15 transition-colors cursor-pointer"
                  aria-label="Abrir menú de navegación"
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Menú Drawer Móvil con Resaltado de Sección */}
            {isMobileMenuOpen && (
              <div className="lg:hidden bg-[#060c1d]/98 backdrop-blur-xl border-t border-white/10 px-4 py-4 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 w-full text-left py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
                    activeSection === 'inicio' ? 'bg-[#A61C2E]/25 text-white border-l-2 border-[#A61C2E]' : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Inicio</span>
                </button>
                <a
                  href="#catalogo"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
                    activeSection === 'catalogo' ? 'bg-[#A61C2E]/25 text-white border-l-2 border-[#A61C2E]' : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Catálogo de Envases</span>
                </a>
                <a
                  href="#faqs"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
                    activeSection === 'faqs' ? 'bg-[#A61C2E]/25 text-white border-l-2 border-[#A61C2E]' : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Preguntas Frecuentes</span>
                </a>
                {sections.rfq_and_map.enabled && (
                  <a
                    href="#cotizar"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
                      activeSection === 'cotizar' ? 'bg-[#A61C2E]/25 text-white border-l-2 border-[#A61C2E]' : 'text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Cotizador & Retiro en Planta</span>
                  </a>
                )}
              </div>
            )}
          </header>
        )}
      </div>

      {/* 3. HERO INTERACTIVO CON SECUENCIA DE SCROLL (VIDEO Y TELEMETRÍA 40 BAR) */}
      {sections.hero.enabled && (
        <section className="scroll-sequence-track" id="scroll-sequence-track" ref={trackRef}>
          <div className="scroll-sequence-sticky">
            {/* Video de Fondo Industrial Continuo */}
            <video
              ref={videoRef}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="/assets/hero-machine.jpg"
              id="hero-background-video"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                zIndex: 1,
              }}
            >
              <source src="/assets/process-video.mp4" type="video/mp4" />
            </video>
            <div
              className="sequence-dark-vignette"
              style={{
                background: `radial-gradient(circle at 65% 50%, rgba(11, 17, 32, 0.1) 0%, rgba(11, 17, 32, 0.5) 60%, rgba(11, 17, 32, 0.8) 100%), linear-gradient(to top, #0a1128, transparent 100%)`,
                zIndex: 2,
              }}
            />

            {/* Capa UI con Telemetría y las 3 Secciones Sincronizadas */}
            <div className="sequence-ui-layer">
              {/* HUD Superior */}
              <div className="sequence-top-hud flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="hud-badge-active text-[10px] sm:text-xs">
                    <span>MONITOREO DE LÍNEA EN TIEMPO REAL</span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleVideoPlay}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800 text-[10px] sm:text-xs font-mono font-bold text-white border border-slate-700/80 transition-all cursor-pointer shadow-xs"
                    title={isVideoPlaying ? 'Pausar video de planta' : 'Reanudar video'}
                  >
                    {isVideoPlaying ? (
                      <Pause className="w-3 h-3 text-amber-400" />
                    ) : (
                      <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                    )}
                    <span className="hidden sm:inline">{isVideoPlaying ? 'VIDEO EN VIVO' : 'VIDEO PAUSADO'}</span>
                  </button>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-[10px] sm:text-xs text-slate-300">
                  <span>SISTEMA: BLOW-MOLD ROTARY TURBINE • 40 BAR</span>
                </div>
              </div>

              {/* Contenedor Central de las Secciones que aparecen con el scroll */}
              <div className="sequence-middle-container">
                {/* FASE 0: INTRO HERO AL INICIO (Progress 0.0 a 0.22) */}
                <article
                  className="sequence-step-card"
                  id="sequence-step-intro"
                  style={{
                    opacity: introOpacity,
                    transform: `translateY(${introTranslate}px)`,
                    pointerEvents: introOpacity > 0.1 ? 'auto' : 'none',
                  }}
                >
                  <span className="step-phase-tag text-[10px] sm:text-xs">
                    AYME INDUSTRIAS PET • PACKAGING
                  </span>
                  <h1 className="step-card-title" style={{ fontSize: 'clamp(1.35rem, 4vw, 2.4rem)' }}>
                    TECNOLOGÍA EN <br />
                    <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--accent)', textTransform: 'none' }}>
                      soplado & inyección
                    </span>
                  </h1>
                  <p className="step-card-lead text-xs sm:text-sm">
                    Fabricación de envases, botellas, tapas y preformas en PET y PP con tecnología rotativa de alta velocidad para la industria.
                  </p>
                  <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <a
                      href="#catalogo"
                      className="btn btn-accent cursor-pointer"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
                    >
                      Ver Catálogo {new Date().getFullYear()}
                    </a>
                    <a
                      href={`https://wa.me/${mainWhatsapp}?text=${encodeURIComponent('¡Hola AYME INDUSTRIAS PET! Quiero asesoría y cotización.')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline"
                      style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)', padding: '0.5rem 1rem', fontSize: '0.82rem' }}
                    >
                      Cotizar por WhatsApp
                    </a>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>↕</span>
                    <span>Desplace hacia abajo para ver la secuencia sincronizada</span>
                  </div>
                </article>

                {/* SECCIÓN SINCRONIZADA 1: Fase 01 (0.22 a 0.58) */}
                <article
                  className="sequence-step-card"
                  id="sequence-step-1"
                  style={{
                    opacity: step1Opacity,
                    transform: `translateY(${step1Translate}px)`,
                    pointerEvents: step1Opacity > 0.1 ? 'auto' : 'none',
                  }}
                >
                  <span className="step-phase-tag text-[10px] sm:text-xs">FASE 01 / CONTROL TÉRMICO DE PREFORMAS</span>
                  <h2 className="step-card-title" style={{ fontSize: 'clamp(1.2rem, 3.5vw, 1.85rem)' }}>Inyección & Calentamiento Infrarrojo de Precisión</h2>
                  <p className="step-card-lead text-xs sm:text-sm">
                    Las preformas de resina PET 100% virgen entran en el túnel térmico rotativo con control por zonas independientes, asegurando plasticidad perfecta y distribución milimétrica de pared.
                  </p>
                  <div className="step-features-grid">
                    <div className="step-feat-box">
                      <h5 className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-orange-400" /> Infrarrojo Modular</h5>
                      <p>Perfil térmico calibrado según el gramaje del envase.</p>
                    </div>
                    <div className="step-feat-box">
                      <h5 className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Cuello PCO Sellado</h5>
                      <p>Protección térmica en la rosca para cero deformaciones.</p>
                    </div>
                  </div>
                  <a
                    href="#catalogo"
                    className="btn btn-accent btn-block cursor-pointer"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
                  >
                    Ver Catálogo de Envases
                  </a>
                </article>

                {/* SECCIÓN SINCRONIZADA 2: Fase 02 (0.58 a 0.98) */}
                <article
                  className="sequence-step-card"
                  id="sequence-step-2"
                  style={{
                    opacity: step2Opacity,
                    transform: `translateY(${step2Translate}px)`,
                    pointerEvents: step2Opacity > 0.1 ? 'auto' : 'none',
                  }}
                >
                  <span className="step-phase-tag text-[10px] sm:text-xs" style={{ background: 'rgba(37, 211, 102, 0.2)', color: '#25D366' }}>
                    FASE 02 / BI-ORIENTACIÓN MOLECULAR
                  </span>
                  <h2 className="step-card-title" style={{ fontSize: 'clamp(1.2rem, 3.5vw, 1.85rem)' }}>Soplado Rotativo a 40 Bar & Enfriamiento Criogénico</h2>
                  <p className="step-card-lead text-xs sm:text-sm">
                    Las varillas de estiramiento servoasistidas expanden la preforma mientras el aire a alta presión copia cada detalle del molde en aluminio aeronáutico refrigerado.
                  </p>
                  <div className="step-features-grid">
                    <div className="step-feat-box">
                      <h5 className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-amber-400" /> Alta Resistencia</h5>
                      <p>Bi-orientación molecular que triplica la resistencia a caídas.</p>
                    </div>
                    <div className="step-feat-box">
                      <h5 className="flex items-center gap-1.5"><Snowflake className="w-4 h-4 text-sky-400" /> Enfriamiento Rápido</h5>
                      <p>Ciclo ultraveloz con fondo petaloide libre de tensiones.</p>
                    </div>
                  </div>
                  <a
                    href={`https://wa.me/${mainWhatsapp}?text=${encodeURIComponent('¡Hola AYME INDUSTRIAS PET! Deseo cotizar fabricación en volumen de envases.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-whatsapp btn-block"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
                  >
                    Cotizar Producción por WhatsApp
                  </a>
                </article>

                {/* Indicador Lateral de Progreso Interactivo */}
                <div className="sequence-timeline-hud">
                  <button
                    type="button"
                    onClick={() => scrollToPhase(0.38)}
                    className={`timeline-node cursor-pointer transition-all bg-transparent border-0 p-1 rounded hover:text-white hover:scale-125 ${
                      scrollProgress >= 0.22 && scrollProgress <= 0.58 ? 'text-white font-extrabold scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]' : 'text-white/60'
                    }`}
                    title="Ir a Fase 01: Inyección & Control Térmico"
                  >
                    01
                  </button>
                  <div
                    className="timeline-track-bar cursor-pointer group"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickY = e.clientY - rect.top;
                      const ratio = Math.max(0, Math.min(1, clickY / rect.height));
                      scrollToPhase(0.22 + ratio * 0.73);
                    }}
                    title="Haga clic para saltar en la secuencia"
                  >
                    <div
                      className="timeline-fill-bar"
                      id="sequence-progress-bar"
                      style={{ height: `${scrollProgress * 100}%` }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => scrollToPhase(0.78)}
                    className={`timeline-node cursor-pointer transition-all bg-transparent border-0 p-1 rounded hover:text-white hover:scale-125 ${
                      scrollProgress >= 0.58 ? 'text-white font-extrabold scale-110 drop-shadow-[0_0_8px_rgba(37,211,102,0.8)]' : 'text-white/60'
                    }`}
                    title="Ir a Fase 02: Soplado Rotativo & Enfriamiento Criogénico"
                  >
                    02
                  </button>
                </div>
              </div>

              {/* HUD Inferior con Telemetría Sincronizada */}
              <div className="sequence-bottom-hud">
                <div className="hud-telemetry-col">
                  <span>SECUENCIA: </span>
                  <strong id="telemetry-frame-val">FR-{String(frameIndex).padStart(4, '0')} / 0144</strong>
                </div>
                <div className="hud-telemetry-col">
                  <span>SINCRONIZACIÓN: </span>
                  <strong id="telemetry-progress-val">{Math.round(scrollProgress * 100)}%</strong>
                </div>
                <div className="hud-telemetry-col">
                  <span>VELOCIDAD: </span>
                  <strong>12.000 BPH CONTINUO</strong>
                </div>
                <div className="hud-telemetry-col">
                  <span>SCROLL INTERACTIVO: </span>
                  <strong>BIDIRECCIONAL ↕</strong>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECCIÓN DE CATÁLOGO DE ENVASES PET CON TABS Y BUSCADOR (#catalogo con scroll-mt-24) */}
      <section id="catalogo" className="scroll-mt-24 py-16 px-4 sm:px-6 max-w-7xl mx-auto space-y-8 border-b border-white/10">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
            <Boxes className="w-3.5 h-3.5" />
            <span>Portafolio Industrial Disponible</span>
          </span>
          <h3 className="text-2xl sm:text-4xl font-black text-white">
            Catálogo de Envases, Galones & Preformas
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Modelos de alta rotación para bebidas, farma, agroquímicos y alimentos. Disponibilidad de retiro inmediato por fardo, palet o contenedor.
          </p>
        </div>

        {/* BARRA DE BÚSQUEDA Y TABS DE FILTRADO POR CATEGORÍA */}
        <div className="space-y-4 max-w-4xl mx-auto">
          {/* Input de Búsqueda Reactiva */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, SKU (ej: B500), tipo de rosca (ej: 28mm) o aplicación..."
              className="w-full bg-[#060c1d] border border-white/15 rounded-2xl pl-11 pr-10 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#A61C2E] shadow-xl transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-full bg-white/10"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Tabs de Selección Rápida */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setSelectedCategoryTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategoryTab === 'all'
                  ? 'bg-[#A61C2E] text-white shadow-lg shadow-red-950/50 scale-105'
                  : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
              }`}
            >
              <span>Todos los Modelos</span>
              <span className="bg-black/30 px-1.5 py-0.5 rounded-full text-[10px] font-mono">{AYME_PRODUCTS.length}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategoryTab('botellas')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategoryTab === 'botellas'
                  ? 'bg-[#A61C2E] text-white shadow-lg shadow-red-950/50 scale-105'
                  : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
              }`}
            >
              <span>Botellas PET</span>
              <span className="bg-black/30 px-1.5 py-0.5 rounded-full text-[10px] font-mono">
                {AYME_PRODUCTS.filter(p => p.type === 'botellas' || p.type === 'envases').length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategoryTab('galones')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategoryTab === 'galones'
                  ? 'bg-[#A61C2E] text-white shadow-lg shadow-red-950/50 scale-105'
                  : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
              }`}
            >
              <span>Galones Industriales</span>
              <span className="bg-black/30 px-1.5 py-0.5 rounded-full text-[10px] font-mono">
                {AYME_PRODUCTS.filter(p => p.type === 'galones').length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategoryTab('preformas-tapas')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategoryTab === 'preformas-tapas'
                  ? 'bg-[#A61C2E] text-white shadow-lg shadow-red-950/50 scale-105'
                  : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
              }`}
            >
              <span>Preformas & Tapas</span>
              <span className="bg-black/30 px-1.5 py-0.5 rounded-full text-[10px] font-mono">
                {AYME_PRODUCTS.filter(p => p.type === 'preformas' || p.type === 'cierres').length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategoryTab('horeca')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategoryTab === 'horeca'
                  ? 'bg-[#A61C2E] text-white shadow-lg shadow-red-950/50 scale-105'
                  : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
              }`}
            >
              <span>Vasos & HORECA</span>
              <span className="bg-black/30 px-1.5 py-0.5 rounded-full text-[10px] font-mono">
                {AYME_PRODUCTS.filter(p => p.type === 'horeca').length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategoryTab('reposteria')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategoryTab === 'reposteria'
                  ? 'bg-[#A61C2E] text-white shadow-lg shadow-red-950/50 scale-105'
                  : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
              }`}
            >
              <span>Utensilios & Repostería</span>
              <span className="bg-black/30 px-1.5 py-0.5 rounded-full text-[10px] font-mono">
                {AYME_PRODUCTS.filter(p => p.type === 'reposteria').length}
              </span>
            </button>
          </div>
        </div>

        {/* GRILLA DE PRODUCTOS FILTRADOS */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-[#060c1d] border border-white/10 rounded-3xl p-8 space-y-3 max-w-lg mx-auto">
            <Package className="w-8 h-8 text-slate-500 mx-auto" />
            <h4 className="text-sm font-bold text-white">No encontramos modelos con ese criterio</h4>
            <p className="text-xs text-slate-400">Prueba con otro término de búsqueda o limpia los filtros.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategoryTab('all');
              }}
              className="text-xs text-[#A61C2E] underline font-bold"
            >
              Restablecer catálogo completo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6 pt-4">
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                className="bg-[#060c1d] border border-white/10 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex flex-col justify-between hover:border-[#A61C2E]/60 transition-all group"
              >
                <div>
                  <div className="relative aspect-square rounded-lg sm:rounded-xl bg-slate-900/80 border border-white/5 flex items-center justify-center p-2 sm:p-4 overflow-hidden mb-2 sm:mb-3">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      loading="lazy"
                      className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-300"
                    />
                    <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 text-[8px] sm:text-[9px] font-mono font-bold uppercase px-1.5 sm:px-2 py-0.5 rounded-full bg-black/60 text-slate-300 border border-white/10">
                      B2B
                    </span>
                    {(prod as any).videoUrl && (
                      <span className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 text-[8px] sm:text-[9px] font-mono font-bold uppercase px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-950/90 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shadow-sm">
                        <span>▶</span>
                        <span className="hidden sm:inline">Video 360°</span>
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5 sm:space-y-1">
                    <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-mono">
                      <span className="text-red-400 font-bold truncate max-w-[65%]">{prod.category}</span>
                      <span className="text-slate-500">{prod.sku}</span>
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-white group-hover:text-red-300 transition-colors line-clamp-2 leading-tight sm:leading-snug">
                      {prod.name}
                    </h4>
                    <p className="hidden sm:block text-[11px] text-slate-400 line-clamp-2 leading-relaxed pt-1">
                      {prod.description}
                    </p>
                  </div>

                  <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-white/10 space-y-0.5 sm:space-y-1 font-mono text-[9px] sm:text-[10px] text-slate-400">
                    <div className="flex justify-between">
                      <span>Rosca:</span>
                      <span className="text-slate-200 font-semibold truncate ml-1">{prod.neck}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gramaje:</span>
                      <span className="text-slate-200 font-semibold">{prod.weight}</span>
                    </div>
                  </div>
                </div>

                {/* Botones de acción: Ficha Técnica y Cotizar */}
                <div className="mt-2 sm:mt-4 pt-1.5 sm:pt-2 space-y-1.5 sm:space-y-2">
                  <button
                    type="button"
                    onClick={() => openProductModal(prod)}
                    className="w-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[10px] sm:text-xs font-semibold py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg sm:rounded-xl border border-white/10 transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#A61C2E]" />
                    <span className="truncate">Ver Plano & Medidas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectProductAndQuote(prod.formValue)}
                    className="w-full bg-[#A61C2E] hover:bg-[#8C1625] text-white text-[10px] sm:text-xs font-bold py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-1 sm:gap-1.5 shadow-md shadow-red-950/40 cursor-pointer"
                  >
                    <span className="truncate">Cotizar este Envase</span>
                    <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. PILARES DE RESPALDO (Retirada por requerimiento de cliente) */}
      {sections.pillars.enabled && false && null}

      {/* SECCIÓN DE PREGUNTAS FRECUENTES B2B (#faqs con scroll-mt-24) */}
      <section id="faqs" className="scroll-mt-24 py-16 px-4 sm:px-6 max-w-5xl mx-auto space-y-8 border-b border-white/10">
        <div className="text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-mono font-bold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Resolución de Dudas Comerciales</span>
          </span>
          <h3 className="text-2xl sm:text-4xl font-black text-white">
            Preguntas Frecuentes de Fabricación
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            Condiciones de despacho, pedidos mínimos y estándares de inocuidad en nuestra planta de Calderón.
          </p>
        </div>

        <div className="space-y-3">
          {AYME_FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-[#060c1d] border border-white/10 rounded-2xl overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <span className="font-bold text-sm text-white">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#A61C2E]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-white/5 pt-3">
                    <p>{faq.a}</p>
                    <div className="mt-3">
                      <a
                        href="#cotizar"
                        className="text-[#A61C2E] hover:underline font-bold text-xs inline-flex items-center gap-1"
                      >
                        <span>¿Tienes una consulta específica? Contáctanos en el formulario</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. FORMULARIO B2B Y MAPA DE PLANTA (#cotizar con scroll-mt-24 y feedback reactivo) */}
      {sections.rfq_and_map.enabled && (
        <section id="cotizar" className="scroll-mt-24 py-16 px-4 sm:px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Formulario */}
          {sections.rfq_and_map.show_form && (
            <div
              className={`bg-[#060c1d] border p-6 sm:p-8 rounded-3xl shadow-2xl space-y-5 transition-all duration-500 ${
                highlightForm
                  ? 'border-[#A61C2E] ring-4 ring-[#A61C2E]/30 scale-[1.01]'
                  : 'border-white/15'
              }`}
            >
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-emerald-400" />
                  <span>{sections.rfq_and_map.title || 'Solicitud de Cotización & Muestras'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {sections.rfq_and_map.subtitle || 'Atención directa de fábrica para pedidos por fardo, bulto o contenedor.'}
                </p>

                {/* Banner de feedback al seleccionar producto */}
                {highlightForm && (
                  <div className="mt-3 bg-red-500/20 border border-red-500/40 text-red-200 text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 animate-pulse">
                    <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
                    <span>
                      Modelo seleccionado: <strong>{contactProduct}</strong>. Completa tus datos para enviarte la propuesta.
                    </span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendRFQ} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nombre Completo:</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Ej: Ing. Carlos Pérez"
                    className="w-full bg-[#0a1128] border border-white/15 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#A61C2E]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Empresa / Razón Social:</label>
                  <input
                    type="text"
                    value={contactCompany}
                    onChange={(e) => setContactCompany(e.target.value)}
                    placeholder="Ej: Industrias Alimentarias S.A."
                    className="w-full bg-[#0a1128] border border-white/15 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#A61C2E]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">WhatsApp de Contacto:</label>
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="Ej: 0991234567"
                    className="w-full bg-[#0a1128] border border-white/15 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#A61C2E]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Línea de Envase:</label>
                    <select
                      value={contactProduct}
                      onChange={(e) => setContactProduct(e.target.value)}
                      className={`w-full bg-[#0a1128] border rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#A61C2E] transition-colors ${
                        highlightForm ? 'border-[#A61C2E] bg-[#A61C2E]/10' : 'border-white/15'
                      }`}
                    >
                      <option value="Botella PET 500ml">Botella PET 500ml</option>
                      <option value="Botella PET 1 Litro">Botella PET 1 Litro</option>
                      <option value="Galón PET 3.8 Litros">Galón PET 3.8 Litros</option>
                      <option value="Botella PET 250ml Cuadrada">Botella PET 250ml Cuadrada</option>
                      <option value="Frasco PET 500ml Boca Ancha">Frasco PET 500ml Boca Ancha</option>
                      <option value="Botella PET 1.5L Familiar">Botella PET 1.5L Familiar</option>
                      <option value="Preformas & Tapas">Preformas & Tapas</option>
                      <option value="Molde Personalizado 3D">Molde Personalizado 3D</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Volumen Mensual:</label>
                    <select
                      value={contactVolume}
                      onChange={(e) => setContactVolume(e.target.value)}
                      className="w-full bg-[#0a1128] border border-white/15 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#A61C2E]"
                    >
                      <option value="1.000 a 5.000 uds/mes">1.000 a 5.000 uds/mes</option>
                      <option value="5.000 a 20.000 uds/mes">5.000 a 20.000 uds/mes</option>
                      <option value="+50.000 uds/mes">+50.000 uds/mes (Mayorista)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#A61C2E] hover:bg-[#8C1625] text-white font-extrabold text-sm py-3 px-4 rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar Requerimiento a WhatsApp de Ventas</span>
                </button>
              </form>
            </div>
          )}

          {/* Ubicación y Mapa */}
          {sections.rfq_and_map.show_map && (
            <div className="bg-[#060c1d] border border-white/15 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#A61C2E]" />
                    <span>{sections.rfq_and_map.map_title || 'Ubicación de Planta & Retiro Directo'}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Sector Calderón - Llano Grande, Quito, Ecuador.
                  </p>
                </div>

                {/* Botón de Ruta GPS en Google Maps / Waze */}
                <a
                  href={
                    sections.rfq_and_map.map_embed_url && sections.rfq_and_map.map_embed_url.includes('maps.app.goo.gl')
                      ? sections.rfq_and_map.map_embed_url
                      : "https://maps.google.com/?q=-0.115479,-78.441504"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-bold border border-red-500/30 transition-all hover:scale-105"
                  title="Abrir en GPS"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Trazar ruta GPS</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="h-72 w-full rounded-2xl overflow-hidden border border-white/10 bg-slate-900">
                <iframe
                  title="Ubicación AYME INDUSTRIAS PET"
                  src={
                    sections.rfq_and_map.map_embed_url && !sections.rfq_and_map.map_embed_url.includes('maps.app.goo.gl') && !sections.rfq_and_map.map_embed_url.includes('goo.gl') && sections.rfq_and_map.map_embed_url.includes('embed')
                      ? sections.rfq_and_map.map_embed_url
                      : "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15959.278385012543!2d-78.441504!3d-0.115479!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91d58fb442f4625b%3A0xe5438843c08f654b!2sLlano%20Grande%2C%20Quito!5e0!3m2!1ses!2sec!4v1700000000000!5m2!1ses!2sec"
                  }
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              <div className="text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{sections.rfq_and_map.schedule || 'Lunes a Viernes: 08:00 - 17:30'}</span>
                </span>
                <div className="flex items-center gap-3">
                  <a
                    href="tel:+593998722324"
                    className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
                    title="Llamar a planta"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#A61C2E]" />
                    <span>099 872 2324</span>
                  </a>
                  <a
                    href={`mailto:${sections.rfq_and_map.email || 'ventas@aymeindustriaspet.com'}`}
                    className="flex items-center gap-1 font-mono text-white hover:text-red-300 transition-colors"
                    title="Enviar correo"
                  >
                    <Mail className="w-3.5 h-3.5 text-yellow-400" />
                    <span>{sections.rfq_and_map.email || 'ventas@aymeindustriaspet.com'}</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* MODAL B2B DE FICHA TÉCNICA Y ESPECIFICACIONES CON NAVEGACIÓN SECUENCIAL */}
      {technicalModalProduct && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
          onClick={() => setTechnicalModalProduct(null)}
        >
          <div
            className="bg-[#060c1d] border border-white/20 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal con Controles de Navegación Secuencial */}
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-red-400 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
                    Ficha Técnica • SKU: {technicalModalProduct.sku}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Modelo {AYME_PRODUCTS.findIndex((p) => p.id === technicalModalProduct.id) + 1} de {AYME_PRODUCTS.length}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                  {technicalModalProduct.name}
                </h3>
                <p className="text-xs text-slate-400">
                  {technicalModalProduct.category}
                </p>
              </div>

              {/* Controles: Anterior, Siguiente y Cerrar */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrevProduct}
                  className="p-2 rounded-xl bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
                  title="Modelo anterior (Flecha Izquierda)"
                  aria-label="Modelo anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextProduct}
                  className="p-2 rounded-xl bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
                  title="Modelo siguiente (Flecha Derecha)"
                  aria-label="Modelo siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setTechnicalModalProduct(null)}
                  className="p-2 rounded-xl bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 transition-colors cursor-pointer ml-1"
                  aria-label="Cerrar modal (Escape)"
                  title="Cerrar (Escape)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Contenido: Imagen / Video + Tabla de Medidas de Ingeniería */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="relative aspect-square rounded-2xl bg-slate-900/90 border border-white/10 p-2 flex items-center justify-center overflow-hidden">
                {(technicalModalProduct as any).videoUrl ? (
                  <video
                    src={(technicalModalProduct as any).videoUrl}
                    controls
                    autoPlay
                    loop
                    playsInline
                    className="w-full h-full object-contain rounded-xl"
                  />
                ) : (
                  <img
                    src={technicalModalProduct.image}
                    alt={technicalModalProduct.name}
                    className="max-h-full max-w-full object-contain p-4"
                  />
                )}
              </div>

              <div className="space-y-3 text-xs font-mono">
                <h4 className="text-white font-sans font-bold text-sm border-b border-white/10 pb-1 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-[#A61C2E]" />
                  <span>Especificaciones de Planta</span>
                </h4>

                <div className="space-y-2 text-slate-300">
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-500">Rosca / Cuello:</span>
                    <span className="text-white font-bold">{technicalModalProduct.neck}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-500">Gramaje de Resina:</span>
                    <span className="text-white font-bold">{technicalModalProduct.weight}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-500">Altura Total:</span>
                    <span className="text-white font-bold">{technicalModalProduct.height}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-500">Diámetro de Cuerpo:</span>
                    <span className="text-white font-bold">{technicalModalProduct.diameter}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-500">Embalaje por Fardo:</span>
                    <span className="text-emerald-400 font-bold">{technicalModalProduct.packaging}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Paletizado Oficial:</span>
                    <span className="text-yellow-300 font-bold">{technicalModalProduct.palletQty}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Acciones del Modal */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => handleSelectProductAndQuote(technicalModalProduct.formValue)}
                className="w-full sm:flex-1 bg-[#A61C2E] hover:bg-[#8C1625] text-white font-bold text-xs py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Solicitar Cotización de este Modelo</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href={`https://wa.me/${mainWhatsapp}?text=${encodeURIComponent(
                  `¡Hola AYME INDUSTRIAS PET! Requiero cotización formal y ficha técnica del modelo: ${technicalModalProduct.name} (SKU: ${technicalModalProduct.sku}).`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Rápido</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* WIDGET FLOTANTE OMNICANAL: BOTÓN VOLVER ARRIBA Y BOTÓN WHATSAPP */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 pointer-events-auto">
        {/* Botón Volver Arriba */}
        {isHeaderSolid && (
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-slate-800/90 hover:bg-slate-700 text-white p-3 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 border border-white/20 cursor-pointer"
            aria-label="Volver arriba"
            title="Volver arriba"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        )}

        {/* Botón WhatsApp Flotante Permanente */}
        <a
          href={`https://wa.me/${mainWhatsapp}?text=${encodeURIComponent(
            '¡Hola AYME INDUSTRIAS PET! Deseo consultar disponibilidad de envases y precios mayoristas de planta.'
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-3 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2 border border-white/20 group"
          title="Contactar a Ventas en Planta"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-300" />
          </span>
          <MessageCircle className="w-5 h-5" />
          <span className="hidden sm:inline">WhatsApp Planta ({displayPhone})</span>
        </a>
      </div>

      {/* 6. FOOTER INTERACTIVO */}
      {sections.footer.enabled && (
        <footer className="border-t border-white/10 py-10 px-4 text-center text-xs text-slate-400 space-y-4 bg-[#060c1d]">
          <div className="flex flex-wrap justify-center items-center gap-6 text-[11px] font-semibold text-slate-400">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Inicio
            </button>
            <a href="#catalogo" className="hover:text-white transition-colors">
              Catálogo de Envases
            </a>
            <a href="#faqs" className="hover:text-white transition-colors">
              Preguntas Frecuentes
            </a>
            <a href="#cotizar" className="hover:text-white transition-colors">
              Solicitar Cotización
            </a>
            <a
              href={`https://wa.me/${mainWhatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              WhatsApp Ventas
            </a>
          </div>

          <p>{sections.footer.copyright_text || `© ${new Date().getFullYear()} AYME INDUSTRIAS PET. Solutions in Packaging. Todos los derechos reservados.`}</p>
          {sections.footer.show_powered_by && (
            <p className="text-[10px] text-slate-600">Portal corporativo e infraestructura B2B impulsada por tenddy.</p>
          )}
        </footer>
      )}
    </div>
  );
}
