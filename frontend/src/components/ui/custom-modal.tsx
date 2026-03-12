"use client";
import React from "react";
import { X } from "lucide-react";
import { Button } from "./button";
import { Card } from "./card";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
  showCloseButton?: boolean;
}

export const CustomModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-md",
  showCloseButton = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className={`w-full ${maxWidth} bg-slate-900 border-slate-800 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200`}>
        <div className="p-6">
          {(title || showCloseButton) && (
            <div className="flex justify-between items-center mb-6">
              {title && <h2 className="text-xl font-bold text-white">{title}</h2>}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="text-slate-500 hover:text-white transition-colors p-1"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          )}
          {children}
        </div>
      </Card>
    </div>
  );
};

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary" | "warning";
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "primary",
  isLoading = false,
  icon,
}) => {
  const variantStyles = {
    primary: "bg-blue-600 hover:bg-blue-700",
    danger: "bg-red-600 hover:bg-red-700",
    warning: "bg-yellow-600 hover:bg-yellow-700 text-black",
  };

  return (
    <CustomModal isOpen={isOpen} onClose={onClose} showCloseButton={false} maxWidth="max-w-sm">
      <div className="text-center">
        {icon && (
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${variant === 'danger' ? 'bg-red-500/10' : 'bg-blue-500/10'}`}>
            {icon}
          </div>
        )}
        <h2 className="text-lg font-bold text-white mb-2">{title}</h2>
        <div className="text-slate-400 text-sm mb-6">{message}</div>
        <div className="flex gap-3">
          <Button
            variant="ghost"
            className="flex-1 text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            className={`flex-1 text-white ${variantStyles[variant]}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Procesando..." : confirmText}
          </Button>
        </div>
      </div>
    </CustomModal>
  );
};

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonText?: string;
}

import { CheckCircle2 } from "lucide-react";

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  buttonText = "Aceptar",
}) => {
  return (
    <CustomModal isOpen={isOpen} onClose={onClose} showCloseButton={false} maxWidth="max-w-sm">
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={26} className="text-green-400" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">{title}</h2>
        <p className="text-slate-400 text-sm mb-6">{message}</p>
        <Button
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          onClick={onClose}
        >
          {buttonText}
        </Button>
      </div>
    </CustomModal>
  );
};
