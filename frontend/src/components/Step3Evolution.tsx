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
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
             <Activity size={22} className="text-primary" />
             <h2 className="text-xl font-bold">Evolución Clínica del Caso</h2>
          </div>
          <Button 
            type="button"
            variant="outline" 
            size="sm" 
            onClick={addEntry}
            className="border-primary/50 text-primary hover:bg-primary/10 gap-2"
          >
            <Plus size={16} />
            Añadir Evolución
          </Button>
        </div>

        {entries.map((text, index) => (
          <Card key={index} className="bg-card border-border backdrop-blur-sm shadow-lg overflow-hidden transition-all hover:border-primary/30">
            <CardHeader className="py-3 px-5 bg-muted/20 flex flex-row items-center justify-between border-b border-border/50">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Sesión / Evolución #{index + 1}
              </span>
              {entries.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEntry(index)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <textarea
                className="w-full bg-transparent border-0 min-h-[80px] p-4 text-sm focus:ring-0 outline-none transition-all placeholder:text-muted-foreground resize-none"
                placeholder="Describe la evolución, tratamiento realizado o notas de esta sesión..."
                rows={3}
                value={text}
                onChange={(e) => handleEntryChange(index, e.target.value)}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-border backdrop-blur-sm shadow-xl mt-12">
        <CardHeader className="pb-3 px-6 pt-6">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Stethoscope size={18} className="text-amber-500" />
            Antecedentes Relevantes
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-6 px-6 pb-6">
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
              Condiciones
            </label>
            <Input
              className="bg-muted/50 border-border h-11"
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
              className="bg-muted/50 border-border h-11"
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
              className="bg-muted/50 border-border h-11"
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
