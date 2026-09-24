'use client';

import React, { useState } from 'react';
import {
  LifeBuoy,
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
  Search,
  Filter,
  Image as ImageIcon,
  Building2,
  Calendar,
  Phone,
  Mail,
  X
} from 'lucide-react';

export interface SupportTicketRecord {
  id: string;
  ticket_number: string;
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
  created_at: string;
  tenants?: {
    name: string;
    slug: string;
  };
}

interface SuperadminSupportManagerProps {
  initialTickets: SupportTicketRecord[];
}

export default function SuperadminSupportManager({ initialTickets }: SuperadminSupportManagerProps) {
  const [tickets, setTickets] = useState<SupportTicketRecord[]>(initialTickets);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketRecord | null>(tickets[0] || null);
  const [adminNotes, setAdminNotes] = useState(selectedTicket?.admin_notes || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);

  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchesSearch =
      t.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
      t.sender_name.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      (t.tenants?.name && t.tenants.name.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch('/api/superadmin/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ticketId, status: newStatus, admin_notes: adminNotes }),
      });
      const data = await res.json();
      if (res.ok) {
        setTickets(tickets.map((t) => (t.id === ticketId ? { ...t, status: newStatus as any, admin_notes: adminNotes } : t)));
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket({ ...selectedTicket, status: newStatus as any, admin_notes: adminNotes });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Abierto
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
            En Revisión
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
            Resuelto
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
            Cerrado
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Modal Zoom de Imagen */}
      {modalImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 p-2">
            <button
              onClick={() => setModalImage(null)}
              className="absolute top-4 right-4 bg-slate-950/80 text-white hover:text-rose-400 p-2 rounded-full cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={modalImage} alt="Captura ampliada" className="max-h-[85vh] w-auto object-contain rounded-xl" />
          </div>
        </div>
      )}

      {/* Header y Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <LifeBuoy className="w-4 h-4 text-amber-400" />
            Bandeja de Tickets & Soporte con Captura ({tickets.length})
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Reportes enviados por usuarios con imagen adjunta y respuesta directa por WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl text-xs">
            {['all', 'open', 'in_progress', 'resolved', 'closed'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-lg capitalize font-semibold transition-all cursor-pointer ${
                  filterStatus === st ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {st === 'all' ? 'Todos' : st}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por # ticket, remitente..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Grid de Tickets y Detalle Lateral */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Lista de Tickets */}
        <div className="lg:col-span-7 space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs">
              No hay tickets con el filtro seleccionado.
            </div>
          ) : (
            filteredTickets.map((t) => {
              const isSelected = selectedTicket?.id === t.id;

              return (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedTicket(t);
                    setAdminNotes(t.admin_notes || '');
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-amber-400/80 shadow-md'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-400">{t.ticket_number}</span>
                      <span className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-400 uppercase">
                        {t.category}
                      </span>
                    </div>
                    {getStatusBadge(t.status)}
                  </div>

                  <h4 className="font-bold text-white text-sm truncate">{t.subject}</h4>
                  <p className="text-slate-400 text-xs line-clamp-2 mt-1 leading-relaxed">{t.message}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-800/60">
                    <span className="text-slate-300 font-semibold">{t.sender_name}</span>
                    <div className="flex items-center gap-3">
                      {t.image_url && (
                        <span className="text-amber-400 font-bold flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5" /> Con Imagen
                        </span>
                      )}
                      <span>{new Date(t.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detalle Lateral */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 sticky top-24">
          {selectedTicket ? (
            <>
              <div className="border-b border-slate-800 pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-amber-400">{selectedTicket.ticket_number}</span>
                  {getStatusBadge(selectedTicket.status)}
                </div>
                <h4 className="font-bold text-base text-white mt-1">{selectedTicket.subject}</h4>
                <p className="text-xs text-slate-400">
                  De: <strong>{selectedTicket.sender_name}</strong> • {new Date(selectedTicket.created_at).toLocaleString()}
                </p>
              </div>

              {/* Botón de Resolver por WhatsApp */}
              <a
                href={`https://wa.me/${selectedTicket.sender_phone}?text=${encodeURIComponent(
                  `Hola ${selectedTicket.sender_name}, te escribo de soporte de tenddy.shop respecto a tu ticket #${selectedTicket.ticket_number} (${selectedTicket.subject}).`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Responder por WhatsApp (+{selectedTicket.sender_phone})</span>
              </a>

              {/* Mensaje Completo */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 leading-relaxed space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Mensaje / Problema:</span>
                <p className="whitespace-pre-wrap">{selectedTicket.message}</p>
              </div>

              {/* Imagen Adjunta */}
              {selectedTicket.image_url ? (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Captura Adjunta:</span>
                  <div
                    onClick={() => setModalImage(selectedTicket.image_url || null)}
                    className="relative h-44 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 group cursor-pointer"
                  >
                    <img src={selectedTicket.image_url} alt="Adjunto" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                      🔍 Clic para ampliar
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 italic">Sin imagen adjunta.</div>
              )}

              {/* Selector de Estado */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Actualizar Estado del Ticket:
                </label>
                <div className="grid grid-cols-4 gap-1 text-[11px]">
                  {(['open', 'in_progress', 'resolved', 'closed'] as const).map((st) => (
                    <button
                      key={st}
                      disabled={isUpdating || selectedTicket.status === st}
                      onClick={() => handleUpdateStatus(selectedTicket.id, st)}
                      className={`py-1.5 rounded-lg font-semibold capitalize transition-all cursor-pointer disabled:opacity-40 ${
                        selectedTicket.status === st
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {st === 'open' ? 'Abierto' : st === 'in_progress' ? 'Revisión' : st === 'resolved' ? 'Resuelto' : 'Cerrar'}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-slate-500 text-xs">
              Selecciona un ticket para ver la captura de pantalla y responder por WhatsApp.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
