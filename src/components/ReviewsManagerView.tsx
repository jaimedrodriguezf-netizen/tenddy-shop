'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Star,
  Check,
  X,
  Trash2,
  AlertCircle,
  Loader2,
  Search,
  Plus,
  MessageSquare,
  CornerDownRight,
  ShieldAlert,
  RotateCcw,
  Edit2,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  User,
  ExternalLink,
  SlidersHorizontal,
  Package,
  Calendar,
  ThumbsUp,
  Mail,
  Globe
} from 'lucide-react';
import { Tenant, Product, ProductReview, ReviewStatus } from '@/lib/types';
import { translateErrorMessage } from '@/lib/error-translator';

interface ReviewsManagerViewProps {
  tenant: Tenant;
  products: Product[];
  onReviewsChanged?: (reviews: ProductReview[]) => void;
}

type SortField = 'type' | 'author' | 'rating' | 'product' | 'date';
type SortOrder = 'asc' | 'desc';

export default function ReviewsManagerView({
  tenant,
  products,
  onReviewsChanged,
}: ReviewsManagerViewProps) {
  // Lista de valoraciones
  const [reviews, setReviews] = useState<ProductReview[]>(tenant.settings?.reviews || []);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Estados de Filtros de la Barra Superior
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'review' | 'rating'>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Ordenación de Columnas
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Selección Múltiple y Acciones en Lote
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>('');
  const [bulkLoading, setBulkLoading] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [replyingReview, setReplyingReview] = useState<ProductReview | null>(null);
  const [replyText, setReplyText] = useState('');
  const [savingReply, setSavingReply] = useState(false);

  const [editingReview, setEditingReview] = useState<ProductReview | null>(null);
  const [editRating, setEditRating] = useState<number>(5);
  const [editContent, setEditContent] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Formulario de Nueva Valoración Manual
  const [newProductId, setNewProductId] = useState<string>(products[0]?.id || '');
  const [newType, setNewType] = useState<'review' | 'rating'>('review');
  const [newAuthor, setNewAuthor] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRating, setNewRating] = useState<number>(5);
  const [newContent, setNewContent] = useState('');
  const [newStatus, setNewStatus] = useState<ReviewStatus>('approved');
  const [savingNewReview, setSavingNewReview] = useState(false);

  // Mapa de productos O(1)
  const productMap = useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of products) {
      map.set(p.id, p);
    }
    return map;
  }, [products]);

  // Cargar valoraciones desde la API al montar
  const loadReviews = () => {
    setLoading(true);
    fetch(`/api/admin/reviews?tenantId=${tenant.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.allReviews) {
          setReviews(data.allReviews);
          onReviewsChanged?.(data.allReviews);
        }
        setLoading(false);
      })
      .catch((err) => {
        const msg = translateErrorMessage(err, 'No se pudieron cargar las valoraciones');
        setErrorMsg(msg);
        setLoading(false);
      });
  };

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/reviews?tenantId=${tenant.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data.allReviews) {
          setReviews(data.allReviews);
          onReviewsChanged?.(data.allReviews);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        const msg = translateErrorMessage(err, 'No se pudieron cargar las valoraciones');
        setErrorMsg(msg);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [tenant.id]);

  // Conteo de valoraciones por estado
  const counts = useMemo(() => {
    const all = reviews.filter((r) => r.status !== 'trash').length;
    const pending = reviews.filter((r) => r.status === 'pending').length;
    const approved = reviews.filter((r) => r.status === 'approved').length;
    const spam = reviews.filter((r) => r.status === 'spam').length;
    const trash = reviews.filter((r) => r.status === 'trash').length;
    return { all, pending, approved, spam, trash };
  }, [reviews]);

  // Filtrado y Ordenación de la lista
  const filteredAndSortedReviews = useMemo(() => {
    let result = [...reviews];

    // 1. Filtro por Estado
    if (statusFilter === 'all') {
      result = result.filter((r) => r.status !== 'trash');
    } else {
      result = result.filter((r) => r.status === statusFilter);
    }

    // 2. Filtro por Tipo
    if (typeFilter !== 'all') {
      result = result.filter((r) => (r.type || 'review') === typeFilter);
    }

    // 3. Filtro por Puntuación
    if (ratingFilter !== 'all') {
      const targetRating = Number(ratingFilter);
      if (!isNaN(targetRating)) {
        result = result.filter((r) => r.rating === targetRating);
      }
    }

    // 4. Filtro por Producto
    if (productFilter !== 'all') {
      result = result.filter((r) => r.product_id === productFilter);
    }

    // 5. Búsqueda textual (autor, comentario o nombre de producto)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.author_name?.toLowerCase().includes(q) ||
          r.content?.toLowerCase().includes(q) ||
          r.product_name?.toLowerCase().includes(q) ||
          (productMap.get(r.product_id)?.name || '').toLowerCase().includes(q)
      );
    }

    // 6. Ordenación
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'type') {
        const typeA = a.type || 'review';
        const typeB = b.type || 'review';
        comparison = typeA.localeCompare(typeB);
      } else if (sortField === 'author') {
        comparison = (a.author_name || '').localeCompare(b.author_name || '');
      } else if (sortField === 'rating') {
        comparison = (a.rating || 0) - (b.rating || 0);
      } else if (sortField === 'product') {
        const prodA = a.product_name || productMap.get(a.product_id)?.name || '';
        const prodB = b.product_name || productMap.get(b.product_id)?.name || '';
        comparison = prodA.localeCompare(prodB);
      } else if (sortField === 'date') {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        comparison = dateA - dateB;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [reviews, statusFilter, typeFilter, ratingFilter, productFilter, searchQuery, sortField, sortOrder, productMap]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedReviews.length / itemsPerPage));
  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedReviews.slice(start, start + itemsPerPage);
  }, [filteredAndSortedReviews, currentPage, itemsPerPage]);

  // Manejo de ordenación
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Manejo de Selección Múltiple
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(paginatedReviews.map((r) => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Cambiar estado individual (Aprobar, Pendiente, Spam, Papelera, Restaurar)
  const handleUpdateStatus = async (review: ProductReview, newStatus: ReviewStatus) => {
    try {
      setErrorMsg(null);
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenant.id,
          id: review.id,
          status: newStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar estado');

      setReviews(data.reviews);
      onReviewsChanged?.(data.reviews);
      setSuccessMsg(`Valoración ${newStatus === 'approved' ? 'aprobada' : newStatus === 'trash' ? 'movida a la papelera' : newStatus === 'spam' ? 'marcada como spam' : 'actualizada'}`);
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (err: unknown) {
      const msg = translateErrorMessage(err, 'No se pudo actualizar la valoración');
      setErrorMsg(msg);
    }
  };

  // Eliminar individual permanente
  const handleDeletePermanent = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta valoración de forma permanente? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setErrorMsg(null);
      const res = await fetch(`/api/admin/reviews?tenantId=${tenant.id}&id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar');

      setReviews(data.reviews);
      onReviewsChanged?.(data.reviews);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setSuccessMsg('Valoración eliminada permanentemente');
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (err: unknown) {
      const msg = translateErrorMessage(err, 'No se pudo eliminar la valoración');
      setErrorMsg(msg);
    }
  };

  // Ejecutar Acción en Lote
  const handleExecuteBulkAction = async () => {
    if (!bulkAction || selectedIds.size === 0) return;

    try {
      setBulkLoading(true);
      setErrorMsg(null);

      const idsArray = Array.from(selectedIds);

      if (bulkAction === 'delete_permanently') {
        if (!confirm(`¿Eliminar definitivamente ${idsArray.length} valoraciones seleccionadas?`)) {
          setBulkLoading(false);
          return;
        }

        const res = await fetch(`/api/admin/reviews?tenantId=${tenant.id}&ids=${idsArray.join(',')}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al eliminar');

        setReviews(data.reviews);
        onReviewsChanged?.(data.reviews);
        setSelectedIds(new Set());
        setSuccessMsg(`${idsArray.length} valoraciones eliminadas definitivamente`);
      } else {
        const res = await fetch('/api/admin/reviews', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenant_id: tenant.id,
            ids: idsArray,
            action: bulkAction,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al actualizar lote');

        setReviews(data.reviews);
        onReviewsChanged?.(data.reviews);
        setSelectedIds(new Set());
        setSuccessMsg(`Acción en lote completada para ${idsArray.length} valoraciones`);
      }

      setBulkAction('');
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (err: unknown) {
      const msg = translateErrorMessage(err, 'Error al ejecutar acción en lote');
      setErrorMsg(msg);
    } finally {
      setBulkLoading(false);
    }
  };

  // Vaciar papelera
  const handleEmptyTrash = async () => {
    const trashReviews = reviews.filter((r) => r.status === 'trash');
    if (trashReviews.length === 0) return;

    if (!confirm(`¿Vaciar toda la papelera (${trashReviews.length} valoraciones)?`)) return;

    try {
      setLoading(true);
      const ids = trashReviews.map((r) => r.id).join(',');
      const res = await fetch(`/api/admin/reviews?tenantId=${tenant.id}&ids=${ids}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al vaciar papelera');

      setReviews(data.reviews);
      onReviewsChanged?.(data.reviews);
      setSelectedIds(new Set());
      setSuccessMsg('Papelera vaciada por completo');
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (err: unknown) {
      const msg = translateErrorMessage(err, 'No se pudo vaciar la papelera');
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // Guardar Respuesta Oficial
  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingReview || !replyText.trim()) return;

    try {
      setSavingReply(true);
      setErrorMsg(null);

      const replyPayload = {
        content: replyText.trim(),
        author_name: tenant.name || 'Tienda Oficial',
        created_at: new Date().toISOString(),
      };

      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenant.id,
          id: replyingReview.id,
          reply: replyPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar respuesta');

      setReviews(data.reviews);
      onReviewsChanged?.(data.reviews);
      setReplyingReview(null);
      setReplyText('');
      setSuccessMsg('Respuesta guardada y publicada');
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (err: unknown) {
      const msg = translateErrorMessage(err, 'No se pudo guardar la respuesta');
      setErrorMsg(msg);
    } finally {
      setSavingReply(false);
    }
  };

  // Guardar Edición Rápida
  const handleSaveQuickEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview || !editContent.trim()) return;

    try {
      setSavingEdit(true);
      setErrorMsg(null);

      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenant.id,
          id: editingReview.id,
          content: editContent.trim(),
          rating: editRating,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar');

      setReviews(data.reviews);
      onReviewsChanged?.(data.reviews);
      setEditingReview(null);
      setSuccessMsg('Valoración actualizada');
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (err: unknown) {
      const msg = translateErrorMessage(err, 'No se pudo actualizar');
      setErrorMsg(msg);
    } finally {
      setSavingEdit(false);
    }
  };

  // Guardar Nueva Valoración Manual
  const handleCreateManualReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductId || !newAuthor.trim() || !newContent.trim()) {
      setErrorMsg('Completa los campos obligatorios del formulario');
      return;
    }

    try {
      setSavingNewReview(true);
      setErrorMsg(null);

      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenant.id,
          product_id: newProductId,
          type: newType,
          author_name: newAuthor.trim(),
          author_email: newEmail.trim() || undefined,
          rating: newRating,
          content: newContent.trim(),
          status: newStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear valoración');

      setReviews(data.reviews);
      onReviewsChanged?.(data.reviews);
      setIsAddModalOpen(false);
      setNewAuthor('');
      setNewEmail('');
      setNewContent('');
      setNewRating(5);
      setSuccessMsg('Valoración creada exitosamente');
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (err: unknown) {
      const msg = translateErrorMessage(err, 'No se pudo crear la valoración');
      setErrorMsg(msg);
    } finally {
      setSavingNewReview(false);
    }
  };

  // Formatear Fecha y Hora
  const formatDate = (isoString?: string) => {
    if (!isoString) return '07/10/2026';
    try {
      const d = new Date(isoString);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} a las ${hours}:${minutes}`;
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-4">
      {/* =========================================================================
          1. CABECERA PRINCIPAL Y ACCIONES
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Valoraciones
            </h1>
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              <span>Moderar Reseñas</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Modera, responde y audita las valoraciones y opiniones de los clientes sobre los productos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Añadir valoración</span>
          </button>
        </div>
      </div>

      {/* Alertas */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
          <button type="button" onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-800 p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button type="button" onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-800 p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* =========================================================================
          2. BARRA DE ESTADOS SUPERIOR: TODAS | PENDIENTES | APROBADAS | SPAM | PAPELERA
          ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-0.5 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
            className={`cursor-pointer transition-colors ${
              statusFilter === 'all' ? 'font-bold text-slate-950 underline underline-offset-4 decoration-sky-600' : 'hover:text-slate-900'
            }`}
          >
            Todas ({counts.all})
          </button>
          <span className="text-slate-300">|</span>

          <button
            type="button"
            onClick={() => { setStatusFilter('pending'); setCurrentPage(1); }}
            className={`cursor-pointer transition-colors ${
              statusFilter === 'pending' ? 'font-bold text-slate-950 underline underline-offset-4 decoration-amber-500' : 'hover:text-slate-900'
            }`}
          >
            Pendientes ({counts.pending})
          </button>
          <span className="text-slate-300">|</span>

          <button
            type="button"
            onClick={() => { setStatusFilter('approved'); setCurrentPage(1); }}
            className={`cursor-pointer transition-colors ${
              statusFilter === 'approved' ? 'font-bold text-slate-950 underline underline-offset-4 decoration-emerald-600' : 'hover:text-slate-900'
            }`}
          >
            Aprobadas ({counts.approved})
          </button>
          <span className="text-slate-300">|</span>

          <button
            type="button"
            onClick={() => { setStatusFilter('spam'); setCurrentPage(1); }}
            className={`cursor-pointer transition-colors ${
              statusFilter === 'spam' ? 'font-bold text-slate-950 underline underline-offset-4 decoration-rose-600' : 'hover:text-slate-900'
            }`}
          >
            Spam ({counts.spam})
          </button>
          <span className="text-slate-300">|</span>

          <button
            type="button"
            onClick={() => { setStatusFilter('trash'); setCurrentPage(1); }}
            className={`cursor-pointer transition-colors ${
              statusFilter === 'trash' ? 'font-bold text-slate-950 underline underline-offset-4 decoration-slate-600' : 'hover:text-slate-900'
            }`}
          >
            Papelera ({counts.trash})
          </button>
        </div>

        {statusFilter === 'trash' && counts.trash > 0 && (
          <button
            type="button"
            onClick={handleEmptyTrash}
            disabled={loading}
            className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            <span>Vaciar papelera</span>
          </button>
        )}
      </div>

      {/* =========================================================================
          3. BARRA DE ACCIONES EN LOTE Y SELECTORES DE FILTROS
          ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50/80 border border-slate-200/80 p-2.5 rounded-xl text-xs">
        {/* Acciones en Lote */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer"
          >
            <option value="">Acciones en lote</option>
            {statusFilter !== 'trash' ? (
              <>
                <option value="approve">Aprobar</option>
                <option value="pending">Desaprobar / Marcar como pendiente</option>
                <option value="spam">Marcar como spam</option>
                <option value="trash">Mover a la papelera</option>
              </>
            ) : (
              <>
                <option value="restore">Restaurar</option>
                <option value="delete_permanently">Borrar permanentemente</option>
              </>
            )}
          </select>
          <button
            type="button"
            onClick={handleExecuteBulkAction}
            disabled={bulkLoading || !bulkAction || selectedIds.size === 0}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-800 rounded-lg text-xs font-bold border border-slate-300 transition-colors cursor-pointer"
          >
            {bulkLoading ? 'Aplicando...' : 'Aplicar'}
          </button>
        </div>

        {/* Filtros: Tipo | Puntuación | Producto | Botón Filtrar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filtrar por tipo de valoración */}
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value as any); setCurrentPage(1); }}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none cursor-pointer"
            title="Filtrar por tipo de valoración"
          >
            <option value="all">Todos los tipos</option>
            <option value="review">Valoración</option>
            <option value="rating">Reseña</option>
          </select>

          {/* Filtrar por puntuación de la valoración */}
          <select
            value={ratingFilter}
            onChange={(e) => { setRatingFilter(e.target.value); setCurrentPage(1); }}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none cursor-pointer"
            title="Filtrar por puntuación de la valoración"
          >
            <option value="all">Todas las puntuaciones</option>
            <option value="5">★★★★★ 5 estrellas</option>
            <option value="4">★★★★☆ 4 estrellas</option>
            <option value="3">★★★☆☆ 3 estrellas</option>
            <option value="2">★★☆☆☆ 2 estrellas</option>
            <option value="1">★☆☆☆☆ 1 estrella</option>
          </select>

          {/* Filtrar por producto */}
          <select
            value={productFilter}
            onChange={(e) => { setProductFilter(e.target.value); setCurrentPage(1); }}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none max-w-[200px] truncate cursor-pointer"
            title="Filtrar por producto"
          >
            <option value="all">Filtrar por producto</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Buscador de valoraciones */}
          <div className="flex items-center gap-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar valoraciones..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearchQuery(searchInput);
                    setCurrentPage(1);
                  }
                }}
                className="bg-white border border-slate-300 rounded-lg pl-7 pr-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none w-36 sm:w-44"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5" />
            </div>
            <button
              type="button"
              onClick={() => { setSearchQuery(searchInput); setCurrentPage(1); }}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-bold border border-slate-300 transition-colors cursor-pointer"
            >
              Buscar
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. TABLA INTERACTIVA DE VALORACIONES
          ========================================================================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            {/* CABECERA DE LA TABLA */}
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold select-none">
                {/* Seleccionar todo */}
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    aria-label="Seleccionar todo"
                    checked={paginatedReviews.length > 0 && selectedIds.size === paginatedReviews.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                </th>

                {/* Tipo */}
                <th className="py-3 px-3 w-24">
                  <button
                    type="button"
                    onClick={() => handleSort('type')}
                    className="flex items-center gap-1 hover:text-slate-950 font-bold group cursor-pointer"
                    title={sortField === 'type' && sortOrder === 'asc' ? 'Orden descendente' : 'Orden ascendente'}
                  >
                    <span>Tipo</span>
                    {sortField === 'type' ? (
                      sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-sky-600" /> : <ChevronDown className="w-3.5 h-3.5 text-sky-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100" />
                    )}
                  </button>
                </th>

                {/* Autor */}
                <th className="py-3 px-3 w-48">
                  <button
                    type="button"
                    onClick={() => handleSort('author')}
                    className="flex items-center gap-1 hover:text-slate-950 font-bold group cursor-pointer"
                    title={sortField === 'author' && sortOrder === 'asc' ? 'Orden descendente' : 'Orden ascendente'}
                  >
                    <span>Autor</span>
                    {sortField === 'author' ? (
                      sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-sky-600" /> : <ChevronDown className="w-3.5 h-3.5 text-sky-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100" />
                    )}
                  </button>
                </th>

                {/* Puntuación */}
                <th className="py-3 px-3 w-32">
                  <button
                    type="button"
                    onClick={() => handleSort('rating')}
                    className="flex items-center gap-1 hover:text-slate-950 font-bold group cursor-pointer"
                    title={sortField === 'rating' && sortOrder === 'asc' ? 'Orden descendente' : 'Orden ascendente'}
                  >
                    <span>Puntuación</span>
                    {sortField === 'rating' ? (
                      sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-sky-600" /> : <ChevronDown className="w-3.5 h-3.5 text-sky-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100" />
                    )}
                  </button>
                </th>

                {/* Valoración */}
                <th className="py-3 px-3 min-w-[280px]">
                  <span>Valoración</span>
                </th>

                {/* Producto */}
                <th className="py-3 px-3 w-52">
                  <button
                    type="button"
                    onClick={() => handleSort('product')}
                    className="flex items-center gap-1 hover:text-slate-950 font-bold group cursor-pointer"
                    title={sortField === 'product' && sortOrder === 'asc' ? 'Orden descendente' : 'Orden ascendente'}
                  >
                    <span>Producto</span>
                    {sortField === 'product' ? (
                      sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-sky-600" /> : <ChevronDown className="w-3.5 h-3.5 text-sky-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100" />
                    )}
                  </button>
                </th>

                {/* Enviada el */}
                <th className="py-3 px-3 w-40">
                  <button
                    type="button"
                    onClick={() => handleSort('date')}
                    className="flex items-center gap-1 hover:text-slate-950 font-bold group cursor-pointer"
                    title={sortField === 'date' && sortOrder === 'asc' ? 'Orden descendente' : 'Orden ascendente'}
                  >
                    <span>Enviada el</span>
                    {sortField === 'date' ? (
                      sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-sky-600" /> : <ChevronDown className="w-3.5 h-3.5 text-sky-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100" />
                    )}
                  </button>
                </th>
              </tr>
            </thead>

            {/* CUERPO DE LA TABLA */}
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-sky-600 mb-2" />
                    <p className="font-semibold text-xs">Cargando valoraciones...</p>
                  </td>
                </tr>
              ) : paginatedReviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="max-w-sm mx-auto space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                        <Star className="w-5 h-5" />
                      </div>
                      <p className="font-bold text-slate-800 text-sm">No se encontraron valoraciones.</p>
                      <p className="text-xs text-slate-400">
                        No hay comentarios o valoraciones que coincidan con los filtros seleccionados.
                      </p>
                      {reviews.length === 0 && (
                        <button
                          type="button"
                          onClick={() => setIsAddModalOpen(true)}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Añadir primera valoración</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedReviews.map((r) => {
                  const prod = productMap.get(r.product_id);
                  const prodName = r.product_name || prod?.name || 'Producto del catálogo';
                  const prodImg = r.product_image || prod?.images?.[0];
                  const isSelected = selectedIds.has(r.id);

                  return (
                    <tr
                      key={r.id}
                      className={`group transition-colors ${
                        isSelected ? 'bg-sky-50/50' : r.status === 'pending' ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center align-top">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(r.id)}
                          className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer mt-0.5"
                        />
                      </td>

                      {/* Tipo */}
                      <td className="py-3 px-3 align-top">
                        <span className="inline-block text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {r.type === 'rating' ? 'Reseña' : 'Valoración'}
                        </span>
                        {r.status === 'pending' && (
                          <span className="block mt-1 text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded w-fit">
                            Pendiente
                          </span>
                        )}
                        {r.status === 'spam' && (
                          <span className="block mt-1 text-[9px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded w-fit">
                            Spam
                          </span>
                        )}
                      </td>

                      {/* Autor */}
                      <td className="py-3 px-3 align-top">
                        <div className="flex items-start gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                            {r.author_name ? r.author_name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="space-y-0.5 leading-snug">
                            <span className="font-bold text-slate-900 block">{r.author_name}</span>
                            {r.author_email && (
                              <a
                                href={`mailto:${r.author_email}`}
                                className="text-[11px] text-sky-600 hover:underline flex items-center gap-1"
                              >
                                <Mail className="w-2.5 h-2.5" />
                                <span>{r.author_email}</span>
                              </a>
                            )}
                            {r.author_ip && (
                              <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                                <Globe className="w-2.5 h-2.5" />
                                <span>{r.author_ip}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Puntuación */}
                      <td className="py-3 px-3 align-top">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= (r.rating || 5)
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-200 fill-slate-100'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                          {r.rating || 5} de 5
                        </span>
                      </td>

                      {/* Valoración + Acciones Rápidas */}
                      <td className="py-3 px-3 align-top space-y-1.5">
                        <p className="text-slate-800 leading-relaxed font-normal whitespace-pre-line">
                          {r.content}
                        </p>

                        {/* Respuesta del Administrador si existe */}
                        {r.reply && (
                          <div className="bg-slate-50 border-l-2 border-slate-400 pl-2.5 py-1.5 my-1 text-[11px] rounded-r-lg space-y-0.5">
                            <div className="flex items-center gap-1 font-bold text-slate-700">
                              <CornerDownRight className="w-3 h-3 text-slate-500" />
                              <span>Respuesta de {r.reply.author_name || tenant.name}:</span>
                            </div>
                            <p className="text-slate-600 italic">&ldquo;{r.reply.content}&rdquo;</p>
                          </div>
                        )}

                        {/* ACCIONES RÁPIDAS AL HOVER / EN FILA */}
                        <div className="flex items-center gap-2 pt-1 text-[11px] font-medium text-slate-500 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity flex-wrap">
                          {r.status !== 'trash' ? (
                            <>
                              {r.status === 'pending' ? (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(r, 'approved')}
                                  className="text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer"
                                >
                                  Aprobar
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(r, 'pending')}
                                  className="text-amber-700 hover:text-amber-900 font-bold cursor-pointer"
                                >
                                  Desaprobar
                                </button>
                              )}

                              <span className="text-slate-300">|</span>

                              <button
                                type="button"
                                onClick={() => {
                                  setReplyingReview(r);
                                  setReplyText(r.reply?.content || '');
                                }}
                                className="text-sky-700 hover:text-sky-900 font-bold cursor-pointer flex items-center gap-0.5"
                              >
                                <span>Responder</span>
                              </button>

                              <span className="text-slate-300">|</span>

                              <button
                                type="button"
                                onClick={() => {
                                  setEditingReview(r);
                                  setEditRating(r.rating || 5);
                                  setEditContent(r.content || '');
                                }}
                                className="text-slate-700 hover:text-slate-950 font-medium cursor-pointer"
                              >
                                Edición rápida
                              </button>

                              <span className="text-slate-300">|</span>

                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(r, 'spam')}
                                className="text-rose-600 hover:text-rose-800 cursor-pointer"
                              >
                                Spam
                              </button>

                              <span className="text-slate-300">|</span>

                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(r, 'trash')}
                                className="text-rose-600 hover:text-rose-800 cursor-pointer"
                              >
                                Papelera
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(r, 'approved')}
                                className="text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer"
                              >
                                Restaurar
                              </button>

                              <span className="text-slate-300">|</span>

                              <button
                                type="button"
                                onClick={() => handleDeletePermanent(r.id)}
                                className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                              >
                                Borrar permanentemente
                              </button>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Producto */}
                      <td className="py-3 px-3 align-top">
                        <div className="flex items-center gap-2">
                          {prodImg ? (
                            <img
                              src={prodImg}
                              alt={prodName}
                              className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                              <Package className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate" title={prodName}>
                              {prodName}
                            </span>
                            {prod?.slug && (
                              <a
                                href={`/store/${tenant.slug}/producto/${prod.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-sky-600 hover:underline flex items-center gap-0.5 mt-0.5"
                              >
                                <span>Ver en tienda</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Enviada el */}
                      <td className="py-3 px-3 align-top text-slate-500 text-[11px] whitespace-nowrap">
                        {formatDate(r.created_at)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* PIE DE TABLA (REPETICIÓN DE CABECERA) */}
            {paginatedReviews.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 border-t border-slate-200 text-slate-700 font-bold select-none">
                  {/* Seleccionar todo */}
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      aria-label="Seleccionar todo"
                      checked={selectedIds.size === paginatedReviews.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3">
                    <button type="button" onClick={() => handleSort('type')} className="hover:text-slate-950 font-bold">
                      Tipo
                    </button>
                  </th>
                  <th className="py-3 px-3">
                    <button type="button" onClick={() => handleSort('author')} className="hover:text-slate-950 font-bold">
                      Autor
                    </button>
                  </th>
                  <th className="py-3 px-3">
                    <button type="button" onClick={() => handleSort('rating')} className="hover:text-slate-950 font-bold">
                      Puntuación
                    </button>
                  </th>
                  <th className="py-3 px-3">
                    <span>Valoración</span>
                  </th>
                  <th className="py-3 px-3">
                    <button type="button" onClick={() => handleSort('product')} className="hover:text-slate-950 font-bold">
                      Producto
                    </button>
                  </th>
                  <th className="py-3 px-3">
                    <button type="button" onClick={() => handleSort('date')} className="hover:text-slate-950 font-bold">
                      Enviada el
                    </button>
                  </th>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Paginación Inferior */}
        {filteredAndSortedReviews.length > itemsPerPage && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs">
            <span className="text-slate-500">
              Mostrando {paginatedReviews.length} de {filteredAndSortedReviews.length} valoraciones
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-slate-700 disabled:opacity-40 font-semibold cursor-pointer"
              >
                Anterior
              </button>
              <span className="px-2 font-mono text-slate-700 font-bold">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-slate-700 disabled:opacity-40 font-semibold cursor-pointer"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          5. MODAL: AÑADIR VALORACIÓN MANUAL
          ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Añadir nueva valoración
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualReview} className="space-y-3.5 text-xs">
              {/* Producto */}
              <div>
                <label className="block text-slate-800 font-bold mb-1">Producto</label>
                <select
                  value={newProductId}
                  onChange={(e) => setNewProductId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:bg-white focus:outline-none"
                  required
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo y Puntuación */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Tipo</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:bg-white focus:outline-none"
                  >
                    <option value="review">Valoración</option>
                    <option value="rating">Reseña</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">Puntuación</label>
                  <div className="flex items-center gap-1 py-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setNewRating(s)}
                        className="cursor-pointer"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            s <= newRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-100'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-[11px] text-slate-600 font-bold ml-1.5">{newRating} de 5</span>
                  </div>
                </div>
              </div>

              {/* Autor y Correo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Nombre del autor *</label>
                  <input
                    type="text"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">Correo electrónico</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="juan@ejemplo.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Contenido / Comentario */}
              <div>
                <label className="block text-slate-800 font-bold mb-1">Contenido de la valoración *</label>
                <textarea
                  rows={3}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Escribe la opinión o testimonio del cliente..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:bg-white focus:outline-none resize-none"
                  required
                />
              </div>

              {/* Estado */}
              <div>
                <label className="block text-slate-800 font-bold mb-1">Estado</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:bg-white focus:outline-none"
                >
                  <option value="approved">Aprobada</option>
                  <option value="pending">Pendiente de moderación</option>
                </select>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingNewReview}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {savingNewReview ? <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> : <Plus className="w-4 h-4" />}
                  <span>{savingNewReview ? 'Guardando...' : 'Crear valoración'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. MODAL: RESPONDER VALORACIÓN
          ========================================================================= */}
      {replyingReview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-sky-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Responder a la valoración
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReplyingReview(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Resumen de la reseña original */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span>{replyingReview.author_name}</span>
                <span className="text-amber-500">{'★'.repeat(replyingReview.rating || 5)}</span>
              </div>
              <p className="text-slate-600 italic">&ldquo;{replyingReview.content}&rdquo;</p>
            </div>

            <form onSubmit={handleSaveReply} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-800 font-bold mb-1">
                  Tu respuesta oficial ({tenant.name || 'Tienda'})
                </label>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Escribe una respuesta cordial de parte de la tienda..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:bg-white focus:outline-none resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReplyingReview(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingReply || !replyText.trim()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {savingReply ? <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> : <MessageSquare className="w-4 h-4" />}
                  <span>{savingReply ? 'Enviando...' : 'Publicar respuesta'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          7. MODAL: EDICIÓN RÁPIDA
          ========================================================================= */}
      {editingReview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Edición rápida de valoración
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingReview(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-800 font-bold mb-1">Autor</label>
                <input
                  type="text"
                  value={editingReview.author_name}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-500 font-medium cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Puntuación</label>
                <div className="flex items-center gap-1 py-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setEditRating(s)}
                      className="cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          s <= editRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-100'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-[11px] text-slate-600 font-bold ml-1.5">{editRating} de 5</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Texto de la valoración</label>
                <textarea
                  rows={4}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:bg-white focus:outline-none resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit || !editContent.trim()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {savingEdit ? <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> : <Check className="w-4 h-4" />}
                  <span>{savingEdit ? 'Actualizando...' : 'Actualizar valoración'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
