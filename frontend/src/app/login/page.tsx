import LoginForm from "@/components/forms/LoginForm";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background flex flex-col">
            {/* Header with Navbar */}
            <header className="px-4 lg:px-6 h-16 flex items-center bg-white border-b sticky top-0 z-50 dark:bg-slate-950 dark:border-slate-800">
                <Link href="/" className="flex items-center justify-center">
                    <span className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text dark:from-primary dark:to-indigo-400">
                        SaaSManager
                    </span>
                </Link>
                <nav className="ml-auto hidden sm:flex gap-4 sm:gap-6 items-center">
                    <Link href="/" className="text-sm font-medium hover:underline underline-offset-4">
                        Inicio
                    </Link>
                    <Link href="/register" className="text-sm font-medium hover:underline underline-offset-4">
                        Registrarse
                    </Link>
                    <ThemeToggle />
                </nav>
            </header>
            <main className="flex-1 flex items-center justify-center p-4">
                <LoginForm />
            </main>
            <footer className="p-6 text-center text-xs text-gray-400 dark:text-muted-foreground">
                ¿No tienes una cuenta? <Link href="/register" className="text-blue-600 dark:text-primary hover:underline">Regístrate</Link>
            </footer>
        </div>
    );
}
