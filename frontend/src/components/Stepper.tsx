"use client";
import React from "react";
import { Users, Activity, Stethoscope, CheckCircle2 } from "lucide-react";

interface StepperProps {
  currentStep: number;
}

export const Stepper: React.FC<StepperProps> = ({ currentStep }) => {
  const steps = [
    {
      step: 1,
      label: "Paciente e Higiene",
      icon: <Users size={18} />,
    },
    {
      step: 2,
      label: "Tratamientos",
      icon: <Activity size={18} />,
    },
    {
      step: 3,
      label: "Evolución y Antecedentes",
      icon: <Stethoscope size={18} />,
    },
  ];

  return (
    <>
      {/* Mobile: Vertical compact stepper */}
      <div className="sm:hidden space-y-3 mb-6">
        <div className="flex items-center gap-3">
          {steps.map((item, index) => (
            <React.Fragment key={item.step}>
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    currentStep >= item.step
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {currentStep > item.step ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    item.icon
                  )}
                </div>
                <span
                  className={`text-[9px] uppercase font-bold ${
                    currentStep >= item.step ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  Paso {item.step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 h-[2px] bg-border relative overflow-hidden rounded">
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-primary to-indigo-600 transition-transform duration-700"
                    style={{
                      transform: `translateX(${currentStep > item.step ? "0%" : "-100%"})`,
                    }}
                  ></div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center font-medium">
          {steps[currentStep - 1]?.label}
        </p>
      </div>

      {/* Desktop: Original horizontal stepper */}
      <div className="hidden sm:block mb-6 sm:mb-8 overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex items-center justify-between min-w-[600px] px-4">
          {steps.map((item, index) => (
            <React.Fragment key={item.step}>
              <div className="flex flex-col items-center gap-2 relative">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg ${
                    currentStep >= item.step
                      ? "bg-primary text-primary-foreground shadow-primary/30 ring-4 ring-primary/10"
                      : "bg-muted text-muted-foreground shadow-none ring-0"
                  }`}
                >
                  {currentStep > item.step ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    item.icon
                  )}
                </div>
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider transition-colors duration-300 ${
                    currentStep >= item.step ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 h-[2px] mx-4 bg-border relative overflow-hidden mb-6">
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-primary to-indigo-600 transition-transform duration-700 ease-in-out"
                    style={{
                      transform: `translateX(${currentStep > item.step ? "0%" : "-100%"})`,
                    }}
                  ></div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </>
  );
};
