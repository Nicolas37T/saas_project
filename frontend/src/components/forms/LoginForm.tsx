"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Building2, ShieldAlert } from "lucide-react"
import { API_BASE } from "@/lib/api"

export default function LoginForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [loginType, setLoginType] = useState<"tenant" | "admin">("tenant")

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        const formData = new FormData(e.currentTarget)
        const email = formData.get("email") as string
        const password = formData.get("password") as string
        const subdomain = formData.get("subdomain") as string

        try {
            // Ambos tipos de login usan el mismo endpoint global
            // El backend determina el rol y el subdominio
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            })

            const result = await response.json()
            if (!response.ok) throw new Error(result.detail || "Credenciales incorrectas")

            localStorage.setItem("token", result.access_token)
            localStorage.setItem("user_role", result.role)

            if (result.role === "superadmin") {
                if (loginType !== "admin") throw new Error("Debes usar el tab Administrador")
                router.push("/admin/dashboard")
            } else if (result.role === "owner") {
                if (loginType !== "tenant") throw new Error("Debes usar el tab Mi Negocio")
                localStorage.setItem("tenant_subdomain", result.subdomain)
                router.push("/dashboard") // O donde sea el dashboard base por ahora
            } else {
                throw new Error("Rol no reconocido")
            }
        } catch (err: any) {
            setError(err.message || "Error al iniciar sesión.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-sm mx-auto shadow-xl">
            <CardHeader>
                <CardTitle className="text-2xl text-center">Iniciar Sesión</CardTitle>
                <CardDescription className="text-center">
                    {loginType === "tenant"
                        ? "Ingresa a la consola de administración de tu negocio."
                        : "Acceso exclusivo para administradores de la plataforma."}
                </CardDescription>
            </CardHeader>

            {/* Selector de tipo de login */}
            <div className="flex px-6 mb-4 gap-2">
                <Button
                    type="button"
                    variant={loginType === "tenant" ? "default" : "outline"}
                    className="flex-1 gap-2 text-xs h-8"
                    onClick={() => { setLoginType("tenant"); setError(""); }}
                >
                    <Building2 size={14} /> Mi Negocio
                </Button>
                <Button
                    type="button"
                    variant={loginType === "admin" ? "default" : "outline"}
                    className="flex-1 gap-2 text-xs h-8"
                    onClick={() => { setLoginType("admin"); setError(""); }}
                >
                    <ShieldAlert size={14} /> Plataforma
                </Button>
            </div>

            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <Input id="email" name="email" type="email" placeholder="tu@email.com" required />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">Contraseña</Label>
                            <a href="#" className="text-xs text-blue-600 hover:underline">¿Olvidaste tu contraseña?</a>
                        </div>
                        <Input id="password" name="password" type="password" placeholder="••••••••" required />
                    </div>
                    {error && <p className="text-sm text-red-500 text-center font-medium bg-red-500/10 p-2 rounded">{error}</p>}
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
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
