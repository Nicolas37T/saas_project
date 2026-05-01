"use client";

import { useEffect, useState } from "react";
import { adminApi, publicApi, Subscription, Plan } from "@/lib/api";
import {
    FileText,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    RefreshCw,
    CalendarClock,
    Building2,
    TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/custom-modal";

/* ─── Status Badge ─── */
function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { color: string; icon: React.ElementType; label: string }> = {
        active: { color: "text-emerald-500 bg-emerald-500/10", icon: CheckCircle, label: "Activa" },
        suspended: { color: "text-destructive bg-destructive/10", icon: XCircle, label: "Suspendida" },
        trialing: { color: "text-amber-500 bg-amber-500/10", icon: Clock, label: "Trial" },
        past_due: { color: "text-orange-500 bg-orange-500/10", icon: AlertTriangle, label: "Vencida" },
        canceled: { color: "text-gray-500 bg-gray-500/10", icon: XCircle, label: "Cancelada" },
    };
    const s = map[status] ?? { color: "text-muted-foreground bg-muted", icon: Clock, label: status };
    const Icon = s.icon;
    return (
        <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full w-fit uppercase tracking-wider ${s.color}`}>
            <Icon size={10} /> {s.label}
        </span>
    );
}

/* ─── Expiration Badge ─── */
function ExpirationBadge({ endDate }: { endDate: string }) {
    const end = new Date(endDate);
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive uppercase tracking-wider">
                <AlertTriangle size={10} /> Vencida hace {Math.abs(diffDays)}d
            </span>
        );
    }
    if (diffDays <= 7) {
        return (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 uppercase tracking-wider">
                <CalendarClock size={10} /> Vence en {diffDays}d
            </span>
        );
    }
    return (
        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 uppercase tracking-wider">
            <CalendarClock size={10} /> {diffDays}d restantes
        </span>
    );
}

/* ─── Summary Cards ─── */
function SummaryCards({ subs }: { subs: Subscription[] }) {
    const active = subs.filter(s => s.status === "active").length;
    const suspended = subs.filter(s => s.status === "suspended").length;
    const now = new Date();
    const expiringSoon = subs.filter(s => {
        const end = new Date(s.end_date);
        const diff = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diff > 0 && diff <= 7;
    }).length;
    const mrr = subs
        .filter(s => s.status === "active")
        .reduce((acc, s) => acc + (s.plan_price || 0), 0);

    const cards = [
        { label: "Activas", value: active, icon: CheckCircle, color: "text-emerald-500 bg-emerald-500/10" },
        { label: "Suspendidas", value: suspended, icon: XCircle, color: "text-destructive bg-destructive/10" },
        { label: "Por vencer (7d)", value: expiringSoon, icon: CalendarClock, color: "text-amber-500 bg-amber-500/10" },
        { label: "MRR", value: `$${mrr.toFixed(2)}`, icon: TrendingUp, color: "text-blue-500 bg-blue-500/10" },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cards.map(c => {
                const Icon = c.icon;
                return (
                    <div key={c.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 shadow-sm">
                        <div className={`p-2.5 rounded-lg ${c.color}`}>
                            <Icon size={18} />
                        </div>
                        <div>
                            <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{c.label}</div>
                            <div className="text-xl font-bold text-foreground">{c.value}</div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ─── Main Page ─── */
export default function SubscriptionsPage() {
    const [subs, setSubs] = useState<Subscription[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Confirm modal
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmData, setConfirmData] = useState<{
        title: string;
        message: React.ReactNode;
        onConfirm: () => void;
        variant?: "danger" | "primary";
        confirmText?: string;
    } | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [subsData, plansData] = await Promise.all([
                adminApi.getSubscriptions(),
                publicApi.getPlans()
            ]);
            setSubs(subsData);
            setPlans(plansData);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    function formatDate(iso: string) {
        return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
    }

    function showSuccess(msg: string) {
        setSuccess(msg);
        setTimeout(() => setSuccess(""), 4000);
    }

    /* ─── Status Change with Confirmation ─── */
    function handleStatusChange(sub: Subscription, newStatus: string) {
        if (newStatus === sub.status) return;

        const statusLabels: Record<string, string> = {
            active: "Activa",
            suspended: "Suspendida",
            trialing: "Trial",
            past_due: "Vencida",
        };

        setConfirmData({
            title: "Cambiar Estado de Suscripción",
            message: (
                <span>
                    ¿Cambiar la suscripción de <strong>{sub.tenant_name}</strong> a{" "}
                    <strong>{statusLabels[newStatus] || newStatus}</strong>?
                    {(newStatus === "suspended" || newStatus === "canceled") && (
                        <span className="block mt-2 text-sm text-destructive">
                            ⚠️ El tenant también será suspendido y no podrá acceder al sistema.
                        </span>
                    )}
                    {newStatus === "active" && sub.status === "suspended" && (
                        <span className="block mt-2 text-sm text-emerald-600">
                            ✅ El tenant será reactivado automáticamente.
                        </span>
                    )}
                </span>
            ),
            variant: (newStatus === "suspended" || newStatus === "canceled") ? "danger" : "primary",
            confirmText: "Confirmar cambio",
            onConfirm: () => updateSub(sub.id, "status", newStatus),
        });
        setConfirmOpen(true);
    }

    async function updateSub(subId: string, field: "status" | "plan_id", value: string) {
        setActionLoading(subId);
        try {
            const result = await adminApi.updateSubscription(subId, { [field]: value });
            // Reload all data to ensure coherence
            await loadData();
            showSuccess(`Suscripción actualizada: ${result.message}`);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setActionLoading(null);
        }
    }

    /* ─── Renew ─── */
    function handleRenew(sub: Subscription) {
        setConfirmData({
            title: "Renovar Suscripción",
            message: (
                <span>
                    ¿Renovar la suscripción de <strong>{sub.tenant_name}</strong> por <strong>+1 mes</strong>?
                    <span className="block mt-2 text-sm text-emerald-600">
                         El tenant será reactivado y la fecha de vencimiento se extenderá.
                    </span>
                </span>
            ),
            variant: "primary",
            confirmText: "Renovar",
            onConfirm: () => renewSub(sub.id),
        });
        setConfirmOpen(true);
    }

    async function renewSub(subId: string) {
        setActionLoading(subId);
        try {
            const result = await adminApi.renewSubscription(subId);
            await loadData();
            showSuccess(`${result.message} — Nuevo vencimiento: ${formatDate(result.end_date)}`);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setActionLoading(null);
        }
    }

    /* ─── Plan Change ─── */
    function handlePlanChange(sub: Subscription, newPlanId: string) {
        if (newPlanId === sub.plan_id) return;
        const newPlan = plans.find(p => p.id === newPlanId);

        setConfirmData({
            title: "Cambiar Plan",
            message: (
                <span>
                    ¿Cambiar el plan de <strong>{sub.tenant_name}</strong> de{" "}
                    <strong>{sub.plan_name}</strong> a <strong>{newPlan?.name || "nuevo plan"}</strong>?
                    <span className="block mt-2 text-sm text-muted-foreground">
                        El ciclo se reiniciará con la duración del nuevo plan.
                    </span>
                </span>
            ),
            variant: "primary",
            confirmText: "Cambiar plan",
            onConfirm: () => updateSub(sub.id, "plan_id", newPlanId),
        });
        setConfirmOpen(true);
    }

    return (
        <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500 bg-background min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <FileText className="text-primary" />
                        Suscripciones
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {subs.length} suscripción{subs.length !== 1 ? "es" : ""} en total
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="gap-2 self-start">
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    Actualizar
                </Button>
            </div>

            {/* Alerts */}
            {error && (
                <div className="flex items-center gap-2 text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-4">
                    <AlertTriangle size={18} />
                    <span className="flex-1">{error}</span>
                    <button onClick={() => setError("")} className="text-destructive/60 hover:text-destructive text-lg font-bold">×</button>
                </div>
            )}
            {success && (
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 animate-in fade-in duration-300">
                    <CheckCircle size={18} />
                    <span className="flex-1">{success}</span>
                </div>
            )}

            {/* Summary Cards */}
            {!loading && <SummaryCards subs={subs} />}

            {/* Desktop Table */}
            <div className="hidden md:block bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/30 text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
                                <th className="text-left px-5 py-4">Negocio</th>
                                <th className="text-left px-5 py-4">Plan</th>
                                <th className="text-left px-5 py-4">Estado Sub.</th>
                                <th className="text-left px-5 py-4">Estado Tenant</th>
                                <th className="text-left px-5 py-4">Inicio</th>
                                <th className="text-left px-5 py-4">Vencimiento</th>
                                <th className="text-right px-5 py-4">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading
                                ? Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {Array.from({ length: 7 }).map((_, j) => (
                                            <td key={j} className="px-5 py-4"><div className="h-4 bg-muted rounded w-20" /></td>
                                        ))}
                                    </tr>
                                ))
                                : subs.map((s) => (
                                    <tr key={s.id} className="hover:bg-muted/30 transition-colors text-card-foreground">
                                        <td className="px-5 py-4">
                                            <div className="font-semibold flex items-center gap-2">
                                                <Building2 size={14} className="text-muted-foreground" />
                                                {s.tenant_name}
                                            </div>
                                            <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                                                ID: {s.id.slice(0, 8)}…
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <select
                                                className="bg-background text-primary text-[11px] rounded-lg border border-primary/20 px-2 py-1 font-bold outline-none hover:border-primary/50 transition-all cursor-pointer"
                                                value={s.plan_id}
                                                onChange={(e) => handlePlanChange(s, e.target.value)}
                                                disabled={actionLoading === s.id}
                                            >
                                                <option value="" disabled>Plan...</option>
                                                {plans.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name} (${p.price})</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-5 py-4"><StatusBadge status={s.status} /></td>
                                        <td className="px-5 py-4"><StatusBadge status={s.tenant_status} /></td>
                                        <td className="px-5 py-4 text-muted-foreground text-xs">{formatDate(s.start_date)}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs text-muted-foreground">{formatDate(s.end_date)}</span>
                                                <ExpirationBadge endDate={s.end_date} />
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <select
                                                    className="bg-muted text-foreground text-[11px] rounded-lg border border-border px-2 py-1 font-medium outline-none focus:ring-1 focus:ring-primary/30 transition-all cursor-pointer"
                                                    value={s.status}
                                                    onChange={(e) => handleStatusChange(s, e.target.value)}
                                                    disabled={actionLoading === s.id}
                                                >
                                                    <option value="active">Activa</option>
                                                    <option value="suspended">Suspendida</option>
                                                    <option value="trialing">Trial</option>
                                                    <option value="past_due">Vencida</option>
                                                </select>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-emerald-600 hover:text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/30 gap-1 text-[11px] h-7 px-2"
                                                    disabled={actionLoading === s.id}
                                                    onClick={() => handleRenew(s)}
                                                >
                                                    <RefreshCw size={12} />
                                                    Renovar
                                                </Button>
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
                                <div className="font-semibold text-foreground flex items-center gap-2">
                                    <Building2 size={14} className="text-muted-foreground" />
                                    {s.tenant_name}
                                </div>
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
                                <div className="mt-1"><ExpirationBadge endDate={s.end_date} /></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                                <div className="text-muted-foreground mb-1">Estado Suscripción</div>
                                <StatusBadge status={s.status} />
                            </div>
                            <div>
                                <div className="text-muted-foreground mb-1">Estado Tenant</div>
                                <StatusBadge status={s.tenant_status} />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 pt-3 border-t border-border/50">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground font-medium">Plan</span>
                                <select
                                    className="bg-background text-primary text-[11px] rounded-lg border border-primary/20 px-2 py-1.5 font-bold outline-none hover:border-primary/50 transition-all cursor-pointer"
                                    value={s.plan_id}
                                    onChange={(e) => handlePlanChange(s, e.target.value)}
                                    disabled={actionLoading === s.id}
                                >
                                    <option value="" disabled>Plan...</option>
                                    {plans.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} (${p.price})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground font-medium">Estado</span>
                                <select
                                    className="bg-muted text-foreground text-[11px] rounded-lg border border-border px-2 py-1.5 font-medium outline-none focus:ring-1 focus:ring-primary/30 transition-all cursor-pointer"
                                    value={s.status}
                                    onChange={(e) => handleStatusChange(s, e.target.value)}
                                    disabled={actionLoading === s.id}
                                >
                                    <option value="active">Activa</option>
                                    <option value="suspended">Suspendida</option>
                                    <option value="trialing">Trial</option>
                                    <option value="past_due">Vencida</option>
                                </select>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="w-full text-emerald-600 hover:text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/30 gap-2"
                                disabled={actionLoading === s.id}
                                onClick={() => handleRenew(s)}
                            >
                                <RefreshCw size={14} />
                                Renovar (+1 mes)
                            </Button>
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

            {/* Confirm Modal */}
            {confirmData && (
                <ConfirmModal
                    isOpen={confirmOpen}
                    onClose={() => { setConfirmOpen(false); setConfirmData(null); }}
                    onConfirm={() => {
                        setConfirmOpen(false);
                        confirmData.onConfirm();
                        setConfirmData(null);
                    }}
                    title={confirmData.title}
                    message={confirmData.message}
                    confirmText={confirmData.confirmText || "Confirmar"}
                    variant={confirmData.variant || "primary"}
                />
            )}
        </div>
    );
}
