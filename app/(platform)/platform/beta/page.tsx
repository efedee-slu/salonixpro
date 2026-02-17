"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FileCheck,
  Search,
  Mail,
  Phone,
  MapPin,
  Building2,
  MessageSquare,
  Loader2,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type BetaSignup = {
  id: string;
  name: string;
  email: string;
  salonName: string;
  phone: string | null;
  country: string | null;
  salonSize: string | null;
  message: string | null;
  status: string;
  createdAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
};

type Stats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
};

const STATUS_ICONS: Record<string, typeof Clock> = {
  PENDING: Clock,
  APPROVED: CheckCircle2,
  REJECTED: XCircle,
};

export default function PlatformBetaPage() {
  const [signups, setSignups] = useState<BetaSignup[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSignups = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter !== "ALL") params.set("status", statusFilter);

    const res = await fetch(`/api/platform/beta?${params}`);
    const data = await res.json();
    setSignups(data.signups || []);
    setStats(data.stats || { total: 0, pending: 0, approved: 0, rejected: 0 });
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    fetchSignups();
  }, [fetchSignups]);

  const handleReject = async (id: string) => {
    setActionLoading(id);
    await fetch("/api/platform/beta", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "reject" }),
    });
    await fetchSignups();
    setActionLoading(null);
  };

  const statCards = [
    { label: "Total", value: stats.total, icon: Users, color: "text-violet-600 bg-violet-50" },
    { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-600 bg-amber-50" },
    { label: "Approved", value: stats.approved, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
    { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-red-600 bg-red-50" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Beta Signups</h1>
        <p className="text-sm text-gray-500 mt-1">Beta signups are automatically approved and accounts are created instantly</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200/60 p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500">{card.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or salon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          {["ALL", "PENDING", "APPROVED", "REJECTED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-violet-100 text-violet-700"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
        </div>
      ) : signups.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No beta signups found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Salon</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Owner</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Phone</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Location</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Staff</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {signups.map((s) => {
                  const Icon = STATUS_ICONS[s.status] || Clock;
                  return (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{s.salonName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{s.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Mail className="w-3.5 h-3.5" />
                          {s.email}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {s.phone ? (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Phone className="w-3.5 h-3.5" />
                            {s.phone}
                          </div>
                        ) : "-"}
                      </td>
                      <td className="px-4 py-3">
                        {s.country ? (
                          <div className="flex items-center gap-1 text-gray-600">
                            <MapPin className="w-3.5 h-3.5" />
                            {s.country}
                          </div>
                        ) : "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{s.salonSize || "-"}</td>
                      <td className="px-4 py-3">
                        <Badge className={`${STATUS_COLORS[s.status]} text-[11px]`}>
                          <Icon className="w-3 h-3 mr-1" />
                          {s.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {s.status === "APPROVED" && (
                            <Button variant="ghost" size="sm" className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleReject(s.id)} disabled={actionLoading === s.id}>
                              {actionLoading === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5 mr-1" />}
                              Reject
                            </Button>
                          )}
                          {s.status === "PENDING" && (
                            <Button variant="ghost" size="sm" className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleReject(s.id)} disabled={actionLoading === s.id}>
                              {actionLoading === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5 mr-1" />}
                              Reject
                            </Button>
                          )}
                          {s.message && (
                            <Button variant="ghost" size="sm" className="text-xs" title={s.message}>
                              <MessageSquare className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
