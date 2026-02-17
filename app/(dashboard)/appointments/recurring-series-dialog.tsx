// app/(dashboard)/appointments/recurring-series-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Loader2, Repeat, Pause, Play, Plus, X, ChevronDown, ChevronUp,
  Calendar, AlertTriangle, User, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, formatDuration } from "@/lib/utils";

interface RecurringSeriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface RecurringSeries {
  id: string;
  frequency: string;
  timeOfDay: string;
  totalOccurrences: number;
  generatedCount: number;
  status: string;
  notes: string | null;
  autoExtend: boolean;
  startDate: string;
  createdAt: string;
  client: { id: string; firstName: string; lastName: string; phone: string };
  stylist: { id: string; firstName: string; lastName: string } | null;
  services: { service: { id: string; name: string; duration: number; price: number } }[];
  appointments: { id: string; requestedDate: string; status: string; recurringIndex: number }[];
  appointmentCount: number;
  nextAppointment: { requestedDate: string } | null;
}

export function RecurringSeriesDialog({ open, onOpenChange, onSuccess }: RecurringSeriesDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [series, setSeries] = useState<RecurringSeries[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [extendingId, setExtendingId] = useState<string | null>(null);
  const [extendCount, setExtendCount] = useState(4);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSeries = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const res = await fetch(`/api/recurring-series?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSeries(data.data || []);
      }
    } catch {
      toast({ title: "Error", description: "Failed to load recurring series", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchSeries();
  }, [open, statusFilter]);

  const handlePauseResume = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/recurring-series/${id}/pause`, { method: "PATCH" });
      if (res.ok) {
        const data = await res.json();
        toast({ title: "Success", description: `Series ${data.status === "PAUSED" ? "paused" : "resumed"}` });
        fetchSeries();
        onSuccess();
      }
    } catch {
      toast({ title: "Error", description: "Failed to update series", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleExtend = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/recurring-series/${id}/extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ additionalOccurrences: extendCount }),
      });
      if (res.ok) {
        const data = await res.json();
        toast({
          title: "Series extended",
          description: `Added ${data.created} appointments${data.skipped > 0 ? `, ${data.skipped} skipped` : ""}`,
        });
        setExtendingId(null);
        fetchSeries();
        onSuccess();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to extend series", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/recurring-series/${id}`, { method: "DELETE" });
      if (res.ok) {
        const data = await res.json();
        toast({
          title: "Series cancelled",
          description: `Cancelled ${data.cancelledAppointments} future appointments`,
        });
        setConfirmCancelId(null);
        fetchSeries();
        onSuccess();
      }
    } catch {
      toast({ title: "Error", description: "Failed to cancel series", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const freqLabel = (f: string) => f === "WEEKLY" ? "Weekly" : f === "BIWEEKLY" ? "Biweekly" : "Monthly";

  const statusColor = (s: string) => {
    switch (s) {
      case "ACTIVE": return "bg-emerald-100 text-emerald-700";
      case "PAUSED": return "bg-amber-100 text-amber-700";
      case "CANCELLED": return "bg-red-100 text-red-700";
      case "COMPLETED": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const apptStatusColor = (s: string) => {
    switch (s) {
      case "CONFIRMED": return "bg-blue-100 text-blue-700";
      case "COMPLETED": return "bg-emerald-100 text-emerald-700";
      case "CANCELLED": case "AUTO_CANCELLED": return "bg-red-100 text-red-700";
      case "PENDING": return "bg-amber-100 text-amber-700";
      case "IN_PROGRESS": return "bg-orange-100 text-orange-700";
      case "NO_SHOW": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const tabs = ["ALL", "ACTIVE", "PAUSED", "CANCELLED"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="w-5 h-5 text-teal-600" />
            Recurring Series
          </DialogTitle>
          <DialogDescription>
            Manage recurring appointment series
          </DialogDescription>
        </DialogHeader>

        {/* Status filter tabs */}
        <div className="flex gap-1 border-b pb-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                statusFilter === tab
                  ? "bg-teal-100 text-teal-700 font-medium"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >
              {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Series list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : series.length === 0 ? (
          <div className="text-center py-12">
            <Repeat className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No recurring series found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {series.map((s) => {
              const completedCount = s.appointments.filter((a) =>
                ["COMPLETED"].includes(a.status)
              ).length;
              const totalServices = s.services.reduce((sum, svc) => sum + Number(svc.service.price), 0);

              return (
                <div key={s.id} className="border rounded-xl overflow-hidden">
                  {/* Header */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-semibold">
                            {s.client.firstName} {s.client.lastName}
                          </p>
                          <Badge className={`text-xs ${statusColor(s.status)}`}>
                            {s.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {freqLabel(s.frequency)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                          {s.stylist && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {s.stylist.firstName} {s.stylist.lastName}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {s.timeOfDay}
                          </span>
                          <span>{s.services.map((sv) => sv.service.name).join(", ")}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm">
                          <span className="text-muted-foreground">
                            Progress: {completedCount}/{s.appointmentCount}
                          </span>
                          {s.nextAppointment && (
                            <span className="text-teal-600 font-medium flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Next: {new Date(s.nextAppointment.requestedDate).toLocaleDateString("en-US", {
                                month: "short", day: "numeric",
                              })}
                            </span>
                          )}
                          <span className="font-medium text-teal-600">
                            {formatCurrency(totalServices)}/appt
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                        className="text-xs"
                      >
                        {expandedId === s.id ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                        {expandedId === s.id ? "Hide" : "View"} Appointments
                      </Button>
                      {(s.status === "ACTIVE" || s.status === "PAUSED") && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePauseResume(s.id)}
                            disabled={actionLoading === s.id}
                            className="text-xs"
                          >
                            {actionLoading === s.id ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : s.status === "ACTIVE" ? (
                              <Pause className="w-3 h-3 mr-1" />
                            ) : (
                              <Play className="w-3 h-3 mr-1" />
                            )}
                            {s.status === "ACTIVE" ? "Pause" : "Resume"}
                          </Button>
                          {s.status === "ACTIVE" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setExtendingId(extendingId === s.id ? null : s.id)}
                              className="text-xs"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Extend
                            </Button>
                          )}
                          {confirmCancelId === s.id ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-destructive font-medium">Cancel series?</span>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleCancel(s.id)}
                                disabled={actionLoading === s.id}
                                className="text-xs h-7"
                              >
                                {actionLoading === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Yes"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setConfirmCancelId(null)}
                                className="text-xs h-7"
                              >
                                No
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setConfirmCancelId(s.id)}
                              className="text-xs text-destructive hover:text-destructive"
                            >
                              <X className="w-3 h-3 mr-1" />
                              Cancel
                            </Button>
                          )}
                        </>
                      )}
                    </div>

                    {/* Extend input */}
                    {extendingId === s.id && (
                      <div className="flex items-center gap-2 mt-2 p-2 bg-muted rounded-lg">
                        <span className="text-sm">Add</span>
                        <Input
                          type="number"
                          min={1}
                          max={52}
                          value={extendCount}
                          onChange={(e) => setExtendCount(parseInt(e.target.value) || 4)}
                          className="w-20 h-8"
                        />
                        <span className="text-sm">appointments</span>
                        <Button
                          size="sm"
                          onClick={() => handleExtend(s.id)}
                          disabled={actionLoading === s.id}
                          className="bg-teal-600 hover:bg-teal-700 h-8"
                        >
                          {actionLoading === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirm"}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Expanded appointment list */}
                  {expandedId === s.id && (
                    <div className="border-t bg-muted/30 p-3 max-h-48 overflow-y-auto">
                      <div className="space-y-1">
                        {s.appointments.map((appt) => (
                          <div
                            key={appt.id}
                            className="flex items-center justify-between py-1.5 px-2 rounded text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground w-6">#{appt.recurringIndex}</span>
                              <span>
                                {new Date(appt.requestedDate).toLocaleDateString("en-US", {
                                  weekday: "short", month: "short", day: "numeric",
                                })}
                              </span>
                              <span className="text-muted-foreground">
                                {new Date(appt.requestedDate).toLocaleTimeString("en-US", {
                                  hour: "numeric", minute: "2-digit", hour12: true,
                                })}
                              </span>
                            </div>
                            <Badge className={`text-xs ${apptStatusColor(appt.status)}`}>
                              {appt.status.replace("_", " ")}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
