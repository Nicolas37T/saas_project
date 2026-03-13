"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Activity,
  FileText,
  Calendar,
} from "lucide-react";
import { tenantApi, Patient, MedicalHistory, Appointment, Treatment, Employee } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CustomModal, SuccessModal } from "@/components/ui/custom-modal";

const appointmentStatusMap: Record<string, string> = {
  "scheduled": "Programada",
  "completed": "Completada",
  "cancelled": "Cancelada",
  "no_show": "No asiste",
};

const treatmentStatusMap: Record<string, string> = {
  "pending": "Pendiente",
  "in_progress": "En progreso",
  "completed": "Completado",
  "cancelled": "Cancelado",
};

const translateStatus = (status: string, map: Record<string, string>) => {
  if (!status) return "";
  const key = status.toLowerCase();
  return map[key] || status;
};

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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [employeesList, setEmployeesList] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Patient
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
    birth_day: "",
    description: "",
    assigned_doctor_id: "",
  });

  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successInfo, setSuccessInfo] = useState({ title: "", message: "" });

  useEffect(() => {
    if (!id) return;

    const loadPatientData = async () => {
      setLoading(true);
      try {
        const [patientData, historyData, appointmentsData, treatmentsData, employees] = await Promise.all([
          tenantApi.getPatient(id),
          tenantApi.getMedicalHistories(id).catch(() => []),
          tenantApi.getAppointments().catch(() => []),
          tenantApi.getTreatments().catch(() => []),
          tenantApi.getEmployees().catch(() => [])
        ]);
        setPatient(patientData);
        setHistory(historyData);
        setAppointments(appointmentsData.filter(a => a.patient_id === id && a.appointment_status !== "completed" && a.appointment_status !== "cancelled"));
        setTreatments(treatmentsData.filter(t => t.patient_id === id));
        setEmployeesList(employees.filter((emp: Employee) => emp.status));
      } catch (error) {
        console.error("Error loading patient data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPatientData();
  }, [id]);

  const handleOpenEdit = () => {
    if (!patient) return;
    setEditForm({
      first_name: patient.first_name,
      last_name: patient.last_name,
      phone: patient.phone || "",
      address: patient.address || "",
      birth_day: patient.birth_day
        ? new Date(patient.birth_day).toISOString().split("T")[0]
        : "",
      description: patient.description || "",
      assigned_doctor_id: patient.assigned_doctor_id || "",
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    try {
      await tenantApi.updatePatient(patient.id, {
        ...editForm,
        birth_day: editForm.birth_day ? editForm.birth_day : undefined,
        assigned_doctor_id: editForm.assigned_doctor_id || undefined,
      });
      setIsEditModalOpen(false);
      
      setSuccessInfo({ title: "Perfil Actualizado", message: "Los datos del paciente se modificaron correctamente." });
      setIsSuccessModalOpen(true);
      
      // Reload logic
      const [patientData] = await Promise.all([
        tenantApi.getPatient(id)
      ]);
      setPatient(patientData);
    } catch (error) {
      console.error("Error updating patient", error);
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

  const role = typeof window !== 'undefined' ? localStorage.getItem("user_role") : "empleado";
  const isReceptionist = role === "recepcionista";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center text-slate-400 hover:text-white transition-colors text-sm mb-4"
      >
        <ArrowLeft size={16} className="mr-2" /> Volver a pacientes
      </button>

      {/* Header Profile */}
      <div className="flex flex-col md:flexg-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-blue-500/20">
            {patient.first_name[0]}
            {patient.last_name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 leading-tight">
              <div className="break-all">{patient.first_name}</div>
              <div className="break-all text-slate-300">{patient.last_name}</div>
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-slate-400">
              {patient.phone && <span>📞 {patient.phone}</span>}
              <span>🗓️ {patient.status ? "Activo" : "Inactivo"}</span>
              <span>
                ⏳ Registro: {new Date(patient.created_at).toLocaleDateString()}
              </span>
              {patient.assigned_doctor_id && (
                <span className="text-blue-400">
                  👨‍⚕️ Doctor: {                    
                    employeesList.find(e => e.id === patient.assigned_doctor_id)?.full_name || 
                    "Asignado"
                  }
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleOpenEdit}
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
          {!isReceptionist && (
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
              </CardContent>
            </Card>
          )}

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Calendar size={18} className="text-blue-400" /> Citas Próximas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  No hay citas programadas.
                </p>
              ) : (
                <div className="space-y-3">
                  {appointments.map((apt) => (
                    <div key={apt.id} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                      <p className="text-white text-sm font-medium">
                        {new Date(apt.appointment_date).toLocaleDateString()} a las {new Date(apt.appointment_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 uppercase">Estado: {translateStatus(apt.appointment_status, appointmentStatusMap)}</p>
                      {apt.assigned_doctor_id && (
                        <p className="text-xs text-blue-400 mt-1 font-medium">
                          👨‍⚕️ Dr. {
                            employeesList.find(e => e.id === apt.assigned_doctor_id)?.username || 
                            employeesList.find(e => e.id === apt.assigned_doctor_id)?.full_name || 
                            "Asignado"
                          }
                        </p>
                      )}
                      {apt.notes && <p className="text-xs text-slate-500 mt-1">{apt.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Timeline Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timeline of treatments */}
          {!isReceptionist && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText size={20} className="text-blue-500" /> Historial de Tratamientos
              </h3>
              {treatments.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
                  <p className="text-slate-500">
                    Este paciente no tiene tratamientos registrados.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
                  {treatments.map((treatment) => (
                    <div
                      key={treatment.id}
                      className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-950 bg-slate-800 group-hover:bg-blue-500 text-slate-500 group-hover:text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-lg transition-colors duration-300">
                        <Activity size={16} />
                      </div>
                      <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-900/80 border-slate-800 backdrop-blur-sm group-hover:border-slate-700 transition-colors">
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-sm text-slate-400 font-medium">
                            {treatment.date ? new Date(treatment.date).toLocaleDateString() : 'Sin fecha'}
                            {treatment.date && ` a las ${new Date(treatment.date).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}`}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="space-y-2 mt-2">
                            <p className="text-sm text-white">
                              <span className="text-slate-500">
                                Tratamiento:
                              </span>{" "}
                              {treatment.description}
                            </p>
                            <p className="text-sm text-white capitalize">
                              <span className="text-slate-500">Estado:</span>{" "}
                              {translateStatus(treatment.status_treatments, treatmentStatusMap)}
                            </p>
                            <p className="text-sm text-white">
                              <span className="text-slate-500">Precio:</span>{" "}
                              ${treatment.price}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── MODAL: EDITAR PACIENTE ────────────────────────────────────────────── */}
      <CustomModal
        isOpen={isEditModalOpen && !!patient}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Perfil"
      >
        {patient && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Nombre *</label>
                <Input
                  required
                  value={editForm.first_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({ ...editForm, first_name: e.target.value })}
                  className="bg-slate-950/50 border-slate-800 text-white focus-visible:ring-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Apellidos *</label>
                <Input
                  required
                  value={editForm.last_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({ ...editForm, last_name: e.target.value })}
                  className="bg-slate-950/50 border-slate-800 text-white focus-visible:ring-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Teléfono</label>
                <Input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="bg-slate-950/50 border-slate-800 text-white focus-visible:ring-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Fecha de Nacimiento</label>
                <Input
                  type="date"
                  value={editForm.birth_day}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({ ...editForm, birth_day: e.target.value })}
                  className="bg-slate-950/50 border-slate-800 text-white focus-visible:ring-indigo-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Dirección</label>
              <Input
                value={editForm.address}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({ ...editForm, address: e.target.value })}
                className="bg-slate-950/50 border-slate-800 text-white focus-visible:ring-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Descripción / Notas</label>
                <Input
                  value={editForm.description}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({ ...editForm, description: e.target.value })}
                  className="bg-slate-950/50 border-slate-800 text-white focus-visible:ring-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Doctor Asignado</label>
                <select
                  required
                  value={editForm.assigned_doctor_id}
                  onChange={(e) => setEditForm({ ...editForm, assigned_doctor_id: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  {employeesList.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.full_name || emp.username}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-8">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Guardar Cambios
              </Button>
            </div>
          </form>
        )}
      </CustomModal>

      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title={successInfo.title}
        message={successInfo.message}
      />
    </div>
  );
}
