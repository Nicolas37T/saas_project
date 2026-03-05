"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, DollarSign, FileText, Grid3X3, Stethoscope, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    dentalApi, DentalPatient, MedicalHistory, OdontogramEntry,
    DentalTreatment, TreatmentRecord, PatientBalance, DentalAppointment,
} from "@/lib/api";

const TABS = ["Historial", "Odontograma", "Tratamientos", "Citas", "Balance"] as const;
type Tab = typeof TABS[number];

const CONDITIONS: Record<string, { label: string; color: string }> = {
    sano: { label: "Sano", color: "bg-green-500" },
    caries: { label: "Caries", color: "bg-red-500" },
    obturacion: { label: "Obturación", color: "bg-blue-500" },
    corona: { label: "Corona", color: "bg-yellow-500" },
    ausente: { label: "Ausente", color: "bg-slate-600" },
    endodoncia: { label: "Endodoncia", color: "bg-purple-500" },
    protesis: { label: "Prótesis", color: "bg-orange-500" },
    implante: { label: "Implante", color: "bg-cyan-500" },
    sellante: { label: "Sellante", color: "bg-teal-500" },
    fractura: { label: "Fractura", color: "bg-pink-500" },
};

const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];

export default function PatientDetailPage() {
    const router = useRouter();
    const params = useParams();
    const patientId = params.id as string;

    const [patient, setPatient] = useState<DentalPatient | null>(null);
    const [tab, setTab] = useState<Tab>("Historial");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Historial
    const [history, setHistory] = useState<MedicalHistory>({ conditions: "", allergies: "", medications: "", notes: "" });
    const [savingHistory, setSavingHistory] = useState(false);

    // Odontograma
    const [odontogram, setOdontogram] = useState<OdontogramEntry[]>([]);
    const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
    const [toothCondition, setToothCondition] = useState("sano");

    // Tratamientos
    const [catalog, setCatalog] = useState<DentalTreatment[]>([]);
    const [records, setRecords] = useState<TreatmentRecord[]>([]);
    const [recTreatment, setRecTreatment] = useState("");
    const [recTooth, setRecTooth] = useState("");
    const [recCost, setRecCost] = useState("");
    const [recDesc, setRecDesc] = useState("");

    // Citas
    const [appointments, setAppointments] = useState<DentalAppointment[]>([]);
    const [apptDate, setApptDate] = useState("");
    const [apptStart, setApptStart] = useState("");
    const [apptEnd, setApptEnd] = useState("");
    const [apptNotes, setApptNotes] = useState("");

    // Balance
    const [balance, setBalance] = useState<PatientBalance>({ total: 0, paid: 0, pending: 0 });

    const loadAll = useCallback(async () => {
        try {
            const [p, h, o, c, r, a, b] = await Promise.all([
                dentalApi.getPatient(patientId),
                dentalApi.getHistory(patientId),
                dentalApi.getOdontogram(patientId),
                dentalApi.getTreatments(),
                dentalApi.getRecords(patientId),
                dentalApi.getAppointments({ patient_id: patientId }),
                dentalApi.getBalance(patientId),
            ]);
            setPatient(p);
            setHistory(h);
            setOdontogram(o);
            setCatalog(c);
            setRecords(r);
            setAppointments(a);
            setBalance(b);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error cargando datos");
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("user_role");
        if (!token || role !== "owner") { router.push("/login"); return; }
        loadAll();
    }, [router, loadAll]);

    // ─── Handlers ─────────────────────────────────────────────────────────────

    async function saveHistory() {
        setSavingHistory(true);
        try {
            await dentalApi.saveHistory(patientId, history);
        } catch (err: unknown) { setError(err instanceof Error ? err.message : "Error"); }
        finally { setSavingHistory(false); }
    }

    async function saveToothCondition() {
        if (selectedTooth === null) return;
        try {
            await dentalApi.saveOdontogramEntry(patientId, { tooth_number: selectedTooth, condition: toothCondition });
            const updated = await dentalApi.getOdontogram(patientId);
            setOdontogram(updated);
            setSelectedTooth(null);
        } catch (err: unknown) { setError(err instanceof Error ? err.message : "Error"); }
    }

    async function addRecord(e: React.FormEvent) {
        e.preventDefault();
        try {
            await dentalApi.createRecord(patientId, {
                treatment_id: recTreatment || undefined,
                tooth_number: recTooth ? parseInt(recTooth) : undefined,
                description: recDesc || undefined,
                cost: parseFloat(recCost) || 0,
            });
            setRecTreatment(""); setRecTooth(""); setRecCost(""); setRecDesc("");
            const [r, b] = await Promise.all([dentalApi.getRecords(patientId), dentalApi.getBalance(patientId)]);
            setRecords(r); setBalance(b);
        } catch (err: unknown) { setError(err instanceof Error ? err.message : "Error"); }
    }

    async function markPaid(id: string) {
        try {
            await dentalApi.markRecordPaid(id);
            const [r, b] = await Promise.all([dentalApi.getRecords(patientId), dentalApi.getBalance(patientId)]);
            setRecords(r); setBalance(b);
        } catch (err: unknown) { setError(err instanceof Error ? err.message : "Error"); }
    }

    async function addAppointment(e: React.FormEvent) {
        e.preventDefault();
        try {
            await dentalApi.createAppointment({
                patient_id: patientId,
                appointment_date: apptDate,
                start_time: apptStart,
                end_time: apptEnd || undefined,
                notes: apptNotes || undefined,
            });
            setApptDate(""); setApptStart(""); setApptEnd(""); setApptNotes("");
            setAppointments(await dentalApi.getAppointments({ patient_id: patientId }));
        } catch (err: unknown) { setError(err instanceof Error ? err.message : "Error"); }
    }

    // ─── Render Helpers ───────────────────────────────────────────────────────

    function getToothCondition(num: number) {
        return odontogram.find(e => e.tooth_number === num)?.condition || "sano";
    }

    function renderTooth(num: number) {
        const cond = getToothCondition(num);
        const info = CONDITIONS[cond] || CONDITIONS.sano;
        const isSelected = selectedTooth === num;
        return (
            <button key={num} onClick={() => { setSelectedTooth(num); setToothCondition(cond); }}
                className={`w-10 h-12 rounded-lg flex flex-col items-center justify-center text-xs font-mono border-2 transition-all
                    ${isSelected ? "border-white scale-110" : "border-slate-700 hover:border-slate-500"}`}>
                <div className={`w-4 h-4 rounded-full ${info.color} mb-0.5`} />
                <span className="text-slate-400">{num}</span>
            </button>
        );
    }

    // ─── Main Render ──────────────────────────────────────────────────────────

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-12 h-12 rounded-full border-4 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent animate-spin" /></div>;
    if (!patient) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-400">Paciente no encontrado</div>;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-300">
            <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-white font-semibold text-lg">{patient.first_name} {patient.last_name}</span>
                        {patient.phone && <span className="text-slate-500 text-sm">| {patient.phone}</span>}
                    </div>
                    <Button variant="outline" size="sm" className="bg-transparent border-slate-700 hover:bg-slate-800 text-white" onClick={() => router.push("/dashboard/patients")}>
                        <ArrowLeft size={16} className="mr-1" /> Pacientes
                    </Button>
                </div>
            </header>

            {/* Balance banner */}
            <div className="max-w-5xl mx-auto px-6 pt-6">
                <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
                        <p className="text-slate-500 text-xs uppercase">Total</p>
                        <p className="text-white text-xl font-bold">Bs {balance.total.toFixed(2)}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
                        <p className="text-slate-500 text-xs uppercase">Pagado</p>
                        <p className="text-green-400 text-xl font-bold">Bs {balance.paid.toFixed(2)}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
                        <p className="text-slate-500 text-xs uppercase">Debe</p>
                        <p className="text-red-400 text-xl font-bold">Bs {balance.pending.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-5xl mx-auto px-6 pt-6">
                <div className="flex gap-1 border-b border-slate-800 mb-6 overflow-x-auto">
                    {TABS.map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                                ${tab === t ? "border-blue-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-6 pb-12">
                {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

                {/* ─── HISTORIAL ──────────────────────────────────────────── */}
                {tab === "Historial" && (
                    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2"><FileText size={20} /> Historia Clínica</h3>
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <Label className="text-slate-400">Condiciones médicas</Label>
                                <textarea value={history.conditions} onChange={e => setHistory({ ...history, conditions: e.target.value })}
                                    className="w-full h-20 px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-white text-sm resize-none"
                                    placeholder="Diabetes, hipertensión, etc." />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-slate-400">Alergias</Label>
                                <textarea value={history.allergies} onChange={e => setHistory({ ...history, allergies: e.target.value })}
                                    className="w-full h-20 px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-white text-sm resize-none"
                                    placeholder="Penicilina, látex, etc." />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-slate-400">Medicamentos actuales</Label>
                                <textarea value={history.medications} onChange={e => setHistory({ ...history, medications: e.target.value })}
                                    className="w-full h-20 px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-white text-sm resize-none"
                                    placeholder="Medicamentos que toma el paciente..." />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-slate-400">Notas adicionales</Label>
                                <textarea value={history.notes} onChange={e => setHistory({ ...history, notes: e.target.value })}
                                    className="w-full h-20 px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-white text-sm resize-none" />
                            </div>
                        </div>
                        <Button onClick={saveHistory} disabled={savingHistory} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {savingHistory ? "Guardando..." : "Guardar Historial"}
                        </Button>
                    </div>
                )}

                {/* ─── ODONTOGRAMA ────────────────────────────────────────── */}
                {tab === "Odontograma" && (
                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Grid3X3 size={20} /> Odontograma (FDI)</h3>

                            {/* Upper arch */}
                            <div className="flex justify-center gap-1 mb-2">
                                <div className="flex gap-1">{UPPER_RIGHT.map(renderTooth)}</div>
                                <div className="w-px bg-slate-700 mx-1" />
                                <div className="flex gap-1">{UPPER_LEFT.map(renderTooth)}</div>
                            </div>
                            <div className="border-t border-slate-700 my-2" />
                            {/* Lower arch */}
                            <div className="flex justify-center gap-1">
                                <div className="flex gap-1">{LOWER_RIGHT.map(renderTooth)}</div>
                                <div className="w-px bg-slate-700 mx-1" />
                                <div className="flex gap-1">{LOWER_LEFT.map(renderTooth)}</div>
                            </div>

                            {/* Legend */}
                            <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-slate-800">
                                {Object.entries(CONDITIONS).map(([key, val]) => (
                                    <div key={key} className="flex items-center gap-1.5">
                                        <div className={`w-3 h-3 rounded-full ${val.color}`} />
                                        <span className="text-xs text-slate-400">{val.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Edit tooth condition */}
                        {selectedTooth !== null && (
                            <div className="p-6 rounded-2xl bg-slate-900 border border-blue-500/40 space-y-3">
                                <h4 className="text-white font-semibold">Diente #{selectedTooth}</h4>
                                <div className="space-y-1">
                                    <Label className="text-slate-400">Condición</Label>
                                    <select value={toothCondition} onChange={e => setToothCondition(e.target.value)}
                                        className="w-full h-10 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm">
                                        {Object.entries(CONDITIONS).map(([key, val]) => (
                                            <option key={key} value={key}>{val.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={saveToothCondition} className="bg-blue-600 hover:bg-blue-700 text-white">Guardar</Button>
                                    <Button variant="outline" onClick={() => setSelectedTooth(null)} className="bg-transparent border-slate-700 text-white">Cancelar</Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── TRATAMIENTOS REALIZADOS ─────────────────────────────── */}
                {tab === "Tratamientos" && (
                    <div className="space-y-6">
                        <form onSubmit={addRecord} className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Stethoscope size={20} /> Registrar Tratamiento</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-slate-400">Tratamiento</Label>
                                    <select value={recTreatment} onChange={e => {
                                        setRecTreatment(e.target.value);
                                        const t = catalog.find(c => c.id === e.target.value);
                                        if (t) { setRecCost(t.price.toString()); setRecDesc(t.name); }
                                    }}
                                        className="w-full h-10 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm">
                                        <option value="">Seleccionar del catálogo</option>
                                        {catalog.map(t => <option key={t.id} value={t.id}>{t.name} - Bs {t.price.toFixed(2)}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-slate-400">Pieza dental (FDI)</Label>
                                    <Input type="number" min="11" max="48" value={recTooth} onChange={e => setRecTooth(e.target.value)}
                                        className="bg-slate-800 border-slate-700 text-white" placeholder="Ej: 21" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-slate-400">Descripción</Label>
                                    <Input value={recDesc} onChange={e => setRecDesc(e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-slate-400">Costo (Bs) *</Label>
                                    <Input type="number" step="0.01" min="0" value={recCost} onChange={e => setRecCost(e.target.value)} required
                                        className="bg-slate-800 border-slate-700 text-white" />
                                </div>
                            </div>
                            <Button type="submit" disabled={!recCost} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">Registrar</Button>
                        </form>

                        <div>
                            <h3 className="text-lg font-bold text-white mb-3">Historial de Tratamientos ({records.length})</h3>
                            {records.length === 0 ? (
                                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-500">Sin tratamientos registrados.</div>
                            ) : (
                                <div className="space-y-2">
                                    {records.map(r => (
                                        <div key={r.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-white font-medium">{r.treatment_name || r.description || "Tratamiento"}</span>
                                                    {r.tooth_number && <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400">#{r.tooth_number}</span>}
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.status === "paid" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                                                        {r.status === "paid" ? "Pagado" : "Pendiente"}
                                                    </span>
                                                </div>
                                                <span className="text-sm text-slate-500">{r.treatment_date?.split("T")[0]}</span>
                                            </div>
                                            <div className="flex items-center gap-3 ml-4">
                                                <span className="text-emerald-400 font-semibold">Bs {r.cost.toFixed(2)}</span>
                                                {r.status === "pending" && (
                                                    <button onClick={() => markPaid(r.id)}
                                                        className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg transition-colors">
                                                        Cobrar
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ─── CITAS ──────────────────────────────────────────────── */}
                {tab === "Citas" && (
                    <div className="space-y-6">
                        <form onSubmit={addAppointment} className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Calendar size={20} /> Agendar Cita</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-slate-400">Fecha *</Label>
                                    <Input type="date" value={apptDate} onChange={e => setApptDate(e.target.value)} required className="bg-slate-800 border-slate-700 text-white" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-slate-400">Hora inicio *</Label>
                                    <Input type="time" value={apptStart} onChange={e => setApptStart(e.target.value)} required className="bg-slate-800 border-slate-700 text-white" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-slate-400">Hora fin</Label>
                                    <Input type="time" value={apptEnd} onChange={e => setApptEnd(e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
                                </div>
                                <div className="sm:col-span-3 space-y-1">
                                    <Label className="text-slate-400">Notas</Label>
                                    <Input value={apptNotes} onChange={e => setApptNotes(e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="Motivo..." />
                                </div>
                            </div>
                            <Button type="submit" disabled={!apptDate || !apptStart} className="mt-4 bg-purple-600 hover:bg-purple-700 text-white">Agendar</Button>
                        </form>

                        <div>
                            <h3 className="text-lg font-bold text-white mb-3">Citas del Paciente ({appointments.length})</h3>
                            {appointments.length === 0 ? (
                                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-500">Sin citas agendadas.</div>
                            ) : (
                                <div className="space-y-2">
                                    {appointments.map(a => (
                                        <div key={a.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-white font-medium">{a.appointment_date}</span>
                                                    <span className="text-slate-400">{a.start_time}{a.end_time ? ` - ${a.end_time}` : ""}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                        a.status === "completed" ? "bg-green-500/20 text-green-400" :
                                                        a.status === "cancelled" ? "bg-red-500/20 text-red-400" :
                                                        "bg-blue-500/20 text-blue-400"
                                                    }`}>
                                                        {a.status === "scheduled" ? "Programada" : a.status === "completed" ? "Completada" : "Cancelada"}
                                                    </span>
                                                </div>
                                                {a.notes && <p className="text-slate-500 text-sm mt-1">{a.notes}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ─── BALANCE ────────────────────────────────────────────── */}
                {tab === "Balance" && (
                    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><DollarSign size={20} /> Resumen Financiero</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="p-6 rounded-xl bg-slate-800 text-center">
                                <p className="text-slate-400 text-sm mb-1">Total acumulado</p>
                                <p className="text-3xl font-bold text-white">Bs {balance.total.toFixed(2)}</p>
                            </div>
                            <div className="p-6 rounded-xl bg-slate-800 text-center">
                                <p className="text-slate-400 text-sm mb-1">Total pagado</p>
                                <p className="text-3xl font-bold text-green-400">Bs {balance.paid.toFixed(2)}</p>
                            </div>
                            <div className="p-6 rounded-xl bg-slate-800 text-center">
                                <p className="text-slate-400 text-sm mb-1">Saldo pendiente</p>
                                <p className="text-3xl font-bold text-red-400">Bs {balance.pending.toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="mt-6">
                            <h4 className="text-white font-semibold mb-3">Detalle de tratamientos pendientes</h4>
                            {records.filter(r => r.status === "pending").length === 0 ? (
                                <p className="text-slate-500">No tiene deudas pendientes.</p>
                            ) : (
                                <div className="space-y-2">
                                    {records.filter(r => r.status === "pending").map(r => (
                                        <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-700">
                                            <span className="text-white">{r.treatment_name || r.description || "Tratamiento"}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-red-400 font-semibold">Bs {r.cost.toFixed(2)}</span>
                                                <button onClick={() => markPaid(r.id)}
                                                    className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg transition-colors">
                                                    Cobrar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
