import LoginForm from "@/components/forms/LoginForm";
import Link from "next/link";

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background flex flex-col">
            <header className="p-6">
                <Link href="/" className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text dark:from-primary dark:to-indigo-400">
                    SaaSManager
                </Link>
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
