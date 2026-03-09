"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  LayoutList,
  CheckCircle2,
  DollarSign,
  Activity,
  ChevronRight,
} from "lucide-react";
import { tenantApi, Treatment, Patient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function TreatmentsPage() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);

  // Solo para crear tratamiento se necesita, pero no hay fk a paciente directo en model de tratamiento
  // En nuestro caso, Patient <-> MedicalHistory <-> Treatment.
  // Por simplicidad en la UI conectaremos a pacientes si es posible o asumimos creaciones base.

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTreatment, setNewTreatment] = useState({
    description: "",
    price: 0,
    status_treatments: "pending",
    duration_minutes: 30,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await tenantApi.getTreatments();
      setTreatments(data);
    } catch (error) {
      console.error("Failed to load treatments", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Asignar fecha actual
      const dataToSave = {
        ...newTreatment,
        date: new Date().toISOString(),
      };
      await tenantApi.createTreatment(dataToSave);
      setIsAddModalOpen(false);
      setNewTreatment({
        description: "",
        price: 0,
        status_treatments: "pending",
        duration_minutes: 30,
      });
      loadData();
    } catch (error) {
      console.error("Error creating treatment", error);
    }
  };

  const getStatusTheme = (s: string) => {
    switch (s) {
      case "completed":
        return "text-green-400 bg-green-500/10 border-green-500/20";
      case "in_progress":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      default:
        return "text-orange-400 bg-orange-500/10 border-orange-500/20";
    }
  };

  const getStatusLabel = (s: string) => {
    switch (s) {
      case "completed":
        return "Completado";
      case "in_progress":
        return "En progreso";
      default:
        return "Pendiente";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
            Tratamientos
          </h1>
          <p className="text-slate-400">
            Administra los procedimientos y servicios dentales realizados.
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all"
        >
          <Plus className="mr-2" size={18} /> Nuevo Procedimiento
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : treatments.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Activity className="text-slate-400" size={32} />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">
              No hay tratamientos registrados
            </h3>
            <p className="text-slate-400">
              Comienza a registrar las operaciones clínicas de tu consultorio.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-medium text-sm">
                <tr>
                  <th className="p-4 pl-6 font-semibold">Procedimiento</th>
                  <th className="p-4 font-semibold">Estado</th>
                  <th className="p-4 font-semibold">Honorarios</th>
                  <th className="p-4 font-semibold hidden md:table-cell">
                    Duración
                  </th>
                  <th className="p-4 font-semibold hidden lg:table-cell">
                    Fecha Base
                  </th>
                  <th className="p-4 text-center font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {treatments.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="p-4 pl-6 text-white font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-indigo-400">
                          <LayoutList size={16} />
                        </div>
                        <span className="truncate max-w-[200px]">
                          {t.description}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusTheme(t.status_treatments)}`}
                      >
                        {t.status_treatments === "completed" && (
                          <CheckCircle2 size={12} />
                        )}
                        {getStatusLabel(t.status_treatments)}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300 font-medium">
                      <div className="flex items-center">
                        <DollarSign size={14} className="text-slate-500 mr-1" />
                        {t.price.toFixed(2)}
                      </div>
                    </td>
                    <td className="p-4 text-slate-400 text-sm hidden md:table-cell">
                      {t.duration_minutes ? `${t.duration_minutes} min` : "-"}
                    </td>
                    <td className="p-4 text-slate-400 text-sm hidden lg:table-cell">
                      {t.date ? new Date(t.date).toLocaleDateString() : "-"}
                    </td>
                    <td className="p-4 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-500 hover:text-white group-hover:bg-indigo-500/20 group-hover:text-indigo-400 rounded-lg"
                      >
                        Cobrar / Opciones{" "}
                        <ChevronRight size={16} className="ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Treatment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-2xl">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-6">
                Registrar Tratamiento
              </h2>
              <form onSubmit={handleCreateTreatment} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    Descripción del Procedimiento
                  </label>
                  <Input
                    required
                    placeholder="Ej. Extracción dental simple, Limpieza..."
                    value={newTreatment.description}
                    onChange={(e) =>
                      setNewTreatment({
                        ...newTreatment,
                        description: e.target.value,
                      })
                    }
                    className="bg-slate-950/50 border-slate-800 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Precio / Costo ($)
                    </label>
                    <Input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={isNaN(newTreatment.price) ? "" : newTreatment.price}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setNewTreatment({
                          ...newTreatment,
                          price: isNaN(val) ? 0 : val,
                        });
                      }}
                      className="bg-slate-950/50 border-slate-800 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Duración (minutos)
                    </label>
                    <Input
                      type="number"
                      value={isNaN(newTreatment.duration_minutes) ? "" : newTreatment.duration_minutes}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setNewTreatment({
                          ...newTreatment,
                          duration_minutes: isNaN(val) ? 0 : val,
                        });
                      }}
                      className="bg-slate-950/50 border-slate-800 text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    Estado Inicial
                  </label>
                  <select
                    className="w-full p-2.5 rounded-md bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    value={newTreatment.status_treatments}
                    onChange={(e) =>
                      setNewTreatment({
                        ...newTreatment,
                        status_treatments: e.target.value,
                      })
                    }
                  >
                    <option value="pending">Pendiente</option>
                    <option value="in_progress">En Progreso</option>
                    <option value="completed">Completado</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 mt-8">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsAddModalOpen(false)}
                    className="text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Guardar Tratamiento
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
