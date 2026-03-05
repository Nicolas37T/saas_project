"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Plus, ArrowLeft, Check, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dentalApi, DentalAppointment, DentalPatient } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
    scheduled: "bg-blue-500/20 text-blue-400",
    completed: "bg-green-500/20 text-green-400",
    cancelled: "bg-red-500/20 text-red-400",
};
const STATUS_LABELS: Record<string, string> = { scheduled: "Programada", completed: "Completada", cancelled: "Cancelada" };

export default function AppointmentsPage() {
    const router = useRouter();
    const [appointments, setAppointments] = useState<DentalAppointment[]>([]);
    const [patients, setPatients] = useState<DentalPatient[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [filterDate, setFilterDate] = useState("");

    const [patientId, setPatientId] = useState("");
    const [apptDate, setApptDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [notes, setNotes] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("user_role");
        if (!token || role !== "owner") { router.push("/login"); return; }
        load();
    }, [router]);

    async function load() {
        try {
            const [a, p] = await Promise.all([
                dentalApi.getAppointments(filterDate ? { fecha: filterDate } : undefined),
                dentalApi.getPatients(),
            ]);
            setAppointments(a);
            setPatients(p);
        } catch (err: unknown) { setError(err instanceof Error ? err.message : "Error"); }
        finally { setLoading(false); }
    }

    useEffect(() => {
        if (!loading) {
            dentalApi.getAppointments(filterDate ? { fecha: filterDate } : undefined)
                .then(setAppointments)
                .catch(() => {});
        }
    }, [filterDate, loading]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true); setError("");
        try {
            await dentalApi.createAppointment({
                patient_id: patientId,
                appointment_date: apptDate,
                start_time: startTime,
                end_time: endTime || undefined,
                notes: notes || undefined,
            });
            setPatientId(""); setApptDate(""); setStartTime(""); setEndTime(""); setNotes("");
            setShowForm(false);
            await load();
        } catch (err: unknown) { setError(err instanceof Error ? err.message : "Error"); }
        finally { setSubmitting(false); }
    }

    async function updateStatus(id: string, status: string) {
        try {
            await dentalApi.updateAppointment(id, { status });
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
        } catch (err: unknown) { setError(err instanceof Error ? err.message : "Error"); }
    }

    async function handleDelete(id: string) {
        try { await dentalApi.deleteAppointment(id); setAppointments(prev => prev.filter(a => a.id !== id)); }
        catch (err: unknown) { setError(err instanceof Error ? err.message : "Error"); }
    }

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-12 h-12 rounded-full border-4 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-300">
            <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white"><Calendar size={18} /></div>
                        <span className="text-white font-semibold text-lg">Citas</span>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="bg-transparent border-slate-700 hover:bg-slate-800 text-white" onClick={() => router.push("/dashboard")}>
                            <ArrowLeft size={16} className="mr-1" /> Dashboard
                        </Button>
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => setShowForm(!showForm)}>
                            <Plus size={16} className="mr-1" /> Nueva Cita
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
                {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

                {showForm && (
                    <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                        <h3 className="text-lg font-bold text-white">Agendar Cita</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-slate-400">Paciente *</Label>
                                <select value={patientId} onChange={e => setPatientId(e.target.value)} required
                                    className="w-full h-10 px-3 rounded-md bg-slate-800 border border-slate-700 text-white text-sm">
                                    <option value="">Seleccionar paciente</option>
                                    {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-slate-400">Fecha *</Label>
                                <Input type="date" value={apptDate} onChange={e => setApptDate(e.target.value)} required className="bg-slate-800 border-slate-700 text-white" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-slate-400">Hora inicio *</Label>
                                <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required className="bg-slate-800 border-slate-700 text-white" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-slate-400">Hora fin</Label>
                                <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
                            </div>
                            <div className="sm:col-span-2 space-y-1">
                                <Label className="text-slate-400">Notas</Label>
                                <Input value={notes} onChange={e => setNotes(e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="Motivo de la cita..." />
                            </div>
                        </div>
                        <Button type="submit" disabled={submitting || !patientId || !apptDate || !startTime} className="bg-purple-600 hover:bg-purple-700 text-white">
                            {submitting ? "Guardando..." : "Agendar Cita"}
                        </Button>
                    </form>
                )}

                {/* Filter */}
                <div className="flex items-center gap-3">
                    <Label className="text-slate-400 whitespace-nowrap">Filtrar por fecha:</Label>
                    <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="bg-slate-900 border-slate-800 text-white max-w-xs" />
                    {filterDate && <button onClick={() => setFilterDate("")} className="text-slate-500 hover:text-white text-sm">Limpiar</button>}
                </div>

                {/* List */}
                {appointments.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-500">No hay citas{filterDate ? " para esta fecha" : ""}.</div>
                ) : (
                    <div className="space-y-2">
                        {appointments.map(a => (
                            <div key={a.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-white font-medium">{a.patient_name}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[a.status] || "bg-slate-700 text-slate-300"}`}>
                                            {STATUS_LABELS[a.status] || a.status}
                                        </span>
                                    </div>
                                    <div className="flex gap-4 text-sm text-slate-500 mt-1">
                                        <span>{a.appointment_date}</span>
                                        <span>{a.start_time}{a.end_time ? ` - ${a.end_time}` : ""}</span>
                                        {a.notes && <span className="truncate max-w-[200px]">{a.notes}</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    {a.status === "scheduled" && (
                                        <>
                                            <button onClick={() => updateStatus(a.id, "completed")} className="text-slate-500 hover:text-green-400 transition-colors" title="Completar">
                                                <Check size={18} />
                                            </button>
                                            <button onClick={() => updateStatus(a.id, "cancelled")} className="text-slate-500 hover:text-red-400 transition-colors" title="Cancelar">
                                                <X size={18} />
                                            </button>
                                        </>
                                    )}
                                    <button onClick={() => handleDelete(a.id)} className="text-slate-500 hover:text-red-400 transition-colors" title="Eliminar">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
