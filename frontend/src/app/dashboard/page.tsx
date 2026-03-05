"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Settings, ArrowRight, Activity, Bell, Package, Users, Stethoscope, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TenantDashboard() {
    const router = useRouter();
    const [subdomain, setSubdomain] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("user_role");
        const sub = localStorage.getItem("tenant_subdomain");

        if (!token || role !== "owner" || !sub) {
            router.push("/login");
            return;
        }

        setSubdomain(sub);
        setLoading(false);
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-pulse w-12 h-12 rounded-full border-4 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-300">
            {/* Minimal Header */}
            <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                            <Building2 size={18} />
                        </div>
                        <span className="text-white font-semibold text-lg tracking-tight capitalize">
                            {subdomain}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="text-slate-400 hover:text-white transition-colors relative">
                            <Bell size={20} />
                            <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full"></span>
                        </button>
                        <button
                            onClick={() => {
                                localStorage.clear();
                                router.push("/login");
                            }}
                            className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-6 py-12">
                <div className="mb-12 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
                        <Activity size={14} /> Entorno activo
                    </div>
                    <h1 className="text-4xl sm:text-5xl tracking-tight text-white font-bold mb-6">
                        Bienvenido a tu panel de control.
                    </h1>
                    <p className="text-xl text-slate-400 leading-relaxed">
                        Tu espacio de trabajo está listo y tu base de datos ha sido provisionada.
                        Este es el punto de partida para construir las funciones específicas de tu negocio.
                    </p>
                </div>

                {/* Coming Soon Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="group p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/50 border border-slate-800 hover:border-blue-500/50 transition-all duration-300 cursor-pointer"
                         onClick={() => router.push("/dashboard/products")}>
                        <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <Package className="text-blue-400" size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Productos</h3>
                        <p className="text-slate-400 text-sm mb-6">Registra y administra los productos de tu negocio.</p>
                        <Button variant="outline" className="w-full bg-transparent border-slate-700 hover:bg-slate-800 text-white">
                            Ir a Productos <ArrowRight size={16} className="ml-2" />
                        </Button>
                    </div>

                    <div className="group p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/50 border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 cursor-pointer"
                         onClick={() => router.push("/dashboard/patients")}>
                        <div className="w-12 h-12 rounded-xl bg-cyan-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <Users className="text-cyan-400" size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Pacientes</h3>
                        <p className="text-slate-400 text-sm mb-6">Registra pacientes, historial clínico y odontogramas.</p>
                        <Button variant="outline" className="w-full bg-transparent border-slate-700 hover:bg-slate-800 text-white">
                            Ir a Pacientes <ArrowRight size={16} className="ml-2" />
                        </Button>
                    </div>

                    <div className="group p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/50 border border-slate-800 hover:border-emerald-500/50 transition-all duration-300 cursor-pointer"
                         onClick={() => router.push("/dashboard/treatments")}>
                        <div className="w-12 h-12 rounded-xl bg-emerald-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <Stethoscope className="text-emerald-400" size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Catálogo de Tratamientos</h3>
                        <p className="text-slate-400 text-sm mb-6">Define tratamientos y sus precios para tu consultorio.</p>
                        <Button variant="outline" className="w-full bg-transparent border-slate-700 hover:bg-slate-800 text-white">
                            Ir a Tratamientos <ArrowRight size={16} className="ml-2" />
                        </Button>
                    </div>

                    <div className="group p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/50 border border-slate-800 hover:border-purple-500/50 transition-all duration-300 cursor-pointer"
                         onClick={() => router.push("/dashboard/appointments")}>
                        <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <Calendar className="text-purple-400" size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Citas</h3>
                        <p className="text-slate-400 text-sm mb-6">Agenda y gestiona las citas de tus pacientes.</p>
                        <Button variant="outline" className="w-full bg-transparent border-slate-700 hover:bg-slate-800 text-white">
                            Ir a Citas <ArrowRight size={16} className="ml-2" />
                        </Button>
                    </div>

                    <div className="group p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all duration-300">
                        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <Settings className="text-blue-400" size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Configuración</h3>
                        <p className="text-slate-400 text-sm mb-6">Completa el perfil de tu negocio y configura las opciones básicas.</p>
                        <Button variant="outline" className="w-full bg-transparent border-slate-700 hover:bg-slate-800 text-white" disabled>
                            Próximamente <ArrowRight size={16} className="ml-2" />
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
