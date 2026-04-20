"use client";

import { useEffect, useState } from "react";
import { adminApi, Tenant } from "@/lib/api";
import { Building2, AlertTriangle, CheckCircle, XCircle, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/custom-modal";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default function TenantsPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

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
        setSelectedTenant(t);
        setIsDeleteConfirmOpen(true);
    }

    async function confirmDelete() {
        if (!selectedTenant) return;
        setIsDeleteConfirmOpen(false);
        setActionLoading(selectedTenant.id);
        try {
            await adminApi.deleteTenant(selectedTenant.id);
            setTenants((prev) => prev.filter((x) => x.id !== selectedTenant.id));
        } catch (e: any) {
            setError(e.message);
        } finally {
            setActionLoading(null);
            setSelectedTenant(null);
        }
    }

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <Building2 className="text-primary" />
                        Tenants
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {tenants.length} negocio{tenants.length !== 1 ? "s" : ""} registrado{tenants.length !== 1 ? "s" : ""}
                    </p>
                </div>
            </div>

            {error && (
                <div className="mb-6 flex items-center gap-2 text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-4">
                    <AlertTriangle size={18} />
                    <span>{error}</span>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-card border border-border rounded-2xl p-6 space-y-4">
                            <div className="h-6 bg-muted rounded w-2/3" />
                            <div className="h-4 bg-muted rounded w-1/2" />
                            <div className="h-10 bg-muted rounded w-full mt-4" />
                        </div>
                    ))}
                </div>
            ) : tenants.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground bg-muted/20 border-dashed border border-border rounded-xl">
                    <Building2 size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-lg font-medium text-foreground">Aún no hay tenants registrados</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tenants.map((t) => (
                        <Card key={t.id} className="relative overflow-hidden hover:border-primary/50 transition-all shadow-sm">
                            <CardContent className="p-5 flex flex-col justify-between h-full">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-foreground text-lg">{t.business_name}</h3>
                                        {t.status === "active" ? (
                                            <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-500 text-xs font-semibold px-2 py-1 rounded-full">
                                                <CheckCircle size={12} /> Activo
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 bg-destructive/10 text-destructive text-xs font-semibold px-2 py-1 rounded-full">
                                                <XCircle size={12} /> Suspendido
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs font-mono text-muted-foreground mb-4">{t.subdomain}.tuapp.com</p>
                                    
                                    <div className="text-sm font-medium mb-1">Plan Acual</div>
                                    {t.plan ? (
                                        <span className="inline-block px-2 py-1 mb-4 rounded border border-primary/30 text-xs font-bold text-primary bg-primary/10">
                                            {t.plan.name}
                                        </span>
                                    ) : (
                                        <span className="inline-block px-2 py-1 mb-4 rounded border text-xs font-medium text-muted-foreground bg-muted">
                                            Sin plan
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border">
                                    <Link href={`/admin/tenants/${t.id}`} className="w-full">
                                        <Button size="sm" variant="outline" className="w-full text-muted-foreground hover:text-foreground">
                                            <Eye size={16} />
                                        </Button>
                                    </Link>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={actionLoading === t.id}
                                        onClick={() => toggleStatus(t)}
                                        className={`w-full ${t.status === "active"
                                            ? "text-yellow-600 hover:text-yellow-600 hover:bg-yellow-600/10"
                                            : "text-emerald-500 hover:text-emerald-500 hover:bg-emerald-500/10"
                                            }`}
                                    >
                                        {actionLoading === t.id ? "..." : t.status === "active" ? "Pausar" : "Activar"}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={actionLoading === t.id}
                                        onClick={() => deleteTenant(t)}
                                        className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <ConfirmModal
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={confirmDelete}
                title="¿Eliminar negocio?"
                message={
                    <span>
                        ¿Estás seguro de que deseas eliminar el negocio <strong>{selectedTenant?.business_name}</strong>? Esta acción es irreversible y se perderán todos los datos asociados del sistema.
                    </span>
                }
                confirmText="Sí, eliminar"
                variant="danger"
                icon={<Trash2 size={24} className="text-destructive" />}
            />
        </div>
    );
}
