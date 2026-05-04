"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Clock, CreditCard, Loader2, Plus, MessageCircle } from "lucide-react";
import { API_BASE } from "@/lib/api";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";


const WHATSAPP_NUMBER = "59175934045";

function buildWhatsAppUrl(planName: string, planPrice: number, tenantName: string, action: "nuevo" | "renovar" | "cambio") {
    const messages: Record<string, string> = {
        nuevo: `Hola, acabo de registrarme en la plataforma y quiero activar mi plan.\n\n *Plan seleccionado:* ${planName}\n *Precio:* Bs. ${planPrice}\n *Negocio:* ${tenantName}\n\n¿Cómo puedo realizar el pago para activar mi cuenta?`,
        renovar: `Hola, quiero renovar mi suscripción actual.\n\n *Plan actual:* ${planName}\n *Precio:* Bs. ${planPrice}\n *Negocio:* ${tenantName}\n\n¿Cómo procedo con el pago?`,
        cambio: `Hola, me gustaría cambiar mi plan de suscripción.\n\n *Nuevo plan deseado:* ${planName}\n *Precio:* Bs. ${planPrice}\n *Negocio:* ${tenantName}\n\n¿Podrían ayudarme con el proceso de cambio y pago?`,
    };
    const text = encodeURIComponent(messages[action]);
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

export default function BillingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<any>(null);
    const [availablePlans, setAvailablePlans] = useState<any[]>([]);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const tenantName = typeof window !== "undefined" ? localStorage.getItem("tenant_subdomain") || "Mi Negocio" : "Mi Negocio";

    useEffect(() => {
        async function fetchBillingData() {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");
                const subdomain = localStorage.getItem("tenant_subdomain") || "";

                if (!token || !subdomain) {
                    router.push("/login");
                    return;
                }

                const [statusRes, plansRes] = await Promise.all([
                    fetch(`${API_BASE}/api/tenant/billing/status`, {
                        headers: { "Authorization": `Bearer ${token}`, "X-Tenant": subdomain }
                    }),
                    fetch(`${API_BASE}/api/tenant/billing/plans`, {
                        headers: { "Authorization": `Bearer ${token}`, "X-Tenant": subdomain }
                    })
                ]);

                if (statusRes.ok) setStatus(await statusRes.json());
                if (plansRes.ok) setAvailablePlans(await plansRes.json());

                if (statusRes.status === 401) router.push("/login");
            } catch (err) {
                console.error("Error fetching billing data:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchBillingData();
    }, [router]);

    const handleWhatsAppPlan = (plan: any, action: "renovar" | "cambio") => {
        const url = buildWhatsAppUrl(plan.name, plan.price, tenantName, action);
        window.open(url, "_blank");
        setMessage({ type: 'success', text: `Se abrió WhatsApp para coordinar tu ${action === "renovar" ? "renovación" : "cambio de plan"}. Nuestro equipo te responderá pronto.` });
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

    // Solo planes de pago, o el plan actual si es gratuito (para mostrar "Actual")
    const filteredPlans = availablePlans.filter(p => p.price > 0 || p.id === status?.plan_id);

    // Obtener datos del plan actual para el botón de renovar
    const currentPlan = availablePlans.find(p => p.id === status?.plan_id);

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Mi Suscripción</h1>
                    <p className="text-muted-foreground mt-1">Gestiona el estado de tu cuenta y facturación.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna Izquierda: Estado Actual */}
                <div className="lg:col-span-1 space-y-6">
                    {isSuspended ? (
                        <Card className="border-destructive/50 bg-destructive/5 dark:bg-destructive/10">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-destructive flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5" />
                                    Cuenta Suspendida
                                </CardTitle>
                                <CardDescription className="text-destructive/80">
                                    Acceso restringido por falta de pago.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm font-medium">
                                    Venció el: <span className="underline">{expirationDate}</span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Contacta a soporte por WhatsApp para reactivar tu cuenta.
                                </p>
                            </CardContent>
                            <CardFooter>
                                {currentPlan && (
                                    <Button 
                                        className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
                                        onClick={() => handleWhatsAppPlan(currentPlan, "renovar")}
                                    >
                                        <WhatsAppIcon size={18} />
                                        Contactar Soporte para Renovar
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    ) : (
                        <Card className="border-green-500/50 bg-green-500/5 dark:bg-green-500/10">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-green-600 dark:text-green-400 flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5" />
                                    Suscripción Activa
                                </CardTitle>
                                <CardDescription className="text-green-600/80 dark:text-green-400/80">
                                    Tu cuenta está al día.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <p className="text-sm">
                                    Plan: <span className="font-bold">{status?.plan_name}</span>
                                </p>
                                <p className="text-sm">
                                    Vence el: <span className="font-bold">{expirationDate}</span>
                                </p>
                            </CardContent>
                            <CardFooter>
                                {currentPlan && currentPlan.price > 0 && (
                                    <Button 
                                        className="w-full bg-green-600 hover:bg-green-700 text-white gap-2" 
                                        variant="default"
                                        onClick={() => handleWhatsAppPlan(currentPlan, "renovar")}
                                    >
                                        <WhatsAppIcon size={18} />
                                        Renovar por WhatsApp
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    )}

                    {/* Info de proceso de pago */}
                    <Card className="border-dashed">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <WhatsAppIcon className="w-4 h-4 text-green-600" />
                                ¿Cómo pagar?
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-muted-foreground">
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">1</div>
                                <p>Selecciona el plan que deseas.</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">2</div>
                                <p>Se abrirá WhatsApp con los datos de tu solicitud.</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">3</div>
                                <p>Coordina el pago con nuestro equipo de soporte.</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 text-xs font-bold flex-shrink-0">✓</div>
                                <p>Tu plan se activará una vez confirmado el pago.</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Clock className="w-5 h-5 text-primary" />
                                Historial
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-center py-6">
                            <CreditCard className="w-8 h-8 mx-auto text-muted-foreground opacity-20 mb-2" />
                            <p className="text-xs text-muted-foreground">No hay facturas registradas.</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Columna Derecha: Cambio de Planes */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-primary/20 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-2xl flex items-center gap-2 text-primary">
                                <Plus className="w-6 h-6" />
                                Elegir Plan
                            </CardTitle>
                            <CardDescription>
                                Selecciona un plan y coordina el pago por WhatsApp con nuestro equipo.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredPlans.map((plan) => {
                                    const isCurrent = status?.plan_id === plan.id;
                                    const isFree = plan.price === 0;
                                    return (
                                        <div 
                                            key={plan.id} 
                                            className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                                                isCurrent 
                                                ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                                                : 'border-border hover:border-primary/40'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex justify-between items-start mb-3">
                                                    <h3 className="font-bold text-xl">{plan.name}</h3>
                                                    {isCurrent && (
                                                        <span className="bg-primary text-primary-foreground text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider">Actual</span>
                                                    )}
                                                </div>
                                                <div className="flex items-baseline gap-1 mb-4">
                                                    <span className="text-3xl font-bold">{isFree ? "Gratis" : `Bs. ${plan.price}`}</span>
                                                    {!isFree && (
                                                        <span className="text-muted-foreground text-sm">/ {plan.billing_cycle === 'yearly' ? 'año' : plan.billing_cycle === 'monthly' ? 'mes' : 'ciclo'}</span>
                                                    )}
                                                </div>
                                                <ul className="space-y-3 mb-6">
                                                    <li className="flex items-center gap-3 text-sm">
                                                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                            <CheckCircle2 size={12} />
                                                        </div>
                                                        Hasta {plan.max_users} usuarios
                                                    </li>
                                                    <li className="flex items-center gap-3 text-sm">
                                                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                            <CheckCircle2 size={12} />
                                                        </div>
                                                        {plan.trial_days} días de duración
                                                    </li>
                                                    {plan.price > 0 && (
                                                        <li className="flex items-center gap-3 text-sm">
                                                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                                <CheckCircle2 size={12} />
                                                            </div>
                                                            Soporte prioritario
                                                        </li>
                                                    )}
                                                </ul>
                                            </div>
                                            {isCurrent ? (
                                                <Button variant="secondary" className="w-full h-11 rounded-xl" disabled>
                                                    Plan Activo
                                                </Button>
                                            ) : isFree ? (
                                                <Button variant="ghost" className="w-full h-11 rounded-xl" disabled>
                                                    Solo para nuevos registros
                                                </Button>
                                            ) : (
                                                <Button 
                                                    className="w-full h-11 rounded-xl bg-green-600 hover:bg-green-700 text-white gap-2"
                                                    onClick={() => handleWhatsAppPlan(plan, "cambio")}
                                                >
                                                    <WhatsAppIcon size={16} />
                                                    Solicitar por WhatsApp
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

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
            </div>
        </div>
    );
}
