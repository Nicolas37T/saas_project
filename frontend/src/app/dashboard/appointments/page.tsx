"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Calendar as CalendarIcon,
  Clock,
  User,
  FileText,
} from "lucide-react";
import { tenantApi, Appointment, Patient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state for adding appointment
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    patient_id: "",
    appointment_date: "",
    appointment_time: "",
    notes: "",
    appointment_status: "scheduled",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appData, patData] = await Promise.all([
        tenantApi.getAppointments(),
        tenantApi.getPatients(),
      ]);
      // Sort appointments by date
      const sorted = appData.sort(
        (a, b) =>
          new Date(a.appointment_date).getTime() -
          new Date(b.appointment_date).getTime(),
      );
      setAppointments(sorted);
      setPatients(patData);
    } catch (error) {
      console.error("Failed to load appointments data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Combine date and time
      const combinedDate = new Date(
        `${newAppointment.appointment_date}T${newAppointment.appointment_time}`,
      );

      await tenantApi.createAppointment({
        patient_id: newAppointment.patient_id,
        appointment_date: combinedDate.toISOString(),
        notes: newAppointment.notes,
        appointment_status: newAppointment.appointment_status,
      });

      setIsAddModalOpen(false);
      setNewAppointment({
        patient_id: "",
        appointment_date: "",
        appointment_time: "",
        notes: "",
        appointment_status: "scheduled",
      });
      loadData(); // refresh list
    } catch (error) {
      console.error("Error creating appointment", error);
    }
  };

  // Helper to get patient name
  const getPatientName = (id: string) => {
    const p = patients.find((p) => p.id === id);
    return p ? `${p.first_name} ${p.last_name}` : "Paciente Desconocido";
  };

  // Helper for status styling
  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "scheduled":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "confirmed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "completed":
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
            Citas
          </h1>
          <p className="text-slate-400">
            Gestiona tu agenda y los turnos de tus pacientes.
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all"
        >
          <Plus className="mr-2" size={18} /> Nueva Cita
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent"></div>
        </div>
      ) : appointments.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <CalendarIcon className="text-slate-400" size={32} />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">
              No tienes citas programadas
            </h3>
            <p className="text-slate-400">
              Tu agenda está libre. Haz clic en "Nueva Cita" para empezar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Agrupar por días - Simplificado para el dashboard visual */}
          {appointments.map((apt) => {
            const d = new Date(apt.appointment_date);
            return (
              <Card
                key={apt.id}
                className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 border-slate-800 backdrop-blur-sm hover:border-slate-700 hover:shadow-lg transition-all"
              >
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b border-slate-800/50">
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-lg">
                      {d.toLocaleDateString([], {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                    <span className="text-blue-400 font-semibold flex items-center gap-1">
                      <Clock size={14} />{" "}
                      {d.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full border uppercase tracking-wider ${getStatusStyle(apt.appointment_status)}`}
                  >
                    {apt.appointment_status}
                  </span>
                </CardHeader>
                <CardContent className="p-4 pt-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                      <User size={18} />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-medium text-slate-400 mb-1">
                        Paciente
                      </p>
                      <p className="text-white font-semibold truncate leading-none">
                        {getPatientName(apt.patient_id)}
                      </p>
                    </div>
                  </div>

                  {apt.notes && (
                    <div className="mt-4 p-3 rounded-lg bg-slate-950 border border-slate-800/50 text-sm text-slate-400 flex items-start gap-2">
                      <FileText
                        size={16}
                        className="text-slate-600 mt-0.5 shrink-0"
                      />
                      <p className="line-clamp-2">{apt.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Appointment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-2xl">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-6">
                Programar Cita
              </h2>
              <form onSubmit={handleCreateAppointment} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    Paciente
                  </label>
                  <select
                    required
                    className="w-full p-2.5 rounded-md bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    value={newAppointment.patient_id}
                    onChange={(e) =>
                      setNewAppointment({
                        ...newAppointment,
                        patient_id: e.target.value,
                      })
                    }
                  >
                    <option value="">Seleccione un paciente...</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.first_name} {p.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Fecha
                    </label>
                    <Input
                      type="date"
                      required
                      value={newAppointment.appointment_date}
                      onChange={(e) =>
                        setNewAppointment({
                          ...newAppointment,
                          appointment_date: e.target.value,
                        })
                      }
                      className="bg-slate-950/50 border-slate-800 text-white"
                      style={{ colorScheme: "dark" }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Hora
                    </label>
                    <Input
                      type="time"
                      required
                      value={newAppointment.appointment_time}
                      onChange={(e) =>
                        setNewAppointment({
                          ...newAppointment,
                          appointment_time: e.target.value,
                        })
                      }
                      className="bg-slate-950/50 border-slate-800 text-white"
                      style={{ colorScheme: "dark" }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    Estado Inicial
                  </label>
                  <select
                    className="w-full p-2.5 rounded-md bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    value={newAppointment.appointment_status}
                    onChange={(e) =>
                      setNewAppointment({
                        ...newAppointment,
                        appointment_status: e.target.value,
                      })
                    }
                  >
                    <option value="scheduled">Programada</option>
                    <option value="confirmed">Confirmada</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    Motivo / Notas
                  </label>
                  <textarea
                    placeholder="Motivo de la consulta..."
                    className="w-full min-h-[80px] p-3 rounded-md bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    value={newAppointment.notes}
                    onChange={(e) =>
                      setNewAppointment({
                        ...newAppointment,
                        notes: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Programar Cita
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
