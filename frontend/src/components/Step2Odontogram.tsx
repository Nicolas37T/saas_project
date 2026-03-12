"use client";
import React from "react";
import { Activity, Plus, Calendar, Clock, Edit3, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Step2Props {
  formData: any;
  odontogramItems: any[];
  newTooth: any;
  setNewTooth: (tooth: any) => void;
  handleAddTooth: () => void;
  handleEditTooth: (index: number) => void;
  handleRemoveTooth: (index: number) => void;
}

export const Step2Odontogram: React.FC<Step2Props> = ({
  formData,
  odontogramItems,
  newTooth,
  setNewTooth,
  handleAddTooth,
  handleEditTooth,
  handleRemoveTooth,
}) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto space-y-6">
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-amber-500"></div>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white text-lg">
            <Activity size={18} className="text-purple-400" />
            Tratamiento y Odontogram
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Costo Total Historial (Bs)
                </label>
                <Input
                  type="number"
                  disabled
                  className="bg-slate-950/50 border-slate-800 text-amber-400 font-bold cursor-not-allowed"
                  value={formData.price}
                />
                <p className="text-[10px] text-slate-600">
                  Suma automática de todos los tratamientos por pieza.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 border border-slate-800 rounded-xl bg-slate-950/40 border-dashed">
            <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Plus size={16} className="text-slate-400" />
              Añadir Tratamientos por Pieza
            </h3>

            <div className="space-y-4 mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest">
                    Nombre del Tratamiento
                  </label>
                  <Input
                    placeholder="Ej: Endodoncia, Limpieza..."
                    className="bg-slate-900 border-slate-800 text-white"
                    value={newTooth.description}
                    onChange={(e) =>
                      setNewTooth({ ...newTooth, description: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest">
                    N° Diente
                  </label>
                  <Input
                    type="number"
                    className="bg-slate-900 border-slate-800 text-white"
                    value={newTooth.tooth_number}
                    onChange={(e) =>
                      setNewTooth({
                        ...newTooth,
                        tooth_number: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest">
                    Tipo de Pieza
                  </label>
                  <select
                    className="w-full h-10 rounded-md bg-slate-900 border border-slate-800 text-white text-sm px-3 appearance-none focus:ring-1 focus:ring-blue-500 outline-none"
                    value={newTooth.tooth_type}
                    onChange={(e) =>
                      setNewTooth({ ...newTooth, tooth_type: e.target.value })
                    }
                  >
                    <option value="adult">Adulto</option>
                    <option value="child">Niño</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest">
                    Precio (Bs)
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    className="bg-slate-900 border-slate-800 text-amber-400 font-bold"
                    value={newTooth.price || ""}
                    onChange={(e) =>
                      setNewTooth({
                        ...newTooth,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest">
                    Fecha
                  </label>
                  <Input
                    type="date"
                    className="bg-slate-900 border-slate-800 text-white"
                    value={newTooth.treatment_date}
                    style={{ colorScheme: "dark" }}
                    onChange={(e) =>
                      setNewTooth({
                        ...newTooth,
                        treatment_date: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest">
                    Duración (min)
                  </label>
                  <Input
                    type="number"
                    className="bg-slate-900 border-slate-800 text-white"
                    value={newTooth.duration_minutes}
                    onChange={(e) =>
                      setNewTooth({
                        ...newTooth,
                        duration_minutes: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest">
                    Observaciones
                  </label>
                  <Input
                    placeholder="Notas..."
                    className="bg-slate-900 border-slate-800 text-white"
                    value={newTooth.notes}
                    onChange={(e) =>
                      setNewTooth({ ...newTooth, notes: e.target.value })
                    }
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={handleAddTooth}
                className="w-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 font-medium h-10"
              >
                <Plus size={16} className="mr-2" />
                Añadir Tratamiento de Pieza
              </Button>
            </div>

            {odontogramItems.length > 0 && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {odontogramItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-2.5 bg-slate-950/60 border border-slate-800/50 rounded-lg text-sm group hover:border-slate-700 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 shrink-0 rounded bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                        {item.tooth_number}
                      </div>
                      <div className="min-w-0">
                        <p className="text-slate-100 font-semibold leading-none capitalize truncate">
                          Pieza {item.tooth_number} —{" "}
                          {item.description || "Tratamiento"}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 mt-1.5">
                          <span className="flex items-center gap-1 whitespace-nowrap">
                            <Calendar size={10} /> {item.treatment_date}
                          </span>
                          <span className="flex items-center gap-1 whitespace-nowrap">
                            <Clock size={10} /> {item.duration_minutes}min
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-amber-400 font-bold text-sm">
                        Bs {item.price || 0}
                      </span>
                      <div className="flex bg-slate-900/50 border border-slate-800 rounded-md overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleEditTooth(idx)}
                          className="text-slate-500 hover:text-blue-400 hover:bg-slate-800 transition-colors p-1.5 border-r border-slate-800"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveTooth(idx)}
                          className="text-slate-500 hover:text-rose-500 hover:bg-slate-800 transition-colors p-1.5"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
