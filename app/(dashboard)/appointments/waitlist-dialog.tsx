// app/(dashboard)/appointments/waitlist-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import { Loader2, Clock, X, Bell, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

interface WaitlistEntry {
  id: string;
  clientId: string | null;
  stylistId: string;
  requestedDate: string;
  duration: number;
  serviceIds: string[];
  serviceNames: string[];
  status: string;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  notifiedAt: string | null;
  bookedAt: string | null;
  createdAt: string;
  client: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
  } | null;
  stylist: {
    firstName: string;
    lastName: string;
  };
}

interface WaitlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-blue-100 text-blue-800",
  NOTIFIED: "bg-amber-100 text-amber-800",
  BOOKED: "bg-green-100 text-green-800",
  EXPIRED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-100 text-red-800",
};

export function WaitlistDialog({ open, onOpenChange }: WaitlistDialogProps) {
  const { toast } = useToast();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ACTIVE");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchEntries = async () => {
    setIsLoading(true);
    try {
      const statusParam = filter === "ALL" ? "" : `&status=${filter}`;
      const response = await fetch(`/api/waitlist?limit=100${statusParam}`);
      if (response.ok) {
        const data = await response.json();
        setEntries(data.data);
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load waitlist",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchEntries();
  }, [open, filter]);

  const handleCancel = async (id: string) => {
    setActionLoading(id);
    try {
      const response = await fetch(`/api/waitlist/${id}`, { method: "DELETE" });
      if (response.ok) {
        toast({ title: "Cancelled", description: "Waitlist entry cancelled." });
        fetchEntries();
      }
    } catch {
      toast({ title: "Error", description: "Failed to cancel entry", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRenotify = async (id: string) => {
    setActionLoading(id);
    try {
      const response = await fetch(`/api/waitlist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "renotify" }),
      });
      if (response.ok) {
        toast({ title: "Re-notified", description: "Client has been notified again." });
        fetchEntries();
      }
    } catch {
      toast({ title: "Error", description: "Failed to re-notify", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const getName = (entry: WaitlistEntry) => {
    if (entry.client) return `${entry.client.firstName} ${entry.client.lastName}`;
    return entry.guestName || "Unknown";
  };

  const getContact = (entry: WaitlistEntry) => {
    if (entry.client) return entry.client.email || entry.client.phone;
    return entry.guestEmail || entry.guestPhone || "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            Waitlist
          </DialogTitle>
          <DialogDescription>
            Clients waiting for cancelled or available slots.
          </DialogDescription>
        </DialogHeader>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b pb-3">
          {["ACTIVE", "NOTIFIED", "ALL"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === tab
                  ? "bg-teal-600 text-white"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >
              {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Entries */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No waitlist entries</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm">{getName(entry)}</p>
                    <Badge className={`text-xs ${statusColors[entry.status] || ""}`}>
                      {entry.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{getContact(entry)}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>
                      {new Date(entry.requestedDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      at{" "}
                      {new Date(entry.requestedDate).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                    <span>with {entry.stylist.firstName} {entry.stylist.lastName}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {entry.serviceNames.join(", ")}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">
                    Added {new Date(entry.createdAt).toLocaleDateString()}
                    {entry.notifiedAt && ` · Notified ${new Date(entry.notifiedAt).toLocaleDateString()}`}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {(entry.status === "ACTIVE" || entry.status === "NOTIFIED") && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Re-notify"
                      onClick={() => handleRenotify(entry.id)}
                      disabled={actionLoading === entry.id}
                      className="text-amber-600 hover:text-amber-700"
                    >
                      {actionLoading === entry.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                  {entry.status !== "CANCELLED" && entry.status !== "BOOKED" && entry.status !== "EXPIRED" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Cancel"
                      onClick={() => handleCancel(entry.id)}
                      disabled={actionLoading === entry.id}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
