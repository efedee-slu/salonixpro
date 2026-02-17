"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Users,
  Calendar,
  Scissors,
  UserCircle,
  CreditCard,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type BusinessDetail = {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  country: string;
  city: string | null;
  currency: string;
  currencySymbol: string;
  subscriptionStatus: string;
  subscriptionPlan: string | null;
  trialEndsAt: string | null;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  paypalSubscriptionId: string | null;
  isActive: boolean;
  onboardingComplete: boolean;
  createdAt: string;
  _count: {
    users: number;
    clients: number;
    appointments: number;
    services: number;
    stylists: number;
  };
  users: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
    isActive: boolean;
    createdAt: string;
  }[];
};

const STATUS_COLORS: Record<string, string> = {
  TRIAL: "bg-amber-100 text-amber-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  PAST_DUE: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-600",
  EXPIRED: "bg-gray-100 text-gray-500",
};

export default function BusinessDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [extendDays, setExtendDays] = useState(30);

  useEffect(() => {
    fetch(`/api/platform/businesses/${id}`)
      .then((res) => res.json())
      .then((data) => setBusiness(data.business))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const toggleActive = async () => {
    if (!business) return;
    setSaving(true);
    await fetch(`/api/platform/businesses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !business.isActive }),
    });
    setBusiness({ ...business, isActive: !business.isActive });
    setSaving(false);
  };

  const extendTrial = async () => {
    if (!business) return;
    setSaving(true);
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + extendDays);
    await fetch(`/api/platform/businesses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trialEndsAt: newDate.toISOString(),
        subscriptionStatus: "TRIAL",
      }),
    });
    setBusiness({
      ...business,
      trialEndsAt: newDate.toISOString(),
      subscriptionStatus: "TRIAL",
    });
    setSaving(false);
  };

  const activateSubscription = async (plan: string) => {
    if (!business) return;
    setSaving(true);
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (plan === "yearly" ? 12 : 1));
    await fetch(`/api/platform/businesses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscriptionStatus: "ACTIVE",
        subscriptionPlan: plan,
        subscriptionStartDate: startDate.toISOString(),
        subscriptionEndDate: endDate.toISOString(),
      }),
    });
    setBusiness({
      ...business,
      subscriptionStatus: "ACTIVE",
      subscriptionPlan: plan,
      subscriptionStartDate: startDate.toISOString(),
      subscriptionEndDate: endDate.toISOString(),
    });
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!business) {
    return <p className="text-gray-500">Business not found.</p>;
  }

  const stats = [
    { label: "Users", value: business._count.users, icon: Users },
    { label: "Clients", value: business._count.clients, icon: UserCircle },
    { label: "Appointments", value: business._count.appointments, icon: Calendar },
    { label: "Services", value: business._count.services, icon: Scissors },
    { label: "Stylists", value: business._count.stylists, icon: UserCircle },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push("/platform/businesses")}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-violet-100 rounded-xl flex items-center justify-center">
            <Building2 className="w-7 h-7 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
            <p className="text-sm text-gray-500">{business.slug} &middot; {business.country}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${STATUS_COLORS[business.subscriptionStatus]} text-xs`}>
            {business.subscriptionStatus}
          </Badge>
          {!business.isActive && (
            <Badge className="bg-red-100 text-red-600 text-xs">Disabled</Badge>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200/60 p-4 text-center">
            <s.icon className="w-5 h-5 text-gray-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Info */}
        <div className="bg-white rounded-xl border border-gray-200/60 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Info</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="text-gray-900">{business.email || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Phone</span>
              <span className="text-gray-900">{business.phone || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">City</span>
              <span className="text-gray-900">{business.city || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Currency</span>
              <span className="text-gray-900">{business.currencySymbol} ({business.currency})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Onboarding</span>
              <span className={business.onboardingComplete ? "text-emerald-600" : "text-amber-600"}>
                {business.onboardingComplete ? "Complete" : "Incomplete"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Created</span>
              <span className="text-gray-900">{new Date(business.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <Button
              variant={business.isActive ? "destructive" : "default"}
              size="sm"
              onClick={toggleActive}
              disabled={saving}
              className="w-full"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : business.isActive ? (
                <ToggleLeft className="w-4 h-4 mr-2" />
              ) : (
                <ToggleRight className="w-4 h-4 mr-2" />
              )}
              {business.isActive ? "Deactivate Business" : "Activate Business"}
            </Button>
          </div>
        </div>

        {/* Subscription Management */}
        <div className="bg-white rounded-xl border border-gray-200/60 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <Badge className={`${STATUS_COLORS[business.subscriptionStatus]} text-xs`}>
                {business.subscriptionStatus}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Plan</span>
              <span className="text-gray-900">{business.subscriptionPlan || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Trial Ends</span>
              <span className="text-gray-900">
                {business.trialEndsAt ? new Date(business.trialEndsAt).toLocaleDateString() : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Start Date</span>
              <span className="text-gray-900">
                {business.subscriptionStartDate ? new Date(business.subscriptionStartDate).toLocaleDateString() : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">End Date</span>
              <span className="text-gray-900">
                {business.subscriptionEndDate ? new Date(business.subscriptionEndDate).toLocaleDateString() : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">PayPal ID</span>
              <span className="text-gray-900 text-xs">{business.paypalSubscriptionId || "-"}</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 space-y-3">
            {/* Extend Trial */}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Extend trial by</span>
              <input
                type="number"
                value={extendDays}
                onChange={(e) => setExtendDays(parseInt(e.target.value) || 0)}
                className="w-16 px-2 py-1 rounded-lg border border-gray-200 text-sm text-center"
                min={1}
              />
              <span className="text-sm text-gray-600">days</span>
              <Button size="sm" variant="outline" onClick={extendTrial} disabled={saving}>
                Extend
              </Button>
            </div>

            {/* Activate */}
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                onClick={() => activateSubscription("monthly")}
                disabled={saving}
              >
                <CreditCard className="w-4 h-4 mr-1" />
                Activate Monthly
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => activateSubscription("yearly")}
                disabled={saving}
              >
                <CreditCard className="w-4 h-4 mr-1" />
                Activate Yearly
              </Button>
            </div>
          </div>
        </div>

        {/* Users */}
        <div className="bg-white rounded-xl border border-gray-200/60 p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Users ({business.users.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-3 py-2 text-gray-500 font-medium">Name</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-medium">Email</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-medium">Role</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-medium">Status</th>
                  <th className="text-left px-3 py-2 text-gray-500 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {business.users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50">
                    <td className="px-3 py-2 text-gray-900">
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="px-3 py-2 text-gray-600">{u.email}</td>
                    <td className="px-3 py-2">
                      <Badge variant="outline" className="text-[11px]">{u.role}</Badge>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-xs font-medium ${u.isActive ? "text-emerald-600" : "text-red-500"}`}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
