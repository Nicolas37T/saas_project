"use client";

import { Activity, Settings, ArrowRight, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function decodeJWT(token: string): { email?: string; full_name?: string; sub?: string } | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export default function TenantDashboard() {

  const token = localStorage.getItem("token");
  const user = decodeJWT(token!);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-12 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-6 border border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
          <Activity size={14} className="animate-pulse" /> Sistema en Línea
        </div>
        <h1 className="text-4xl sm:text-5xl tracking-tight font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
          Bienvenido a tu Clínica {user?.full_name}
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Tu sistema de gestión dental multi-tenant está en funcionamiento.
          Comienza configurando tus módulos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="group p-6 rounded-2xl bg-gradient-to-br from-card to-card/50 border border-border hover:border-primary/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all duration-500">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <Stethoscope className="text-primary" size={24} />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            Pacientes y Tratamientos
          </h3>
          <p className="text-muted-foreground text-sm mb-6">
            Gestiona las historias clínicas y los tratamientos de tus pacientes
            inteligentemente.
          </p>
          <Link href="/dashboard/patients">
            <Button
              variant="outline"
              className="w-full border-border hover:bg-primary/10 hover:text-primary transition-colors"
            >
              Ver Pacientes <ArrowRight size={16} className="ml-2" />
            </Button>
          </Link>
        </div>

        <div className="group p-6 rounded-2xl bg-gradient-to-br from-card to-card/50 border border-border hover:border-muted-foreground/50 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <Settings className="text-muted-foreground" size={24} />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            Configuración Inicial
          </h3>
          <p className="text-muted-foreground text-sm mb-6">
            Completa el perfil de tu clínica y personaliza tus preferencias.
          </p>
          <Button
            variant="outline"
            className="w-full border-border hover:bg-accent"
            disabled
          >
            Próximamente
          </Button>
        </div>
      </div>
    </div>
  );
}
