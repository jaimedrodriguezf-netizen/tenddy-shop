'use client';

import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Briefcase,
  Eye,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  Mail,
  Phone,
  Building
} from 'lucide-react';
import { Tenant, Branch } from '@/lib/types';

export interface TenantMember {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: 'owner' | 'admin' | 'sales' | 'viewer';
  is_active: boolean;
  branch_id?: string;
  created_at: string;
}

interface TeamTabProps {
  tenant: Tenant;
  branches: Branch[];
  initialMembers: TenantMember[];
}

export default function TeamTab({ tenant, branches, initialMembers }: TeamTabProps) {
  const [members, setMembers] = useState<TenantMember[]>(initialMembers);
  const [isAdding, setIsAdding] = useState(false);

  // Formulario nuevo miembro
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'owner' | 'admin' | 'sales' | 'viewer'>('sales');
  const [branchId, setBranchId] = useState(branches[0]?.id || '');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenant.id,
          branch_id: role === 'sales' ? branchId : null,
          full_name: fullName,
          email,
          phone,
          role,
          password: password || 'temp_123456',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error agregando miembro');
      }

      setMembers([...members, data.member]);
      setIsAdding(false);
      setFullName('');
      setEmail('');
      setPhone('');
      setPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('¿Estás seguro de revocar el acceso a este miembro?')) return;

    try {
      const res = await fetch(`/api/admin/members?memberId=${memberId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMembers(members.filter((m) => m.id !== memberId));
      }
    } catch (e) {
      console.error('Error eliminando miembro:', e);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold px-2 py-0.5 rounded-full">
            <Shield className="w-3 h-3 text-amber-600" /> Dueño / Propietario
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-bold px-2 py-0.5 rounded-full">
            <Shield className="w-3 h-3 text-purple-600" /> Administrador
          </span>
        );
      case 'sales':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold px-2 py-0.5 rounded-full">
            <Briefcase className="w-3 h-3 text-blue-600" /> Asesor Comercial
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-[11px] font-semibold px-2 py-0.5 rounded-full">
            <Eye className="w-3 h-3" /> Solo Lectura
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-700" />
            Equipo & Roles de la Empresa ({members.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Administra los accesos de administradores y vendedores de cada planta.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>{isAdding ? 'Cerrar Formulario' : 'Invitar Miembro'}</span>
        </button>
      </div>

      {/* Formulario para invitar miembro */}
      {isAdding && (
        <form
          onSubmit={handleAddMember}
          className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-xs"
        >
          <div className="border-b border-slate-200 pb-3">
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              Asignar Nuevo Rol en {tenant.name}
            </h4>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Nombre Completo *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. Ing. Carlos Valencia"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Correo Electrónico *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="carlos.valencia@fábrica.com"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-semibold">WhatsApp de Ventas</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0998765432"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Rol Asignado *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none"
              >
                <option value="sales">Asesor Comercial (Solo atiende cotizaciones)</option>
                <option value="admin">Administrador (Gestiona catálogo y precios)</option>
                <option value="owner">Dueño / Gerente (Acceso total)</option>
                <option value="viewer">Solo Lectura</option>
              </select>
            </div>

            {role === 'sales' && (
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Sucursal / Planta Asignada</label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.city} - {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Clave de Acceso Inicial</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>Confirmar Asignación</span>
            </button>
          </div>
        </form>
      )}

      {/* Lista de Miembros */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-5">Miembro</th>
              <th className="py-3 px-4">Rol en la Empresa</th>
              <th className="py-3 px-4">Sucursal Asignada</th>
              <th className="py-3 px-4">Contacto</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  Aún no has agregado asesores ni administradores a tu equipo.
                </td>
              </tr>
            ) : (
              members.map((m) => {
                const branch = branches.find((b) => b.id === m.branch_id);

                return (
                  <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-900">{m.full_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{m.email}</div>
                    </td>
                    <td className="py-3.5 px-4">{getRoleBadge(m.role)}</td>
                    <td className="py-3.5 px-4">
                      {branch ? (
                        <span className="font-medium text-slate-700">
                          {branch.city} ({branch.name.split(' ')[0]})
                        </span>
                      ) : (
                        <span className="text-slate-400">Todas las sucursales</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {m.phone ? (
                        <span className="font-mono text-slate-700">+{m.phone}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {m.role !== 'owner' && (
                        <button
                          onClick={() => handleDeleteMember(m.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Revocar acceso"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
