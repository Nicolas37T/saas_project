"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Activity, FileText, Calendar } from "lucide-react";
import {
  tenantApi,
  Patient,
  MedicalHistory,
  Appointment,
  Treatment,
  Employee,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomModal, SuccessModal } from "@/components/ui/custom-modal";

const appointmentStatusMap: Record<string, string> = {
  scheduled: "Programada",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "No asiste",
};

const treatmentStatusMap: Record<string, string> = {
  pending: "Pendiente",
  in_progress: "En progreso",
  completed: "Completado",
  cancelled: "Cancelado",
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
        const [
          patientData,
          historyData,
          appointmentsData,
          treatmentsData,
          employees,
        ] = await Promise.all([
          tenantApi.getPatient(id),
          tenantApi.getMedicalHistories(id).catch(() => []),
          tenantApi.getAppointments().catch(() => []),
          tenantApi.getTreatments().catch(() => []),
          tenantApi.getEmployees().catch(() => []),
        ]);
        setPatient(patientData);
        setHistory(historyData);
        setAppointments(
          appointmentsData.filter(
            (a) =>
              a.patient_id === id &&
              a.appointment_status !== "completed" &&
              a.appointment_status !== "cancelled",
          ),
        );
        setTreatments(treatmentsData);
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

      setSuccessInfo({
        title: "Perfil Actualizado",
        message: "Los datos del paciente se modificaron correctamente.",
      });
      setIsSuccessModalOpen(true);

      // Reload logic
      const [patientData] = await Promise.all([tenantApi.getPatient(id)]);
      setPatient(patientData);
    } catch (error) {
      console.error("Error updating patient", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin w-8 h-8 flex border-2 border-primary rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (!patient) return <div className="text-muted-foreground">Paciente no encontrado</div>;

  const role =
    typeof window !== "undefined"
      ? localStorage.getItem("user_role")
      : "empleado";
  const isReceptionist = role === "recepcionista";

  const calculateDebt = () => {
    let totalCosto = 0;
    let totalPagado = 0;

    treatments.forEach((t) => {
      // Logic same as payments page: only count if it belongs to this patient and price > 0
      const odontogramPatientId = t.odontogram?.patient_id;
      if (odontogramPatientId === id && t.price > 0) {
        totalCosto += t.price;
        const tPaid =
          t.payments?.reduce((acc, pay) => acc + pay.amount, 0) || 0;
        totalPagado += tPaid;
      }
    });

    return Math.max(0, totalCosto - totalPagado);
  };

  const debt = calculateDebt();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center text-muted-foreground hover:text-foreground transition-colors text-sm mb-4"
      >
        <ArrowLeft size={16} className="mr-2" /> Volver a pacientes
      </button>

      {/* Header Profile */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center text-3xl font-bold text-primary-foreground shadow-lg shadow-primary/20">
            {patient.first_name[0]}
            {patient.last_name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold mb-1 leading-tight">
              <div className="break-all">{patient.first_name}</div>
              <div className="break-all text-muted-foreground">
                {patient.last_name}
              </div>
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {patient.phone && <span>📞 {patient.phone}</span>}
              <span>🗓️ {patient.status ? "Activo" : "Inactivo"}</span>
              <span>
                ⏳ Registro: {new Date(patient.created_at).toLocaleDateString()}
              </span>
              {patient.assigned_doctor_id && (
                <span className="text-primary">
                  👨‍⚕️ Doctor:{" "}
                  {employeesList.find(
                    (e) => e.id === patient.assigned_doctor_id,
                  )?.full_name || "Asignado"}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {debt > 0 && (
            <Button
              onClick={() => router.push(`/dashboard/payments?patientId=${id}`)}
              className="bg-orange-600 hover:bg-orange-700 text-white gap-2 shadow-[0_0_15px_rgba(234,88,12,0.4)] animate-pulse"
            >
              <FileText size={18} />
              Deuda Pendiente: ${debt}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleOpenEdit}
            className="border-border bg-muted hover:bg-accent"
          >
            Editar Perfil
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(37,99,235,0.3)]">
            Nueva Cita
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Information Column */}
        <div className="space-y-6">
          {!isReceptionist && (
            <Card className="bg-card border-border backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Activity size={18} className="text-primary" />
                  Historial Clínico
                </CardTitle>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    No hay registros médicos.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {/* Muestra el más reciente en el resumen */}
                    <div className="p-3 bg-muted rounded-lg border border-border/50">
                      <p className="text-sm mb-2">
                        <span className="text-muted-foreground">Condiciones:</span>{" "}
                        {history[history.length - 1].conditions || "Ninguna"}
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Alergias:</span>{" "}
                        {history[history.length - 1].allergies || "Ninguna"}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="bg-card border-border backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar size={18} className="text-primary" /> Citas Próximas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay citas programadas.
                </p>
              ) : (
                <div className="space-y-3">
                  {appointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="p-3 bg-muted/50 rounded-lg border border-border/50"
                    >
                      <p className="text-sm font-medium">
                        {new Date(apt.appointment_date).toLocaleDateString()} a
                        las{" "}
                        {new Date(apt.appointment_date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 uppercase">
                        Estado:{" "}
                        {translateStatus(
                          apt.appointment_status,
                          appointmentStatusMap,
                        )}
                      </p>
                      {apt.assigned_doctor_id && (
                        <p className="text-xs text-primary mt-1 font-medium">
                          👨‍⚕️ Dr.{" "}
                          {employeesList.find(
                            (e) => e.id === apt.assigned_doctor_id,
                          )?.username ||
                            employeesList.find(
                              (e) => e.id === apt.assigned_doctor_id,
                            )?.full_name ||
                            "Asignado"}
                        </p>
                      )}
                      {apt.notes && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {apt.notes}
                        </p>
                      )}
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
              <h3 className="text-xl font-bold flex items-center gap-2">
                <FileText size={20} className="text-primary" /> Historial de
                Tratamientos
              </h3>
              {treatments.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-border rounded-xl bg-muted/30">
                  <p className="text-muted-foreground">
                    Este paciente no tiene tratamientos registrados.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                  {treatments.map((treatment) => (
                    <div
                      key={treatment.id}
                      className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-muted group-hover:bg-primary text-muted-foreground group-hover:text-primary-foreground shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-lg transition-colors duration-300">
                        <Activity size={16} />
                      </div>
                      <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card border-border backdrop-blur-sm group-hover:border-border transition-colors">
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-sm font-medium">
                            {treatment.treatment_date
                              ? new Date(treatment.treatment_date).toLocaleDateString()
                              : "Sin fecha"}
                            {treatment.treatment_date &&
                              ` a las ${new Date(
                                treatment.treatment_date,
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}`}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="space-y-2 mt-2">
                            <p className="text-sm">
                              <span className="text-muted-foreground">
                                Tratamiento:
                              </span>{" "}
                              {treatment.description}
                            </p>
                            <p className="text-sm capitalize">
                              <span className="text-muted-foreground">Estado:</span>{" "}
                              {treatment.procedure_status === "completado"
                                ? "Completado"
                                : treatment.procedure_status === "en_progreso"
                                ? "En progreso"
                                : "Pendiente"}
                            </p>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Precio:</span> $
                              {treatment.price === 0 ? "Privado" : treatment.price}
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
                <label className="text-sm font-medium">
                  Nombre *
                </label>
                <Input
                  required
                  value={editForm.first_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm({ ...editForm, first_name: e.target.value })
                  }
                  className="bg-muted/50 border-border focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Apellidos *
                </label>
                <Input
                  required
                  value={editForm.last_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm({ ...editForm, last_name: e.target.value })
                  }
                  className="bg-muted/50 border-border focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Teléfono
                </label>
                <Input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                  className="bg-muted/50 border-border focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Fecha de Nacimiento
                </label>
                <Input
                  type="date"
                  value={editForm.birth_day}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm({ ...editForm, birth_day: e.target.value })
                  }
                  className="bg-muted/50 border-border focus-visible:ring-primary"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Dirección
              </label>
              <Input
                value={editForm.address}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditForm({ ...editForm, address: e.target.value })
                }
                className="bg-muted/50 border-border focus-visible:ring-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Descripción / Notas
                </label>
                <Input
                  value={editForm.description}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  className="bg-muted/50 border-border focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Doctor Asignado
                </label>
                <select
                  required
                  value={editForm.assigned_doctor_id}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      assigned_doctor_id: e.target.value,
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {employeesList.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name || emp.username}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-8">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditModalOpen(false)}
                className="hover:bg-accent"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
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
