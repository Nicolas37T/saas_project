"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { publicApi, Plan, API_BASE } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Eye, EyeOff } from "lucide-react"

export default function RegisterForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [plans, setPlans] = useState<Plan[]>([])
    const [loadingPlans, setLoadingPlans] = useState(true)
    const [subdomainError, setSubdomainError] = useState("")
    const [isSuccess, setIsSuccess] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [submittedPlanId, setSubmittedPlanId] = useState("")
    const [submittedBusinessName, setSubmittedBusinessName] = useState("")
    const forbiddenSubdomains = ["api", "admin", "dashboard", "login", "register", "auth", "tenant", "public", "localhost", "www", "", null]

    useEffect(() => {
        publicApi.getPlans()
            .then(setPlans)
            .catch(e => console.error("Error cargando planes:", e))
            .finally(() => setLoadingPlans(false))
    }, [])

    const validateSubdomain = (subdomain: string) => {
        if (!subdomain) {
            setSubdomainError("El subdominio es requerido")
            return false
        }
        
        if (forbiddenSubdomains.includes(subdomain.toLowerCase())) {
            setSubdomainError(`El subdominio "${subdomain}" no está disponible`)
            return false
        }
        
        // Validación adicional: solo letras minúsculas, números y guiones bajos
        const subdomainRegex = /^[a-z0-9_]+$/
        if (!subdomainRegex.test(subdomain)) {
            setSubdomainError("Solo se permiten letras minúsculas, números y guiones bajos")
            return false
        }
        
        // Validación: no puede empezar o terminar con guion bajo
        if (subdomain.startsWith("_") || subdomain.endsWith("_")) {
            setSubdomainError("El subdominio no puede empezar o terminar con guion bajo")
            return false
        }
        
        setSubdomainError("")
        return true
    }

    const handleSubdomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
        e.target.value = value
        validateSubdomain(value)
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        
        // Validar subdominio antes de enviar
        const formData = new FormData(e.currentTarget)
        const subdomain = formData.get("subdomain") as string
        
        if (!validateSubdomain(subdomain)) {
            return
        }
        
        setLoading(true)
        setError("")

        const data = Object.fromEntries(formData.entries())

        try {
            console.log(`Enviando petición de registro a ${API_BASE}/register...`)
            const response = await fetch(`${API_BASE}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            })

            console.log("Respuesta recibida del servidor, status:", response.status)
            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.detail || "Error en el registro")
            }

            console.log("Registro exitoso:", result)
            // Guardar datos antes de que el form desaparezca
            setSubmittedPlanId(data.plan_id as string)
            setSubmittedBusinessName(data.business_name as string)
            setIsSuccess(true)
            // Ya no redirigimos inmediatamente para que vea el mensaje
        } catch (err: any) {
            setError(err.message || "Ocurrió un error al registrar el negocio.")
        } finally {
            setLoading(false)
        }
    }

    const WHATSAPP_NUMBER = "59175934045";

    if (isSuccess) {
        const selectedPlan = plans.find(p => p.id === submittedPlanId);
        const isPaidPlan = selectedPlan && selectedPlan.price > 0;
        const businessName = submittedBusinessName || "Mi Negocio";

        const whatsappMessage = encodeURIComponent(
            `Hola, acabo de registrarme en la plataforma y necesito activar mi cuenta.\n\n Plan seleccionado: ${selectedPlan?.name || "No especificado"}\n Precio: Bs. ${selectedPlan?.price || 0}\n Negocio: ${businessName}\n\n¿Cómo puedo realizar el pago para activar mi cuenta?`
        );
        const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`;

        return (
            <Card className="w-full max-w-lg mx-auto shadow-lg border-t-4 border-t-green-600">
                <CardHeader>
                    <CardTitle className="text-2xl text-center text-green-700">¡Registro Exitoso!</CardTitle>
                    <CardDescription className="text-center font-medium">
                        Tu solicitud ha sido recibida correctamente.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-center">
                    {isPaidPlan ? (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm dark:bg-green-900/20 dark:border-green-800 dark:text-green-300">
                            <p className="font-bold mb-2">📱 Coordina tu pago por WhatsApp</p>
                            <p>Para activar tu cuenta con el plan <strong>{selectedPlan?.name}</strong>, contacta a nuestro equipo de soporte por WhatsApp para coordinar el pago.</p>
                            <p className="mt-2 text-xs opacity-75">Tu cuenta se activará una vez confirmado el pago.</p>
                        </div>
                    ) : (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300">
                            <p className="font-bold mb-2">🎉 ¡Tu plan gratuito está activo!</p>
                            <p>Ya puedes iniciar sesión y empezar a usar la plataforma durante tu periodo de prueba.</p>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                    {isPaidPlan && (
                        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                            <Button className="w-full bg-green-600 hover:bg-green-700 text-white gap-2">
                                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                Contactar Soporte por WhatsApp
                            </Button>
                        </a>
                    )}
                    <Button onClick={() => router.push("/login")} className="w-full" variant={isPaidPlan ? "outline" : "default"}>
                        Ir al Inicio de Sesión
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-lg mx-auto shadow-lg border-t-4 border-t-blue-600">
            <CardHeader>
                <CardTitle className="text-2xl text-center">Registrar mi Negocio</CardTitle>
                <CardDescription className="text-center">
                    Crea tu cuenta y empieza a gestionar tu negocio en segundos.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="business_name">Nombre del Negocio</Label>
                        <Input 
                            id="business_name" 
                            name="business_name" 
                            required 
                            onChange={(e) => {
                                const slug = e.target.value
                                    .toLowerCase()
                                    .trim()
                                    .replace(/[^\w\s]/g, "")
                                    .replace(/[\s-]+/g, "_")
                                    .replace(/^_+|_+$/g, "");
                                const subdomainInput = document.getElementById("subdomain") as HTMLInputElement;
                                if (subdomainInput) {
                                    subdomainInput.value = slug;
                                    validateSubdomain(slug);
                                }
                            }}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="business_type">Tipo de Negocio</Label>
                        <select
                            id="business_type"
                            name="business_type"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            required
                        >
                            <option value="">Selecciona una opción</option>
                            <option value="Dentista">Odontología y Dentistas</option>
                            
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="plan_id">Plan de Suscripción</Label>
                        <select
                            id="plan_id"
                            name="plan_id"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                            required
                            disabled={loadingPlans}
                        >
                            <option value="">{loadingPlans ? "Cargando planes..." : "Selecciona un plan"}</option>
                            {plans.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} - Bs. {p.price}/{p.billing_cycle === 'monthly' ? 'mes' : 'año'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 hidden">
                        <div className="space-y-2">
                            <Label htmlFor="subdomain">Subdominio deseado</Label>
                            <div className="flex items-center">
                                <Input 
                                    id="subdomain" 
                                    name="subdomain" 
                                    className={`rounded-r-none ${subdomainError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                    onChange={handleSubdomainChange}
                                    required 
                                />
                                <span className={`border ${subdomainError ? 'border-red-500' : 'border-input'} border-l-0 px-3 py-2 rounded-r-md text-sm text-gray-500 whitespace-nowrap`}>
                                    .tuapp.com
                                </span>
                            </div>
                            <div className="space-y-1">
                                {subdomainError && (
                                    <p className="text-xs text-red-500">{subdomainError}</p>
                                )}
                            </div>
                        </div>
                        {/* <div className="space-y-2">
                            <Label htmlFor="domain">Dominio propio (Opcional)</Label>
                            <Input id="domain" name="domain" placeholder="Ej: www.minegocio.com" />
                            <p className="text-xs text-gray-400">Si ya tienes tu propia web url.</p>
                        </div> */}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                        <div className="space-y-2">
                            <Label htmlFor="email">Tu Correo Electrónico</Label>
                            <Input id="email" name="email" type="email" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>
                    {error && <p className="text-sm text-red-500 font-medium bg-red-50 p-2 rounded">{error}</p>}
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 mt-6" disabled={loading || !!subdomainError}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Configurando tu espacio...
                            </>
                        ) : (
                            "Crear Negocio"
                        )}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}