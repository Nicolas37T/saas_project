"use client";
import React from "react";
import { Activity, Plus, Calendar, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// --- Types ---
export interface TreatmentItem {
  description: string;
  price: number;
  treatment_date: string;
  procedure_status: string;
}

export interface OdontogramItem {
  tooth_number: number;
  tooth_type: string;
  notes: string;
  treatments: TreatmentItem[];
}

interface Step2Props {
  odontogramItems: OdontogramItem[];
  setOdontogramItems: (items: OdontogramItem[]) => void;
  newTooth: OdontogramItem;
  setNewTooth: (tooth: OdontogramItem) => void;
  handleAddTooth: () => void;
  handleRemoveTooth: (index: number) => void;
}

const EMPTY_TREATMENT: TreatmentItem = {
  description: "",
  price: 0,
  treatment_date: new Date().toISOString().split("T")[0],
  procedure_status: "pendiente",
};

export const Step2Odontogram: React.FC<Step2Props> = ({
  odontogramItems,
  setOdontogramItems,
  newTooth,
  setNewTooth,
  handleAddTooth,
  handleRemoveTooth,
}) => {
  const [expandedTooth, setExpandedTooth] = React.useState<number | null>(null);

  const totalPrice = odontogramItems.reduce(
    (acc, tooth) => acc + tooth.treatments.reduce((ta, t) => ta + t.price, 0),
    0
  );

  const addTreatmentToTooth = (toothIndex: number) => {
    const updated = [...odontogramItems];
    updated[toothIndex].treatments.push({ ...EMPTY_TREATMENT });
    setOdontogramItems(updated);
  };

  const updateTreatmentField = (
    toothIndex: number,
    treatIndex: number,
    field: keyof TreatmentItem,
    value: string | number
  ) => {
    const updated = [...odontogramItems];
    (updated[toothIndex].treatments[treatIndex] as any)[field] = value;
    setOdontogramItems(updated);
  };

  const removeTreatment = (toothIndex: number, treatIndex: number) => {
    const updated = [...odontogramItems];
    updated[toothIndex].treatments.splice(treatIndex, 1);
    setOdontogramItems(updated);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto space-y-6">
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-amber-500"></div>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white text-lg">
            <Activity size={18} className="text-purple-400" />
            Odontograma y Tratamientos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Piezas
              </label>
              <div className="bg-slate-950/50 border border-slate-800 rounded-md h-10 flex items-center px-3 text-slate-300 font-bold">
                {odontogramItems.length} diente(s)
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Costo Total (Bs)
              </label>
              <div className="bg-slate-950/50 border border-slate-800 rounded-md h-10 flex items-center px-3 text-amber-400 font-bold">
                Bs. {totalPrice.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Add Tooth Form */}
          <div className="p-4 border border-slate-800 rounded-xl bg-slate-950/40 border-dashed">
            <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Plus size={16} className="text-slate-400" />
              Añadir Pieza Dental
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest">
                  N° Diente
                </label>
                <Input
                  type="number"
                  placeholder="1-32"
                  className="bg-slate-900 border-slate-800 text-white"
                  value={newTooth.tooth_number || ""}
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
                  <option value="adult">Permanente (Adulto)</option>
                  <option value="child">Temporal (Niño)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest">
                  Observaciones
                </label>
                <Input
                  placeholder="Notas del diente..."
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
              Añadir Pieza al Odontograma
            </Button>
          </div>

          {/* Registered Teeth */}
          {odontogramItems.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Piezas Registradas
              </h3>
              {odontogramItems.map((tooth, toothIdx) => (
                <div
                  key={toothIdx}
                  className="border border-slate-800/60 rounded-xl overflow-hidden"
                >
                  {/* Tooth Header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-950/60">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-sm font-black text-indigo-400">
                        {tooth.tooth_number}
                      </div>
                      <div>
                        <p className="text-slate-200 font-semibold text-sm">
                          Pieza #{tooth.tooth_number} —{" "}
                          {tooth.tooth_type === "adult" ? "Permanente" : "Temporal"}
                        </p>
                        {tooth.notes && (
                          <p className="text-slate-500 text-[11px]">{tooth.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold text-sm">
                        Bs.{" "}
                        {tooth.treatments.reduce((a, t) => a + t.price, 0).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedTooth(expandedTooth === toothIdx ? null : toothIdx)
                        }
                        className="text-slate-500 hover:text-white transition-colors p-1"
                      >
                        {expandedTooth === toothIdx ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveTooth(toothIdx)}
                        className="text-slate-600 hover:text-rose-500 transition-colors p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Treatments for this tooth */}
                  {expandedTooth === toothIdx && (
                    <div className="px-4 pb-4 pt-2 bg-slate-900/30 space-y-3">
                      {tooth.treatments.length === 0 && (
                        <p className="text-slate-600 text-xs italic text-center py-2">
                          No hay tratamientos para esta pieza aún.
                        </p>
                      )}
                      {tooth.treatments.map((treatment, treatIdx) => (
                        <div
                          key={treatIdx}
                          className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-3 bg-slate-950/50 rounded-lg border border-slate-800/50 items-end"
                        >
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-600 uppercase tracking-widest">
                              Procedimiento
                            </label>
                            <Input
                              placeholder="Ej: Endodoncia"
                              className="bg-slate-900 border-slate-800 text-white h-8 text-xs"
                              value={treatment.description}
                              onChange={(e) =>
                                updateTreatmentField(
                                  toothIdx,
                                  treatIdx,
                                  "description",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-600 uppercase tracking-widest">
                              Precio (Bs)
                            </label>
                            <Input
                              type="number"
                              placeholder="0"
                              className="bg-slate-900 border-slate-800 text-amber-400 font-bold h-8 text-xs"
                              value={treatment.price || ""}
                              onChange={(e) =>
                                updateTreatmentField(
                                  toothIdx,
                                  treatIdx,
                                  "price",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-600 uppercase tracking-widest">
                              Fecha
                            </label>
                            <Input
                              type="date"
                              className="bg-slate-900 border-slate-800 text-white h-8 text-xs"
                              value={treatment.treatment_date}
                              style={{ colorScheme: "dark" }}
                              onChange={(e) =>
                                updateTreatmentField(
                                  toothIdx,
                                  treatIdx,
                                  "treatment_date",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="flex items-end gap-2">
                            <div className="flex-1 space-y-1">
                              <label className="text-[10px] text-slate-600 uppercase tracking-widest">
                                Estado
                              </label>
                              <select
                                className="w-full h-8 rounded-md bg-slate-900 border border-slate-800 text-white text-xs px-2 outline-none"
                                value={treatment.procedure_status}
                                onChange={(e) =>
                                  updateTreatmentField(
                                    toothIdx,
                                    treatIdx,
                                    "procedure_status",
                                    e.target.value
                                  )
                                }
                              >
                                <option value="pendiente">Pendiente</option>
                                <option value="en_progreso">En progreso</option>
                                <option value="completado">Completado</option>
                              </select>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeTreatment(toothIdx, treatIdx)}
                              className="text-slate-500 hover:text-rose-500 transition-colors p-1.5 mb-0.5"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        onClick={() => addTreatmentToTooth(toothIdx)}
                        className="w-full h-8 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/30 text-xs font-medium"
                      >
                        <Plus size={14} className="mr-1.5" />
                        Añadir Tratamiento a esta Pieza
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
