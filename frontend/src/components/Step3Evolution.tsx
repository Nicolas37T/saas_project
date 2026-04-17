"use client";
import React, { useState, useEffect } from "react";
import { Activity, Stethoscope, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Step3Props {
  formData: any;
  setFormData: (data: any) => void;
}

const DELIMITER = "\n\n---\n\n";

export const Step3Evolution: React.FC<Step3Props> = ({
  formData,
  setFormData,
}) => {
  // Inicializar cajitas desde la descripción médica (split por el delimitador)
  const [entries, setEntries] = useState<string[]>([]);

  useEffect(() => {
    const initialText = formData.medical_description || "";
    if (initialText) {
      const splitEntries = initialText.split(DELIMITER);
      setEntries(splitEntries);
    } else {
      setEntries([""]); // Empezar con una vacía si no hay nada
    }
  }, []); // Solo al montar

  // Actualizar el formData global cuando las cajitas locales cambian
  const syncToGlobal = (newEntries: string[]) => {
    setEntries(newEntries);
    const joinedText = newEntries.filter(e => e.trim() !== "").join(DELIMITER);
    setFormData({ ...formData, medical_description: joinedText });
  };

  const handleEntryChange = (index: number, value: string) => {
    const newEntries = [...entries];
    newEntries[index] = value;
    syncToGlobal(newEntries);
  };

  const addEntry = () => {
    syncToGlobal([...entries, ""]);
  };

  const removeEntry = (index: number) => {
    if (entries.length <= 1) {
      syncToGlobal([""]);
      return;
    }
    const newEntries = entries.filter((_, i) => i !== index);
    syncToGlobal(newEntries);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto space-y-6">
      <Card className="bg-card border-border backdrop-blur-sm shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity size={18} className="text-primary" />
            Evolución Clínica del Caso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full rounded-2xl bg-muted/50 border border-border min-h-[180px] p-5 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-muted-foreground"
            placeholder="Escribe aquí los detalles clínicos, evolución observada y notas internas..."
            value={formData.medical_description}
            onChange={(e) =>
              setFormData({ ...formData, medical_description: e.target.value })
            }
          />
        </CardContent>
      </Card>

      <Card className="bg-card border-border backdrop-blur-sm shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Stethoscope size={18} className="text-amber-500" />
            Antecedentes Relevantes
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
              Condiciones
            </label>
            <Input
              className="bg-muted/50 border-border h-10 sm:h-11 text-xs sm:text-sm"
              placeholder="Diabetes..."
              value={formData.conditions}
              onChange={(e) =>
                setFormData({ ...formData, conditions: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
              Alergias
            </label>
            <Input
              className="bg-muted/50 border-border h-10 sm:h-11 text-xs sm:text-sm"
              placeholder="Latex..."
              value={formData.allergies}
              onChange={(e) =>
                setFormData({ ...formData, allergies: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
              Medicación
            </label>
            <Input
              className="bg-muted/50 border-border h-10 sm:h-11 text-xs sm:text-sm"
              placeholder="Aspirina..."
              value={formData.medications}
              onChange={(e) =>
                setFormData({ ...formData, medications: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
