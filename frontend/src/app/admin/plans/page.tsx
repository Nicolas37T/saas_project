"use client";

import { useEffect, useState } from "react";
import { adminApi, Plan } from "@/lib/api";
import { CreditCard, AlertTriangle, Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PlansPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ name: "", price: "", billing_cycle: "monthly", max_users: "5" });

    useEffect(() => {
        fetchPlans();
    }, []);

    async function fetchPlans() {
        setLoading(true);
        try {
            setPlans(await adminApi.getPlans());
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setCreating(true);
        setError("");
        try {
            const newPlan = await adminApi.createPlan({
                name: form.name,
                price: parseFloat(form.price),
                billing_cycle: form.billing_cycle,
                max_users: parseInt(form.max_users),
            });
            setPlans((prev) => [...prev, newPlan]);
            setForm({ name: "", price: "", billing_cycle: "monthly", max_users: "5" });
            setShowForm(false);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setCreating(false);
        }
    }

    return (
        <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <CreditCard className="text-blue-400" />
                        Planes
                    </h1>
                    <p className="text-slate-400 mt-1">{plans.length} plan{plans.length !== 1 ? "es" : ""} disponible{plans.length !== 1 ? "s" : ""}</p>
                </div>
                <Button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                    {showForm ? <X size={16} /> : <Plus size={16} />}
                    {showForm ? "Cancelar" : "Nuevo Plan"}
                </Button>
            </div>

            {error && (
                <div className="mb-6 flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-4">
                    <AlertTriangle size={18} /> <span>{error}</span>
                </div>
            )}

            {/* Form */}
            {showForm && (
                <form
                    onSubmit={handleCreate}
                    className="mb-8 bg-slate-900 border border-blue-500/30 rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                    <h2 className="md:col-span-2 text-white font-semibold text-lg">Crear Nuevo Plan</h2>
                    <div className="space-y-1.5">
                        <Label className="text-slate-400">Nombre del Plan</Label>
                        <Input
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Ej: Plan Pro"
                            className="bg-slate-800 border-slate-700 text-white"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-slate-400">Precio (USD/mes)</Label>
                        <Input
                            required
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.price}
                            onChange={(e) => setForm({ ...form, price: e.target.value })}
                            placeholder="29.00"
                            className="bg-slate-800 border-slate-700 text-white"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-slate-400">Ciclo de Facturación</Label>
                        <select
                            value={form.billing_cycle}
                            onChange={(e) => setForm({ ...form, billing_cycle: e.target.value })}
                            className="w-full rounded-md border border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm"
                        >
                            <option value="monthly">Mensual</option>
                            <option value="yearly">Anual</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-slate-400">Máx. Usuarios</Label>
                        <Input
                            required
                            type="number"
                            min="1"
                            value={form.max_users}
                            onChange={(e) => setForm({ ...form, max_users: e.target.value })}
                            className="bg-slate-800 border-slate-700 text-white"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <Button type="submit" disabled={creating} className="bg-blue-600 hover:bg-blue-700 w-full">
                            {creating ? <><Loader2 size={16} className="animate-spin mr-2" />Creando...</> : "Crear Plan"}
                        </Button>
                    </div>
                </form>
            )}

            {/* Plans Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
                            <div className="h-5 bg-slate-800 rounded w-2/3" />
                            <div className="h-8 bg-slate-800 rounded w-1/3" />
                            <div className="h-4 bg-slate-800 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {plans.map((p) => (
                        <div
                            key={p.id}
                            className="bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl p-6 transition-colors"
                        >
                            <h3 className="font-semibold text-white text-lg">{p.name}</h3>
                            <p className="text-3xl font-bold text-blue-400 mt-2">
                                ${p.price}
                                <span className="text-sm text-slate-500 font-normal">/{p.billing_cycle === "monthly" ? "mes" : "año"}</span>
                            </p>
                            <div className="mt-3 space-y-1 text-sm text-slate-400">
                                <p>👥 Hasta {p.max_users} usuarios</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && plans.length === 0 && (
                <div className="text-center py-16 text-slate-500">
                    <CreditCard size={40} className="mx-auto mb-3 opacity-30" />
                    <p>No hay planes configurados</p>
                </div>
            )}
        </div>
    );
}
