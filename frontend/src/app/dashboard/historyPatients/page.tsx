"use client";
import React, { useState, useEffect } from "react";
import {
  ClipboardClock,
  Users,
  Stethoscope,
  Activity,
  DollarSign,
  Plus,
  Trash2,
  CheckCircle2,
  Search,
  ArrowLeft,
  ChevronRight,
  Calendar,
  Clock,
  ExternalLink,
  ShieldCheck,
  Zap,
  User,
  ChevronDown,
  X,
  Edit3,
} from "lucide-react";
import { tenantApi, Patient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { useRouter } from "next/navigation";

type ViewState = "list" | "form" | "detail";

export default function HistoryPatientsPage() {
  const router = useRouter();
  const [view, setView] = useState<ViewState>("list");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [histories, setHistories] = useState<any[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchPatient, setSearchPatient] = useState("");
  const [searchHistory, setSearchHistory] = useState("");
  const [isPatientMenuOpen, setIsPatientMenuOpen] = useState(false);

  // Form State
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [formData, setFormData] = useState({
    conditions: "",
    allergies: "",
    medications: "",
    medical_description: "",
    // Oral Hygiene
    uses_toothbrush: false,
    uses_dentifrice: false,
    brushing_frequency: "",
    brushing_technique: "",
    uses_floss: false,
    // Treatment summary
    price: 0,
    payment_amount: 0,
    payment_method: "efectivo",
    payment_status: "completed",
  });

  const [odontogramItems, setOdontogramItems] = useState<
    {
      tooth_number: number;
      tooth_type: string;
      notes: string;
      price: number;
      description: string;
      duration_minutes: number;
      treatment_date: string;
    }[]
  >([]);
  const [newTooth, setNewTooth] = useState({
    tooth_number: 1,
    tooth_type: "adult",
    notes: "",
    price: 0,
    description: "",
    duration_minutes: 30,
    treatment_date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (view === "list") {
      loadHistories();
    } else if (view === "form") {
      loadPatients();
    }
  }, [view]);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const data = await tenantApi.getPatients();
      setPatients(data || []);
    } catch (error) {
      console.error("Error loading patients", error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistories = async () => {
    setLoading(true);
    try {
      const data = await tenantApi.getAllMedicalHistories();
      setHistories(data || []);
    } catch (error) {
      console.error("Error loading histories", error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowDetail = async (historyId: string) => {
    setLoading(true);
    try {
      const data = await tenantApi.getMedicalHistoryDetail(historyId);
      setSelectedHistory(data);
      setView("detail");
    } catch (error) {
      console.error("Error loading history detail", error);
      alert("Error al cargar el detalle del historial");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTooth = () => {
    const updatedItems = [...odontogramItems, { ...newTooth }];
    setOdontogramItems(updatedItems);
    // Auto-calculate total price
    const totalPrice = updatedItems.reduce(
      (sum, item) => sum + (item.price || 0),
      0,
    );
    setFormData((prev) => ({
      ...prev,
      price: totalPrice,
      payment_amount: totalPrice,
    }));
    setNewTooth({
      tooth_number: 1,
      tooth_type: "adult",
      notes: "",
      price: 0,
      description: "",
      duration_minutes: 30,
      treatment_date: new Date().toISOString().split("T")[0],
    });
  };

  const handleRemoveTooth = (index: number) => {
    const updatedItems = odontogramItems.filter((_, i) => i !== index);
    setOdontogramItems(updatedItems);
    const totalPrice = updatedItems.reduce(
      (sum, item) => sum + (item.price || 0),
      0,
    );
    setFormData((prev) => ({
      ...prev,
      price: totalPrice,
      payment_amount: totalPrice,
    }));
  };

  const handleEditTooth = (index: number) => {
    const itemToEdit = odontogramItems[index];
    setNewTooth({ ...itemToEdit });
    handleRemoveTooth(index);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return alert("Por favor selecciona un paciente");

    setSubmitting(true);
    try {
      await tenantApi.createFullMedicalHistory(selectedPatientId, {
        ...formData,
        odontogram_items: odontogramItems,
      });
      alert("Historial médico registrado con éxito");
      setView("list");
      resetForm();
    } catch (error) {
      console.error("Error submitting form", error);
      alert("Error al guardar el historial");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedHistory) return;
    const confirmed = confirm(
      "¿Estás seguro de que deseas eliminar este historial? No se borrará de la base de datos, solo se ocultará.",
    );
    if (!confirmed) return;

    try {
      await tenantApi.deleteMedicalHistory(selectedHistory.history.id);
      alert("Historial eliminado correctamente");
      setView("list");
    } catch (error) {
      console.error("Error deleting history", error);
      alert("Error al eliminar el historial");
    }
  };

  const resetForm = () => {
    setSelectedPatientId("");
    setFormData({
      conditions: "",
      allergies: "",
      medications: "",
      medical_description: "",
      uses_toothbrush: true,
      uses_dentifrice: true,
      brushing_frequency: "",
      brushing_technique: "",
      uses_floss: false,
      price: 0,
      payment_amount: 0,
      payment_method: "efectivo",
      payment_status: "completed",
    });
    setOdontogramItems([]);
    setNewTooth({
      tooth_number: 1,
      tooth_type: "adult",
      notes: "",
      price: 0,
      description: "",
      duration_minutes: 30,
      treatment_date: new Date().toISOString().split("T")[0],
    });
  };

  const filteredPatients = patients.filter((p) =>
    (p.first_name + " " + p.last_name)
      .toLowerCase()
      .includes(searchPatient.toLowerCase()),
  );

  const filteredHistories = histories.filter(
    (h) =>
      (h.patient_name || "")
        .toLowerCase()
        .includes(searchHistory.toLowerCase()) ||
      (h.description || "").toLowerCase().includes(searchHistory.toLowerCase()),
  );

  // --- VISTA LISTA ---
  if (view === "list") {
    return (
      <div className="space-y-6 pb-12">
        <div className="flex justify-between items-center bg-slate-900/40 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
              <ClipboardClock className="text-blue-500" size={32} />
              Historiales Médicos
            </h1>
            <p className="text-slate-400">
              Gestión centralizada de registros clínicos y tratamientos.
            </p>
          </div>
          <Button
            onClick={() => setView("form")}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-11 px-6 shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all transform hover:-translate-y-0.5"
          >
            <Plus size={20} />
            Nuevo Registro
          </Button>
        </div>

        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <Card className="relative bg-slate-900/60 border-slate-800 backdrop-blur-xl">
            <CardHeader className="border-b border-slate-800/50 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg font-semibold flex items-center gap-2">
                  <Activity size={18} className="text-blue-400" />
                  Todos los registros
                </CardTitle>
                <div className="relative w-72">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    size={16}
                  />
                  <Input
                    placeholder="Buscar por paciente o descripción..."
                    className="pl-9 bg-slate-950/50 border-slate-800 text-white"
                    value={searchHistory}
                    onChange={(e) => setSearchHistory(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                  <p className="text-slate-500 animate-pulse">
                    Cargando historiales...
                  </p>
                </div>
              ) : filteredHistories.length === 0 ? (
                <div className="text-center py-20 text-slate-500 space-y-4">
                  <ClipboardClock size={48} className="mx-auto opacity-20" />
                  <p>No se encontraron registros médicos.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/50">
                  {filteredHistories.map((h) => (
                    <div
                      key={h.id}
                      onClick={() => handleShowDetail(h.id)}
                      className="group flex items-center justify-between p-4 hover:bg-slate-800/40 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20 group-hover:scale-110 transition-transform">
                          <Users size={22} />
                        </div>
                        <div>
                          <p className="text-white font-semibold flex items-center gap-2">
                            {h.patient_name}
                            <Badge
                              variant="outline"
                              className="text-[10px] uppercase tracking-tighter border-slate-700 text-slate-400"
                            >
                              {new Date(h.created_at).toLocaleDateString()}
                            </Badge>
                          </p>
                          <p className="text-sm text-slate-500 truncate max-w-md mt-0.5">
                            {h.description ||
                              "Sin descripción clínica adicional"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                            Último Ingreso
                          </p>
                          <p className="text-xs text-slate-300">
                            {new Date(h.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 group-hover:text-blue-400 group-hover:bg-blue-400/10 transition-all">
                          <ChevronRight size={20} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // --- VISTA DETALLE ---
  if (view === "detail" && selectedHistory) {
    const { history, patient, treatment, odontogram, payments } =
      selectedHistory;
    return (
      <div className="space-y-6 pb-20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setView("list")}
              className="border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white"
            >
              <ArrowLeft size={18} className="mr-2" />
              Volver a la lista
            </Button>
            <div className="h-6 w-px bg-slate-800"></div>
            <span className="text-slate-500 text-sm">
              Detalle de Sesión Clínica
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/dashboard/historyPatients/${history.id}`)
              }
              className="border-blue-500/30 bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 hover:text-blue-300 gap-2"
            >
              <Edit3 size={16} />
              Editar
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              className="border-rose-500/30 bg-rose-600/10 text-rose-400 hover:bg-rose-600/20 hover:text-rose-300 gap-2"
            >
              <Trash2 size={16} />
              Eliminar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-slate-900/50 border-slate-800 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2"></div>
              <CardHeader className="pt-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-blue-500/30 flex items-center justify-center text-blue-400 text-2xl font-bold">
                    {patient.first_name[0]}
                    {patient.last_name[0]}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white leading-tight">
                      {patient.first_name} {patient.last_name}
                    </h2>
                    <p className="text-slate-500 text-sm italic">
                      {patient.phone}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
                  <p className="text-[12px] text-slate-500 uppercase tracking-widest font-bold mb-2">
                    Resumen de Salud
                  </p>
                  <div className="space-y-3">
                    <div>
                      <span className="text-md text-slate-500">
                        Condiciones:
                      </span>
                      <p className="text-sm text-slate-300 font-medium">
                        {history.conditions || "Ninguna registrada"}
                      </p>
                    </div>
                    <div>
                      <span className="text-md text-slate-500">Alergias:</span>
                      <p className="text-sm text-slate-300 font-medium">
                        {history.allergies || "Ninguna"}
                      </p>
                    </div>
                    <div>
                      <span className="text-md text-slate-500">
                        Medicaciones:
                      </span>
                      <p className="text-sm text-slate-300 font-medium">
                        {history.medications || "Ninguna"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800 shadow-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-500" />
                  Higiene Bucal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div
                    className={`p-2 rounded border ${history.uses_toothbrush ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-100" : "bg-rose-500/5 border-rose-500/20 text-rose-300"} text-xs font-semibold text-center`}
                  >
                    Usa Cepillo: {history.uses_toothbrush ? "SÍ" : "NO"}
                  </div>
                  <div
                    className={`p-2 rounded border ${history.uses_dentifrice ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-100" : "bg-rose-500/5 border-rose-500/20 text-rose-300"} text-xs font-semibold text-center`}
                  >
                    Usa Dentífrico: {history.uses_dentifrice ? "SÍ" : "NO"}
                  </div>
                </div>
                <div className="p-3 rounded bg-slate-950/40 border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                    Frecuencia de cepillado
                  </p>
                  <p className="text-sm text-slate-300">
                    {history.brushing_frequency || "No especificado"}
                    {history.brushing_frequency === 1
                      ? " vez al dia"
                      : " veces al dia"}
                  </p>
                </div>
                <div className="p-3 rounded bg-slate-950/40 border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                    Técnica
                  </p>
                  <p className="text-sm text-slate-300">
                    {history.brushing_technique || "No especificado"}
                  </p>
                </div>
                <div
                  className={`p-3 rounded border text-center font-bold text-sm ${history.uses_floss ? "bg-blue-500/10 border-blue-500/30 text-blue-200" : "bg-slate-800/50 border-slate-700 text-slate-500"}`}
                >
                  {history.uses_floss
                    ? "✓ USA HILO DENTAL"
                    : "✗ NO USA HILO DENTAL"}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-slate-900/50 border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <Badge className="bg-blue-500 text-white border-none py-1 px-3">
                  FINALIZADO
                </Badge>
              </div>
              <CardHeader className="border-b border-slate-800/60 pb-6 pt-8">
                <div className="flex flex-col gap-1">
                  <p className="text-blue-500 font-bold text-xs uppercase tracking-[0.2em] mb-1">
                    Evolución Clínica
                  </p>
                  <h3 className="text-2xl font-bold text-white">
                    {treatment?.name || "Registro de Seguimiento"}
                  </h3>
                  <div className="flex items-center gap-6 mt-2">
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Calendar size={14} className="text-blue-500" />
                      {treatment?.date
                        ? new Date(treatment.date).toLocaleDateString()
                        : new Date(history.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Clock size={14} className="text-blue-500" />
                      {treatment?.duration_minutes || "--"} min
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-8">
                <div>
                  <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-3">
                    Resumen de Evolución
                  </h4>
                  <p className="text-slate-200 leading-relaxed bg-slate-950/30 p-4 rounded-xl border border-slate-800/50 text-sm">
                    {history.description ||
                      "Múltiples tratamientos realizados."}
                  </p>
                </div>

                <div className="pt-2">
                  <h4 className="text-blue-500/80 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Activity size={12} /> Detalles del Tratamiento
                  </h4>
                  <div className="bg-slate-900/40 rounded-xl border border-slate-800/50 overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-slate-950/50 text-slate-500 uppercase tracking-tighter font-bold">
                        <tr>
                          <th className="px-4 py-3">Pieza</th>
                          <th className="px-4 py-3">Tratamiento</th>
                          <th className="px-4 py-3">Fecha</th>
                          <th className="px-4 py-3 text-right">Precio</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {odontogram.map((item: any, idx: number) => (
                          <tr
                            key={idx}
                            className="hover:bg-slate-800/30 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <Badge className="bg-slate-800 text-slate-300 border-none">
                                #{item.tooth_number}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-slate-200">
                                {item.description}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {item.tooth_type === "adult"
                                  ? "Adulto"
                                  : "Niño"}{" "}
                                • {item.duration_minutes}min
                              </p>
                            </td>
                            <td className="px-4 py-3 text-slate-400">
                              {item.treatment_date
                                ? new Date(
                                    item.treatment_date,
                                  ).toLocaleDateString()
                                : "--"}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-amber-400">
                              Bs {item.price}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {odontogram && odontogram.length > 0 && (
                  <div>
                    <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                      Piezas Tratadas (Odontograma)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {odontogram.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-4 p-3 bg-slate-950/60 border border-slate-800 rounded-xl"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-10 h-10 shrink-0 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/20">
                              {item.tooth_number}
                            </div>
                            <div className="min-w-0">
                              <p className="text-white text-sm font-semibold capitalize truncate">
                                {item.tooth_type === "adult"
                                  ? "Adulto"
                                  : "Niño"}{" "}
                                — {item.description || "Tratamiento"}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500 italic mt-0.5">
                                <span className="flex items-center gap-1 whitespace-nowrap">
                                  <Calendar size={10} />{" "}
                                  {item.treatment_date
                                    ? new Date(
                                        item.treatment_date,
                                      ).toLocaleDateString()
                                    : "--"}
                                </span>
                                <span className="flex items-center gap-1 whitespace-nowrap">
                                  <Clock size={10} />{" "}
                                  {item.duration_minutes || "--"} min
                                </span>
                                <span className="truncate max-w-[200px] sm:max-w-xs">
                                  Obs: {item.notes || "Sin especificaciones"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <span className="text-amber-400 font-bold text-sm whitespace-nowrap shrink-0">
                            Bs {item.price || 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-slate-800/50">
                  <div className="flex flex-wrap items-center justify-between gap-6">
                    <div className="space-y-1">
                      <p className="text-slate-500 text-[10px] font-bold uppercase">
                        Estado Financiero
                      </p>
                      <div className="flex items-center gap-3">
                        {payments &&
                        payments[0]?.payment_status === "completed" ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-none px-3">
                            PAGADO
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500/20 text-red-400 border-none px-3">
                            PENDIENTE
                          </Badge>
                        )}
                        <span className="text-white font-bold text-lg">
                          Bs {treatment?.price || 0}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-slate-500 text-[10px] font-bold uppercase">
                        Método de Cobro
                      </p>
                      <p className="text-white font-medium capitalize flex items-center gap-2">
                        <DollarSign size={14} className="text-amber-500" />
                        {payments[0]?.payment_method || "Efectivo"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // --- VISTA FORMULARIO / EDICION ---
  return (
    <div className="space-y-6 pb-12 text-slate-200">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setView("list")}
            className="text-slate-500 hover:text-white"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
              Nuevo Registro Clínico
            </h1>
            <p className="text-slate-400 text-sm">
              Completa el registro clínico, tratamiento y cobro en un solo paso.
            </p>
          </div>
        </div>
        <ClipboardClock className="text-blue-500/20" size={64} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* COLUMNA IZQUIERDA: Paciente y Salud */}
        <div className="lg:col-span-1 space-y-6">
          <Card
            className={`bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-xl transition-all duration-300 ${isPatientMenuOpen ? "relative z-[60]" : "relative z-0"}`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-white text-lg">
                <Users size={18} className="text-blue-400" />
                Selección de Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="relative">
                {/* Trigger del Dropdown */}
                <div
                  onClick={() => setIsPatientMenuOpen(!isPatientMenuOpen)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                    selectedPatientId
                      ? "bg-blue-600/10 border-blue-500/50 text-white"
                      : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div
                      className={`p-2 rounded-lg ${selectedPatientId ? "bg-blue-500/20 text-blue-400" : "bg-slate-900 text-slate-500"}`}
                    >
                      <User size={18} />
                    </div>
                    <div className="truncate">
                      <p className="text-[10px] uppercase font-bold tracking-wider opacity-50">
                        Paciente
                      </p>
                      <p className="font-semibold truncate">
                        {selectedPatientId
                          ? `${patients.find((p) => p.id === selectedPatientId)?.first_name} ${patients.find((p) => p.id === selectedPatientId)?.last_name}`
                          : "Seleccionar paciente..."}
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    size={20}
                    className={`text-slate-500 transition-transform duration-300 ${isPatientMenuOpen ? "rotate-180" : ""}`}
                  />
                </div>

                {/* Menú Desplegable */}
                {isPatientMenuOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-3 border-b border-slate-800 bg-slate-950/50 flex items-center gap-2">
                      <Search size={16} className="text-slate-500" />
                      <input
                        autoFocus
                        placeholder="Buscar por nombre..."
                        className="bg-transparent border-none text-white text-sm focus:ring-0 w-full outline-none"
                        value={searchPatient}
                        onChange={(e) => setSearchPatient(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      {searchPatient && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSearchPatient("");
                          }}
                          className="text-slate-500 hover:text-white"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                      {loading ? (
                        <div className="p-6 text-center text-slate-500 text-sm italic">
                          Cargando pacientes...
                        </div>
                      ) : filteredPatients.length === 0 ? (
                        <div className="p-6 text-center text-slate-500 text-sm italic">
                          No se encontraron resultados
                        </div>
                      ) : (
                        filteredPatients.map((p) => (
                          <div
                            key={p.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPatientId(p.id);
                              setIsPatientMenuOpen(false);
                              setSearchPatient("");
                            }}
                            className={`p-3 cursor-pointer hover:bg-blue-600/10 transition-colors border-b border-slate-800 last:border-0 flex items-center justify-between group ${
                              selectedPatientId === p.id ? "bg-blue-600/20" : ""
                            }`}
                          >
                            <div className="truncate">
                              <p
                                className={`text-sm font-medium ${selectedPatientId === p.id ? "text-blue-400" : "text-slate-200 group-hover:text-blue-400"}`}
                              >
                                {p.first_name} {p.last_name}
                              </p>
                              <p className="text-[10px] text-slate-500 uppercase tracking-tighter">
                                {p.phone || "Sin teléfono"}
                              </p>
                            </div>
                            {selectedPatientId === p.id && (
                              <CheckCircle2
                                size={16}
                                className="text-blue-400"
                              />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-white text-lg">
                <ShieldCheck size={18} className="text-emerald-400" />
                Higiene Bucal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() =>
                    setFormData({
                      ...formData,
                      uses_toothbrush: !formData.uses_toothbrush,
                    })
                  }
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${formData.uses_toothbrush ? "bg-blue-500/20 border-blue-500 text-blue-100 shadow-inner" : "bg-slate-950/40 border-slate-800 text-slate-500"}`}
                >
                  <span className="text-[10px] font-bold uppercase mb-1">
                    ¿Usa Cepillo?
                  </span>
                  <span className="text-lg font-bold">
                    {formData.uses_toothbrush ? "SÍ" : "NO"}
                  </span>
                </div>
                <div
                  onClick={() =>
                    setFormData({
                      ...formData,
                      uses_dentifrice: !formData.uses_dentifrice,
                    })
                  }
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${formData.uses_dentifrice ? "bg-blue-500/20 border-blue-500 text-blue-100 shadow-inner" : "bg-slate-950/40 border-slate-800 text-slate-500"}`}
                >
                  <span className="text-[10px] font-bold uppercase mb-1">
                    ¿Dentífrico?
                  </span>
                  <span className="text-lg font-bold">
                    {formData.uses_dentifrice ? "SÍ" : "NO"}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  ¿Cuántas veces se cepilla?
                </label>
                <Input
                  className="bg-slate-950/50 border-slate-800 text-white"
                  placeholder="Ej: 3 veces al día"
                  value={formData.brushing_frequency}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      brushing_frequency: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Técnica de cepillado
                </label>
                <Input
                  className="bg-slate-950/50 border-slate-800 text-white"
                  placeholder="Ej: Bass, Circular..."
                  value={formData.brushing_technique}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      brushing_technique: e.target.value,
                    })
                  }
                />
              </div>
              <div
                onClick={() =>
                  setFormData({ ...formData, uses_floss: !formData.uses_floss })
                }
                className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${formData.uses_floss ? "bg-indigo-500/20 border-indigo-500 text-indigo-100" : "bg-slate-950/20 border-slate-800 text-slate-500"}`}
              >
                <span className="text-sm font-bold">¿Usa hilo dental?</span>
                <div
                  className={`w-10 h-6 rounded-full relative transition-colors ${formData.uses_floss ? "bg-indigo-600" : "bg-slate-700"}`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.uses_floss ? "left-5" : "left-1"}`}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COLUMNA CENTRAL: Tratamiento y Odontograma */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-amber-500"></div>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-white text-lg">
                <Activity size={18} className="text-purple-400" />
                Tratamiento y Odontograma
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Costo Total Historial (Bs)
                    </label>
                    <Input
                      type="number"
                      disabled
                      className="bg-slate-950/50 border-slate-800 text-amber-400 font-bold focus:ring-purple-500/50 cursor-not-allowed"
                      value={formData.price}
                    />
                    <p className="text-[10px] text-slate-600">
                      Suma automática de todos los tratamientos por pieza.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 border border-slate-800 rounded-xl bg-slate-950/40 border-dashed">
                <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <Plus size={16} className="text-slate-400" />
                  Añadir Tratamientos por Pieza (Odontograma)
                </h3>

                <div className="space-y-4 mb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 uppercase tracking-widest">
                        Nombre del Tratamiento
                      </label>
                      <Input
                        placeholder="Ej: Endodoncia, Limpieza..."
                        className="bg-slate-900 border-slate-800 text-white"
                        value={newTooth.description}
                        onChange={(e) =>
                          setNewTooth({
                            ...newTooth,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 uppercase tracking-widest">
                        N° Diente
                      </label>
                      <Input
                        type="number"
                        className="bg-slate-900 border-slate-800 text-white"
                        value={newTooth.tooth_number}
                        onChange={(e) =>
                          setNewTooth({
                            ...newTooth,
                            tooth_number: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 uppercase tracking-widest">
                        Tipo de Pieza
                      </label>
                      <select
                        className="w-full h-10 rounded-md bg-slate-900 border border-slate-800 text-white text-sm px-3 appearance-none focus:ring-1 focus:ring-blue-500 outline-none"
                        value={newTooth.tooth_type}
                        onChange={(e) =>
                          setNewTooth({
                            ...newTooth,
                            tooth_type: e.target.value,
                          })
                        }
                      >
                        <option value="adult">Adulto</option>
                        <option value="child">Niño</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 uppercase tracking-widest">
                        Precio (Bs)
                      </label>
                      <Input
                        type="number"
                        className="bg-slate-900 border-slate-800 text-amber-400 font-bold"
                        value={newTooth.price}
                        onChange={(e) =>
                          setNewTooth({
                            ...newTooth,
                            price: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 uppercase tracking-widest">
                        Fecha
                      </label>
                      <Input
                        type="date"
                        className="bg-slate-900 border-slate-800 text-white"
                        value={newTooth.treatment_date}
                        style={{ colorScheme: "dark" }}
                        onChange={(e) =>
                          setNewTooth({
                            ...newTooth,
                            treatment_date: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 uppercase tracking-widest">
                        Duración (min)
                      </label>
                      <Input
                        type="number"
                        className="bg-slate-900 border-slate-800 text-white"
                        value={newTooth.duration_minutes}
                        onChange={(e) =>
                          setNewTooth({
                            ...newTooth,
                            duration_minutes: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 uppercase tracking-widest">
                        Observaciones
                      </label>
                      <Input
                        placeholder="Notas..."
                        className="bg-slate-900 border-slate-800 text-white"
                        value={newTooth.notes}
                        onChange={(e) =>
                          setNewTooth({ ...newTooth, notes: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleAddTooth}
                    className="w-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 font-medium h-10"
                  >
                    <Plus size={16} className="mr-2" />
                    Añadir Tratamiento de Pieza
                  </Button>
                </div>

                {odontogramItems.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {odontogramItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-2.5 bg-slate-950/60 border border-slate-800/50 rounded-lg text-sm group hover:border-slate-700 transition-colors gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 shrink-0 rounded bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                            {item.tooth_number}
                          </div>
                          <div className="min-w-0">
                            <p className="text-slate-100 font-semibold leading-none capitalize truncate">
                              Piece {item.tooth_number} —{" "}
                              {item.description || "Tratamiento"}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 mt-1.5">
                              <span className="flex items-center gap-1 whitespace-nowrap">
                                <Calendar size={10} /> {item.treatment_date}
                              </span>
                              <span className="flex items-center gap-1 whitespace-nowrap">
                                <Clock size={10} /> {item.duration_minutes}min
                              </span>
                              <span className="truncate max-w-[150px] sm:max-w-xs">
                                {item.notes ? `Obs: ${item.notes}` : "Sin obs."}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="text-amber-400 font-bold text-sm whitespace-nowrap">
                            Bs {item.price || 0}
                          </span>
                          <div className="flex bg-slate-900/50 border border-slate-800 rounded-md overflow-hidden">
                            <button
                              type="button"
                              onClick={() => handleEditTooth(idx)}
                              className="text-slate-500 hover:text-blue-400 hover:bg-slate-800 transition-colors p-1.5 border-r border-slate-800"
                              title="Editar esta pieza"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveTooth(idx)}
                              className="text-slate-500 hover:text-rose-500 hover:bg-slate-800 transition-colors p-1.5"
                              title="Eliminar esta pieza"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Descripción de la Evolución Clínica
                </label>
                <textarea
                  className="w-full rounded-md bg-slate-950/50 border border-slate-800 text-white min-h-[120px] p-3 text-sm focus:ring-1 focus:ring-purple-500/50 outline-none"
                  placeholder="Describe detalladamente el procedimiento realizado hoy..."
                  value={formData.medical_description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      medical_description: e.target.value,
                    })
                  }
                />
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-4">
                <h4 className="text-sm font-bold text-slate-400 flex items-center gap-2">
                  <Stethoscope size={16} className="text-amber-500" />
                  Antecedentes Relevantes
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase font-bold">
                      Condiciones
                    </label>
                    <Input
                      className="bg-slate-900/50 border-slate-800 h-9 text-white"
                      value={formData.conditions}
                      onChange={(e) =>
                        setFormData({ ...formData, conditions: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase font-bold">
                      Alergias
                    </label>
                    <Input
                      className="bg-slate-900/50 border-slate-800 h-9 text-white"
                      value={formData.allergies}
                      onChange={(e) =>
                        setFormData({ ...formData, allergies: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase font-bold">
                      Medicación
                    </label>
                    <Input
                      className="bg-slate-900/50 border-slate-800 h-9 text-white"
                      value={formData.medications}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          medications: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-3 text-white">
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign size={18} className="text-amber-400" />
                Información de Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Monto Recibido
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    Bs
                  </span>
                  <Input
                    type="number"
                    className="pl-7 bg-slate-950/50 border-slate-800 text-white focus:ring-amber-500/50"
                    value={formData.payment_amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payment_amount: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Método
                </label>
                <select
                  className="w-full h-10 rounded-md bg-slate-950/50 border border-slate-800 text-white text-sm px-3 focus:ring-1 focus:ring-amber-500/50 outline-none appearance-none"
                  value={formData.payment_method}
                  onChange={(e) =>
                    setFormData({ ...formData, payment_method: e.target.value })
                  }
                >
                  <option value="efectivo" className="bg-slate-900">
                    Efectivo
                  </option>
                  <option value="tarjeta" className="bg-slate-900">
                    Tarjeta
                  </option>
                  <option value="transferencia" className="bg-slate-900">
                    Transferencia
                  </option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Estado de Pago
                </label>
                <select
                  className="w-full h-10 rounded-md bg-slate-950/50 border border-slate-800 text-white text-sm px-3 focus:ring-1 focus:ring-amber-500/50 outline-none appearance-none"
                  value={formData.payment_status}
                  onChange={(e) =>
                    setFormData({ ...formData, payment_status: e.target.value })
                  }
                >
                  <option value="completed" className="bg-slate-900">
                    Pagado (Total)
                  </option>
                  <option value="pending" className="bg-slate-900">
                    Pendiente / Abono
                  </option>
                </select>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 pt-4 border-t border-slate-800/50">
            <Button
              type="button"
              variant="ghost"
              className="text-slate-400 hover:text-white transition-colors"
              onClick={() => setView("list")}
            >
              Regresar
            </Button>
            <Button
              type="submit"
              disabled={submitting || !selectedPatientId}
              className="bg-blue-600 hover:bg-blue-700 text-white px-10 h-12 text-base font-semibold shadow-[0_0_25px_rgba(37,99,235,0.4)] hover:shadow-[0_0_35px_rgba(37,99,235,0.6)] transition-all duration-300 transform hover:-translate-y-0.5"
            >
              {submitting ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Registrando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={20} />
                  Finalizar Registro
                </div>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
