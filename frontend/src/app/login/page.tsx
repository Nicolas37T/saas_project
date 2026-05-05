import LoginForm from "@/components/forms/LoginForm";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import Image from "next/image";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";

export default function LoginPage() {
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

            {/* Floating Support Button */}
            <a 
                href="https://wa.me/59175934045?text=Hola, necesito ayuda para iniciar sesión." 
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
    );
}
