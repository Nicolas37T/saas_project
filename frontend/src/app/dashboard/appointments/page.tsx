"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Calendar as CalendarIcon,
  Clock,
  User,
  FileText,
  Edit2,
  Trash2,
  List,
} from "lucide-react";
import { tenantApi, Appointment, Patient, Employee } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CustomModal, ConfirmModal, SuccessModal } from "@/components/ui/custom-modal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CalendarView from "@/components/CalendarView";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state for adding appointment
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    patient_id: "",
    appointment_date: "",
    appointment_time: "",
    notes: "",
    appointment_status: "scheduled",
    assigned_doctor_id: "",
  });

  // Modal state for editing appointment
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment & { time: string; date: string } | null>(null);

  // Modal state for custom confirmations
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Success message modal
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successInfo, setSuccessInfo] = useState({ title: "", message: "" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appData, patData, empData] = await Promise.all([
        tenantApi.getAppointments(),
        tenantApi.getPatients(),
        tenantApi.getDoctors().catch(() => []),
      ]);
      // Sort appointments by date
      const sorted = appData.sort(
        (a, b) =>
          new Date(a.appointment_date).getTime() -
          new Date(b.appointment_date).getTime(),
      );
      setAppointments(sorted);
      setPatients(patData);
      setEmployees(empData.filter((e: Employee) => e.status));
      
      // Auto-select first doctor if creating new appointment
      if (empData.length > 0 && !newAppointment.assigned_doctor_id) {
        setNewAppointment(prev => ({ ...prev, assigned_doctor_id: empData[0].id }));
      }
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
        assigned_doctor_id: newAppointment.assigned_doctor_id || undefined,
      });

      setIsAddModalOpen(false);
      setNewAppointment({
        patient_id: "",
        appointment_date: "",
        appointment_time: "",
        notes: "",
        appointment_status: "scheduled",
        assigned_doctor_id: "",
      });
      
      setSuccessInfo({ title: "Cita Programada", message: "La cita ha sido agendada con éxito." });
      setIsSuccessModalOpen(true);
      loadData(); // refresh list
    } catch (error) {
      console.error("Error creating appointment", error);
    }
  };

  const openEditModal = (apt: Appointment) => {
    const d = new Date(apt.appointment_date);
    // Use local date formatting to avoid timezone issues
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`; // YYYY-MM-DD in local timezone
    const timeStr = d.toTimeString().substring(0, 5); // HH:MM
    setEditingAppointment({
      ...apt,
      date: dateStr,
      time: timeStr,
      notes: apt.notes || "",
      assigned_doctor_id: apt.assigned_doctor_id || "",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppointment) return;
    try {
      const combinedDate = new Date(
        `${editingAppointment.date}T${editingAppointment.time}`,
      );

      await tenantApi.updateAppointment(editingAppointment.id, {
        patient_id: editingAppointment.patient_id,
        appointment_date: combinedDate.toISOString(),
        notes: editingAppointment.notes,
        appointment_status: editingAppointment.appointment_status,
        assigned_doctor_id: editingAppointment.assigned_doctor_id || undefined,
      });

      setIsEditModalOpen(false);
      setEditingAppointment(null);
      
      setSuccessInfo({ title: "Cita Actualizada", message: "Los cambios se guardaron correctamente." });
      setIsSuccessModalOpen(true);
      loadData();
    } catch (error) {
      console.error("Error updating appointment", error);
    }
  };

  const confirmDeleteAction = (id: string) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteAppointment = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await tenantApi.deleteAppointment(deletingId);
      setIsDeleteModalOpen(false);
      setDeletingId(null);
      loadData();
    } catch (error) {
      console.error("Error deleting appointment", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper to get patient name
  const getPatientName = (id: string) => {
    const p = patients.find((p) => p.id === id);
    return p ? `${p.first_name} ${p.last_name}` : "Paciente Desconocido";
  };

  // Helper to get doctor name
  const getDoctorName = (id?: string) => {
    if (!id) return "Sin Asignar";
    const d = employees.find((e) => e.id === id);
    return d ? d.full_name || d.username : "Desconocido";
  };

  // Helper for status styling
  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "scheduled":
        return "bg-primary/20 text-primary border-primary/30";
      case "confirmed":
        return "bg-green-500/20 text-green-500 border-green-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
      case "completed":
        return "bg-muted/50 text-muted-foreground border-muted-foreground/30";
      case "cancelled":
        return "bg-destructive/20 text-destructive border-destructive/30";
      default:
        return "bg-muted/50 text-muted-foreground border-muted-foreground/30";
    }
  };

  // Helper strings to map status to spanish labels
  const statusLabels: Record<string, string> = {
    scheduled: "Programada",
    confirmed: "Confirmada",
    pending: "Pendiente",
    completed: "Completada",
    cancelled: "Cancelada",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">
            Citas
          </h1>
          <p className="text-muted-foreground">
            Gestiona tu agenda y los turnos de tus pacientes.
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all"
        >
          <Plus className="mr-2" size={18} /> Nueva Cita
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin w-8 h-8 rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      ) : (
        <Tabs defaultValue="list">
          <TabsList className="mb-4">
            <TabsTrigger value="list" className="gap-1.5">
              <List size={15} /> Lista
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-1.5">
              <CalendarIcon size={15} /> Calendario
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            {appointments.length === 0 ? (
              <Card className="bg-card border-border backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-20">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <CalendarIcon className="text-muted-foreground" size={32} />
                  </div>
                  <h3 className="text-xl font-medium mb-2">
                    No tienes citas programadas
                  </h3>
                  <p className="text-muted-foreground">
                    Tu agenda está libre. Haz clic en &quot;Nueva Cita&quot; para empezar.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {appointments.map((apt) => {
                  const d = new Date(apt.appointment_date);
                  return (
                    <Card
                      key={apt.id}
                      className="bg-card border-border backdrop-blur-sm hover:border-muted-foreground/50 hover:shadow-lg transition-all"
                    >
                      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b border-border/50">
                        <div className="flex flex-col">
                          <span className="font-bold text-lg">
                            {d.toLocaleDateString([], {
                              weekday: "short",
                              day: "2-digit",
                              month: "short",
                            })}
                          </span>
                          <span className="text-primary font-semibold flex items-center gap-1">
                            <Clock size={14} />{" "}
                            {d.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full border uppercase tracking-wider ${getStatusStyle(apt.appointment_status)}`}
                          >
                            {statusLabels[apt.appointment_status.toLowerCase()] || apt.appointment_status}
                          </span>
                          <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 hover:bg-accent"
                                onClick={(e) => { e.stopPropagation(); openEditModal(apt); }}
                                title="Editar"
                              >
                                  <Edit2 size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                onClick={(e) => { e.stopPropagation(); confirmDeleteAction(apt.id); }}
                                title="Eliminar"
                              >
                                  <Trash2 size={14} />
                              </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <User size={18} />
                          </div>
                          <div className="truncate">
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                              Paciente
                            </p>
                            <p className="font-semibold truncate leading-none">
                              {getPatientName(apt.patient_id)}
                            </p>
                          </div>
                        </div>

                        {apt.assigned_doctor_id && (
                          <div className="flex items-center gap-2 mb-4 text-sm text-primary">
                            <span>👨‍⚕️</span>
                            <span className="font-medium">Dr. {getDoctorName(apt.assigned_doctor_id)}</span>
                          </div>
                        )}

                        {apt.notes && (
                          <div className="mt-4 p-3 rounded-lg bg-muted border border-border/50 text-sm flex items-start gap-2">
                            <FileText
                              size={16}
                              className="text-muted-foreground mt-0.5 shrink-0"
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
          </TabsContent>

          <TabsContent value="calendar">
            <CalendarView
              appointments={appointments}
              patients={patients}
              employees={employees}
              onEdit={openEditModal}
              onDelete={confirmDeleteAction}
              onCreateFromDate={(dateStr) => {
                setNewAppointment((prev) => ({
                  ...prev,
                  appointment_date: dateStr,
                }));
                setIsAddModalOpen(true);
              }}
              getPatientName={getPatientName}
              getDoctorName={getDoctorName}
              getStatusStyle={getStatusStyle}
              statusLabels={statusLabels}
            />
          </TabsContent>
        </Tabs>
      )}
      {/* Add Appointment Modal */}
      <CustomModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Programar Cita"
      >
        <form onSubmit={handleCreateAppointment} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Paciente
            </label>
            <select
              required
              className="w-full p-2.5 rounded-md bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
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

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Doctor Asignado
            </label>
            <select
              required
              className="w-full p-2.5 rounded-md bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={newAppointment.assigned_doctor_id}
              onChange={(e) =>
                setNewAppointment({
                  ...newAppointment,
                  assigned_doctor_id: e.target.value,
                })
              }
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name || emp.username}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
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
                className="bg-muted/50 border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
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
                className="bg-muted/50 border-border text-foreground"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Estado Inicial
            </label>
            <select
              className="w-full p-2.5 rounded-md bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={newAppointment.appointment_status}
              onChange={(e) =>
                setNewAppointment({
                  ...newAppointment,
                  appointment_status: e.target.value,
                })
              }
            >
              <option value="scheduled">Programada</option>
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmada</option>
              <option value="completed">Completada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Motivo / Notas
            </label>
            <textarea
              placeholder="Motivo de la consulta..."
              className="w-full min-h-[80px] p-3 rounded-md bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
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
              className="hover:bg-accent"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Programar Cita
            </Button>
          </div>
        </form>
      </CustomModal>

      {/* Edit Appointment Modal */}
      <CustomModal
        isOpen={isEditModalOpen && !!editingAppointment}
        onClose={() => { setIsEditModalOpen(false); setEditingAppointment(null); }}
        title="Editar Cita"
      >
        {editingAppointment && (
          <form onSubmit={handleUpdateAppointment} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Paciente
              </label>
              <select
                required
                className="w-full p-2.5 rounded-md bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 opacity-70 cursor-not-allowed"
                value={editingAppointment.patient_id}
                disabled
              >
                <option value="">Seleccione un paciente...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Doctor Asignado
              </label>
              <select
                required
                className="w-full p-2.5 rounded-md bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={editingAppointment.assigned_doctor_id}
                onChange={(e) =>
                  setEditingAppointment({
                    ...editingAppointment,
                    assigned_doctor_id: e.target.value,
                  })
                }
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name || emp.username}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Fecha
                </label>
                <Input
                  type="date"
                  required
                  value={editingAppointment.date}
                  onChange={(e) =>
                    setEditingAppointment({
                      ...editingAppointment,
                      date: e.target.value,
                    })
                  }
                  className="bg-muted/50 border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Hora
                </label>
                <Input
                  type="time"
                  required
                  value={editingAppointment.time}
                  onChange={(e) =>
                    setEditingAppointment({
                      ...editingAppointment,
                      time: e.target.value,
                    })
                  }
                  className="bg-muted/50 border-border text-foreground"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Estado
              </label>
              <select
                className="w-full p-2.5 rounded-md bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={editingAppointment.appointment_status}
                onChange={(e) =>
                  setEditingAppointment({
                    ...editingAppointment,
                    appointment_status: e.target.value,
                  })
                }
              >
                <option value="scheduled">Programada</option>
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmada</option>
                <option value="completed">Completada</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Motivo / Notas
              </label>
              <textarea
                placeholder="Motivo de la consulta..."
                className="w-full min-h-[80px] p-3 rounded-md bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={editingAppointment.notes}
                onChange={(e) =>
                  setEditingAppointment({
                    ...editingAppointment,
                    notes: e.target.value,
                  })
                }
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingAppointment(null);
                }}
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAppointment}
        title="¿Eliminar cita?"
        message={
          <span>
            La cita del paciente{" "}
            <strong>
              {getPatientName(
                appointments.find((a) => a.id === deletingId)?.patient_id || "",
              )}
            </strong>{" "}
            será desactivada del sistema. Los datos permanecerán en la base de datos.
          </span>
        }
        variant="danger"
        confirmText="Sí, eliminar"
        isLoading={isDeleting}
        icon={<Trash2 size={26} className="text-destructive" />}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title={successInfo.title}
        message={successInfo.message}
      />
    </div>
  );
}
