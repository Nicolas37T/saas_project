"use client";

import { Building2, User, Key, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
          Configuración
        </h1>
        <p className="text-slate-400">
          Administra el perfil de tu clínica y las preferencias del sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {/* Navigation Sidebar */}
        <div className="space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600/10 text-blue-400 rounded-xl font-medium transition-colors">
            <Building2 size={18} />
            Perfil Clínica
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-colors">
            <User size={18} />
            Mi Cuenta
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-colors">
            <Key size={18} />
            Seguridad
          </button>
        </div>

        {/* Settings Form */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">
                Información de la Clínica
              </CardTitle>
              <CardDescription className="text-slate-400">
                Estos datos aparecerán en los recibos y odontogramas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Nombre del Negocio
                </label>
                <Input
                  defaultValue="Mi Clínica Dental"
                  className="bg-slate-950/50 border-slate-800 text-white focus-visible:ring-blue-500/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    Teléfono
                  </label>
                  <Input
                    placeholder="+1 234 567 890"
                    className="bg-slate-950/50 border-slate-800 text-white focus-visible:ring-blue-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    Moneda Base
                  </label>
                  <select className="w-full p-2.5 rounded-md bg-slate-950/50 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                    <option>USD ($)</option>
                    <option>EUR (€)</option>
                    <option>MXN ($)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Dirección
                </label>
                <Input
                  placeholder="Av. Principal, Edificio 4"
                  className="bg-slate-950/50 border-slate-800 text-white focus-visible:ring-blue-500/50"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center shadow-[0_0_15px_rgba(37,99,235,0.3)]">
              <Save size={16} className="mr-2" /> Guardar Cambios
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
