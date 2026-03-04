"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { publicApi, Plan } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function RegisterForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [plans, setPlans] = useState<Plan[]>([])
    const [loadingPlans, setLoadingPlans] = useState(true)

    useEffect(() => {
        publicApi.getPlans()
            .then(setPlans)
            .catch(e => console.error("Error cargando planes:", e))
            .finally(() => setLoadingPlans(false))
    }, [])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        const formData = new FormData(e.currentTarget)
        const data = Object.fromEntries(formData.entries())

        try {
            console.log("Enviando petición de registro a http://localhost:8000/register...")
            const response = await fetch("http://localhost:8000/register", {
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
            router.push("/login")
        } catch (err: any) {
            setError(err.message || "Ocurrió un error al registrar el negocio.")
        } finally {
            setLoading(false)
        }
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
                        <Input id="business_name" name="business_name" placeholder="Ej: Mi Tienda Online" required />
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
                            <option value="Tienda">Tienda / Retail</option>
                            <option value="Clinica">Clínica / Salud</option>
                            <option value="Dentista">Odontología y Dentistas</option>
                            <option value="Restaurante">Restaurante / Comidas</option>
                            <option value="Farmacia">Farmacia</option>
                            <option value="Servicios">Servicios Profesionales</option>
                            <option value="Otro">Otro</option>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="subdomain">Subdominio deseado</Label>
                            <div className="flex items-center">
                                <Input id="subdomain" name="subdomain" placeholder="tienda" className="rounded-r-none" required />
                                <span className="bg-slate-100 border border-l-0 px-3 py-2 rounded-r-md text-sm text-gray-500 whitespace-nowrap">
                                    .tuapp.com
                                </span>
                            </div>
                            <p className="text-xs text-gray-400">Dirección inicial del sistema.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="domain">Dominio propio (Opcional)</Label>
                            <Input id="domain" name="domain" placeholder="Ej: www.minegocio.com" />
                            <p className="text-xs text-gray-400">Si ya tienes tu propia web url.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                        <div className="space-y-2">
                            <Label htmlFor="email">Tu Correo Electrónico</Label>
                            <Input id="email" name="email" type="email" placeholder="tu@email.com" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input id="password" name="password" type="password" placeholder="••••••••" required />
                        </div>
                    </div>
                    {error && <p className="text-sm text-red-500 font-medium bg-red-50 p-2 rounded">{error}</p>}
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
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
