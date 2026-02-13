// app/(dashboard)/settings/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your salon settings and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-teal-600 text-teal-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.name}
          </button>
        ))}
      </div>

      {/* General Tab */}
      {activeTab === "general" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                Update your salon&apos;s basic information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <div className="flex justify-end">
                <Button onClick={handleSaveGeneral} disabled={isSaving}>
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
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Hours Tab */}
      {activeTab === "hours" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Business Hours</CardTitle>
              <CardDescription>
                Set your salon&apos;s operating hours
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {daysOfWeek.map((day) => (
                <div
                  key={day}
                  className="flex items-center gap-4 py-3 border-b last:border-0"
                >
                  <div className="w-28 font-medium">{day}</div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={!businessHours[day]?.closed}
                      onCheckedChange={(checked) =>
                        updateHours(day, "closed", !checked)
                      }
                    />
                    <span className="text-sm text-muted-foreground">
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
                      <span className="text-muted-foreground">to</span>
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
              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveHours} disabled={isSaving}>
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
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Team Tab */}
      {activeTab === "team" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage staff access to SalonixPro
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teamMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No team members yet</p>
                  <p className="text-sm">
                    Add team members to give them access to the system
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {currentUserRole === "OWNER" && member.role !== "OWNER" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPermissions(member)}
                          >
                            <Shield className="w-3.5 h-3.5 mr-1.5" />
                            Permissions
                          </Button>
                        )}
                        <Badge>{member.role}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Permission Editor Dialog */}
              <Dialog open={permDialogOpen} onOpenChange={setPermDialogOpen}>
                <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-teal-600" />
                      Permissions — {permMember?.name}
                    </DialogTitle>
                    <DialogDescription>
                      Control what this team member can access
                    </DialogDescription>
                  </DialogHeader>

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
                  <div className="space-y-4 mt-2">
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

                  {/* Save Button */}
                  <div className="flex justify-end pt-4 border-t">
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
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Billing Tab */}
      {activeTab === "billing" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-teal-600" />
                Subscription
              </CardTitle>
              <CardDescription>
                Manage your SalonixPro subscription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {billingStatus?.isOnTrial ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-amber-600" />
                    <span className="font-semibold text-amber-800">
                      Free Trial Active
                    </span>
                  </div>
                  <p className="text-sm text-amber-700">
                    Your trial ends on{" "}
                    {billingStatus.trialEndsAt
                      ? new Date(billingStatus.trialEndsAt).toLocaleDateString()
                      : "soon"}
                    . Subscribe to continue using SalonixPro.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="w-5 h-5 text-teal-600" />
                    <span className="font-semibold text-teal-800">
                      {billingStatus?.plan || "Free"} Plan
                    </span>
                  </div>
                  <p className="text-sm text-teal-700">
                    {billingStatus?.status === "active"
                      ? "Your subscription is active"
                      : "Subscribe to unlock all features"}
                  </p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                {/* Monthly Plan */}
                <div className="p-6 border rounded-xl hover:border-teal-300 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold">Monthly</h3>
                      <p className="text-sm text-muted-foreground">
                        Flexible monthly billing
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">$30</p>
                      <p className="text-sm text-muted-foreground">/month</p>
                    </div>
                  </div>
                  <Button className="w-full" variant="outline">
                    Choose Monthly
                  </Button>
                </div>

                {/* Yearly Plan */}
                <div className="p-6 border-2 border-teal-500 rounded-xl relative">
                  <Badge className="absolute -top-3 left-4 bg-teal-600">
                    Save $60/year
                  </Badge>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold">Yearly</h3>
                      <p className="text-sm text-muted-foreground">
                        Best value
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">$300</p>
                      <p className="text-sm text-muted-foreground">/year</p>
                    </div>
                  </div>
                  <Button className="w-full bg-teal-600 hover:bg-teal-700">
                    Choose Yearly
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">All plans include:</h4>
                <ul className="grid gap-2 md:grid-cols-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-600" />
                    Unlimited appointments
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-600" />
                    Client management
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-600" />
                    Online booking
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-600" />
                    Point of sale
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-600" />
                    Reports & analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-600" />
                    Priority support
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// Loading fallback for Suspense
function SettingsLoading() {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="flex items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
        <span className="text-muted-foreground">Loading settings...</span>
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
