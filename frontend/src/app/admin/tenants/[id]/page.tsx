"use client";

import { useEffect, useState } from "react";
import { adminApi, Tenant } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { Building2, ArrowLeft, CheckCircle, XCircle, AlertTriangle, Globe, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TenantDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [toggling, setToggling] = useState(false);

    useEffect(() => {
        adminApi
            .getTenant(id)
            .then(setTenant)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [id]);

    async function toggleStatus() {
        if (!tenant) return;
        const newStatus = tenant.status === "active" ? "suspended" : "active";
        setToggling(true);
        try {
            const updated = await adminApi.updateTenantStatus(tenant.id, newStatus);
            setTenant(updated);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setToggling(false);
        }
    }

    if (loading) {
        return (
            <div className="p-8 animate-pulse">
                <div className="h-8 bg-slate-800 rounded w-48 mb-6" />
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-5 bg-slate-800 rounded w-3/4" />
                    ))}
                </div>
            </div>
        );
    }

    if (error || !tenant)
        return (
            <div className="p-8 text-red-400 flex items-center gap-2">
                <AlertTriangle size={18} />
                {error || "Tenant no encontrado"}
            </div>
        );

    return (
        <div className="p-8 max-w-3xl">
            <Button
                variant="ghost"
                className="text-slate-400 hover:text-white mb-6 gap-2"
                onClick={() => router.back()}
            >
                <ArrowLeft size={16} />
                Volver a Tenants
            </Button>

            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Building2 className="text-blue-400" />
                        {tenant.business_name}
                    </h1>
                    <p className="text-slate-400 mt-1 font-mono text-sm">{tenant.subdomain}.tuapp.com</p>
                </div>
                <div className="flex items-center gap-3">
                    {tenant.status === "active" ? (
                        <span className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium bg-emerald-400/10 px-3 py-1.5 rounded-full">
                            <CheckCircle size={14} /> Activo
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 text-red-400 text-sm font-medium bg-red-400/10 px-3 py-1.5 rounded-full">
                            <XCircle size={14} /> Suspendido
                        </span>
                    )}
                    <Button
                        size="sm"
                        disabled={toggling}
                        onClick={toggleStatus}
                        className={
                            tenant.status === "active"
                                ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border-0"
                                : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-0"
                        }
                    >
                        {toggling ? "..." : tenant.status === "active" ? "Suspender" : "Activar"}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                    { label: "ID del Tenant", value: tenant.id, icon: Building2, mono: true },
                    { label: "Subdominio", value: tenant.subdomain, icon: Globe, mono: true },
                    { label: "Base de Datos", value: tenant.db_name, icon: Database, mono: true },
                    {
                        label: "Plan",
                        value: tenant.plan ? `${tenant.plan.name} — $${tenant.plan.price}/${tenant.plan.billing_cycle}` : "Sin plan",
                        icon: CheckCircle,
                        mono: false,
                    },
                ].map(({ label, value, icon: Icon, mono }) => (
                    <div
                        key={label}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-600 transition-colors"
                    >
                        <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider mb-2">
                            <Icon size={14} />
                            {label}
                        </div>
                        <p className={`text-white font-medium ${mono ? "font-mono text-sm" : ""} break-all`}>
                            {value}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
