"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  DollarSign,
  Wallet,
  CreditCard,
  Banknote,
  ArrowUpRight,
} from "lucide-react";
import { tenantApi, Payment, Treatment, Patient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomModal, SuccessModal } from "@/components/ui/custom-modal";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [paymentOptions, setPaymentOptions] = useState({
    payment_method: "cash",
    payment_status: "completed",
  });
  const [selectedTreatments, setSelectedTreatments] = useState<Record<string, number>>({});

  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [payData, trData, patData] = await Promise.all([
        tenantApi.getPayments(),
        tenantApi.getTreatments(),
        tenantApi.getPatients(),
      ]);
      setPayments(payData);
      setTreatments(trData);
      setPatients(patData);
    } catch (error) {
      console.error("Failed to load payments data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const treatmentIds = Object.keys(selectedTreatments);
    if (treatmentIds.length === 0) {
      alert("Por favor seleccione al menos un tratamiento para pagar.");
      return;
    }

    try {
      const promises = treatmentIds.map(tId => {
        const amt = selectedTreatments[tId];
        if (amt > 0) {
          return tenantApi.createPayment({
            treatment_id: tId,
            amount: amt,
            payment_method: paymentOptions.payment_method,
            payment_status: paymentOptions.payment_status,
          });
        }
        return Promise.resolve();
      });

      await Promise.all(promises);

      setIsAddModalOpen(false);
      setSelectedTreatments({});
      setPaymentOptions({ payment_method: "cash", payment_status: "completed" });
      setIsSuccessModalOpen(true);
      loadData(); // refresh
    } catch (error) {
      console.error("Error creating payment", error);
    }
  };

  const getTreatmentDetails = (id: string) => {
    const t = treatments.find((t) => t.id === id);
    if (!t) return { desc: "Desconocido", patientName: "Desconocido" };
    return {
      desc: t.description,
      patientName: t.odontogram?.patient ? `${t.odontogram.patient.first_name} ${t.odontogram.patient.last_name}` : "Sin asignar",
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
    }).format(amount);
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "card":
        return <CreditCard size={16} />;
      case "transfer":
        return <Wallet size={16} />;
      default:
        return <Banknote size={16} />;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case "card":
        return "Tarjeta";
      case "transfer":
        return "Transferencia";
      default:
        return "Efectivo";
    }
  };

  const totalIngresos = payments.reduce(
    (acc, current) => acc + current.amount,
    0,
  );

  const debtors = patients.map(p => {
    // Find all treatments for this patient
    const patientTreatments = treatments.filter(t => t.odontogram?.patient_id === p.id);
    let totalCosto = 0;
    let totalPagado = 0;

    patientTreatments.forEach(t => {
      // Si el precio es 0 (oculto por el backend), significa que pertenece a otro doctor
      // y no debemos sumar ni su costo ni sus pagos al saldo deudor de nuestro dashboard
      if (t.price > 0) {
        totalCosto += t.price;
        const tPaid = t.payments?.reduce((acc, pay) => acc + pay.amount, 0) || 0;
        totalPagado += tPaid;
      }
    });

    const saldoDeudor = Math.max(0, totalCosto - totalPagado);

    return {
      patient: p,
      totalCosto,
      totalPagado,
      saldoDeudor,
    };
  }).filter(d => d.saldoDeudor > 0);

  const totalDeudaAcumulada = debtors.reduce((acc, d) => acc + d.saldoDeudor, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">
            Pagos & Facturación
          </h1>
          <p className="text-muted-foreground">
            Controla los ingresos del consultorio y los pagos de tratamientos.
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedPatientId("");
            setSelectedTreatments({});
            setPaymentOptions({
              payment_method: "cash",
              payment_status: "completed",
            });
            setIsAddModalOpen(true);
          }}
          className="bg-green-600 hover:bg-green-700 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
        >
          <Plus className="mr-2" size={18} /> Registrar Pago
        </Button>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-green-900/40 to-card border-green-500/20 backdrop-blur-sm shadow-xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-green-900 dark:text-green-400 font-medium text-sm mb-1">
                  Ingresos Totales (Cobrado)
                </p>
                <h3 className="text-3xl font-bold tracking-tight">
                  {formatCurrency(totalIngresos)}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                <DollarSign size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-900/40 to-card border-orange-500/20 backdrop-blur-sm shadow-xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-orange-900 dark:text-orange-400 font-medium text-sm mb-1">
                  Cuentas por Cobrar (Deuda)
                </p>
                <h3 className="text-3xl font-bold tracking-tight">
                  {formatCurrency(totalDeudaAcumulada)}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400">
                <Wallet size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-orange-900 dark:text-orange-400/80">
              <ArrowUpRight size={14} className="mr-1" />
              <span>{debtors.length} pacientes con deudas</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="bg-muted border border-border p-1 mb-6">
          <TabsTrigger value="history" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            Historial de Pagos
          </TabsTrigger>
          <TabsTrigger value="debtors" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
            Saldos y Deudores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-0">
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin w-8 h-8 rounded-full border-2 border-green-500 border-t-transparent"></div>
            </div>
          ) : payments.length === 0 ? (
            <Card className="bg-card border-border backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 text-green-500">
                  <Wallet size={32} />
                </div>
                <h3 className="text-xl font-medium mb-2">
                  No hay pagos registrados
                </h3>
                <p className="text-muted-foreground">
                  Aún no se han recibido pagos de los pacientes en sus tratamientos.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-muted/80 border-b border-border font-medium text-sm">
                    <tr>
                      <th className="p-4 pl-6 font-semibold">
                        Paciente / Tratamiento
                      </th>
                      <th className="p-4 font-semibold">Monto</th>
                      <th className="p-4 font-semibold">Método de Pago</th>
                      <th className="p-4 font-semibold">Estado</th>
                      <th className="p-4 font-semibold hidden md:table-cell">
                        Fecha
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {payments.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-4 pl-6 font-medium">
                          <div className="flex flex-col">
                            <span className="font-medium">{getTreatmentDetails(p.treatment_id).patientName}</span>
                            <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {getTreatmentDetails(p.treatment_id).desc}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-bold">
                            {formatCurrency(p.amount)}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="text-muted-foreground">
                              {getMethodIcon(p.payment_method)}
                            </span>
                            {getMethodLabel(p.payment_method)}
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full border ${p.payment_status === "completed" ? "text-green-400 bg-green-500/10 border-green-500/20" : "text-orange-400 bg-orange-500/10 border-orange-500/20"}`}
                          >
                            {p.payment_status === "completed"
                              ? "Pagado"
                              : "Pendiente"}
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground text-sm hidden md:table-cell">
                          {new Date(p.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="debtors" className="mt-0">
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent"></div>
            </div>
          ) : debtors.length === 0 ? (
            <Card className="bg-card border-border backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 text-green-500 border-2 border-green-500/20">
                  <Banknote size={32} />
                </div>
                <h3 className="text-xl font-medium mb-2">
                  ¡Cuentas al día!
                </h3>
                <p className="text-muted-foreground">
                  Ningún paciente tiene saldos pendientes o deudas activas en este momento.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-muted/80 border-b border-border font-medium text-sm">
                    <tr>
                      <th className="p-4 pl-6 font-semibold">
                        Paciente
                      </th>
                      <th className="p-4 font-semibold">Costo Total Histórico</th>
                      <th className="p-4 font-semibold">Total Abonado</th>
                      <th className="p-4 font-semibold">Saldo Deudor</th>
                      <th className="p-4 text-center font-semibold">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {debtors.map((d) => (
                      <tr
                        key={d.patient.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-4 pl-6 font-medium">
                          {d.patient.first_name} {d.patient.last_name}
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {formatCurrency(d.totalCosto)}
                        </td>
                        <td className="p-4 text-green-400/80">
                          {formatCurrency(d.totalPagado)}
                        </td>
                        <td className="p-4 text-orange-400 font-bold">
                          {formatCurrency(d.saldoDeudor)}
                        </td>
                        <td className="p-4 text-center">
                          <Button
                            size="sm"
                            className="bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white"
                            onClick={() => {
                              setSelectedPatientId(d.patient.id);
                              setSelectedTreatments({});
                              setPaymentOptions({
                                payment_method: "cash",
                                payment_status: "completed",
                              });
                              setIsAddModalOpen(true);
                            }}
                          >
                            Cobrar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Payment Modal */}
      <CustomModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Registrar Pago"
      >
        <form onSubmit={handleCreatePayment} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Filtrar por Paciente
              </label>
              <select
                className="w-full p-2.5 rounded-md bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-green-500/50"
                value={selectedPatientId}
                onChange={(e) => {
                  setSelectedPatientId(e.target.value);
                  setSelectedTreatments({});
                }}
              >
                <option value="">Todos los pacientes</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Tratamientos Pendientes
              </label>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {(() => {
                  if (!selectedPatientId) {
                    return <div className="text-sm text-muted-foreground p-4 border border-border rounded-lg text-center bg-muted/50">Por favor, seleccione un paciente primero para ver sus tratamientos pendientes.</div>;
                  }

                  const availableTreatments = treatments.filter((t) => {
                    if (t.odontogram?.patient_id !== selectedPatientId) return false;
                    if (t.price <= 0) return false;
                    const paid = t.payments?.reduce((acc, p) => acc + p.amount, 0) || 0;
                    return t.price - paid > 0;
                  });

                  if (availableTreatments.length === 0) {
                    return <div className="text-sm text-muted-foreground p-4 border border-border rounded-lg text-center bg-muted/50">No hay tratamientos validos pendientes de pago para mostrar.</div>;
                  }

                  return availableTreatments.map((t) => {
                    const paid = t.payments?.reduce((acc, p) => acc + p.amount, 0) || 0;
                    const balance = t.price - paid;
                    const isSelected = selectedTreatments[t.id] !== undefined;

                    return (
                      <div key={t.id} className={`p-3 rounded-lg border flex flex-col gap-3 transition-colors ${isSelected ? "bg-green-950/20 border-green-500/30" : "bg-card border-border"}`}>
                        <div className="flex items-start justify-between gap-2">
                          <label className="flex items-start gap-3 cursor-pointer flex-1">
                            <input
                              type="checkbox"
                              className="mt-1 flex-shrink-0 w-4 h-4 rounded border-border text-green-600 focus:ring-green-500/50 bg-muted cursor-pointer"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTreatments(prev => ({ ...prev, [t.id]: balance }));
                                } else {
                                  setSelectedTreatments(prev => {
                                    const next = { ...prev };
                                    delete next[t.id];
                                    return next;
                                  });
                                }
                              }}
                            />
                            <div>
                              <p className={`text-sm font-medium ${isSelected ? "text-green-400" : "text-foreground"}`}>{t.description}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Total: {formatCurrency(t.price)} • Saldo: {formatCurrency(balance)}
                              </p>
                            </div>
                          </label>
                        </div>
                        {isSelected && (
                          <div className="pl-7 flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Abonar:</span>
                            <div className="relative flex-1 max-w-[150px]">
                              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-muted-foreground font-medium text-xs">
                                Bs
                              </div>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                max={balance}
                                value={selectedTreatments[t.id] ?? ""}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  setSelectedTreatments(prev => ({ ...prev, [t.id]: isNaN(val) ? 0 : val }));
                                }}
                                className="h-8 pl-7 text-sm bg-muted/50 border-border text-foreground focus-visible:ring-green-500/50"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex justify-between items-center bg-muted/50 p-3 rounded-lg border border-border">
              <span className="text-sm font-medium">
                Total a Cobrar
              </span>
              <span className="text-lg font-bold text-green-400">
                {formatCurrency(Object.values(selectedTreatments).reduce((acc, val) => acc + (val || 0), 0))}
              </span>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Método Operativo
              </label>
              <select
                className="w-full p-2.5 rounded-md bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-green-500/50"
                value={paymentOptions.payment_method}
                onChange={(e) =>
                  setPaymentOptions({
                    ...paymentOptions,
                    payment_method: e.target.value,
                  })
                }
              >
                <option value="cash">Efectivo</option>
                <option value="card">Tarjeta</option>
                <option value="transfer">Transferencia</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsAddModalOpen(false)}
              className="hover:bg-accent"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={Object.keys(selectedTreatments).length === 0}
            >
              Procesar
            </Button>
          </div>
        </form>
      </CustomModal>

      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="Pago Registrado"
        message="El cobro ha sido procesado exitosamente en el sistema."
      />
    </div>
  );
}
