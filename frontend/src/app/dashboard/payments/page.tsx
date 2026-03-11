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

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [newPayment, setNewPayment] = useState({
    amount: 0,
    payment_method: "cash",
    payment_status: "completed",
    treatment_id: "",
  });

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
    try {
      await tenantApi.createPayment(newPayment);
      setIsAddModalOpen(false);
      setNewPayment({
        amount: 0,
        payment_method: "cash",
        payment_status: "completed",
        treatment_id: "",
      });
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
      patientName: t.patient ? `${t.patient.first_name} ${t.patient.last_name}` : "Sin asignar",
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
    const patientTreatments = treatments.filter(t => t.patient_id === p.id);
    let totalCosto = 0;
    let totalPagado = 0;

    patientTreatments.forEach(t => {
      totalCosto += t.price;
      const tPaid = t.payments?.reduce((acc, pay) => acc + pay.amount, 0) || 0;
      totalPagado += tPaid;
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
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
            Pagos & Facturación
          </h1>
          <p className="text-slate-400">
            Controla los ingresos del consultorio y los pagos de tratamientos.
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
        >
          <Plus className="mr-2" size={18} /> Registrar Pago
        </Button>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-emerald-900/40 to-slate-900 border-emerald-500/20 backdrop-blur-sm shadow-xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-emerald-400 font-medium text-sm mb-1">
                  Ingresos Totales (Cobrado)
                </p>
                <h3 className="text-3xl font-bold text-white tracking-tight">
                  {formatCurrency(totalIngresos)}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <DollarSign size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-900/40 to-slate-900 border-orange-500/20 backdrop-blur-sm shadow-xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-orange-400 font-medium text-sm mb-1">
                  Cuentas por Cobrar (Deuda)
                </p>
                <h3 className="text-3xl font-bold text-white tracking-tight">
                  {formatCurrency(totalDeudaAcumulada)}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400">
                <Wallet size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-orange-400/80">
              <ArrowUpRight size={14} className="mr-1" />
              <span>{debtors.length} pacientes con deudas</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="bg-slate-900 border border-slate-800 p-1 mb-6">
          <TabsTrigger value="history" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-400">
            Historial de Pagos
          </TabsTrigger>
          <TabsTrigger value="debtors" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white text-slate-400">
            Saldos y Deudores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-0">
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent"></div>
            </div>
          ) : payments.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-emerald-500">
                  <Wallet size={32} />
                </div>
                <h3 className="text-xl font-medium text-white mb-2">
                  No hay pagos registrados
                </h3>
                <p className="text-slate-400">
                  Aún no se han recibido pagos de los pacientes en sus tratamientos.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-medium text-sm">
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
                  <tbody className="divide-y divide-slate-800/50">
                    {payments.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="p-4 pl-6 text-slate-300 font-medium">
                          <div className="flex flex-col">
                            <span className="text-white font-medium">{getTreatmentDetails(p.treatment_id).patientName}</span>
                            <span className="text-sm text-slate-400 truncate max-w-[200px]">
                              {getTreatmentDetails(p.treatment_id).desc}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-white font-bold">
                            {formatCurrency(p.amount)}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-slate-300">
                            <span className="text-slate-500">
                              {getMethodIcon(p.payment_method)}
                            </span>
                            {getMethodLabel(p.payment_method)}
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full border ${p.payment_status === "completed" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-orange-400 bg-orange-500/10 border-orange-500/20"}`}
                          >
                            {p.payment_status === "completed"
                              ? "Pagado"
                              : "Pendiente"}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400 text-sm hidden md:table-cell">
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
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-emerald-500 border-2 border-emerald-500/20">
                  <Banknote size={32} />
                </div>
                <h3 className="text-xl font-medium text-white mb-2">
                  ¡Cuentas al día!
                </h3>
                <p className="text-slate-400">
                  Ningún paciente tiene saldos pendientes o deudas activas en este momento.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-medium text-sm">
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
                  <tbody className="divide-y divide-slate-800/50">
                    {debtors.map((d) => (
                      <tr
                        key={d.patient.id}
                        className="hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="p-4 pl-6 text-white font-medium">
                          {d.patient.first_name} {d.patient.last_name}
                        </td>
                        <td className="p-4 text-slate-400">
                          {formatCurrency(d.totalCosto)}
                        </td>
                        <td className="p-4 text-emerald-400/80">
                          {formatCurrency(d.totalPagado)}
                        </td>
                        <td className="p-4 text-orange-400 font-bold">
                          {formatCurrency(d.saldoDeudor)}
                        </td>
                        <td className="p-4 text-center">
                          <Button
                            size="sm"
                            className="bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white"
                            onClick={() => {
                              setSelectedPatientId(d.patient.id);
                              // Limpia el form por si acaso
                              setNewPayment({
                                amount: 0,
                                payment_method: "cash",
                                payment_status: "completed",
                                treatment_id: "",
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
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-2xl">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-6">Nuevo Pago</h2>
              <form onSubmit={handleCreatePayment} className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Filtrar por Paciente
                    </label>
                    <select
                      className="w-full p-2.5 rounded-md bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      value={selectedPatientId}
                      onChange={(e) => {
                        setSelectedPatientId(e.target.value);
                        setNewPayment({ ...newPayment, treatment_id: "", amount: 0 });
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
                    <label className="text-sm font-medium text-slate-300">
                      Seleccionar Tratamiento
                    </label>
                    <select
                      required
                      className="w-full p-2.5 rounded-md bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      value={newPayment.treatment_id}
                      onChange={(e) => {
                        const tId = e.target.value;
                        const sel = treatments.find((t) => t.id === tId);
                        const paid = sel?.payments?.reduce((acc, p) => acc + p.amount, 0) || 0;
                        const bal = sel ? Math.max(0, sel.price - paid) : 0;

                        setNewPayment({
                          ...newPayment,
                          treatment_id: tId,
                          amount: bal, // Auto-fill con el saldo pendiente
                        });
                      }}
                    >
                      <option value="">Buscar tratamiento...</option>
                      {treatments
                        .filter(t => !selectedPatientId || t.patient_id === selectedPatientId)
                        .map((t) => {
                          const alreadyPaid = t.payments?.reduce((acc, p) => acc + p.amount, 0) || 0;
                          const balance = Math.max(0, t.price - alreadyPaid);
                          return (
                            <option key={t.id} value={t.id}>
                              {t.description} - Total: Bs. {t.price} (Saldo: Bs. {balance})
                            </option>
                          );
                        })}
                    </select>
                  </div>
                </div>

                {newPayment.treatment_id && (
                  <div className="p-4 bg-slate-950/50 rounded-lg border border-slate-800/50 space-y-1">
                    {(() => {
                      const sel = treatments.find(t => t.id === newPayment.treatment_id);
                      if (!sel) return null;
                      const paid = sel.payments?.reduce((acc, p) => acc + p.amount, 0) || 0;
                      const bal = Math.max(0, sel.price - paid);
                      return (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Costo Total:</span>
                            <span className="text-white font-medium">Bs. {sel.price.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Pagado Acumulado:</span>
                            <span className="text-emerald-400 font-medium">Bs. {paid.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm border-t border-slate-800 mt-2 pt-2">
                            <span className="text-slate-300 font-medium">Saldo Deudor:</span>
                            <span className="text-orange-400 font-bold">Bs. {bal.toFixed(2)}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    Monto Cobrado
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-medium text-sm">
                      Bs
                    </div>
                    <Input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={newPayment.amount}
                      onChange={(e) =>
                        setNewPayment({
                          ...newPayment,
                          amount: parseFloat(e.target.value),
                        })
                      }
                      className="pl-8 bg-slate-950/50 border-slate-800 text-white focus-visible:ring-emerald-500/50 font-medium"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Método Operativo
                    </label>
                    <select
                      className="w-full p-2.5 rounded-md bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      value={newPayment.payment_method}
                      onChange={(e) =>
                        setNewPayment({
                          ...newPayment,
                          payment_method: e.target.value,
                        })
                      }
                    >
                      <option value="cash">Efectivo</option>
                      <option value="card">Tarjeta</option>
                      <option value="transfer">Transferencia</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Estado de Pago
                    </label>
                    <select
                      className="w-full p-2.5 rounded-md bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      value={newPayment.payment_status}
                      onChange={(e) =>
                        setNewPayment({
                          ...newPayment,
                          payment_status: e.target.value,
                        })
                      }
                    >
                      <option value="completed">Completado</option>
                      <option value="pending">Pendiente</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-8">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsAddModalOpen(false)}
                    className="text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Procesar Pago
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
