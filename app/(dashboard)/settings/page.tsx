// app/(dashboard)/settings/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Building2,
  Clock,
  Users,
  CreditCard,
  Save,
  Loader2,
  Check,
  Zap,
  Coins,
  Shield,
  UserPlus,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const tabs = [
  { id: "general", name: "General", icon: Building2 },
  { id: "hours", name: "Hours", icon: Clock },
  { id: "team", name: "Team", icon: Users },
  { id: "billing", name: "Billing", icon: CreditCard },
];

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// Main settings component with all the logic
function SettingsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "general";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    description: "",
    logo: "",
    currency: "XCD",
    currencySymbol: "EC$",
  });

  // Business hours state
  const [businessHours, setBusinessHours] = useState<{
    [key: string]: { open: string; close: string; closed: boolean };
  }>({
    Monday: { open: "09:00", close: "18:00", closed: false },
    Tuesday: { open: "09:00", close: "18:00", closed: false },
    Wednesday: { open: "09:00", close: "18:00", closed: false },
    Thursday: { open: "09:00", close: "18:00", closed: false },
    Friday: { open: "09:00", close: "18:00", closed: false },
    Saturday: { open: "09:00", close: "17:00", closed: false },
    Sunday: { open: "10:00", close: "16:00", closed: true },
  });

  // Team members state
  const [teamMembers, setTeamMembers] = useState<
    { id: string; name: string; email: string; role: string }[]
  >([]);

  // Permission editor state
  const [permDialogOpen, setPermDialogOpen] = useState(false);
  const [permMember, setPermMember] = useState<{ id: string; name: string; role: string } | null>(null);
  const [permPreset, setPermPreset] = useState<string>("staff");
  const [permFlags, setPermFlags] = useState<Record<string, boolean>>({});
  const [permSaving, setPermSaving] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>("");

  // Invite team member state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ firstName: "", lastName: "", email: "", role: "STYLIST", phone: "" });
  const [inviteSaving, setInviteSaving] = useState(false);

  // Billing state
  const [billingStatus, setBillingStatus] = useState<{
    plan: string;
    status: string;
    trialEndsAt: string | null;
    subscriptionEndsAt: string | null;
    isOnTrial: boolean;
  } | null>(null);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        // Load all settings from single endpoint
        const settingsRes = await fetch("/api/settings");
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          if (data.business) {
            setFormData({
              name: data.business.name || "",
              email: data.business.email || "",
              phone: data.business.phone || "",
              address: data.business.address || "",
              description: data.business.description || "",
              logo: data.business.logo || "",
              currency: data.business.currency || "XCD",
              currencySymbol: data.business.currencySymbol || "EC$",
            });
          }
          if (data.hours) {
            setBusinessHours(data.hours);
          }
          if (data.users) {
            setTeamMembers(
              data.users.map((u: any) => ({
                id: u.id,
                name: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username,
                email: u.email,
                role: u.role,
              }))
            );
          }
        }

        // Load billing status
        const billingRes = await fetch("/api/billing/status");
        if (billingRes.ok) {
          const data = await billingRes.json();
          setBillingStatus(data);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load settings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Save general settings
  const handleSaveGeneral = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "business", data: formData }),
      });

      if (res.ok) {
        toast({
          title: "Settings saved",
          description: "Your business settings have been updated.",
        });
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Save business hours
  const handleSaveHours = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "hours", data: businessHours }),
      });

      if (res.ok) {
        toast({
          title: "Hours saved",
          description: "Your business hours have been updated.",
        });
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save hours. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Update hours
  const updateHours = (
    day: string,
    field: "open" | "close" | "closed",
    value: string | boolean
  ) => {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  // Fetch current user role
  useEffect(() => {
    fetch("/api/me/permissions")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.role) setCurrentUserRole(data.role);
      })
      .catch(() => {});
  }, []);

  // Permission presets
  const STAFF_DEFAULTS: Record<string, boolean> = {
    manageTeam: false, manageServices: false, viewShop: false, manageShop: false,
    viewProductCosts: false, viewOrders: true, createOrders: true, manageOrders: false,
    viewExpenses: false, manageExpenses: false, viewPayroll: false, viewProfitLoss: false,
    viewReports: false, manageSettings: false,
  };
  const MANAGER_DEFAULTS: Record<string, boolean> = {
    manageTeam: true, manageServices: true, viewShop: true, manageShop: true,
    viewProductCosts: true, viewOrders: true, createOrders: true, manageOrders: true,
    viewExpenses: true, manageExpenses: true, viewPayroll: false, viewProfitLoss: true,
    viewReports: true, manageSettings: true,
  };
  const FULL_DEFAULTS: Record<string, boolean> = {
    manageTeam: true, manageServices: true, viewShop: true, manageShop: true,
    viewProductCosts: true, viewOrders: true, createOrders: true, manageOrders: true,
    viewExpenses: true, manageExpenses: true, viewPayroll: true, viewProfitLoss: true,
    viewReports: true, manageSettings: true,
  };

  const PERMISSION_GROUPS = [
    { label: "Team & Services", keys: [
      { key: "manageTeam", label: "Manage Team" },
      { key: "manageServices", label: "Manage Services" },
    ]},
    { label: "Shop & Products", keys: [
      { key: "viewShop", label: "View Shop" },
      { key: "manageShop", label: "Manage Shop" },
      { key: "viewProductCosts", label: "View Product Costs" },
    ]},
    { label: "Orders", keys: [
      { key: "viewOrders", label: "View Orders" },
      { key: "createOrders", label: "Create Orders" },
      { key: "manageOrders", label: "Manage Orders" },
    ]},
    { label: "Finance", keys: [
      { key: "viewExpenses", label: "View Expenses" },
      { key: "manageExpenses", label: "Manage Expenses" },
      { key: "viewPayroll", label: "View Payroll" },
      { key: "viewProfitLoss", label: "View P&L Report" },
    ]},
    { label: "Reports & Settings", keys: [
      { key: "viewReports", label: "View Reports" },
      { key: "manageSettings", label: "Manage Settings" },
    ]},
  ];

  // Open permission dialog for a member
  const openPermissions = async (member: { id: string; name: string; role: string }) => {
    setPermMember(member);
    setPermDialogOpen(true);
    try {
      const res = await fetch(`/api/staff/${member.id}/permissions`);
      if (res.ok) {
        const data = await res.json();
        setPermFlags(data.permissions);
        setPermPreset(data.preset);
      }
    } catch {
      setPermFlags({ ...STAFF_DEFAULTS });
      setPermPreset("staff");
    }
  };

  // Handle preset change
  const handlePresetChange = (preset: string) => {
    setPermPreset(preset);
    if (preset === "staff") setPermFlags({ ...STAFF_DEFAULTS });
    else if (preset === "manager") setPermFlags({ ...MANAGER_DEFAULTS });
    else if (preset === "full") setPermFlags({ ...FULL_DEFAULTS });
  };

  // Handle individual toggle
  const handlePermToggle = (key: string, value: boolean) => {
    const updated = { ...permFlags, [key]: value };
    setPermFlags(updated);
    // Check if it matches a preset
    const matchesStaff = Object.keys(STAFF_DEFAULTS).every(k => updated[k] === STAFF_DEFAULTS[k]);
    const matchesManager = Object.keys(MANAGER_DEFAULTS).every(k => updated[k] === MANAGER_DEFAULTS[k]);
    const matchesFull = Object.keys(FULL_DEFAULTS).every(k => updated[k] === FULL_DEFAULTS[k]);
    if (matchesFull) setPermPreset("full");
    else if (matchesManager) setPermPreset("manager");
    else if (matchesStaff) setPermPreset("staff");
    else setPermPreset("custom");
  };

  // Save permissions
  const handleSavePermissions = async () => {
    if (!permMember) return;
    setPermSaving(true);
    try {
      const body = permPreset !== "custom"
        ? { preset: permPreset }
        : { permissions: permFlags };
      const res = await fetch(`/api/staff/${permMember.id}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast({
          title: "Permissions updated",
          description: `${permMember.name}'s permissions have been saved.`,
        });
        setPermDialogOpen(false);
      } else {
        throw new Error("Failed");
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to save permissions.",
        variant: "destructive",
      });
    } finally {
      setPermSaving(false);
    }
  };

  // Invite team member
  const handleInvite = async () => {
    if (!inviteForm.firstName || !inviteForm.email) {
      toast({ title: "Error", description: "First name and email are required.", variant: "destructive" });
      return;
    }
    setInviteSaving(true);
    try {
      const res = await fetch("/api/staff/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.warning) {
          toast({
            title: "Account created — email failed",
            description: data.warning,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Team member invited",
            description: `${data.name} has been added and will receive a login email.`,
          });
        }
        setTeamMembers((prev) => [...prev, data]);
        setInviteDialogOpen(false);
        setInviteForm({ firstName: "", lastName: "", email: "", role: "STYLIST", phone: "" });
      } else {
        throw new Error(data.error || "Failed");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to invite team member.",
        variant: "destructive",
      });
    } finally {
      setInviteSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-600" />
          <div className="space-y-3 w-72">
            <div className="h-4 skeleton-shimmer rounded-lg" />
            <div className="h-4 skeleton-shimmer rounded-lg w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-[1400px]">

      {/* ═══════ SETTINGS BANNER ═══════ */}
      <div className="animate-in stagger-1 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#18181b] via-[#27272a] to-[#3f3f46] p-8 lg:p-10 shadow-2xl shadow-zinc-900/20 ring-1 ring-white/10">
        {/* Shimmer overlay */}
        <div className="absolute inset-0 shimmer pointer-events-none" />

        {/* Decorative animated shapes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-zinc-400/10 blur-3xl animate-float" />
          <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-gray-400/8 blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full bg-slate-400/8 blur-2xl animate-float-slow" />
          <div className="absolute top-8 right-16 w-16 h-16 border border-white/[0.08] rounded-2xl rotate-12 animate-float" />
          <div className="absolute top-1/2 right-8 w-10 h-10 border border-white/[0.06] rounded-xl rotate-45 animate-float-delayed" />
          <div className="absolute bottom-8 right-1/3 w-20 h-20 border border-white/[0.05] rounded-full animate-float-slow" />
          <div className="absolute top-4 left-1/3 w-6 h-6 bg-white/[0.04] rounded-lg rotate-12 animate-float" />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }} />
        </div>

        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-zinc-400 animate-pulse" />
                <p className="text-zinc-400/60 text-xs font-semibold tracking-widest uppercase">Configuration</p>
              </div>
              <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight text-glow leading-[1.1]">
                Settings
              </h1>
              <p className="text-zinc-300/50 mt-3 text-[15px] leading-relaxed max-w-lg">
                Manage your salon settings and preferences
              </p>
            </div>
          </div>

          {/* Tab Selector Pills */}
          <div className="bg-white/10 rounded-xl p-1 inline-flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-white/20 text-white font-semibold shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════ GENERAL TAB ═══════ */}
      {activeTab === "general" && (
        <div className="animate-in stagger-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-[3px] bg-gradient-to-r from-zinc-500 via-gray-500 to-slate-500" />
            <div className="p-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-100 to-gray-100 flex items-center justify-center ring-1 ring-zinc-200/50">
                  <Building2 className="w-5 h-5 text-zinc-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 tracking-tight">Business Information</h3>
                  <p className="text-sm text-gray-400 mt-0.5 font-medium">
                    Update your salon&apos;s basic information
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Business Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Your Salon Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="salon@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+1 (758) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="123 Main Street, Castries"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Tell customers about your salon..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">
                  <span className="flex items-center gap-1">
                    <Coins className="w-4 h-4" />
                    Currency
                  </span>
                </Label>
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => {
                    const currencies: Record<string, string> = {
                      XCD: "EC$", USD: "$", BBD: "Bds$",
                      TTD: "TT$", JMD: "J$", GYD: "G$",
                    };
                    setFormData({
                      ...formData,
                      currency: e.target.value,
                      currencySymbol: currencies[e.target.value] || "$",
                    });
                  }}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="XCD">EC$ - Eastern Caribbean Dollar</option>
                  <option value="USD">$ - US Dollar</option>
                  <option value="BBD">Bds$ - Barbadian Dollar</option>
                  <option value="TTD">TT$ - Trinidad & Tobago Dollar</option>
                  <option value="JMD">J$ - Jamaican Dollar</option>
                  <option value="GYD">G$ - Guyanese Dollar</option>
                </select>
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSaveGeneral}
                  disabled={isSaving}
                  className="rounded-xl bg-gradient-to-r from-zinc-700 to-zinc-800 hover:from-zinc-800 hover:to-zinc-900 text-white font-bold shadow-lg shadow-zinc-800/20 h-10 px-6"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ HOURS TAB ═══════ */}
      {activeTab === "hours" && (
        <div className="animate-in stagger-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-[3px] bg-gradient-to-r from-zinc-500 via-gray-500 to-slate-500" />
            <div className="p-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-100 to-gray-100 flex items-center justify-center ring-1 ring-zinc-200/50">
                  <Clock className="w-5 h-5 text-zinc-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 tracking-tight">Business Hours</h3>
                  <p className="text-sm text-gray-400 mt-0.5 font-medium">
                    Set your salon&apos;s operating hours
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-1">
              {daysOfWeek.map((day) => (
                <div
                  key={day}
                  className="flex items-center gap-4 py-3.5 px-3 rounded-xl border-b border-gray-100/60 last:border-0 hover:bg-gray-50/60 transition-colors group/row"
                >
                  <div className="w-28 font-semibold text-gray-800 text-sm">{day}</div>
                  <div className="flex items-center gap-2.5">
                    <Switch
                      checked={!businessHours[day]?.closed}
                      onCheckedChange={(checked) =>
                        updateHours(day, "closed", !checked)
                      }
                    />
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ring-1 ${
                      businessHours[day]?.closed
                        ? "bg-red-50 text-red-600 ring-red-200/50"
                        : "bg-emerald-50 text-emerald-700 ring-emerald-200/50"
                    }`}>
                      {businessHours[day]?.closed ? "Closed" : "Open"}
                    </span>
                  </div>
                  {!businessHours[day]?.closed && (
                    <div className="flex items-center gap-2 ml-auto">
                      <Input
                        type="time"
                        value={businessHours[day]?.open || "09:00"}
                        onChange={(e) =>
                          updateHours(day, "open", e.target.value)
                        }
                        className="w-32"
                      />
                      <span className="text-gray-400 text-sm font-medium">to</span>
                      <Input
                        type="time"
                        value={businessHours[day]?.close || "18:00"}
                        onChange={(e) =>
                          updateHours(day, "close", e.target.value)
                        }
                        className="w-32"
                      />
                    </div>
                  )}
                </div>
              ))}
              <div className="flex justify-end pt-5">
                <Button
                  onClick={handleSaveHours}
                  disabled={isSaving}
                  className="rounded-xl bg-gradient-to-r from-zinc-700 to-zinc-800 hover:from-zinc-800 hover:to-zinc-900 text-white font-bold shadow-lg shadow-zinc-800/20 h-10 px-6"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Hours
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ TEAM TAB ═══════ */}
      {activeTab === "team" && (
        <div className="animate-in stagger-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-[3px] bg-gradient-to-r from-zinc-500 via-gray-500 to-slate-500" />
            <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-100 to-gray-100 flex items-center justify-center ring-1 ring-zinc-200/50">
                  <Users className="w-5 h-5 text-zinc-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 tracking-tight">Team Members</h3>
                  <p className="text-sm text-gray-400 mt-0.5 font-medium">
                    Manage staff access to SalonixPro
                  </p>
                </div>
              </div>
              {currentUserRole === "OWNER" && (
                <Button
                  onClick={() => setInviteDialogOpen(true)}
                  size="sm"
                  className="rounded-xl bg-gradient-to-r from-zinc-700 to-zinc-800 hover:from-zinc-800 hover:to-zinc-900 text-white font-bold shadow-lg shadow-zinc-800/20"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Member
                </Button>
              )}
            </div>
            <div className="p-6">
              {teamMembers.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="inline-flex flex-col items-center border-2 border-dashed border-zinc-200/60 rounded-2xl px-12 py-10 bg-gradient-to-br from-zinc-50/30 to-slate-50/50">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-zinc-100 to-gray-100 flex items-center justify-center mb-5 ring-1 ring-zinc-200/50 shadow-lg shadow-zinc-500/10">
                      <Users className="w-10 h-10 text-zinc-400" />
                    </div>
                    <p className="text-gray-900 font-black text-lg tracking-tight">No team members yet</p>
                    <p className="text-sm text-gray-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
                      Add team members to give them access to the system
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 rounded-xl ring-1 ring-black/[0.04] hover:bg-gray-50/60 transition-all shadow-sm group/row"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-200 to-gray-300 flex items-center justify-center shadow-sm shrink-0 group-hover/row:scale-105 transition-transform">
                          <span className="text-[11px] font-bold text-zinc-700">
                            {member.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{member.name}</p>
                          <p className="text-xs text-gray-400">
                            {member.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {currentUserRole === "OWNER" && member.role !== "OWNER" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPermissions(member)}
                            className="rounded-lg border-gray-200 font-semibold text-gray-500 hover:text-gray-900 ring-1 ring-gray-200/50 text-xs"
                          >
                            <Shield className="w-3.5 h-3.5 mr-1.5" />
                            Permissions
                          </Button>
                        )}
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ring-1 ${
                          member.role === "OWNER"
                            ? "bg-zinc-100 text-zinc-800 ring-zinc-300/50"
                            : member.role === "MANAGER"
                            ? "bg-blue-50 text-blue-700 ring-blue-200/50"
                            : "bg-gray-50 text-gray-600 ring-gray-200/50"
                        }`}>
                          {member.role}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Permission Editor Dialog */}
              <Dialog open={permDialogOpen} onOpenChange={setPermDialogOpen}>
                <DialogContent className="max-w-lg flex flex-col overflow-hidden p-0">
                  <DialogHeader className="px-6 pt-6 pb-2">
                    <DialogTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-teal-600" />
                      Permissions — {permMember?.name}
                    </DialogTitle>
                    <DialogDescription>
                      Control what this team member can access
                    </DialogDescription>
                  </DialogHeader>

                  <div className="flex-1 overflow-y-auto px-6 pb-2">
                    {/* Preset Selector */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Preset</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: "staff", label: "Staff" },
                          { id: "manager", label: "Manager" },
                          { id: "full", label: "Full Access" },
                          { id: "custom", label: "Custom" },
                        ].map((p) => (
                          <button
                            key={p.id}
                            onClick={() => p.id !== "custom" && handlePresetChange(p.id)}
                            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                              permPreset === p.id
                                ? "bg-teal-50 border-teal-300 text-teal-700"
                                : "border-gray-200 text-gray-600 hover:bg-gray-50"
                            } ${p.id === "custom" ? "cursor-default" : "cursor-pointer"}`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Permission Toggles */}
                    <div className="space-y-4 mt-4">
                      {PERMISSION_GROUPS.map((group) => (
                        <div key={group.label}>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            {group.label}
                          </p>
                          <div className="space-y-2">
                            {group.keys.map(({ key, label }) => (
                              <div
                                key={key}
                                className="flex items-center justify-between py-1.5"
                              >
                                <span className="text-sm">{label}</span>
                                <Switch
                                  checked={permFlags[key] ?? false}
                                  onCheckedChange={(val) => handlePermToggle(key, val)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Save Button - sticky at bottom */}
                  <div className="flex justify-end px-6 py-4 border-t bg-white rounded-b-lg">
                    <Button onClick={handleSavePermissions} disabled={permSaving}>
                      {permSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Permissions
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Invite Team Member Dialog */}
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-teal-600" />
                      Invite Team Member
                    </DialogTitle>
                    <DialogDescription>
                      They'll receive an email with login credentials
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="grid gap-4 grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="inv-first">First Name *</Label>
                        <Input
                          id="inv-first"
                          value={inviteForm.firstName}
                          onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                          placeholder="Jane"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="inv-last">Last Name</Label>
                        <Input
                          id="inv-last"
                          value={inviteForm.lastName}
                          onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inv-email">Email *</Label>
                      <Input
                        id="inv-email"
                        type="email"
                        value={inviteForm.email}
                        onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                        placeholder="jane@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inv-phone">Phone</Label>
                      <Input
                        id="inv-phone"
                        value={inviteForm.phone}
                        onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                        placeholder="+1 (758) 123-4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inv-role">Role *</Label>
                      <select
                        id="inv-role"
                        value={inviteForm.role}
                        onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="STYLIST">Staff</option>
                        <option value="MANAGER">Manager</option>
                      </select>
                      <p className="text-xs text-muted-foreground">
                        {inviteForm.role === "MANAGER"
                          ? "Managers can access most features except payroll."
                          : "Staff can view and create orders only. Customize via Permissions after inviting."}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleInvite} disabled={inviteSaving}>
                      {inviteSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Invite
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ BILLING TAB ═══════ */}
      {activeTab === "billing" && (
        <div className="animate-in stagger-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-[3px] bg-gradient-to-r from-zinc-500 via-gray-500 to-slate-500" />
            <div className="p-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-100 to-gray-100 flex items-center justify-center ring-1 ring-zinc-200/50">
                  <CreditCard className="w-5 h-5 text-zinc-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 tracking-tight">Subscription</h3>
                  <p className="text-sm text-gray-400 mt-0.5 font-medium">
                    Manage your SalonixPro subscription
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {billingStatus?.isOnTrial ? (
                <div className="p-5 bg-gradient-to-br from-amber-50/60 to-orange-50/40 rounded-xl ring-1 ring-amber-200/50">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center ring-1 ring-amber-200/50">
                      <Zap className="w-4.5 h-4.5 text-amber-600" />
                    </div>
                    <span className="font-bold text-amber-800 text-sm">
                      Free Trial Active
                    </span>
                  </div>
                  <p className="text-sm text-amber-700 leading-relaxed ml-[46px]">
                    Your trial ends on{" "}
                    {billingStatus.trialEndsAt
                      ? new Date(billingStatus.trialEndsAt).toLocaleDateString()
                      : "soon"}
                    . Subscribe to continue using SalonixPro.
                  </p>
                </div>
              ) : (
                <div className="p-5 bg-gradient-to-br from-emerald-50/60 to-teal-50/40 rounded-xl ring-1 ring-emerald-200/50">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center ring-1 ring-emerald-200/50">
                      <Check className="w-4.5 h-4.5 text-emerald-600" />
                    </div>
                    <span className="font-bold text-emerald-800 text-sm">
                      {billingStatus?.plan || "Free"} Plan
                    </span>
                  </div>
                  <p className="text-sm text-emerald-700 leading-relaxed ml-[46px]">
                    {billingStatus?.status === "active"
                      ? "Your subscription is active"
                      : "Subscribe to unlock all features"}
                  </p>
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                {/* Monthly Plan */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6 hover:border-zinc-300 transition-all hover:shadow-md">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">Monthly</h3>
                      <p className="text-sm text-gray-400 font-medium mt-0.5">
                        Flexible monthly billing
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-gray-900 tracking-tight number-display">$30</p>
                      <p className="text-xs text-gray-400 font-semibold">/month</p>
                    </div>
                  </div>
                  <Button className="w-full rounded-xl border-gray-200 font-semibold text-gray-600 hover:text-gray-900 ring-1 ring-gray-200/50 h-10" variant="outline">
                    Choose Monthly
                  </Button>
                </div>

                {/* Yearly Plan */}
                <div className="glass-card glow-border rounded-2xl overflow-hidden p-6 relative ring-2 ring-zinc-400/30">
                  <div className="h-[3px] bg-gradient-to-r from-zinc-500 via-gray-500 to-slate-500 absolute top-0 left-0 right-0" />
                  <Badge className="absolute -top-3 left-4 bg-gradient-to-r from-zinc-700 to-zinc-800 text-white text-[10px] font-bold px-3 py-0.5 shadow-lg shadow-zinc-800/20 border-0">
                    Save $60/year
                  </Badge>
                  <div className="flex justify-between items-start mb-6 mt-1">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">Yearly</h3>
                      <p className="text-sm text-gray-400 font-medium mt-0.5">
                        Best value
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-gray-900 tracking-tight number-display">$300</p>
                      <p className="text-xs text-gray-400 font-semibold">/year</p>
                    </div>
                  </div>
                  <Button className="w-full rounded-xl bg-gradient-to-r from-zinc-700 to-zinc-800 hover:from-zinc-800 hover:to-zinc-900 text-white font-bold shadow-lg shadow-zinc-800/20 h-10 border-0">
                    Choose Yearly
                  </Button>
                </div>
              </div>

              <div className="pt-5 border-t border-gray-100">
                <h4 className="font-bold text-gray-900 text-sm mb-3 tracking-tight">All plans include:</h4>
                <ul className="grid gap-2.5 md:grid-cols-2 text-sm">
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-md bg-emerald-50 flex items-center justify-center ring-1 ring-emerald-200/50">
                      <Check className="w-3 h-3 text-emerald-600" />
                    </div>
                    <span className="text-gray-600 font-medium">Unlimited appointments</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-md bg-emerald-50 flex items-center justify-center ring-1 ring-emerald-200/50">
                      <Check className="w-3 h-3 text-emerald-600" />
                    </div>
                    <span className="text-gray-600 font-medium">Client management</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-md bg-emerald-50 flex items-center justify-center ring-1 ring-emerald-200/50">
                      <Check className="w-3 h-3 text-emerald-600" />
                    </div>
                    <span className="text-gray-600 font-medium">Online booking</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-md bg-emerald-50 flex items-center justify-center ring-1 ring-emerald-200/50">
                      <Check className="w-3 h-3 text-emerald-600" />
                    </div>
                    <span className="text-gray-600 font-medium">Point of sale</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-md bg-emerald-50 flex items-center justify-center ring-1 ring-emerald-200/50">
                      <Check className="w-3 h-3 text-emerald-600" />
                    </div>
                    <span className="text-gray-600 font-medium">Reports & analytics</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-md bg-emerald-50 flex items-center justify-center ring-1 ring-emerald-200/50">
                      <Check className="w-3 h-3 text-emerald-600" />
                    </div>
                    <span className="text-gray-600 font-medium">Priority support</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Loading fallback for Suspense
function SettingsLoading() {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-600" />
        <div className="space-y-3 w-64">
          <div className="h-4 skeleton-shimmer rounded-lg" />
          <div className="h-4 skeleton-shimmer rounded-lg w-2/3 mx-auto" />
        </div>
        <span className="text-gray-400 text-sm font-medium">Loading settings...</span>
      </div>
    </div>
  );
}

// Main export wrapped in Suspense
export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsContent />
    </Suspense>
  );
}
