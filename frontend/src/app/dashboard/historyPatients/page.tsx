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
import { Step2Odontogram, OdontogramItem } from "../../../components/Step2Odontogram";
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
  const [newTooth, setNewTooth] = useState<OdontogramItem>({
    tooth_number: 1,
    tooth_type: "adult",
    notes: "",
    treatments: [],
  });

  useEffect(() => {
    if (view === "list") {
      loadHistories();
    } else if (view === "form") {
      loadPatients();
    }
  }, [view]);

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
    if (!newTooth.tooth_number) return;
    setOdontogramItems([...odontogramItems, { ...newTooth, treatments: [] }]);
    setNewTooth({ tooth_number: 1, tooth_type: "adult", notes: "", treatments: [] });
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
    setNewTooth({
      tooth_number: 1,
      tooth_type: "adult",
      notes: "",
      treatments: [],
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

  // --- RENDERING ---
  return (
    <div className="space-y-6 pb-12">
      {view === "list" && (
        <div className="space-y-6">
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
      )}

      {view === "detail" && selectedHistory && (
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
                  router.push(
                    `/dashboard/historyPatients/${selectedHistory.history.id}`,
                  )
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

          {(() => {
            const { history, patient, odontograms } = selectedHistory;
            const totalPrice = odontograms?.reduce((sum: number, o: any) => sum + (o.treatments?.reduce((tSum: number, t: any) => tSum + t.price, 0) || 0), 0) || 0;
            return (
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
                            <span className="text-md text-slate-500">
                              Alergias:
                            </span>
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
                          Usa Dentífrico:{" "}
                          {history.uses_dentifrice ? "SÍ" : "NO"}
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
                          Registro de Seguimiento
                        </h3>
                        <div className="flex items-center gap-6 mt-2">
                          <div className="flex items-center gap-2 text-slate-400 text-sm">
                            <Calendar size={14} className="text-blue-500" />
                            {history.created_at
                              ? new Date(history.created_at).toLocaleDateString()
                              : "--"}
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
                              {odontograms?.flatMap((item: any) => 
                                item.treatments?.map((t: any, idx: number) => (
                                  <tr
                                    key={`${item.id}-${idx}`}
                                    className="hover:bg-slate-800/30 transition-colors"
                                  >
                                    <td className="px-4 py-3">
                                      <Badge className="bg-slate-800 text-slate-300 border-none">
                                        #{item.tooth_number}
                                      </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                      <p className="font-semibold text-slate-200">
                                        {t.description}
                                      </p>
                                      <p className="text-[10px] text-slate-500 uppercase tracking-tighter">
                                        {item.tooth_type === "adult" ? "Permanente" : "Temporal"}{" "}
                                        • {t.procedure_status}
                                      </p>
                                    </td>
                                    <td className="px-4 py-3 text-slate-400">
                                      {t.treatment_date
                                        ? new Date(
                                            t.treatment_date,
                                          ).toLocaleDateString()
                                        : "--"}
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-amber-400">
                                      {t.price === 0 ? (
                                        <span className="text-slate-500 italic text-xs font-normal relative pr-4">
                                          Privado
                                          <span className="absolute top-1/2 right-1 w-1.5 h-1.5 bg-slate-600 rounded-full -translate-y-1/2"></span>
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
                                  <td colSpan={4} className="py-8 text-center text-slate-500 text-sm">
                                    No hay procedimientos registrados en este historial.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-slate-800/50">
                        <div className="flex flex-wrap items-center justify-between gap-6">
                          <div className="space-y-1">
                            <p className="text-slate-500 text-[10px] font-bold uppercase">
                              Costo Total
                            </p>
                            <div className="flex items-center gap-3">
                              <span className="text-white font-bold text-lg">
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
                  Completa el registro clínico, tratamiento y cobro en un solo
                  paso.
                </p>
              </div>
            </div>
            <ClipboardClock className="text-blue-500/20" size={64} />
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
