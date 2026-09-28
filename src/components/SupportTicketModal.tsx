'use client';

import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  X,
  Upload,
  Send,
  AlertCircle,
  CheckCircle,
  Loader2,
  User,
  Edit2,
  Clipboard
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId?: string;
  shopName?: string;
  defaultName?: string;
  defaultPhone?: string;
  defaultEmail?: string;
}

export default function SupportTicketModal({
  isOpen,
  onClose,
  tenantId,
  shopName,
  defaultName = '',
  defaultPhone = '',
  defaultEmail = '',
}: SupportTicketModalProps) {
  const [senderName, setSenderName] = useState(defaultName);
  const [senderPhone, setSenderPhone] = useState(defaultPhone);
  const [senderEmail, setSenderEmail] = useState(defaultEmail);
  const [subject, setSubject] = useState(shopName ? `Soporte para ${shopName}` : '');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('technical');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [showEditContact, setShowEditContact] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdTicket, setCreatedTicket] = useState<{ ticket_number: string } | null>(null);

  // Auto-llenar datos del usuario autenticado o props
  useEffect(() => {
    async function prefill() {
      let name = defaultName;
      let phone = defaultPhone;
      let email = defaultEmail;

      if (shopName && !subject) {
        setSubject(`Requerimiento de ${shopName}`);
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          if (!name) {
            name = user.user_metadata?.full_name || user.email?.split('@')[0] || '';
          }
          if (!email && user.email) {
            email = user.email;
          }
          if (!phone && user.phone) {
            phone = user.phone;
          }
        }
      } catch {
        // Ignorar si no hay sesión activa
      }

      if (name) setSenderName(name);
      if (phone) setSenderPhone(phone);
      if (email) setSenderEmail(email);

      // Si ya tenemos nombre o teléfono, ocultar los campos repetitivos
      if (name || phone) {
        setShowEditContact(false);
      } else {
        setShowEditContact(true);
      }
    }

    if (isOpen) {
      prefill();
    }
  }, [isOpen, defaultName, defaultPhone, defaultEmail, shopName, subject]);

  const processImageFile = (file: File) => {
    if (file.size > 4 * 1024 * 1024) {
      alert('La imagen no debe superar los 4 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  // Interceptar pegado de imagen desde el portapapeles (Ctrl + V / Cmd + V) estilo Gemini
  const handlePaste = (e: React.ClipboardEvent | ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const blob = item.getAsFile();
        if (blob) {
          processImageFile(blob);
          if (typeof e.preventDefault === 'function') {
            e.preventDefault();
          }
          break;
        }
      }
    }
  };

  // Escuchar pegado global en la ventana cuando el modal está abierto
  useEffect(() => {
    if (!isOpen) return;

    const globalPasteListener = (e: ClipboardEvent) => {
      handlePaste(e);
    };

    window.addEventListener('paste', globalPasteListener);
    return () => {
      window.removeEventListener('paste', globalPasteListener);
    };
  }, [isOpen]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImageFile(file);
    }
  };

  // Botón explícito para pegar directamente del portapapeles
  const handlePasteFromClipboard = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imageType = item.types.find((t) => t.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            const file = new File([blob], 'captura.png', { type: imageType });
            processImageFile(file);
            return;
          }
        }
        alert('No se encontró ninguna imagen en el portapapeles. Copia o toma una captura primero.');
      } else {
        alert('Presiona Ctrl + V (o Cmd + V) en tu teclado para pegar la captura.');
      }
    } catch {
      alert('Presiona Ctrl + V (o Cmd + V) en tu teclado para pegar la captura directamente.');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const finalName = senderName.trim() || shopName || 'Titular de Tienda';
    const finalPhone = senderPhone.trim() || 'WhatsApp Registrado';

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_name: finalName,
          sender_phone: finalPhone,
          sender_email: senderEmail ? senderEmail.trim().toLowerCase() : null,
          subject: subject.trim() || `Soporte de ${shopName || 'tenddy'}`,
          message: message.trim(),
          category,
          image_data: imageBase64,
          tenant_id: tenantId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar ticket');

      setCreatedTicket({ ticket_number: data.ticket.ticket_number });
    } catch (err: unknown) {
      const errorText = err instanceof Error ? err.message : 'Error de conexión';
      setErrorMsg(errorText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div onClick={onClose} className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" />

      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onPaste={handlePaste}
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 text-slate-900 shadow-2xl z-10 space-y-4 sm:space-y-5"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white">
              <LifeBuoy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Mesa de Ayuda & Soporte</h3>
              {shopName && <p className="text-[11px] text-slate-500">Tienda: {shopName}</p>}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {createdTicket ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-extrabold text-base text-slate-900">¡Ticket #{createdTicket.ticket_number} Enviado!</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Tu reporte y la captura de pantalla se enviaron directamente a nuestro canal de soporte en <strong>Telegram</strong> para atención inmediata.
              </p>
            </div>
            <button
              onClick={() => {
                setCreatedTicket(null);
                setImageBase64(null);
                setMessage('');
                onClose();
              }}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Barra de Contacto Prellenada Automáticamente */}
            {(senderName || senderPhone) && !showEditContact ? (
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    <User className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800 truncate">{senderName || shopName}</span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-1.5 py-0.2 rounded font-semibold">
                        Datos del Panel
                      </span>
                    </div>
                    <span className="text-slate-500 font-mono text-[11px] truncate block">
                      {senderPhone} {senderEmail ? `• ${senderEmail}` : ''}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditContact(true)}
                  className="text-[11px] text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Modificar</span>
                </button>
              </div>
            ) : null}

            {/* Campos de Contacto Manuales (Visibles solo si no están prellenados o si el usuario toca "Modificar") */}
            {showEditContact && (
              <div className="space-y-3 p-3 bg-slate-50/60 border border-slate-200/60 rounded-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Tu Nombre *</label>
                    <input
                      type="text"
                      required
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Ej. Carlos Mendoza"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Teléfono / WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      placeholder="+573129876543"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Correo Electrónico (Opcional)</label>
                  <input
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="contacto@empresa.com"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Selector de Categoría / Tipo de Problema */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">¿Qué tipo de problema o consulta tienes?</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 font-medium focus:bg-white focus:border-slate-900 focus:outline-none"
              >
                <option value="technical">🔧 Falla Técnica / Error en pantalla</option>
                <option value="catalog">📦 Catálogo / Carga de Productos</option>
                <option value="billing">💳 Pagos / Plan de Suscripción</option>
                <option value="general">💬 Consulta General / Asistencia</option>
              </select>
            </div>

            {/* Descripción del Problema */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Explica qué ocurrió o qué necesitas resolver *</label>
              <textarea
                rows={3}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onPaste={handlePaste}
                placeholder="Describe el error o lo que necesitas. También puedes pegar una captura directamente aquí con Ctrl + V..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Dos opciones claras: Subir Archivo | Pegar Imagen */}
            <div className="space-y-2">
              <label className="block text-slate-700 font-semibold mb-1">
                Adjuntar Captura de Pantalla o Foto
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Opción 1: Subir Archivo */}
                <label className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 cursor-pointer transition-colors text-xs font-semibold text-center">
                  <Upload className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Subir Archivo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>

                {/* Opción 2: Pegar Imagen */}
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl text-sky-700 cursor-pointer transition-colors text-xs font-semibold text-center"
                  title="Pegar imagen copiada del portapapeles"
                >
                  <Clipboard className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>Pegar Imagen</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400">
                Puedes subir un archivo o usar el botón <strong>Pegar Imagen</strong> (también funciona con <strong>Ctrl + V</strong>).
              </p>

              {imageBase64 && (
                <div className="relative mt-2 w-28 h-28 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm group">
                  <img src={imageBase64} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setImageBase64(null)}
                      className="bg-rose-600 hover:bg-rose-500 text-white rounded-lg p-1.5 shadow-md transition-colors cursor-pointer"
                      title="Eliminar captura"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="absolute bottom-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                    Lista
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer text-sm"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar Reporte a Telegram</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
