import { NextResponse } from 'next/server';
import writeXlsxFile from 'write-excel-file/node';

const CSV_HEADERS = [
  'Type',
  'SKU',
  'Name',
  'Published',
  'Is featured?',
  'Visibility in catalog',
  'Short description',
  'Description',
  'In stock?',
  'Stock',
  'Regular price',
  'Sale price',
  'Categories',
  'Tags',
  'Images',
  'Color',
  'Tallas',
];

const CSV_SAMPLE_ROWS = [
  [
    'simple',
    'TSHIRT-001',
    'Camiseta Algodón Premium',
    '1',
    '0',
    'visible',
    'Camiseta 100% algodón orgánico',
    'Confeccionada con costuras reforzadas y cuello redondo anatómico.',
    '1',
    '50',
    '25.00',
    '19.90',
    'Camisetas, Ropa Casual',
    'algodón, verano, tendencia',
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
    'Blanco',
    'S, M, L, XL',
  ],
  [
    'simple',
    'HOODIE-002',
    'Sudadera con Capucha Clásica',
    '1',
    '1',
    'visible',
    'Sudadera térmica con bolsillo canguro',
    'Interior afelpado de alta densidad ideal para climas templados.',
    '1',
    '30',
    '45.00',
    '38.00',
    'Sudaderas, Abrigos',
    'invierno, urbano',
    'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800',
    'Negro',
    'M, L, XL',
  ],
  [
    'simple',
    'PANT-003',
    'Pantalón Drill Operativo',
    '1',
    '0',
    'visible',
    'Pantalón resistente con triple costura',
    'Pretina elástica y bolsillos laterales de carga reforzados.',
    '1',
    '40',
    '35.00',
    '',
    'Pantalones',
    'trabajo, drill',
    'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800',
    'Kaki',
    '28, 30, 32, 34',
  ],
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') || 'xlsx').toLowerCase();

    // 1. Descarga en formato CSV
    if (format === 'csv') {
      const csvContent =
        '\uFEFF' +
        [CSV_HEADERS, ...CSV_SAMPLE_ROWS]
          .map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))
          .join('\n');

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="ejemplo_productos_tenddy.csv"',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // 2. Descarga en formato Excel (.xlsx) nativo
    const HEADER_ROW = [
      { value: 'Type', fontWeight: 'bold', backgroundColor: '#0284c7', color: '#ffffff' },
      { value: 'SKU', fontWeight: 'bold', backgroundColor: '#0284c7', color: '#ffffff' },
      { value: 'Name', fontWeight: 'bold', backgroundColor: '#0284c7', color: '#ffffff' },
      { value: 'Published', fontWeight: 'bold', backgroundColor: '#0284c7', color: '#ffffff' },
      { value: 'Is featured?', fontWeight: 'bold', backgroundColor: '#0284c7', color: '#ffffff' },
      { value: 'Visibility in catalog', fontWeight: 'bold', backgroundColor: '#0284c7', color: '#ffffff' },
      { value: 'Short description', fontWeight: 'bold', backgroundColor: '#0284c7', color: '#ffffff' },
      { value: 'Description', fontWeight: 'bold', backgroundColor: '#0284c7', color: '#ffffff' },
      { value: 'In stock?', fontWeight: 'bold', backgroundColor: '#0284c7', color: '#ffffff' },
      { value: 'Stock', fontWeight: 'bold', backgroundColor: '#0284c7', color: '#ffffff' },
      { value: 'Regular price', fontWeight: 'bold', backgroundColor: '#0284c7', color: '#ffffff' },
      { value: 'Sale price', fontWeight: 'bold', backgroundColor: '#0284c7', color: '#ffffff' },
      { value: 'Categories', fontWeight: 'bold', backgroundColor: '#0284c7', color: '#ffffff' },
      { value: 'Tags', fontWeight: 'bold', backgroundColor: '#0284c7', color: '#ffffff' },
      { value: 'Images', fontWeight: 'bold', backgroundColor: '#0284c7', color: '#ffffff' },
      { value: 'Color', fontWeight: 'bold', backgroundColor: '#0284c7', color: '#ffffff' },
      { value: 'Tallas', fontWeight: 'bold', backgroundColor: '#0284c7', color: '#ffffff' },
    ];

    const DATA_ROWS = [
      [
        { value: 'simple' },
        { value: 'TSHIRT-001' },
        { value: 'Camiseta Algodón Premium' },
        { value: '1' },
        { value: '0' },
        { value: 'visible' },
        { value: 'Camiseta 100% algodón orgánico' },
        { value: 'Confeccionada con costuras reforzadas y cuello redondo anatómico.' },
        { value: '1' },
        { value: 50 },
        { value: 25.0 },
        { value: 19.9 },
        { value: 'Camisetas, Ropa Casual' },
        { value: 'algodón, verano, tendencia' },
        { value: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800' },
        { value: 'Blanco' },
        { value: 'S, M, L, XL' },
      ],
      [
        { value: 'simple' },
        { value: 'HOODIE-002' },
        { value: 'Sudadera con Capucha Clásica' },
        { value: '1' },
        { value: '1' },
        { value: 'visible' },
        { value: 'Sudadera térmica con bolsillo canguro' },
        { value: 'Interior afelpado de alta densidad ideal para climas templados.' },
        { value: '1' },
        { value: 30 },
        { value: 45.0 },
        { value: 38.0 },
        { value: 'Sudaderas, Abrigos' },
        { value: 'invierno, urbano' },
        { value: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800' },
        { value: 'Negro' },
        { value: 'M, L, XL' },
      ],
      [
        { value: 'simple' },
        { value: 'PANT-003' },
        { value: 'Pantalón Drill Operativo' },
        { value: '1' },
        { value: '0' },
        { value: 'visible' },
        { value: 'Pantalón resistente con triple costura' },
        { value: 'Pretina elástica y bolsillos laterales de carga reforzados.' },
        { value: '1' },
        { value: 40 },
        { value: 35.0 },
        { value: null },
        { value: 'Pantalones' },
        { value: 'trabajo, drill' },
        { value: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800' },
        { value: 'Kaki' },
        { value: '28, 30, 32, 34' },
      ],
    ];

    const columns = [
      { width: 12 },
      { width: 16 },
      { width: 30 },
      { width: 12 },
      { width: 14 },
      { width: 20 },
      { width: 35 },
      { width: 45 },
      { width: 12 },
      { width: 12 },
      { width: 14 },
      { width: 14 },
      { width: 25 },
      { width: 25 },
      { width: 50 },
      { width: 16 },
      { width: 20 },
    ];

    const buffer = await writeXlsxFile([HEADER_ROW, ...DATA_ROWS], {
      columns,
    } as any).toBuffer();

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition':
          'attachment; filename="ejemplo_productos_tenddy.xlsx"',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err: unknown) {
    console.error('Error generando plantilla oficial:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error generando archivo de plantilla' },
      { status: 500 }
    );
  }
}
