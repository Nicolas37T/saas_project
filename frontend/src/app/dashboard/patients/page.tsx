"use client";
import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  User,
  FileText,
  Phone,
  MoreVertical,
} from "lucide-react";
import { tenantApi, Patient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal state for adding patient
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const data = await tenantApi.getPatients();
      setPatients(data);
    } catch (error) {
      console.error("Failed to load patients", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await tenantApi.createPatient(newPatient);
      setIsAddModalOpen(false);
      setNewPatient({ first_name: "", last_name: "", phone: "", address: "" });
      loadPatients(); // refresh list
    } catch (error) {
      console.error("Error creating patient", error);
    }
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.first_name.toLowerCase().includes(search.toLowerCase()) ||
      p.last_name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
            Pacientes
          </h1>
          <p className="text-slate-400">
            Gestiona la información y el historial clínico de tus pacientes.
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all"
        >
          <Plus className="mr-2" size={18} /> Nuevo Paciente
        </Button>
      </div>

      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                size={18}
              />
              <Input
                placeholder="Buscar paciente por nombre..."
                className="pl-10 bg-slate-950/50 border-slate-800 text-slate-200 placeholder:text-slate-500 focus-visible:ring-blue-500/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent"></div>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="text-slate-400" size={32} />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                No se encontraron pacientes
              </h3>
              <p className="text-slate-400">
                Comienza agregando tu primer paciente al sistema.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="group bg-slate-950/50 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-semibold text-lg">
                        {patient.first_name[0]}
                        {patient.last_name[0]}
                      </div>
                      <div>
                        <h4 className="text-white font-medium truncate max-w-[150px]">
                          {patient.first_name} {patient.last_name}
                        </h4>
                        <span className="text-xs text-slate-500 capitalize">
                          {patient.status ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </div>
                    <button className="text-slate-500 hover:text-white transition-colors">
                      <MoreVertical size={18} />
                    </button>
                  </div>

                  <div className="space-y-2 mt-auto">
                    {patient.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Phone size={14} className="text-slate-500" />
                        <span>{patient.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <FileText size={14} className="text-slate-500" />
                      <span>Historia {patient.id.substring(0, 6)}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/50 flex justify-between items-center">
                    <div className="text-xs text-slate-500">
                      Unido el{" "}
                      {new Date(patient.created_at).toLocaleDateString()}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-8 px-3"
                    >
                      Ver Perfil
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Patient Modal (Simplified inline for now without dialog components) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-2xl">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-6">
                Nuevo Paciente
              </h2>
              <form onSubmit={handleCreatePatient} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Nombre
                    </label>
                    <Input
                      required
                      value={newPatient.first_name}
                      onChange={(e) =>
                        setNewPatient({
                          ...newPatient,
                          first_name: e.target.value,
                        })
                      }
                      className="bg-slate-950/50 border-slate-800 text-white focus-visible:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Apellidos
                    </label>
                    <Input
                      required
                      value={newPatient.last_name}
                      onChange={(e) =>
                        setNewPatient({
                          ...newPatient,
                          last_name: e.target.value,
                        })
                      }
                      className="bg-slate-950/50 border-slate-800 text-white focus-visible:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    Teléfono
                  </label>
                  <Input
                    type="tel"
                    value={newPatient.phone}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, phone: e.target.value })
                    }
                    className="bg-slate-950/50 border-slate-800 text-white focus-visible:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    Dirección
                  </label>
                  <Input
                    value={newPatient.address}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, address: e.target.value })
                    }
                    className="bg-slate-950/50 border-slate-800 text-white focus-visible:ring-blue-500"
                  />
                </div>
                <div className="flex gap-3 justify-end mt-8">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsAddModalOpen(false)}
                    className="text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Crear Paciente
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
