'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  LayoutGrid,
  List,
  Upload,
  Search,
  Trash2,
  Copy,
  Check,
  FileText,
  FileSpreadsheet,
  ImageIcon,
  X,
  ExternalLink,
  Plus,
  Loader2,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { MediaAsset } from '@/app/api/admin/media/route';
import { Tenant } from '@/lib/types';
import { translateErrorMessage } from '@/lib/error-translator';

interface MediaLibraryViewProps {
  tenant: Tenant;
}

export default function MediaLibraryView({ tenant }: MediaLibraryViewProps) {
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Estados de vista y filtros
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selección en lotes
  const [isBulkSelectMode, setIsBulkSelectMode] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  // Modal de detalle de medio
  const [activeMediaDetail, setActiveMediaDetail] = useState<MediaAsset | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  // Subida de archivos
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [showUploadZone, setShowUploadZone] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar medios desde la API
  const fetchMedia = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/media?tenant_id=${tenant.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar medios');
      setMedia(data.media || []);
    } catch (err: unknown) {
      setErrorMsg(translateErrorMessage(err, 'Error al cargar biblioteca de medios'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [tenant.id]);

  // Generar opciones de fecha dinámicas a partir de los medios existentes
  const dateOptions = useMemo(() => {
    const dates = new Set<string>();
    media.forEach((item) => {
      try {
        const d = new Date(item.created_at);
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          dates.add(key);
        }
      } catch {
        // Ignorar fechas inválidas
      }
    });

    return Array.from(dates).sort().reverse();
  }, [media]);

  const formatDateLabel = (key: string) => {
    const [year, month] = key.split('-');
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const mIdx = parseInt(month, 10) - 1;
    return `${monthNames[mIdx] || month} ${year}`;
  };

  // Filtrado de medios
  const filteredMedia = useMemo(() => {
    return media.filter((item) => {
      // 1. Filtro por tipo
      if (typeFilter === 'images' && item.type !== 'image') return false;
      if (typeFilter === 'spreadsheets' && item.type !== 'spreadsheet') return false;
      if (typeFilter === 'documents' && item.type !== 'document') return false;

      // 2. Filtro por fecha
      if (dateFilter !== 'all') {
        const d = new Date(item.created_at);
        const itemKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (itemKey !== dateFilter) return false;
      }

      // 3. Filtro por búsqueda
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesAttached = item.attachedTo ? item.attachedTo.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesAttached) return false;
      }

      return true;
    });
  }, [media, typeFilter, dateFilter, searchQuery]);

  // Manejo de subida de archivos
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setErrorMsg(null);
    setUploadProgress(`Subiendo 1 de ${files.length}...`);

    let uploadedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`Subiendo (${i + 1}/${files.length}): ${file.name}`);

      try {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('tenant_id', tenant.id);
        const isSheet = file.name.endsWith('.csv') || file.name.endsWith('.xlsx');
        fd.append('folder', isSheet ? 'imports' : 'products');

        const res = await fetch('/api/admin/media', {
          method: 'POST',
          body: fd,
        });

        const data = await res.json();
        if (res.ok && data.success) {
          uploadedCount++;
        } else {
          console.error('Error subiendo medio:', data.error);
        }
      } catch (uploadErr) {
        console.error('Error en fetch de subida:', uploadErr);
      }
    }

    setIsUploading(false);
    setUploadProgress(null);
    setShowUploadZone(false);
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (uploadedCount > 0) {
      setSuccessMsg(`¡${uploadedCount} archivo(s) subido(s) con éxito!`);
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchMedia();
    } else {
      setErrorMsg('No se pudo subir ningún archivo. Verifica los formatos y tamaños.');
    }
  };

  // Manejador de selección por lotes
  const toggleSelectMedia = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredMedia.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMedia.map((m) => m.id)));
    }
  };

  // Eliminar medios seleccionados
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;

    const confirmMsg = `¿Estás seguro de que deseas eliminar permanentemente ${selectedIds.size} archivo(s)? Esta acción no se puede deshacer.`;
    if (!window.confirm(confirmMsg)) return;

    setDeleting(true);
    setErrorMsg(null);

    const itemsToDelete = media.filter((m) => selectedIds.has(m.id) && m.storagePath);
    const paths = itemsToDelete.map((m) => m.storagePath!).filter(Boolean);

    try {
      if (paths.length > 0) {
        const res = await fetch('/api/admin/media', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenant_id: tenant.id, filePaths: paths }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al eliminar');
      }

      // Actualizar estado local
      setMedia((prev) => prev.filter((m) => !selectedIds.has(m.id)));
      setSelectedIds(new Set());
      setIsBulkSelectMode(false);
      if (activeMediaDetail && selectedIds.has(activeMediaDetail.id)) {
        setActiveMediaDetail(null);
      }

      setSuccessMsg('Medios eliminados permanentemente.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setErrorMsg(translateErrorMessage(err, 'Error al eliminar medios'));
    } finally {
      setDeleting(false);
    }
  };

  // Copiar URL al portapapeles
  const handleCopyUrl = (url: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* 1. Cabecera principal: Biblioteca de medios + Añadir medios */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <FolderOpen className="w-6 h-6 text-sky-600" />
            <span>Biblioteca de medios</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gestiona todas las imágenes, catálogos y archivos subidos a tu tienda.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchMedia}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-200 shadow-2xs"
            title="Refrescar biblioteca"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setShowUploadZone(!showUploadZone)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm hover:shadow cursor-pointer"
          >
            {showUploadZone ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>Añadir medios</span>
          </button>
        </div>
      </div>

      {/* Mensajes de Alerta / Éxito */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl text-xs flex items-center justify-between">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)} className="text-rose-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs flex items-center justify-between font-semibold">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            {successMsg}
          </span>
          <button type="button" onClick={() => setSuccessMsg(null)} className="text-emerald-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Zona Desplegable de Subida de Archivos (Drag & Drop / Selector) */}
      {showUploadZone && (
        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-6 sm:p-8 text-center space-y-4 animate-in fade-in duration-200">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.csv,.xlsx,.xls,.pdf,.txt"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
            id="media-file-input"
          />

          <div className="max-w-md mx-auto space-y-2">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-xs border border-slate-200 text-sky-600">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900">
              Arrastra archivos aquí para subirlos
            </h3>
            <p className="text-xs text-slate-500">
              Soporta imágenes (JPG, PNG, WEBP, SVG) y documentos (CSV, Excel, PDF). Tamaño máximo por archivo: 50 MB.
            </p>
          </div>

          <label
            htmlFor="media-file-input"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span>Seleccionar archivos desde tu ordenador</span>
          </label>

          {isUploading && (
            <div className="pt-2 flex items-center justify-center gap-2 text-xs font-semibold text-sky-700">
              <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
              <span>{uploadProgress || 'Subiendo archivos...'}</span>
            </div>
          )}
        </div>
      )}

      {/* 3. Barra de Herramientas y Filtros (Filtrar los medios) */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        {/* Lado izquierdo: Vistas y Selectores de Filtro */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          {/* Alternar Vista de cuadrícula / Vista de lista */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Vista de cuadrícula"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px]">Vista de cuadrícula</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Vista de lista"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px]">Vista de lista</span>
            </button>
          </div>

          {/* Filtrar por tipo */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer shadow-2xs"
            title="Filtrar por tipo de medio"
          >
            <option value="all">Todos los medios</option>
            <option value="images">Imágenes</option>
            <option value="spreadsheets">Hojas de cálculo (CSV, Excel)</option>
            <option value="documents">Documentos</option>
          </select>

          {/* Filtrar por fecha */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer shadow-2xs"
            title="Filtrar por fecha"
          >
            <option value="all">Todas las fechas</option>
            {dateOptions.map((opt) => (
              <option key={opt} value={opt}>
                {formatDateLabel(opt)}
              </option>
            ))}
          </select>

          {/* Selección en lotes */}
          <button
            type="button"
            onClick={() => {
              setIsBulkSelectMode(!isBulkSelectMode);
              setSelectedIds(new Set());
            }}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              isBulkSelectMode
                ? 'bg-slate-900 text-white border-slate-900 font-bold'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 shadow-2xs'
            }`}
          >
            {isBulkSelectMode ? 'Cancelar selección' : 'Selección en lotes'}
          </button>
        </div>

        {/* Lado derecho: Buscar medios */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar medios..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Barra de acción cuando hay medios seleccionados en lote */}
      {isBulkSelectMode && (
        <div className="bg-sky-50 border border-sky-200/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSelectAll}
              className="font-semibold text-sky-800 hover:underline cursor-pointer"
            >
              {selectedIds.size === filteredMedia.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </button>
            <span className="text-slate-400">•</span>
            <span className="text-slate-700 font-medium">
              {selectedIds.size} de {filteredMedia.length} seleccionados
            </span>
          </div>

          <button
            type="button"
            disabled={selectedIds.size === 0 || deleting}
            onClick={handleDeleteSelected}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            <span>Eliminar seleccionados ({selectedIds.size})</span>
          </button>
        </div>
      )}

      {/* 4. Contenido de Medios: Cuadrícula o Lista */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
          <p className="text-xs text-slate-500 font-medium">Cargando biblioteca de medios...</p>
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-slate-800">
            No se encontraron medios
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || typeFilter !== 'all' || dateFilter !== 'all'
              ? 'No hay archivos que coincidan con los filtros seleccionados.'
              : 'Aún no tienes archivos subidos a la biblioteca de medios.'}
          </p>
          <button
            type="button"
            onClick={() => setShowUploadZone(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Subir tu primer archivo</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* VISTA DE CUADRÍCULA */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {filteredMedia.map((item) => {
            const isSelected = selectedIds.has(item.id);

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (isBulkSelectMode) {
                    toggleSelectMedia(item.id);
                  } else {
                    setActiveMediaDetail(item);
                  }
                }}
                className={`group relative bg-white border rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                  isSelected
                    ? 'border-sky-500 ring-2 ring-sky-500/20'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Checkbox de selección */}
                {isBulkSelectMode && (
                  <div className="absolute top-2 left-2 z-10">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                    />
                  </div>
                )}

                {/* Miniatura del medio */}
                <div className="aspect-square bg-slate-50 flex items-center justify-center overflow-hidden relative">
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={item.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : item.type === 'spreadsheet' ? (
                    <div className="flex flex-col items-center justify-center p-3 text-emerald-600">
                      <FileSpreadsheet className="w-10 h-10 stroke-[1.5]" />
                      <span className="text-[10px] font-bold uppercase mt-1 text-emerald-800">CSV / Excel</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-3 text-slate-500">
                      <FileText className="w-10 h-10 stroke-[1.5]" />
                      <span className="text-[10px] font-bold uppercase mt-1 text-slate-700">Documento</span>
                    </div>
                  )}

                  {/* Badge de tipo de archivo */}
                  <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-black/60 text-white backdrop-blur-xs">
                    {item.name.split('.').pop()?.toUpperCase() || 'FILE'}
                  </span>
                </div>

                {/* Pie de la tarjeta */}
                <div className="p-2.5 border-t border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-800 truncate" title={item.name}>
                    {item.name}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {item.attachedTo ? `En: ${item.attachedTo}` : formatFileSize(item.size)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VISTA DE LISTA */
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
              <tr>
                {isBulkSelectMode && <th className="p-3 w-8"></th>}
                <th className="p-3 w-16">Archivo</th>
                <th className="p-3">Título / Nombre</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Tamaño</th>
                <th className="p-3">Subido a</th>
                <th className="p-3">Fecha</th>
                <th className="p-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredMedia.map((item) => {
                const isSelected = selectedIds.has(item.id);

                return (
                  <tr
                    key={item.id}
                    onClick={() => {
                      if (isBulkSelectMode) toggleSelectMedia(item.id);
                    }}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isSelected ? 'bg-sky-50/60' : ''
                    }`}
                  >
                    {isBulkSelectMode && (
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="p-2.5">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMediaDetail(item);
                        }}
                        className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200 cursor-pointer"
                      >
                        {item.type === 'image' ? (
                          <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                        ) : item.type === 'spreadsheet' ? (
                          <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <FileText className="w-5 h-5 text-slate-500" />
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-slate-900 max-w-xs truncate">
                      <button
                        type="button"
                        onClick={() => setActiveMediaDetail(item)}
                        className="hover:text-sky-600 transition-colors cursor-pointer text-left truncate block w-full"
                        title={item.name}
                      >
                        {item.name}
                      </button>
                    </td>
                    <td className="p-3 uppercase text-[10px] font-mono text-slate-500">
                      {item.name.split('.').pop() || 'Archivo'}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-600">
                      {formatFileSize(item.size)}
                    </td>
                    <td className="p-3 text-slate-600 truncate max-w-[150px]" title={item.attachedTo || 'Almacenamiento'}>
                      {item.attachedTo || <span className="text-slate-400 italic">Almacenamiento</span>}
                    </td>
                    <td className="p-3 text-slate-500 text-[11px]">
                      {new Date(item.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyUrl(item.url);
                        }}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Copiar enlace"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. Modal de Detalles de Medio (Estilo WordPress / Inspector lateral) */}
      {activeMediaDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Cabecera del modal */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-sky-600" />
                <span>Detalles del archivo</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveMediaDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenido en 2 columnas: Vista previa + Metadatos */}
            <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Columna Izquierda: Vista previa grande */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center min-h-[220px]">
                {activeMediaDetail.type === 'image' ? (
                  <img
                    src={activeMediaDetail.url}
                    alt={activeMediaDetail.name}
                    className="max-h-72 object-contain rounded-lg shadow-xs"
                  />
                ) : activeMediaDetail.type === 'spreadsheet' ? (
                  <div className="py-10 flex flex-col items-center gap-2 text-emerald-600">
                    <FileSpreadsheet className="w-16 h-16 stroke-[1.5]" />
                    <span className="font-bold text-xs text-slate-800">Hoja de cálculo</span>
                  </div>
                ) : (
                  <div className="py-10 flex flex-col items-center gap-2 text-slate-500">
                    <FileText className="w-16 h-16 stroke-[1.5]" />
                    <span className="font-bold text-xs text-slate-800">Documento</span>
                  </div>
                )}

                <a
                  href={activeMediaDetail.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 text-xs text-sky-600 hover:text-sky-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Ver archivo en tamaño original</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Columna Derecha: Metadatos e inspector */}
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Nombre del archivo
                  </label>
                  <p className="font-semibold text-slate-900 mt-0.5 break-all">
                    {activeMediaDetail.name}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Tipo de archivo</span>
                    <span className="font-medium text-slate-800 font-mono">
                      {activeMediaDetail.mimeType || activeMediaDetail.name.split('.').pop()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Tamaño</span>
                    <span className="font-medium text-slate-800 font-mono">
                      {formatFileSize(activeMediaDetail.size)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Subido el</span>
                    <span className="font-medium text-slate-800">
                      {new Date(activeMediaDetail.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Vinculado a</span>
                    <span className="font-medium text-slate-800 truncate block">
                      {activeMediaDetail.attachedTo || 'Almacenamiento general'}
                    </span>
                  </div>
                </div>

                {/* Campo URL del archivo copiable */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Enlace permanente del archivo
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={activeMediaDetail.url}
                      className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-mono text-[11px] truncate focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(activeMediaDetail.url)}
                      className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1 shrink-0 ${
                        copiedUrl
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUrl ? 'Copiado' : 'Copiar URL'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Pie del modal con botón de cierre */}
            <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-2xl">
              <span className="text-[11px] text-slate-400">
                Ubicación: {activeMediaDetail.storagePath || 'Almacenamiento de catálogo'}
              </span>
              <button
                type="button"
                onClick={() => setActiveMediaDetail(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
