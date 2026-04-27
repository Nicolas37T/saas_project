"use client";

import { useState, useEffect } from "react";
import { Building2, User, Key, Save, AlertCircle, Eye, EyeOff } from "lucide-react";
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

type SettingData = {
  business_name: string;
  logo_url: string;
  phone: string;
  cellphone: string;
  address: string;
  currency: string;
};

type TabType = "perfil" | "cuenta" | "seguridad";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("perfil");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState<SettingData>({
    business_name: "",
    logo_url: "",
    phone: "",
    cellphone: "",
    address: "",
    currency: "Bs.",
  });

  const [cuentaData, setCuentaData] = useState({
    full_name: "",
    email: "",
    username: "",
  });

  const [seguridadData, setSeguridadData] = useState({
    password: "",
    confirmPassword: "",
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Modals
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    async function fetchAllSettings() {
      try {
        const token = localStorage.getItem("token");
        let uid = null;
        if (token) {
          const decoded = decodeJWT(token);
          if (decoded?.sub) {
            uid = decoded.sub;
            setCurrentUserId(uid);
          }
        }

        const [configRes, employeesRes] = await Promise.all([
          tenantApi.getTenantConfig().catch(() => null),
          uid ? tenantApi.getEmployees().catch(() => []) : Promise.resolve([])
        ]);

        if (configRes) {
          setFormData({
            business_name: configRes.business_name || "",
            logo_url: configRes.logo_url || "",
            phone: configRes.phone || "",
            cellphone: configRes.cellphone || "",
            address: configRes.address || "",
            currency: configRes.currency || "Bs.",
          });
        }

        if (uid && employeesRes && employeesRes.length > 0) {
          const me = employeesRes.find((e: any) => e.id === uid);
          if (me) {
            setCuentaData({
              full_name: me.full_name || "",
              email: me.email || "",
              username: me.username || "",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAllSettings();
  }, []);

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCuentaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCuentaData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSeguridadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSeguridadData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (activeTab === "perfil") {
        await tenantApi.updateTenantConfig(formData);
      } else if (activeTab === "cuenta") {
        if (!currentUserId) throw new Error("No se pudo identificar tu usuario.");
        await tenantApi.updateEmployee(currentUserId, cuentaData);
      } else if (activeTab === "seguridad") {
        if (!currentUserId) throw new Error("No se pudo identificar tu usuario.");
        if (!seguridadData.password) throw new Error("La contraseña no puede estar vacía.");
        if (seguridadData.password !== seguridadData.confirmPassword) {
          throw new Error("Las contraseñas no coinciden.");
        }
        if (seguridadData.password.length < 6) {
          throw new Error("La contraseña debe tener al menos 6 caracteres.");
        }
        await tenantApi.updateEmployee(currentUserId, { password: seguridadData.password });
        setSeguridadData({ password: "", confirmPassword: "" });
      }
      setIsSuccessModalOpen(true);
    } catch (error: any) {
      console.error("Error saving settings:", error);
      setErrorText(error.message || "Error al procesar la solicitud.");
      setIsErrorModalOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const handleSuccessClose = () => {
    setIsSuccessModalOpen(false);
    if (activeTab === "perfil") {
      window.location.reload();
    }
  };

  if (loading) {
    return <div className="text-center py-20 animate-pulse text-muted-foreground font-medium">Cargando configuración...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">
          Configuración
        </h1>
        <p className="text-muted-foreground">
          Administra el perfil de tu clínica, tus datos de cuenta y credenciales.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {/* Navigation Sidebar */}
        <div className="space-y-2">
          <button
            onClick={() => setActiveTab("perfil")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              activeTab === "perfil"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
          >
            <Building2 size={18} />
            Perfil Clínica
          </button>
          <button
            onClick={() => setActiveTab("cuenta")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              activeTab === "cuenta"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
          >
            <User size={18} />
            Mi Cuenta
          </button>
          <button
            onClick={() => setActiveTab("seguridad")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              activeTab === "seguridad"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
          >
            <Key size={18} />
            Seguridad
          </button>
        </div>

        {/* Settings Forms */}
        <div className="md:col-span-2 space-y-6">
          {activeTab === "perfil" && (
            <Card className="bg-card border-border backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2">
              <CardHeader>
                <CardTitle>Información de la Clínica</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Estos datos aparecerán en los recibos, odontogramas y panel principal.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nombre del Negocio</label>
                  <Input
                    name="business_name"
                    value={formData.business_name}
                    onChange={handleConfigChange}
                    className="bg-muted/50 border-border focus-visible:ring-primary/50"
                  />
                </div>
                {formData.logo_url && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Logotipo Actual</label>
                    <div className="mt-1 p-3 bg-muted rounded-xl border border-border inline-flex items-center justify-center">
                      <img src={formData.logo_url} alt="Logo" className="h-10 object-contain" />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Teléfono</label>
                    <Input
                      name="phone"
                      placeholder="+ 591 00000000"
                      value={formData.phone}
                      onChange={handleConfigChange}
                      className="bg-muted/50 border-border focus-visible:ring-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Celular</label>
                    <Input
                      name="cellphone"
                      placeholder="+ 591 00000000"
                      value={formData.cellphone}
                      onChange={handleConfigChange}
                      className="bg-muted/50 border-border focus-visible:ring-primary/50"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Dirección</label>
                    <Input
                      name="address"
                      placeholder="Av. Principal, Edificio 4"
                      value={formData.address}
                      onChange={handleConfigChange}
                      className="bg-muted/50 border-border focus-visible:ring-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Moneda Base</label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleConfigChange}
                      className="w-full p-2.5 rounded-md bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
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
          )}

          {activeTab === "cuenta" && (
            <Card className="bg-card border-border backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2">
              <CardHeader>
                <CardTitle>Mi Cuenta</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Actualiza tu información personal y de contacto.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nombre Completo</label>
                  <Input
                    name="full_name"
                    placeholder="Ej. Dr. Juan Pérez"
                    value={cuentaData.full_name}
                    onChange={handleCuentaChange}
                    className="bg-muted/50 border-border focus-visible:ring-primary/50"
                  />
                </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Correo Electrónico</label>
                    <Input
                      name="email"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={cuentaData.email}
                      onChange={handleCuentaChange}
                      className="bg-muted/50 border-border focus-visible:ring-primary/50"
                    />
                  </div>
                  {/* <div className="space-y-2">
                    <label className="text-sm font-medium">Nombre de Usuario</label>
                    <Input
                      name="username"
                      placeholder="jperez"
                      value={cuentaData.username}
                      onChange={(e) => setCuentaData(prev => ({...prev, username: e.target.value.toLowerCase().replace(/\s/g, '')}))}
                      className="bg-muted/50 border-border focus-visible:ring-primary/50 lowercase"
                    />
                  </div> */}
              </CardContent>
            </Card>
          )}

          {activeTab === "seguridad" && (
            <Card className="bg-card border-border backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2">
              <CardHeader>
                <CardTitle>Seguridad</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Cambia tu contraseña de acceso al sistema.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nueva Contraseña</label>
                  <div className="relative">
                      <Input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={seguridadData.password}
                        onChange={handleSeguridadChange}
                        className="bg-muted/50 border-border focus-visible:ring-primary/50 pr-10"
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
                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirmar Nueva Contraseña</label>
                  <div className="relative">
                      <Input
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={seguridadData.confirmPassword}
                        onChange={handleSeguridadChange}
                        className="bg-muted/50 border-border focus-visible:ring-primary/50 pr-10"
                      />
                      <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                      >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center shadow-[0_0_15px_rgba(37,99,235,0.3)] disabled:opacity-50"
            >
              <Save size={16} className="mr-2" />
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </div>
      </div>

      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={handleSuccessClose}
        title="Cambios Guardados"
        message={activeTab === "perfil" 
          ? "La configuración de la clínica ha sido actualizada correctamente. La página se recargará." 
          : "Tus datos personales y/o de seguridad han sido actualizados con éxito."}
      />

      <CustomModal isOpen={isErrorModalOpen} onClose={() => setIsErrorModalOpen(false)} title="Error" maxWidth="max-w-sm">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={26} className="text-destructive" />
          </div>
          <p className="text-muted-foreground text-sm mb-6">{errorText}</p>
          <Button className="w-full bg-muted hover:bg-muted/80" onClick={() => setIsErrorModalOpen(false)}>
            Entendido
          </Button>
        </div>
      </CustomModal>
    </div>
  );
}
