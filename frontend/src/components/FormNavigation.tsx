"use client";
import React from "react";
import { ArrowLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FormNavigationProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  onCancel: () => void;
  submitting: boolean;
  canGoNext: boolean;
  nextLabel?: string;
  finishLabel?: string;
}

export const FormNavigation: React.FC<FormNavigationProps> = ({
  currentStep,
  setCurrentStep,
  onCancel,
  submitting,
  canGoNext,
  nextLabel = "Siguiente Paso",
  finishLabel = "GUARDAR CAMBIOS",
}) => {
  const buttonBaseClass = "h-12 px-8 font-bold transition-all shadow-xl min-w-[160px]";
  const previousButtonClass = "bg-red-600 hover:bg-red-700 text-white hover:shadow-red-500/25";
  const nextButtonClass = "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-blue-500/25";
  const finishButtonClass = "bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-emerald-500/25";

  return (
    <div className="flex justify-between items-center pt-10 border-t border-slate-800 max-w-5xl mx-auto w-full mt-10">
      <Button
        type="button"
        variant="ghost"
        className={`${buttonBaseClass} ${previousButtonClass}`}
        onClick={(e) => {
          e.preventDefault();
          if (currentStep > 1) setCurrentStep(currentStep - 1);
          else onCancel();
        }}
      >
        <ArrowLeft size={18} className="mr-2" />
        {currentStep === 1 ? "Cancelar" : "Anterior"}
      </Button>

      <div className="flex gap-4">
        {currentStep < 3 ? (
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setCurrentStep(currentStep + 1);
            }}
            disabled={!canGoNext}
            className={`${buttonBaseClass} ${nextButtonClass} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {nextLabel}
            <ChevronRight size={18} className="ml-2" />
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={submitting || !canGoNext}
            className={`${buttonBaseClass} ${finishButtonClass} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {submitting ? (
              "Guardando..."
            ) : (
              <div className="flex items-center gap-3">
                <CheckCircle2
                  size={24}
                  className="group-hover:scale-110 transition-transform"
                />
                {finishLabel}
              </div>
            )}
          </Button>

        )}
      </div>
    </div>
  );
};
