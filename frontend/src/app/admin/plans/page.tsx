"use client";

import { useEffect, useState } from "react";
import { adminApi, Plan } from "@/lib/api";
import { CreditCard, AlertTriangle, Plus, Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomModal, ConfirmModal } from "@/components/ui/custom-modal";

export default function PlansPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    
    // Modal states
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);

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

    const openCreate = () => {
        setEditingPlan(null);
        setForm({ name: "", price: "", billing_cycle: "monthly", max_users: "5" });
        setIsFormModalOpen(true);
    };

    const openEdit = (plan: Plan) => {
        setEditingPlan(plan);
        setForm({ 
            name: plan.name, 
            price: plan.price.toString(), 
            billing_cycle: plan.billing_cycle, 
            max_users: plan.max_users ? plan.max_users.toString() : "5" 
        });
        setIsFormModalOpen(true);
    };

    const openDelete = (plan: Plan) => {
        setPlanToDelete(plan);
        setIsDeleteModalOpen(true);
    };

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setIsSaving(true);
        setError("");
        try {
            const data = {
                name: form.name,
                price: parseFloat(form.price),
                billing_cycle: form.billing_cycle,
                max_users: parseInt(form.max_users),
            };

            if (editingPlan) {
                const updatedPlan = await adminApi.updatePlan(editingPlan.id, data);
                setPlans(plans.map(p => p.id === updatedPlan.id ? updatedPlan : p));
            } else {
                const newPlan = await adminApi.createPlan(data);
                setPlans((prev) => [...prev, newPlan]);
            }
            setIsFormModalOpen(false);
        } catch (e: any) {
            setError(e.message || "Error al guardar el plan");
            // Automatically clear error after 5s
            setTimeout(() => setError(""), 5000);
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete() {
        if (!planToDelete) return;
        setIsDeleting(true);
        setError("");
        try {
            await adminApi.deletePlan(planToDelete.id);
            setPlans(plans.filter(p => p.id !== planToDelete.id));
            setIsDeleteModalOpen(false);
            setPlanToDelete(null);
        } catch (e: any) {
            setError(e.message || "Error al eliminar el plan");
            setIsDeleteModalOpen(false);
            // Mostrar error brevemente arriba
            setTimeout(() => setError(""), 6000);
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <CreditCard className="text-primary" />
                        Gestión de Planes
                    </h1>
                    <p className="text-muted-foreground mt-1">Configura los límites y precios de los planes suscritos.</p>
                </div>
                <Button
                    onClick={openCreate}
                    className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl transition-all shadow-lg font-medium"
                >
                    <Plus size={18} />
                    Nuevo Plan
                </Button>
            </div>

            {error && (
                <div className="mb-6 flex items-center gap-2 text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-4 animate-in fade-in slide-in-from-top-4">
                    <AlertTriangle size={18} className="flex-shrink-0" /> 
                    <span className="font-medium text-sm">{error}</span>
                </div>
            )}

            {/* Plans Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
                            <div className="h-6 bg-muted rounded w-2/3" />
                            <div className="h-10 bg-muted rounded w-1/3" />
                            <div className="h-4 bg-muted rounded w-1/2" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map((p) => (
                        <Card key={p.id} className="relative overflow-hidden hover:border-primary/50 transition-all shadow-sm group">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xl flex justify-between items-center">
                                    <span>{p.name}</span>
                                </CardTitle>
                                <p className="text-4xl font-extrabold text-primary mt-2">
                                    ${p.price}
                                    <span className="text-base text-muted-foreground font-medium ml-1">
                                        /{p.billing_cycle === "monthly" ? "mes" : "año"}
                                    </span>
                                </p>
                            </CardHeader>
                            <CardContent>
                                <div className="mt-4 space-y-2 text-sm text-foreground/80 font-medium bg-muted/30 p-3 rounded-lg border border-border/50">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        <p>Límite de {p.max_users} usuarios</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        <p>Base de datos independiente</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-6">
                                    <Button 
                                        variant="outline" 
                                        className="flex-1 border-border bg-transparent hover:bg-accent focus:ring-0 gap-2"
                                        onClick={() => openEdit(p)}
                                    >
                                        <Pencil size={15} className="text-blue-500" /> Editar
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="flex-1 border-border bg-transparent hover:bg-destructive/10 focus:ring-0 gap-2 text-destructive hover:text-destructive"
                                        onClick={() => openDelete(p)}
                                    >
                                        <Trash2 size={15} /> Borrar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {!loading && plans.length === 0 && (
                <div className="text-center py-20 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border">
                    <CreditCard size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium text-foreground">No hay planes configurados</p>
                    <p className="text-sm">Agrega tu primer plan desde el botón superior.</p>
                </div>
            )}

            {/* Form Modal */}
            <CustomModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={editingPlan ? "Editar Plan" : "Crear Nuevo Plan"}
            >
                <div className="text-sm text-muted-foreground">Ajusta los detalles de precios y límites del servicio.</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Nombre del Plan</Label>
                        <Input
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Ej: Plan Pro"
                            className="bg-background"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Precio (USD)</Label>
                        <Input
                            required
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.price}
                            onChange={(e) => setForm({ ...form, price: e.target.value })}
                            placeholder="Ej: 29.99"
                            className="bg-background"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Ciclo de Facturación</Label>
                        <select
                            value={form.billing_cycle}
                            onChange={(e) => setForm({ ...form, billing_cycle: e.target.value })}
                            className="w-full flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="monthly">Mensual</option>
                            <option value="yearly">Anual</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label>Límite de Usuarios Activos</Label>
                        <Input
                            required
                            type="number"
                            min="1"
                            value={form.max_users}
                            onChange={(e) => setForm({ ...form, max_users: e.target.value })}
                            placeholder="Ej: 5"
                            className="bg-background"
                        />
                    </div>
                </div>
                <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-border/50">
                    <Button variant="ghost" onClick={() => setIsFormModalOpen(false)} disabled={isSaving}>
                        Cancelar
                    </Button>
                    <Button onClick={(e) => handleSave(e as any)} disabled={isSaving}>
                        {isSaving ? "Guardando..." : "Guardar Plan"}
                    </Button>
                </div>
            </CustomModal>

            {/* Delete Modal */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="¿Eliminar Plan?"
                message={`Estás a punto de eliminar el plan "${planToDelete?.name}". Esto fallará si existen clínicas utilizando este plan actualmente. ¿Estás seguro?`}
                confirmText={isDeleting ? "Eliminando..." : "Eliminar Definitivamente"}
                onConfirm={handleDelete as any}
                variant="danger"
            />
        </div>
    );
}
