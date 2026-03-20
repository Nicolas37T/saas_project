"use client";
import React from "react";
import { Activity, Stethoscope } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Step3Props {
  formData: any;
  setFormData: (data: any) => void;
}

export const Step3Evolution: React.FC<Step3Props> = ({
  formData,
  setFormData,
}) => {
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
