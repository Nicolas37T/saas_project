"use client";

import { useState, useEffect } from "react";
import { Printer, Plus, Trash2, DollarSign, Share2, FileText, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { tenantApi, SettingData } from "@/lib/api";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";

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

interface QuoteItem {
  treatment: string;
  description: string;
  price: number;
}

export default function PricePage() {
  const [settings, setSettings] = useState<SettingData | null>(null);
  const [doctorName, setDoctorName] = useState("");
  const [loading, setLoading] = useState(true);

  // Form State
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [notes, setNotes] = useState("");
  const [date] = useState(new Date().toLocaleDateString());
  const [discount, setDiscount] = useState(0);

  // New item form
  const [newTreatment, setNewTreatment] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPrice, setNewPrice] = useState("");

  // Share modal
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const settingsRes = await tenantApi.getTenantConfig();
        setSettings(settingsRes);

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

  const addItem = () => {
    if (!newTreatment.trim()) return;
    const price = parseFloat(newPrice) || 0;
    setItems([...items, { treatment: newTreatment, description: newDescription, price }]);
    setNewTreatment("");
    setNewDescription("");
    setNewPrice("");
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount;

  const handlePrint = () => {
    window.print();
  };

  const generateQuoteText = () => {
    let text = `💰 COTIZACIÓN DE TRATAMIENTO\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `👤 Paciente: ${patientName || "No especificado"}\n`;
    text += `📅 Fecha: ${date}\n`;
    text += `👨‍⚕️ Doctor: ${doctorName}\n\n`;

    if (settings?.business_name) {
      text += `🏥 ${settings.business_name}\n`;
    }

    text += `\n🦷 TRATAMIENTOS:\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    items.forEach((item, idx) => {
      text += `${idx + 1}. ${item.treatment}\n`;
      if (item.description) text += `   📝 ${item.description}\n`;
      text += `   💲 Bs. ${item.price.toFixed(2)}\n\n`;
    });

    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📊 Subtotal: Bs. ${subtotal.toFixed(2)}\n`;
    if (discount > 0) {
      text += `🏷️ Descuento (${discount}%): -Bs. ${discountAmount.toFixed(2)}\n`;
    }
    text += `💰 TOTAL: Bs. ${total.toFixed(2)}\n`;

    if (notes) {
      text += `\n📋 OBSERVACIONES:\n`;
      text += `━━━━━━━━━━━━━━━━━━━━\n`;
      text += `${notes}\n\n`;
    }

    text += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    text += `✅ Dr(a). ${doctorName}\n`;
    text += `⚠️ Esta cotización tiene una validez de 30 días.`;

    return text;
  };

  const handleShareWhatsApp = () => {
    const text = generateQuoteText();
    const encodedText = encodeURIComponent(text);

    if (patientPhone) {
      const cleanPhone = patientPhone.replace(/\D/g, "");
      window.open(`https://wa.me/${cleanPhone}?text=${encodedText}`, "_blank");
    } else {
      window.open(`https://wa.me/?text=${encodedText}`, "_blank");
    }

    setShowShareModal(false);
  };

  if (loading) return <div className="text-center py-20"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div></div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Cotizaciones</h1>
          <p className="text-muted-foreground">Genera cotizaciones de tratamientos para tus pacientes.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowShareModal(true)}
            variant="outline"
            className="flex items-center shadow-lg hover:bg-accent"
            disabled={items.length === 0}
          >
            <Share2 size={18} className="mr-2" /> Compartir
          </Button>
          <Button
            onClick={handlePrint}
            className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center shadow-lg"
            disabled={items.length === 0}
          >
            <Printer size={18} className="mr-2" /> Imprimir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-2 space-y-6 print:hidden">
          {/* Patient Info */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User size={20} className="text-primary" /> Datos del Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nombre del Paciente</label>
                  <Input
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Nombre completo..."
                    className="bg-muted/50 border-border text-foreground focus-visible:ring-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Teléfono (opcional)</label>
                  <Input
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="+ 591 12345678"
                    className="bg-muted/50 border-border text-foreground focus-visible:ring-primary/50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Treatments */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign size={20} className="text-green-500" /> Tratamientos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new treatment form */}
              <div className="p-4 bg-muted/20 border border-dashed border-border rounded-xl space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Agregar tratamiento</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Tratamiento *</label>
                    <Input
                      value={newTreatment}
                      onChange={(e) => setNewTreatment(e.target.value)}
                      placeholder="Ej: Limpieza dental"
                      className="bg-muted/50 border-border h-9 text-sm"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Descripción</label>
                    <Input
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Detalles del tratamiento..."
                      className="bg-muted/50 border-border h-9 text-sm"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Precio (Bs.)</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        placeholder="0.00"
                        className="bg-muted/50 border-border h-9 text-sm"
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
                      />
                      <Button
                        type="button"
                        onClick={addItem}
                        size="sm"
                        className="h-9 px-3 bg-primary hover:bg-primary/90 text-primary-foreground"
                        disabled={!newTreatment.trim()}
                      >
                        <Plus size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items list */}
              {items.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-border rounded-xl text-muted-foreground">
                  No hay tratamientos agregados. Usa el formulario de arriba para añadir.
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="p-4 bg-muted/30 border border-border rounded-lg relative group flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></span>
                          <span className="truncate">{item.treatment}</span>
                        </h4>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-1 ml-4 truncate">{item.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="font-bold text-sm text-amber-500">Bs. {item.price.toFixed(2)}</span>
                        <button
                          onClick={() => removeItem(index)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Discount + Totals */}
                  <div className="pt-4 border-t border-border space-y-3">
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium whitespace-nowrap">Descuento (%)</label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={discount || ""}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="bg-muted/50 border-border h-8 text-sm w-24"
                      />
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Subtotal</span>
                      <span>Bs. {subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-green-500">
                        <span>Descuento ({discount}%)</span>
                        <span>-Bs. {discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
                      <span>Total</span>
                      <span className="text-primary">Bs. {total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="pt-4 space-y-2">
                <label className="text-sm font-medium">Observaciones Adicionales</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Condiciones, garantías, indicaciones adicionales..."
                  className="w-full p-3 h-24 rounded-md bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Column */}
        <div className="lg:col-span-1">
          <Card className="bg-white text-slate-900 border-none shadow-2xl h-fit overflow-hidden sticky top-6">
            <div className="bg-emerald-600 px-4 py-2 flex items-center gap-2 print:hidden">
               <FileText size={16} className="text-white/80" />
               <span className="text-white text-xs font-bold uppercase tracking-wider">Vista Previa</span>
            </div>

            <div id="quote-print" className="p-8 space-y-6 min-h-[600px] flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-start border-b pb-6 border-slate-200">
                <div className="flex items-center gap-4">
                  {settings?.logo_url && (
                    <img src={settings.logo_url} alt="Logo" className="h-16 w-16 object-contain" />
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-emerald-800 uppercase leading-none mb-2">
                      {settings?.business_name || "Nombre Clínica"}
                    </h2>
                    <div className="text-[10px] text-slate-500 space-y-0.5 font-medium">
                      {settings?.address && <p>{settings.address}</p>}
                      {settings?.phone && <p>Tel: {settings.phone}</p>}
                      {settings?.cellphone && <p>Cel: {settings.cellphone}</p>}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Cotización</p>
                  <p className="text-sm font-medium">{date}</p>
                </div>
              </div>

              {/* Patient Info */}
              <div className="bg-slate-50 p-4 rounded-lg flex justify-between">
                <div>
                  <p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5">Paciente</p>
                  <p className="text-sm font-bold">{patientName || "---"}</p>
                  {patientPhone && <p className="text-xs text-slate-500 mt-0.5">Tel: {patientPhone}</p>}
                </div>
                <div className="text-right">
                  <p className="text-[9px] uppercase font-bold text-slate-400 mb-0.5">Doctor</p>
                  <p className="text-sm font-bold">{doctorName || "---"}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="flex-grow">
                <div className="flex items-center gap-2 text-emerald-800 border-b pb-1 mb-4">
                  <h3 className="text-lg font-black italic tracking-tighter">Tx</h3>
                  <div className="h-px bg-slate-200 flex-grow"></div>
                </div>

                {items.length === 0 ? (
                  <p className="text-slate-300 italic text-sm text-center py-10">Agregue tratamientos en el formulario</p>
                ) : (
                  <div className="space-y-0">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 text-[9px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2 mb-2">
                      <div className="col-span-1">#</div>
                      <div className="col-span-7">Tratamiento</div>
                      <div className="col-span-4 text-right">Precio</div>
                    </div>

                    {/* Table Rows */}
                    {items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 py-2 border-b border-slate-50 items-start">
                        <div className="col-span-1 text-xs text-slate-400 font-bold">{idx + 1}</div>
                        <div className="col-span-7">
                          <p className="text-sm font-semibold text-slate-800">{item.treatment}</p>
                          {item.description && (
                            <p className="text-[10px] text-slate-500 italic mt-0.5">{item.description}</p>
                          )}
                        </div>
                        <div className="col-span-4 text-right text-sm font-bold text-slate-700">
                          Bs. {item.price.toFixed(2)}
                        </div>
                      </div>
                    ))}

                    {/* Totals */}
                    <div className="pt-4 mt-2 border-t border-slate-200 space-y-1">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Subtotal</span>
                        <span>Bs. {subtotal.toFixed(2)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-xs text-emerald-600 font-medium">
                          <span>Descuento ({discount}%)</span>
                          <span>-Bs. {discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-black text-emerald-800 pt-1 border-t border-slate-200">
                        <span>TOTAL</span>
                        <span>Bs. {total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              {notes && (
                <div className="pt-4 mt-4 border-t border-slate-100">
                  <p className="text-[9px] uppercase font-bold text-slate-400 mb-2">Observaciones</p>
                  <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">{notes}</p>
                </div>
              )}

              {/* Validity + Signature */}
              <div className="mt-auto pt-8 space-y-6">
                <div className="flex justify-end">
                  <div className="w-48 text-center">
                    <div className="border-b border-slate-400 w-full mb-2"></div>
                    <p className="text-sm font-bold text-slate-800 uppercase leading-none mb-1">{doctorName || "Doctor"}</p>
                    <p className="text-[10px] font-bold uppercase text-slate-500">Firma y Sello</p>
                  </div>
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
                  <WhatsAppIcon size={20} />
                  Compartir Cotización
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
              <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                <p className="text-xs text-muted-foreground">Compartiendo cotización de:</p>
                <p className="font-semibold text-sm">{patientName || "Sin nombre"}</p>
                <p className="text-xs text-muted-foreground">
                  {items.length} tratamiento{items.length !== 1 ? 's' : ''} — Total: Bs. {total.toFixed(2)}
                </p>
                {patientPhone ? (
                  <button
                    onClick={() => {
                      const cleanPhone = patientPhone.replace(/\D/g, "");
                      window.open(`https://wa.me/${cleanPhone}`, "_blank");
                    }}
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-green-500 transition-colors"
                    title="Abrir WhatsApp"
                  >
                    <WhatsAppIcon size={14} className="flex-shrink-0" />
                    <span>Teléfono: {patientPhone}</span>
                  </button>
                ) : (
                  <p className="text-xs text-amber-500">
                    ℹ️ Se abrirá WhatsApp para que elijas el contacto
                  </p>
                )}
              </div>

              {/* Preview */}
              <div className="bg-muted/20 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">Vista previa del mensaje:</p>
                <div className="text-xs whitespace-pre-wrap max-h-32 overflow-y-auto font-mono bg-background/50 p-2 rounded">
                  {generateQuoteText()}
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
                >
                  <WhatsAppIcon size={16} className="mr-2" />
                  Enviar por WhatsApp
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #quote-print, #quote-print * {
            visibility: visible;
          }
          #quote-print {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            padding: 20px;
            margin: 0;
            background-color: white !important;
            color: black !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}