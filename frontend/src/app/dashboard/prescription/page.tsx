"use client";

import { useState, useEffect, useRef } from "react";
import { Pill, Printer, Plus, Trash2, Search, FileText, Share2, User, MessageCircle } from "lucide-react";
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
  
  // Share functionality
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

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

  const generatePrescriptionText = () => {
    const patientName = currentPatient 
      ? `${currentPatient.first_name} ${currentPatient.last_name}` 
      : "Paciente";
    
    let text = `📋 RECETA MÉDICA\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `👤 Paciente: ${patientName}\n`;
    text += `📅 Fecha: ${date}\n`;
    text += `👨‍⚕️ Doctor: ${doctorName}\n\n`;
    
    if (settings?.business_name) {
      text += `🏥 ${settings.business_name}\n`;
    }
    
    text += `\n💊 MEDICAMENTOS:\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    prescriptionItems.forEach((item, idx) => {
      text += `${idx + 1}. ${item.medicineName}\n`;
      if (item.dosage) text += `   📌 Dosis: ${item.dosage}\n`;
      if (item.instructions) text += `   📝 Instrucciones: ${item.instructions}\n`;
      text += `\n`;
    });
    
    if (notes) {
      text += `📋 OBSERVACIONES:\n`;
      text += `━━━━━━━━━━━━━━━━━━━━\n`;
      text += `${notes}\n\n`;
    }
    
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `✅ Dr(a). ${doctorName}`;
    
    return text;
  };

  const handleShareWhatsApp = () => {
    if (!currentPatient?.phone) {
      alert("El paciente no tiene un número de teléfono registrado");
      return;
    }

    const text = generatePrescriptionText();
    const encodedText = encodeURIComponent(text);

    // Remove any non-numeric characters from phone
    const cleanPhone = currentPatient.phone.replace(/\D/g, "");

    // Add country code if not present (default to Mexico +52 if needed)
    const phoneWithCode = cleanPhone.length <= 10 ? `52${cleanPhone}` : cleanPhone;

    const whatsappUrl = `https://wa.me/${phoneWithCode}?text=${encodedText}`;
    window.open(whatsappUrl, "_blank");

    setShowShareModal(false);
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

  if (loading) return <div className="text-center py-20">Cargando...</div>;

  const currentPatient = patients.find(p => p.id === selectedPatient);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Receta Médica</h1>
          <p className="text-muted-foreground">Genera e imprime recetas para tus pacientes.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              onClick={() => setShowShareModal(true)}
              variant="outline"
              className="flex items-center shadow-lg hover:bg-accent"
              disabled={!selectedPatient}
            >
              <Share2 size={18} className="mr-2" /> Compartir
            </Button>
          </div>
          <Button
            onClick={handlePrint}
            className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center shadow-lg"
          >
            <Printer size={18} className="mr-2" /> Imprimir Receta
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-2 space-y-6 print:hidden">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User size={20} className="text-primary" /> Información del Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Seleccionar Paciente</label>
                <select
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  className="w-full p-2.5 rounded-md bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">-- Seleccionar Paciente --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Pill size={20} className="text-green-500" /> Medicamentos
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
                  className="bg-muted/50 border-border text-foreground pl-9"
                />
                <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
                {showMedicineList && searchTerm && (
                  <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-xl max-h-48 overflow-y-auto">
                    {filteredMedicines.map(m => (
                      <button
                        key={m.id}
                        className="w-full text-left px-4 py-2 text-foreground hover:bg-accent transition-colors flex items-center justify-between"
                        onClick={() => addMedicine(m)}
                      >
                        {m.name}
                        <Plus size={14} className="text-primary" />
                      </button>
                    ))}
                    {filteredMedicines.length === 0 && (
                      <div className="px-4 py-3 border-t border-border">
                        <p className="text-muted-foreground text-sm mb-2">No se encontró "{searchTerm}"</p>
                        <Button
                          onClick={handleCreateMedicine}
                          variant="outline"
                          size="sm"
                          className="w-full bg-primary/10 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
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
                <div className="text-center py-10 border-2 border-dashed border-border rounded-xl text-muted-foreground">
                  No hay medicamentos agregados. Usa el buscador para añadir.
                </div>
              ) : (
                <div className="space-y-4">
                  {prescriptionItems.map((item, index) => (
                    <div key={index} className="p-4 bg-muted/30 border border-border rounded-lg relative group">
                      <button
                        onClick={() => removeMedicine(index)}
                        className="absolute top-2 right-2 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                         <span className="w-2 h-2 rounded-full bg-green-500"></span>
                         {item.medicineName}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Dosis / Frecuencia</label>
                          <Input
                            value={item.dosage}
                            onChange={(e) => updateItem(index, 'dosage', e.target.value)}
                            placeholder="Ej: 1 tableta cada 8 horas"
                            className="bg-muted/50 border-border h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Instrucciones / Duración</label>
                          <Input
                            value={item.instructions}
                            onChange={(e) => updateItem(index, 'instructions', e.target.value)}
                            placeholder="Ej: Tomar después de comer por 5 días"
                            className="bg-muted/50 border-border h-8 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 space-y-2">
                <label className="text-sm font-medium">Observaciones Adicionales</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Indicaciones generales del tratamiento..."
                  className="w-full p-3 h-24 rounded-md bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-sm"
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

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageCircle size={20} />
                  Compartir por WhatsApp
                </h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Patient Info */}
              <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                <p className="text-xs text-muted-foreground">Compartiendo receta de:</p>
                <p className="font-semibold text-sm">
                  {currentPatient?.first_name} {currentPatient?.last_name}
                </p>
                {currentPatient?.phone ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MessageCircle size={12} />
                    <p>Teléfono: {currentPatient.phone}</p>
                  </div>
                ) : (
                  <p className="text-xs text-destructive">
                    ⚠️ El paciente no tiene un número de teléfono registrado
                  </p>
                )}
              </div>

              {/* Preview */}
              <div className="bg-muted/20 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">Vista previa del mensaje:</p>
                <div className="text-xs whitespace-pre-wrap max-h-32 overflow-y-auto font-mono bg-background/50 p-2 rounded">
                  {generatePrescriptionText()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => setShowShareModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleShareWhatsApp}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                  disabled={isSharing || !currentPatient?.phone}
                >
                  <MessageCircle size={16} className="mr-2" />
                  Enviar por WhatsApp
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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
