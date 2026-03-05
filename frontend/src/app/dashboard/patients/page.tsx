"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus, Search, ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dentalApi, DentalPatient } from "@/lib/api";

export default function PatientsPage() {
    const router = useRouter();
    const [patients, setPatients] = useState<DentalPatient[]>([]);
    const [filtered, setFiltered] = useState<DentalPatient[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Form state
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [birthdate, setBirthdate] = useState("");
    const [address, setAddress] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("user_role");
        if (!token || role !== "owner") { router.push("/login"); return; }
        loadPatients();
    }, [router]);

    useEffect(() => {
        const q = search.toLowerCase();
        setFiltered(patients.filter(p =>
            `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
            (p.phone || "").includes(q) ||
            (p.email || "").toLowerCase().includes(q)
        ));
    }, [search, patients]);

    async function loadPatients() {
        try {
            const data = await dentalApi.getPatients();
            setPatients(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error al cargar pacientes");
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setError("");
        try {
            await dentalApi.createPatient({
                first_name: firstName,
                last_name: lastName,
                phone: phone || undefined,
                email: email || undefined,
                birthdate: birthdate || undefined,
                address: address || undefined,
            });
            setFirstName(""); setLastName(""); setPhone(""); setEmail(""); setBirthdate(""); setAddress("");
            setShowForm(false);
            await loadPatients();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error al crear paciente");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("¿Eliminar este paciente y todos sus registros?")) return;
        try {
            await dentalApi.deletePatient(id);
            setPatients(patients.filter(p => p.id !== id));
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error al eliminar");
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-300">
            <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white"><Users size={18} /></div>
                        <span className="text-white font-semibold text-lg">Pacientes</span>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="bg-transparent border-slate-700 hover:bg-slate-800 text-white" onClick={() => router.push("/dashboard")}>
                            <ArrowLeft size={16} className="mr-1" /> Dashboard
                        </Button>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowForm(!showForm)}>
                            <Plus size={16} className="mr-1" /> Nuevo Paciente
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
                {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

                {showForm && (
                    <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                        <h3 className="text-lg font-bold text-white">Registrar Paciente</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-slate-400">Nombre *</Label>
                                <Input value={firstName} onChange={e => setFirstName(e.target.value)} required className="bg-slate-800 border-slate-700 text-white" placeholder="Nombre" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-slate-400">Apellido *</Label>
                                <Input value={lastName} onChange={e => setLastName(e.target.value)} required className="bg-slate-800 border-slate-700 text-white" placeholder="Apellido" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-slate-400">Teléfono</Label>
                                <Input value={phone} onChange={e => setPhone(e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="(+591) ..." />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-slate-400">Email</Label>
                                <Input value={email} onChange={e => setEmail(e.target.value)} type="email" className="bg-slate-800 border-slate-700 text-white" placeholder="correo@ejemplo.com" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-slate-400">Fecha de Nacimiento</Label>
                                <Input value={birthdate} onChange={e => setBirthdate(e.target.value)} type="date" className="bg-slate-800 border-slate-700 text-white" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-slate-400">Dirección</Label>
                                <Input value={address} onChange={e => setAddress(e.target.value)} className="bg-slate-800 border-slate-700 text-white" placeholder="Dirección" />
                            </div>
                        </div>
                        <Button type="submit" disabled={submitting || !firstName || !lastName} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {submitting ? "Guardando..." : "Guardar Paciente"}
                        </Button>
                    </form>
                )}

                {/* Search */}
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <Input value={search} onChange={e => setSearch(e.target.value)} className="bg-slate-900 border-slate-800 text-white pl-10" placeholder="Buscar paciente por nombre, teléfono o email..." />
                </div>

                {/* Patients list */}
                <div className="space-y-2">
                    {filtered.length === 0 ? (
                        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-500">
                            {patients.length === 0 ? "No hay pacientes registrados aún." : "No se encontraron resultados."}
                        </div>
                    ) : (
                        filtered.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition-colors cursor-pointer"
                                 onClick={() => router.push(`/dashboard/patients/${p.id}`)}>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-white font-medium">{p.first_name} {p.last_name}</h3>
                                    <div className="flex gap-4 text-sm text-slate-500 mt-1">
                                        {p.phone && <span>{p.phone}</span>}
                                        {p.email && <span>{p.email}</span>}
                                        {p.birthdate && <span>Nac: {p.birthdate}</span>}
                                    </div>
                                </div>
                                <button onClick={e => { e.stopPropagation(); handleDelete(p.id); }} className="text-slate-500 hover:text-red-400 transition-colors ml-4" title="Eliminar">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
