"use client";

import { useEffect, useState } from "react";
import { adminApi, publicApi, Subscription, Plan } from "@/lib/api";
import { FileText, AlertTriangle, CheckCircle, XCircle, Clock, Settings2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { color: string; icon: React.ElementType; label: string }> = {
        active: { color: "text-emerald-400 bg-emerald-400/10", icon: CheckCircle, label: "Activa" },
        canceled: { color: "text-red-400 bg-red-400/10", icon: XCircle, label: "Cancelada" },
        trialing: { color: "text-yellow-400 bg-yellow-400/10", icon: Clock, label: "Trial" },
    };
    const s = map[status] ?? { color: "text-slate-400 bg-slate-700", icon: Clock, label: status };
    const Icon = s.icon;
    return (
        <span className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full w-fit ${s.color}`}>
            <Icon size={12} /> {s.label}
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
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <FileText className="text-blue-400" />
                    Suscripciones
                </h1>
                <p className="text-slate-400 mt-1">
                    {subs.length} suscripción{subs.length !== 1 ? "es" : ""} en total
                </p>
            </div>

            {error && (
                <div className="mb-6 flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-4">
                    <AlertTriangle size={18} /> <span>{error}</span>
                </div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-800 text-slate-400 uppercase text-xs tracking-wider">
                            <th className="text-left px-6 py-4">ID</th>
                            <th className="text-left px-6 py-4">Negocio</th>
                            <th className="text-left px-6 py-4">Plan</th>
                            <th className="text-left px-6 py-4">Estado</th>
                            <th className="text-left px-6 py-4">Inicio</th>
                            <th className="text-left px-6 py-4">Vencimiento</th>
                            <th className="text-right px-6 py-4">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading
                            ? Array.from({ length: 4 }).map((_, i) => (
                                <tr key={i} className="border-b border-slate-800/50 animate-pulse">
                                    {Array.from({ length: 5 }).map((_, j) => (
                                        <td key={j} className="px-6 py-4">
                                            <div className="h-4 bg-slate-800 rounded w-24" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                            : subs.map((s) => (
                                <tr key={s.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs text-slate-400" title={s.id}>{s.id.slice(0, 8)}…</td>
                                    <td className="px-6 py-4 text-white font-medium">{s.tenant_name}</td>
                                    <td className="px-6 py-4">
                                        <select
                                            className="bg-slate-800 text-indigo-300 text-xs rounded border border-indigo-500/30 p-1 font-semibold outline-none"
                                            value={s.plan_id}
                                            onChange={(e) => updateSub(s.id, "plan_id", e.target.value)}
                                            disabled={actionLoading === s.id}
                                        >
                                            <option value="" disabled>Selecciona un plan</option>
                                            {plans.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4"><StatusBadge status={s.status} /></td>
                                    <td className="px-6 py-4 text-slate-300">{formatDate(s.start_date)}</td>
                                    <td className="px-6 py-4 text-slate-300">{formatDate(s.end_date)}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <select
                                                className="bg-slate-800 text-slate-300 text-xs rounded border border-slate-700 p-1 outline-none"
                                                value={s.status}
                                                onChange={(e) => updateSub(s.id, "status", e.target.value)}
                                                disabled={actionLoading === s.id}
                                            >
                                                <option value="active">Activa</option>
                                                <option value="suspended">Suspendida</option>
                                                <option value="canceled">Cancelada</option>
                                                <option value="trialing">Trial</option>
                                                <option value="past_due">Vencida (Past Due)</option>
                                            </select>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>

                {!loading && subs.length === 0 && (
                    <div className="text-center py-16 text-slate-500">
                        <FileText size={40} className="mx-auto mb-3 opacity-30" />
                        <p>No hay suscripciones registradas aún</p>
                    </div>
                )}
            </div>
        </div>
    );
}
