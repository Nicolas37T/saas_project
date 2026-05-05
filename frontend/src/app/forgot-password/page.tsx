"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft, Users, ShieldAlert, Mail, CheckCircle2, MessageCircle } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { API_BASE } from "@/lib/api"
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon"

export default function ForgotPasswordPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [loginType, setLoginType] = useState<"employee" | "admin">("employee")
    const [tenants, setTenants] = useState<{subdomain: string, name: string}[]>([])
    const [loadingTenants, setLoadingTenants] = useState(false)

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
        const subdomain = formData.get("subdomain") as string

        try {
            const body: any = { email }

            if (loginType === "employee") {
                if (!subdomain) throw new Error("Debes seleccionar la clínica")
                body.tenant_subdomain = subdomain
            }

            const response = await fetch(`${API_BASE}/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.detail || "Error al procesar la solicitud")
            }

            // Si el backend devuelve el enlace directamente (sin email configurado),
            // redirigir automáticamente a la página de reset
            if (result.reset_link) {
                const url = new URL(result.reset_link)
                router.push(url.pathname + url.search)
                return
            }

            setSuccess(result.message || "Revisa tu bandeja de entrada")
        } catch (err: any) {
            setError(err.message || "Error al enviar la solicitud.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background flex flex-col">
            {/* Header */}
            <header className="px-4 lg:px-6 h-16 flex items-center bg-white border-b sticky top-0 z-50 dark:bg-slate-950 dark:border-slate-800">
                <Link href="/" className="flex items-center justify-center">
                    <span className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text dark:from-primary dark:to-indigo-400">
                        TRZ Dental
                    </span>
                </Link>
                <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
                    <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4">
                        Iniciar Sesión
                    </Link>
                    <ThemeToggle />
                </nav>
            </header>

            <main className="flex-1 flex items-center justify-center p-4">
                <Card className="w-full max-w-sm mx-auto shadow-xl bg-card border-border">
                    <CardHeader>
                        <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/20">
                            <Mail className="text-white" size={24} />
                        </div>
                        <CardTitle className="text-2xl text-center">Recuperar Contraseña</CardTitle>
                        <CardDescription className="text-center text-muted-foreground">
                            {success 
                                ? "Solicitud procesada"
                                : "Ingresa tu correo electrónico para recibir un enlace de recuperación."
                            }
                        </CardDescription>
                    </CardHeader>

                    {success ? (
                        /* ESTADO: Éxito */
                        <CardContent className="space-y-4 text-center pb-8">
                            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center animate-in zoom-in-50 duration-300">
                                <CheckCircle2 className="text-emerald-500" size={32} />
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed px-2">
                                {success}
                                <br /><br />
                                <span className="text-xs text-muted-foreground/70">
                                    {success.includes("TRZ CORP") ? (
                                        "Notifique por medio del Whatsapp que requiere un cambio de contraseña !!"
                                    ) : (
                                        "El enlace expira en 15 minutos. Revisa también la carpeta de spam."
                                    )}
                                </span>
                            </p>
                            <div className="flex flex-col gap-2">
                                <Link href="/login" className="w-full">
                                    <Button variant="outline" className="w-full gap-2">
                                        <ArrowLeft size={14} /> Volver al login
                                    </Button>
                                </Link>
                                <Button 
                                    variant="ghost" 
                                    className="w-full text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/10 gap-2 text-xs"
                                    asChild
                                >
                                    <a href="https://wa.me/59175934045?text=Hola, ya envié la solicitud de recuperación pero necesito ayuda adicional." target="_blank" rel="noopener noreferrer">
                                        <WhatsAppIcon size={14} /> Contactar Soporte
                                    </a>
                                </Button>
                            </div>
                        </CardContent>
                    ) : (
                        /* ESTADO: Formulario */
                        <form onSubmit={handleSubmit}>
                            <CardContent className="space-y-4">
                                {/* Tabs */}
                                <div className="flex gap-2">
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

                                {/* Selector de clínica (solo empleados) */}
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

                                {/* Email */}
                                <div className="space-y-2">
                                    <Label htmlFor="email">Correo Electrónico</Label>
                                    <Input id="email" name="email" type="email" placeholder="tu@email.com" required />
                                </div>

                                {error && (
                                    <p className="text-sm text-red-500 text-center font-medium bg-red-500/10 p-2 rounded">
                                        {error}
                                    </p>
                                )}
                            </CardContent>
                            <CardFooter className="flex flex-col gap-3">
                                <Button 
                                    type="submit" 
                                    className="w-full bg-blue-600 
                                    mt-4
                                    hover:bg-blue-700 dark:bg-primary dark:hover:bg-primary/90" 
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>
                                    ) : (
                                        "Recuperar contraseña"
                                    )}
                                </Button>
                                <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                                    <ArrowLeft size={13} /> Volver al inicio de sesión
                                </Link>

                                <div className="w-full pt-4 border-t border-border mt-2">
                                    <p className="text-xs text-muted-foreground text-center mb-3">¿Tienes problemas para recuperar tu cuenta?</p>
                                    <Button 
                                        variant="outline" 
                                        className="w-full border-green-600/50 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/10 gap-2"
                                        asChild
                                    >
                                        <a href="https://wa.me/59175934045?text=Hola, necesito ayuda para recuperar mi contraseña." target="_blank" rel="noopener noreferrer">
                                            <WhatsAppIcon size={16} /> Contactar Soporte
                                        </a>
                                    </Button>
                                </div>
                            </CardFooter>
                        </form>
                    )}
                </Card>
            </main>

            <footer className="p-6 text-center text-xs text-gray-400 dark:text-muted-foreground">
                ¿Recordaste tu contraseña? <Link href="/login" className="text-blue-600 dark:text-primary hover:underline">Inicia sesión</Link>
            </footer>

            {/* Floating Support Button */}
            <a 
                href="https://wa.me/59175934045?text=Hola, necesito ayuda para recuperar mi contraseña." 
                target="_blank" 
                rel="noopener noreferrer"
                className="fixed bottom-6 right-6 z-[60] bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 flex items-center justify-center group"
                aria-label="Contactar Soporte"
            >
                <WhatsAppIcon size={28} />
                <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 font-bold whitespace-nowrap">
                    Soporte
                </span>
            </a>
        </div>
    )
}
