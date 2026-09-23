'use client';

import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Building2,
  Phone,
  Mail,
  MapPin,
  Trash2,
  Power,
  Shield,
  Briefcase,
  Search,
  Check,
  AlertCircle,
  Loader2,
  X,
  CreditCard
} from 'lucide-react';

export interface B2BAccount {
  id: string;
  company_name: string;
  tax_id?: string;
  business_type?: string;
  billing_city?: string;
  billing_address?: string;
  phone: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface TenantStaffMember {
  id: string;
  tenant_id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  is_active: boolean;
  created_at: string;
  tenants?: {
    name: string;
    slug: string;
  };
}

interface SuperadminUsersManagerProps {
  initialBuyers: B2BAccount[];
  initialStaff: TenantStaffMember[];
}

export default function SuperadminUsersManager({
  initialBuyers,
  initialStaff,
}: SuperadminUsersManagerProps) {
  const [subTab, setSubTab] = useState<'buyers' | 'staff'>('buyers');
  const [buyers, setBuyers] = useState<B2BAccount[]>(initialBuyers);
  const [staff, setStaff] = useState<TenantStaffMember[]>(initialStaff);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Formulario nuevo comprador
  const [companyName, setCompanyName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filtrado
  const filteredBuyers = buyers.filter(
    (b) =>
      b.company_name.toLowerCase().includes(search.toLowerCase()) ||
      b.email.toLowerCase().includes(search.toLowerCase()) ||
      (b.tax_id && b.tax_id.toLowerCase().includes(search.toLowerCase())) ||
      b.phone.includes(search)
  );

  const filteredStaff = staff.filter(
    (s) =>
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.tenants?.name && s.tenants.name.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreateBuyer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/superadmin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName,
          tax_id: taxId,
          phone,
          email,
          billing_city: city,
          billing_address: address,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error creando comprador');

      setBuyers([data.user, ...buyers]);
      setIsModalOpen(false);
      setCompanyName('');
      setTaxId('');
      setPhone('');
      setEmail('');
      setCity('');
      setAddress('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUser = async (id: string, currentStatus: boolean, type: 'buyers' | 'staff') => {
    if (!confirm(`¿Estás seguro de ${currentStatus ? 'suspender' : 'activar'} a este usuario?`)) return;

    try {
      const res = await fetch('/api/superadmin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !currentStatus, type }),
      });
      if (res.ok) {
        if (type === 'buyers') {
          setBuyers(buyers.map((b) => (b.id === id ? { ...b, is_active: !currentStatus } : b)));
        } else {
          setStaff(staff.map((s) => (s.id === id ? { ...s, is_active: !currentStatus } : s)));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = async (id: string, type: 'buyers' | 'staff') => {
    if (!confirm('¿Estás seguro de eliminar permanentemente a este usuario?')) return;

    try {
      const res = await fetch(`/api/superadmin/users?id=${id}&type=${type}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        if (type === 'buyers') {
          setBuyers(buyers.filter((b) => b.id !== id));
        } else {
          setStaff(staff.filter((s) => s.id !== id));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Modal Crear Comprador */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-100 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-400" />
                Registrar Nueva Cuenta Compradora B2B
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-2.5 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateBuyer} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Razón Social / Empresa *</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ej. Embotelladora Nacional S.A."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">NIT / RUT / Tax ID</label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="900123456-1"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Correo de Compras *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="compras@empresa.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Teléfono / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0998765432"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Ciudad Fiscal</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Quito / Bogotá"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Dirección</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Parque Industrial Bodega 12"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 rounded-xl text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Guardar Comprador</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selector de Pestañas Secundarias & Buscador */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl">
          <button
            onClick={() => setSubTab('buyers')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === 'buyers'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Empresas Compradoras B2B ({buyers.length})
          </button>
          <button
            onClick={() => setSubTab('staff')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === 'staff'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Miembros de Fábricas / Staff ({staff.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por empresa, email o teléfono..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
            />
          </div>

          {subTab === 'buyers' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/20 whitespace-nowrap cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Nuevo Comprador</span>
            </button>
          )}
        </div>
      </div>

      {/* VISTA 1: COMPRADORES B2B UNIVERSALES */}
      {subTab === 'buyers' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Empresa Compradora</th>
                <th className="py-3 px-4">NIT / Tax ID</th>
                <th className="py-3 px-4">Ubicación Fiscal</th>
                <th className="py-3 px-4">Contacto Comercial</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredBuyers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No se encontraron compradores registrados.
                  </td>
                </tr>
              ) : (
                filteredBuyers.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{b.company_name}</div>
                      <div className="text-[11px] text-slate-400">{b.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {b.tax_id || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {b.billing_city ? `${b.billing_city}` : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-emerald-400">
                      +{b.phone}
                    </td>
                    <td className="py-3.5 px-4">
                      {b.is_active ? (
                        <span className="text-emerald-400 font-semibold text-[11px]">Activo</span>
                      ) : (
                        <span className="text-rose-400 font-semibold text-[11px]">Suspendido</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleUser(b.id, b.is_active, 'buyers')}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            b.is_active ? 'text-rose-400 hover:bg-rose-500/10 border-rose-500/20' : 'text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/20'
                          }`}
                          title={b.is_active ? 'Suspender cuenta' : 'Activar cuenta'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(b.id, 'buyers')}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar permanentemente"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* VISTA 2: STAFF / MIEMBROS DE TIENDAS */}
      {subTab === 'staff' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Usuario / Staff</th>
                <th className="py-3 px-4">Tienda Asignada</th>
                <th className="py-3 px-4">Rol</th>
                <th className="py-3 px-4">Teléfono</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No hay miembros de staff registrados.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{s.full_name}</div>
                      <div className="text-[11px] text-slate-400">{s.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-sky-400">{s.tenants?.name || 'Tienda Principal'}</div>
                      <div className="text-[10px] font-mono text-slate-500">{s.tenants?.slug}.tenddy.shop</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="capitalize bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[11px] font-bold text-amber-400">
                        {s.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {s.phone ? `+${s.phone}` : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      {s.is_active ? (
                        <span className="text-emerald-400 font-semibold text-[11px]">Activo</span>
                      ) : (
                        <span className="text-rose-400 font-semibold text-[11px]">Suspendido</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleUser(s.id, s.is_active, 'staff')}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            s.is_active ? 'text-rose-400 hover:bg-rose-500/10 border-rose-500/20' : 'text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/20'
                          }`}
                          title={s.is_active ? 'Suspender acceso' : 'Reactivar acceso'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(s.id, 'staff')}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
