// components/dashboard/pending-confirmations.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Check,
  X,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  User,
  Scissors,
  Phone,
  Mail,
  Loader2,
  RefreshCw,
  CreditCard,
  Ban,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

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
    // Refresh every 30 seconds
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
      console.error("Error fetching pending deposits:", error);
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-teal-600" />
            Pending Confirmations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.counts.total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-teal-600" />
            Pending Confirmations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Check className="w-12 h-12 mx-auto mb-2 text-green-500" />
            <p>No pending confirmations</p>
            <p className="text-sm">All deposit payments are up to date</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderDepositCard = (deposit: PendingDeposit, type: "submitted" | "pending" | "expired") => {
    const isExpanded = expandedId === deposit.id;
    const isProcessing = processingId === deposit.id;

    return (
      <motion.div
        key={deposit.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`border rounded-lg overflow-hidden ${
          type === "submitted" 
            ? "border-orange-200 bg-orange-50/50" 
            : type === "expired"
            ? "border-red-200 bg-red-50/50"
            : deposit.isUrgent 
            ? "border-amber-200 bg-amber-50/50" 
            : "border-gray-200"
        }`}
      >
        {/* Header */}
        <div 
          className="p-4 cursor-pointer"
          onClick={() => setExpandedId(isExpanded ? null : deposit.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono font-bold text-sm">{deposit.bookingReference}</span>
                {type === "submitted" && (
                  <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                    Payment Submitted
                  </Badge>
                )}
                {type === "expired" && (
                  <Badge variant="destructive">Expired</Badge>
                )}
                {deposit.isUrgent && type === "pending" && (
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Urgent
                  </Badge>
                )}
              </div>
              <p className="font-medium">
                {deposit.client.firstName} {deposit.client.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                {deposit.services.map(s => s.serviceName).join(", ")}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-teal-600">
                ${deposit.depositAmount?.toFixed(2)}
              </p>
              {deposit.timeRemaining && !deposit.isExpired && (
                <p className={`text-xs ${deposit.isUrgent ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
                  <Clock className="w-3 h-3 inline mr-1" />
                  {deposit.timeRemaining} left
                </p>
              )}
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 mt-2 mx-auto text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 mt-2 mx-auto text-muted-foreground" />
              )}
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t"
            >
              <div className="p-4 space-y-3 bg-white/50">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Appointment</p>
                    <p className="font-medium">{formatDate(deposit.requestedDate)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Price</p>
                    <p className="font-medium">${deposit.totalPrice.toFixed(2)}</p>
                  </div>
                  {deposit.stylist && (
                    <div>
                      <p className="text-muted-foreground">Stylist</p>
                      <p className="font-medium flex items-center gap-1">
                        <Scissors className="w-3 h-3" />
                        {deposit.stylist.firstName} {deposit.stylist.lastName}
                      </p>
                    </div>
                  )}
                  {deposit.paymentDeadline && (
                    <div>
                      <p className="text-muted-foreground">Deadline</p>
                      <p className="font-medium">{formatDate(deposit.paymentDeadline)}</p>
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="flex gap-4 text-sm pt-2 border-t">
                  <a 
                    href={`tel:${deposit.client.phone}`}
                    className="flex items-center gap-1 text-teal-600 hover:text-teal-700"
                  >
                    <Phone className="w-4 h-4" />
                    {deposit.client.phone}
                  </a>
                  {deposit.client.email && (
                    <a 
                      href={`mailto:${deposit.client.email}`}
                      className="flex items-center gap-1 text-teal-600 hover:text-teal-700"
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </a>
                  )}
                </div>

                {deposit.paymentSubmittedAt && (
                  <div className="text-sm bg-green-50 text-green-700 p-2 rounded">
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
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-1" />
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
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
                      className="flex-1"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-1" />
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
                    >
                      <Ban className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-teal-600" />
            Pending Confirmations
            {data.counts.total > 0 && (
              <Badge variant="secondary" className="ml-2">
                {data.counts.total}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchPendingDeposits(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Submitted Payments - Need Action */}
        {data.submitted.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-orange-700 mb-2 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              Payments Submitted ({data.counts.submitted})
            </h4>
            <div className="space-y-2">
              {data.submitted.map((d) => renderDepositCard(d, "submitted"))}
            </div>
          </div>
        )}

        {/* Pending Payments - Awaiting Customer */}
        {data.pending.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Awaiting Payment ({data.counts.pending})
            </h4>
            <div className="space-y-2">
              {data.pending.map((d) => renderDepositCard(d, "pending"))}
            </div>
          </div>
        )}

        {/* Expired */}
        {data.expired.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-red-600 mb-2">
              Expired ({data.counts.expired})
            </h4>
            <div className="space-y-2">
              {data.expired.map((d) => renderDepositCard(d, "expired"))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
