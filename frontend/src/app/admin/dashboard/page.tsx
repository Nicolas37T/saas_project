"use client";

import { useEffect, useState } from "react";
import { adminApi, AdminStats } from "@/lib/api";
import { Building2, Users, CreditCard, TrendingUp, Activity, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

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
        blue: "text-blue-500 bg-blue-500/10",
        green: "text-emerald-500 bg-emerald-500/10",
        yellow: "text-yellow-500 bg-yellow-500/10",
        purple: "text-purple-500 bg-purple-500/10",
        red: "text-destructive bg-destructive/10",
    };

    return (
        <Card className="hover:border-primary/50 transition-colors shadow-sm">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
                        <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
                        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
                    </div>
                    <div className={`p-3 rounded-lg ${colors[color]}`}>
                        <Icon size={22} />
                    </div>
                </div>
            </CardContent>
        </Card>
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
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            <div className="mb-6 border-b border-border pb-4">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Panel Global</h1>
                <p className="text-muted-foreground mt-1">Vista general de la plataforma SaaS</p>
            </div>

            {error && (
                <div className="mb-6 flex items-center gap-2 text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-4">
                    <AlertTriangle size={18} />
                    <span className="font-medium text-sm">{error}</span>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse shadow-sm">
                            <div className="h-4 bg-muted rounded w-1/2 mb-4" />
                            <div className="h-8 bg-muted rounded w-1/3" />
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
                <h2 className="text-lg font-semibold text-foreground mb-4">Acceso Rápido</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { href: "/admin/tenants", label: "Ver todos los Tenants", icon: Building2 },
                        { href: "/admin/users", label: "Gestionar Usuarios", icon: Users },
                        { href: "/admin/plans", label: "Administrar Planes", icon: CreditCard },
                    ].map(({ href, label, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className="flex items-center gap-3 bg-card border border-border hover:border-primary/50 hover:bg-accent/30 rounded-xl p-4 text-muted-foreground hover:text-foreground transition-all group shadow-sm"
                        >
                            <Icon size={20} className="text-primary group-hover:scale-110 transition-transform" />
                            <span className="font-medium text-sm">{label}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
