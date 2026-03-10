"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  User,
  FileText,
  Phone,
  MoreVertical,
  Pencil,
  Trash2,
  X,
  Calendar,
} from "lucide-react";
import { tenantApi, Patient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
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
  });

  // Modal: Confirmar Eliminación
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      const data = await tenantApi.getPatients();
      // Solo mostramos activos (status=true), el backend ya filtra pero doble check
      setPatients(data.filter((p) => p.status));
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
      });
      setIsAddModalOpen(false);
      setNewPatient({ first_name: "", last_name: "", phone: "", address: "", birth_day: "", description: "" });
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
      });
      setIsEditModalOpen(false);
      setEditingPatient(null);
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

  const filteredPatients = patients.filter(
    (p) =>
      p.first_name.toLowerCase().includes(search.toLowerCase()) ||
      p.last_name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
            Pacientes
          </h1>
          <p className="text-slate-400">
            Gestiona la información y el historial clínico de tus pacientes.
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all"
        >
          <Plus className="mr-2" size={18} /> Nuevo Paciente
        </Button>
      </div>

      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                size={18}
              />
              <Input
                placeholder="Buscar paciente por nombre..."
                className="pl-10 bg-slate-950/50 border-slate-800 text-slate-200 placeholder:text-slate-500 focus-visible:ring-blue-500/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent"></div>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="text-slate-400" size={32} />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                No se encontraron pacientes
              </h3>
              <p className="text-slate-400">
                Comienza agregando tu primer paciente al sistema.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="group bg-slate-950/50 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col relative"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-semibold text-lg">
                        {patient.first_name[0]}
                        {patient.last_name[0]}
                      </div>
                      <div>
                        <h4 className="text-white font-medium truncate max-w-[150px]">
                          {patient.first_name} {patient.last_name}
                        </h4>
                        <span className="text-xs text-slate-500 capitalize">
                          Activo
                        </span>
                      </div>
                    </div>

                    {/* Menú de 3 puntos */}
                    <div className="relative" ref={openMenuId === patient.id ? menuRef : null}>
                      <button
                        onClick={() =>
                          setOpenMenuId(
                            openMenuId === patient.id ? null : patient.id
                          )
                        }
                        className="text-slate-500 hover:text-white transition-colors p-1 rounded hover:bg-slate-700"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {openMenuId === patient.id && (
                        <div className="absolute right-0 top-8 z-50 w-44 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
                          <button
                            onClick={() => handleOpenEdit(patient)}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                          >
                            <Pencil size={14} className="text-blue-400" />
                            Editar paciente
                          </button>
                          <div className="border-t border-slate-700" />
                          <button
                            onClick={() => handleOpenDelete(patient)}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
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
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Phone size={14} className="text-slate-500" />
                        <span>{patient.phone}</span>
                      </div>
                    )}
                    {patient.birth_day && mounted && (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Calendar size={14} className="text-slate-500" />
                        <span>{new Date(patient.birth_day).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <FileText size={14} className="text-slate-500" />
                      <span>Historia {patient.id.substring(0, 6)}</span>
                    </div>
                    {patient.created_by && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                        <User size={12} className="text-slate-600" />
                        <span className="truncate" title={`Registrado por ID: ${patient.created_by}`}>
                          Registrado por: {patient.created_by.substring(0, 8)}...
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/50 flex justify-between items-center">
                    <div className="text-xs text-slate-500">
                      Unido el{" "}
                      {mounted ? new Date(patient.created_at).toLocaleDateString() : ""}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-8 px-3"
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
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Nuevo Paciente</h2>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreatePatient} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Nombre *</label>
                    <Input
                      required
                      placeholder="Juan"
                      value={newPatient.first_name}
                      onChange={(e) => setNewPatient({ ...newPatient, first_name: e.target.value })}
                      className="bg-slate-950/50 border-slate-800 text-white focus-visible:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Apellidos *</label>
                    <Input
                      required
                      placeholder="Pérez"
                      value={newPatient.last_name}
                      onChange={(e) => setNewPatient({ ...newPatient, last_name: e.target.value })}
                      className="bg-slate-950/50 border-slate-800 text-white focus-visible:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Teléfono</label>
                    <Input
                      type="tel"
                      placeholder="555-0000"
                      value={newPatient.phone}
                      onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                      className="bg-slate-950/50 border-slate-800 text-white focus-visible:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Fecha de Nacimiento</label>
                    <Input
                      type="date"
                      value={newPatient.birth_day}
                      onChange={(e) => setNewPatient({ ...newPatient, birth_day: e.target.value })}
                      className="bg-slate-950/50 border-slate-800 text-white focus-visible:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Dirección</label>
                  <Input
                    placeholder="Calle 123..."
                    value={newPatient.address}
                    onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                    className="bg-slate-950/50 border-slate-800 text-white focus-visible:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Descripción / Notas</label>
                  <Input
                    placeholder="Observaciones generales..."
                    value={newPatient.description}
                    onChange={(e) => setNewPatient({ ...newPatient, description: e.target.value })}
                    className="bg-slate-950/50 border-slate-800 text-white focus-visible:ring-blue-500"
                  />
                </div>
                <div className="flex gap-3 justify-end mt-8">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsAddModalOpen(false)}
                    className="text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                    Crear Paciente
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* ─── MODAL: EDITAR PACIENTE ────────────────────────────────────────────── */}
      {isEditModalOpen && editingPatient && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Editar Paciente</h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Nombre *</label>
                    <Input
                      required
                      value={editForm.first_name}
                      onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                      className="bg-slate-950/50 border-slate-800 text-white focus-visible:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Apellidos *</label>
                    <Input
                      required
                      value={editForm.last_name}
                      onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                      className="bg-slate-950/50 border-slate-800 text-white focus-visible:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Teléfono</label>
                    <Input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="bg-slate-950/50 border-slate-800 text-white focus-visible:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Fecha de Nacimiento</label>
                    <Input
                      type="date"
                      value={editForm.birth_day}
                      onChange={(e) => setEditForm({ ...editForm, birth_day: e.target.value })}
                      className="bg-slate-950/50 border-slate-800 text-white focus-visible:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Dirección</label>
                  <Input
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="bg-slate-950/50 border-slate-800 text-white focus-visible:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Descripción / Notas</label>
                  <Input
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="bg-slate-950/50 border-slate-800 text-white focus-visible:ring-indigo-500"
                  />
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
            </div>
          </Card>
        </div>
      )}

      {/* ─── MODAL: CONFIRMAR ELIMINACIÓN ─────────────────────────────────────── */}
      {isDeleteModalOpen && deletingPatient && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm bg-slate-900 border-slate-800 shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={26} className="text-red-400" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">¿Eliminar paciente?</h2>
              <p className="text-slate-400 text-sm mb-6">
                <span className="text-white font-medium">
                  {deletingPatient.first_name} {deletingPatient.last_name}
                </span>{" "}
                será desactivado del sistema. Sus datos se conservarán en la base de datos.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="flex-1 text-slate-400 hover:text-white hover:bg-slate-800"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeleting}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Eliminando..." : "Sí, eliminar"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
