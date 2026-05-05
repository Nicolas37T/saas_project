"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  User,
  FileText,
  MoreVertical,
  Pencil,
  Trash2,
  Calendar,
  Share2,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { tenantApi, Patient, Employee } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  CustomModal,
  ConfirmModal,
  SuccessModal,
} from "@/components/ui/custom-modal";
import { useRouter } from "next/navigation";

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [employeesMap, setEmployeesMap] = useState<Record<string, string>>({});
  const [employeesList, setEmployeesList] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);

  // Menú de 3 puntos
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Modal: Nuevo Paciente
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
    birth_day: "",
    description: "",
    assigned_doctor_id: "",
  });

  // Modal: Editar Paciente
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
    birth_day: "",
    description: "",
    assigned_doctor_id: "",
  });

  // Modal: Confirmar Eliminación
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal: Compartir Paciente
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharingPatient, setSharingPatient] = useState<Patient | null>(null);
  const [selectedShareDoctorId, setSelectedShareDoctorId] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  // Success message modal
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successInfo, setSuccessInfo] = useState({ title: "", message: "" });

  useEffect(() => {
    setMounted(true);
    loadPatients();
  }, []);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const [data, doctors] = await Promise.all([
        tenantApi.getPatients(),
        tenantApi.getDoctors().catch(() => []),
      ]);

      const empMap: Record<string, string> = {};
      doctors.forEach((emp: Employee) => {
        empMap[emp.id] = emp.full_name || emp.username || emp.id;
      });
      setEmployeesMap(empMap);
      setEmployeesList(doctors); // El backend ya filtra por cargo DOCTOR y status activo

      // Solo mostramos activos (status=true), el backend ya filtra pero doble check
      setPatients(data.filter((p) => p.status));

      // Auto-select doctor for new patient: current user if they are a doctor, otherwise first in list
      if (doctors.length > 0 && !newPatient.assigned_doctor_id) {
        const currentUserId = localStorage.getItem("user_id");
        const currentUserIsDoctor = doctors.find((d) => d.id === currentUserId);

        setNewPatient((prev) => ({
          ...prev,
          assigned_doctor_id: currentUserIsDoctor ? currentUserId! : doctors[0].id,
        }));
      }
    } catch (error) {
      console.error("Failed to load patients", error);
    } finally {
      setLoading(false);
    }
  };

  // ─── CREAR PACIENTE ─────────────────────────────────────────────────────────
  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await tenantApi.createPatient({
        ...newPatient,
        birth_day: newPatient.birth_day ? newPatient.birth_day : undefined,
        assigned_doctor_id: newPatient.assigned_doctor_id || undefined,
      });
      setIsAddModalOpen(false);
      setNewPatient({
        first_name: "",
        last_name: "",
        phone: "",
        address: "",
        birth_day: "",
        description: "",
        assigned_doctor_id: "",
      });

      setSuccessInfo({
        title: "Paciente Registrado",
        message: "El paciente ha sido creado con éxito.",
      });
      setIsSuccessModalOpen(true);
      loadPatients();
    } catch (error) {
      console.error("Error creating patient", error);
    }
  };

  // ─── ABRIR EDICIÓN ──────────────────────────────────────────────────────────
  const handleOpenEdit = (patient: Patient) => {
    setOpenMenuId(null);
    setEditingPatient(patient);
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

  // ─── GUARDAR EDICIÓN ────────────────────────────────────────────────────────
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;
    try {
      await tenantApi.updatePatient(editingPatient.id, {
        ...editForm,
        birth_day: editForm.birth_day ? editForm.birth_day : undefined,
        assigned_doctor_id: editForm.assigned_doctor_id || undefined,
      });
      setIsEditModalOpen(false);
      setEditingPatient(null);

      setSuccessInfo({
        title: "Datos Actualizados",
        message: "La información del paciente se actualizó correctamente.",
      });
      setIsSuccessModalOpen(true);
      loadPatients();
    } catch (error) {
      console.error("Error updating patient", error);
    }
  };

  // ─── ABRIR ELIMINACIÓN ──────────────────────────────────────────────────────
  const handleOpenDelete = (patient: Patient) => {
    setOpenMenuId(null);
    setDeletingPatient(patient);
    setIsDeleteModalOpen(true);
  };

  // ─── CONFIRMAR ELIMINACIÓN SUAVE ────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!deletingPatient) return;
    setIsDeleting(true);
    try {
      await tenantApi.deletePatient(deletingPatient.id);
      setIsDeleteModalOpen(false);
      setDeletingPatient(null);
      loadPatients(); // Se recargará sin el paciente (status=false)
    } catch (error) {
      console.error("Error deleting patient", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── COMPARTIR PACIENTE ─────────────────────────────────────────────────────
  const handleOpenShare = (patient: Patient) => {
    setOpenMenuId(null);
    setSharingPatient(patient);
    setSelectedShareDoctorId("");
    setIsShareModalOpen(true);
  };

  const handleConfirmShare = async () => {
    if (!sharingPatient || !selectedShareDoctorId) return;
    setIsSharing(true);
    try {
      await tenantApi.sharePatient(sharingPatient.id, selectedShareDoctorId);
      setIsShareModalOpen(false);
      setSuccessInfo({
        title: "Paciente Compartido",
        message: `Se ha compartido el acceso a ${sharingPatient.first_name} con el colega seleccionado. Ahora podrá ver su historial médico y tratamientos.`,
      });
      setIsSuccessModalOpen(true);
    } catch (error) {
      console.error("Error sharing patient", error);
    } finally {
      setIsSharing(false);
    }
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.first_name.toLowerCase().includes(search.toLowerCase()) ||
      p.last_name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">
            Pacientes
          </h1>
          <p className="text-muted-foreground">
            Gestiona la información y el historial clínico de tus pacientes.
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all"
        >
          <Plus className="mr-2" size={18} /> Nuevo Paciente
        </Button>
      </div>

      <Card className="bg-card border-border backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={18}
              />
              <Input
                placeholder="Buscar paciente por nombre..."
                className="pl-10 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin w-8 h-8 rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="text-muted-foreground" size={32} />
              </div>
              <h3 className="text-lg font-medium mb-2">
                No se encontraron pacientes
              </h3>
              <p className="text-muted-foreground">
                Comienza agregando tu primer paciente al sistema.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="group bg-card border border-border rounded-xl p-5 hover:border-muted-foreground/50 transition-all flex flex-col relative"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-lg">
                        {patient.first_name[0]}
                        {patient.last_name[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium leading-tight">
                          <div className="break-all">{patient.first_name}</div>
                          <div className="break-all text-muted-foreground text-sm mt-0.5">
                            {patient.last_name}
                          </div>
                        </h4>
                        <span className="text-xs font-bold capitalize bg-green-500 px-2 py-1 rounded-full text-white">
                          Activo
                        </span>
                        {patient.is_shared && (
                          <span className="text-xs font-bold capitalize bg-blue-500 px-2 py-1 rounded-full text-white ml-2">
                            Compartido
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Menú de 3 puntos */}
                    <div
                      className="relative"
                      ref={openMenuId === patient.id ? menuRef : null}
                    >
                      <button
                        onClick={() =>
                          setOpenMenuId(
                            openMenuId === patient.id ? null : patient.id,
                          )
                        }
                        className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-accent"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {openMenuId === patient.id && (
                        <div className="absolute right-0 top-8 z-50 w-44 bg-popover border border-border rounded-xl shadow-2xl overflow-hidden">
                          <button
                            onClick={() => handleOpenEdit(patient)}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                          >
                            <Pencil size={14} className="text-primary" />
                            Editar paciente
                          </button>
                          <button
                            onClick={() => handleOpenShare(patient)}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                          >
                            <Share2 size={14} className="text-green-500" />
                            Compartir paciente
                          </button>
                          <div className="border-t border-border" />
                          <button
                            onClick={() => handleOpenDelete(patient)}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                          >
                            <Trash2 size={14} />
                            Eliminar paciente
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mt-auto">
                    {patient.phone && (
                      <button 
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-green-500 transition-colors"
                        onClick={() => {
                          const cleanPhone = patient.phone!.replace(/\D/g, "");
                          window.open(`https://wa.me/${cleanPhone}`, "_blank");
                        }}
                        title="Contactar por WhatsApp"
                      >
                        <WhatsAppIcon size={14} className="flex-shrink-0" />
                        <span>{patient.phone}</span>
                      </button>
                    )}
                    {patient.birth_day && mounted && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar size={14} className="text-muted-foreground" />
                        <span>
                          {new Date(patient.birth_day).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText size={14} className="text-muted-foreground" />
                      {patient.history_id ? (
                        <div className="flex items-center gap-2">
                          <Button 
                             variant="link" 
                             className="p-0 h-auto text-primary text-sm font-semibold"
                             onClick={() => router.push(`/dashboard/historyPatients?historyId=${patient.history_id}`)}
                          >
                            Ver historia clínica
                          </Button>
                          <span className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                            #{patient.history_number}
                          </span>
                        </div>
                      ) : (
                        <span className="italic">Sin historia clínica</span>
                      )}
                    </div>
                    {patient.created_by && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                        <User size={12} className="text-muted-foreground" />
                        <span
                          className="truncate"
                          title={`Registrado por: ${patient.creator_name || employeesMap[patient.created_by] || patient.created_by}`}
                        >
                          Registrado por:{" "}
                          {patient.creator_name ||
                            employeesMap[patient.created_by] ||
                            patient.created_by.substring(0, 8) + "..."}
                        </span>
                      </div>
                    )}
                    {patient.assigned_doctor_id && (
                      <div className="flex items-center gap-2 text-xs text-primary font-medium mt-1">
                        <span>
                          👨‍⚕️ Doctor:{" "}
                          {employeesMap[patient.assigned_doctor_id] ||
                            "Asignado"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/50 flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">
                      Unido el{" "}
                      {mounted
                        ? new Date(patient.created_at).toLocaleDateString()
                        : ""}
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-3"
                      onClick={() =>
                        router.push(`/dashboard/patients/${patient.id}`)
                      }
                    >
                      Ver Perfil
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── MODAL: NUEVO PACIENTE ─────────────────────────────────────────────── */}
      <CustomModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Nuevo Paciente"
      >
        <form onSubmit={handleCreatePatient} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Nombre *
              </label>
              <Input
                required
                placeholder="Juan"
                value={newPatient.first_name}
                onChange={(e) =>
                  setNewPatient({ ...newPatient, first_name: e.target.value })
                }
                className="bg-muted/50 border-border text-foreground focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Apellidos *
              </label>
              <Input
                required
                placeholder="Pérez"
                value={newPatient.last_name}
                onChange={(e) =>
                  setNewPatient({ ...newPatient, last_name: e.target.value })
                }
                className="bg-muted/50 border-border text-foreground focus-visible:ring-primary"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Teléfono
              </label>
              <Input
                type="tel"
                placeholder="+ 591 12342596"
                value={newPatient.phone}
                onChange={(e) =>
                  setNewPatient({ ...newPatient, phone: e.target.value })
                }
                className="bg-muted/50 border-border text-foreground focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Fecha de Nacimiento
              </label>
              <Input
                type="date"
                value={newPatient.birth_day}
                onChange={(e) =>
                  setNewPatient({ ...newPatient, birth_day: e.target.value })
                }
                className="bg-muted/50 border-border text-foreground focus-visible:ring-primary"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Dirección
            </label>
            <Input
              placeholder="Calle 123..."
              value={newPatient.address}
              onChange={(e) =>
                setNewPatient({ ...newPatient, address: e.target.value })
              }
              className="bg-muted/50 border-border text-foreground focus-visible:ring-primary"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Motivo Consulta
              </label>
              <Input
                placeholder="Observaciones..."
                value={newPatient.description}
                onChange={(e) =>
                  setNewPatient({ ...newPatient, description: e.target.value })
                }
                className="bg-muted/50 border-border text-foreground focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Doctor Asignado
              </label>
              {employeesList.length > 0 ? (
                <select
                  required
                  value={newPatient.assigned_doctor_id}
                  onChange={(e) =>
                    setNewPatient({
                      ...newPatient,
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
              ) : (
                <div className="text-sm text-amber-600 bg-amber-500/10 border border-amber-500/20 p-3 rounded-md leading-relaxed">
                  No hay médicos registrados.{" "}
                  {mounted && ["owner", "admin", "superadmin", "administrador"].includes(localStorage.getItem("user_role") || "") ? (
                    <span>
                      Ve a la sección de{" "}
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.preventDefault();
                          setIsAddModalOpen(false);
                          router.push("/dashboard/employees");
                        }} 
                        className="font-bold underline text-amber-700 hover:text-amber-800 transition-colors"
                      >
                        Empleados
                      </button>{" "}
                      y crea uno con rol de médico para asignarle pacientes.
                    </span>
                  ) : (
                    <span>Solicita al administrador que registre un médico.</span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-end mt-8">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsAddModalOpen(false)}
              className="hover:bg-accent"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={employeesList.length === 0}
            >
              Crear Paciente
            </Button>
          </div>
        </form>
      </CustomModal>

      {/* ─── MODAL: EDITAR PACIENTE ────────────────────────────────────────────── */}
      <CustomModal
        isOpen={isEditModalOpen && !!editingPatient}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Paciente"
      >
        {editingPatient && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Nombre *
                </label>
                <Input
                  required
                  value={editForm.first_name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, first_name: e.target.value })
                  }
                  className="bg-muted/50 border-border text-foreground focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Apellidos *
                </label>
                <Input
                  required
                  value={editForm.last_name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, last_name: e.target.value })
                  }
                  className="bg-muted/50 border-border text-foreground focus-visible:ring-primary"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Teléfono
                </label>
                <Input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                  className="bg-muted/50 border-border text-foreground focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Fecha de Nacimiento
                </label>
                <Input
                  type="date"
                  value={editForm.birth_day}
                  onChange={(e) =>
                    setEditForm({ ...editForm, birth_day: e.target.value })
                  }
                  className="bg-muted/50 border-border text-foreground focus-visible:ring-primary"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Dirección
              </label>
              <Input
                value={editForm.address}
                onChange={(e) =>
                  setEditForm({ ...editForm, address: e.target.value })
                }
                className="bg-muted/50 border-border text-foreground focus-visible:ring-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Descripción / Notas
                </label>
                <Input
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  className="bg-muted/50 border-border text-foreground focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Doctor Asignado
                </label>
                {employeesList.length > 0 ? (
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
                ) : (
                  <div className="text-sm text-amber-600 bg-amber-500/10 border border-amber-500/20 p-3 rounded-md leading-relaxed">
                    No hay médicos registrados.{" "}
                    {mounted && ["owner", "admin", "superadmin", "administrador"].includes(localStorage.getItem("user_role") || "") ? (
                      <span>
                        Ve a la sección de{" "}
                        <button 
                          type="button" 
                          onClick={(e) => {
                            e.preventDefault();
                            setIsEditModalOpen(false);
                            router.push("/dashboard/employees");
                          }} 
                          className="font-bold underline text-amber-700 hover:text-amber-800 transition-colors"
                        >
                          Empleados
                        </button>{" "}
                        y crea uno con rol de médico para asignarle pacientes.
                      </span>
                    ) : (
                      <span>Solicita al administrador que registre un médico.</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-end mt-8">
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
                disabled={employeesList.length === 0}
              >
                Guardar Cambios
              </Button>
            </div>
          </form>
        )}
      </CustomModal>

      {/* ─── MODAL: CONFIRMAR ELIMINACIÓN ─────────────────────────────────────── */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar paciente?"
        message={
          <>
            <span className="font-medium">
              {deletingPatient?.first_name} {deletingPatient?.last_name}
            </span>{" "}
            será desactivado del sistema. Sus datos se conservarán en la base de
            datos.
          </>
        }
        variant="danger"
        confirmText="Sí, eliminar"
        isLoading={isDeleting}
        icon={<Trash2 size={26} className="text-destructive" />}
      />

      {/* ─── MODAL: COMPARTIR PACIENTE ────────────────────────────────────────── */}
      <CustomModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="Compartir Paciente"
      >
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Selecciona un doctor para compartir el historial y datos de{" "}
            <span className="font-medium">
              {sharingPatient?.first_name} {sharingPatient?.last_name}
            </span>
            .
          </p>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Doctor Colega
            </label>
            <select
              value={selectedShareDoctorId}
              onChange={(e) => setSelectedShareDoctorId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="">Seleccionar doctor...</option>
              {employeesList
                .filter(
                  (emp) =>
                    emp.id !==
                    (sharingPatient?.assigned_doctor_id ||
                      sharingPatient?.created_by),
                )
                .map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end mt-8">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsShareModalOpen(false)}
              className="hover:bg-accent"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmShare}
              disabled={!selectedShareDoctorId || isSharing}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSharing ? "Compartiendo..." : "Compartir Acceso"}
            </Button>
          </div>
        </div>
      </CustomModal>

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
