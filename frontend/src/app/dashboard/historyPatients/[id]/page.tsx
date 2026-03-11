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

import { useParams, useRouter } from "next/navigation";

export default function EditHistoryPatientPage() {
  const params = useParams();
  const router = useRouter();
  const historyId = params.id as string;

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchPatient, setSearchPatient] = useState("");
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
    const initializeData = async () => {
      setLoading(true);
      try {
        await loadPatients();
        if (historyId) {
          const data = await tenantApi.getMedicalHistoryDetail(historyId);
          await loadHistoryDataIntoForm(data);
        }
      } catch (error) {
        console.error("Error initializing edit view", error);
        alert("Error al cargar los datos para edición.");
      } finally {
        setLoading(false);
      }
    };
    initializeData();
  }, [historyId]);

  const loadPatients = async () => {
    const data = await tenantApi.getPatients();
    setPatients(data || []);
  };

  const loadHistoryDataIntoForm = async (selectedHistory: any) => {
    if (!selectedHistory) return;
    const { history, patient, treatment, odontogram, payments } =
      selectedHistory;

    setSelectedPatientId(patient?.id || "");
    setFormData({
      conditions: history.conditions || "",
      allergies: history.allergies || "",
      medications: history.medications || "",
      medical_description: history.description || "",
      uses_toothbrush: history.uses_toothbrush ?? false,
      uses_dentifrice: history.uses_dentifrice ?? false,
      brushing_frequency: history.brushing_frequency || "",
      brushing_technique: history.brushing_technique || "",
      uses_floss: history.uses_floss ?? false,
      price: treatment?.price || 0,
      payment_amount: payments?.[0]?.amount || 0,
      payment_method: payments?.[0]?.payment_method || "efectivo",
      payment_status: payments?.[0]?.payment_status || "completed",
    });
    setOdontogramItems(
      (odontogram || []).map((item: any) => ({
        tooth_number: item.tooth_number,
        tooth_type: item.tooth_type,
        notes: item.notes || "",
        price: item.price || 0,
        description: item.description || "",
        duration_minutes: item.duration_minutes || 30,
        treatment_date: item.treatment_date
          ? new Date(item.treatment_date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      })),
    );
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
      await tenantApi.updateFullMedicalHistory(historyId, {
        ...formData,
        odontogram_items: odontogramItems,
      });
      alert("Historial médico actualizado con éxito");
      router.push("/dashboard/historyPatients");
    } catch (error) {
      console.error("Error submitting form", error);
      alert("Error al guardar el historial");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPatients = patients.filter((p: Patient) =>
    (p.first_name + " " + p.last_name)
      .toLowerCase()
      .includes(searchPatient.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <p className="text-slate-500 animate-pulse">
          Cargando datos para edición...
        </p>
      </div>
    );
  }

  // --- VISTA EDICION ---
  return (
    <div className="space-y-6 pb-12 text-slate-200">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/historyPatients")}
            className="text-slate-500 hover:text-white"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
              Editar Registro Clínico
            </h1>
            <p className="text-slate-400 text-sm">
              Modifica los datos del registro clínico y los tratamientos.
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
                        filteredPatients.map((p: Patient) => (
                          <div
                            key={p.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPatientId(p.id);
                              setIsPatientMenuOpen(false);
                            }}
                            className={`p-3 border-b border-slate-800 flex items-center gap-3 cursor-pointer transition-colors ${
                              selectedPatientId === p.id
                                ? "bg-blue-600/10"
                                : "hover:bg-slate-800"
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
              onClick={() => router.push("/dashboard/historyPatients")}
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
                  Actualizando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={20} />
                  Guardar Cambios
                </div>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
