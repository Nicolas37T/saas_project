"use client";

import { useEffect, useState } from "react";
import { Activity, Settings, ArrowRight, Stethoscope, Users, Calendar, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { tenantApi, DashboardData } from "@/lib/api";
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
  const [timeRange, setTimeRange] = useState("7");
  const [visibleSeries, setVisibleSeries] = useState({
    patients: true,
    treatments: true,
    appointments: true,
  });

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const user = token ? decodeJWT(token) : null;

  const fetchStats = async (days: number) => {
    setLoading(true);
    try {
      const response = await tenantApi.getDashboardStats(days);
      setData(response);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(parseInt(timeRange));
  }, [timeRange]);

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
            <p className="text-muted-foreground text-sm">Visualización de nuevos registros</p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
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

            {/* Time Range Selector */}
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px] bg-card border-border">
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 días</SelectItem>
                <SelectItem value="15">Últimos 15 días</SelectItem>
                <SelectItem value="30">Últimos 30 días</SelectItem>
                <SelectItem value="90">Últimos 90 días</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="h-[350px] w-full">
          {loading && !data ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  dy={10}
                  interval={parseInt(timeRange) > 15 ? (parseInt(timeRange) > 30 ? 6 : 2) : 0}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '12px',
                    color: 'hsl(var(--foreground))'
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
