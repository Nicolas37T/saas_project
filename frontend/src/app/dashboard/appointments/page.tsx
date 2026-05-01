"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Calendar as CalendarIcon,
  Clock,
  User,
  FileText,
  Edit2,
  Trash2,
  List,
  MessageCircle,
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
  const [clinicName, setClinicName] = useState("la Clínica");
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

  // Conflict error for create / edit forms
  const [createConflictError, setCreateConflictError] = useState("");
  const [editConflictError, setEditConflictError] = useState("");

  // Date range filter for list view
  type DateFilter = "today" | "week" | "upcoming" | "past" | "all";
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");

  const [activeTab, setActiveTab] = useState("list");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const getRangeForCalendar = (year: number, month: number) => {
    const toISO = (d: Date) => d.toISOString().split("T")[0];
    const start = new Date(year, month, 1);
    start.setDate(start.getDate() - 7); // pad start
    const end = new Date(year, month + 1, 1);
    end.setDate(end.getDate() + 7); // pad end
    return { date_from: toISO(start), date_to: toISO(end) };
  };

  // ── Compute date range for a given filter ───────────────────────────────
  const getDateRangeForFilter = (filter: DateFilter): { date_from?: string; date_to?: string } => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const toISO = (d: Date) => d.toISOString().split("T")[0]; // "YYYY-MM-DD"

    switch (filter) {
      case "today": {
        const tomorrow = new Date(todayStart);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return { date_from: toISO(todayStart), date_to: toISO(tomorrow) };
      }
      case "week": {
        const dow = now.getDay();
        const diffMon = dow === 0 ? 6 : dow - 1;
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - diffMon);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        return { date_from: toISO(weekStart), date_to: toISO(weekEnd) };
      }
      case "upcoming":
        return { date_from: toISO(todayStart) };
      case "past":
        return { date_to: toISO(todayStart) };
      case "all":
      default:
        return {};
    }
  };

  // ── Load data (with optional server-side date filter) ──────────────────
  const loadData = async (dateRange?: { date_from?: string; date_to?: string }) => {
    setLoading(true);
    try {
      // Use provided range, or compute from current context
      let range = dateRange;
      if (!range) {
        if (activeTab === "list") {
          range = getDateRangeForFilter(dateFilter);
        } else {
          range = getRangeForCalendar(calendarDate.year, calendarDate.month);
        }
      }

      const [appData, patData, empData, configData] = await Promise.all([
        tenantApi.getAppointments(range),
        tenantApi.getPatients(),
        tenantApi.getDoctors().catch(() => []),
        tenantApi.getTenantConfig().catch(() => ({ business_name: "la Clínica" })),
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
      setClinicName(configData?.business_name || "la Clínica");
      
      // Auto-select first doctor for new appointment form
      const activeEmployees = empData.filter((e: Employee) => e.status);
      if (activeEmployees.length > 0) {
        setNewAppointment(prev => ({
          ...prev,
          assigned_doctor_id: prev.assigned_doctor_id || activeEmployees[0].id,
        }));
      }
    } catch (error) {
      console.error("Failed to load appointments data", error);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when context changes
  useEffect(() => {
    if (activeTab === "list") {
      loadData(getDateRangeForFilter(dateFilter));
    } else {
      loadData(getRangeForCalendar(calendarDate.year, calendarDate.month));
    }
  }, [activeTab, dateFilter, calendarDate.year, calendarDate.month]);


  /**
   * Checks if `doctorId` already has an active appointment at the exact
   * same date+time (compared to the minute). Returns an error string or null.
   * `excludeId` lets us skip the appointment being edited (it's not a conflict with itself).
   */
  const checkDoctorConflict = (
    doctorId: string,
    dateTimeStr: string,   // "YYYY-MM-DDTHH:MM:00"
    excludeId?: string,
  ): string | null => {
    if (!doctorId) return null;
    const newMin = dateTimeStr.substring(0, 16); // "YYYY-MM-DDTHH:MM"
    const conflict = appointments.find((apt) => {
      if (!apt.status) return false;
      if (apt.assigned_doctor_id !== doctorId) return false;
      if (excludeId && apt.id === excludeId) return false;
      return apt.appointment_date.substring(0, 16) === newMin;
    });
    return conflict
      ? "El doctor ya tiene una cita programada en esa fecha y hora."
      : null;
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateConflictError("");
    try {
      // Combine date and time as ISO string WITHOUT timezone conversion
      const appointmentDateTime = `${newAppointment.appointment_date}T${newAppointment.appointment_time}:00`;

      // ── Frontend conflict guard (instant, no round-trip) ──────────────────
      const frontendError = checkDoctorConflict(
        newAppointment.assigned_doctor_id,
        appointmentDateTime,
      );
      if (frontendError) {
        setCreateConflictError(frontendError);
        return;
      }
      // ─────────────────────────────────────────────────────────────────────

      await tenantApi.createAppointment({
        patient_id: newAppointment.patient_id,
        appointment_date: appointmentDateTime,
        notes: newAppointment.notes,
        appointment_status: newAppointment.appointment_status,
        assigned_doctor_id: newAppointment.assigned_doctor_id || undefined,
      });

      setIsAddModalOpen(false);
      // Reset form — pre-set doctor to first available to avoid blank value
      setNewAppointment({
        patient_id: "",
        appointment_date: "",
        appointment_time: "",
        notes: "",
        appointment_status: "scheduled",
        assigned_doctor_id: employees.length > 0 ? employees[0].id : "",
      });
      
      setSuccessInfo({ title: "Cita Programada", message: "La cita ha sido agendada con éxito." });
      setIsSuccessModalOpen(true);
      loadData();
    } catch (error: any) {
      // Backend 409 fallback (race condition, etc.)
      const msg = error?.message || "";
      if (msg.includes("doctor ya tiene") || msg.includes("409")) {
        setCreateConflictError("El doctor ya tiene una cita programada en esa fecha y hora.");
      } else {
        console.error("Error creating appointment", error);
      }
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
    setEditConflictError("");
    try {
      // Combine date and time as ISO string WITHOUT timezone conversion
      const appointmentDateTime = `${editingAppointment.date}T${editingAppointment.time}:00`;

      // ── Frontend conflict guard ───────────────────────────────────────────
      const frontendError = checkDoctorConflict(
        editingAppointment.assigned_doctor_id || "",
        appointmentDateTime,
        editingAppointment.id,  // exclude self
      );
      if (frontendError) {
        setEditConflictError(frontendError);
        return;
      }
      // ─────────────────────────────────────────────────────────────────────

      await tenantApi.updateAppointment(editingAppointment.id, {
        patient_id: editingAppointment.patient_id,
        appointment_date: appointmentDateTime,
        notes: editingAppointment.notes,
        appointment_status: editingAppointment.appointment_status,
        assigned_doctor_id: editingAppointment.assigned_doctor_id || undefined,
      });

      setIsEditModalOpen(false);
      setEditingAppointment(null);
      
      setSuccessInfo({ title: "Cita Actualizada", message: "Los cambios se guardaron correctamente." });
      setIsSuccessModalOpen(true);
      loadData();
    } catch (error: any) {
      const msg = error?.message || "";
      if (msg.includes("doctor ya tiene") || msg.includes("409")) {
        setEditConflictError("El doctor ya tiene una cita programada en esa fecha y hora.");
      } else {
        console.error("Error updating appointment", error);
      }
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

  const getDoctorName = (id?: string) => {
    if (!id) return "Sin Asignar";
    const d = employees.find((e) => e.id === id);
    return d ? d.full_name || d.username : "Desconocido";
  };

  const handleQuickStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await tenantApi.updateAppointment(id, {
        appointment_status: newStatus,
      });
      loadData();
    } catch (error) {
      console.error("Error updating status", error);
    }
  };

  // Helper for status styling
  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "scheduled":
        return "bg-blue-500/20 text-blue-500 border-blue-500/30";
      case "completed":
        return "bg-emerald-500/20 text-emerald-500 border-emerald-500/30";
      case "cancelled":
        return "bg-rose-500/20 text-rose-500 border-rose-500/30";
      default:
        return "bg-muted/50 text-muted-foreground border-muted-foreground/30";
    }
  };

  // Helper strings to map status to spanish labels
  const statusLabels: Record<string, string> = {
    scheduled: "Programada",
    completed: "Completada",
    cancelled: "Cancelada",
  };

  const getStatusColorClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "scheduled": return "text-blue-500 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20";
      case "completed": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20";
      case "cancelled": return "text-rose-500 bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20";
      default: return "text-muted-foreground bg-muted/20 border-border";
    }
  };

  // Backend already filters by date range — filteredAppointments is the fetch result
  const filteredAppointments = appointments;

  const filterOptions: { key: DateFilter; label: string }[] = [
    { key: "today", label: "Hoy" },
    { key: "week", label: "Esta semana" },
    { key: "upcoming", label: "Próximas" },
    { key: "past", label: "Pasadas" },
    { key: "all", label: "Todas" },
  ];

  const handleWhatsAppClick = (apt: Appointment) => {
    const patient = patients.find((p) => p.id === apt.patient_id);
    if (!patient || !patient.phone) {
      alert("El paciente no tiene un número de teléfono registrado.");
      return;
    }

    const d = new Date(apt.appointment_date);
    const dateStr = d.toLocaleDateString([], {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    const timeStr = d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const doctorName = getDoctorName(apt.assigned_doctor_id);

    const message = `Hola ${patient.first_name} ${patient.last_name}!,\n\nTe escribo de la Clínica Dental ${clinicName} para confirmar tu cita programada:\n\nFecha: ${dateStr}\nHora:  ${timeStr}\nDr.(a): ${doctorName}\n\n¿Confirmas tu asistencia?\n\nQuedo atento a tu respuesta.\n¡Que tengas un excelente día!`;

    const encodedMessage = encodeURIComponent(message);
    const phoneStr = patient.phone.replace(/\D/g, "");

    window.open(`https://wa.me/${phoneStr}?text=${encodedMessage}`, "_blank");
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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="list" className="gap-1.5">
              <List size={15} /> Lista
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-1.5">
              <CalendarIcon size={15} /> Calendario
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            {/* Date filter chips */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
              {filterOptions.map((opt) => {
                const isActive = dateFilter === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setDateFilter(opt.key)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-[0_0_12px_rgba(37,99,235,0.3)]"
                        : "bg-muted/50 text-muted-foreground border-border hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                    {isActive && (
                      <span className="ml-1.5 text-xs opacity-80 z-10">({filteredAppointments.length})</span>
                    )}
                  </button>
                );
              })}
            </div>

            {filteredAppointments.length === 0 ? (
              <Card className="bg-card border-border backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-20">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <CalendarIcon className="text-muted-foreground" size={32} />
                  </div>
                  <h3 className="text-xl font-medium mb-2">
                    {dateFilter === "today"
                      ? "No tienes citas para hoy"
                      : dateFilter === "week"
                      ? "No hay citas esta semana"
                      : dateFilter === "upcoming"
                      ? "No hay citas próximas"
                      : dateFilter === "past"
                      ? "No hay citas pasadas"
                      : "No tienes citas programadas"}
                  </h3>
                  <p className="text-muted-foreground">
                    {dateFilter !== "all" && dateFilter !== "past"
                      ? 'Tu agenda está libre. Haz clic en "Nueva Cita" para empezar.'
                      : "No se encontraron citas con este filtro."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredAppointments.map((apt) => {
                  const d = new Date(apt.appointment_date);
                  return (
                    <Card
                      key={apt.id}
                      className={`bg-card border-border backdrop-blur-sm hover:border-muted-foreground/50 hover:shadow-lg transition-all flex flex-col md:flex-row items-start md:items-center p-0 relative ${
                        openDropdownId === apt.id ? "z-50" : "z-10"
                      }`}
                    >
                      {/* Date & Time Section */}
                      <div className="p-4 bg-muted/20 w-full md:w-48 shrink-0 flex md:flex-col justify-between md:justify-center items-center md:items-start h-full border-b md:border-b-0 md:border-r border-border/50 rounded-t-xl md:rounded-l-xl md:rounded-tr-none">
                        <span className="font-bold text-base md:text-lg">
                          {d.toLocaleDateString([], {
                            weekday: "short",
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                        <span className="text-primary font-semibold flex items-center gap-1 text-sm md:text-base">
                          <Clock size={14} />{" "}
                          {d.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {/* Info Section */}
                      <div className="p-4 flex-1 flex flex-col xl:flex-row items-start xl:items-center gap-4 xl:gap-8 w-full">
                        {/* Patient */}
                        <div className="flex items-center gap-3 xl:min-w-[200px]">
                          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <User size={18} />
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-medium text-muted-foreground mb-0.5">
                              Paciente
                            </p>
                            <p className="font-semibold truncate leading-none text-sm md:text-base">
                              {getPatientName(apt.patient_id)}
                            </p>
                          </div>
                        </div>

                        {/* Doctor */}
                        {apt.assigned_doctor_id && (
                          <div className="flex items-center gap-2 text-sm text-primary xl:min-w-[160px]">
                            <span>👨‍⚕️</span>
                            <span className="font-medium truncate">Dr. {getDoctorName(apt.assigned_doctor_id)}</span>
                          </div>
                        )}

                        {/* Notes */}
                        {apt.notes ? (
                          <div className="text-xs md:text-sm flex items-start gap-2 text-muted-foreground flex-1">
                            <FileText
                              size={16}
                              className="shrink-0 mt-0.5 opacity-70"
                            />
                            <p className="line-clamp-2 xl:line-clamp-1" title={apt.notes}>{apt.notes}</p>
                          </div>
                        ) : (
                          <div className="flex-1"></div>
                        )}
                      </div>

                      {/* Actions Section */}
                      <div className="p-4 flex items-center gap-3 shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-border/50 bg-muted/5 md:bg-transparent">
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(openDropdownId === apt.id ? null : apt.id);
                            }}
                            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full border transition-all flex items-center gap-2 shadow-sm ${getStatusColorClass(apt.appointment_status)}`}
                          >
                            {statusLabels[apt.appointment_status.toLowerCase()]}
                            <Plus size={10} className={`transition-transform duration-300 ${openDropdownId === apt.id ? "rotate-45" : ""}`} />
                          </button>

                          {openDropdownId === apt.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setOpenDropdownId(null)}
                              />
                              <div className="absolute bottom-full right-0 md:bottom-auto md:top-full md:mt-2 mb-2 w-40 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl p-1.5 z-20 animate-in fade-in slide-in-from-bottom-2 zoom-in-95 duration-200">
                                {Object.entries(statusLabels).map(([val, label]) => (
                                  <button
                                    key={val}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleQuickStatusUpdate(apt.id, val);
                                      setOpenDropdownId(null);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-between group/item ${
                                      apt.appointment_status === val 
                                        ? "bg-primary/20 text-primary" 
                                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                    }`}
                                  >
                                    {label}
                                    {apt.appointment_status === val && (
                                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 border-l border-border/50 pl-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-500/70 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleWhatsAppClick(apt);
                            }}
                            title="Confirmar por WhatsApp"
                          >
                            <MessageCircle size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                            onClick={(e) => { e.stopPropagation(); openEditModal(apt); }}
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                            onClick={(e) => { e.stopPropagation(); confirmDeleteAction(apt.id); }}
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
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
              onMonthChange={(year, month) => setCalendarDate({ year, month })}
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
              onChange={(e) => {
                setNewAppointment({ ...newAppointment, assigned_doctor_id: e.target.value });
                setCreateConflictError("");
              }}
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
                onChange={(e) => {
                  setNewAppointment({ ...newAppointment, appointment_date: e.target.value });
                  setCreateConflictError("");
                }}
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
                onChange={(e) => {
                  setNewAppointment({ ...newAppointment, appointment_time: e.target.value });
                  setCreateConflictError("");
                }}
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
          {/* Conflict error */}
          {createConflictError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span>{createConflictError}</span>
            </div>
          )}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="ghost"
              type="button"
              onClick={() => { setIsAddModalOpen(false); setCreateConflictError(""); }}
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
                onChange={(e) => {
                  setEditingAppointment({ ...editingAppointment, assigned_doctor_id: e.target.value });
                  setEditConflictError("");
                }}
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
                  onChange={(e) => {
                    setEditingAppointment({ ...editingAppointment, date: e.target.value });
                    setEditConflictError("");
                  }}
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
                  onChange={(e) => {
                    setEditingAppointment({ ...editingAppointment, time: e.target.value });
                    setEditConflictError("");
                  }}
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
            {/* Conflict error */}
            {editConflictError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                <span className="shrink-0 mt-0.5">⚠️</span>
                <span>{editConflictError}</span>
              </div>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingAppointment(null);
                    setEditConflictError("");
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
