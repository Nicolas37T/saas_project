"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  FileText,
  Edit2,
  Trash2,
  X,
  Plus,
} from "lucide-react";
import type { Appointment, Patient, Employee } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface CalendarViewProps {
  appointments: Appointment[];
  patients: Patient[];
  employees: Employee[];
  onEdit: (apt: Appointment) => void;
  onDelete: (id: string) => void;
  onCreateFromDate: (dateStr: string) => void;
  onMonthChange?: (year: number, month: number) => void;
  getPatientName: (id: string) => string;
  getDoctorName: (id?: string) => string;
  getStatusStyle: (status: string) => string;
  statusLabels: Record<string, string>;
}

const DAYS_OF_WEEK = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function CalendarView({
  appointments,
  patients,
  employees,
  onEdit,
  onDelete,
  onCreateFromDate,
  onMonthChange,
  getPatientName,
  getDoctorName,
  getStatusStyle,
  statusLabels,
}: CalendarViewProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Build a map: "YYYY-MM-DD" -> Appointment[]
  const appointmentsByDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    appointments.forEach((apt) => {
      const d = new Date(apt.appointment_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!map[key]) map[key] = [];
      map[key].push(apt);
    });
    // Sort each day's appointments by time
    Object.values(map).forEach((dayApts) =>
      dayApts.sort(
        (a, b) =>
          new Date(a.appointment_date).getTime() -
          new Date(b.appointment_date).getTime()
      )
    );
    return map;
  }, [appointments]);

  // Calendar grid generation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();

    // getDay() returns 0=Sunday. We want Monday=0.
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const days: { date: number; month: number; year: number; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    const prevMonth = new Date(currentYear, currentMonth, 0);
    const prevDays = prevMonth.getDate();
    for (let i = startDow - 1; i >= 0; i--) {
      days.push({
        date: prevDays - i,
        month: currentMonth === 0 ? 11 : currentMonth - 1,
        year: currentMonth === 0 ? currentYear - 1 : currentYear,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ date: d, month: currentMonth, year: currentYear, isCurrentMonth: true });
    }

    // Next month padding to fill remaining cells (up to 42 = 6 rows)
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({
        date: d,
        month: currentMonth === 11 ? 0 : currentMonth + 1,
        year: currentMonth === 11 ? currentYear + 1 : currentYear,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentMonth, currentYear]);

  const goToPrevMonth = () => {
    let newMonth = currentMonth;
    let newYear = currentYear;
    if (currentMonth === 0) {
      newMonth = 11;
      newYear = currentYear - 1;
    } else {
      newMonth = currentMonth - 1;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    setSelectedDate(null);
    onMonthChange?.(newYear, newMonth);
  };

  const goToNextMonth = () => {
    let newMonth = currentMonth;
    let newYear = currentYear;
    if (currentMonth === 11) {
      newMonth = 0;
      newYear = currentYear + 1;
    } else {
      newMonth = currentMonth + 1;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    setSelectedDate(null);
    onMonthChange?.(newYear, newMonth);
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(null);
    onMonthChange?.(today.getFullYear(), today.getMonth());
  };

  const getDateKey = (day: { date: number; month: number; year: number }) => {
    return `${day.year}-${String(day.month + 1).padStart(2, "0")}-${String(day.date).padStart(2, "0")}`;
  };

  const isToday = (day: { date: number; month: number; year: number }) => {
    return (
      day.date === today.getDate() &&
      day.month === today.getMonth() &&
      day.year === today.getFullYear()
    );
  };

  const selectedAppointments = selectedDate
    ? appointmentsByDate[selectedDate] || []
    : [];

  // Status dot color
  const getStatusDotColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "scheduled":
        return "bg-blue-500";
      case "confirmed":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "completed":
        return "bg-gray-400";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Calendar Grid */}
      <div className="flex-1">
        {/* Header: Month navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevMonth}
              className="h-9 w-9 hover:bg-accent"
            >
              <ChevronLeft size={20} />
            </Button>
            <h2 className="text-xl font-bold min-w-[200px] text-center">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextMonth}
              className="h-9 w-9 hover:bg-accent"
            >
              <ChevronRight size={20} />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="text-sm"
          >
            Hoy
          </Button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS_OF_WEEK.map((dayName) => (
            <div
              key={dayName}
              className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider py-2"
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 border border-border rounded-xl overflow-hidden">
          {calendarDays.map((day, idx) => {
            const dateKey = getDateKey(day);
            const dayApts = appointmentsByDate[dateKey] || [];
            const isSelected = selectedDate === dateKey;
            const isTodayDate = isToday(day);

            return (
              <div
                key={idx}
                onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                className={`
                  min-h-[100px] p-2 border-b border-r border-border/50 cursor-pointer
                  transition-all duration-150 relative
                  ${!day.isCurrentMonth ? "opacity-40" : ""}
                  ${isSelected ? "bg-primary/10 ring-2 ring-primary/30 ring-inset" : "hover:bg-accent/50"}
                  ${isTodayDate ? "bg-primary/5" : ""}
                `}
              >
                {/* Day number */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`
                      text-sm font-medium inline-flex items-center justify-center
                      ${isTodayDate
                        ? "bg-primary text-primary-foreground rounded-full w-7 h-7"
                        : "w-7 h-7"
                      }
                      ${!day.isCurrentMonth ? "text-muted-foreground/60" : ""}
                    `}
                  >
                    {day.date}
                  </span>
                  {dayApts.length > 0 && (
                    <span className="text-[10px] font-semibold text-primary bg-primary/15 rounded-full px-1.5 py-0.5">
                      {dayApts.length}
                    </span>
                  )}
                </div>

                {/* Appointment chips (max 3 visible) */}
                <div className="space-y-1">
                  {dayApts.slice(0, 3).map((apt) => {
                    const d = new Date(apt.appointment_date);
                    const timeStr = d.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    return (
                      <div
                        key={apt.id}
                        className={`
                          flex items-center gap-1 text-[11px] leading-tight rounded-md px-1.5 py-0.5
                          bg-muted/80 hover:bg-muted truncate transition-colors
                        `}
                        title={`${timeStr} - ${getPatientName(apt.patient_id)}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusDotColor(apt.appointment_status)}`}
                        />
                        <span className="font-semibold text-muted-foreground">{timeStr}</span>
                        <span className="truncate text-foreground/70">
                          {getPatientName(apt.patient_id).split(" ")[0]}
                        </span>
                      </div>
                    );
                  })}
                  {dayApts.length > 3 && (
                    <div className="text-[10px] text-primary font-medium pl-1">
                      +{dayApts.length - 3} más
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-muted-foreground">
          <span className="font-medium mr-1">Estados:</span>
          {[
            { key: "scheduled", label: "Programada", color: "bg-blue-500" },
            { key: "confirmed", label: "Confirmada", color: "bg-green-500" },
            { key: "pending", label: "Pendiente", color: "bg-yellow-500" },
            { key: "completed", label: "Completada", color: "bg-gray-400" },
            { key: "cancelled", label: "Cancelada", color: "bg-red-500" },
          ].map((s) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${s.color}`} />
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* Day Detail Panel */}
      {selectedDate && (
        <div className="lg:w-[360px] w-full">
          <div className="bg-card border border-border rounded-xl p-5 sticky top-6">
            {/* Panel Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg">
                  {new Date(selectedDate + "T12:00:00").toLocaleDateString([], {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedAppointments.length === 0
                    ? "Sin citas"
                    : `${selectedAppointments.length} cita${selectedAppointments.length > 1 ? "s" : ""}`}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setSelectedDate(null)}
                >
                  <X size={16} />
                </Button>
              </div>
            </div>

            {/* Create appointment button */}
            <Button
              onClick={() => onCreateFromDate(selectedDate)}
              className="w-full mb-4 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(37,99,235,0.2)] transition-all"
              size="sm"
            >
              <Plus size={16} className="mr-1.5" /> Nueva Cita
            </Button>

            {/* Appointments list */}
            {selectedAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Clock size={32} className="mb-2 opacity-50" />
                <p className="text-sm">No hay citas este día</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
                {selectedAppointments.map((apt) => {
                  const d = new Date(apt.appointment_date);
                  return (
                    <div
                      key={apt.id}
                      className="p-3 rounded-lg bg-muted/50 border border-border/50 hover:border-muted-foreground/30 transition-all group"
                    >
                      {/* Time + Status + Actions */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-primary" />
                          <span className="font-bold text-primary">
                            {d.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border uppercase tracking-wider ${getStatusStyle(apt.appointment_status)}`}
                          >
                            {statusLabels[apt.appointment_status.toLowerCase()] ||
                              apt.appointment_status}
                          </span>
                        </div>
                      </div>

                      {/* Patient */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-7 h-7 rounded-full bg-background flex items-center justify-center shrink-0">
                          <User size={13} />
                        </div>
                        <div className="truncate">
                          <p className="text-[11px] text-muted-foreground leading-none mb-0.5">
                            Paciente
                          </p>
                          <p className="text-sm font-semibold truncate leading-tight">
                            {getPatientName(apt.patient_id)}
                          </p>
                        </div>
                      </div>

                      {/* Doctor */}
                      {apt.assigned_doctor_id && (
                        <div className="flex items-center gap-2 text-xs text-primary mb-1.5">
                          <span>👨‍⚕️</span>
                          <span className="font-medium">
                            Dr. {getDoctorName(apt.assigned_doctor_id)}
                          </span>
                        </div>
                      )}

                      {/* Notes */}
                      {apt.notes && (
                        <div className="flex items-start gap-1.5 text-xs text-muted-foreground mt-2 bg-background/50 rounded-md p-2">
                          <FileText size={12} className="mt-0.5 shrink-0" />
                          <p className="line-clamp-2">{apt.notes}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-accent"
                          onClick={() => onEdit(apt)}
                          title="Editar"
                        >
                          <Edit2 size={13} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => onDelete(apt.id)}
                          title="Eliminar"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
