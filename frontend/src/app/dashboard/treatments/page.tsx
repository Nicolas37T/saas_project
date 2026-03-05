"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Stethoscope, Plus, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dentalApi, DentalTreatment } from "@/lib/api";

export default function TreatmentsCatalogPage() {
    const router = useRouter();
    const [treatments, setTreatments] = useState<DentalTreatment[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("user_role");
        if (!token || role !== "owner") { router.push("/login"); return; }
        load();
    }, [router]);

    async function load() {
        try { setTreatments(await dentalApi.getTreatments()); }
        catch (err: unknown) { setError(err instanceof Error ? err.message : "Error"); }
        finally { setLoading(false); }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true); setError("");
        try {
            await dentalApi.createTreatment({ name, description: description || undefined, price: parseFloat(price) || 0 });
            setName(""); setDescription(""); setPrice("");
            await load();
        } catch (err: unknown) { setError(err instanceof Error ? err.message : "Error"); }
        finally { setSubmitting(false); }
    }

    async function handleDelete(id: string) {
        try { await dentalApi.deleteTreatment(id); setTreatments(treatments.filter(t => t.id !== id)); }
        catch (err: unknown) { setError(err instanceof Error ? err.message : "Error"); }
    }

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-12 h-12 rounded-full border-4 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-300">
            <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white"><Stethoscope size={18} /></div>
                        <span className="text-white font-semibold text-lg">Catálogo de Tratamientos</span>
                    </div>
                    <Button variant="outline" size="sm" className="bg-transparent border-slate-700 hover:bg-slate-800 text-white" onClick={() => router.push("/dashboard")}>
                        <ArrowLeft size={16} className="mr-1" /> Dashboard
                    </Button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
                {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Plus size={20} /> Agregar Tratamiento</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <Label className="text-slate-400">Nombre *</Label>
                            <Input value={name} onChange={e => setName(e.target.value)} required className="bg-slate-800 border-slate-700 text-white" placeholder="Ej: Limpieza dental" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-slate-400">Descripción</Label>
                            <Input value={description} onChange={e => setDescription(e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="Opcional" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-slate-400">Precio (Bs)</Label>
                            <Input type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="0.00" />
                        </div>
                    </div>
                    <Button type="submit" disabled={submitting || !name} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
                        {submitting ? "Guardando..." : "Guardar"}
                    </Button>
                </form>

                <div>
                    <h2 className="text-xl font-bold text-white mb-4">Tratamientos ({treatments.length})</h2>
                    {treatments.length === 0 ? (
                        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-500">No hay tratamientos registrados.</div>
                    ) : (
                        <div className="space-y-2">
                            {treatments.map(t => (
                                <div key={t.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-medium">{t.name}</h3>
                                        {t.description && <p className="text-slate-500 text-sm">{t.description}</p>}
                                    </div>
                                    <div className="flex items-center gap-4 ml-4">
                                        <span className="text-emerald-400 font-semibold">Bs {t.price.toFixed(2)}</span>
                                        <button onClick={() => handleDelete(t.id)} className="text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
