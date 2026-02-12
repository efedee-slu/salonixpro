// components/dashboard/pending-confirmations.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  Check,
  X,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Scissors,
  Phone,
  Mail,
  Loader2,
  RefreshCw,
  CreditCard,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface PendingDeposit {
  id: string;
  bookingReference: string;
  requestedDate: string;
  totalPrice: number;
  depositAmount: number | null;
  depositStatus: string;
  paymentDeadline: string | null;
  paymentSubmittedAt: string | null;
  timeRemaining: string | null;
  isExpired: boolean;
  isUrgent: boolean;
  client: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
  };
  services: {
    serviceName: string;
    price: number;
  }[];
  stylist: {
    firstName: string;
    lastName: string;
  } | null;
}

interface PendingDepositsData {
  submitted: PendingDeposit[];
  pending: PendingDeposit[];
  expired: PendingDeposit[];
  counts: {
    submitted: number;
    pending: number;
    expired: number;
    total: number;
  };
}

export function PendingConfirmations() {
  const [data, setData] = useState<PendingDepositsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingDeposits();
    const interval = setInterval(fetchPendingDeposits, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingDeposits = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const response = await fetch("/api/appointments/pending-deposits");
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleAction = async (appointmentId: string, action: "confirm" | "reject" | "waive") => {
    setProcessingId(appointmentId);
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/deposit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        toast({
          title: action === "confirm" ? "Payment Confirmed" : action === "waive" ? "Deposit Waived" : "Booking Cancelled",
          description: action === "confirm"
            ? "The booking has been confirmed"
            : action === "waive"
            ? "Deposit requirement has been waived"
            : "The booking has been cancelled and slot reopened",
        });
        fetchPendingDeposits();
      } else {
        throw new Error("Failed to process action");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process action",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-amber-50/40 to-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="h-[3px] bg-gradient-to-r from-amber-500 via-orange-500 to-red-400" />
        <div className="bg-gradient-to-r from-amber-50/60 to-orange-50/40 px-6 py-5 border-b border-amber-100/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 ring-1 ring-amber-200/50">
              <CreditCard className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Pending Confirmations</h3>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
        </div>
      </div>
    );
  }

  if (!data || data.counts.total === 0) {
    return (
      <div className="bg-gradient-to-br from-amber-50/40 to-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="h-[3px] bg-gradient-to-r from-amber-500 via-orange-500 to-red-400" />
        <div className="bg-gradient-to-r from-amber-50/60 to-orange-50/40 px-6 py-5 border-b border-amber-100/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 ring-1 ring-amber-200/50">
              <CreditCard className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Pending Confirmations</h3>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center mx-auto mb-3 ring-1 ring-emerald-200/50">
            <Check className="w-7 h-7 text-emerald-500" />
          </div>
          <p className="font-bold text-gray-700">All caught up!</p>
          <p className="text-sm text-gray-400 mt-1">No pending confirmations right now</p>
        </div>
      </div>
    );
  }

  const renderDepositCard = (deposit: PendingDeposit, type: "submitted" | "pending" | "expired") => {
    const isExpanded = expandedId === deposit.id;
    const isProcessing = processingId === deposit.id;

    const borderColor =
      type === "submitted" ? "border-l-orange-400" :
      type === "expired" ? "border-l-red-400" :
      deposit.isUrgent ? "border-l-amber-400" :
      "border-l-gray-200";

    return (
      <div
        key={deposit.id}
        className={cn(
          "rounded-xl overflow-hidden border-l-4 ring-1 ring-black/[0.03] shadow-sm transition-all duration-200 hover:shadow-md",
          "bg-slate-50",
          borderColor
        )}
      >
        {/* Header */}
        <div
          className="p-4 cursor-pointer hover:bg-slate-100/60 transition-colors"
          onClick={() => setExpandedId(isExpanded ? null : deposit.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono font-bold text-sm text-gray-800">{deposit.bookingReference}</span>
                {type === "submitted" && (
                  <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 ring-1 ring-orange-200/50 animate-badge-pulse">
                    Payment Submitted
                  </span>
                )}
                {type === "expired" && (
                  <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-100 text-red-700 ring-1 ring-red-200/50">
                    Expired
                  </span>
                )}
                {deposit.isUrgent && type === "pending" && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 ring-1 ring-amber-200/50 animate-badge-pulse">
                    <AlertTriangle className="w-3 h-3" />
                    Urgent
                  </span>
                )}
              </div>
              <p className="font-semibold text-gray-900">
                {deposit.client.firstName} {deposit.client.lastName}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                {deposit.services.map(s => s.serviceName).join(", ")}
              </p>
              {/* Inline Approve/Decline buttons */}
              {type !== "expired" && (
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction(deposit.id, "confirm");
                    }}
                    disabled={isProcessing}
                    className="h-7 px-3 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        Approve
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction(deposit.id, "reject");
                    }}
                    disabled={isProcessing}
                    className="h-7 px-3 text-[11px] font-bold rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 ring-1 ring-red-200/50"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Decline
                  </Button>
                </div>
              )}
            </div>
            <div className="text-right ml-4">
              <p className="font-black text-teal-600 text-lg number-display">
                ${deposit.depositAmount?.toFixed(2)}
              </p>
              {deposit.timeRemaining && !deposit.isExpired && (
                <p className={cn(
                  "text-xs flex items-center gap-1 justify-end mt-0.5",
                  deposit.isUrgent ? "text-amber-600 font-bold" : "text-gray-400"
                )}>
                  <Clock className="w-3 h-3" />
                  {deposit.timeRemaining} left
                </p>
              )}
              <div className="mt-2">
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 mx-auto text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 mx-auto text-gray-400" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t border-gray-100/80">
            <div className="p-4 space-y-4 bg-gray-50/30">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Appointment</p>
                  <p className="font-semibold text-gray-800 mt-0.5">{formatDate(deposit.requestedDate)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Total Price</p>
                  <p className="font-semibold text-gray-800 mt-0.5">${deposit.totalPrice.toFixed(2)}</p>
                </div>
                {deposit.stylist && (
                  <div>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Stylist</p>
                    <p className="font-semibold text-gray-800 mt-0.5 flex items-center gap-1">
                      <Scissors className="w-3 h-3 text-gray-400" />
                      {deposit.stylist.firstName} {deposit.stylist.lastName}
                    </p>
                  </div>
                )}
                {deposit.paymentDeadline && (
                  <div>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Deadline</p>
                    <p className="font-semibold text-gray-800 mt-0.5">{formatDate(deposit.paymentDeadline)}</p>
                  </div>
                )}
              </div>

              {/* Contact Info */}
              <div className="flex gap-4 text-sm pt-3 border-t border-gray-100">
                <a
                  href={`tel:${deposit.client.phone}`}
                  className="flex items-center gap-1.5 text-teal-600 hover:text-teal-700 font-medium transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  {deposit.client.phone}
                </a>
                {deposit.client.email && (
                  <a
                    href={`mailto:${deposit.client.email}`}
                    className="flex items-center gap-1.5 text-teal-600 hover:text-teal-700 font-medium transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </a>
                )}
              </div>

              {deposit.paymentSubmittedAt && (
                <div className="text-sm bg-emerald-50 text-emerald-700 p-3 rounded-xl font-medium ring-1 ring-emerald-200/50">
                  Payment submitted {formatDate(deposit.paymentSubmittedAt)}
                </div>
              )}

              {/* Action Buttons */}
              {type !== "expired" && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction(deposit.id, "confirm");
                    }}
                    disabled={isProcessing}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-semibold shadow-sm shadow-emerald-600/20"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-1.5" />
                        Confirm Payment
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction(deposit.id, "waive");
                    }}
                    disabled={isProcessing}
                    className="rounded-xl font-semibold ring-1 ring-gray-200/50"
                  >
                    Waive
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction(deposit.id, "reject");
                    }}
                    disabled={isProcessing}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl ring-1 ring-red-200/50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {type === "expired" && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction(deposit.id, "confirm");
                    }}
                    disabled={isProcessing}
                    className="flex-1 rounded-xl font-semibold ring-1 ring-gray-200/50"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-1.5" />
                        Confirm Anyway
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction(deposit.id, "reject");
                    }}
                    disabled={isProcessing}
                    className="rounded-xl font-semibold shadow-sm shadow-red-600/20"
                  >
                    <Ban className="w-4 h-4 mr-1.5" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-amber-50/40 to-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
      {/* Gradient header bar */}
      <div className="h-[3px] bg-gradient-to-r from-amber-500 via-orange-500 to-red-400" />
      {/* Header with amber gradient */}
      <div className="bg-gradient-to-r from-amber-50/60 to-orange-50/40 px-6 py-5 border-b border-amber-100/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 ring-1 ring-amber-200/50">
              <CreditCard className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Pending Confirmations</h3>
            {data.counts.total > 0 && (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 ring-1 ring-amber-200/50 animate-badge-pulse">
                {data.counts.total}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchPendingDeposits(true)}
            disabled={isRefreshing}
            className="rounded-xl hover:bg-amber-100/50 text-gray-400 hover:text-gray-600"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-5">
        {/* Submitted Payments - Need Action */}
        {data.submitted.length > 0 && (
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-orange-600 mb-3 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Payments Submitted ({data.counts.submitted})
            </h4>
            <div className="space-y-3">
              {data.submitted.map((d) => renderDepositCard(d, "submitted"))}
            </div>
          </div>
        )}

        {/* Pending Payments - Awaiting Customer */}
        {data.pending.length > 0 && (
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-3">
              Awaiting Payment ({data.counts.pending})
            </h4>
            <div className="space-y-3">
              {data.pending.map((d) => renderDepositCard(d, "pending"))}
            </div>
          </div>
        )}

        {/* Expired */}
        {data.expired.length > 0 && (
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-500 mb-3">
              Expired ({data.counts.expired})
            </h4>
            <div className="space-y-3">
              {data.expired.map((d) => renderDepositCard(d, "expired"))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
