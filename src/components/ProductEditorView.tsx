'use client';

import React, { useState, useMemo } from 'react';
import {
  Upload,
  Clipboard,
  Image as ImageIcon,
  Plus,
  ExternalLink,
  Check,
  X,
  Loader2,
  Sparkles,
  SlidersHorizontal,
  Boxes,
  Award,
  DollarSign,
  AlertCircle,
  Eye,
  ArrowLeft,
  FileText,
  Trash2,
  Star,
  ChevronLeft,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { Tenant, Category, Product, Brand, ProductTag, ProductAttribute } from '@/lib/types';
import { compressImage } from '@/lib/image-compressor';
import { translateErrorMessage } from '@/lib/error-translator';

interface ProductEditorViewProps {
  tenant: Tenant;
  product?: Product | null;
  categories: Category[];
  onBack: () => void;
  onProductSaved: (savedProduct: Product) => void;
  onCategoryCreated?: (newCategory: Category) => void;
}

export default function ProductEditorView({
  tenant,
  product,
  categories,
  onBack,
  onProductSaved,
  onCategoryCreated,
}: ProductEditorViewProps) {
  const isEditing = Boolean(product);
  const isPlastics = tenant.industry_type === 'plastics';

  // 1. CAMPOS PRINCIPALES
  const [name, setName] = useState(product?.name || '');
  const [slug, setSlug] = useState(product?.slug || '');
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [description, setDescription] = useState(product?.description || '');
  const [descTab, setDescTab] = useState<'visual' | 'code'>('visual');

  // Asistente de Redacción
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantPrompt, setAssistantPrompt] = useState('');
  const [assistantTone, setAssistantTone] = useState<'neutro' | 'comercial' | 'elegante'>('comercial');
  const [assistantLength, setAssistantLength] = useState<'corto' | 'detallado'>('detallado');

  // 2. DATOS DEL PRODUCTO (METABOX INFERIOR)
  const [productType, setProductType] = useState<'simple' | 'variable'>('simple');
  const [dataTab, setDataTab] = useState<'general' | 'inventory' | 'attributes' | 'advanced'>('general');

  // General
  const [price, setPrice] = useState<string>(product?.attributes?.price ? String(product.attributes.price) : '');
  const [salePrice, setSalePrice] = useState<string>(product?.attributes?.sale_price ? String(product.attributes.sale_price) : '');
  const [aspectRatio, setAspectRatio] = useState<'vertical' | 'square'>(
    product?.attributes?.aspect_ratio === 'square' ? 'square' : 'vertical'
  );

  // Inventario
  const [sku, setSku] = useState(product?.sku || '');
  const [inStock, setInStock] = useState(product?.attributes?.in_stock !== false);
  const [minOrderQty, setMinOrderQty] = useState(product?.min_order_qty || (isPlastics ? 100 : 12));
  const [unitsPerPackage, setUnitsPerPackage] = useState(product?.units_per_package || (isPlastics ? 50 : 6));

  // Atributos
  const specs = product?.attributes?.specs || {};
  const [attrColors, setAttrColors] = useState<string>(specs.color || specs.variante || '');
  const [attrSizes, setAttrSizes] = useState<string>(specs.tallas || specs.capacidad || '');
  const [attrMaterial, setAttrMaterial] = useState<string>(specs.costuras_patronaje || specs.material || '');

  // Avanzado
  const [orderNotes, setOrderNotes] = useState<string>(product?.attributes?.order_notes || '');

  // 3. PANELES LATERALES (METABOXES DERECHA)
  // Publicar
  const [status, setStatus] = useState<'published' | 'draft'>(
    product?.attributes?.status === 'draft' ? 'draft' : 'published'
  );
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');

  // Imagen Principal
  const [mainImageBase64, setMainImageBase64] = useState<string | null>(null);
  const [mainImageUrlInput, setMainImageUrlInput] = useState<string>(product?.images?.[0] || '');
  const [currentMainImageUrl, setCurrentMainImageUrl] = useState<string | null>(product?.images?.[0] || null);
  const [imageLoadError, setImageLoadError] = useState<boolean>(false);

  // Galería de Imágenes Adicionales
  const [galleryUrls, setGalleryUrls] = useState<string[]>(product?.images?.slice(1) || []);
  const [galleryUrlInput, setGalleryUrlInput] = useState<string>('');

  // Categorías
  const [selectedCatId, setSelectedCatId] = useState<string>(
    product?.category_id || (categories.length > 0 ? categories[0].id : '')
  );
  const [catTab, setCatTab] = useState<'all' | 'most_used'>('all');
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatParentId, setNewCatParentId] = useState<string>('');
  const [savingNewCat, setSavingNewCat] = useState(false);

  // Etiquetas
  const [tagsInput, setTagsInput] = useState<string>(
    product?.attributes?.tags ? product.attributes.tags.join(', ') : (product?.attributes?.badge || '')
  );

  // Marcas
  const [brand, setBrand] = useState<string>(product?.attributes?.brand || tenant.name || '');

  // UI State
  const [compressingImage, setCompressingImage] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingLoading, setDeletingLoading] = useState(false);

  const handleDeleteThisProduct = async () => {
    if (!product) return;
    if (!confirm(`¿Estás seguro de que deseas mover "${product.name}" a la papelera?`)) {
      return;
    }

    try {
      setDeletingLoading(true);
      const res = await fetch(`/api/admin/products?productId=${product.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar');

      // Notificar al padre y volver a la lista
      onProductSaved?.({ ...product, is_active: false } as any);
      onBack();
    } catch (err: unknown) {
      alert('Error al eliminar producto: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setDeletingLoading(false);
    }
  };
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Helper para generar slug en tiempo real
  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const normalizeImageUrl = (url: string): string => {
    if (!url) return '';
    let clean = url.trim();
    if (clean.includes('drive.google.com') || clean.includes('docs.google.com')) {
      const match = clean.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://lh3.googleusercontent.com/d/${match[1]}=w800`;
      }
    }
    if (clean.includes('lh3.googleusercontent.com/d/') && !clean.includes('=')) {
      clean = `${clean}=w800`;
    }
    if (clean.includes('images.unsplash.com') && !clean.includes('auto=format')) {
      clean = clean.includes('?') ? `${clean}&auto=format&q=80&w=800` : `${clean}?auto=format&q=80&w=800`;
    }
    if (clean.includes('dropbox.com')) {
      clean = clean.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace(/[?&]dl=0/, '');
    }
    return clean;
  };

  // Contador de palabras
  const wordCount = useMemo(() => {
    if (!description.trim()) return 0;
    return description.trim().split(/\s+/).length;
  }, [description]);



  // Generador asistido de descripción comercial
  const handleGenerateDescription = () => {
    const base = assistantPrompt.trim() || name.trim() || 'Prenda de alta calidad';
    let generated = '';

    if (assistantTone === 'comercial') {
      generated = `🔥 **${name.trim() || 'Artículo Destacado'}**\n\n` +
        `Diseñado especialmente para pedidos mayoristas de alto rendimiento. ${base}.\n\n` +
        `• **Calidad Premium:** Fabricación con materiales resistentes y terminaciones reforzadas.\n` +
        `• **Ajuste y Confort:** Patronaje ergonómico con excelente caída y durabilidad.\n` +
        `• **Presentación:** Empacado por ${unitsPerPackage} unidades, listo para distribución nacional.\n\n` +
        `*Solicita tu cotización por empaque cerrado o caja con despacho inmediato.*`;
    } else if (assistantTone === 'elegante') {
      generated = `Exclusivo diseño confeccionado con estándares superiores de calidad. ${base}.\n\n` +
        `Detalles de patronaje fusionado y costuras de alta densidad que garantizan una presentación impecable en vitrina.\n` +
        `Ideal para boutiques y distribuidores que exigen acabados de primera línea.`;
    } else {
      generated = `${name.trim() || 'Producto'}.\n\n${base}.\n` +
        `Pedido mínimo: ${minOrderQty} unidades.\nEmpaque: ${unitsPerPackage} unidades por paquete.\nDisponibilidad inmediata para despachos a nivel nacional.`;
    }

    setDescription(generated);
    setIsAssistantOpen(false);
  };

  // Subir o pegar imagen principal
  const handleMainImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setCompressingImage(true);
        const compressed = await compressImage(file, {
          maxWidth: 1200,
          maxHeight: 1600,
          quality: 0.85,
          outputFormat: 'image/webp',
        });
        setMainImageBase64(compressed);
        setCurrentMainImageUrl(null);
      } catch (err) {
        console.error('Error comprimiendo imagen:', err);
      } finally {
        setCompressingImage(false);
      }
    }
  };

  const handlePasteMainImage = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imgType = item.types.find((t) => t.startsWith('image/'));
          if (imgType) {
            const blob = await item.getType(imgType);
            const file = new File([blob], 'foto.png', { type: imgType });
            setCompressingImage(true);
            const compressed = await compressImage(file, {
              maxWidth: 1200,
              maxHeight: 1600,
              quality: 0.85,
              outputFormat: 'image/webp',
            });
            setMainImageBase64(compressed);
            setCurrentMainImageUrl(null);
            setCompressingImage(false);
            return;
          }
        }
      }
      alert('Presiona Ctrl + V para pegar la imagen directamente.');
    } catch {
      alert('Presiona Ctrl + V para pegar la imagen directamente.');
    }
  };

  // Añadir imagen a la galería secundaria (máximo 8 imágenes en total)
  const handleAddGalleryUrl = () => {
    if (!galleryUrlInput.trim()) return;
    if (galleryUrls.length >= 7) {
      alert('Límite de imágenes: Cada producto puede tener hasta 8 imágenes en total (1 principal y 7 de galería).');
      return;
    }
    const clean = normalizeImageUrl(galleryUrlInput);
    if (!galleryUrls.includes(clean)) {
      setGalleryUrls([...galleryUrls, clean]);
    }
    setGalleryUrlInput('');
  };

  // Convertir una foto de la galería en Imagen Principal (hace swap automático con la actual)
  const handleMakeMainImage = (indexToPromote: number) => {
    const selectedGalleryUrl = galleryUrls[indexToPromote];
    if (!selectedGalleryUrl) return;

    // Obtener la imagen principal actual si existe
    const currentPrimary = mainImageBase64 || (mainImageUrlInput.trim() ? normalizeImageUrl(mainImageUrlInput) : null) || currentMainImageUrl;

    // Remover la foto seleccionada de la galería
    const newGallery = galleryUrls.filter((_, i) => i !== indexToPromote);

    // Si había una foto principal previa y es distinta, moverla a la galería para no perderla
    if (currentPrimary && currentPrimary !== selectedGalleryUrl) {
      newGallery.unshift(currentPrimary);
    }

    setMainImageBase64(null);
    setMainImageUrlInput('');
    setCurrentMainImageUrl(selectedGalleryUrl);
    setGalleryUrls(newGallery.slice(0, 7));
  };

  // Reordenar fotos dentro de la galería
  const handleMoveGallery = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= galleryUrls.length) return;
    const updated = [...galleryUrls];
    const [item] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, item);
    setGalleryUrls(updated);
  };

  // Subir archivo directo a la galería vía Supabase Storage
  const handleGalleryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (galleryUrls.length >= 7) {
      alert('Límite de imágenes: Cada producto puede tener hasta 8 imágenes en total (1 principal y 7 de galería).');
      return;
    }

    try {
      setUploadingGallery(true);
      const fd = new FormData();
      fd.append('file', file);
      fd.append('tenant_id', tenant.id);
      fd.append('folder', 'products');

      const res = await fetch('/api/admin/media', {
        method: 'POST',
        body: fd,
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.url) {
        throw new Error(data.error || 'No se pudo subir la foto a la galería');
      }

      const uploadedUrl = normalizeImageUrl(data.url);
      if (!galleryUrls.includes(uploadedUrl)) {
        setGalleryUrls([...galleryUrls, uploadedUrl]);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al subir imagen a la galería');
    } finally {
      setUploadingGallery(false);
      e.target.value = '';
    }
  };

  // Crear categoría rápida desde el metabox lateral
  const handleCreateQuickCategory = async () => {
    if (!newCatName.trim() || savingNewCat) return;

    try {
      setSavingNewCat(true);
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenant.id,
          name: newCatName.trim(),
          parent_id: newCatParentId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear la categoría');

      const createdCat: Category = data.category;
      onCategoryCreated?.(createdCat);
      setSelectedCatId(createdCat.id);
      setNewCatName('');
      setNewCatParentId('');
      setIsAddingNewCat(false);
      setSuccessMsg(`Categoría "${createdCat.name}" creada y asignada`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      const msg = translateErrorMessage(err, 'No se pudo crear la categoría');
      alert(msg);
    } finally {
      setSavingNewCat(false);
    }
  };

  // Guardar Producto (POST o PATCH)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('El nombre del producto es obligatorio');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);

      const cleanSku = (sku.trim() || (isEditing ? product?.sku : `SKU-${Date.now().toString().slice(-4)}`)) as string;
      const cleanSlug = (slug.trim() || generateSlug(name)) as string;

      // Armar lista de imágenes: Principal + Galería
      const finalImages: string[] = [];
      const primaryActive = mainImageBase64 || normalizeImageUrl(mainImageUrlInput) || currentMainImageUrl;
      if (primaryActive) {
        finalImages.push(primaryActive);
      }
      galleryUrls.forEach((url) => {
        if (!finalImages.includes(url) && finalImages.length < 8) finalImages.push(url);
      });

      // Procesar tags
      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        name: name.trim(),
        sku: cleanSku,
        slug: cleanSlug,
        category_id: selectedCatId || null,
        description: description.trim() || null,
        min_order_qty: Number(minOrderQty) || 1,
        units_per_package: Number(unitsPerPackage) || 1,
        images: finalImages,
        imageData: mainImageBase64 || undefined,
        image_url: !mainImageBase64 && mainImageUrlInput.trim() ? normalizeImageUrl(mainImageUrlInput) : undefined,
        attributes: {
          ...(product?.attributes || {}),
          price: price.trim() || null,
          sale_price: salePrice.trim() || null,
          aspect_ratio: aspectRatio,
          in_stock: inStock,
          status,
          visibility,
          tags: parsedTags,
          brand: brand.trim() || tenant.name,
          order_notes: orderNotes.trim() || null,
          specs: {
            color: attrColors.trim() || undefined,
            tallas: attrSizes.trim() || undefined,
            material: attrMaterial.trim() || undefined,
          },
        },
      };

      if (isEditing && product) {
        // ACTUALIZAR (PATCH)
        const res = await fetch('/api/admin/products', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: product.id, ...payload }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al actualizar producto');

        onProductSaved(data.product);
      } else {
        // CREAR (POST)
        const res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenant_id: tenant.id, ...payload }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al crear producto');

        onProductSaved(data.product);
      }
    } catch (err: unknown) {
      const msg = translateErrorMessage(err, isEditing ? 'Error al actualizar el producto' : 'Error al guardar el producto');
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-50/50 min-h-screen text-slate-900 pb-16">
      {/* =========================================================================
          CABECERA SUPERIOR DEL EDITOR
          ========================================================================= */}
      <div className="bg-white border-b border-slate-200/90 sticky top-0 z-30 px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a Productos</span>
            </button>
            <div className="hidden sm:block">
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                {isEditing ? `Editar producto: ${product?.name}` : 'Añadir un nuevo producto'}
              </h1>
              <span className="text-[10px] text-slate-400 font-mono">
                {tenant.name} • {isEditing ? `ID: ${product?.id?.slice(0, 8)}` : 'Nuevo borrador'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/store/${tenant.slug}/producto/${slug || 'preview'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Previsualizar</span>
              <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
            </a>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || !name.trim()}
              className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs px-5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{isEditing ? 'Guardar Cambios' : 'Publicar'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alertas */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-4">
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-xs flex items-center justify-between gap-2 shadow-2xs">
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
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl text-xs flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-semibold">{successMsg}</span>
            </div>
            <button type="button" onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-800 p-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          CONTENIDO DEL EDITOR (2 COLUMNAS: 8 COLS PRINCIPAL + 4 COLS METABOXES)
          ========================================================================= */}
      <form onSubmit={handleSubmit} className="max-w-7xl mx-auto px-4 sm:px-8 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* =====================================================================
              COLUMNA IZQUIERDA: CONTENIDO PRINCIPAL Y DATOS DEL PRODUCTO (8 COLS)
              ===================================================================== */}
          <div className="lg:col-span-8 space-y-5">
            {/* 1. TÍTULO / NOMBRE DEL PRODUCTO */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-2">
              <label className="block text-slate-800 font-extrabold text-xs">
                Nombre del producto *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  const val = e.target.value;
                  setName(val);
                  if (!isEditing && !isEditingSlug) {
                    setSlug(generateSlug(val));
                  }
                }}
                placeholder="Escribe el nombre del producto (ej. Vestido Floreado Elegante)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm sm:text-base font-bold text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none transition-all shadow-2xs"
              />

              {/* Enlace permanente / Slug */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono pt-1">
                <span className="text-slate-400">Enlace permanente:</span>
                <span className="text-slate-400 truncate">https://tenddy.shop/store/{tenant.slug}/producto/</span>
                {isEditingSlug ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(generateSlug(e.target.value))}
                      className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[11px] font-mono text-slate-900 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setIsEditingSlug(false)}
                      className="px-2 py-0.5 bg-slate-900 text-white rounded text-[10px] font-bold"
                    >
                      Aceptar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <strong className="text-slate-800">{slug || 'nombre-del-producto'}</strong>
                    <button
                      type="button"
                      onClick={() => setIsEditingSlug(true)}
                      className="text-sky-600 hover:text-sky-800 font-sans font-bold underline cursor-pointer ml-1 text-[10px]"
                    >
                      Editar
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 2. DESCRIPCIÓN DEL PRODUCTO CON ASISTENTE Y EDITOR */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">
                    Descripción del producto
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAssistantOpen(!isAssistantOpen)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>Asistente de redacción</span>
                  </button>

                  <div className="flex border border-slate-200 rounded-lg overflow-hidden text-[11px]">
                    <button
                      type="button"
                      onClick={() => setDescTab('visual')}
                      className={`px-2.5 py-1 font-semibold ${descTab === 'visual' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                    >
                      Visual
                    </button>
                    <button
                      type="button"
                      onClick={() => setDescTab('code')}
                      className={`px-2.5 py-1 font-semibold ${descTab === 'code' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                    >
                      Código
                    </button>
                  </div>
                </div>
              </div>

              {/* Panel Desplegable del Asistente de Redacción */}
              {isAssistantOpen && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-2.5 animate-in fade-in duration-150 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Generar descripción con un clic</span>
                    </span>
                    <button type="button" onClick={() => setIsAssistantOpen(false)} className="text-amber-800 hover:text-amber-950">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1 text-[11px]">Describe brevemente tu producto:</label>
                    <input
                      type="text"
                      value={assistantPrompt}
                      onChange={(e) => setAssistantPrompt(e.target.value)}
                      placeholder="Ej. Vestido casual corte A con tela viscosa fresca estampado floral..."
                      className="w-full bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <label className="block text-slate-600 font-medium mb-0.5">Tono de voz:</label>
                      <select
                        value={assistantTone}
                        onChange={(e) => setAssistantTone(e.target.value as any)}
                        className="w-full bg-white border border-amber-200 rounded-lg px-2 py-1 text-slate-800"
                      >
                        <option value="comercial">Comercial / Mayorista</option>
                        <option value="elegante">Elegante / Boutique</option>
                        <option value="neutro">Neutro / Técnico</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-medium mb-0.5">Longitud:</label>
                      <select
                        value={assistantLength}
                        onChange={(e) => setAssistantLength(e.target.value as any)}
                        className="w-full bg-white border border-amber-200 rounded-lg px-2 py-1 text-slate-800"
                      >
                        <option value="detallado">Detallado con viñetas</option>
                        <option value="corto">Corto y directo</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-2xs"
                  >
                    Insertar en la descripción
                  </button>
                </div>
              )}

              {/* Textarea del Editor */}
              <div className="space-y-1">
                <textarea
                  rows={8}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Escribe la descripción completa del producto, detalles de confección, corte, ocasiones de uso y especificaciones mayoristas..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none resize-y leading-relaxed font-sans shadow-2xs"
                />

                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>Párrafo • Texto enriquecido</span>
                  <span className="font-mono">Número de palabras: {wordCount}</span>
                </div>
              </div>
            </div>

            {/* 3. METABOX: DATOS DEL PRODUCTO (PESTAÑAS) */}
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
              {/* Cabecera del Metabox */}
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-slate-600" />
                  <span className="font-extrabold text-xs text-slate-900">Datos del producto</span>
                  <span className="text-slate-300">—</span>
                  <select
                    value={productType}
                    onChange={(e) => setProductType(e.target.value as any)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 cursor-pointer shadow-2xs"
                  >
                    <option value="simple">Producto simple</option>
                    <option value="variable">Producto con variantes (Tallas/Colores)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={inStock}
                      onChange={(e) => setInStock(e.target.checked)}
                      className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                    />
                    <span>Disponible para venta</span>
                  </label>
                </div>
              </div>

              {/* Pestañas Horizontales */}
              <div className="border-b border-slate-200 bg-white flex overflow-x-auto text-xs font-semibold text-slate-600 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setDataTab('general')}
                  className={`px-4 py-2.5 border-b-2 transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    dataTab === 'general'
                      ? 'border-slate-900 text-slate-900 font-extrabold bg-slate-50/70'
                      : 'border-transparent hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>General</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDataTab('inventory')}
                  className={`px-4 py-2.5 border-b-2 transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    dataTab === 'inventory'
                      ? 'border-slate-900 text-slate-900 font-extrabold bg-slate-50/70'
                      : 'border-transparent hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Boxes className="w-3.5 h-3.5 text-sky-600" />
                  <span>Inventario</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDataTab('attributes')}
                  className={`px-4 py-2.5 border-b-2 transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    dataTab === 'attributes'
                      ? 'border-slate-900 text-slate-900 font-extrabold bg-slate-50/70'
                      : 'border-transparent hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Atributos & Variantes</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDataTab('advanced')}
                  className={`px-4 py-2.5 border-b-2 transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    dataTab === 'advanced'
                      ? 'border-slate-900 text-slate-900 font-extrabold bg-slate-50/70'
                      : 'border-transparent hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  <span>Avanzado</span>
                </button>
              </div>

              {/* Contenido de la pestaña activa */}
              <div className="p-5 text-xs">
                {/* PESTAÑA: GENERAL */}
                {dataTab === 'general' && (
                  <div className="space-y-4 max-w-xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-800 font-bold mb-1">Precio normal ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="Ej. 18.50"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none font-mono"
                        />
                        <p className="text-[11px] text-slate-400 mt-1">Precio de referencia por prenda o bulto.</p>
                      </div>

                      <div>
                        <label className="block text-slate-800 font-bold mb-1">Precio rebajado ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={salePrice}
                          onChange={(e) => setSalePrice(e.target.value)}
                          placeholder="Ej. 14.90"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none font-mono"
                        />
                        <p className="text-[11px] text-slate-400 mt-1">Opcional: precio promocional para clientes.</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <label className="block text-slate-800 font-bold mb-1.5">Formato de Visualización en Tienda</label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setAspectRatio('vertical')}
                          className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-2 ${
                            aspectRatio === 'vertical'
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span>📏 Vertical (3:4)</span>
                          <span className="text-[10px] opacity-75">Ropa y Confección</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setAspectRatio('square')}
                          className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-2 ${
                            aspectRatio === 'square'
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span>⏹️ Cuadrado (1:1)</span>
                          <span className="text-[10px] opacity-75">Envases y Accesorios</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* PESTAÑA: INVENTARIO */}
                {dataTab === 'inventory' && (
                  <div className="space-y-4 max-w-xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-800 font-bold mb-1">SKU (Código único)</label>
                        <input
                          type="text"
                          value={sku}
                          onChange={(e) => setSku(e.target.value.toUpperCase())}
                          placeholder="Ej. VES-001"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none font-mono font-bold"
                        />
                        <p className="text-[11px] text-slate-400 mt-1">Código de identificación para bodega y pedidos.</p>
                      </div>

                      <div>
                        <label className="block text-slate-800 font-bold mb-1">Estado del inventario</label>
                        <select
                          value={inStock ? 'in_stock' : 'out_of_stock'}
                          onChange={(e) => setInStock(e.target.value === 'in_stock')}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold cursor-pointer"
                        >
                          <option value="in_stock">🟢 Hay existencias</option>
                          <option value="out_of_stock">🔴 Agotado</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                      <div>
                        <label className="block text-slate-800 font-bold mb-1">Pedido Mínimo ({isPlastics ? 'uds' : 'prendas'})</label>
                        <input
                          type="number"
                          min="1"
                          value={minOrderQty}
                          onChange={(e) => setMinOrderQty(Number(e.target.value) || 1)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                        />
                        <p className="text-[11px] text-slate-400 mt-1">Cantidad mínima que un cliente puede cotizar.</p>
                      </div>

                      <div>
                        <label className="block text-slate-800 font-bold mb-1">Empaque (unidades por paquete / caja)</label>
                        <input
                          type="number"
                          min="1"
                          value={unitsPerPackage}
                          onChange={(e) => setUnitsPerPackage(Number(e.target.value) || 1)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                        />
                        <p className="text-[11px] text-slate-400 mt-1">Unidades por paquete, caja o empaque cerrado.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* PESTAÑA: ATRIBUTOS */}
                {dataTab === 'attributes' && (
                  <div className="space-y-4 max-w-xl">
                    {/* Colores */}
                    <div>
                      <label className="block text-slate-800 font-bold mb-1">Colores disponibles</label>
                      <input
                        type="text"
                        value={attrColors}
                        onChange={(e) => setAttrColors(e.target.value)}
                        placeholder="Ej. Negro, Blanco, Azul Marino, Palo de Rosa"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">Separa con comas los colores para que aparezcan en el cotizador.</p>

                      {/* Términos rápidos de Color registrados */}
                      {(() => {
                        const colorAttr = ((tenant.settings?.attributes || []) as ProductAttribute[]).find(
                          (a) => a.slug.includes('color') || a.name.toLowerCase().includes('color')
                        );
                        if (!colorAttr || !colorAttr.terms || colorAttr.terms.length === 0) return null;
                        const currentList = attrColors.split(',').map((s) => s.trim().toLowerCase());

                        return (
                          <div className="pt-1.5 flex flex-wrap gap-1">
                            {colorAttr.terms.map((term, idx) => {
                              const isAdded = currentList.includes(term.toLowerCase());
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    if (!isAdded) {
                                      const next = attrColors.trim() ? `${attrColors.trim()}, ${term}` : term;
                                      setAttrColors(next);
                                    }
                                  }}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-colors cursor-pointer ${
                                    isAdded
                                      ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                                      : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                                  }`}
                                >
                                  + {term}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Tallas */}
                    <div>
                      <label className="block text-slate-800 font-bold mb-1">Tallas o Tamaños</label>
                      <input
                        type="text"
                        value={attrSizes}
                        onChange={(e) => setAttrSizes(e.target.value)}
                        placeholder="Ej. S, M, L, XL ó 28, 30, 32, 34, 36"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">Tallas disponibles para que el cliente elija en WhatsApp.</p>

                      {/* Términos rápidos de Talla registrados */}
                      {(() => {
                        const sizeAttr = ((tenant.settings?.attributes || []) as ProductAttribute[]).find(
                          (a) => a.slug.includes('talla') || a.name.toLowerCase().includes('talla')
                        );
                        if (!sizeAttr || !sizeAttr.terms || sizeAttr.terms.length === 0) return null;
                        const currentList = attrSizes.split(',').map((s) => s.trim().toLowerCase());

                        return (
                          <div className="pt-1.5 flex flex-wrap gap-1">
                            {sizeAttr.terms.map((term, idx) => {
                              const isAdded = currentList.includes(term.toLowerCase());
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    if (!isAdded) {
                                      const next = attrSizes.trim() ? `${attrSizes.trim()}, ${term}` : term;
                                      setAttrSizes(next);
                                    }
                                  }}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-colors cursor-pointer ${
                                    isAdded
                                      ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                                      : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                                  }`}
                                >
                                  + {term}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Composición */}
                    <div>
                      <label className="block text-slate-800 font-bold mb-1">Composición / Material / Costuras</label>
                      <input
                        type="text"
                        value={attrMaterial}
                        onChange={(e) => setAttrMaterial(e.target.value)}
                        placeholder="Ej. Algodón peinado 24/1, costura doble refuerzo, cuello tejido"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* PESTAÑA: AVANZADO */}
                {dataTab === 'advanced' && (
                  <div className="space-y-4 max-w-xl">
                    <div>
                      <label className="block text-slate-800 font-bold mb-1">Notas de compra o cotización</label>
                      <textarea
                        rows={3}
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        placeholder="Ej. Tiempo de despacho: 24 a 48 horas tras confirmación de depósito."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none resize-none"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">Nota interna o información para el mensaje de WhatsApp.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* =====================================================================
              COLUMNA DERECHA: PANELES LATERALES / METABOXES (4 COLS)
              ===================================================================== */}
          <div className="lg:col-span-4 space-y-5">
            {/* 1. METABOX: PUBLICAR */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
              <div className="border-b border-slate-100 pb-2.5">
                <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                  Publicar
                </h4>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Estado:</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-800 cursor-pointer"
                  >
                    <option value="published">Publicado</option>
                    <option value="draft">Borrador</option>
                  </select>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Visibilidad:</span>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-800 cursor-pointer text-[11px]"
                  >
                    <option value="public">Pública en catálogo</option>
                    <option value="private">Privada</option>
                  </select>
                </div>

                <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1">
                  <span>Fecha:</span>
                  <span>{isEditing ? 'Publicada anteriormente' : 'Inmediatamente'}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {isEditing ? (
                  <button
                    type="button"
                    onClick={handleDeleteThisProduct}
                    disabled={deletingLoading}
                    className="text-rose-600 hover:text-rose-800 text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {deletingLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    <span>Mover a la papelera</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onBack}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}

                <button
                  type="submit"
                  disabled={saving || !name.trim()}
                  className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{isEditing ? 'Actualizar' : 'Publicar'}</span>
                </button>
              </div>
            </div>

            {/* 2. METABOX: IMAGEN DEL PRODUCTO (PORTADA) */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
              <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                    Imagen del producto
                  </h4>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
                    Portada
                  </span>
                </div>
                {(mainImageBase64 || mainImageUrlInput || currentMainImageUrl) && (
                  <button
                    type="button"
                    onClick={() => {
                      setMainImageBase64(null);
                      setMainImageUrlInput('');
                      setCurrentMainImageUrl(null);
                    }}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-bold cursor-pointer transition-colors"
                  >
                    Eliminar imagen
                  </button>
                )}
              </div>

              {/* Vista Previa de la Imagen */}
              <div className="w-full aspect-[3/4] max-h-56 rounded-xl overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center p-1 relative shadow-2xs group">
                {mainImageBase64 || normalizeImageUrl(mainImageUrlInput) || currentMainImageUrl ? (
                  <>
                    <img
                      src={mainImageBase64 || normalizeImageUrl(mainImageUrlInput) || (currentMainImageUrl as string)}
                      alt="Imagen del producto"
                      className="w-full h-full object-contain rounded-lg"
                      onError={() => setImageLoadError(true)}
                      onLoad={() => setImageLoadError(false)}
                    />
                    {imageLoadError && (
                      <div className="absolute inset-0 bg-slate-900/95 p-3 text-center flex flex-col items-center justify-center text-white text-xs space-y-1.5 z-10">
                        <AlertTriangle className="w-6 h-6 text-amber-400" />
                        <span className="font-bold text-amber-300">Enlace externo bloqueado</span>
                        <p className="text-[10px] text-slate-300 leading-tight max-w-[200px]">
                          Esta URL (Google Drive) requiere inicio de sesión y no permite mostrarse públicamente.
                        </p>
                        <span className="text-[10px] text-sky-400 underline font-semibold">
                          Sube el archivo directamente con el botón de abajo.
                        </span>
                      </div>
                    )}
                    {!imageLoadError && (
                      <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        <span>Foto destacada ({1 + galleryUrls.length}/8 total)</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center p-4 text-slate-400 space-y-1">
                    <ImageIcon className="w-8 h-8 mx-auto text-slate-300" />
                    <span className="text-[11px] block">Sin imagen asignada</span>
                  </div>
                )}
              </div>

              {/* Botones de Carga */}
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-slate-800 cursor-pointer text-xs font-semibold shadow-2xs transition-colors">
                  {compressingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 text-slate-600" />}
                  <span>{compressingImage ? 'Optimizando...' : 'Subir Imagen'}</span>
                  <input type="file" accept="image/*" onChange={handleMainImageChange} className="hidden" />
                </label>

                <button
                  type="button"
                  onClick={handlePasteMainImage}
                  className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  title="Pegar imagen del portapapeles con Ctrl+V"
                >
                  <Clipboard className="w-3.5 h-3.5 text-sky-600" />
                  <span>Pegar</span>
                </button>
              </div>

              <input
                type="url"
                value={mainImageUrlInput}
                onChange={(e) => setMainImageUrlInput(e.target.value)}
                placeholder="O pegar URL web de la foto..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            {/* 3. METABOX: GALERÍA DE IMÁGENES DEL PRODUCTO */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
              <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                      Galería del producto
                    </h4>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                      {galleryUrls.length}/7 fotos
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Fotos secundarias (ángulos, espalda, costuras).</p>
                </div>
              </div>

              {/* Grilla de Miniaturas con cambio a Portada y Reordenamiento */}
              {galleryUrls.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {galleryUrls.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-0.5 group shadow-2xs transition-all hover:border-sky-300">
                      <img src={url} alt={`Galería ${idx + 1}`} className="w-full h-full object-cover rounded-lg" />
                      
                      {/* Badge de número */}
                      <span className="absolute top-1 left-1 bg-black/65 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                        #{idx + 2}
                      </span>

                      {/* Botón Eliminar */}
                      <button
                        type="button"
                        onClick={() => setGalleryUrls(galleryUrls.filter((_, i) => i !== idx))}
                        title="Eliminar de la galería"
                        className="absolute top-1 right-1 w-5 h-5 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-xs cursor-pointer"
                      >
                        ✕
                      </button>

                      {/* Flechas de reordenamiento */}
                      <div className="absolute top-1 inset-x-8 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleMoveGallery(idx, 'left')}
                            title="Mover a la izquierda"
                            className="w-4 h-4 bg-slate-900/80 hover:bg-slate-900 text-white rounded flex items-center justify-center cursor-pointer shadow-xs"
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                        )}
                        {idx < galleryUrls.length - 1 && (
                          <button
                            type="button"
                            onClick={() => handleMoveGallery(idx, 'right')}
                            title="Mover a la derecha"
                            className="w-4 h-4 bg-slate-900/80 hover:bg-slate-900 text-white rounded flex items-center justify-center cursor-pointer shadow-xs"
                          >
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Botón Hacer Portada (Swap con la Principal) */}
                      <button
                        type="button"
                        onClick={() => handleMakeMainImage(idx)}
                        title="Hacer foto de portada (intercambia con la foto principal)"
                        className="absolute bottom-1 inset-x-1 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 shadow-xs cursor-pointer transition-colors"
                      >
                        <Star className="w-3 h-3 fill-white" />
                        <span>Hacer portada</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                  Sin fotos secundarias aún.
                </div>
              )}

              {/* Añadir a la Galería (Archivo o URL) */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex gap-1.5">
                  <input
                    type="url"
                    value={galleryUrlInput}
                    onChange={(e) => setGalleryUrlInput(e.target.value)}
                    placeholder="URL de foto adicional..."
                    disabled={galleryUrls.length >= 7}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={handleAddGalleryUrl}
                    disabled={!galleryUrlInput.trim() || galleryUrls.length >= 7}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    Añadir
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 cursor-pointer text-xs font-semibold shadow-2xs transition-colors">
                    {uploadingGallery ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{uploadingGallery ? 'Subiendo...' : 'Subir archivo a galería'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleGalleryFileUpload}
                      className="hidden"
                      disabled={uploadingGallery || galleryUrls.length >= 7}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* 4. METABOX: CATEGORÍAS DEL PRODUCTO */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
              <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                  Categorías del producto
                </h4>
                <div className="flex border border-slate-200 rounded-lg text-[10px]">
                  <button
                    type="button"
                    onClick={() => setCatTab('all')}
                    className={`px-2 py-0.5 font-semibold ${catTab === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
                  >
                    Todas
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatTab('most_used')}
                    className={`px-2 py-0.5 font-semibold ${catTab === 'most_used' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
                  >
                    Más usadas
                  </button>
                </div>
              </div>

              {/* Lista con checkboxes jerárquicos */}
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1 border border-slate-100 rounded-xl p-2.5 bg-slate-50/50">
                {categories.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No hay categorías creadas.</p>
                ) : (
                  categories.map((cat) => {
                    const depth = cat.parent_id ? (categories.some((p) => p.id === cat.parent_id && p.parent_id) ? 3 : 2) : 1;
                    const isChecked = selectedCatId === cat.id;

                    return (
                      <label
                        key={cat.id}
                        className={`flex items-center gap-2 px-1.5 py-1 rounded-lg text-xs cursor-pointer hover:bg-white transition-colors ${
                          depth === 2 ? 'pl-5' : depth === 3 ? 'pl-8' : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name="productCategorySelect"
                          checked={isChecked}
                          onChange={() => setSelectedCatId(cat.id)}
                          className="rounded-full border-slate-300 text-sky-600 focus:ring-0 cursor-pointer"
                        />
                        <span className={`truncate ${isChecked ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                          {depth === 2 ? '— ' : depth === 3 ? '—— ' : ''}
                          {cat.name}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>

              {/* Añadir nueva categoría rápida inline */}
              <div className="pt-2 border-t border-slate-100">
                {!isAddingNewCat ? (
                  <button
                    type="button"
                    onClick={() => setIsAddingNewCat(true)}
                    className="text-xs text-sky-600 hover:text-sky-800 font-bold underline cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Añadir nueva categoría</span>
                  </button>
                ) : (
                  <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <label className="block text-slate-700 font-bold mb-0.5 text-[11px]">Nueva categoría:</label>
                      <input
                        type="text"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="Nombre de categoría..."
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-0.5 text-[11px]">Categoría superior:</label>
                      <select
                        value={newCatParentId}
                        onChange={(e) => setNewCatParentId(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800"
                      >
                        <option value="">— Categoría principal —</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCreateQuickCategory}
                        disabled={savingNewCat || !newCatName.trim()}
                        className="px-3 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-lg text-xs cursor-pointer"
                      >
                        {savingNewCat ? 'Creando...' : 'Añadir categoría'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingNewCat(false)}
                        className="text-slate-500 hover:text-slate-800 font-medium text-xs"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 5. METABOX: ETIQUETAS DEL PRODUCTO */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
              <div className="border-b border-slate-100 pb-2.5">
                <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                  Etiquetas del producto
                </h4>
              </div>

              <div className="space-y-2 text-xs">
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Separar etiquetas con comas..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
                <p className="text-[11px] text-slate-400">
                  Ej: Ofertas, Verano, Tendencias, Más Vendidos.
                </p>

                {/* Etiquetas frecuentes para añadir con un clic */}
                {((tenant.settings?.tags || []) as ProductTag[]).length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <span className="text-[10px] text-slate-500 font-bold block">Elegir de las etiquetas más utilizadas:</span>
                    <div className="flex flex-wrap gap-1">
                      {((tenant.settings?.tags || []) as ProductTag[]).map((t) => {
                        const currentList = tagsInput.split(',').map((s) => s.trim().toLowerCase());
                        const isAdded = currentList.includes(t.name.toLowerCase());
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              if (!isAdded) {
                                const next = tagsInput.trim() ? `${tagsInput.trim()}, ${t.name}` : t.name;
                                setTagsInput(next);
                              }
                            }}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-colors cursor-pointer ${
                              isAdded
                                ? 'bg-sky-100 text-sky-800 border-sky-300'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            + {t.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 6. METABOX: MARCAS DEL PRODUCTO */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
              <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                  Marcas de productos
                </h4>
                <Award className="w-3.5 h-3.5 text-amber-500" />
              </div>

              <div className="space-y-2 text-xs">
                {/* Selector si existen marcas registradas */}
                {((tenant.settings?.brands || []) as Brand[]).length > 0 && (
                  <div>
                    <label className="block text-slate-700 font-semibold mb-0.5 text-[11px]">Elegir marca registrada:</label>
                    <select
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 cursor-pointer font-medium"
                    >
                      <option value="">— Sin marca asignada —</option>
                      {((tenant.settings?.brands || []) as Brand[]).map((b) => (
                        <option key={b.id} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-slate-700 font-semibold mb-0.5 text-[11px]">
                    {((tenant.settings?.brands || []) as Brand[]).length > 0 ? 'O escribir marca personalizada:' : 'Nombre de la marca:'}
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Ej. Oxford, Denim Co, Tenddy..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">Marca o sello comercial de confección.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
