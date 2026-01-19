// app/(dashboard)/settings/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Settings,
  Building2,
  Clock,
  Users,
  CreditCard,
  Save,
  Upload,
  Trash2,
  Plus,
  X,
  Loader2,
  Check,
  AlertCircle,
  Zap,
  Calendar,
  ExternalLink,
  MapPin,
  MessageSquare,
  DollarSign,
  Bell,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";

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
        // Load business settings
        const businessRes = await fetch("/api/settings/business");
        if (businessRes.ok) {
          const data = await businessRes.json();
          setFormData({
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
            address: data.address || "",
            description: data.description || "",
            logo: data.logo || "",
          });
          if (data.businessHours) {
            setBusinessHours(data.businessHours);
          }
        }

        // Load team members
        const teamRes = await fetch("/api/settings/team");
        if (teamRes.ok) {
          const data = await teamRes.json();
          setTeamMembers(data.members || []);
        }

        // Load billing status
        const billingRes = await fetch("/api/billing/status");
        if (billingRes.ok) {
          const data = await billingRes.json();
          setBillingStatus(data);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
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
      const res = await fetch("/api/settings/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
      const res = await fetch("/api/settings/hours", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessHours }),
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
                      <Badge>{member.role}</Badge>
                    </div>
                  ))}
                </div>
              )}
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
