"use client";

import { useState, useEffect } from "react";
import { Building2, Users, CreditCard, Clock, FileCheck, AlertTriangle, XCircle } from "lucide-react";

type Stats = {
  totalBusinesses: number;
  activeBusinesses: number;
  totalUsers: number;
  subscriptions: {
    trial: number;
    active: number;
    pastDue: number;
    cancelled: number;
    expired: number;
  };
  pendingBetaSignups: number;
};

export default function PlatformDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/platform/stats")
      .then((res) => res.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!stats) return <p className="text-gray-500">Failed to load stats.</p>;

  const cards = [
    {
      label: "Total Businesses",
      value: stats.totalBusinesses,
      sub: `${stats.activeBusinesses} active`,
      icon: Building2,
      color: "from-violet-500 to-indigo-600",
      bgColor: "bg-violet-50",
      textColor: "text-violet-600",
    },
    {
      label: "Total Users",
      value: stats.totalUsers,
      sub: "across all businesses",
      icon: Users,
      color: "from-blue-500 to-cyan-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      label: "Active Subscriptions",
      value: stats.subscriptions.active,
      sub: `${stats.subscriptions.trial} on trial`,
      icon: CreditCard,
      color: "from-emerald-500 to-teal-600",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-600",
    },
    {
      label: "On Trial",
      value: stats.subscriptions.trial,
      sub: "free trial period",
      icon: Clock,
      color: "from-amber-500 to-orange-600",
      bgColor: "bg-amber-50",
      textColor: "text-amber-600",
    },
    {
      label: "Past Due",
      value: stats.subscriptions.pastDue,
      sub: "payment failed",
      icon: AlertTriangle,
      color: "from-red-500 to-rose-600",
      bgColor: "bg-red-50",
      textColor: "text-red-600",
    },
    {
      label: "Cancelled / Expired",
      value: stats.subscriptions.cancelled + stats.subscriptions.expired,
      sub: `${stats.subscriptions.cancelled} cancelled, ${stats.subscriptions.expired} expired`,
      icon: XCircle,
      color: "from-gray-400 to-gray-500",
      bgColor: "bg-gray-50",
      textColor: "text-gray-600",
    },
    {
      label: "Pending Beta Signups",
      value: stats.pendingBetaSignups,
      sub: "awaiting review",
      icon: FileCheck,
      color: "from-pink-500 to-rose-600",
      bgColor: "bg-pink-50",
      textColor: "text-pink-600",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Platform Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of all businesses and subscriptions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-gray-200/60 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.textColor}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm font-medium text-gray-600 mt-0.5">{card.label}</p>
            <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
