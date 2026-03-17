"use client";

import { useState, useEffect, useRef } from "react";
import { Pill, Printer, Plus, Trash2, Search, FileText, Building2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { tenantApi, Medicine, SettingData, Patient } from "@/lib/api";

// Helper function to decode JWT and get user info
function decodeJWT(token: string): { email?: string; full_name?: string; sub?: string } | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export default function PrescriptionPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [settings, setSettings] = useState<SettingData | null>(null);
  const [doctorName, setDoctorName] = useState("");
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [prescriptionItems, setPrescriptionItems] = useState<{ medicineId: string; medicineName: string; dosage: string; instructions: string }[]>([]);
  const [notes, setNotes] = useState("");
  const [date] = useState(new Date().toLocaleDateString());

  // Search/Select helper
  const [searchTerm, setSearchTerm] = useState("");
  const [showMedicineList, setShowMedicineList] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [medsRes, patientsRes, settingsRes] = await Promise.all([
          tenantApi.getMedicines(),
          tenantApi.getPatients(),
          tenantApi.getTenantConfig()
        ]);
        setMedicines(medsRes);
        setPatients(patientsRes);
        setSettings(settingsRes);

        // Get doctor name from token
        const token = localStorage.getItem("token");
        if (token) {
          const decoded = decodeJWT(token);
          if (decoded?.full_name) {
            setDoctorName(decoded.full_name);
          } else if (decoded?.email) {
            setDoctorName(decoded.email.split('@')[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const addMedicine = (med: Medicine) => {
    setPrescriptionItems([...prescriptionItems, { medicineId: med.id, medicineName: med.name, dosage: "", instructions: "" }]);
    setSearchTerm("");
    setShowMedicineList(false);
  };

  const removeMedicine = (index: number) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...prescriptionItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setPrescriptionItems(newItems);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredMedicines = medicines.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateMedicine = async () => {
    if (!searchTerm.trim()) return;
    try {
      const newMed = await tenantApi.createMedicine({ name: searchTerm });
      setMedicines([...medicines, newMed]);
      addMedicine(newMed);
    } catch (error) {
      console.error("Error creating medicine:", error);
    }
  };

  if (loading) return <div className="text-white text-center py-20">Cargando...</div>;

  const currentPatient = patients.find(p => p.id === selectedPatient);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Receta Médica</h1>
          <p className="text-slate-400">Genera e imprime recetas para tus pacientes.</p>
        </div>
        <Button 
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center shadow-lg"
        >
          <Printer size={18} className="mr-2" /> Imprimir Receta
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-2 space-y-6 print:hidden">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User size={20} className="text-blue-400" /> Información del Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Seleccionar Paciente</label>
                <select
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  className="w-full p-2.5 rounded-md bg-slate-950/50 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="">-- Seleccionar Paciente --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Pill size={20} className="text-emerald-400" /> Medicamentos
              </CardTitle>
              <div className="relative w-64">
                <Input
                  placeholder="Buscar o agrega un medicamento..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowMedicineList(true);
                  }}
                  onFocus={() => setShowMedicineList(true)}
                  className="bg-slate-950/50 border-slate-800 text-white pl-9"
                />
                <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                {showMedicineList && searchTerm && (
                  <div className="absolute z-10 w-full mt-1 bg-slate-900 border border-slate-800 rounded-md shadow-xl max-h-48 overflow-y-auto">
                    {filteredMedicines.map(m => (
                      <button
                        key={m.id}
                        className="w-full text-left px-4 py-2 text-white hover:bg-slate-800 transition-colors flex items-center justify-between"
                        onClick={() => addMedicine(m)}
                      >
                        {m.name}
                        <Plus size={14} className="text-blue-400" />
                      </button>
                    ))}
                    {filteredMedicines.length === 0 && (
                      <div className="px-4 py-3 border-t border-slate-800">
                        <p className="text-slate-500 text-sm mb-2">No se encontró "{searchTerm}"</p>
                        <Button 
                          onClick={handleCreateMedicine}
                          variant="outline"
                          size="sm"
                          className="w-full bg-blue-600/10 border-blue-500/50 text-blue-400 hover:bg-blue-600 hover:text-white"
                        >
                          <Plus size={14} className="mr-2" /> Agregar 
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {prescriptionItems.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-slate-800 rounded-xl text-slate-500">
                  No hay medicamentos agregados. Usa el buscador para añadir.
                </div>
              ) : (
                <div className="space-y-4">
                  {prescriptionItems.map((item, index) => (
                    <div key={index} className="p-4 bg-slate-950/30 border border-slate-800 rounded-lg relative group">
                      <button 
                        onClick={() => removeMedicine(index)}
                        className="absolute top-2 right-2 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                      <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                         <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                         {item.medicineName}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs text-slate-500">Dosis / Frecuencia</label>
                          <Input 
                            value={item.dosage}
                            onChange={(e) => updateItem(index, 'dosage', e.target.value)}
                            placeholder="Ej: 1 tableta cada 8 horas"
                            className="bg-slate-900/50 border-slate-800 h-8 text-sm text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-slate-500">Instrucciones / Duración</label>
                          <Input 
                            value={item.instructions}
                            onChange={(e) => updateItem(index, 'instructions', e.target.value)}
                            placeholder="Ej: Tomar después de comer por 5 días"
                            className="bg-slate-900/50 border-slate-800 h-8 text-sm text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="pt-4 space-y-2">
                <label className="text-sm font-medium text-slate-300">Observaciones Adicionales</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Indicaciones generales del tratamiento..."
                  className="w-full p-3 h-24 rounded-md bg-slate-950/50 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Column */}
        <div className="lg:col-span-1">
          <Card className="bg-white text-slate-900 border-none shadow-2xl h-fit overflow-hidden sticky top-6">
            <div className="bg-blue-600 px-4 py-2 flex items-center gap-2 print:hidden">
               <FileText size={16} className="text-white/80" />
               <span className="text-white text-xs font-bold uppercase tracking-wider">Vista Previa</span>
            </div>
            
            <div id="prescription-print" className="p-8 space-y-8 min-h-[600px] flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-start border-b pb-6 border-slate-200">
                <div className="flex items-center gap-4">
                  {settings?.logo_url && (
                    <img src={settings.logo_url} alt="Logo" className="h-16 w-16 object-contain" />
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-blue-800 uppercase leading-none mb-2">
                      {settings?.business_name || "Nombre Clínica"}
                    </h2>
                    <div className="text-[10px] text-slate-500 space-y-0.5 font-medium">
                      {settings?.address && <p>{settings.address}</p>}
                      {(settings?.phone) && (
                        <p>Tel: {settings.phone}</p>
                      )}
                      {(settings?.cellphone) && (
                        <p>Cel: {settings.cellphone}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Receta / Prescription</p>
                  <p className="text-sm font-medium">{date}</p>
                </div>
              </div>

              {/* Patient Info */}
              <div className="bg-slate-50 p-4 rounded-lg flex justify-between">
                <div>
                  <p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5">Paciente</p>
                  <p className="text-sm font-bold">
                    {currentPatient ? `${currentPatient.first_name} ${currentPatient.last_name}` : "---"}
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="flex-grow space-y-6">
                <div className="flex items-center gap-2 text-blue-800 border-b pb-1">
                   <h3 className="text-lg font-black italic tracking-tighter">Rx</h3>
                   <div className="h-px bg-slate-200 flex-grow"></div>
                </div>
                
                {prescriptionItems.length === 0 ? (
                  <p className="text-slate-300 italic text-sm text-center py-10">Agregue medicamentos en el formulario</p>
                ) : (
                  <div className="space-y-6">
                    {prescriptionItems.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <p className="font-bold text-lg text-slate-800 uppercase tracking-tight">{item.medicineName}</p>
                        <div className="pl-4 border-l-2 border-blue-200 ml-1">
                           <p className="text-sm font-medium text-slate-700">{item.dosage || "Sin dosis"}</p>
                           <p className="text-xs text-slate-500 italic">{item.instructions}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {notes && (
                  <div className="pt-8 mt-8 border-t border-slate-100">
                    <p className="text-[9px] uppercase font-bold text-slate-400 mb-2">Indicaciones</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{notes}</p>
                  </div>
                )}
              </div>

              {/* Signature */}
              <div className="mt-auto pt-12 flex justify-end">
                <div className="w-48 text-center">
                  <div className="border-b border-slate-400 w-full mb-2"></div>
                  <p className="text-sm font-bold text-slate-800 uppercase leading-none mb-1">{doctorName || "Doctor"}</p>
                  <p className="text-[10px] font-bold uppercase text-slate-500">Firma y Sello</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          /* Ocultar todo por defecto */
          body * {
            visibility: hidden;
          }
          /* Mostrar el contenedor de la receta y sus hijos */
          #prescription-print, #prescription-print * {
            visibility: visible;
          }
          /* Posicionar la receta en la parte superior izquierda */
          #prescription-print {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            padding: 20px;
            margin: 0;
            background-color: white !important;
            color: black !important;
            /* Forzar colores de fondo e imágenes */
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          /* Clases de utilidad para ocultar elementos específicos */
          .print\:hidden {
            display: none !important;
          }
          /* Asegurar que el card contenedor no tenga sombras ni bordes extraños en print */
          .lg\:col-span-1 .Card {
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
}
