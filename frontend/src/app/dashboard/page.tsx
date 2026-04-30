"use client";

import { useEffect, useState } from "react";
import { Activity, Settings, ArrowRight, Stethoscope, Users, Calendar, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { tenantApi, DashboardData, Employee } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";

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
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("90");
  const [groupBy, setGroupBy] = useState<"day" | "month">("day");
  const [visibleSeries, setVisibleSeries] = useState({
    patients: true,
    treatments: true,
    appointments: true,
  });

  // --- Doctor filtering ---
  const [doctors, setDoctors] = useState<Employee[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("all");

  const role = typeof window !== "undefined" ? localStorage.getItem("user_role") : "empleado";
  const isPrivileged = role === "owner" || role === "admin" || role === "superadmin" || role === "administrador";
  const isReceptionist = role === "recepcionista";
  const doctorRoles = ["odontólogo", "odontologo", "doctor", "dentist", "dentista"];
  const isDoctor = doctorRoles.includes(role?.toLowerCase() ?? "");

  const MONTH_NAMES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  // Genera exactamente 12 buckets mensuales (últimos 12 meses), con 0 para meses sin datos
  const groupChartData = (
    rawData: DashboardData["chart_data"],
    mode: "day" | "month"
  ) => {
    if (mode === "day") return rawData;

    // Construir el mapa de los datos reales
    const rawMap = new Map<string, { patients: number; treatments: number; appointments: number }>();
    for (const row of rawData) {
      const key = row.date.slice(0, 7);
      const existing = rawMap.get(key);
      if (existing) {
        existing.patients += row.patients;
        existing.treatments += row.treatments;
        existing.appointments += row.appointments;
      } else {
        rawMap.set(key, { patients: row.patients, treatments: row.treatments, appointments: row.appointments });
      }
    }

    // Generar los 12 meses fijos (mes actual y los 11 anteriores)
    const today = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - 11 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const found = rawMap.get(key);
      return {
        date: key,
        patients: found?.patients ?? 0,
        treatments: found?.treatments ?? 0,
        appointments: found?.appointments ?? 0,
      };
    });
  };

  const formatXAxis = (value: string) => {
    if (groupBy === "month") {
      const [, m] = value.split("-");
      return MONTH_NAMES[parseInt(m, 10) - 1] ?? value;
    }
    return value;
  };

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const user = token ? decodeJWT(token) : null;

  // Determinar el doctor_id efectivo para el API
  const getEffectiveDoctorId = (): string | undefined => {
    if (isDoctor && user?.sub) return user.sub;
    if ((isPrivileged || isReceptionist) && selectedDoctor !== "all") return selectedDoctor;
    return undefined;
  };

  const fetchStats = async (days: number) => {
    setLoading(true);
    try {
      const response = await tenantApi.getDashboardStats(days, getEffectiveDoctorId());
      setData(response);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar lista de doctores para admin/owner/recepcionista
  useEffect(() => {
    if (isPrivileged || isReceptionist) {
      tenantApi.getDoctors().then(setDoctors).catch(() => setDoctors([]));
    }
  }, []);

  // En modo mensual siempre traemos 365 días para tener todos los meses
  useEffect(() => {
    fetchStats(groupBy === "month" ? 365 : parseInt(timeRange));
  }, [timeRange, groupBy, selectedDoctor]);

  const toggleSeries = (series: keyof typeof visibleSeries) => {
    setVisibleSeries(prev => ({
      ...prev,
      [series]: !prev[series]
    }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-12">
      {/* Header */}
      <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-6 border border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.1)] ">
          <Activity size={14} className="animate-pulse" /> Sistema en Línea
        </div>
        <h1 className="text-4xl sm:text-5xl tracking-tight font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
          Bienvenido a tu Clínica {user?.full_name}
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Tu sistema de gestión dental multi-tenant está en funcionamiento.
          Aquí tienes un resumen de tu actividad.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Pacientes Totales</p>
              <h4 className="text-3xl font-bold">{loading && !data ? "..." : data?.summary.total_patients}</h4>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Stethoscope size={24} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Tratamientos</p>
              <h4 className="text-3xl font-bold">{loading && !data ? "..." : data?.summary.total_treatments}</h4>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Citas Registradas</p>
              <h4 className="text-3xl font-bold">{loading && !data ? "..." : data?.summary.total_appointments}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-card to-card/50 border border-border shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="text-primary" size={20} />
              Actividad Reciente
            </h3>
            <p className="text-muted-foreground text-sm">
              {isDoctor
                ? "Tus registros personales"
                : selectedDoctor !== "all"
                  ? `Filtrado por: ${doctors.find(d => d.id === selectedDoctor)?.full_name ?? "Doctor"}`
                  : "Visualización de nuevos registros (todos los doctores)"
              }
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Series Toggles */}
            <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="show-patients" 
                  checked={visibleSeries.patients} 
                  onCheckedChange={() => toggleSeries('patients')}
                />
                <Label htmlFor="show-patients" className="text-xs cursor-pointer">Pacientes</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="show-treatments" 
                  checked={visibleSeries.treatments} 
                  onCheckedChange={() => toggleSeries('treatments')}
                />
                <Label htmlFor="show-treatments" className="text-xs cursor-pointer">Tratamientos</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="show-appointments" 
                  checked={visibleSeries.appointments} 
                  onCheckedChange={() => toggleSeries('appointments')}
                />
                <Label htmlFor="show-appointments" className="text-xs cursor-pointer">Citas</Label>
              </div>
            </div>

            {/* Granularity Selector */}
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as "day" | "month")}>
              <SelectTrigger className="w-[110px] bg-card border-border">
                <SelectValue placeholder="Agrupar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Por días</SelectItem>
                <SelectItem value="month">Por meses</SelectItem>
              </SelectContent>
            </Select>

            {/* Time Range Selector — solo visible en modo días */}
            {groupBy === "day" && (
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[150px] bg-card border-border">
                  <SelectValue placeholder="Periodo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 días</SelectItem>
                  <SelectItem value="30">Últimos 30 días</SelectItem>
                  <SelectItem value="90">Últimos 90 días</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Doctor Filter — solo para admin/owner/recepcionista */}
            {(isPrivileged || isReceptionist) && doctors.length > 0 && (
              <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                <SelectTrigger className="w-[180px] bg-card border-border">
                  <SelectValue placeholder="Filtrar por doctor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los doctores</SelectItem>
                  {doctors.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        
        <div className="h-[350px] w-full">
          {loading && !data ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={groupChartData(data?.chart_data ?? [], groupBy)}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  dy={10}
                  tickFormatter={formatXAxis}
                  interval={groupBy === "month" ? 0 : (parseInt(timeRange) > 30 ? 6 : parseInt(timeRange) > 15 ? 2 : 0)}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-card border border-border p-3 rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.2)]">
                          <p className="text-muted-foreground font-bold mb-2 text-sm">
                            {groupBy === "month" ? `Mes: ${formatXAxis(String(label))}` : `Fecha: ${String(label)}`}
                          </p>
                          {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center justify-between gap-4 mb-1">
                              <span style={{ color: entry.color }} className="font-medium text-sm">
                                {entry.name}
                              </span>
                              <span className="text-foreground font-bold text-sm">
                                {entry.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                {visibleSeries.patients && <Bar dataKey="patients" name="Pacientes" fill="#3b82f6" radius={[4, 4, 0, 0]} />}
                {visibleSeries.treatments && <Bar dataKey="treatments" name="Tratamientos" fill="#10b981" radius={[4, 4, 0, 0]} />}
                {visibleSeries.appointments && <Bar dataKey="appointments" name="Citas" fill="#a855f7" radius={[4, 4, 0, 0]} />}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="group p-6 rounded-2xl bg-gradient-to-br from-card to-card/50 border border-border hover:border-primary/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all duration-500">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <Stethoscope className="text-primary" size={24} />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            Gestión de Pacientes
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
            Configuración de Clínica
          </h3>
          <p className="text-muted-foreground text-sm mb-6">
            Completa el perfil de tu clínica y personaliza tus preferencias de facturación.
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
