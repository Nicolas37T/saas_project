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
            setIsSuccess(true)
            // Ya no redirigimos inmediatamente para que vea el mensaje
        } catch (err: any) {
            setError(err.message || "Ocurrió un error al registrar el negocio.")
        } finally {
            setLoading(false)
        }
    }

    if (isSuccess) {
        return (
            <Card className="w-full max-w-lg mx-auto shadow-lg border-t-4 border-t-green-600">
                <CardHeader>
                    <CardTitle className="text-2xl text-center text-green-700">¡Registro Exitoso!</CardTitle>
                    <CardDescription className="text-center font-medium">
                        Tu solicitud ha sido recibida correctamente.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-center">
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                        <p className="font-bold mb-2">Cuenta en Proceso de Activación</p>
                        <p>Para garantizar la seguridad de nuestra plataforma, todas las nuevas cuentas deben ser revisadas y activadas manualmente por nuestro equipo administrativo.</p>
                        <p className="mt-2 text-xs">Recibirás un correo cuando tu acceso esté habilitado.</p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={() => router.push("/login")} className="w-full bg-blue-600 hover:bg-blue-700">
                        Ir al Inicio
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
                                    {p.name} - ${p.price}/{p.billing_cycle === 'monthly' ? 'mes' : 'año'}
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