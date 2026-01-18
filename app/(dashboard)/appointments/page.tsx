// app/(dashboard)/appointments/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Sparkles,
  MoreHorizontal,
  Edit,
  Trash2,
  Check,
  X,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDuration, getStatusColor } from "@/lib/utils";
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

export default function AppointmentsPage() {
  const { data: session } = useSession();
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
      if (stylistRes.ok) setStylists(await stylistRes.json());
      if (clientRes.ok) setClients(await clientRes.json());
      if (serviceRes.ok) setServices(await serviceRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
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
      console.error("Error updating status:", error);
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground">
            Manage bookings and schedules
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="w-4 h-4 mr-2" />
          New Appointment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-teal-50">
                <CalendarIcon className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Today's Appointments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-50">
                <Check className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.confirmed}</p>
                <p className="text-sm text-muted-foreground">Confirmed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-50">
                <Sparkles className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-50">
                <span className="text-lg font-bold text-purple-600">EC$</span>
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.revenue)}</p>
                <p className="text-sm text-muted-foreground">Today's Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrev}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant={isToday ? "default" : "outline"}
                onClick={handleToday}
                className={isToday ? "bg-teal-600 hover:bg-teal-700" : ""}
              >
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={handleNext}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <h2 className="text-lg font-semibold ml-4">{formatDateHeader()}</h2>
            </div>

            {/* View Toggle */}
            <div className="flex gap-2">
              <Button
                variant={view === "day" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("day")}
                className={view === "day" ? "bg-teal-600 hover:bg-teal-700" : ""}
              >
                Day
              </Button>
              <Button
                variant={view === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("week")}
                className={view === "week" ? "bg-teal-600 hover:bg-teal-700" : ""}
              >
                Week
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {appointments.length} {appointments.length === 1 ? "Appointment" : "Appointments"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No appointments</h3>
              <p className="text-muted-foreground mb-4">
                No appointments scheduled for this {view === "day" ? "day" : "week"}
              </p>
              <Button onClick={() => setAddDialogOpen(true)} className="bg-teal-600 hover:bg-teal-700">
                <Plus className="w-4 h-4 mr-2" />
                New Appointment
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                .map((appointment) => (
                  <motion.div
                    key={appointment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 p-4 rounded-xl border hover:bg-accent/50 transition-colors"
                  >
                    {/* Time */}
                    <div className="w-20 shrink-0 text-center">
                      <p className="text-lg font-bold">
                        {new Date(appointment.startTime).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDuration(
                          appointment.services.reduce((sum, s) => sum + s.service.duration, 0)
                        )}
                      </p>
                    </div>

                    {/* Client Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">
                          {appointment.client.firstName} {appointment.client.lastName}
                        </p>
                        <Badge variant={getStatusColor(appointment.status) as any}>
                          {statusOptions.find((s) => s.value === appointment.status)?.label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-1">
                        {appointment.services.map((s, i) => (
                          <span key={i} className="text-sm text-muted-foreground">
                            {s.service.name}
                            {i < appointment.services.length - 1 && ", "}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        with {appointment.stylist.firstName} {appointment.stylist.lastName}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="text-right shrink-0">
                      <p className="font-bold text-teal-600">
                        {formatCurrency(Number(appointment.totalPrice))}
                      </p>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {appointment.status === "PENDING" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStatusChange(appointment.id, "CONFIRMED")}
                          title="Confirm"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      {appointment.status === "CONFIRMED" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStatusChange(appointment.id, "IN_PROGRESS")}
                          title="Start"
                          className="text-orange-600 hover:text-orange-700"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      )}
                      {appointment.status === "IN_PROGRESS" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStatusChange(appointment.id, "COMPLETED")}
                          title="Complete"
                          className="text-emerald-600 hover:text-emerald-700"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(appointment)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(appointment)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

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
