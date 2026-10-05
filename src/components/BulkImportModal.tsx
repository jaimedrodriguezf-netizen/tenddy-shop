'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  X,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Table,
  Check,
  Clipboard
} from 'lucide-react';
import readXlsxFile from 'read-excel-file/browser';
import writeXlsxFile from 'write-excel-file/browser';
import Papa from 'papaparse';
import { Product } from '@/lib/types';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  onProductsImported: (newProducts: Product[]) => void;
}

interface ParsedProduct {
  sku: string;
  color: string;
  tallas: string;
  description_and_seams: string;
  name: string;
  category: string;
  image_url: string;
}

export default function BulkImportModal({
  isOpen,
  onClose,
  tenantId,
  onProductsImported,
}: BulkImportModalProps) {
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Descargar plantilla oficial en formato Excel (.xlsx) nativo
  const downloadTemplate = async () => {
    try {
      const HEADER_ROW = [
        { value: 'Código', fontWeight: 'bold', backgroundColor: '#0284c7', color: '#ffffff' },
        { value: 'Nombre de Prenda', fontWeight: 'bold', backgroundColor: '#0284c7', color: '#ffffff' },
        { value: 'Categoría', fontWeight: 'bold', backgroundColor: '#0284c7', color: '#ffffff' },
        { value: 'Color', fontWeight: 'bold', backgroundColor: '#0284c7', color: '#ffffff' },
        { value: 'Tallas', fontWeight: 'bold', backgroundColor: '#0284c7', color: '#ffffff' },
        { value: 'Descripción y Costuras', fontWeight: 'bold', backgroundColor: '#0284c7', color: '#ffffff' },
        { value: 'Enlace Foto Principal', fontWeight: 'bold', backgroundColor: '#0284c7', color: '#ffffff' },
      ];

      const DATA_ROWS = [
        [
          { value: 'OXF-001' },
          { value: 'Camisa Oxford Manga Larga' },
          { value: 'Camisas' },
          { value: 'Azul Cielo' },
          { value: 'S, M, L, XL' },
          { value: 'Costura reforzada doble pespunte y cuello fusionado' },
          { value: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800' },
        ],
        [
          { value: 'DRL-002' },
          { value: 'Pantalón Drill Operativo' },
          { value: 'Pantalones' },
          { value: 'Kaki / Beige' },
          { value: '28, 30, 32, 34, 36' },
          { value: 'Pretina anatómica y triple costura en entrepierna' },
          { value: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800' },
        ],
      ];

      const columns = [
        { width: 14 },
        { width: 30 },
        { width: 18 },
        { width: 16 },
        { width: 20 },
        { width: 45 },
        { width: 40 },
      ];

      await writeXlsxFile([HEADER_ROW, ...DATA_ROWS], {
        columns,
        fileName: 'plantilla_productos_tenddy.xlsx',
      } as any);
    } catch (err) {
      console.error('Error generando Excel:', err);
      // Fallback CSV con delimitador de punto y coma para Excel latino
      const headers = ['Código', 'Nombre de Prenda', 'Categoría', 'Color', 'Tallas', 'Descripción y Costuras', 'Enlace Foto Principal'];
      const sampleRows = [
        ['OXF-001', 'Camisa Oxford Manga Larga', 'Camisas', 'Azul Cielo', 'S, M, L, XL', 'Costura reforzada doble pespunte', 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800'],
      ];
      const csvContent = '\uFEFF' + [headers, ...sampleRows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(';')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'plantilla_productos_tenddy.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Normalizar nombres de columnas para que coincidan con los encabezados oficiales
  const normalizeKey = (key: string): string => {
    const clean = key
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

    if (clean.includes('cod') || clean.includes('sku') || clean.includes('ref')) return 'sku';
    if (clean.includes('color') || clean.includes('tono')) return 'color';
    if (clean.includes('talla') || clean.includes('size') || clean.includes('medida')) return 'tallas';
    if (clean.includes('costur') || clean.includes('molde') || clean.includes('patron') || clean.includes('detalle')) return 'description_and_seams';
    if (clean.includes('prenda') || clean.includes('producto') || clean.includes('nombre') || clean.includes('articulo') || clean.includes('item')) return 'name';
    if (clean.includes('descrip')) return 'description_and_seams';
    if (clean.includes('categ') || clean.includes('tipo') || clean.includes('familia') || clean.includes('linea') || clean.includes('seccion')) return 'category';
    if (clean.includes('foto') || clean.includes('enlace') || clean.includes('imagen') || clean.includes('image') || clean.includes('url') || clean.includes('link')) return 'image_url';
    return clean;
  };

  // Convertir enlaces compartidos de Google Drive a URLs directas de imagen
  const normalizeImageUrl = (url: string): string => {
    if (!url) return '';
    const clean = url.trim();

    if (clean.includes('drive.google.com')) {
      const match = clean.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://lh3.googleusercontent.com/d/${match[1]}`;
      }
    }

    return clean;
  };

  // Procesar archivo Excel (.xlsx / .xls) o CSV
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParsing(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setParsedProducts([]);

    try {
      const isCsv = file.name.endsWith('.csv') || file.type === 'text/csv';

      if (isCsv) {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const rawRows = results.data as Record<string, string>[];
            const productsList: ParsedProduct[] = rawRows.map((row) => {
              const mapped: Record<string, string> = {};
              Object.keys(row).forEach((k) => {
                const normKey = normalizeKey(k);
                mapped[normKey] = row[k]?.toString().trim() || '';
              });

              return {
                sku: mapped.sku || '',
                color: mapped.color || '',
                tallas: mapped.tallas || '',
                description_and_seams: mapped.description_and_seams || '',
                name: mapped.name || '',
                category: mapped.category || 'General',
                image_url: normalizeImageUrl(mapped.image_url || ''),
              };
            }).filter((p) => p.name || p.sku);

            if (productsList.length === 0) {
              setErrorMsg('No se detectaron filas válidas con datos de productos en el archivo.');
            } else if (productsList.length > 3000) {
              setErrorMsg(`El archivo contiene ${productsList.length} productos. El límite por carga es de 3,000.`);
            } else {
              setParsedProducts(productsList);
            }
            setParsing(false);
          },
          error: (err) => {
            setErrorMsg('Error leyendo archivo CSV: ' + err.message);
            setParsing(false);
          },
        });
      } else {
        // Archivo Excel (.xlsx / .xls) con soporte multi-hoja y protección defensiva
        const rawResult = (await readXlsxFile(file)) as unknown;
        let rows: any[][];

        if (Array.isArray(rawResult) && rawResult.length > 0 && typeof rawResult[0] === 'object' && rawResult[0] !== null && 'data' in rawResult[0]) {
          // Archivo con múltiples hojas: seleccionar la que contenga datos
          const sheets = rawResult as Array<{ sheet: string; data: any[][] }>;
          const sheetWithData = sheets.find((s) => Array.isArray(s.data) && s.data.length > 1) || sheets[0];
          rows = sheetWithData?.data || [];
        } else if (Array.isArray(rawResult)) {
          rows = rawResult as any[][];
        } else {
          rows = [];
        }

        // Filtrar filas válidas tipo arreglo (previene error e[0].map is not a function en archivos con metadatos)
        const validRows = rows.filter((r) => Array.isArray(r) && r.length > 0);

        if (validRows.length < 2) {
          setErrorMsg('No pudimos leer los datos de tu archivo Excel. Revisa que tenga los nombres de columnas arriba y tus prendas debajo.');
          setParsing(false);
          return;
        }

        // Buscar automáticamente la fila que contiene los encabezados reales
        let headerRowIndex = 0;
        for (let r = 0; r < Math.min(validRows.length, 10); r++) {
          const currentRow = validRows[r];
          if (!Array.isArray(currentRow)) continue;
          const rowCells = currentRow.map((cell: any) => normalizeKey(String(cell ?? '')));
          const matchesKnownHeader = rowCells.some((k) => k === 'sku' || k === 'name' || k === 'category' || k === 'color' || k === 'tallas');
          if (matchesKnownHeader) {
            headerRowIndex = r;
            break;
          }
        }

        const headerRow = validRows[headerRowIndex];
        if (!Array.isArray(headerRow)) {
          setErrorMsg('No pudimos identificar los nombres de las columnas en tu archivo. Descarga la plantilla oficial para guiarte.');
          setParsing(false);
          return;
        }

        const headers = headerRow.map((h: any) => normalizeKey(String(h ?? '')));
        const dataRows = validRows.slice(headerRowIndex + 1);

        const productsList: ParsedProduct[] = dataRows
          .filter((row: any) => Array.isArray(row) && row.some((cell) => cell !== undefined && cell !== null && String(cell).trim() !== ''))
          .map((row: any[]) => {
            const mapped: Record<string, string> = {};
            headers.forEach((h: string, colIdx: number) => {
              const val = row[colIdx];
              mapped[h] = val !== undefined && val !== null ? String(val).trim() : '';
            });

            // Mapeo inteligente con fallback por posición si los encabezados no coincidieron
            const skuVal = mapped.sku || String(row[0] || '').trim();
            const nameVal = mapped.name || String(row[1] || '').trim();
            const catVal = mapped.category || String(row[2] || '').trim() || 'General';
            const colorVal = mapped.color || String(row[3] || '').trim();
            const tallasVal = mapped.tallas || String(row[4] || '').trim();
            const descVal = mapped.description_and_seams || String(row[5] || '').trim();
            const imgVal = mapped.image_url || String(row[6] || '').trim();

            return {
              sku: skuVal,
              color: colorVal,
              tallas: tallasVal,
              description_and_seams: descVal,
              name: nameVal,
              category: catVal,
              image_url: normalizeImageUrl(imgVal),
            };
          }).filter((p) => p.name || p.sku);

        if (productsList.length === 0) {
          setErrorMsg('No se detectaron prendas con datos en tu archivo Excel. Revisa que las celdas contengan al menos el código o nombre de prenda.');
        } else if (productsList.length > 3000) {
          setErrorMsg(`El archivo contiene ${productsList.length} productos. El límite por carga es de 3,000.`);
        } else {
          setParsedProducts(productsList);
        }
        setParsing(false);
      }
    } catch (err: unknown) {
      console.error('Error al procesar archivo:', err);
      setErrorMsg('No se pudo leer el archivo Excel. Asegúrate de que no esté protegido con contraseña o prueba descargar la plantilla oficial.');
      setParsing(false);
    }
  };

  // Pegar celdas copiadas directamente de Excel (Ctrl + V)
  const handlePasteFromClipboard = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (!text || !text.trim()) {
          setErrorMsg('El portapapeles está vacío. Selecciona las celdas en tu Excel, presiona Ctrl+C y vuelve a intentar.');
          return;
        }

        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length === 0) {
          setErrorMsg('No se detectaron filas en los datos pegados.');
          return;
        }

        const matrix = lines.map((l) => l.split('\t').map((c) => c.trim()));
        let headerIndex = -1;
        const firstRowKeys = matrix[0].map((c) => normalizeKey(c));
        if (firstRowKeys.some((k) => k === 'sku' || k === 'name' || k === 'category' || k === 'color' || k === 'tallas')) {
          headerIndex = 0;
        }

        const dataRows = headerIndex === 0 ? matrix.slice(1) : matrix;
        const headers = headerIndex === 0 ? firstRowKeys : [];

        const productsList: ParsedProduct[] = dataRows.map((row) => {
          const mapped: Record<string, string> = {};
          if (headers.length > 0) {
            headers.forEach((h, idx) => {
              mapped[h] = row[idx] || '';
            });
          }

          const skuVal = mapped.sku || row[0] || '';
          const nameVal = mapped.name || row[1] || '';
          const catVal = mapped.category || row[2] || 'General';
          const colorVal = mapped.color || row[3] || '';
          const tallasVal = mapped.tallas || row[4] || '';
          const descVal = mapped.description_and_seams || row[5] || '';
          const imgVal = mapped.image_url || row[6] || '';

          return {
            sku: skuVal,
            name: nameVal,
            category: catVal,
            color: colorVal,
            tallas: tallasVal,
            description_and_seams: descVal,
            image_url: normalizeImageUrl(imgVal),
          };
        }).filter((p) => p.name || p.sku);

        if (productsList.length === 0) {
          setErrorMsg('No pudimos reconocer prendas en los datos pegados. Asegúrate de copiar las columnas de tu Excel y prueba de nuevo.');
        } else {
          setFileName('Tabla pegada desde Excel');
          setParsedProducts(productsList);
          setSuccessMsg(`¡${productsList.length} prendas detectadas y listas para importar!`);
          setTimeout(() => setSuccessMsg(null), 3500);
        }
      } else {
        setErrorMsg('Tu navegador no permite lectura directa del portapapeles. Sube tu archivo con el botón de Excel.');
      }
    } catch (err) {
      console.warn('Error leyendo portapapeles:', err);
      setErrorMsg('No se pudo acceder al portapapeles. Sube el archivo Excel con el botón «Subir Archivo de Excel».');
    }
  };

  // Enviar los productos parseados al backend
  const handleImportSubmit = async () => {
    if (parsedProducts.length === 0) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload = parsedProducts.map((p) => ({
      name: p.name || `Prenda ${p.sku}`,
      sku: p.sku || `SKU-${Date.now()}`,
      category_name: p.category || 'General',
      description: p.description_and_seams || null,
      color: p.color || null,
      tallas: p.tallas || null,
      detalles_patronaje: p.description_and_seams || null,
      image_url: p.image_url || null,
      min_order_qty: 12,
      units_per_package: 12,
    }));

    try {
      const res = await fetch('/api/admin/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          products: payload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al importar productos');
      }

      setSuccessMsg(
        data.message ||
          `¡${data.count} productos importados exitosamente! Se crearon ${data.newCategoriesCount || 0} nuevas categorías.`
      );
      if (data.products && Array.isArray(data.products) && data.products.length > 0) {
        onProductsImported(data.products);
      }
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error de conexión';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-7 text-slate-900 shadow-xs space-y-5">
      {/* Header de la Página */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            ← Volver a Productos
          </button>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
              Carga Masiva de Productos desde Excel
            </h3>
            <p className="text-[11px] text-slate-500">
              Carga tus prendas mayoristas subiendo tu archivo de Excel (.xlsx) o pegando tus celdas copiadas con Ctrl + V.
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs flex items-center gap-2 font-semibold">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* PASO 1 Y PASO 2 EN DOS TARJETAS GUIADAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tarjeta Paso 1: Descargar Plantilla Oficial */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 border border-emerald-200/80 rounded-2xl p-5 space-y-3.5 flex flex-col justify-between shadow-xs">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Paso 1 • Descargar Formato
                </div>
                <h4 className="font-bold text-sm text-emerald-950 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Descargar Plantilla Oficial de Excel
                </h4>
                <p className="text-xs text-emerald-800/80 leading-relaxed">
                  Descarga este archivo de Excel (.xlsx) con las columnas ya ordenadas y dos ejemplos de prendas listos para rellenar con tu catálogo.
                </p>
              </div>

              <button
                type="button"
                onClick={downloadTemplate}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Plantilla de Excel (.xlsx)</span>
              </button>
            </div>

            {/* Tarjeta Paso 2: Subir Archivo o Pegar Celdas */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3.5 flex flex-col justify-between shadow-xs">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700 border border-slate-300">
                  Paso 2 • Cargar tus Prendas
                </div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-sky-600" />
                  Subir Archivo o Pegar Datos
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Una vez completada la plantilla, súbela aquí o copia las celdas de tu Excel (Ctrl + C) y pégalas directamente.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <label className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm">
                  <Upload className="w-4 h-4" />
                  <span>{fileName ? 'Cambiar Archivo' : 'Subir Archivo (.xlsx)'}</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="bg-white hover:bg-sky-50 text-sky-700 border border-sky-300 font-semibold text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  title="Pegar filas copiadas de tu Excel (Ctrl + C en Excel y clic aquí)"
                >
                  <Clipboard className="w-4 h-4 text-sky-600" />
                  <span>Pegar Celdas (Ctrl + V)</span>
                </button>
              </div>
            </div>
          </div>

          {fileName && (
            <div className="p-3 bg-slate-100 rounded-xl text-xs flex items-center justify-between">
              <span className="font-semibold text-slate-800">
                Archivo activo: <strong>{fileName}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setFileName(null);
                  setParsedProducts([]);
                  setErrorMsg(null);
                }}
                className="text-rose-600 hover:text-rose-700 font-bold text-[11px] cursor-pointer"
              >
                Limpiar
              </button>
            </div>
          )}

            {/* Guía de Columnas Oficiales Ordenadas */}
            <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-1.5 font-bold">
                <span>⚠️</span>
                <span>Importante: Tu archivo debe seguir este orden exacto de columnas para una importación exitosa:</span>
              </div>
              <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                <span className="bg-white border border-amber-300 px-2 py-1 rounded-md text-amber-950 font-bold">1. Código</span>
                <span className="bg-white border border-amber-300 px-2 py-1 rounded-md text-amber-950 font-bold">2. Nombre de Prenda</span>
                <span className="bg-white border border-amber-300 px-2 py-1 rounded-md text-amber-950 font-bold">3. Categoría</span>
                <span className="bg-white border border-amber-300 px-2 py-1 rounded-md text-amber-950 font-bold">4. Color</span>
                <span className="bg-white border border-amber-300 px-2 py-1 rounded-md text-amber-950 font-bold">5. Tallas</span>
                <span className="bg-white border border-amber-300 px-2 py-1 rounded-md text-amber-950 font-bold">6. Descripción y Costuras</span>
                <span className="bg-white border border-amber-300 px-2 py-1 rounded-md text-amber-950 font-bold">7. Enlace Foto Principal</span>
              </div>
            </div>

          {/* Vista Previa de Filas Parseadas */}
          {parsing ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
              <span className="text-xs text-slate-500">Analizando filas del archivo...</span>
            </div>
          ) : parsedProducts.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>{parsedProducts.length} productos detectados listos para importar</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Mostrando primeros {Math.min(parsedProducts.length, 50)}
                </span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0 text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="p-2.5 border-b border-slate-200">1. Código</th>
                      <th className="p-2.5 border-b border-slate-200">2. Prenda</th>
                      <th className="p-2.5 border-b border-slate-200">3. Categoría</th>
                      <th className="p-2.5 border-b border-slate-200">4. Color</th>
                      <th className="p-2.5 border-b border-slate-200">5. Tallas</th>
                      <th className="p-2.5 border-b border-slate-200">6. Costuras / Ficha</th>
                      <th className="p-2.5 border-b border-slate-200">7. Foto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {parsedProducts.slice(0, 50).map((p, i) => (
                      <tr key={i} className="hover:bg-slate-50/80">
                        <td className="p-2.5 font-mono font-bold text-slate-800">{p.sku || '-'}</td>
                        <td className="p-2.5 text-slate-900 font-bold">{p.name || '-'}</td>
                        <td className="p-2.5 text-slate-600">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-semibold">{p.category}</span>
                        </td>
                        <td className="p-2.5 text-slate-600">{p.color || '-'}</td>
                        <td className="p-2.5 font-mono text-[11px] text-slate-700">{p.tallas || '-'}</td>
                        <td className="p-2.5 text-slate-500 truncate max-w-[140px] text-[11px]" title={p.description_and_seams}>
                          {p.description_and_seams || '-'}
                        </td>
                        <td className="p-2.5 text-[11px]">
                          {p.image_url ? (
                            <span className="text-emerald-600 font-semibold flex items-center gap-1">
                              ✓ Sí
                            </span>
                          ) : (
                            <span className="text-slate-400">Por defecto</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {/* Botón de Acción de Importación */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer"
            >
              Cancelar y Volver
            </button>

            <button
              type="button"
              disabled={loading || parsedProducts.length === 0}
              onClick={handleImportSubmit}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-xs px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Importando {parsedProducts.length} productos en lotes...</span>
                </>
              ) : parsedProducts.length === 0 ? (
                <span>Sube tu archivo Excel para Importar</span>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Importar {parsedProducts.length} Productos</span>
                </>
              )}
            </button>
          </div>
    </div>
  );
}
