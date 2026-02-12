"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Scissors,
  Calendar,
  Package,
  LogOut,
  Loader2,
  Clock,
  User,
  X,
  ChevronRight,
  Star,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Appointment {
  id: string;
  date: string;
  duration: number;
  status: string;
  totalPrice: number;
  bookingReference?: string;
  stylist: string;
  services: string[];
  canCancel?: boolean;
}

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: string;
  paymentStatus: string;
  total: number;
  itemCount: number;
  items: { name: string; quantity: number; total: number }[];
}

interface BusinessData {
  business: {
    id: string;
    name: string;
    slug: string;
    phone: string;
    address: string;
    currencySymbol: string;
  };
  client: {
    id: string;
    firstName: string;
    lastName: string;
    totalVisits: number;
    totalSpent: number;
    isVip: boolean;
  };
  upcoming: Appointment[];
  past: Appointment[];
  orders: Order[];
}

interface DashboardData {
  email: string;
  businesses: BusinessData[];
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PENDING_DEPOSIT: "bg-orange-100 text-orange-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  ARRIVED: "bg-purple-100 text-purple-800",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  AUTO_CANCELLED: "bg-red-100 text-red-800",
  NO_SHOW: "bg-gray-100 text-gray-800",
  PAID: "bg-green-100 text-green-800",
  UNPAID: "bg-amber-100 text-amber-800",
  REFUNDED: "bg-blue-100 text-blue-800",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function fmtCurrency(amount: number, symbol: string) {
  return `${symbol} ${amount.toFixed(2)}`;
}

export default function PortalDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "past" | "orders">("upcoming");
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/portal/dashboard");
      if (res.status === 401) {
        router.push("/portal");
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      router.push("/portal");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/portal/auth/logout", { method: "POST" });
    router.push("/portal");
  };

  const handleCancel = async (appointmentId: string) => {
    setCancelling(appointmentId);
    try {
      const res = await fetch(`/api/portal/appointments/${appointmentId}/cancel`, {
        method: "POST",
      });
      if (res.ok) {
        setCancelConfirm(null);
        fetchDashboard();
      }
    } catch {
      // silently fail
    } finally {
      setCancelling(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!data || data.businesses.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <p className="text-gray-500 mb-4">No salon records found for your email.</p>
            <Button onClick={handleLogout} variant="outline">Sign Out</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // For simplicity, combine all businesses into one view
  const allUpcoming = data.businesses.flatMap((b) =>
    b.upcoming.map((a) => ({ ...a, business: b.business, client: b.client }))
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const allPast = data.businesses.flatMap((b) =>
    b.past.map((a) => ({ ...a, business: b.business, client: b.client }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const allOrders = data.businesses.flatMap((b) =>
    b.orders.map((o) => ({ ...o, business: b.business, client: b.client }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const firstName = data.businesses[0]?.client.firstName || "there";

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-teal-700 to-teal-600 text-white">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Hi, {firstName}!</h1>
                <p className="text-teal-200 text-sm">{data.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Sign Out
            </Button>
          </div>

          {/* Stats */}
          {data.businesses.length === 1 && data.businesses[0].client.isVip && (
            <div className="mt-3 flex items-center gap-2">
              <Badge className="bg-amber-400/20 text-amber-200 border-amber-400/30">
                <Star className="w-3 h-3 mr-1" />
                VIP Client
              </Badge>
            </div>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex border-b border-gray-200 -mt-px">
          {[
            { key: "upcoming" as const, label: "Upcoming", icon: Calendar, count: allUpcoming.length },
            { key: "past" as const, label: "History", icon: Clock, count: allPast.length },
            { key: "orders" as const, label: "Orders", icon: Package, count: allOrders.length },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${
                tab === t.key
                  ? "border-teal-600 text-teal-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <t.icon className="w-4 h-4 inline mr-1.5" />
              {t.label}
              {t.count > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  tab === t.key ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-600"
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Upcoming Appointments */}
          {tab === "upcoming" && (
            <>
              {allUpcoming.length === 0 ? (
                <EmptyState icon={Calendar} message="No upcoming appointments" />
              ) : (
                allUpcoming.map((apt) => (
                  <Card key={apt.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">{fmtDate(apt.date)}</p>
                          <p className="text-sm text-gray-500">{fmtTime(apt.date)}</p>
                        </div>
                        <Badge className={statusColors[apt.status] || "bg-gray-100"}>
                          {apt.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <div className="space-y-1.5 text-sm text-gray-600">
                        <p><User className="w-3.5 h-3.5 inline mr-1.5" />{apt.stylist}</p>
                        <p><Scissors className="w-3.5 h-3.5 inline mr-1.5" />{apt.services.join(", ")}</p>
                        <p className="font-medium text-gray-900">
                          {fmtCurrency(apt.totalPrice, apt.business.currencySymbol)}
                        </p>
                        {data.businesses.length > 1 && (
                          <p className="text-xs text-gray-400">{apt.business.name}</p>
                        )}
                      </div>
                      {apt.canCancel && (
                        <div className="mt-3 pt-3 border-t">
                          {cancelConfirm === apt.id ? (
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                              <span className="text-sm text-gray-600 flex-1">Cancel this appointment?</span>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleCancel(apt.id)}
                                disabled={cancelling === apt.id}
                              >
                                {cancelling === apt.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Yes, Cancel"}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setCancelConfirm(null)}>
                                No
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setCancelConfirm(apt.id)}
                            >
                              <X className="w-3.5 h-3.5 mr-1" />
                              Cancel Appointment
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </>
          )}

          {/* Past Appointments */}
          {tab === "past" && (
            <>
              {allPast.length === 0 ? (
                <EmptyState icon={Clock} message="No past appointments" />
              ) : (
                allPast.map((apt) => (
                  <Card key={apt.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{fmtDate(apt.date)}</p>
                          <p className="text-sm text-gray-500">{fmtTime(apt.date)}</p>
                        </div>
                        <Badge className={statusColors[apt.status] || "bg-gray-100"}>
                          {apt.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><User className="w-3.5 h-3.5 inline mr-1.5" />{apt.stylist}</p>
                        <p><Scissors className="w-3.5 h-3.5 inline mr-1.5" />{apt.services.join(", ")}</p>
                        <p className="font-medium text-gray-900">
                          {fmtCurrency(apt.totalPrice, apt.business.currencySymbol)}
                        </p>
                        {data.businesses.length > 1 && (
                          <p className="text-xs text-gray-400">{apt.business.name}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </>
          )}

          {/* Orders */}
          {tab === "orders" && (
            <>
              {allOrders.length === 0 ? (
                <EmptyState icon={Package} message="No orders yet" />
              ) : (
                allOrders.map((ord) => (
                  <Link key={ord.id} href={`/portal/orders/${ord.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-gray-900">#{ord.orderNumber}</p>
                            <p className="text-sm text-gray-500">{fmtDate(ord.date)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={statusColors[ord.paymentStatus] || "bg-gray-100"}>
                              {ord.paymentStatus}
                            </Badge>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>{ord.itemCount} item{ord.itemCount !== 1 ? "s" : ""}</p>
                          <p className="font-medium text-gray-900">
                            {fmtCurrency(ord.total, ord.business.currencySymbol)}
                          </p>
                          {data.businesses.length > 1 && (
                            <p className="text-xs text-gray-400">{ord.business.name}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="text-center py-16">
      <Icon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p className="text-gray-500">{message}</p>
    </div>
  );
}
