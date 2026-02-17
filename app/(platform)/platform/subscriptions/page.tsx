"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CreditCard,
  Search,
  Filter,
  Loader2,
  Building2,
  Clock,
  ExternalLink,
  X,
  Send,
  Trash2,
  AlertTriangle,
  CalendarPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type SubBusiness = {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  subscriptionStatus: string;
  subscriptionPlan: string | null;
  trialEndsAt: string | null;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  paypalSubscriptionId: string | null;
  isActive: boolean;
  isPlatform: boolean;
  createdAt: string;
  owner: { email: string; firstName: string | null; lastName: string | null } | null;
};

const STATUS_COLORS: Record<string, string> = {
  TRIAL: "bg-amber-100 text-amber-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  PAST_DUE: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-600",
  EXPIRED: "bg-gray-100 text-gray-500",
};

export default function SubscriptionsPage() {
  const [businesses, setBusinesses] = useState<SubBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Manual Activate modal
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedBizId, setSelectedBizId] = useState("");
  const [plan, setPlan] = useState("monthly");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  // Extend Trial modal
  const [extendTarget, setExtendTarget] = useState<SubBusiness | null>(null);
  const [extendDays, setExtendDays] = useState(30);
  const [extendCustomDate, setExtendCustomDate] = useState("");
  const [extendMode, setExtendMode] = useState<"days" | "custom">("days");
  const [extending, setExtending] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<SubBusiness | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Invite modal
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    salonName: "",
    ownerName: "",
    phone: "",
    betaDuration: 30,
    personalMessage: "",
  });
  const [inviteSaving, setInviteSaving] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    const res = await fetch(`/api/platform/subscriptions?${params}`);
    const data = await res.json();
    setBusinesses(data.businesses || []);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-set end date when plan changes
  useEffect(() => {
    if (startDate) {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setMonth(end.getMonth() + (plan === "yearly" ? 12 : 1));
      setEndDate(end.toISOString().split("T")[0]);
    }
  }, [plan, startDate]);

  const handleManualActivate = async () => {
    if (!selectedBizId) return;
    setSaving(true);
    await fetch("/api/platform/subscriptions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: selectedBizId,
        subscriptionStatus: "ACTIVE",
        subscriptionPlan: plan,
        subscriptionStartDate: new Date(startDate).toISOString(),
        subscriptionEndDate: new Date(endDate).toISOString(),
        notes,
      }),
    });
    setSaving(false);
    setShowModal(false);
    setSelectedBizId("");
    setNotes("");
    fetchData();
  };

  const handleExtend = async () => {
    if (!extendTarget) return;
    setExtending(true);
    await fetch(`/api/platform/businesses/${extendTarget.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        extendMode === "custom"
          ? { customDate: extendCustomDate }
          : { extendDays }
      ),
    });
    setExtending(false);
    setExtendTarget(null);
    setExtendDays(30);
    setExtendCustomDate("");
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleteConfirmName !== deleteTarget.name) return;
    setDeleting(true);
    await fetch(`/api/platform/businesses/${deleteTarget.id}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteTarget(null);
    setDeleteConfirmName("");
    fetchData();
  };

  const handleInvite = async () => {
    setInviteError("");
    setInviteSuccess("");
    if (!inviteForm.email || !inviteForm.salonName || !inviteForm.ownerName) {
      setInviteError("Email, salon name, and owner name are required.");
      return;
    }
    setInviteSaving(true);
    try {
      const res = await fetch("/api/platform/beta/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.error || "Failed to send invitation.");
      } else {
        setInviteSuccess(data.message || "Invitation sent!");
        setTimeout(() => {
          setShowInvite(false);
          setInviteForm({ email: "", salonName: "", ownerName: "", phone: "", betaDuration: 30, personalMessage: "" });
          setInviteSuccess("");
          fetchData();
        }, 2000);
      }
    } catch {
      setInviteError("Failed to send invitation. Please try again.");
    }
    setInviteSaving(false);
  };

  const statuses = ["ALL", "TRIAL", "ACTIVE", "PAST_DUE", "CANCELLED", "EXPIRED"];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
          <p className="text-sm text-gray-500 mt-1">Manage business subscriptions</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="text-violet-600 border-violet-200 hover:bg-violet-50"
            onClick={() => setShowInvite(true)}
          >
            <Send className="w-4 h-4 mr-2" />
            Send Beta Invite
          </Button>
          <Button
            className="bg-violet-600 hover:bg-violet-700 text-white"
            onClick={() => setShowModal(true)}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Manual Activate
          </Button>
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
          <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No subscriptions found</p>
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
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Plan</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Trial Ends</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Sub End</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((b) => (
                  <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{b.name}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {b.owner?.email || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`${STATUS_COLORS[b.subscriptionStatus]} text-[11px]`}>
                        {b.subscriptionStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{b.subscriptionPlan || "-"}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {b.trialEndsAt ? new Date(b.trialEndsAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {b.subscriptionEndDate ? new Date(b.subscriptionEndDate).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/platform/businesses/${b.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs">
                            <ExternalLink className="w-3.5 h-3.5 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          onClick={() => setExtendTarget(b)}
                        >
                          <CalendarPlus className="w-3.5 h-3.5 mr-1" />
                          Extend
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            setSelectedBizId(b.id);
                            setShowModal(true);
                          }}
                        >
                          <CreditCard className="w-3.5 h-3.5 mr-1" />
                          Activate
                        </Button>
                        {!b.isPlatform && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteTarget(b)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Activate Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Manual Subscription Activation</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business</label>
                <select
                  value={selectedBizId}
                  onChange={(e) => setSelectedBizId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                >
                  <option value="">Select a business...</option>
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.subscriptionStatus})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPlan("monthly")}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      plan === "monthly"
                        ? "border-violet-500 bg-violet-50 text-violet-700"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Monthly ($12/mo)
                  </button>
                  <button
                    onClick={() => setPlan("yearly")}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      plan === "yearly"
                        ? "border-violet-500 bg-violet-50 text-violet-700"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Yearly ($100/yr)
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="e.g., Paid via bank transfer"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-violet-600 hover:bg-violet-700 text-white" onClick={handleManualActivate} disabled={!selectedBizId || saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
                Activate Subscription
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Extend Trial Modal */}
      {extendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Extend Trial</h2>
              <button onClick={() => setExtendTarget(null)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-gray-900">{extendTarget.name}</p>
              <p className="text-xs text-gray-500">
                Current trial ends: {extendTarget.trialEndsAt ? new Date(extendTarget.trialEndsAt).toLocaleDateString() : "Not set"}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setExtendMode("days")}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    extendMode === "days"
                      ? "border-violet-500 bg-violet-50 text-violet-700"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Extend by days
                </button>
                <button
                  onClick={() => setExtendMode("custom")}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    extendMode === "custom"
                      ? "border-violet-500 bg-violet-50 text-violet-700"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Custom date
                </button>
              </div>

              {extendMode === "days" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Extend by</label>
                  <select
                    value={extendDays}
                    onChange={(e) => setExtendDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  >
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                    <option value={60}>60 days</option>
                    <option value={90}>90 days</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New trial end date</label>
                  <input
                    type="date"
                    value={extendCustomDate}
                    onChange={(e) => setExtendCustomDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setExtendTarget(null)}>Cancel</Button>
              <Button
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                onClick={handleExtend}
                disabled={extending || (extendMode === "custom" && !extendCustomDate)}
              >
                {extending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CalendarPlus className="w-4 h-4 mr-2" />}
                Extend Trial
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Delete Business</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This will permanently remove the business, all its users, services, appointments, clients, products, and orders. This action cannot be undone.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type <strong>{deleteTarget.name}</strong> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder={deleteTarget.name}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setDeleteTarget(null); setDeleteConfirmName(""); }}>Cancel</Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete} disabled={deleteConfirmName !== deleteTarget.name || deleting}>
                {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Delete Forever
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Send Beta Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Send Beta Invitation</h2>
              <button onClick={() => { setShowInvite(false); setInviteError(""); setInviteSuccess(""); }} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {inviteError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{inviteError}</div>
            )}
            {inviteSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">{inviteSuccess}</div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <input type="email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} placeholder="owner@salon.com" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salon Name *</label>
                <input type="text" value={inviteForm.salonName} onChange={(e) => setInviteForm({ ...inviteForm, salonName: e.target.value })} placeholder="Beautiful Hair Studio" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name *</label>
                <input type="text" value={inviteForm.ownerName} onChange={(e) => setInviteForm({ ...inviteForm, ownerName: e.target.value })} placeholder="Jane Smith" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input type="tel" value={inviteForm.phone} onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })} placeholder="+1 (758) 555-0123" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beta Duration</label>
                <select value={inviteForm.betaDuration} onChange={(e) => setInviteForm({ ...inviteForm, betaDuration: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20">
                  <option value={14}>14 days</option>
                  <option value={30}>30 days (default)</option>
                  <option value={60}>60 days</option>
                  <option value={90}>90 days</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Personal Message (optional)</label>
                <textarea value={inviteForm.personalMessage} onChange={(e) => setInviteForm({ ...inviteForm, personalMessage: e.target.value })} placeholder="We'd love for you to try SalonixPro..." rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => { setShowInvite(false); setInviteError(""); setInviteSuccess(""); }}>Cancel</Button>
              <Button className="flex-1 bg-violet-600 hover:bg-violet-700 text-white" onClick={handleInvite} disabled={inviteSaving || !!inviteSuccess}>
                {inviteSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Send Invitation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
