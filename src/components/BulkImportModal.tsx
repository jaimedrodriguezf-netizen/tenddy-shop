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
  Check
} from 'lucide-react';
import readXlsxFile from 'read-excel-file/browser';
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

  // Descargar plantilla CSV compatible con Excel con los encabezados exactos del usuario
  const downloadTemplate = () => {
    const headers = [
      'Código',
      'Nombre de Prenda',
      'Categoría',
      'Color',
      'Tallas',
      'Descripción y Costuras (Detalles para Moldes y Patronaje)',
      'Enlace Foto Principal'
    ];

    const sampleRows = [
      [
        'OXF-001',
        'Camisa Oxford Manga Larga',
        'Camisas',
        'Azul Cielo',
        'S, M, L, XL',
        'Costura reforzada doble pespunte en sisas y cuello fusionado para alta durabilidad',
        'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800'
      ],
      [
        'DRL-002',
        'Pantalón Drill Operativo',
        'Pantalones',
        'Kaki / Beige',
        '28, 30, 32, 34, 36',
        'Pretina anatómica con pasadores dobles y triple costura en tiro y entrepierna',
        'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800'
      ]
    ];

    const csvContent = '\uFEFF' + [headers, ...sampleRows].map(r => r.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'plantilla_importacion_productos.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        // Archivo Excel (.xlsx / .xls) con soporte multi-hoja
        const rawResult = (await readXlsxFile(file)) as unknown;
        let rows: any[][];

        if (Array.isArray(rawResult) && rawResult.length > 0 && typeof rawResult[0] === 'object' && rawResult[0] !== null && 'data' in rawResult[0]) {
          // Archivo con múltiples hojas: seleccionar la que contenga datos
          const sheets = rawResult as Array<{ sheet: string; data: any[][] }>;
          const sheetWithData = sheets.find((s) => Array.isArray(s.data) && s.data.length > 1) || sheets[0];
          rows = sheetWithData?.data || [];
        } else {
          rows = rawResult as any[][];
        }

        if (!rows || rows.length < 2) {
          setErrorMsg('El archivo Excel debe tener al menos una fila de encabezados y una fila con datos de productos.');
          setParsing(false);
          return;
        }

        // Buscar automáticamente la fila que contiene los encabezados reales
        let headerRowIndex = 0;
        for (let r = 0; r < Math.min(rows.length, 10); r++) {
          const rowCells = (rows[r] as any[]).map((cell: any) => normalizeKey(String(cell ?? '')));
          const matchesKnownHeader = rowCells.some((k) => k === 'sku' || k === 'name' || k === 'category' || k === 'color' || k === 'tallas');
          if (matchesKnownHeader) {
            headerRowIndex = r;
            break;
          }
        }

        const headerRow = rows[headerRowIndex] as any[];
        const headers = headerRow.map((h: any) => normalizeKey(String(h ?? '')));
        const dataRows = rows.slice(headerRowIndex + 1);

        const productsList: ParsedProduct[] = dataRows.map((row: any[]) => {
          const mapped: Record<string, string> = {};
          headers.forEach((h: string, colIdx: number) => {
            const val = row[colIdx];
            mapped[h] = val !== undefined && val !== null ? String(val).trim() : '';
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
          setErrorMsg('No se detectaron filas válidas con datos de productos en el Excel.');
        } else {
          setParsedProducts(productsList);
        }
        setParsing(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar archivo';
      setErrorMsg(msg);
      setParsing(false);
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

      setSuccessMsg(`¡${data.count} productos importados exitosamente! Se crearon ${data.newCategoriesCount || 0} nuevas categorías.`);
      if (data.products && Array.isArray(data.products)) {
        onProductsImported(data.products);
      }
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error de conexión';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div onClick={onClose} className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" />

      <div className="min-h-full flex items-center justify-center p-3 sm:p-4">
        <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 text-slate-900 shadow-2xl z-10 space-y-5">
          {/* Header del Modal */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  Importación Masiva de Productos (Excel / CSV)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Carga decenas de referencias con código, colores, tallas y ficha técnica en un solo clic.
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
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

          {/* Zona de Carga de Archivo */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{fileName ? 'Cambiar Archivo' : 'Seleccionar Excel o CSV'}</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-slate-800 truncate">
                    {fileName || 'Ningún archivo seleccionado'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Formatos soportados: .xlsx, .xls, .csv
                  </span>
                </div>
              </div>

              {/* Botón Descargar Plantilla Oficial */}
              <button
                type="button"
                onClick={downloadTemplate}
                className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                title="Descargar plantilla de ejemplo con las columnas exactas"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Plantilla Oficial</span>
              </button>
            </div>

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
              Cerrar
            </button>

            <button
              type="button"
              disabled={loading || parsedProducts.length === 0}
              onClick={handleImportSubmit}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Importando a Supabase...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Importar {parsedProducts.length} Productos</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
