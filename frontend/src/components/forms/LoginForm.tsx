"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Building2, ShieldAlert, Users, Eye, EyeOff } from "lucide-react"
import { API_BASE } from "@/lib/api"

export default function LoginForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [loginType, setLoginType] = useState<"employee" | "admin">("employee")
    const [tenants, setTenants] = useState<{subdomain: string, name: string}[]>([])
    const [loadingTenants, setLoadingTenants] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    useEffect(() => {
        async function fetchTenants() {
            try {
                setLoadingTenants(true)
                const res = await fetch(`${API_BASE}/auth/tenants`)
                if (res.ok) {
                    const data = await res.json()
                    setTenants(data)
                }
            } catch (err) {
                console.error("Error fetching tenants:", err)
            } finally {
                setLoadingTenants(false)
            }
        }
        fetchTenants()
    }, [])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        const formData = new FormData(e.currentTarget)
        const email = formData.get("email") as string
        const password = formData.get("password") as string
        const subdomain = formData.get("subdomain") as string

        try {
            let endpoint = `${API_BASE}/auth/login`
            let headers: any = { "Content-Type": "application/json" }

            if (loginType === "employee") {
                if (!subdomain) throw new Error("Debes ingresar el código de negocio")
                endpoint = `${API_BASE}/api/tenant/auth/login`
                headers["X-Tenant"] = subdomain
            }

            const response = await fetch(endpoint, {
                method: "POST",
                headers,
                body: JSON.stringify({ email, password }),
            })

            const result = await response.json()
            if (!response.ok) throw new Error(result.detail || "Credenciales incorrectas")

            localStorage.setItem("token", result.access_token)
            localStorage.setItem("user_role", result.role)

            if (result.is_employee) {
                if (loginType !== "employee") throw new Error("Debes usar la pestaña Empleado")
                localStorage.setItem("tenant_subdomain", result.subdomain)
                router.push("/dashboard")
            } else if (result.role === "superadmin") {
                if (loginType !== "admin") throw new Error("Debes usar la pestaña Plataforma")
                router.push("/admin/dashboard")
            } else if (result.role === "owner") {
                if (loginType !== "admin") throw new Error("Debes usar la pestaña Plataforma")
                localStorage.setItem("tenant_subdomain", result.subdomain)
                
                // Si la cuenta está suspendida, redirigir a facturación
                if (result.tenant_status === "suspended") {
                    router.push("/dashboard/billing")
                } else {
                    router.push("/dashboard")
                }
            } else {
                throw new Error("Rol no reconocido o acceso denegado.")
            }
        } catch (err: any) {
            setError(err.message || "Error al iniciar sesión.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-sm mx-auto shadow-xl bg-card border-border">
            <CardHeader>
                <CardTitle className="text-2xl text-center">Iniciar Sesión</CardTitle>
                <CardDescription className="text-center text-muted-foreground">
                    {loginType === "employee" && "Accede como colaborador de una clínica."}
                    {loginType === "admin" && "Acceso exclusivo para administradores de la plataforma."}
                </CardDescription>
            </CardHeader>

            <div className="flex px-6 mb-4 gap-2">
                <Button
                    type="button"
                    variant={loginType === "employee" ? "default" : "outline"}
                    className="flex-1 gap-1.5 text-xs h-8 px-2"
                    onClick={() => { setLoginType("employee"); setError(""); }}
                >
                    <Users size={13} /> Empleado
                </Button>
                <Button
                    type="button"
                    variant={loginType === "admin" ? "default" : "outline"}
                    className="flex-1 gap-1.5 text-xs h-8 px-2"
                    onClick={() => { setLoginType("admin"); setError(""); }}
                >
                    <ShieldAlert size={13} /> Plataforma
                </Button>
            </div>

            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    {loginType === "employee" && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                            <Label htmlFor="subdomain">Clínica / Negocio</Label>
                            {loadingTenants ? (
                                <div className="h-10 border border-input rounded-md flex items-center justify-center text-sm text-muted-foreground bg-muted animate-pulse">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando clínicas...
                                </div>
                            ) : tenants.length > 0 ? (
                                <select
                                    id="subdomain"
                                    name="subdomain"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    required
                                >
                                    <option value="">Selecciona tu clínica</option>
                                    {tenants.map(t => (
                                        <option key={t.subdomain} value={t.subdomain}>
                                            {t.name}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <Input id="subdomain" name="subdomain" type="text" placeholder="ej: mi-clinica" required />
                            )}
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <Input id="email" name="email" type="email" placeholder="tu@email.com" required />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">Contraseña</Label>
                            <Link href="/forgot-password" className="text-xs text-blue-600 dark:text-primary hover:underline">¿Olvidaste tu contraseña?</Link>
                        </div>
                        <div className="relative">
                            <Input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
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
                    {error && <p className="text-sm text-red-500 text-center font-medium bg-red-500/10 p-2 rounded">{error}</p>}
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-primary dark:hover:bg-primary/90 mt-4" disabled={loading}>
                        {loading ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Validando...</>
                        ) : (
                            "Entrar"
                        )}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
