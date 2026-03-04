"use client";

import { useEffect, useState } from "react";
import { adminApi, AdminStats } from "@/lib/api";
import { Building2, Users, CreditCard, TrendingUp, Activity, AlertTriangle } from "lucide-react";

function StatCard({
    label,
    value,
    icon: Icon,
    color = "blue",
    subtitle,
}: {
    label: string;
    value: string | number;
    icon: React.ElementType;
    color?: "blue" | "green" | "yellow" | "purple" | "red";
    subtitle?: string;
}) {
    const colors = {
        blue: "text-blue-400 bg-blue-400/10",
        green: "text-emerald-400 bg-emerald-400/10",
        yellow: "text-yellow-400 bg-yellow-400/10",
        purple: "text-purple-400 bg-purple-400/10",
        red: "text-red-400 bg-red-400/10",
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-600 transition-colors">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-slate-400 uppercase tracking-wider font-medium">{label}</p>
                    <p className="text-3xl font-bold text-white mt-2">{value}</p>
                    {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
                </div>
                <div className={`p-3 rounded-lg ${colors[color]}`}>
                    <Icon size={22} />
                </div>
            </div>
        </div>
    );
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        adminApi
            .getStats()
            .then(setStats)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Panel Global</h1>
                <p className="text-slate-400 mt-1">Vista general de la plataforma SaaS</p>
            </div>

            {error && (
                <div className="mb-6 flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-4">
                    <AlertTriangle size={18} />
                    <span>{error}</span>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-pulse">
                            <div className="h-4 bg-slate-800 rounded w-1/2 mb-4" />
                            <div className="h-8 bg-slate-800 rounded w-1/3" />
                        </div>
                    ))}
                </div>
            ) : stats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <StatCard
                        label="Total Tenants"
                        value={stats.total_tenants}
                        icon={Building2}
                        color="blue"
                    />
                    <StatCard
                        label="Tenants Activos"
                        value={stats.active_tenants}
                        icon={Activity}
                        color="green"
                        subtitle={`${stats.suspended_tenants} suspendidos`}
                    />
                    <StatCard
                        label="Usuarios Globales"
                        value={stats.total_users}
                        icon={Users}
                        color="purple"
                    />
                    <StatCard
                        label="Planes Disponibles"
                        value={stats.total_plans}
                        icon={CreditCard}
                        color="yellow"
                    />
                    <StatCard
                        label="MRR Estimado"
                        value={`$${stats.mrr_estimado.toFixed(2)}`}
                        icon={TrendingUp}
                        color="green"
                        subtitle="Ingresos mensuales recurrentes"
                    />
                    <StatCard
                        label="Tenants Suspendidos"
                        value={stats.suspended_tenants}
                        icon={AlertTriangle}
                        color="red"
                    />
                </div>
            ) : null}

            {/* Quick Links */}
            <div className="mt-10">
                <h2 className="text-lg font-semibold text-slate-300 mb-4">Acceso Rápido</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { href: "/admin/tenants", label: "Ver todos los Tenants", icon: Building2 },
                        { href: "/admin/users", label: "Gestionar Usuarios", icon: Users },
                        { href: "/admin/plans", label: "Administrar Planes", icon: CreditCard },
                    ].map(({ href, label, icon: Icon }) => (
                        <a
                            key={href}
                            href={href}
                            className="flex items-center gap-3 bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-xl p-4 text-slate-300 hover:text-white transition-all group"
                        >
                            <Icon size={20} className="text-blue-400 group-hover:scale-110 transition-transform" />
                            <span className="font-medium text-sm">{label}</span>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}
