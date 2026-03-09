"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Activity,
  FileText,
  Calendar,
  Plus,
  Save,
} from "lucide-react";
import { tenantApi, Patient, MedicalHistory } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function PatientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [history, setHistory] = useState<MedicalHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddingHistory, setIsAddingHistory] = useState(false);
  const [newHistory, setNewHistory] = useState({
    conditions: "",
    allergies: "",
    medications: "",
    description: "",
  });

  useEffect(() => {
    if (!id) return;
    loadPatientData();
  }, [id]);

  const loadPatientData = async () => {
    setLoading(true);
    try {
      const [patientData, historyData] = await Promise.all([
        tenantApi.getPatient(id),
        tenantApi.getMedicalHistories(id),
      ]);
      setPatient(patientData);
      setHistory(historyData);
    } catch (error) {
      console.error("Error loading patient data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHistory = async () => {
    try {
      await tenantApi.createMedicalHistory(id, newHistory);
      setIsAddingHistory(false);
      setNewHistory({
        conditions: "",
        allergies: "",
        medications: "",
        description: "",
      });
      loadPatientData();
    } catch (error) {
      console.error("Error adding history", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin w-8 h-8 flex border-2 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (!patient) return <div className="text-white">Paciente no encontrado</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center text-slate-400 hover:text-white transition-colors text-sm mb-4"
      >
        <ArrowLeft size={16} className="mr-2" /> Volver a pacientes
      </button>

      {/* Header Profile */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-blue-500/20">
            {patient.first_name[0]}
            {patient.last_name[0]}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              {patient.first_name} {patient.last_name}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-slate-400">
              {patient.phone && <span>📞 {patient.phone}</span>}
              <span>🗓️ {patient.status ? "Activo" : "Inactivo"}</span>
              <span>
                ⏳ Registro: {new Date(patient.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="border-slate-700 bg-slate-900 text-white hover:bg-slate-800"
          >
            Editar Perfil
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]">
            Nueva Cita
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Information Column */}
        <div className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-white font-semibold flex items-center gap-2">
                <Activity size={18} className="text-blue-400" />
                Historial Clínico
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-slate-500 italic">
                  No hay registros médicos.
                </p>
              ) : (
                <div className="space-y-4">
                  {/* Muestra el más reciente en el resumen */}
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/50">
                    <p className="text-sm text-slate-300 mb-2">
                      <span className="text-slate-500">Condiciones:</span>{" "}
                      {history[history.length - 1].conditions || "Ninguna"}
                    </p>
                    <p className="text-sm text-slate-300">
                      <span className="text-slate-500">Alergias:</span>{" "}
                      {history[history.length - 1].allergies || "Ninguna"}
                    </p>
                  </div>
                </div>
              )}
              <Button
                onClick={() => setIsAddingHistory(!isAddingHistory)}
                variant="outline"
                className="w-full mt-4 border-slate-700 text-blue-400 hover:text-blue-300 hover:bg-slate-800"
              >
                <Plus size={16} className="mr-2" /> Agregar Registro
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Calendar size={18} className="text-blue-400" /> Citas Próximas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 text-center py-4">
                No hay citas programadas.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Timeline Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Form for new medical history entry */}
          {isAddingHistory && (
            <Card className="bg-gradient-to-br from-slate-900 flex-1 to-blue-950/20 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.05)]">
              <CardHeader>
                <CardTitle className="text-white">
                  Nuevo Registro Médico
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Actualiza las condiciones y alergias de {patient.first_name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Condiciones Preexistentes
                    </label>
                    <Input
                      placeholder="Ej: Diabetes, Hipertensión..."
                      className="bg-slate-950 border-slate-800 text-white"
                      value={newHistory.conditions}
                      onChange={(e) =>
                        setNewHistory({
                          ...newHistory,
                          conditions: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Alergias Conocidas
                    </label>
                    <Input
                      placeholder="Ej: Penicilina, Látex..."
                      className="bg-slate-950 border-slate-800 text-white"
                      value={newHistory.allergies}
                      onChange={(e) =>
                        setNewHistory({
                          ...newHistory,
                          allergies: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-300">
                      Medicamentos Actuales
                    </label>
                    <Input
                      placeholder="Medicamentos que toma de forma regular"
                      className="bg-slate-950 border-slate-800 text-white"
                      value={newHistory.medications}
                      onChange={(e) =>
                        setNewHistory({
                          ...newHistory,
                          medications: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-300">
                      Notas / Descripción Adicional
                    </label>
                    <textarea
                      placeholder="Detalles de la consulta..."
                      className="w-full min-h-[100px] p-3 rounded-md bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      value={newHistory.description}
                      onChange={(e) =>
                        setNewHistory({
                          ...newHistory,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="ghost"
                    onClick={() => setIsAddingHistory(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveHistory}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
                  >
                    <Save size={16} className="mr-2" /> Guardar Registro
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline of previous records */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText size={20} className="text-blue-500" /> Registros
              Anteriores
            </h3>
            {history.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
                <p className="text-slate-500">
                  Este paciente no tiene registros históricos todavía.
                </p>
              </div>
            ) : (
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
                {history.map((record, index) => (
                  <div
                    key={record.id}
                    className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-950 bg-slate-800 group-hover:bg-blue-500 text-slate-500 group-hover:text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-lg transition-colors duration-300">
                      <Activity size={16} />
                    </div>
                    <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-900/80 border-slate-800 backdrop-blur-sm group-hover:border-slate-700 transition-colors">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm text-slate-400 font-medium">
                          {new Date(record.created_at).toLocaleDateString()} a
                          las{" "}
                          {new Date(record.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="space-y-2 mt-2">
                          {record.conditions && (
                            <p className="text-sm text-white">
                              <span className="text-slate-500">
                                Condiciones:
                              </span>{" "}
                              {record.conditions}
                            </p>
                          )}
                          {record.allergies && (
                            <p className="text-sm text-white">
                              <span className="text-slate-500">Alergias:</span>{" "}
                              {record.allergies}
                            </p>
                          )}
                          {record.medications && (
                            <p className="text-sm text-white">
                              <span className="text-slate-500">
                                Antologia Médica:
                              </span>{" "}
                              {record.medications}
                            </p>
                          )}
                          {record.description && (
                            <div className="mt-3 p-3 bg-slate-950 rounded border border-slate-800 text-sm text-slate-300">
                              {record.description}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
