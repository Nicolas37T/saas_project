"use client";

import { useState, useEffect } from "react";
import { Building2, User, Key, Save, Image as ImageIcon, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { tenantApi } from "@/lib/api";
import { CustomModal, SuccessModal } from "@/components/ui/custom-modal";

type SettingData = {
  business_name: string;
  logo_url: string;
  phone: string;
  cellphone: string;
  address: string;
  currency: string;
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<SettingData>({
    business_name: "",
    logo_url: "",
    phone: "",
    cellphone: "",
    address: "",
    currency: "Bs.",
  });

  // Modal: Success message
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  
  // Modal: Error message
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await tenantApi.getTenantConfig();
        if (response) {
          setFormData({
            business_name: response.business_name || "",
            logo_url: response.logo_url || "",
            phone: response.phone || "",
            cellphone: response.cellphone || "",
            address: response.address || "",
            currency: response.currency || "Bs.",
          });
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await tenantApi.updateTenantConfig(formData);
      setIsSuccessModalOpen(true);
    } catch (error: any) {
      console.error("Error saving settings:", error);
      setErrorText(error.message || "Error al guardar la configuración");
      setIsErrorModalOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const handleSuccessClose = () => {
    setIsSuccessModalOpen(false);
    // Reload to apply name/logo changes globally
    window.location.reload();
  };

  if (loading) {
    return <div className="text-white text-center py-20">Cargando configuración...</div>;
  }

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
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleChange}
                  className="bg-slate-950/50 border-slate-800 text-white focus-visible:ring-blue-500/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <ImageIcon size={14} /> Logo URL
                </label>
                <Input
                  name="logo_url"
                  placeholder="https://ejemplo.com/logo.png"
                  value={formData.logo_url}
                  onChange={handleChange}
                  className="bg-slate-950/50 border-slate-800 text-white focus-visible:ring-blue-500/50"
                />
                {formData.logo_url && (
                    <div className="mt-2 p-2 bg-slate-900 rounded-lg border border-slate-800 inline-block">
                        <img src={formData.logo_url} alt="Logo preview" className="h-10 object-contain" />
                    </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    Teléfono
                  </label>
                  <Input
                    name="phone"
                    placeholder="+1 234 567 890"
                    value={formData.phone}
                    onChange={handleChange}
                    className="bg-slate-950/50 border-slate-800 text-white focus-visible:ring-blue-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    Celular
                  </label>
                  <Input
                    name="cellphone"
                    placeholder="77766555"
                    value={formData.cellphone}
                    onChange={handleChange}
                    className="bg-slate-950/50 border-slate-800 text-white focus-visible:ring-blue-500/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Dirección
                    </label>
                    <Input
                      name="address"
                      placeholder="Av. Principal, Edificio 4"
                      value={formData.address}
                      onChange={handleChange}
                      className="bg-slate-950/50 border-slate-800 text-white focus-visible:ring-blue-500/50"
                    />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    Moneda Base
                  </label>
                  <select 
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-md bg-slate-950/50 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="Bs.">Bolivianos (Bs.)</option>
                    <option value="USD ($)">USD ($)</option>
                    <option value="EUR (€)">EUR (€)</option>
                    <option value="MXN ($)">MXN ($)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4">
            <Button 
                onClick={handleSave} 
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center shadow-[0_0_15px_rgba(37,99,235,0.3)] disabled:opacity-50"
            >
              <Save size={16} className="mr-2" /> 
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={handleSuccessClose}
        title="Configuración Guardada"
        message="Los cambios han sido aplicados correctamente. La página se recargará para actualizar la cabecera."
      />

      {/* Error Modal */}
      <CustomModal isOpen={isErrorModalOpen} onClose={() => setIsErrorModalOpen(false)} title="Error" maxWidth="max-w-sm">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={26} className="text-red-400" />
            </div>
            <p className="text-slate-400 text-sm mb-6">{errorText}</p>
            <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white" onClick={() => setIsErrorModalOpen(false)}>
              Reintentar
            </Button>
          </div>
      </CustomModal>
    </div>
  );
}
