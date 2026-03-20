"use client";
import React, { useState, useEffect } from "react";
import { ClipboardClock, Trash2, ArrowLeft } from "lucide-react";
import { tenantApi, Patient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomModal, SuccessModal } from "@/components/ui/custom-modal";

import { useParams, useRouter } from "next/navigation";
import { Stepper } from "../../../../components/Stepper";
import { Step1PatientHygiene } from "../../../../components/Step1PatientHygiene";
import { Step2Odontogram, OdontogramItem, NewToothWithTreatment, DEFAULT_NEW_TOOTH } from "../../../../components/Step2Odontogram";
import { Step3Evolution } from "../../../../components/Step3Evolution";
import { FormNavigation } from "../../../../components/FormNavigation";

export default function EditHistoryPatientPage() {
  const params = useParams();
  const router = useRouter();
  const historyId = params.id as string;

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchPatient, setSearchPatient] = useState("");
  const [isPatientMenuOpen, setIsPatientMenuOpen] = useState(false);

  // Modal State
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    message: string;
  }>({ isOpen: false, message: "" });
  const [currentStep, setCurrentStep] = useState(1);

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
        setErrorModal({
          isOpen: true,
          message: "No se pudieron cargar los datos del historial clínico.",
        });
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
      price: 0,
    });
    // Map new API format: each odontogram has tooth info + treatments array
    setOdontogramItems(
      (selectedHistory.odontograms || []).map((item: any) => ({
        tooth_number: item.tooth_number,
        tooth_type: item.tooth_type,
        notes: item.notes || "",
        treatments: (item.treatments || []).map((t: any) => ({
          id: t.id,
          description: t.description || "",
          price: t.price || 0,
          treatment_date: t.treatment_date
            ? new Date(t.treatment_date).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          procedure_status: t.procedure_status || "pendiente",
        })),
      }))
    );
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
      await tenantApi.updateFullMedicalHistory(historyId, {
        ...formData,
        odontogram_items: odontogramItems,
      });
      setIsSuccessModalOpen(true);
      setTimeout(() => {
        router.push("/dashboard/historyPatients");
      }, 1500);
    } catch (error) {
      console.error("Error submitting form", error);
      setErrorModal({
        isOpen: true,
        message:
          "Error al actualizar el historial. Verifica los datos e intenta de nuevo.",
      });
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

      <Stepper currentStep={currentStep} />

      <form onSubmit={handleSubmit} className="animate-in fade-in duration-700">
        {currentStep === 1 && (
          <Step1PatientHygiene
            mode="edit"
            patients={patients}
            selectedPatientId={selectedPatientId}
            setSelectedPatientId={setSelectedPatientId}
            patientHasHistory={false}
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
          onCancel={() => router.push("/dashboard/historyPatients")}
          submitting={submitting}
          canGoNext={true}
          finishLabel="GUARDAR CAMBIOS"
        />
      </form>

      {/* Modals Section */}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => {
          setIsSuccessModalOpen(false);
          router.push("/dashboard/historyPatients");
        }}
        title="Operación Exitosa"
        message="Historial médico actualizado correctamente en el sistema."
      />

      <CustomModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
        title="Error en el Sistema"
      >
        <div className="space-y-4">
          <p className="text-slate-300 text-sm leading-relaxed">
            {errorModal.message}
          </p>
          <div className="flex justify-end pt-4">
            <Button
              onClick={() => setErrorModal({ ...errorModal, isOpen: false })}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}
