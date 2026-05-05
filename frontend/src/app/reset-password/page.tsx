"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft, Lock, Eye, EyeOff, CheckCircle2, AlertTriangle } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { API_BASE } from "@/lib/api"

function ResetPasswordForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get("token")

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    // Si no hay token, mostrar error
    if (!token) {
        return (
            <Card className="w-full max-w-sm mx-auto shadow-xl bg-card border-border">
                <CardContent className="space-y-4 text-center py-10">
                    <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                        <AlertTriangle className="text-amber-500" size={32} />
                    </div>
                    <h3 className="font-semibold text-lg">Enlace inválido</h3>
                    <p className="text-sm text-muted-foreground">
                        Este enlace de recuperación no es válido. Por favor, solicita uno nuevo.
                    </p>
                    <Link href="/forgot-password">
                        <Button variant="outline" className="mt-2 gap-2">
                            <ArrowLeft size={14} /> Solicitar nuevo enlace
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        )
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        const formData = new FormData(e.currentTarget)
        const newPassword = formData.get("password") as string
        const confirmPassword = formData.get("confirm_password") as string

        // Validaciones
        if (newPassword.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres")
            setLoading(false)
            return
        }

        if (newPassword !== confirmPassword) {
            setError("Las contraseñas no coinciden")
            setLoading(false)
            return
        }

        try {
            const response = await fetch(`${API_BASE}/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, new_password: newPassword }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.detail || "Error al restablecer la contraseña")
            }

            setSuccess(true)

            // Redirigir al login después de 3 segundos
            setTimeout(() => router.push("/login"), 3000)
        } catch (err: any) {
            setError(err.message || "Error al procesar la solicitud.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-sm mx-auto shadow-xl bg-card border-border">
            <CardHeader>
                <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/20">
                    <Lock className="text-white" size={24} />
                </div>
                <CardTitle className="text-2xl text-center">Nueva Contraseña</CardTitle>
                <CardDescription className="text-center text-muted-foreground">
                    {success 
                        ? "¡Tu contraseña ha sido actualizada!"
                        : "Ingresa tu nueva contraseña para restablecer el acceso."
                    }
                </CardDescription>
            </CardHeader>

            {success ? (
                /* ESTADO: Éxito */
                <CardContent className="space-y-4 text-center pb-8">
                    <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center animate-in zoom-in-50 duration-300">
                        <CheckCircle2 className="text-emerald-500" size={32} />
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Contraseña actualizada exitosamente.
                        <br />
                        <span className="text-xs text-muted-foreground/70">
                            Serás redirigido al inicio de sesión en unos segundos...
                        </span>
                    </p>
                    <Link href="/login">
                        <Button variant="outline" className="mt-2 gap-2">
                            <ArrowLeft size={14} /> Ir al login ahora
                        </Button>
                    </Link>
                </CardContent>
            ) : (
                /* ESTADO: Formulario */
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {/* Nueva contraseña */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Nueva Contraseña</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Mínimo 6 caracteres"
                                    required
                                    minLength={6}
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

                        {/* Confirmar contraseña */}
                        <div className="space-y-2">
                            <Label htmlFor="confirm_password">Confirmar Contraseña</Label>
                            <div className="relative">
                                <Input
                                    id="confirm_password"
                                    name="confirm_password"
                                    type={showConfirm ? "text" : "password"}
                                    placeholder="Repite tu contraseña"
                                    required
                                    minLength={6}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    tabIndex={-1}
                                >
                                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <p className="text-sm text-red-500 text-center font-medium bg-red-500/10 p-2 rounded">
                                {error}
                            </p>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3 mt-4">
                        <Button 
                            type="submit" 
                            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-primary dark:hover:bg-primary/90 " 
                            disabled={loading}
                        >
                            {loading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Actualizando...</>
                            ) : (
                                "Restablecer contraseña"
                            )}
                        </Button>
                        <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                            <ArrowLeft size={13} /> Volver al inicio de sesión
                        </Link>
                    </CardFooter>
                </form>
            )}
        </Card>
    )
}

export default function ResetPasswordPage() {
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
                <Suspense fallback={
                    <Card className="w-full max-w-sm mx-auto shadow-xl bg-card border-border">
                        <CardContent className="flex items-center justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </CardContent>
                    </Card>
                }>
                    <ResetPasswordForm />
                </Suspense>
            </main>

            <footer className="p-6 text-center text-xs text-gray-400 dark:text-muted-foreground">
                ¿Recordaste tu contraseña? <Link href="/login" className="text-blue-600 dark:text-primary hover:underline">Inicia sesión</Link>
            </footer>
        </div>
    )
}
