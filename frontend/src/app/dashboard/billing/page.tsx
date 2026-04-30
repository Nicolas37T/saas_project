"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Clock, CreditCard, Loader2 } from "lucide-react";
import { API_BASE } from "@/lib/api";

export default function BillingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<any>(null);
    const [renewing, setRenewing] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        async function fetchStatus() {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");
                const subdomain = localStorage.getItem("tenant_subdomain") || "";

                if (!token || !subdomain) {
                    router.push("/login");
                    return;
                }

                const res = await fetch(`${API_BASE}/api/tenant/billing/status`, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "X-Tenant": subdomain
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    setStatus(data);
                } else if (res.status === 401) {
                    router.push("/login");
                }
            } catch (err) {
                console.error("Error fetching billing status:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchStatus();
    }, [router]);

    const handleRenew = async () => {
        try {
            setRenewing(true);
            setMessage(null);
            const token = localStorage.getItem("token");
            const subdomain = localStorage.getItem("tenant_subdomain") || "";

            const res = await fetch(`${API_BASE}/api/tenant/billing/renew`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "X-Tenant": subdomain
                }
            });

            const data = await res.json();
            if (res.ok) {
                setMessage({ type: 'success', text: "¡Suscripción renovada con éxito! Ya puedes volver al panel." });
                // Actualizar status localmente
                setStatus((prev: any) => ({ ...prev, status: 'active', end_date: data.new_end_date }));
                // Opcional: Redirigir al dashboard después de unos segundos
                setTimeout(() => router.push("/dashboard"), 2000);
            } else {
                setMessage({ type: 'error', text: data.detail || "Error al renovar la suscripción." });
            }
        } catch (err) {
            setMessage({ type: 'error', text: "Error de conexión con el servidor." });
        } finally {
            setRenewing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const isSuspended = status?.status === "suspended";
    const expirationDate = status?.end_date ? new Date(status.end_date).toLocaleDateString() : "No disponible";

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Mi Suscripción</h1>
                    <p className="text-muted-foreground mt-1">Gestiona el estado de tu cuenta y facturación.</p>
                </div>
            </div>

            {isSuspended && (
                <Card className="border-destructive/50 bg-destructive/5 dark:bg-destructive/10">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-destructive flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            Cuenta Suspendida
                        </CardTitle>
                        <CardDescription className="text-destructive/80">
                            Tu acceso ha sido restringido por falta de pago o vencimiento del plan.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm font-medium">
                            Tu plan venció el día: <span className="underline">{expirationDate}</span>
                        </p>
                    </CardContent>
                </Card>
            )}

            {!isSuspended && status && (
                <Card className="border-green-500/50 bg-green-500/5 dark:bg-green-500/10">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-green-600 dark:text-green-400 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5" />
                            Suscripción Activa
                        </CardTitle>
                        <CardDescription className="text-green-600/80 dark:text-green-400/80">
                            Tu cuenta se encuentra al día y tienes acceso completo.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm font-medium">
                            Próximo vencimiento: <span className="font-bold">{expirationDate}</span>
                        </p>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-primary" />
                            Renovación de Plan
                        </CardTitle>
                        <CardDescription>
                            Extiende tu suscripción por 30 días adicionales.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <div className="space-y-4">
                            <div className="p-4 bg-muted rounded-xl border border-border">
                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Costo Mensual</p>
                                <p className="text-3xl font-bold mt-1">Bs. 30.00 <span className="text-sm font-normal text-muted-foreground">/ mes</span></p>
                            </div>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-primary" /> Acceso total a la plataforma
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-primary" /> Soporte prioritario
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-primary" /> Sin límites de registros
                                </li>
                            </ul>
                        </div>
                    </CardContent>
                    <CardFooter className="pt-6">
                        <Button 
                            className="w-full" 
                            size="lg" 
                            onClick={handleRenew} 
                            disabled={renewing}
                        >
                            {renewing ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</>
                            ) : (
                                "Pagar y Renovar Ahora"
                            )}
                        </Button>
                    </CardFooter>
                </Card>

                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary" />
                            Historial de Pagos
                        </CardTitle>
                        <CardDescription>
                            Consulta tus transacciones recientes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex items-center justify-center text-center p-8">
                        <div className="space-y-2">
                            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                                <CreditCard size={24} />
                            </div>
                            <p className="text-sm text-muted-foreground">No hay facturas generadas todavía.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {message && (
                <div className={`p-4 rounded-xl border animate-in zoom-in-95 duration-200 ${
                    message.type === 'success' ? 'bg-green-500/10 border-green-500 text-green-700 dark:text-green-400' : 'bg-red-500/10 border-red-500 text-red-700 dark:text-red-400'
                }`}>
                    <p className="text-sm font-semibold flex items-center gap-2">
                        {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        {message.text}
                    </p>
                </div>
            )}
        </div>
    );
}
