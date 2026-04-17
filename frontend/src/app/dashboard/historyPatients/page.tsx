"use client";
import React, { useState, useEffect } from "react";
import {
  ClipboardClock,
  Users,
  Activity,
  Plus,
  Trash2,
  CheckCircle2,
  Search,
  ArrowLeft,
  ChevronRight,
  Calendar,
  Clock,
  ShieldCheck,
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
import {
  CustomModal,
  SuccessModal,
  ConfirmModal,
} from "@/components/ui/custom-modal";

import { useRouter } from "next/navigation";
import { Stepper } from "../../../components/Stepper";
import { Step1PatientHygiene } from "../../../components/Step1PatientHygiene";
import { Step2Odontogram, OdontogramItem, NewToothWithTreatment, DEFAULT_NEW_TOOTH } from "../../../components/Step2Odontogram";
import { Step3Evolution } from "../../../components/Step3Evolution";
import { FormNavigation } from "../../../components/FormNavigation";

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

  // Modal State
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    message: string;
  }>({ isOpen: false, message: "" });
  const [successMsg, setSuccessMsg] = useState("Registro completado con éxito");
  const [patientHasHistory, setPatientHasHistory] = useState(false);

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
  });

  const [odontogramItems, setOdontogramItems] = useState<OdontogramItem[]>([]);
  const [newTooth, setNewTooth] = useState<NewToothWithTreatment>({ ...DEFAULT_NEW_TOOTH });

  useEffect(() => {
    if (view === "list") {
      loadHistories();
    } else if (view === "form") {
      loadPatients();
    }
  }, [view]);

  // Deep linking for History Details
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const historyId = urlParams.get("historyId");
      if (historyId) {
        handleShowDetail(historyId);
        // Opcional: limpiar la URL para que no quede el query string
        window.history.replaceState(null, "", window.location.pathname);
      }
    }
  }, []); // Run only once on mount

  useEffect(() => {
    if (selectedPatientId && view === "form") {
      tenantApi
        .checkPatientHistory(selectedPatientId)
        .then((data) => {
          setPatientHasHistory(data.has_history);
        })
        .catch((err) => {
          console.error("Error checking patient history", err);
          setPatientHasHistory(false);
        });
    } else {
      setPatientHasHistory(false);
    }
  }, [selectedPatientId, view]);

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
      setErrorModal({
        isOpen: true,
        message: "No se pudo cargar el detalle del historial clínico.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTooth = () => {
    if (!newTooth.tooth_number || !newTooth.first_treatment_description.trim()) return;
    const firstTreatment = {
      description: newTooth.first_treatment_description,
      price: newTooth.first_treatment_price,
      treatment_date: newTooth.first_treatment_date,
      procedure_status: newTooth.first_treatment_status,
    };
    setOdontogramItems([
      ...odontogramItems,
      {
        tooth_number: newTooth.tooth_number,
        tooth_type: newTooth.tooth_type,
        notes: newTooth.notes,
        treatments: [firstTreatment],
      },
    ]);
    setNewTooth({ ...DEFAULT_NEW_TOOTH });
  };

  const handleRemoveTooth = (index: number) => {
    setOdontogramItems(odontogramItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setErrorModal({
        isOpen: true,
        message: "Por favor selecciona un paciente antes de continuar.",
      });
      return;
    }

    setSubmitting(true);
    try {
      await tenantApi.createFullMedicalHistory(selectedPatientId, {
        ...formData,
        odontogram_items: odontogramItems,
      });
      setSuccessMsg("Historial médico registrado con éxito");
      setIsSuccessModalOpen(true);
      setView("list");
      resetForm();
    } catch (error: any) {
      console.error("Error submitting form", error);
      setErrorModal({
        isOpen: true,
        message:
          error.message ||
          "Ocurrió un error al intentar guardar el historial clínico. Verifica los datos e intenta de nuevo.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedHistory) return;
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleteConfirmOpen(false);
    try {
      await tenantApi.deleteMedicalHistory(selectedHistory.history.id);
      setSuccessMsg("Historial eliminado correctamente");
      setIsSuccessModalOpen(true);
      setView("list");
    } catch (error) {
      console.error("Error deleting history", error);
      setErrorModal({
        isOpen: true,
        message: "No se pudo eliminar el historial. Intente más tarde.",
      });
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
    });
    setOdontogramItems([]);
    setNewTooth({ ...DEFAULT_NEW_TOOTH });
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
      (h.description || "").toLowerCase().includes(searchHistory.toLowerCase()) ||
      (h.history_number && String(h.history_number).includes(searchHistory.replace("#", ""))),
  );

  // --- RENDERING ---
  return (
    <div className="space-y-6 pb-12">
      {view === "list" && (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 sm:p-6 rounded-2xl border border-border backdrop-blur-md">
            <div className="w-full sm:w-auto">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 flex items-center gap-2 sm:gap-3">
                <ClipboardClock className="text-primary flex-shrink-0" size={24} />
                <span className="break-words">Historiales Médicos</span>
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Gestión centralizada de registros clínicos y tratamientos.
              </p>
            </div>
            <Button
              onClick={() => setView("form")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-10 sm:h-11 px-4 sm:px-6 shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all transform hover:-translate-y-0.5 w-full sm:w-auto flex-shrink-0"
            >
              <Plus size={18} />
              <span>Nuevo Registro</span>
            </Button>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <Card className="relative bg-card border-border backdrop-blur-xl">
              <CardHeader className="border-b border-border/50 pb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                    <Activity size={18} className="text-primary" />
                    Todos los registros
                  </CardTitle>
                  <div className="relative w-full sm:w-72">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={16}
                    />
                    <Input
                      placeholder="Buscar por paciente o descripción..."
                      className="pl-9 bg-muted/50 border-border text-foreground"
                      value={searchHistory}
                      onChange={(e) => setSearchHistory(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    <p className="text-muted-foreground animate-pulse">
                      Cargando historiales...
                    </p>
                  </div>
                ) : filteredHistories.length === 0 ? (
                  <div className="text-center py-20 text-muted-foreground space-y-4">
                    <ClipboardClock size={48} className="mx-auto opacity-20" />
                    <p>No se encontraron registros médicos.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {filteredHistories.map((h) => (
                      <div
                        key={h.id}
                        onClick={() => handleShowDetail(h.id)}
                        className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 hover:bg-muted/40 transition-all cursor-pointer gap-3 sm:gap-4"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform flex-shrink-0">
                            <Users size={20} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold flex flex-wrap items-center gap-2">
                              {h.history_number && (
                                <span className="text-[10px] sm:text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">
                                  #{h.history_number}
                                </span>
                              )}
                              <span className="truncate">{h.patient_name}</span>
                              <Badge
                                variant="outline"
                                className="text-[10px] uppercase tracking-tighter border-border text-muted-foreground flex-shrink-0"
                              >
                                {new Date(h.created_at).toLocaleDateString()}
                              </Badge>
                            </p>
                            <p className="text-sm text-muted-foreground truncate max-w-[250px] sm:max-w-md mt-0.5">
                              {h.description ||
                                "Sin descripción clínica adicional"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                          <div className="text-right sm:block">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                              Último Ingreso
                            </p>
                            <p className="text-xs text-foreground">
                              {new Date(h.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-all flex-shrink-0">
                            <ChevronRight size={18} />
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
      )}

      {view === "detail" && selectedHistory && (
        <div className="space-y-4 sm:space-y-6 pb-20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => setView("list")}
                className="border-border bg-muted/50 text-muted-foreground hover:text-foreground w-full sm:w-auto"
              >
                <ArrowLeft size={18} className="mr-2" />
                Volver a la lista
              </Button>
              <div className="h-6 w-px bg-border hidden sm:block"></div>
              <span className="text-muted-foreground text-sm">
                Detalle de Sesión Clínica
              </span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <Button
                variant="outline"
                onClick={() =>
                  router.push(
                    `/dashboard/historyPatients/${selectedHistory.history.id}`,
                  )
                }
                className="border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 gap-2 flex-1 sm:flex-initial"
              >
                <Edit3 size={16} />
                <span className="hidden sm:inline">Editar</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleDelete}
                className="border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 gap-2 flex-1 sm:flex-initial"
              >
                <Trash2 size={16} />
                <span className="hidden sm:inline">Eliminar</span>
              </Button>
            </div>
          </div>

          {(() => {
            const { history, patient, odontograms } = selectedHistory;
            const totalPrice = odontograms?.reduce((sum: number, o: any) => sum + (o.treatments?.reduce((tSum: number, t: any) => tSum + t.price, 0) || 0), 0) || 0;
            return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4 sm:space-y-6">
                  <Card className="bg-card border-border shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-primary to-indigo-600 h-2"></div>
                    <CardHeader className="pt-4 sm:pt-6">
                      <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted border-2 border-primary/30 flex items-center justify-center text-primary text-xl sm:text-2xl font-bold flex-shrink-0">
                          {patient.first_name[0]}
                          {patient.last_name[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="text-lg sm:text-xl font-bold leading-tight break-words">
                            {patient.first_name} {patient.last_name}
                          </h2>
                          <p className="text-muted-foreground text-xs sm:text-sm italic">
                            {patient.phone}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4 pt-0">
                      <div className="p-2 sm:p-3 rounded-lg bg-muted/40 border border-border">
                        <p className="text-[10px] sm:text-[12px] text-muted-foreground uppercase tracking-widest font-bold mb-2">
                          Resumen de Salud
                        </p>
                        <div className="space-y-2 sm:space-y-3">
                          <div>
                            <span className="text-xs sm:text-sm text-muted-foreground">
                              Condiciones:
                            </span>
                            <p className="text-xs sm:text-sm font-medium break-words">
                              {history.conditions || "Ninguna registrada"}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs sm:text-sm text-muted-foreground">
                              Alergias:
                            </span>
                            <p className="text-xs sm:text-sm font-medium break-words">
                              {history.allergies || "Ninguna"}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs sm:text-sm text-muted-foreground">
                              Medicaciones:
                            </span>
                            <p className="text-xs sm:text-sm font-medium break-words">
                              {history.medications || "Ninguna"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border shadow-xl">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                        <ShieldCheck size={16} className="text-green-500" />
                        Higiene Bucal
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 sm:space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div
                          className={`p-2 rounded border ${history.uses_toothbrush ? "bg-green-500/10 border-green-500/20 text-green-800 dark:text-green-400" : "bg-destructive/5 border-destructive/20 text-destructive"} text-[10px] sm:text-xs font-semibold text-center`}
                        >
                          Usa Cepillo: {history.uses_toothbrush ? "SÍ" : "NO"}
                        </div>
                        <div
                          className={`p-2 rounded border ${history.uses_dentifrice ? "bg-green-500/10 border-green-500/20 text-green-800 dark:text-green-400" : "bg-destructive/5 border-destructive/20 text-destructive"} text-[10px] sm:text-xs font-semibold text-center`}
                        >
                          Usa Dentífrico:{" "}
                          {history.uses_dentifrice ? "SÍ" : "NO"}
                        </div>
                      </div>
                      <div className="p-2 sm:p-3 rounded bg-muted/40 border border-border">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">
                          Frecuencia de cepillado
                        </p>
                        <p className="text-xs sm:text-sm">
                          {history.brushing_frequency || "No especificado"}
                          {history.brushing_frequency === 1
                            ? " vez al dia"
                            : " veces al dia"}
                        </p>
                      </div>
                      <div className="p-2 sm:p-3 rounded bg-muted/40 border border-border">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">
                          Técnica
                        </p>
                        <p className="text-xs sm:text-sm">
                          {history.brushing_technique || "No especificado"}
                        </p>
                      </div>
                      <div
                        className={`p-2 sm:p-3 rounded border text-center font-bold text-xs sm:text-sm ${history.uses_floss ? "bg-green-500/10 border-green-500/20 text-green-800 dark:text-green-400" : "bg-muted/50 border-border text-muted-foreground"}`}
                      >
                        {history.uses_floss
                          ? "✓ USA HILO DENTAL"
                          : "✗ NO USA HILO DENTAL"}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                  <Card className="bg-card border-border shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 sm:p-4">
                      <Badge className="bg-primary text-primary-foreground border-none py-1 px-2 sm:py-1 sm:px-3 text-xs sm:text-sm">
                        FINALIZADO
                      </Badge>
                    </div>
                    <CardHeader className="border-b border-border/60 pb-4 sm:pb-6 pt-6 sm:pt-8">
                      <div className="flex flex-col gap-1">
                        <p className="text-primary font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-1">
                          Evolución Clínica
                        </p>
                        <h3 className="text-xl sm:text-2xl font-bold flex flex-wrap items-center gap-2 sm:gap-3">
                          <span className="break-words">Registro de Seguimiento</span>
                          {history.history_number && (
                            <span className="text-sm sm:text-base bg-primary/10 text-primary px-2 py-1 rounded font-mono flex-shrink-0">
                              #{history.history_number}
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center gap-4 sm:gap-6 mt-2">
                          <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm">
                            <Calendar size={14} className="text-primary" />
                            {history.created_at
                              ? new Date(history.created_at).toLocaleDateString()
                              : "--"}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 sm:pt-6 space-y-6 sm:space-y-8">
                      <div>
                        <h4 className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-2 sm:mb-3">
                          Resumen de Evolución
                        </h4>

                        <div className="space-y-3">
                          {(history.description || "Múltiples tratamientos realizados.")
                            .split("\n\n---\n\n")
                            .map((entry: string, idx: number) => (
                              <p 
                                key={idx} 
                                className="leading-relaxed bg-muted/30 p-4 rounded-xl border border-border/50 text-sm relative"
                              >
                                <span className="absolute -left-2 top-4 w-1 h-8 bg-primary rounded-full opacity-50"></span>
                                {entry}
                              </p>
                            ))
                          }
                        </div>
                      </div>

                      <div className="pt-2">
                        <h4 className="text-primary/80 text-[10px] font-bold uppercase tracking-widest mb-2 sm:mb-3 flex items-center gap-2">
                          <Activity size={12} /> Detalles del Tratamiento
                        </h4>
                        <div className="bg-muted/40 rounded-xl border border-border/50 overflow-x-auto">
                          <table className="w-full text-left text-xs whitespace-nowrap">
                            <thead className="bg-muted/50 text-muted-foreground uppercase tracking-tighter font-bold">
                              <tr>
                                <th className="px-4 py-3">Pieza</th>
                                <th className="px-4 py-3">Tratamiento</th>
                                <th className="px-4 py-3">Fecha</th>
                                <th className="px-4 py-3 text-right">Precio</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                              {odontograms?.flatMap((item: any) =>
                                item.treatments?.map((t: any, idx: number) => (
                                  <tr
                                    key={`${item.id}-${idx}`}
                                    className="hover:bg-muted/30 transition-colors"
                                  >
                                    <td className="px-3 sm:px-4 py-2 sm:py-3">
                                      <Badge className="bg-muted text-foreground border-none text-[10px] sm:text-xs">
                                        #{item.tooth_number}
                                      </Badge>
                                    </td>
                                    <td className="px-3 sm:px-4 py-2 sm:py-3">
                                      <p className="font-semibold text-xs sm:text-sm">
                                        {t.description}
                                      </p>
                                      <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                                        {item.tooth_type === "adult" ? "Permanente" : "Temporal"}{" "}
                                        • {t.procedure_status}
                                      </p>
                                    </td>
                                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-muted-foreground text-xs sm:text-sm">
                                      {t.treatment_date
                                        ? new Date(
                                            t.treatment_date,
                                          ).toLocaleDateString()
                                        : "--"}
                                    </td>
                                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-right font-bold text-amber-500 text-xs sm:text-sm">
                                      {t.price === 0 ? (
                                        <span className="text-muted-foreground italic text-[10px] sm:text-xs font-normal relative pr-4">
                                          Privado
                                          <span className="absolute top-1/2 right-1 w-1.5 h-1.5 bg-muted-foreground rounded-full -translate-y-1/2"></span>
                                        </span>
                                      ) : (
                                        `Bs. ${t.price}`
                                      )}
                                    </td>
                                  </tr>
                                )) || []
                              )}
                              {!odontograms?.length && (
                                <tr>
                                  <td colSpan={4} className="py-6 sm:py-8 text-center text-muted-foreground text-xs sm:text-sm">
                                    No hay procedimientos registrados en este historial.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="pt-4 sm:pt-6 border-t border-border/50">
                        <div className="flex flex-wrap items-center justify-between gap-4 sm:gap-6">
                          <div className="space-y-1">
                            <p className="text-muted-foreground text-[10px] font-bold uppercase">
                              Costo Total
                            </p>
                            <div className="flex items-center gap-2 sm:gap-3">
                              <span className="font-bold text-sm sm:text-lg">
                                Bs {totalPrice}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {view === "form" && (
        <div className="space-y-4 sm:space-y-6 pb-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <Button
                variant="ghost"
                onClick={() => setView("list")}
                className="flex-shrink-0"
              >
                <ArrowLeft size={20} />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 break-words">
                  Nuevo Registro Clínico
                </h1>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  Completa el registro clínico, tratamiento y cobro en un solo
                  paso.
                </p>
              </div>
            </div>
            <ClipboardClock className="text-primary/20 flex-shrink-0 hidden sm:block" size={64} />
          </div>

          <Stepper currentStep={currentStep} />

          <form
            onSubmit={handleSubmit}
            className="animate-in fade-in duration-700"
          >
            {currentStep === 1 && (
              <Step1PatientHygiene
                mode="create"
                patients={patients}
                selectedPatientId={selectedPatientId}
                setSelectedPatientId={setSelectedPatientId}
                patientHasHistory={patientHasHistory}
                isPatientMenuOpen={isPatientMenuOpen}
                setIsPatientMenuOpen={setIsPatientMenuOpen}
                searchPatient={searchPatient}
                setSearchPatient={setSearchPatient}
                formData={formData}
                setFormData={setFormData}
                loadingPatients={loading}
              />
            )}

            {currentStep === 2 && (
              <Step2Odontogram
                odontogramItems={odontogramItems}
                setOdontogramItems={setOdontogramItems}
                newTooth={newTooth}
                setNewTooth={setNewTooth}
                handleAddTooth={handleAddTooth}
                handleRemoveTooth={handleRemoveTooth}
              />
            )}

            {currentStep === 3 && (
              <Step3Evolution formData={formData} setFormData={setFormData} />
            )}

            <FormNavigation
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              onCancel={() => setView("list")}
              submitting={submitting}
              canGoNext={
                currentStep !== 1 || (!!selectedPatientId && !patientHasHistory)
              }
              finishLabel="FINALIZAR REGISTRO"
            />
          </form>
        </div>
      )}

      {/* Modals Section */}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="Operación Exitosa"
        message={successMsg}
      />

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="¿Eliminar historial?"
        message={
          <span>
            <strong>
              {selectedHistory?.patient?.first_name}{" "}
              {selectedHistory?.patient?.last_name}
            </strong>{" "}
            será ocultado del sistema. Sus datos se conservarán en la base de
            datos por seguridad.
          </span>
        }
        confirmText="SÍ, ELIMINAR"
        variant="danger"
        icon={<Trash2 size={24} className="text-red-500" />}
      />

      <CustomModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
        title="Error en el Sistema"
      >
        <div className="space-y-4">
          <p className="text-slate-300">{errorModal.message}</p>
          <Button
            onClick={() => setErrorModal({ ...errorModal, isOpen: false })}
            className="w-full bg-slate-800 hover:bg-slate-700"
          >
            Cerrar
          </Button>
        </div>
      </CustomModal>
    </div>
  );
}
