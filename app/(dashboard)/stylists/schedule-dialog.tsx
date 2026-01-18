// app/(dashboard)/stylists/schedule-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import { Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface StylistSchedule {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isWorking: boolean;
}

interface Stylist {
  id: string;
  firstName: string;
  lastName: string;
  schedules: StylistSchedule[];
}

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stylist: Stylist;
  onSuccess: () => void;
}

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const defaultSchedule: StylistSchedule[] = [
  { dayOfWeek: 0, startTime: "09:00", endTime: "18:00", isWorking: false },
  { dayOfWeek: 1, startTime: "09:00", endTime: "18:00", isWorking: true },
  { dayOfWeek: 2, startTime: "09:00", endTime: "18:00", isWorking: true },
  { dayOfWeek: 3, startTime: "09:00", endTime: "18:00", isWorking: true },
  { dayOfWeek: 4, startTime: "09:00", endTime: "18:00", isWorking: true },
  { dayOfWeek: 5, startTime: "09:00", endTime: "18:00", isWorking: true },
  { dayOfWeek: 6, startTime: "09:00", endTime: "18:00", isWorking: false },
];

export function ScheduleDialog({ open, onOpenChange, stylist, onSuccess }: ScheduleDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [schedules, setSchedules] = useState<StylistSchedule[]>(defaultSchedule);

  useEffect(() => {
    if (stylist?.schedules?.length > 0) {
      // Merge existing schedules with defaults
      const merged = defaultSchedule.map((def) => {
        const existing = stylist.schedules.find((s) => s.dayOfWeek === def.dayOfWeek);
        return existing || def;
      });
      setSchedules(merged);
    } else {
      setSchedules(defaultSchedule);
    }
  }, [stylist]);

  const updateSchedule = (dayOfWeek: number, field: keyof StylistSchedule, value: any) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/stylists/${stylist.id}/schedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedules }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update schedule");
      }

      toast({
        title: "Schedule updated",
        description: `${stylist.firstName}'s schedule has been updated.`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update schedule",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" />
            {stylist.firstName}'s Schedule
          </DialogTitle>
          <DialogDescription>
            Set the working hours for each day of the week.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {schedules.map((schedule) => (
              <div
                key={schedule.dayOfWeek}
                className={`flex items-center gap-4 p-3 rounded-lg border ${
                  schedule.isWorking ? "bg-teal-50/50 border-teal-200" : "bg-muted/50"
                }`}
              >
                {/* Day Toggle */}
                <div className="flex items-center gap-2 w-28">
                  <input
                    type="checkbox"
                    id={`day-${schedule.dayOfWeek}`}
                    checked={schedule.isWorking}
                    onChange={(e) => updateSchedule(schedule.dayOfWeek, "isWorking", e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-teal-600"
                  />
                  <Label
                    htmlFor={`day-${schedule.dayOfWeek}`}
                    className={`font-medium ${!schedule.isWorking ? "text-muted-foreground" : ""}`}
                  >
                    {dayNames[schedule.dayOfWeek]}
                  </Label>
                </div>

                {/* Time Inputs */}
                {schedule.isWorking ? (
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground">From</Label>
                      <input
                        type="time"
                        value={schedule.startTime}
                        onChange={(e) => updateSchedule(schedule.dayOfWeek, "startTime", e.target.value)}
                        className="px-2 py-1 text-sm border rounded-md bg-background"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground">To</Label>
                      <input
                        type="time"
                        value={schedule.endTime}
                        onChange={(e) => updateSchedule(schedule.dayOfWeek, "endTime", e.target.value)}
                        className="px-2 py-1 text-sm border rounded-md bg-background"
                      />
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Day off</span>
                )}
              </div>
            ))}
          </div>

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
                  Saving...
                </>
              ) : (
                "Save Schedule"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
