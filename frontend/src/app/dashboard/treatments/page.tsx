"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutList,
  CheckCircle2,
  Activity,
  Calendar,
  Clock,
  User,
  MoreVertical,
  Pencil,
  Trash2,
  Filter,
  Search,
} from "lucide-react";
import { tenantApi, Treatment, Patient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomModal, ConfirmModal, SuccessModal } from "@/components/ui/custom-modal";

type FilterType = "today" | "week" | "month" | "all";

export default function TreatmentsPage() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  // State for modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
  const [editForm, setEditForm] = useState({
    description: "",
    price: 0,
    status_treatments: "",
    duration_minutes: 0,
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingTreatment, setDeletingTreatment] = useState<Treatment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successInfo, setSuccessInfo] = useState({ title: "", message: "" });

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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

  // Filter Logic
  const filterTreatments = (items: Treatment[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let filtered = items;

    // Filter by date
    if (activeFilter === "today") {
      filtered = items.filter(t => t.date && new Date(t.date) >= today);
    } else if (activeFilter === "week") {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      filtered = items.filter(t => t.date && new Date(t.date) >= startOfWeek);
    } else if (activeFilter === "month") {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      filtered = items.filter(t => t.date && new Date(t.date) >= startOfMonth);
    }

    // Filter by search
    if (search) {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        (t.patient && `${t.patient.first_name} ${t.patient.last_name}`.toLowerCase().includes(search.toLowerCase()))
      );
    }

    return filtered.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA; // Newest first
    });
  };

  // Edit Logic
  const handleOpenEdit = (t: Treatment) => {
    setEditingTreatment(t);
    setEditForm({
      description: t.description,
      price: t.price,
      status_treatments: t.status_treatments,
      duration_minutes: t.duration_minutes || 0,
    });
    setIsEditModalOpen(true);
    setOpenMenuId(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTreatment) return;
    try {
      await tenantApi.updateTreatment(editingTreatment.id, editForm);
      setIsEditModalOpen(false);
      setSuccessInfo({ title: "Tratamiento Actualizado", message: "Los cambios se guardaron correctamente." });
      setIsSuccessModalOpen(true);
      loadData();
    } catch (error) {
      console.error("Error updating treatment", error);
    }
  };

  // Delete Logic
  const handleOpenDelete = (t: Treatment) => {
    setDeletingTreatment(t);
    setIsDeleteModalOpen(true);
    setOpenMenuId(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTreatment) return;
    setIsDeleting(true);
    try {
      await tenantApi.deleteTreatment(deletingTreatment.id);
      setIsDeleteModalOpen(false);
      setSuccessInfo({ title: "Tratamiento Eliminado", message: "El registro ha sido removido de la vista." });
      setIsSuccessModalOpen(true);
      loadData();
    } catch (error) {
      console.error("Error deleting treatment", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const displayedTreatments = filterTreatments(treatments);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
            Tratamientos
          </h1>
          <p className="text-slate-400">
            Administración visual de los procedimientos clínicos realizados.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-slate-900/50 p-4 border border-slate-800 rounded-xl backdrop-blur-sm">
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <Input 
              placeholder="Buscar por procedimiento o paciente..."
              className="pl-10 bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/50 p-1 rounded-lg border border-slate-800 w-full lg:w-auto overflow-x-auto no-scrollbar">
          {(["all", "today", "week", "month"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                activeFilter === f 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {f === "all" ? "Todos" : f === "today" ? "Hoy" : f === "week" ? "Esta Semana" : "Este Mes"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : displayedTreatments.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Activity className="text-slate-400" size={32} />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">
              No se encontraron tratamientos
            </h3>
            <p className="text-slate-400">
              Prueba cambiando los filtros o el término de búsqueda.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayedTreatments.map((t) => (
            <Card key={t.id} className="bg-slate-950/50 border-slate-800 hover:border-slate-700 transition-all group relative">
              <CardHeader className="p-4 pb-0 flex flex-row items-start justify-between space-y-0">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 mb-2">
                  <LayoutList size={20} />
                </div>
                
                <div className="relative">
                  <button 
                    onClick={() => setOpenMenuId(openMenuId === t.id ? null : t.id)}
                    className="p-1 rounded-md text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {openMenuId === t.id && (
                    <div className="absolute right-0 top-8 z-50 w-36 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                      <button 
                        onClick={() => handleOpenEdit(t)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        <Pencil size={14} className="text-blue-400" /> Editar
                      </button>
                      <button 
                        onClick={() => handleOpenDelete(t)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={14} /> Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-2">
                <div className="mb-4">
                  <CardTitle className="text-white text-lg font-bold mb-1" title={t.description}>
                    {t.description}
                  </CardTitle>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <User size={12} className="text-slate-500" />
                    <span className="truncate">{t.patient ? `${t.patient.first_name} ${t.patient.last_name}` : "Sin Paciente"}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusTheme(t.status_treatments)} uppercase tracking-wider`}>
                      {getStatusLabel(t.status_treatments)}
                    </span>
                    <span className="text-lg font-bold text-white flex items-baseline">
                      <span className="text-indigo-400 text-xs mr-1 opacity-70">Bs.</span>
                      {t.price.toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/50">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Calendar size={12} className="text-slate-600" />
                      <span>{t.date ? new Date(t.date).toLocaleDateString() : "-"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 justify-end">
                      <Clock size={12} className="text-slate-600" />
                      <span>{t.duration_minutes ? `${t.duration_minutes} min` : "-"}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <CustomModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Tratamiento"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Descripción</label>
            <textarea 
              value={editForm.description}
              onChange={(e) => setEditForm({...editForm, description: e.target.value})}
              className="w-full min-h-[100px] p-3 rounded-md bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
              placeholder="Descripción del tratamiento..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Precio (Bs.)</label>
              <Input 
                type="number"
                value={editForm.price}
                onChange={(e) => setEditForm({...editForm, price: parseFloat(e.target.value)})}
                className="bg-slate-950 border-slate-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Duración (min)</label>
              <Input 
                type="number"
                value={editForm.duration_minutes}
                onChange={(e) => setEditForm({...editForm, duration_minutes: parseInt(e.target.value)})}
                className="bg-slate-950 border-slate-800 text-white"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Estado</label>
            <select
              className="w-full p-2 rounded-md bg-slate-950 border border-slate-800 text-white text-sm"
              value={editForm.status_treatments}
              onChange={(e) => setEditForm({...editForm, status_treatments: e.target.value})}
            >
              <option value="pending">Pendiente</option>
              <option value="in_progress">En progreso</option>
              <option value="completed">Completado</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)} className="text-slate-400">Cancelar</Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6">Guardar Cambios</Button>
          </div>
        </form>
      </CustomModal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar Tratamiento?"
        message={
          <>¿Estás seguro de que deseas eliminar <span className="text-white font-medium">{deletingTreatment?.description}</span>? El registro permanecerá en la base de datos pero no será visible.</>
        }
        variant="danger"
        confirmText="Sí, Eliminar"
        isLoading={isDeleting}
        icon={<Trash2 size={24} className="text-red-400" />}
      />

      <SuccessModal 
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title={successInfo.title}
        message={successInfo.message}
      />
    </div>
  );
}
