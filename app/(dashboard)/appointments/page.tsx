// app/(dashboard)/appointments/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  Edit,
  Trash2,
  Check,
  X,
  Play,
  Users,
  DollarSign,
  CheckCircle2,
  MapPin,
  CalendarPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDuration, getStatusColor, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { AddAppointmentDialog } from "./add-appointment-dialog";
import { EditAppointmentDialog } from "./edit-appointment-dialog";
import { DeleteAppointmentDialog } from "./delete-appointment-dialog";

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  totalPrice: number;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  stylist: {
    id: string;
    firstName: string;
    lastName: string;
  };
  services: {
    service: {
      id: string;
      name: string;
      duration: number;
      price: number;
    };
  }[];
}

interface Stylist {
  id: string;
  firstName: string;
  lastName: string;
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

const statusOptions = [
  { value: "PENDING", label: "Pending", color: "warning" },
  { value: "CONFIRMED", label: "Confirmed", color: "info" },
  { value: "ARRIVED", label: "Arrived", color: "purple" },
  { value: "IN_PROGRESS", label: "In Progress", color: "warning" },
  { value: "COMPLETED", label: "Completed", color: "success" },
  { value: "CANCELLED", label: "Cancelled", color: "danger" },
  { value: "NO_SHOW", label: "No Show", color: "danger" },
];

const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  PENDING: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Pending" },
  CONFIRMED: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", label: "Confirmed" },
  ARRIVED: { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500", label: "Arrived" },
  IN_PROGRESS: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500", label: "In Progress" },
  COMPLETED: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Completed" },
  CANCELLED: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500", label: "Cancelled" },
  NO_SHOW: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500", label: "No Show" },
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"day" | "week">("day");

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const { toast } = useToast();

  // Fetch data
  const fetchData = async () => {
    try {
      const dateStr = currentDate.toISOString().split("T")[0];

      const [apptRes, stylistRes, clientRes, serviceRes] = await Promise.all([
        fetch(`/api/appointments?date=${dateStr}&view=${view}`),
        fetch("/api/stylists"),
        fetch("/api/clients"),
        fetch("/api/services"),
      ]);

      if (apptRes.ok) {
        const data = await apptRes.json();
        setAppointments(data);
      }
      if (stylistRes.ok) {
        const json = await stylistRes.json();
        setStylists(json.data ?? json);
      }
      if (clientRes.ok) {
        const json = await clientRes.json();
        setClients(json.data ?? json);
      }
      if (serviceRes.ok) {
        const json = await serviceRes.json();
        setServices(json.data ?? json);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentDate, view]);

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (view === "day") {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === "day") {
      newDate.setDate(newDate.getDate() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setEditDialogOpen(true);
  };

  const handleDelete = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDeleteDialogOpen(true);
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update appointment status",
        variant: "destructive",
      });
    }
  };

  const handleSuccess = () => {
    fetchData();
  };

  const formatDateHeader = () => {
    if (view === "day") {
      return currentDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return `${startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  };

  const isToday = currentDate.toDateString() === new Date().toDateString();

  const stats = {
    total: appointments.length,
    confirmed: appointments.filter((a) => a.status === "CONFIRMED").length,
    completed: appointments.filter((a) => a.status === "COMPLETED").length,
    revenue: appointments
      .filter((a) => a.status === "COMPLETED")
      .reduce((sum, a) => sum + Number(a.totalPrice), 0),
  };

  const statCards = [
    {
      name: "Total Appointments",
      value: stats.total,
      icon: CalendarIcon,
      iconBg: "bg-gradient-to-br from-indigo-500 to-blue-600",
      glowColor: "shadow-indigo-500/20 hover:shadow-indigo-500/30",
      accentColor: "from-indigo-500/10 via-transparent to-transparent",
    },
    {
      name: "Confirmed",
      value: stats.confirmed,
      icon: CheckCircle2,
      iconBg: "bg-gradient-to-br from-blue-500 to-cyan-600",
      glowColor: "shadow-blue-500/20 hover:shadow-blue-500/30",
      accentColor: "from-blue-500/10 via-transparent to-transparent",
    },
    {
      name: "Completed",
      value: stats.completed,
      icon: Sparkles,
      iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
      glowColor: "shadow-emerald-500/20 hover:shadow-emerald-500/30",
      accentColor: "from-emerald-500/10 via-transparent to-transparent",
    },
    {
      name: "Revenue",
      value: formatCurrency(stats.revenue),
      icon: DollarSign,
      iconBg: "bg-gradient-to-br from-violet-500 to-purple-600",
      glowColor: "shadow-violet-500/20 hover:shadow-violet-500/30",
      accentColor: "from-violet-500/10 via-transparent to-transparent",
    },
  ];

  return (
    <div className="space-y-5 max-w-[1400px]">

      {/* ═══════ GRADIENT BANNER ═══════ */}
      <div className="animate-in stagger-1 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#1e40af] p-8 lg:p-10 shadow-2xl shadow-indigo-900/20 ring-1 ring-white/10">
        <div className="absolute inset-0 shimmer pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-indigo-400/15 blur-3xl animate-float" />
          <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-blue-400/10 blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full bg-cyan-400/10 blur-2xl animate-float-slow" />
          <div className="absolute top-8 right-16 w-16 h-16 border border-white/[0.08] rounded-2xl rotate-12 animate-float" />
          <div className="absolute top-1/2 right-8 w-10 h-10 border border-white/[0.06] rounded-xl rotate-45 animate-float-delayed" />
          <div className="absolute bottom-8 right-1/3 w-20 h-20 border border-white/[0.05] rounded-full animate-float-slow" />
          <div className="absolute top-4 left-1/3 w-6 h-6 bg-white/[0.04] rounded-lg rotate-12 animate-float" />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }} />
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <p className="text-indigo-200/60 text-xs font-semibold tracking-widest uppercase">Schedule</p>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight text-glow leading-[1.1]">
              Appointments
            </h1>
            <p className="text-indigo-100/50 mt-3 text-[15px] leading-relaxed max-w-lg">
              Manage your bookings, track schedules, and keep your day running smoothly.
            </p>
          </div>
          <Button
            onClick={() => setAddDialogOpen(true)}
            size="lg"
            className="glow-button bg-white text-indigo-700 hover:bg-white/95 font-bold shadow-2xl shadow-black/20 h-12 px-8 text-[15px] rounded-xl border-0 shrink-0"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* ═══════ STAT CARDS ═══════ */}
      <div className="grid gap-5 grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <div
            key={stat.name}
            className={cn(
              "animate-in glass-card glow-border group cursor-default p-6",
              stat.glowColor,
              `stagger-${index + 2}`
            )}
          >
            <div className={cn("absolute top-0 left-0 right-0 h-24 bg-gradient-to-b pointer-events-none", stat.accentColor)} />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110",
                  stat.iconBg
                )}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              {isLoading ? (
                <div className="h-10 w-24 skeleton-shimmer" />
              ) : (
                <p className="text-4xl font-black text-gray-900 tracking-tight leading-none number-display">
                  {stat.value}
                </p>
              )}
              <p className="text-[13px] text-gray-500 mt-2 font-semibold">{stat.name}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ═══════ CALENDAR CONTROLS ═══════ */}
      <div className="animate-in stagger-6 bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="h-[3px] bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500" />
        <div className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrev}
                className="rounded-xl border-gray-200 ring-1 ring-gray-200/50 hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant={isToday ? "default" : "outline"}
                onClick={handleToday}
                className={cn(
                  "rounded-xl font-semibold",
                  isToday
                    ? "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg shadow-indigo-600/20"
                    : "border-gray-200 ring-1 ring-gray-200/50"
                )}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                className="rounded-xl border-gray-200 ring-1 ring-gray-200/50 hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <h2 className="text-base font-bold text-gray-900 ml-3 tracking-tight">{formatDateHeader()}</h2>
            </div>

            <div className="flex gap-1 bg-gray-100/80 p-1 rounded-xl">
              <button
                onClick={() => setView("day")}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200",
                  view === "day"
                    ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                Day
              </button>
              <button
                onClick={() => setView("week")}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200",
                  view === "week"
                    ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                Week
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ APPOINTMENTS LIST ═══════ */}
      <div className="animate-in stagger-7">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500" />
          <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">
                {isLoading ? "Loading..." : `${appointments.length} ${appointments.length === 1 ? "Appointment" : "Appointments"}`}
              </h3>
              <p className="text-sm text-gray-400 mt-0.5 font-medium">
                {view === "day" ? "Today's schedule" : "This week's schedule"}
              </p>
            </div>
          </div>

          <div>
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-20 h-12 skeleton-shimmer" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 skeleton-shimmer w-1/3" />
                      <div className="h-3 skeleton-shimmer w-1/2" />
                      <div className="h-3 skeleton-shimmer w-1/4" />
                    </div>
                    <div className="w-20 h-8 skeleton-shimmer" />
                  </div>
                ))}
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-16 px-4 m-6">
                <div className="inline-flex flex-col items-center border-2 border-dashed border-indigo-200/60 rounded-2xl px-12 py-10 bg-gradient-to-br from-indigo-50/30 to-slate-50/50">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center mb-5 ring-1 ring-indigo-200/50 shadow-lg shadow-indigo-500/10">
                    <CalendarIcon className="w-10 h-10 text-indigo-500" />
                  </div>
                  <p className="text-gray-900 font-black text-lg tracking-tight">No appointments scheduled</p>
                  <p className="text-sm text-gray-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
                    No appointments for this {view === "day" ? "day" : "week"}. Book one now!
                  </p>
                  <Button
                    onClick={() => setAddDialogOpen(true)}
                    className="mt-5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold shadow-lg shadow-indigo-600/20 h-10 px-6 text-sm"
                  >
                    <CalendarPlus className="w-4 h-4 mr-2" />
                    Book Appointment
                  </Button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100/60">
                {appointments
                  .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                  .map((appointment, i) => {
                    const clientName = `${appointment.client.firstName} ${appointment.client.lastName}`;
                    const initials = clientName.split(" ").map((n: string) => n[0]).join("");
                    const serviceNames = appointment.services.map((s) => s.service.name).join(", ");
                    const totalDuration = appointment.services.reduce((sum, s) => sum + s.service.duration, 0);
                    const stylistName = `${appointment.stylist.firstName} ${appointment.stylist.lastName}`;
                    const sc = statusConfig[appointment.status] || { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-400", label: appointment.status };

                    return (
                      <motion.div
                        key={appointment.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.3 }}
                        className="flex items-stretch hover:bg-gray-50/60 transition-colors duration-150 group/row"
                      >
                        {/* Time column */}
                        <div className="w-24 lg:w-28 shrink-0 flex flex-col items-center justify-center py-5 px-3 border-r border-gray-100/60 relative">
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white ring-2 ring-indigo-400 z-10" />
                          <p className="text-lg font-black text-gray-900 leading-none number-display">
                            {new Date(appointment.startTime).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </p>
                          <p className="text-[11px] text-gray-400 font-medium mt-1 flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            {formatDuration(totalDuration)}
                          </p>
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex items-center gap-4 py-4 px-5">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md shadow-indigo-500/15 shrink-0 group-hover/row:scale-105 transition-transform">
                            <span className="text-[11px] font-bold text-white">{initials}</span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="font-semibold text-gray-900 text-sm truncate">{clientName}</p>
                              <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ring-1 ring-current/10", sc.bg, sc.text)}>
                                <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                                {sc.label}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 truncate">{serviceNames}</p>
                            <p className="text-xs text-gray-400 truncate mt-0.5 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {stylistName}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-lg font-black text-gray-900 number-display">
                              {formatCurrency(Number(appointment.totalPrice))}
                            </p>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity duration-200">
                            {appointment.status === "PENDING" && (
                              <button
                                onClick={() => handleStatusChange(appointment.id, "CONFIRMED")}
                                title="Confirm"
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            {appointment.status === "CONFIRMED" && (
                              <button
                                onClick={() => handleStatusChange(appointment.id, "IN_PROGRESS")}
                                title="Start"
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-orange-600 hover:bg-orange-50 transition-colors"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                            )}
                            {appointment.status === "IN_PROGRESS" && (
                              <button
                                onClick={() => handleStatusChange(appointment.id, "COMPLETED")}
                                title="Complete"
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition-colors"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleEdit(appointment)}
                              title="Edit"
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(appointment)}
                              title="Delete"
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <AddAppointmentDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        stylists={stylists}
        clients={clients}
        services={services}
        selectedDate={currentDate}
        onSuccess={handleSuccess}
      />

      {selectedAppointment && (
        <>
          <EditAppointmentDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            appointment={selectedAppointment}
            stylists={stylists}
            clients={clients}
            services={services}
            onSuccess={handleSuccess}
          />
          <DeleteAppointmentDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            appointment={selectedAppointment}
            onSuccess={handleSuccess}
          />
        </>
      )}
    </div>
  );
}
