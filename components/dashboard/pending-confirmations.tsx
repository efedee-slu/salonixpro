// components/dashboard/pending-confirmations.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Check,
  X,
  Loader2,
  RefreshCw,
  CreditCard,
  ChevronDown,
  Phone,
  Mail,
  Scissors,
} from "lucide-react";
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 px-5 py-4">
          <CreditCard className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-900">Pending Confirmations</span>
        </div>
        <div className="border-t border-gray-100" />
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!data || data.counts.total === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 px-5 py-4">
          <CreditCard className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-900">Pending Confirmations</span>
        </div>
        <div className="border-t border-gray-100" />
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">All caught up — no pending confirmations.</p>
        </div>
      </div>
    );
  }

  const allItems: { deposit: PendingDeposit; type: "submitted" | "pending" | "expired" }[] = [
    ...data.submitted.map((d) => ({ deposit: d, type: "submitted" as const })),
    ...data.pending.map((d) => ({ deposit: d, type: "pending" as const })),
    ...data.expired.map((d) => ({ deposit: d, type: "expired" as const })),
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-900">Pending Confirmations</span>
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
            {data.counts.total}
          </span>
        </div>
        <button
          onClick={() => fetchPendingDeposits(true)}
          disabled={isRefreshing}
          className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
        </button>
      </div>

      {/* Rows */}
      <div className="border-t border-gray-100">
        {allItems.map(({ deposit, type }, i) => {
          const isProcessing = processingId === deposit.id;
          const isExpanded = expandedId === deposit.id;
          const isLast = i === allItems.length - 1;

          const dotColor =
            type === "submitted" ? "bg-amber-400" :
            type === "expired" ? "bg-red-400" :
            deposit.isUrgent ? "bg-amber-400" :
            "bg-gray-300";

          return (
            <div key={deposit.id}>
              <div className={cn(
                "flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 transition-colors",
                !isLast && !isExpanded && "border-b border-gray-100"
              )}>
                {/* Status dot */}
                <div className={cn("w-2 h-2 rounded-full shrink-0", dotColor)} />

                {/* Client name */}
                <span className="text-sm font-medium text-gray-900 w-36 truncate shrink-0">
                  {deposit.client.firstName} {deposit.client.lastName}
                </span>

                {/* Services */}
                <span className="text-sm text-gray-500 truncate flex-1 hidden sm:block">
                  {deposit.services.map((s) => s.serviceName).join(", ")}
                </span>

                {/* Amount */}
                <span className="text-sm font-semibold text-gray-900 tabular-nums shrink-0">
                  ${deposit.depositAmount?.toFixed(2)}
                </span>

                {/* Approve */}
                <button
                  onClick={() => handleAction(deposit.id, "confirm")}
                  disabled={isProcessing}
                  className="h-7 px-2.5 text-xs font-medium rounded-md bg-gray-900 text-white hover:bg-gray-800 transition-colors disabled:opacity-50 shrink-0"
                >
                  {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : "Approve"}
                </button>

                {/* Decline */}
                <button
                  onClick={() => handleAction(deposit.id, "reject")}
                  disabled={isProcessing}
                  className="h-7 px-2.5 text-xs font-medium rounded-md text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-200 transition-colors disabled:opacity-50 shrink-0"
                >
                  Decline
                </button>

                {/* Expand toggle */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : deposit.id)}
                  className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                >
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isExpanded && "rotate-180")} />
                </button>
              </div>

              {/* Expanded detail row */}
              {isExpanded && (
                <div className={cn(
                  "px-5 pb-3 pt-1 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500",
                  !isLast && "border-b border-gray-100"
                )}>
                  <span>Ref: {deposit.bookingReference}</span>
                  <span>{formatDate(deposit.requestedDate)}</span>
                  <span>Total: ${deposit.totalPrice.toFixed(2)}</span>
                  {deposit.stylist && (
                    <span className="flex items-center gap-1">
                      <Scissors className="w-3 h-3" />
                      {deposit.stylist.firstName} {deposit.stylist.lastName}
                    </span>
                  )}
                  {deposit.timeRemaining && !deposit.isExpired && (
                    <span>{deposit.timeRemaining} left</span>
                  )}
                  <a href={`tel:${deposit.client.phone}`} className="text-teal-600 hover:text-teal-700 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {deposit.client.phone}
                  </a>
                  {deposit.client.email && (
                    <a href={`mailto:${deposit.client.email}`} className="text-teal-600 hover:text-teal-700 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      Email
                    </a>
                  )}
                  {deposit.paymentSubmittedAt && (
                    <span className="text-emerald-600 font-medium">Paid {formatDate(deposit.paymentSubmittedAt)}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
