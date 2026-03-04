"use client";

import { useEffect, useState } from "react";
import { adminApi, Tenant } from "@/lib/api";
import { Building2, AlertTriangle, CheckCircle, XCircle, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function TenantsPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        fetchTenants();
    }, []);

    async function fetchTenants() {
        setLoading(true);
        try {
            const data = await adminApi.getTenants();
            setTenants(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    async function toggleStatus(t: Tenant) {
        const newStatus = t.status === "active" ? "suspended" : "active";
        setActionLoading(t.id);
        try {
            const updated = await adminApi.updateTenantStatus(t.id, newStatus);
            setTenants((prev) => prev.map((x) => (x.id === t.id ? updated : x)));
        } catch (e: any) {
            setError(e.message);
        } finally {
            setActionLoading(null);
        }
    }

    async function deleteTenant(t: Tenant) {
        if (!confirm(`¿Eliminar el tenant "${t.business_name}"? Esta acción es irreversible.`)) return;
        setActionLoading(t.id);
        try {
            await adminApi.deleteTenant(t.id);
            setTenants((prev) => prev.filter((x) => x.id !== t.id));
        } catch (e: any) {
            setError(e.message);
        } finally {
            setActionLoading(null);
        }
    }

    return (
        <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Building2 className="text-blue-400" />
                        Tenants
                    </h1>
                    <p className="text-slate-400 mt-1">
                        {tenants.length} negocio{tenants.length !== 1 ? "s" : ""} registrado{tenants.length !== 1 ? "s" : ""}
                    </p>
                </div>
            </div>

            {error && (
                <div className="mb-6 flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-4">
                    <AlertTriangle size={18} />
                    <span>{error}</span>
                </div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-800 text-slate-400 uppercase text-xs tracking-wider">
                            <th className="text-left px-6 py-4">Negocio</th>
                            <th className="text-left px-6 py-4">Subdominio</th>
                            <th className="text-left px-6 py-4">Plan</th>
                            <th className="text-left px-6 py-4">Estado</th>
                            <th className="text-right px-6 py-4">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading
                            ? Array.from({ length: 4 }).map((_, i) => (
                                <tr key={i} className="border-b border-slate-800/50 animate-pulse">
                                    <td className="px-6 py-4">
                                        <div className="h-4 bg-slate-800 rounded w-32" />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="h-4 bg-slate-800 rounded w-24" />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="h-4 bg-slate-800 rounded w-16" />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="h-4 bg-slate-800 rounded w-16" />
                                    </td>
                                    <td className="px-6 py-4" />
                                </tr>
                            ))
                            : tenants.map((t) => (
                                <tr
                                    key={t.id}
                                    className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                                >
                                    <td className="px-6 py-4 font-medium text-white">{t.business_name}</td>
                                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                                        {t.subdomain}.tuapp.com
                                    </td>
                                    <td className="px-6 py-4">
                                        {t.plan ? (
                                            <span className="px-2 py-1 rounded-md text-xs font-semibold bg-indigo-500/20 text-indigo-300">
                                                {t.plan.name}
                                            </span>
                                        ) : (
                                            <span className="text-slate-500">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {t.status === "active" ? (
                                            <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                                                <CheckCircle size={14} />
                                                Activo
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-red-400 text-xs font-medium">
                                                <XCircle size={14} />
                                                Suspendido
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/admin/tenants/${t.id}`}>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-slate-400 hover:text-white hover:bg-slate-700 h-8 w-8 p-0"
                                                >
                                                    <Eye size={15} />
                                                </Button>
                                            </Link>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                disabled={actionLoading === t.id}
                                                onClick={() => toggleStatus(t)}
                                                className={`h-8 text-xs px-3 ${t.status === "active"
                                                    ? "text-yellow-400 hover:bg-yellow-400/10"
                                                    : "text-emerald-400 hover:bg-emerald-400/10"
                                                    }`}
                                            >
                                                {actionLoading === t.id
                                                    ? "..."
                                                    : t.status === "active"
                                                        ? "Suspender"
                                                        : "Activar"}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                disabled={actionLoading === t.id}
                                                onClick={() => deleteTenant(t)}
                                                className="text-red-400 hover:bg-red-400/10 h-8 w-8 p-0"
                                            >
                                                <Trash2 size={15} />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>

                {!loading && tenants.length === 0 && (
                    <div className="text-center py-16 text-slate-500">
                        <Building2 size={40} className="mx-auto mb-3 opacity-30" />
                        <p>Aún no hay tenants registrados</p>
                    </div>
                )}
            </div>
        </div>
    );
}
