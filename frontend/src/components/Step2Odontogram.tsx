"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Activity, Plus, Trash2, ChevronDown, ChevronUp, Stethoscope, DollarSign, Hash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// --- Types ---
export interface TreatmentItem {
  id?: string;
  description: string;
  price: number;
  treatment_date: string;
  procedure_status: string;
  is_readonly?: boolean;
  created_by?: string;
}

export interface OdontogramItem {
  tooth_number: number;
  tooth_type: string;
  notes: string;
  treatments: TreatmentItem[];
}

export interface CatalogOption {
  id: string;
  name: string;
  default_price: number | null;
}

export interface NewToothWithTreatment extends OdontogramItem {
  first_treatment_description: string;
  first_treatment_price: number;
  first_treatment_date: string;
  first_treatment_status: string;
}

interface Step2Props {
  odontogramItems: OdontogramItem[];
  setOdontogramItems: (items: OdontogramItem[]) => void;
  newTooth: NewToothWithTreatment;
  setNewTooth: (tooth: NewToothWithTreatment) => void;
  handleAddTooth: () => void;
  handleRemoveTooth: (index: number) => void;
  treatmentCatalog?: CatalogOption[];
}

// --- TreatmentAutocomplete component ---
interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (item: CatalogOption) => void;
  catalog: CatalogOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const TreatmentAutocomplete: React.FC<AutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  catalog,
  placeholder = "Ej: Endodoncia, Limpieza...",
  className = "",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = value.trim()
    ? catalog.filter((c) =>
        c.name.toLowerCase().includes(value.toLowerCase())
      )
    : catalog;

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Reset highlight when filtered changes
  useEffect(() => {
    setHighlightIdx(-1);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filtered.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === "Enter" && highlightIdx >= 0) {
      e.preventDefault();
      onSelect(filtered[highlightIdx]);
      setIsOpen(false);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        placeholder={placeholder}
        className={className}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {isOpen && filtered.length > 0 && !disabled && (
        <div
          ref={listRef}
          className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-popover border border-border rounded-lg shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {filtered.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 transition-colors ${
                idx === highlightIdx
                  ? "bg-primary/15 text-primary"
                  : "hover:bg-muted/70 text-foreground"
              }`}
              onMouseEnter={() => setHighlightIdx(idx)}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(item);
                setIsOpen(false);
              }}
            >
              <span className="flex items-center gap-2 min-w-0">
                <Stethoscope size={12} className="text-primary/60 flex-shrink-0" />
                <span className="truncate font-medium">{item.name}</span>
              </span>
              {item.default_price != null && item.default_price > 0 && (
                <span className="text-amber-500 text-xs font-bold flex-shrink-0">
                  Bs. {item.default_price}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const EMPTY_TREATMENT: TreatmentItem = {
  description: "",
  price: 0,
  treatment_date: new Date().toISOString().split("T")[0],
  procedure_status: "pendiente",
};

export const DEFAULT_NEW_TOOTH: NewToothWithTreatment = {
  tooth_number: 1,
  tooth_type: "adult",
  notes: "",
  treatments: [],
  first_treatment_description: "",
  first_treatment_price: 0,
  first_treatment_date: new Date().toISOString().split("T")[0],
  first_treatment_status: "pendiente",
};

export const Step2Odontogram: React.FC<Step2Props> = ({
  odontogramItems,
  setOdontogramItems,
  newTooth,
  setNewTooth,
  handleAddTooth,
  handleRemoveTooth,
  treatmentCatalog = [],
}) => {
  // All teeth expanded by default — collapsed set tracks which ones user manually collapsed
  const [collapsedTeeth, setCollapsedTeeth] = React.useState<Set<number>>(new Set());

  const getToothError = (num: number | null | undefined): string | null => {
    if (!num) return null;
    if (num <= 0) {
      return "El número de diente debe ser positivo";
    }
    return null;
  };

  const getPriceError = (price: number | null | undefined): string | null => {
    if (price !== null && price !== undefined && price < 0) return "No puede ser negativo";
    return null;
  };

  const totalPrice = odontogramItems.reduce(
    (acc, tooth) => acc + tooth.treatments.reduce((ta, t) => ta + t.price, 0),
    0
  );

  const totalTreatments = odontogramItems.reduce(
    (acc, tooth) => acc + tooth.treatments.length,
    0
  );

  const toggleTooth = (index: number) => {
    setCollapsedTeeth((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

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

  const toothError = getToothError(newTooth.tooth_number);
  const priceError = getPriceError(newTooth.first_treatment_price);
  const canAddTooth = newTooth.tooth_number > 0 && newTooth.first_treatment_description.trim() !== "" && !toothError && !priceError;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      <Card className="bg-card border-border backdrop-blur-sm shadow-xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-purple-500 to-amber-500"></div>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Activity size={18} className="text-primary" />
            Odontograma y Tratamientos
          </CardTitle>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            Añade cada pieza dental junto con su tratamiento y precio en un solo paso.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="bg-muted/50 border border-border rounded-xl p-2 sm:p-3 text-center">
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-1">
                <Hash size={12} className="text-primary" />
                <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Piezas
                </span>
              </div>
              <p className="font-bold text-sm sm:text-lg">{odontogramItems.length}</p>
            </div>
            <div className="bg-muted/50 border border-border rounded-xl p-2 sm:p-3 text-center">
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-1">
                <Stethoscope size={12} className="text-purple-500" />
                <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Tratamientos
                </span>
              </div>
              <p className="font-bold text-sm sm:text-lg">{totalTreatments}</p>
            </div>
            <div className="bg-muted/50 border border-border rounded-xl p-2 sm:p-3 text-center">
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-1">
                <DollarSign size={12} className="text-amber-500" />
                <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Costo Total
                </span>
              </div>
              <p className="text-amber-500 font-bold text-sm sm:text-lg">Bs. {totalPrice.toFixed(2)}</p>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════ */}
          {/* UNIFIED: Add Tooth + Treatment Form                       */}
          {/* ══════════════════════════════════════════════════════════ */}
          <div className="p-3 sm:p-5 border-2 border-dashed border-primary/30 rounded-2xl bg-gradient-to-b from-primary/10 to-muted/30">
            <h3 className="text-xs sm:text-sm font-semibold text-primary mb-3 sm:mb-4 flex items-center gap-2">
              <Plus size={16} className="text-primary" />
              <span className="hidden sm:inline">Añadir Pieza con Tratamiento</span>
              <span className="sm:hidden">Añadir Pieza</span>
            </h3>

            {/* Row 1: Tooth fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold ">
                  N° Diente
                </label>
                <Input
                  type="number"
                  placeholder="Ej: 11"
                  className={`bg-muted/50 border-gray-500 dark:border-white/50 focus:border-primary ${newTooth.tooth_number > 0 && toothError ? 'border-rose-500 focus:border-rose-500' : ''}`}
                  value={newTooth.tooth_number || ""}
                  onChange={(e) =>
                    setNewTooth({
                      ...newTooth,
                      tooth_number: parseInt(e.target.value) || 0,
                    })
                  }
                />
                {newTooth.tooth_number > 0 && toothError && (
                  <p className="text-rose-500 text-[10px] font-medium leading-none m-0">{toothError}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                  Tipo de Pieza
                </label>
                <select
                  className="w-full h-10 rounded-md bg-muted/50 border border-border text-foreground text-sm px-3 appearance-none focus:ring-1 focus:ring-primary outline-none border-gray-500 dark:border-white/50"
                  value={newTooth.tooth_type}
                  onChange={(e) =>
                    setNewTooth({ ...newTooth, tooth_type: e.target.value })
                  }
                >
                  <option value="adult">Permanente (Adulto)</option>
                  <option value="child">Temporal (Niño)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                  Observaciones
                </label>
                <Input
                  placeholder="Notas del diente..."
                  className="bg-muted/50 border-gray-500 dark:border-white/50 focus:border-primary"
                  value={newTooth.notes}
                  onChange={(e) =>
                    setNewTooth({ ...newTooth, notes: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-border/50"></div>
              <span className="text-[10px] text-purple-500 uppercase tracking-widest font-bold flex items-center gap-1.5">
                <Stethoscope size={12} />
                Tratamiento
              </span>
              <div className="flex-1 h-px bg-border/50"></div>
            </div>

            {/* Row 2: Treatment fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                  Procedimiento *
                </label>
                <TreatmentAutocomplete
                  catalog={treatmentCatalog}
                  placeholder="Ej: Endodoncia, Limpieza..."
                  className="bg-muted/50 border-gray-500 dark:border-white/50 focus:border-purple-500 text-xs sm:text-sm"
                  value={newTooth.first_treatment_description}
                  onChange={(val) =>
                    setNewTooth({
                      ...newTooth,
                      first_treatment_description: val,
                    })
                  }
                  onSelect={(item) =>
                    setNewTooth({
                      ...newTooth,
                      first_treatment_description: item.name,
                      first_treatment_price:
                        item.default_price != null && item.default_price > 0
                          ? item.default_price
                          : newTooth.first_treatment_price,
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                  Precio (Bs)
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  className={`bg-muted/50 border-gray-500 dark:border-white/50 text-amber-500 font-bold text-xs sm:text-sm ${priceError ? 'border-rose-500 focus:border-rose-500' : 'focus:border-amber-500'}`}
                  value={newTooth.first_treatment_price || ""}
                  onChange={(e) =>
                    setNewTooth({
                      ...newTooth,
                      first_treatment_price: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                {priceError && (
                  <p className="text-rose-500 text-[10px] font-medium leading-none m-0">{priceError}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                  Fecha
                </label>
                <Input
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                  className="bg-muted/50 border-gray-500 dark:border-white/50 focus:border-primary text-xs sm:text-sm"
                  value={newTooth.first_treatment_date}
                  onChange={(e) =>
                    setNewTooth({
                      ...newTooth,
                      first_treatment_date: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                  Estado
                </label>
                <select
                  className="w-full h-9 sm:h-10 rounded-md bg-muted/50 border border-gray-500 dark:border-white/50 text-foreground text-xs sm:text-sm px-2 sm:px-3 appearance-none focus:ring-1 focus:ring-purple-500 outline-none"
                  value={newTooth.first_treatment_status}
                  onChange={(e) =>
                    setNewTooth({
                      ...newTooth,
                      first_treatment_status: e.target.value,
                    })
                  }
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_progreso">En progreso</option>
                  <option value="completado">Completado</option>
                </select>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleAddTooth}
              disabled={!canAddTooth}
              className={`w-full font-semibold h-10 sm:h-11 transition-all duration-300 text-sm sm:text-base ${
                canAddTooth
                  ? "bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-500 text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              <Plus size={18} className="mr-2" />
              <span className="hidden sm:inline">Añadir Pieza con Tratamiento</span>
              <span className="sm:hidden">Añadir Pieza</span>
            </Button>

            {!canAddTooth && (
              <p className="text-[11px] text-muted-foreground text-center mt-2 italic">
                Completa al menos el N° de diente y el procedimiento para añadir.
              </p>
            )}
          </div>

         
          {/* REGISTERED TEETH — expanded by default                    */}

          {odontogramItems.length > 0 && (
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                <Activity size={14} className="text-purple-500" />
                Piezas Registradas ({odontogramItems.length})
              </h3>
              {odontogramItems.map((tooth, toothIdx) => {
                const isCollapsed = collapsedTeeth.has(toothIdx);
                const toothTotal = tooth.treatments.reduce((a, t) => a + t.price, 0);
                return (
                  <div
                    key={toothIdx}
                    className="border border-border/60 rounded-xl overflow-hidden transition-all duration-300"
                  >
                    {/* Tooth Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 px-3 sm:px-4 py-2 sm:py-3 bg-muted/60">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-xs sm:text-sm font-black text-primary flex-shrink-0">
                            {tooth.tooth_number}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-xs sm:text-sm break-words">
                              Pieza #{tooth.tooth_number} —{" "}
                              {tooth.tooth_type === "adult" ? "Permanente" : "Temporal"}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-0.5">
                              {tooth.notes && (
                                <p className="text-muted-foreground text-[10px] sm:text-[12px] truncate">{tooth.notes}</p>
                              )}
                              <span className="text-purple-500/70 text-[10px] sm:text-[12px] font-semibold flex-shrink-0">
                                {tooth.treatments.length} tratamiento(s)
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                          <span className="text-amber-500 font-bold text-xs sm:text-sm">
                            {toothTotal === 0
                              ? "Sin costo"
                              : `Bs. ${toothTotal.toFixed(2)}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleTooth(toothIdx)}
                            className="text-muted-foreground hover:text-foreground transition-colors p-1"
                          >
                            {isCollapsed ? (
                              <ChevronDown size={16} />
                            ) : (
                              <ChevronUp size={16} />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveTooth(toothIdx)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Treatments — visible by default */}
                    {!isCollapsed && (
                      <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2 bg-muted/30 space-y-2 sm:space-y-3">
                        {tooth.treatments.length === 0 && (
                          <p className="text-muted-foreground text-xs italic text-center py-2">
                            No hay tratamientos para esta pieza aún.
                          </p>
                        )}
                        {tooth.treatments.map((treatment, treatIdx) => {
                          const isReadonly = treatment.is_readonly ?? false;
                          return (
                            <div
                              key={treatIdx}
                              className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 p-2 sm:p-3 rounded-lg border items-end relative ${
                                isReadonly
                                  ? "bg-purple-500/10 border-purple-500/30"
                                  : "bg-muted/50 border-border/50"
                              }`}
                            >
                              {isReadonly && (
                                <div className="col-span-full flex justify-end mb-[-8px]">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 text-[9px] font-semibold uppercase tracking-wider border border-purple-500/30">
                                    Compartido
                                  </span>
                                </div>
                              )}
                              <div className="space-y-1">
                                <label className={`text-[10px] uppercase tracking-widest ${
                                  isReadonly ? "text-purple-600/80 dark:text-purple-400/70" : "text-muted-foreground"
                                }`}>
                                  Procedimiento
                                </label>
                                {isReadonly ? (
                                  <Input
                                    placeholder="Ej: Endodoncia"
                                    className="bg-muted/50 border-gray-500 dark:border-gray-500/50 h-8 text-xs opacity-60 cursor-not-allowed text-muted-foreground"
                                    value={treatment.description}
                                    disabled
                                  />
                                ) : (
                                  <TreatmentAutocomplete
                                    catalog={treatmentCatalog}
                                    placeholder="Ej: Endodoncia"
                                    className="bg-muted/50 border-gray-500 dark:border-gray-500/50 h-8 text-xs"
                                    value={treatment.description}
                                    onChange={(val) =>
                                      updateTreatmentField(
                                        toothIdx,
                                        treatIdx,
                                        "description",
                                        val
                                      )
                                    }
                                    onSelect={(item) => {
                                      updateTreatmentField(
                                        toothIdx,
                                        treatIdx,
                                        "description",
                                        item.name
                                      );
                                      if (item.default_price != null && item.default_price > 0) {
                                        updateTreatmentField(
                                          toothIdx,
                                          treatIdx,
                                          "price",
                                          item.default_price
                                        );
                                      }
                                    }}
                                  />
                                )}
                              </div>
                            <div className="space-y-1">
                              <label className={`text-[10px] uppercase tracking-widest ${
                                isReadonly ? "text-purple-600/80 dark:text-purple-400/70" : "text-muted-foreground"
                              }`}>
                                Precio (Bs)
                              </label>
                              <Input
                                type="number"
                                placeholder="0"
                                className={`bg-muted/50 border-gray-500 dark:border-gray-500/50 h-8 text-xs ${
                                  isReadonly ? "opacity-60 cursor-not-allowed text-muted-foreground" : getPriceError(treatment.price) ? "border-rose-500 text-rose-500" : "text-amber-500 font-bold"
                                }`}
                                value={treatment.price || ""}
                                disabled={isReadonly}
                                onChange={(e) =>
                                  updateTreatmentField(
                                    toothIdx,
                                    treatIdx,
                                    "price",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                              />
                              {!isReadonly && getPriceError(treatment.price) && (
                                <p className="text-rose-500 text-[9px] font-medium leading-none m-0 pt-0.5">{getPriceError(treatment.price)}</p>
                              )}
                            </div>
                            <div className="space-y-1">
                              <label className={`text-[10px] uppercase tracking-widest ${
                                isReadonly ? "text-purple-600/80 dark:text-purple-400/70" : "text-muted-foreground"
                              }`}>
                                Fecha
                              </label>
                              <Input
                                type="date"
                                max={new Date().toISOString().split("T")[0]}
                                className={`bg-muted/50 border-gray-500 dark:border-gray-500/50 h-8 text-xs ${
                                  isReadonly ? "opacity-60 cursor-not-allowed text-muted-foreground" : ""
                                }`}
                                value={treatment.treatment_date}
                                disabled={isReadonly}
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
                                <label className={`text-[10px] uppercase tracking-widest ${
                                  isReadonly ? "text-purple-600/80 dark:text-purple-400/70" : "text-muted-foreground"
                                }`}>
                                  Estado
                                </label>
                                <select
                                  className={`w-full h-8 rounded-md bg-muted/50 border border-gray-500 dark:border-gray-500/50 text-foreground text-xs px-2 outline-none ${
                                    isReadonly ? "opacity-60 cursor-not-allowed text-muted-foreground" : ""
                                  }`}
                                  value={treatment.procedure_status}
                                  disabled={isReadonly}
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
                                onClick={() => !isReadonly && removeTreatment(toothIdx, treatIdx)}
                                className={`transition-colors p-1.5 mb-0.5 ${
                                  isReadonly
                                    ? "text-muted cursor-not-allowed"
                                    : "text-muted-foreground hover:text-destructive"
                                }`}
                                disabled={isReadonly}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          );
                        })}
                        <Button
                          type="button"
                          onClick={() => addTreatmentToTooth(toothIdx)}
                          className="w-full h-8 bg-purple-600/10 hover:bg-purple-600/20 text-purple-500 border border-purple-500/30 text-xs font-medium"
                        >
                          <Plus size={14} className="mr-1" />
                          <span className="hidden sm:inline">Añadir otro Tratamiento a esta Pieza</span>
                          <span className="sm:hidden">Añadir Tratamiento</span>
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
