"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Activity,
  Calendar,
  Search,
  Stethoscope,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { tenantApi, Treatment, Odontogram } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type FilterType = "today" | "week" | "month" | "all";

interface DisplayProcedure extends Treatment {
  patient_name: string;
  tooth_number: string | number;
  tooth_type: string;
  notes?: string;
}

export default function TreatmentsPage() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const tData = await tenantApi.getTreatments();
      setTreatments(tData);
    } catch (error) {
      console.error("Failed to load treatments", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (treatmentId: string, newStatus: string) => {
    setUpdatingId(treatmentId);
    try {
      await tenantApi.updateTreatment(treatmentId, { procedure_status: newStatus });
      // Reload data to reflect changes
      const tData = await tenantApi.getTreatments();
      setTreatments(tData);
    } catch (error) {
      console.error("Error updating procedure status", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusTheme = (s: string) => {
    switch (s) {
      case "completado":
        return "text-green-500 bg-green-500/10 border-green-500/20";
      case "en_progreso":
        return "text-primary bg-primary/10 border-primary/20";
      default:
        return "text-orange-500 bg-orange-500/10 border-orange-500/20";
    }
  };

  const getStatusLabel = (s: string) => {
    switch (s) {
      case "completado":
        return "Completado";
      case "en_progreso":
        return "En progreso";
      default:
        return "Pendiente";
    }
  };

  // 1. Map treatments to display format
  const allProcedures = useMemo(() => {
    return treatments.map(t => {
      const patient = t.odontogram?.patient;
      return {
        ...t,
        patient_name: patient ? `${patient.first_name} ${patient.last_name}` : "Sin Paciente",
        tooth_number: t.odontogram?.tooth_number || "-",
        tooth_type: t.odontogram?.tooth_type || "-",
        notes: t.odontogram?.notes
      } as DisplayProcedure;
    });
  }, [treatments]);

  // 2. Apply Filters (Date & Search) to the flattened list
  const filteredProcedures = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    let list = allProcedures;

    // A. Date Filtering
    if (activeFilter !== "all") {
      list = list.filter(item => {
        if (!item.treatment_date) return false;
        
        const itemDate = new Date(item.treatment_date);
        
        if (activeFilter === "today") {
          return itemDate >= startOfToday && itemDate <= endOfToday;
        } 
        
        if (activeFilter === "week") {
          const startOfWeek = new Date(startOfToday);
          startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
          return itemDate >= startOfWeek && itemDate <= endOfToday;
        }
        
        if (activeFilter === "month") {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          return itemDate >= startOfMonth && itemDate <= endOfToday;
        }
        
        return true;
      });
    }

    // B. Search Filtering
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(item => 
        item.patient_name.toLowerCase().includes(s) ||
        item.description.toLowerCase().includes(s) ||
        item.tooth_number.toString().includes(s)
      );
    }

    // 3. Sort by date (newest first)
    return list.sort((a, b) => {
      const dateA = a.treatment_date ? new Date(a.treatment_date).getTime() : 0;
      const dateB = b.treatment_date ? new Date(b.treatment_date).getTime() : 0;
      return dateB - dateA;
    });
  }, [allProcedures, activeFilter, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
            <Stethoscope className="text-primary" />
            Control de Tratamientos
          </h1>
          <p className="text-muted-foreground">
            Detalle pormenorizado de procedimientos clínicos por pieza dental.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadData}
          className="bg-muted border-border hover:bg-accent"
        >
          <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refrescar
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-card p-4 border border-border rounded-xl backdrop-blur-sm shadow-xl">
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Buscar paciente o procedimiento..."
              className="pl-10 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/50 transition-all focus:border-primary/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border border-border w-full lg:w-auto overflow-x-auto no-scrollbar">
          {(["all", "today", "week", "month"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-5 py-2 text-xs font-bold rounded-md transition-all whitespace-nowrap uppercase tracking-wider ${
                activeFilter === f
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {f === "all" ? "Todos" : f === "today" ? "Hoy" : f === "week" ? "Esta Semana" : "Este Mes"}
            </button>
          ))}
        </div>
      </div>

      {loading && treatments.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-24 gap-4">
          <div className="animate-spin w-10 h-10 rounded-full border-2 border-primary border-t-transparent shadow-[0_0_15px_rgba(99,102,241,0.3)]"></div>
          <p className="text-muted-foreground animate-pulse text-sm font-medium tracking-widest">CARGANDO PROCEDIMIENTOS...</p>
        </div>
      ) : filteredProcedures.length === 0 ? (
        <Card className="bg-card border-border border-dashed backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6 border border-border/50">
              <Activity className="text-muted-foreground" size={40} />
            </div>
            <h3 className="text-2xl font-bold mb-3">
              No se encontraron procedimientos registrados
            </h3>
            <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
              {activeFilter !== "all"
                ? `No hay registros para el filtro "${activeFilter === "today" ? "Hoy" : activeFilter === "week" ? "Esta Semana" : "Este Mes"}".`
                : "Los tratamientos deben tener piezas dentales vinculadas en el odontograma para aparecer en este listado detallado."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-card rounded-2xl border border-border shadow-2xl overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-muted/80 text-muted-foreground uppercase tracking-[0.1em] font-black border-b border-border/80">
                <tr>
                  <th className="px-6 py-5">Paciente</th>
                  <th className="px-6 py-5">Pieza</th>
                  <th className="px-6 py-5">Procedimiento / Detalle</th>
                  <th className="px-6 py-5">Estado</th>
                  <th className="px-6 py-5">Fecha</th>
                  <th className="px-6 py-5 text-right">Monto Acordado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredProcedures.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-primary/5 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center text-primary-foreground font-black text-[11px] shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                          {item.patient_name.charAt(0)}
                        </div>
                        <span className="font-bold group-hover:text-foreground transition-colors">{item.patient_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <Badge className="bg-muted/60 text-primary border border-primary/30 px-3 py-1.5 font-black text-[11px] rounded-md">
                        #{item.tooth_number}
                      </Badge>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-black mb-0.5 tracking-tight group-hover:text-primary transition-colors uppercase">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                          Pieza {item.tooth_type === 'adult' ? 'Permanente' : 'Temporal'}
                        </span>
                        {item.notes && (
                            <>
                                <span className="text-border">•</span>
                                <span className="text-[10px] text-muted-foreground italic truncate max-w-[200px]">{item.notes}</span>
                            </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black border ${getStatusTheme(item.procedure_status)} uppercase tracking-widest shadow-sm`}>
                          {getStatusLabel(item.procedure_status)}
                        </span>
                        {item.procedure_status !== 'completado' && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 hover:text-green-500 hover:bg-green-500/10 transition-all rounded-full"
                            onClick={() => handleStatusUpdate(item.id, 'completado')}
                            disabled={updatingId === item.id}
                          >
                            {updatingId === item.id ? (
                              <RefreshCw size={14} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={16} />
                            )}
                          </Button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-muted-foreground">
                      <div className="flex items-center gap-2 font-mono font-medium text-[11px]">
                        <Calendar size={13} className="text-muted-foreground group-hover:text-primary transition-colors" />
                        {item.treatment_date ? new Date(item.treatment_date).toLocaleDateString() : "--"}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`font-black tracking-tight group-hover:scale-105 transition-transform origin-right text-sm ${item.price === 0 ? "text-muted-foreground italic" : "text-amber-500"}`}>
                            {item.price === 0 ? "Privado" : `Bs. ${item.price.toLocaleString()}`}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Summary Footer */}
          <div className="bg-muted/40 px-6 py-4 flex justify-between items-center border-t border-border">
            <p className="text-muted-foreground text-[10px] uppercase font-black tracking-widest">
              Total procedimientos listados: {filteredProcedures.length}
            </p>
            <div className="flex items-center gap-2">
                 <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest leading-tight text-right w-40">
                    Calculado excluyendo
                    <br />
                    tratamientos privados
                 </p>
                 <div className="flex flex-col border-l border-border ml-2 pl-4">
                    <p className="text-muted-foreground text-[10px] uppercase font-black tracking-widest text-right">Suma Mostrada:</p>
                     <span className="text-primary font-black text-sm text-right">
                        Bs. {filteredProcedures.reduce((acc, curr) => acc + (curr.price || 0), 0).toLocaleString()}
                     </span>
                 </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
