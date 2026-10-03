'use client';

import React, { useState } from 'react';
import { X, Tag, Loader2, AlertCircle, Check, Upload, Clipboard } from 'lucide-react';
import { Category } from '@/lib/types';
import { compressImage } from '@/lib/image-compressor';

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  onCategoryCreated: (newCategory: Category) => void;
}

export default function CreateCategoryModal({
  isOpen,
  onClose,
  tenantId,
  onCategoryCreated,
}: CreateCategoryModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [compressingImage, setCompressingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('El nombre de la categoría es obligatorio');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const activeImageUrl = imageUrlInput.trim() ? normalizeImageUrl(imageUrlInput) : undefined;

      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          name: name.trim(),
          description: description.trim() || null,
          imageData: imageBase64,
          image_url: !imageBase64 ? activeImageUrl : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error creando categoría');
      }

      onCategoryCreated(data.category);
      setName('');
      setDescription('');
      setImageBase64(null);
      setImageUrlInput('');
      onClose();
    } catch (err: unknown) {
      const errorText = err instanceof Error ? err.message : 'Error del servidor';
      setErrorMsg(errorText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div onClick={onClose} className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" />

      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 text-slate-900 shadow-2xl z-10 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                <Tag className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Nueva Categoría de Catálogo</h3>
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

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Foto Circular de la Categoría */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <label className="block text-slate-800 font-bold text-xs">
                Foto Representativa (Opcional)
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 cursor-pointer text-xs font-semibold shadow-xs">
                  {compressingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-500" /> : <Upload className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{compressingImage ? 'Optimizando...' : 'Subir Foto'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          setCompressingImage(true);
                          const compressed = await compressImage(file, {
                            maxWidth: 600,
                            maxHeight: 600,
                            quality: 0.85,
                            outputFormat: 'image/webp',
                          });
                          setImageBase64(compressed);
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setCompressingImage(false);
                        }
                      }
                    }}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      if (typeof navigator !== 'undefined' && navigator.clipboard?.read) {
                        const items = await navigator.clipboard.read();
                        for (const item of items) {
                          const imgType = item.types.find((t) => t.startsWith('image/'));
                          if (imgType) {
                            const blob = await item.getType(imgType);
                            const file = new File([blob], 'cat.png', { type: imgType });
                            const compressed = await compressImage(file, {
                              maxWidth: 600,
                              maxHeight: 600,
                              quality: 0.85,
                              outputFormat: 'image/webp',
                            });
                            setImageBase64(compressed);
                            return;
                          }
                        }
                      }
                      alert('Presiona Ctrl + V para pegar la foto directamente.');
                    } catch {
                      alert('Presiona Ctrl + V para pegar la foto directamente.');
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl text-sky-700 cursor-pointer text-xs font-semibold"
                >
                  <Clipboard className="w-3.5 h-3.5 text-sky-600" />
                  <span>Pegar (Ctrl + V)</span>
                </button>
              </div>

              <div className="pt-1">
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => {
                    const clean = normalizeImageUrl(e.target.value);
                    setImageUrlInput(clean);
                    if (imageBase64) setImageBase64(null);
                  }}
                  placeholder="O pegar enlace web o Google Drive de la foto..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                />
              </div>

              {(imageBase64 || imageUrlInput) && (
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-300 bg-white p-0.5 shadow-sm shrink-0">
                    <img
                      src={imageBase64 || normalizeImageUrl(imageUrlInput)}
                      alt="Preview categoría"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setImageBase64(null);
                      setImageUrlInput('');
                    }}
                    className="text-rose-600 hover:text-rose-700 text-xs font-semibold cursor-pointer"
                  >
                    Quitar Foto
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Nombre de la Categoría *</label>
              <input
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Calzado, Bebidas, Confitería, Ropa..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Descripción Breve (Opcional)</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej. Línea deportiva, productos de temporada..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none resize-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Guardar Categoría</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
