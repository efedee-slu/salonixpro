"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Building2,
  Search,
  ExternalLink,
  Users,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Business = {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  country: string;
  subscriptionStatus: string;
  subscriptionPlan: string | null;
  trialEndsAt: string | null;
  isActive: boolean;
  onboardingComplete: boolean;
  createdAt: string;
  userCount: number;
  owner: { email: string; firstName: string | null; lastName: string | null } | null;
};

const STATUS_COLORS: Record<string, string> = {
  TRIAL: "bg-amber-100 text-amber-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  PAST_DUE: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-600",
  EXPIRED: "bg-gray-100 text-gray-500",
};

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter !== "ALL") params.set("status", statusFilter);

    const res = await fetch(`/api/platform/businesses?${params}`);
    const data = await res.json();
    setBusinesses(data.businesses || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const toggleActive = async (id: string, currentActive: boolean) => {
    setToggling(id);
    await fetch("/api/platform/businesses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !currentActive }),
    });
    await fetchBusinesses();
    setToggling(null);
  };

  const statuses = ["ALL", "TRIAL", "ACTIVE", "PAST_DUE", "CANCELLED", "EXPIRED"];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Businesses</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total businesses</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search businesses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-violet-100 text-violet-700"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
        </div>
      ) : businesses.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No businesses found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Business</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Owner</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Trial Ends</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Users</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Created</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((b) => (
                  <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{b.name}</p>
                        <p className="text-xs text-gray-400">{b.slug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {b.owner ? (
                        <div>
                          <p className="text-gray-700">{b.owner.firstName} {b.owner.lastName}</p>
                          <p className="text-xs text-gray-400">{b.owner.email}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Badge className={`${STATUS_COLORS[b.subscriptionStatus] || "bg-gray-100 text-gray-500"} text-[11px]`}>
                          {b.subscriptionStatus}
                        </Badge>
                        {!b.isActive && (
                          <Badge className="bg-red-100 text-red-600 text-[11px]">Disabled</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {b.trialEndsAt
                        ? new Date(b.trialEndsAt).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-gray-600">
                        <Users className="w-3.5 h-3.5" />
                        {b.userCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(b.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/platform/businesses/${b.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs">
                            <ExternalLink className="w-3.5 h-3.5 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => toggleActive(b.id, b.isActive)}
                          disabled={toggling === b.id}
                        >
                          {toggling === b.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : b.isActive ? (
                            <>
                              <ToggleRight className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                              Active
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-3.5 h-3.5 mr-1 text-gray-400" />
                              Disabled
                            </>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
