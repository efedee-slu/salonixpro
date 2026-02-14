"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Mail,
  Phone,
  MapPin,
  Building2,
  MessageSquare,
  Loader2,
  Filter,
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
  approvedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
};

type Stats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
};

export default function BetaAdminPage() {
  const [signups, setSignups] = useState<BetaSignup[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const fetchSignups = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/beta?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSignups(data.signups);
      setStats(data.stats);
    } catch (err) {
      console.error("Failed to fetch beta signups:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchSignups();
  }, [fetchSignups]);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/beta`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (!res.ok) throw new Error("Failed");
      await fetchSignups();
    } catch (err) {
      console.error(`Failed to ${action} signup:`, err);
    } finally {
      setActionLoading(null);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 font-medium">Pending</Badge>;
      case "APPROVED":
        return <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 font-medium">Approved</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="border-red-300 bg-red-50 text-red-700 font-medium">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Beta Signups</h1>
        <p className="text-gray-500 mt-1">Manage beta program applications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Signups", value: stats.total, icon: Users, color: "text-gray-600", bg: "bg-gray-100" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
          { label: "Approved", value: stats.approved, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100" },
          { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-red-600", bg: "bg-red-100" },
        ].map((s) => (
          <div key={s.label} className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or salon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          {["ALL", "PENDING", "APPROVED", "REJECTED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === s
                  ? "bg-teal-50 text-teal-700 border border-teal-200"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
        </div>
      ) : signups.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No beta signups found</p>
          <p className="text-gray-400 text-sm mt-1">
            {statusFilter !== "ALL" ? "Try changing the filter" : "Signups will appear here"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {signups.map((signup) => (
            <div
              key={signup.id}
              className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{signup.name}</h3>
                    {statusBadge(signup.status)}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{signup.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span>{signup.salonName}</span>
                    </div>
                    {signup.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>{signup.phone}</span>
                      </div>
                    )}
                    {signup.country && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>{signup.country}</span>
                      </div>
                    )}
                    {signup.salonSize && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>{signup.salonSize} staff</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                      <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span>Signed up {formatDate(signup.createdAt)}</span>
                    </div>
                  </div>

                  {signup.message && (
                    <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600">{signup.message}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {signup.status === "PENDING" && (
                  <div className="flex gap-2 lg:flex-col">
                    <Button
                      size="sm"
                      onClick={() => handleAction(signup.id, "approve")}
                      disabled={actionLoading === signup.id}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {actionLoading === signup.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-1.5" />
                          Approve
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction(signup.id, "reject")}
                      disabled={actionLoading === signup.id}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-1.5" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
