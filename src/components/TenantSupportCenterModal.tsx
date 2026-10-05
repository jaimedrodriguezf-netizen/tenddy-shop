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
  MessageSquare,
  Sparkles,
  Maximize2,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Tag,
  Camera,
  Paperclip,
  Clipboard
} from 'lucide-react';
import { compressImage } from '@/lib/image-compressor';

export interface TicketComment {
  id: string;
  ticket_id: string;
  sender_type: 'tenant' | 'support' | 'system';
  sender_name: string;
  message: string;
  attachments?: Array<{ url: string; type: string }>;
  created_at: string;
}

export interface SupportTicketItem {
  id: string;
  ticket_number: string;
  tenant_id: string;
  sender_name: string;
  sender_phone: string;
  sender_email?: string;
  subject: string;
  message: string;
  image_url?: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: string;
  admin_notes?: string;
  resolution_summary?: string;
  fixed_in_version?: string;
  unread_tenant_count?: number;
  created_at: string;
  updated_at?: string;
  ticket_comments?: TicketComment[];
}

interface TenantSupportCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  shopName: string;
  defaultName?: string;
  defaultPhone?: string;
  defaultEmail?: string;
  initialTab?: 'tickets' | 'new' | 'fixes';
  onNotificationRead?: () => void;
}

