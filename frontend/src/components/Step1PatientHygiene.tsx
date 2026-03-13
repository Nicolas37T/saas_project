"use client";
import React from "react";
import {
  Users,
  User,
  ShieldCheck,
  Search,
  X,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Patient } from "@/lib/api";

interface Step1Props {
  mode: "create" | "edit";
  patients: Patient[];
  selectedPatientId: string;
  setSelectedPatientId: (id: string) => void;
  patientHasHistory: boolean;
  isPatientMenuOpen: boolean;
  setIsPatientMenuOpen: (open: boolean) => void;
  searchPatient: string;
  setSearchPatient: (search: string) => void;
  formData: any;
  setFormData: (data: any) => void;
  loadingPatients?: boolean;
}

export const Step1PatientHygiene: React.FC<Step1Props> = ({
  mode,
  patients,
  selectedPatientId,
  setSelectedPatientId,
  patientHasHistory,
  isPatientMenuOpen,
  setIsPatientMenuOpen,
  searchPatient,
  setSearchPatient,
  formData,
  setFormData,
  loadingPatients,
}) => {
  const filteredPatients = patients.filter((p) =>
    (p.first_name + " " + p.last_name)
      .toLowerCase()
      .includes(searchPatient.toLowerCase()),
  );

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* SECCIÓN PACIENTE */}
      <div className="lg:col-span-1">
        <Card
          className={`bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-xl h-full transition-all duration-300 ${isPatientMenuOpen ? "relative z-[60]" : "relative z-0"}`}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-white text-lg">
              <Users size={18} className="text-blue-400" />
              Paciente
            </CardTitle>
            <CardDescription>
              {mode === "create"
                ? "Busca y selecciona un paciente"
                : "Detalles del paciente seleccionado"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {mode === "edit" ? (
              <div className="flex items-center gap-3 p-4 rounded-xl border bg-blue-600/10 border-blue-500/50 text-white">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                  <User size={18} />
                </div>
                <div className="truncate">
                  <p className="text-[10px] uppercase font-bold tracking-wider opacity-50">
                    Paciente Seleccionado
                  </p>
                  <p className="font-semibold truncate">
                    {selectedPatient?.first_name} {selectedPatient?.last_name}
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div
                  onClick={() => setIsPatientMenuOpen(!isPatientMenuOpen)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                    selectedPatientId
                      ? "bg-blue-600/10 border-blue-500/50 text-white"
                      : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div
                      className={`p-2 rounded-lg ${selectedPatientId ? "bg-blue-500/20 text-blue-400" : "bg-slate-900 text-slate-500"}`}
                    >
                      <User size={18} />
                    </div>
                    <div className="truncate">
                      <p className="text-[10px] uppercase font-bold tracking-wider opacity-50">
                        Paciente
                      </p>
                      <p className="font-semibold truncate">
                        {selectedPatientId
                          ? `${selectedPatient?.first_name} ${selectedPatient?.last_name}`
                          : "Seleccionar paciente..."}
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    size={20}
                    className={`text-slate-500 transition-transform duration-300 ${isPatientMenuOpen ? "rotate-180" : ""}`}
                  />
                </div>

                {isPatientMenuOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-3 border-b border-slate-800 bg-slate-950/50 flex items-center gap-2">
                      <Search size={16} className="text-slate-500" />
                      <input
                        autoFocus
                        placeholder="Buscar por nombre..."
                        className="bg-transparent border-none text-white text-sm focus:ring-0 w-full outline-none"
                        value={searchPatient}
                        onChange={(e) => setSearchPatient(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                      {loadingPatients ? (
                        <div className="p-6 text-center text-slate-500 text-sm italic">
                          Cargando...
                        </div>
                      ) : filteredPatients.length === 0 ? (
                        <div className="p-6 text-center text-slate-500 text-sm italic">
                          No hay resultados
                        </div>
                      ) : (
                        filteredPatients.map((p) => (
                          <div
                            key={p.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPatientId(p.id);
                              setIsPatientMenuOpen(false);
                            }}
                            className={`p-3 border-b border-slate-800 flex items-center gap-3 cursor-pointer transition-colors ${selectedPatientId === p.id ? "bg-blue-600/10" : "hover:bg-slate-800"}`}
                          >
                            <div className="truncate">
                              <p
                                className={`text-sm font-medium ${selectedPatientId === p.id ? "text-blue-400" : "text-slate-200"}`}
                              >
                                {p.first_name} {p.last_name}
                              </p>
                              <p className="text-[10px] text-slate-500 uppercase tracking-tighter">
                                {p.phone || "Sin teléfono"}
                              </p>
                            </div>
                            {selectedPatientId === p.id && (
                              <CheckCircle2
                                size={16}
                                className="text-blue-400 ml-auto"
                              />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {mode === "create" && selectedPatientId && patientHasHistory && (
              <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/50 animate-in fade-in duration-300">
                <p className="text-amber-500 text-xs font-bold uppercase tracking-widest text-center">
                  Aviso del Sistema
                </p>
                <p className="text-slate-300 text-xs mt-1 text-center">
                  Este paciente ya cuenta con un historial médico registrado.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SECCIÓN HIGIENE */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-xl">
          <CardHeader className="pb-3 text-white">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck size={18} className="text-emerald-400" />
              Higiene Bucal
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() =>
                    setFormData({
                      ...formData,
                      uses_toothbrush: !formData.uses_toothbrush,
                    })
                  }
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${formData.uses_toothbrush ? "bg-blue-500/20 border-blue-500 text-blue-100 shadow-inner" : "bg-slate-950/40 border-slate-800 text-slate-500"}`}
                >
                  <span className="text-[10px] font-bold uppercase mb-1 text-center">
                    ¿Usa Cepillo?
                  </span>
                  <span className="text-lg font-bold">
                    {formData.uses_toothbrush ? "SÍ" : "NO"}
                  </span>
                </div>
                <div
                  onClick={() =>
                    setFormData({
                      ...formData,
                      uses_dentifrice: !formData.uses_dentifrice,
                    })
                  }
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${formData.uses_dentifrice ? "bg-blue-500/20 border-blue-500 text-blue-100 shadow-inner" : "bg-slate-950/40 border-slate-800 text-slate-500"}`}
                >
                  <span className="text-[10px] font-bold uppercase mb-1 text-center">
                    ¿Dentífrico?
                  </span>
                  <span className="text-lg font-bold">
                    {formData.uses_dentifrice ? "SÍ" : "NO"}
                  </span>
                </div>
              </div>

              <div
                onClick={() =>
                  setFormData({ ...formData, uses_floss: !formData.uses_floss })
                }
                className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${formData.uses_floss ? "bg-indigo-500/20 border-indigo-500 text-indigo-100" : "bg-slate-950/20 border-slate-800 text-slate-500"}`}
              >
                <span className="text-sm font-bold">¿Usa hilo dental?</span>
                <div
                  className={`w-10 h-6 rounded-full relative transition-colors ${formData.uses_floss ? "bg-indigo-600" : "bg-slate-700"}`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.uses_floss ? "left-5" : "left-1"}`}
                  ></div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Frecuencia de cepillado
                </label>
                <Input
                  className="bg-slate-950/50 border-slate-800 text-white h-11"
                  placeholder="Ej: 3 "
                  value={formData.brushing_frequency}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      brushing_frequency: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Técnica de cepillado
                </label>
                <Input
                  className="bg-slate-950/50 border-slate-800 text-white h-11"
                  placeholder="Ej: Bass, Circular..."
                  value={formData.brushing_technique}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      brushing_technique: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
