import RegisterForm from "@/components/forms/RegisterForm";
import Link from "next/link";

export default function RegisterPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="p-6">
                <Link href="/" className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                    SaaSManager
                </Link>
            </header>
            <main className="flex-1 flex items-center justify-center p-4">
                <RegisterForm />
            </main>
            <footer className="p-6 text-center text-xs text-gray-400">
                ¿Ya tienes una cuenta? <Link href="/login" className="text-blue-600 hover:underline">Inicia sesión</Link>
            </footer>
        </div>
    );
}
