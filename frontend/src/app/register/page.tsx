import RegisterForm from "@/components/forms/RegisterForm";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import Image from "next/image";

export default function RegisterPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background flex flex-col">
            {/* Header with Navbar */}
            <header className="px-4 lg:px-6 h-16 flex items-center bg-white border-b sticky top-0 z-50 dark:bg-slate-950 dark:border-slate-800">
                <Link href="/" className="flex items-center justify-center gap-2">
                    <Image src="/logo.png" alt="TRZ Corp. Dental" width={150} height={40} className="h-8 w-auto object-contain" />
                </Link>
                <nav className="ml-auto hidden sm:flex gap-4 sm:gap-6 items-center">
                    <Link href="/" className="text-sm font-medium hover:underline underline-offset-4">
                        Inicio
                    </Link>
                    <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4">
                        Iniciar sesión
                    </Link>
                    <ThemeToggle />
                </nav>
            </header>
            <main className="flex-1 flex items-center justify-center p-4">
                <RegisterForm />
            </main>
            <footer className="p-6 text-center text-xs text-gray-400 dark:text-muted-foreground">
                ¿Ya tienes una cuenta? <Link href="/login" className="text-blue-600 dark:text-primary hover:underline">Inicia sesión</Link>
            </footer>
        </div>
    );
}
