// app/(dashboard)/appointments/add-appointment-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, X, Repeat, Info, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDuration } from "@/lib/utils";

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

interface AddAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stylists: Stylist[];
  clients: Client[];
  services: Service[];
  selectedDate: Date;
  onSuccess: () => void;
}

export function AddAppointmentDialog({
  open,
  onOpenChange,
  stylists,
  clients,
  services,
  selectedDate,
  onSuccess,
}: AddAppointmentDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientId: "",
    stylistId: "",
    date: "",
    time: "09:00",
    notes: "",
  });
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<string>("WEEKLY");
  const [recurringOccurrences, setRecurringOccurrences] = useState(4);
  const [autoExtend, setAutoExtend] = useState(false);
  const [showWaitlistPrompt, setShowWaitlistPrompt] = useState(false);
  const [isAddingToWaitlist, setIsAddingToWaitlist] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData((prev) => ({
        ...prev,
        date: selectedDate.toISOString().split("T")[0],
      }));
    }
  }, [open, selectedDate]);

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
    setErrors((prev) => ({ ...prev, services: "" }));
  };

  const totalDuration = selectedServices.reduce((sum, id) => {
    const service = services.find((s) => s.id === id);
    return sum + (service?.duration || 0);
  }, 0);

  const totalPrice = selectedServices.reduce((sum, id) => {
    const service = services.find((s) => s.id === id);
    return sum + Number(service?.price || 0);
  }, 0);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.clientId) newErrors.clientId = "Please select a client";
    if (!formData.stylistId) newErrors.stylistId = "Please select a stylist";
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.time) newErrors.time = "Time is required";
    if (selectedServices.length === 0) newErrors.services = "Please select at least one service";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    try {
      if (isRecurring) {
        // Create recurring series
        const response = await fetch("/api/recurring-series", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: formData.clientId,
            stylistId: formData.stylistId,
            serviceIds: selectedServices,
            frequency: recurringFrequency,
            dayOfWeek: new Date(`${formData.date}T${formData.time}`).getDay(),
            timeOfDay: formData.time,
            occurrences: recurringOccurrences,
            notes: formData.notes || null,
            startDate: `${formData.date}T${formData.time}`,
            autoExtend,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create recurring series");
        }

        const data = await response.json();
        const skippedMsg = data.skipped > 0 ? `, ${data.skipped} skipped due to conflicts` : "";
        toast({
          title: "Recurring series created",
          description: `Created ${data.created} appointments${skippedMsg}`,
        });
      } else {
        const startTime = new Date(`${formData.date}T${formData.time}`);
        const endTime = new Date(startTime.getTime() + totalDuration * 60000);

        const response = await fetch("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: formData.clientId,
            stylistId: formData.stylistId,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            notes: formData.notes || null,
            serviceIds: selectedServices,
            totalPrice,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          // Detect conflict (409 or overlap-related error)
          if (response.status === 409 || (error.message || error.error || "").toLowerCase().includes("overlap") || (error.message || error.error || "").toLowerCase().includes("conflict")) {
            setShowWaitlistPrompt(true);
            setIsLoading(false);
            return;
          }
          throw new Error(error.message || "Failed to create appointment");
        }

        toast({
          title: "Appointment booked",
          description: "The appointment has been created successfully.",
        });
      }

      // Reset form
      setFormData({
        clientId: "",
        stylistId: "",
        date: selectedDate.toISOString().split("T")[0],
        time: "09:00",
        notes: "",
      });
      setSelectedServices([]);
      setIsRecurring(false);
      setRecurringFrequency("WEEKLY");
      setRecurringOccurrences(4);
      setAutoExtend(false);
      setShowWaitlistPrompt(false);

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create appointment",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToWaitlist = async () => {
    setIsAddingToWaitlist(true);
    try {
      const requestedDate = new Date(`${formData.date}T${formData.time}`);
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: formData.clientId,
          stylistId: formData.stylistId,
          requestedDate: requestedDate.toISOString(),
          serviceIds: selectedServices,
        }),
      });

      if (response.ok) {
        toast({
          title: "Added to waitlist",
          description: `Client added to waitlist for ${requestedDate.toLocaleDateString()} at ${requestedDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`,
        });
        setShowWaitlistPrompt(false);
        onOpenChange(false);
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to add to waitlist");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add to waitlist",
        variant: "destructive",
      });
    } finally {
      setIsAddingToWaitlist(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Appointment</DialogTitle>
          <DialogDescription>
            Book a new appointment for a client.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="clientId">Client *</Label>
            <select
              id="clientId"
              value={formData.clientId}
              onChange={(e) => { setFormData({ ...formData, clientId: e.target.value }); setErrors((prev) => ({ ...prev, clientId: "" })); }}
              className={`w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring ${errors.clientId ? "border-red-500" : "border-input"}`}
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.firstName} {client.lastName} - {client.phone}
                </option>
              ))}
            </select>
            {errors.clientId && <p className="text-xs text-red-500">{errors.clientId}</p>}
          </div>

          {/* Stylist Selection */}
          <div className="space-y-2">
            <Label htmlFor="stylistId">Stylist *</Label>
            <select
              id="stylistId"
              value={formData.stylistId}
              onChange={(e) => { setFormData({ ...formData, stylistId: e.target.value }); setErrors((prev) => ({ ...prev, stylistId: "" })); }}
              className={`w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring ${errors.stylistId ? "border-red-500" : "border-input"}`}
            >
              <option value="">Select a stylist</option>
              {stylists.map((stylist) => (
                <option key={stylist.id} value={stylist.id}>
                  {stylist.firstName} {stylist.lastName}
                </option>
              ))}
            </select>
            {errors.stylistId && <p className="text-xs text-red-500">{errors.stylistId}</p>}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Services Selection */}
          <div className="space-y-2">
            <Label>Services *</Label>
            {errors.services && <p className="text-xs text-red-500">{errors.services}</p>}
            <div className={`border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2 ${errors.services ? "border-red-500" : ""}`}>
              {services.length === 0 ? (
                <p className="text-sm text-muted-foreground">No services available</p>
              ) : (
                services.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedServices.includes(service.id)
                        ? "border-teal-600 bg-teal-50"
                        : "hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedServices.includes(service.id)}
                        onChange={() => {}}
                        className="w-4 h-4 rounded border-gray-300 text-teal-600"
                      />
                      <div>
                        <p className="font-medium text-sm">{service.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDuration(service.duration)}
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold text-teal-600">
                      {formatCurrency(service.price)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Selected Services Summary */}
          {selectedServices.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-teal-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">{selectedServices.length} service(s) selected</p>
                <p className="text-xs text-muted-foreground">
                  Total duration: {formatDuration(totalDuration)}
                </p>
              </div>
              <p className="text-lg font-bold text-teal-600">
                {formatCurrency(totalPrice)}
              </p>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any special requests or notes..."
              className="w-full min-h-[60px] px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Recurring Options */}
          <div className="space-y-3 border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-teal-600" />
                <Label htmlFor="recurring" className="font-medium cursor-pointer">
                  Make this recurring
                </Label>
                <div className="relative group">
                  <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    Automatically schedule multiple appointments at regular intervals
                  </div>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isRecurring}
                onClick={() => setIsRecurring(!isRecurring)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isRecurring ? "bg-teal-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isRecurring ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {isRecurring && (
              <div className="space-y-3 pt-2 border-t">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="frequency" className="text-sm">Frequency</Label>
                    <select
                      id="frequency"
                      value={recurringFrequency}
                      onChange={(e) => setRecurringFrequency(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="WEEKLY">Weekly</option>
                      <option value="BIWEEKLY">Biweekly</option>
                      <option value="MONTHLY">Monthly</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="occurrences" className="text-sm">Occurrences</Label>
                    <Input
                      id="occurrences"
                      type="number"
                      min={2}
                      max={52}
                      value={recurringOccurrences}
                      onChange={(e) => setRecurringOccurrences(parseInt(e.target.value) || 4)}
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="autoExtend" className="text-sm cursor-pointer">
                      Auto-extend when ending
                    </Label>
                    <div className="relative group">
                      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        Automatically add more appointments when the series is about to end
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={autoExtend}
                    onClick={() => setAutoExtend(!autoExtend)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      autoExtend ? "bg-teal-600" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        autoExtend ? "translate-x-4.5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Waitlist Prompt */}
          {showWaitlistPrompt && (
            <div className="p-4 rounded-lg border-2 border-amber-300 bg-amber-50 space-y-3">
              <div className="flex items-start gap-2">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">This time slot is already booked</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Would you like to add this client to the waitlist? They'll be notified if the slot opens up.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleAddToWaitlist}
                  disabled={isAddingToWaitlist}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {isAddingToWaitlist ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 mr-2" />
                      Add to Waitlist
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowWaitlistPrompt(false)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-teal-600 hover:bg-teal-700">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isRecurring ? "Creating series..." : "Booking..."}
                </>
              ) : isRecurring ? (
                <>
                  <Repeat className="w-4 h-4 mr-2" />
                  Create {recurringOccurrences} Appointments
                </>
              ) : (
                "Book Appointment"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
