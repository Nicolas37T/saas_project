"use client";

import { useEffect, useState } from "react";
import { adminApi, publicApi, Subscription, Plan } from "@/lib/api";
import { FileText, AlertTriangle, CheckCircle, XCircle, Clock, Settings2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { color: string; icon: React.ElementType; label: string }> = {
        active: { color: "text-emerald-500 bg-emerald-500/10", icon: CheckCircle, label: "Activa" },
        suspended: { color: "text-destructive bg-destructive/10", icon: XCircle, label: "Suspendida" },
        trialing: { color: "text-amber-500 bg-amber-500/10", icon: Clock, label: "Trial" },
        past_due: { color: "text-orange-500 bg-orange-500/10", icon: AlertTriangle, label: "Vencida" },
    };
    const s = map[status] ?? { color: "text-muted-foreground bg-muted", icon: Clock, label: status };
    const Icon = s.icon;
    return (
        <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full w-fit uppercase tracking-wider ${s.color}`}>
            <Icon size={10} /> {s.label}
        </span>
    );
}

export default function SubscriptionsPage() {
    const [subs, setSubs] = useState<Subscription[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([
            adminApi.getSubscriptions(),
            publicApi.getPlans()
        ])
            .then(([subsData, plansData]) => {
                setSubs(subsData);
                setPlans(plansData);
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    function formatDate(iso: string) {
        return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
    }

    async function updateSub(subId: string, field: "status" | "plan_id", value: string) {
        setActionLoading(subId);
        try {
            const result = await adminApi.updateSubscription(subId, { [field]: value });
            setSubs(prev => prev.map(s => {
                if (s.id === subId) {
                    if (field === "status") return { ...s, status: result.status };
                    if (field === "plan_id") {
                        const newPlan = plans.find(p => p.id === result.plan_id);
                        return { ...s, plan_id: result.plan_id, plan_name: newPlan ? newPlan.name : s.plan_name };
                    }
                }
                return s;
            }));
        } catch (e: any) {
            setError(e.message);
        } finally {
            setActionLoading(null);
        }
    }

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 bg-background min-h-screen">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <FileText className="text-primary" />
                        Suscripciones
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {subs.length} suscripción{subs.length !== 1 ? "es" : ""} en total
                    </p>
                </div>
            </div>

            {error && (
                <div className="mb-6 flex items-center gap-2 text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-4">
                    <AlertTriangle size={18} /> <span>{error}</span>
                </div>
            )}

            {/* Desktop View */}
            <div className="hidden md:block bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/30 text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
                                <th className="text-left px-6 py-4">ID</th>
                                <th className="text-left px-6 py-4">Negocio</th>
                                <th className="text-left px-6 py-4">Plan</th>
                                <th className="text-left px-6 py-4">Estado</th>
                                <th className="text-left px-6 py-4">Inicio</th>
                                <th className="text-left px-6 py-4">Vencimiento</th>
                                <th className="text-right px-6 py-4">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading
                                ? Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-16" /></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-32" /></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-24" /></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-20" /></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-24" /></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-24" /></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-16" /></td>
                                    </tr>
                                ))
                                : subs.map((s) => (
                                    <tr key={s.id} className="hover:bg-muted/30 transition-colors text-card-foreground">
                                        <td className="px-6 py-4 font-mono text-[10px] text-muted-foreground" title={s.id}>
                                            {s.id.slice(0, 8)}…
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold">{s.tenant_name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                className="bg-background text-primary text-[11px] rounded-lg border border-primary/20 px-2 py-1 font-bold outline-none hover:border-primary/50 transition-all cursor-pointer"
                                                value={s.plan_id}
                                                onChange={(e) => updateSub(s.id, "plan_id", e.target.value)}
                                                disabled={actionLoading === s.id}
                                            >
                                                <option value="" disabled>Plan...</option>
                                                {plans.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-6 py-4"><StatusBadge status={s.status} /></td>
                                        <td className="px-6 py-4 text-muted-foreground text-xs">{formatDate(s.start_date)}</td>
                                        <td className="px-6 py-4 text-muted-foreground text-xs">{formatDate(s.end_date)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <select
                                                    className="bg-muted text-foreground text-[11px] rounded-lg border border-border px-2 py-1 font-medium outline-none focus:ring-1 focus:ring-primary/30 transition-all cursor-pointer"
                                                    value={s.status}
                                                    onChange={(e) => updateSub(s.id, "status", e.target.value)}
                                                    disabled={actionLoading === s.id}
                                                >
                                                    <option value="active">Activa</option>
                                                    <option value="suspended">Suspendida</option>
                                                    <option value="trialing">Trial</option>
                                                    <option value="past_due">Vencida</option>
                                                </select>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                {!loading && subs.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground">
                        <FileText size={48} className="mx-auto mb-4 opacity-10" />
                        <p className="text-lg font-medium">No hay suscripciones registradas</p>
                    </div>
                )}
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse space-y-3">
                            <div className="flex justify-between">
                                <div className="h-4 bg-muted rounded w-1/3" />
                                <div className="h-4 bg-muted rounded w-1/4" />
                            </div>
                            <div className="h-4 bg-muted rounded w-1/2" />
                            <div className="h-8 bg-muted rounded w-full mt-2" />
                        </div>
                    ))
                ) : subs.map(s => (
                    <div key={s.id} className="bg-card border border-border rounded-xl p-4 space-y-4 shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="font-semibold text-foreground">{s.tenant_name}</div>
                                <div className="font-mono text-[10px] text-muted-foreground mt-1">ID: {s.id.slice(0, 8)}…</div>
                            </div>
                            <StatusBadge status={s.status} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                                <div className="text-muted-foreground mb-1">Inicio</div>
                                <div className="font-medium">{formatDate(s.start_date)}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground mb-1">Vencimiento</div>
                                <div className="font-medium">{formatDate(s.end_date)}</div>
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-3 pt-3 border-t border-border/50">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground font-medium">Plan</span>
                                <select
                                    className="bg-background text-primary text-[11px] rounded-lg border border-primary/20 px-2 py-1.5 font-bold outline-none hover:border-primary/50 transition-all cursor-pointer"
                                    value={s.plan_id}
                                    onChange={(e) => updateSub(s.id, "plan_id", e.target.value)}
                                    disabled={actionLoading === s.id}
                                >
                                    <option value="" disabled>Plan...</option>
                                    {plans.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground font-medium">Estado</span>
                                <select
                                    className="bg-muted text-foreground text-[11px] rounded-lg border border-border px-2 py-1.5 font-medium outline-none focus:ring-1 focus:ring-primary/30 transition-all cursor-pointer"
                                    value={s.status}
                                    onChange={(e) => updateSub(s.id, "status", e.target.value)}
                                    disabled={actionLoading === s.id}
                                >
                                    <option value="active">Activa</option>
                                    <option value="suspended">Suspendida</option>
                                    <option value="trialing">Trial</option>
                                    <option value="past_due">Vencida</option>
                                </select>
                            </div>
                        </div>
                    </div>
                ))}
                
                {!loading && subs.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground bg-card border border-border rounded-xl">
                        <FileText size={32} className="mx-auto mb-2 opacity-10" />
                        <p className="text-sm font-medium">No hay suscripciones registradas</p>
                    </div>
                )}
            </div>
        </div>
    );
}