export default function TenantSupportCenterModal({
  isOpen,
  onClose,
  tenantId,
  shopName,
  defaultName = '',
  defaultPhone = '',
  defaultEmail = '',
  initialTab = 'tickets',
  onNotificationRead,
}: TenantSupportCenterModalProps) {
  const [activeTab, setActiveTab] = useState<'tickets' | 'new' | 'fixes'>(initialTab);
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketItem | null>(null);

  // Estados para nuevo ticket
  const [senderName, setSenderName] = useState(defaultName);
  const [senderPhone, setSenderPhone] = useState(defaultPhone);
  const [senderEmail, setSenderEmail] = useState(defaultEmail);
  const [subject, setSubject] = useState(shopName ? `Requerimiento de ${shopName}` : '');
  const [message, setMessage] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [isDocumentAttachment, setIsDocumentAttachment] = useState(false);
  const [compressingImage, setCompressingImage] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // Estados para comentarios en el hilo
  const [replyText, setReplyText] = useState('');
  const [replyImageBase64, setReplyImageBase64] = useState<string | null>(null);
  const [replyCompressing, setReplyCompressing] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Cargar tickets del tenant
  const loadTenantTickets = async () => {
    if (!tenantId) return;
    try {
      setLoadingTickets(true);
      const res = await fetch(`/api/admin/support?tenantId=${tenantId}`);
      const data = await res.json();
      if (res.ok) {
        setTickets(data.tickets || []);
        if (selectedTicket) {
          const refreshed = (data.tickets || []).find((t: SupportTicketItem) => t.id === selectedTicket.id);
          if (refreshed) setSelectedTicket(refreshed);
        }
      }
    } catch (err) {
      console.error('Error cargando tickets de soporte:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;
    const fetchOnOpen = async () => {
      if (!tenantId || !isOpen) return;
      try {
        const res = await fetch(`/api/admin/support?tenantId=${tenantId}`);
        const data = await res.json();
        if (!isCancelled && res.ok) {
          setTickets(data.tickets || []);
        }
      } catch (err) {
        console.error('Error cargando tickets de soporte:', err);
      }
    };

    fetchOnOpen();
    return () => {
      isCancelled = true;
    };
  }, [isOpen, tenantId]);

  // Marcar ticket como leído cuando se abre
  const handleSelectTicket = async (ticket: SupportTicketItem) => {
    setSelectedTicket(ticket);
    if ((ticket.unread_tenant_count || 0) > 0) {
      try {
        await fetch('/api/admin/support', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId: ticket.id, tenantId }),
        });
        setTickets((prev) =>
          prev.map((t) => (t.id === ticket.id ? { ...t, unread_tenant_count: 0 } : t))
        );
        if (onNotificationRead) onNotificationRead();
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Enviar respuesta en el hilo con foto opcional
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || (!replyText.trim() && !replyImageBase64) || sendingReply) return;

    try {
      setSendingReply(true);
      setErrorMsg(null);

      const res = await fetch('/api/admin/support/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: selectedTicket.id,
          tenant_id: tenantId,
          message: replyText.trim() || 'Adjunto imagen de réplica.',
          sender_name: senderName || shopName || 'Administrador',
          sender_type: 'tenant',
          image_data: replyImageBase64,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar respuesta');

      const newComment = data.comment;
      const updatedComments = [...(selectedTicket.ticket_comments || []), newComment];
      const newStatus =
        selectedTicket.status === 'resolved' || selectedTicket.status === 'closed'
          ? 'in_progress'
          : selectedTicket.status;
      const updatedTicket: SupportTicketItem = {
        ...selectedTicket,
        status: newStatus,
        ticket_comments: updatedComments,
      };

      setSelectedTicket(updatedTicket);
      setTickets((prev) => prev.map((t) => (t.id === selectedTicket.id ? updatedTicket : t)));
      setReplyText('');
      setReplyImageBase64(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al enviar mensaje';
      setErrorMsg(msg);
    } finally {
      setSendingReply(false);
    }
  };

  // Subir archivo / imagen para nuevo ticket
  const processImageOrDoc = async (file: File | Blob, target: 'create' | 'reply') => {
    setErrorMsg(null);
    const fileName = (file as File).name || 'captura-portapapeles.png';

    const isExcelOrCsv =
      fileName.endsWith('.xlsx') ||
      fileName.endsWith('.xls') ||
      fileName.endsWith('.csv') ||
      fileName.endsWith('.pdf');

    if (target === 'create') {
      setAttachedFileName(fileName);
      if (isExcelOrCsv) {
        setIsDocumentAttachment(true);
        const reader = new FileReader();
        reader.onload = () => {
          setImageBase64(reader.result as string);
        };
        reader.readAsDataURL(file);
        return;
      }

      setIsDocumentAttachment(false);
      try {
        setCompressingImage(true);
        const compressed = await compressImage(file, {
          maxWidth: 1600,
          maxHeight: 1600,
          quality: 0.82,
          outputFormat: 'image/webp',
        });
        setImageBase64(compressed);
        setSuccessMsg('Captura agregada con éxito.');
        setTimeout(() => setSuccessMsg(null), 3000);
      } catch (err) {
        console.error(err);
        setErrorMsg('No se pudo procesar la imagen adjunta.');
      } finally {
        setCompressingImage(false);
      }
    } else {
      try {
        setReplyCompressing(true);
        const compressed = await compressImage(file, {
          maxWidth: 1600,
          maxHeight: 1600,
          quality: 0.82,
          outputFormat: 'image/webp',
        });
        setReplyImageBase64(compressed);
        setSuccessMsg('Captura agregada a la réplica.');
        setTimeout(() => setSuccessMsg(null), 3000);
      } catch (err) {
        console.error(err);
        setErrorMsg('No se pudo procesar la imagen de réplica.');
      } finally {
        setReplyCompressing(false);
      }
    }
  };

  // Interceptar pegado global (Ctrl + V / Cmd + V) en soporte
  useEffect(() => {
    if (!isOpen) return;

    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (blob) {
            e.preventDefault();
            if (selectedTicket) {
              processImageOrDoc(blob, 'reply');
            } else if (activeTab === 'new') {
              processImageOrDoc(blob, 'create');
            }
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => {
      window.removeEventListener('paste', handleGlobalPaste);
    };
  }, [isOpen, selectedTicket, activeTab]);

  // Botón explícito para pegar directamente del portapapeles
  const handlePasteFromClipboard = async (target: 'create' | 'reply') => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imageType = item.types.find((t) => t.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            const file = new File([blob], 'captura-portapapeles.png', { type: imageType });
            await processImageOrDoc(file, target);
            return;
          }
        }
        setErrorMsg('No se encontró ninguna imagen en el portapapeles. Copia una captura primero (Ctrl+C o Windows+Shift+S).');
      } else {
        setErrorMsg('Presiona directamente Ctrl + V en tu teclado para pegar la captura.');
      }
    } catch (err) {
      console.warn('Acceso al portapapeles:', err);
      setErrorMsg('Presiona directamente Ctrl + V en tu teclado para pegar la captura.');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processImageOrDoc(file, 'create');
  };

  // Enviar nuevo ticket
  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !senderName.trim() || !senderPhone.trim()) {
      setErrorMsg('Por favor completa tu nombre, teléfono y el detalle de tu solicitud.');
      return;
    }

    try {
      setSubmittingTicket(true);
      setErrorMsg(null);

      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          sender_name: senderName.trim(),
          sender_phone: senderPhone.trim(),
          sender_email: senderEmail.trim() || null,
          subject: subject.trim() || `Requerimiento de ${shopName}`,
          message: message.trim(),
          category: 'technical',
          image_data: imageBase64,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar ticket');

      setSuccessMsg(`¡Ticket #${data.ticket_number || 'creado'} enviado con éxito! El equipo técnico lo revisará.`);
      setMessage('');
      setImageBase64(null);
      setAttachedFileName(null);
      await loadTenantTickets();
      setTimeout(() => {
        setSuccessMsg(null);
        setActiveTab('tickets');
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al enviar requerimiento';
      setErrorMsg(msg);
    } finally {
      setSubmittingTicket(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Abierto
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
            En Revisión
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            Solucionado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {status}
          </span>
        );
    }
  };

  const resolvedTickets = tickets.filter((t) => t.status === 'resolved');
  const openCount = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div onClick={onClose} className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" />

      <div className="min-h-full flex items-center justify-center p-3 sm:p-4">
        <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 text-slate-900 shadow-2xl z-10 space-y-5">
          {/* Header del Centro de Ayuda */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center font-bold">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  Mesa de Ayuda & Consultas de tu Tienda
                </h3>
                <p className="text-[11px] text-slate-500">
                  Soporte para tus ventas, consultas de tu catálogo y seguimiento de mejoras para {shopName}.
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Selector de Pestañas */}
          <div className="flex items-center justify-between border-b border-slate-200">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('tickets');
                  setSelectedTicket(null);
                }}
                className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  activeTab === 'tickets'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Mis Consultas ({openCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('new')}
                className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  activeTab === 'new'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Consulta</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('fixes')}
                className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  activeTab === 'fixes'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Mejoras Realizadas ({resolvedTickets.length})</span>
              </button>
            </div>

            <button
              onClick={loadTenantTickets}
              disabled={loadingTickets}
              className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              title="Actualizar lista"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingTickets ? 'animate-spin text-sky-500' : ''}`} />
            </button>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center gap-2 font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* =========================================================================
              PESTAÑA 1: HILOS DE DISCUSIÓN & MIS REQUERIMIENTOS (GITHUB ISSUES STYLE)
              ========================================================================= */}
          {activeTab === 'tickets' && (
            <div className="space-y-4">
              {selectedTicket ? (
                /* Vista Detallada de Ticket con Hilo de Conversación */
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <button
                      onClick={() => setSelectedTicket(null)}
                      className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1 cursor-pointer"
                    >
                      ← Volver a la lista de tickets
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500">
                        {selectedTicket.ticket_number}
                      </span>
                      {getStatusBadge(selectedTicket.status)}
                    </div>
                  </div>

                  {/* Asunto y Detalle del Ticket */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900">{selectedTicket.subject}</h4>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(selectedTicket.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {selectedTicket.message}
                    </p>

                    {/* Foto / Adjunto si existe */}
                    {selectedTicket.image_url && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setZoomImage(selectedTicket.image_url || null)}
                          className="relative inline-block border border-slate-200 rounded-xl overflow-hidden group cursor-pointer"
                        >
                          <img
                            src={selectedTicket.image_url}
                            alt="Adjunto ticket"
                            className="w-32 h-20 object-cover"
                          />
                          <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold">
                            Ver Ampliada
                          </div>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Hilo de Respuestas / Comentarios */}
                  <div className="space-y-3 pt-2">
                    <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                      <span>Respuestas y Comentarios del Hilo</span>
                    </h5>

                    {(selectedTicket.ticket_comments || []).length === 0 ? (
                      <div className="text-center py-6 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                        Aún no hay comentarios en este ticket. El equipo técnico responderá por este medio.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {selectedTicket.ticket_comments?.map((c) => {
                          const isSupport = c.sender_type === 'support';
                          return (
                            <div
                              key={c.id}
                              className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                                isSupport
                                  ? 'bg-sky-50/70 border-sky-200 text-sky-950 ml-4'
                                  : 'bg-white border-slate-200 text-slate-900 mr-4'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold flex items-center gap-1.5">
                                  {isSupport ? (
                                    <>
                                      <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                                      <span className="text-sky-700 font-extrabold">Soporte Técnico Oficial</span>
                                    </>
                                  ) : (
                                    <span>{c.sender_name}</span>
                                  )}
                                </span>
                                <span className="text-slate-400 font-mono text-[10px]">
                                  {new Date(c.created_at).toLocaleString()}
                                </span>
                              </div>
                              <p className="whitespace-pre-wrap leading-relaxed">{c.message}</p>

                              {/* Fotos adjuntas en la réplica */}
                              {c.attachments && Array.isArray(c.attachments) && c.attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-1.5">
                                  {c.attachments.map((att, attIdx) => (
                                    <button
                                      key={attIdx}
                                      type="button"
                                      onClick={() => setZoomImage(att.url)}
                                      className="relative border border-slate-200/80 rounded-xl overflow-hidden group cursor-pointer"
                                    >
                                      <img src={att.url} alt="Adjunto réplica" className="w-24 h-16 object-cover" />
                                      <span className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold transition-opacity">
                                        Ver
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Caja para responder en el hilo con foto opcional */}
                    <form onSubmit={handleSendReply} className="pt-2 space-y-2">
                      {replyImageBase64 && (
                        <div className="relative inline-block border border-slate-200 rounded-xl overflow-hidden p-1 bg-white shadow-xs">
                          <img src={replyImageBase64} alt="Preview réplica" className="w-20 h-14 object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={() => setReplyImageBase64(null)}
                            className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-500 text-white rounded-full p-0.5 shadow cursor-pointer"
                            title="Quitar foto"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <label
                          className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-slate-600 transition-colors cursor-pointer shrink-0"
                          title="Adjuntar captura o foto desde archivo"
                        >
                          {replyCompressing ? <Loader2 className="w-4 h-4 animate-spin text-sky-500" /> : <Camera className="w-4 h-4" />}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                await processImageOrDoc(file, 'reply');
                              }
                            }}
                            className="hidden"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => handlePasteFromClipboard('reply')}
                          disabled={replyCompressing}
                          className="p-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl text-sky-700 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                          title="Pegar captura del portapapeles (Ctrl + V)"
                        >
                          <Clipboard className="w-4 h-4 text-sky-600" />
                        </button>

                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Escribe tu réplica... (puedes adjuntar foto si el problema persiste)"
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none transition-all"
                        />

                        <button
                          type="submit"
                          disabled={sendingReply || (!replyText.trim() && !replyImageBase64)}
                          className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                        >
                          {sendingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          <span>Enviar</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : (
                /* Lista de Tickets */
                <div className="space-y-2">
                  {tickets.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs space-y-3">
                      <LifeBuoy className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="font-semibold text-slate-700">No tienes requerimientos abiertos</p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('new')}
                        className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Crear Nuevo Ticket</span>
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                      {tickets.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => handleSelectTicket(t)}
                          className="p-3.5 sm:p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-[10px] font-bold text-slate-400">
                                {t.ticket_number}
                              </span>
                              {getStatusBadge(t.status)}
                              {(t.unread_tenant_count || 0) > 0 && (
                                <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                                  Nueva Respuesta
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate group-hover:text-sky-600 transition-colors">
                              {t.subject}
                            </h4>
                            <p className="text-[11px] text-slate-500 truncate max-w-xl">
                              {t.message}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 text-slate-400 group-hover:text-slate-700 shrink-0">
                            <span className="text-[10px] font-mono hidden sm:inline">
                              {new Date(t.created_at).toLocaleDateString()}
                            </span>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              PESTAÑA 2: NUEVO REQUERIMIENTO (CON ADVERTENCIA DE ALCANCE)
              ========================================================================= */}
          {activeTab === 'new' && (
            <div className="space-y-4">
              {/* Banner Amigable sobre el Alcance del Canal */}
              <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl text-xs text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <span>ℹ️</span>
                  <span>¿Cómo te podemos ayudar?</span>
                </div>
                <p className="text-[11px] text-amber-800/90 leading-relaxed">
                  Este canal es para resolver dudas de tu tienda, consultas sobre tus ventas o si algo no te funciona al cargar productos o recibir pedidos. Las propuestas para cambiar todo el diseño o sumar grandes funciones a la plataforma las anotamos para evaluarlas en las próximas mejoras del sistema.
                </p>
              </div>

              <form onSubmit={handleCreateTicketSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Tu Nombre *</label>
                    <input
                      type="text"
                      required
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Ej. Margarita Sacón"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Teléfono / WhatsApp *</label>
                    <input
                      type="text"
                      required
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      placeholder="Ej. +593 99 875 0294"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono focus:bg-white focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Asunto o Módulo *</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Ej. Error al subir fotos de vestidos o duda en catálogo"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Detalle del Requerimiento *</label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe claramente qué ocurrió o qué necesitas solucionar..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none resize-none leading-relaxed"
                  />
                </div>

                {/* Adjuntar Foto o Archivo */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700 text-xs">
                      Adjuntar Captura o Archivo (Opcional)
                    </label>
                    {attachedFileName && (
                      <button
                        type="button"
                        onClick={() => {
                          setImageBase64(null);
                          setAttachedFileName(null);
                        }}
                        className="text-rose-600 hover:text-rose-700 text-[11px] font-semibold cursor-pointer"
                      >
                        Quitar
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <label className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 cursor-pointer text-xs font-semibold shadow-xs">
                      {compressingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-500" /> : <Upload className="w-3.5 h-3.5 text-slate-500" />}
                      <span>{compressingImage ? 'Optimizando...' : 'Seleccionar Archivo'}</span>
                      <input
                        type="file"
                        accept="image/*,.xlsx,.xls,.csv,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => handlePasteFromClipboard('create')}
                      disabled={compressingImage}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl text-sky-700 cursor-pointer text-xs font-semibold transition-colors disabled:opacity-50"
                      title="Pegar captura directamente del portapapeles"
                    >
                      <Clipboard className="w-3.5 h-3.5 text-sky-600" />
                      <span>Pegar Captura (Ctrl + V)</span>
                    </button>

                    <span className="text-[11px] text-slate-500 truncate max-w-xs">
                      {attachedFileName || 'Ningún archivo adjunto'}
                    </span>
                  </div>

                  {imageBase64 && !isDocumentAttachment && (
                    <div className="pt-2">
                      <div className="relative inline-block border border-slate-200 rounded-xl overflow-hidden p-1 bg-white shadow-xs">
                        <img src={imageBase64} alt="Captura adjunta" className="w-24 h-16 object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={() => {
                            setImageBase64(null);
                            setAttachedFileName(null);
                          }}
                          className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-500 text-white rounded-full p-0.5 shadow cursor-pointer"
                          title="Quitar foto"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveTab('tickets')}
                    className="px-4 py-2 text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingTicket}
                    className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    {submittingTicket ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Enviar Requerimiento</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* =========================================================================
              PESTAÑA 3: HISTORIAL DE FIXES & MEJORAS RESUELTAS ("QUÉ SE HIZO Y CÓMO")
              ========================================================================= */}
          {activeTab === 'fixes' && (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs text-emerald-900">
                <span className="font-bold">✨ Mejoras listas en tu tienda:</span> Aquí puedes consultar los ajustes y soluciones que ya implementamos para facilitarte la carga de productos y la atención a tus clientes.
              </div>

              {resolvedTickets.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Aún no hay tickets cerrados registrados en esta tienda.
                </div>
              ) : (
                <div className="space-y-3">
                  {resolvedTickets.map((t) => (
                    <div
                      key={t.id}
                      className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-xs"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {t.ticket_number}
                          </span>
                          <span className="font-bold text-xs sm:text-sm text-slate-900">
                            {t.subject}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {t.fixed_in_version && (
                            <span className="bg-sky-50 text-sky-700 border border-sky-200 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Fix en {t.fixed_in_version}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                            Solucionado
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <strong className="text-slate-800 block mb-0.5">Problema reportado:</strong>
                        <span>{t.message}</span>
                      </div>

                      {/* Explicación Amigable de Qué se Solucionó */}
                      <div className="text-[11px] text-emerald-950 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200/70 space-y-1">
                        <strong className="text-emerald-800 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Qué mejoramos:</span>
                        </strong>
                        <p className="leading-relaxed">
                          {t.resolution_summary || t.admin_notes || 'Ajuste completado en tu tienda.'}
                        </p>
                      </div>

                      <div className="text-[10px] text-slate-400 font-mono text-right">
                        Resuelto: {new Date(t.updated_at || t.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Modal para Zoom de Imagen */}
          {zoomImage && (
            <div
              onClick={() => setZoomImage(null)}
              className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
            >
              <div className="relative max-w-3xl max-h-[90vh]">
                <img src={zoomImage} alt="Zoom" className="max-w-full max-h-[85vh] object-contain rounded-xl" />
                <button
                  onClick={() => setZoomImage(null)}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
