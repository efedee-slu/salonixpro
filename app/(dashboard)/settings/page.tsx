// app/(dashboard)/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
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
  Banknote,
  Percent,
  DollarSign,
  Navigation,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

interface BusinessSettings {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  logo: string | null;
}

interface BookingSettings {
  latitude: number | null;
  longitude: number | null;
  locationLandmark: string | null;
  requiresDeposit: boolean;
  depositType: string;
  depositAmount: number | null;
  depositPercentage: number;
  paymentDeadlineHours: number;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  paymentInstructions: string | null;
}

interface BusinessHours {
  day: string;
  dayIndex: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface StaffUser {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

type TabType = "business" | "hours" | "booking" | "users" | "billing";

interface BillingInfo {
  status: string;
  plan: string | null;
  trialEndsAt: string | null;
  trialDaysRemaining: number | null;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  paypalSubscriptionId: string | null;
  nextBillingDate: string | null;
}

const defaultHours: BusinessHours[] = [
  { day: "Sunday", dayIndex: 0, isOpen: false, openTime: "09:00", closeTime: "17:00" },
  { day: "Monday", dayIndex: 1, isOpen: true, openTime: "09:00", closeTime: "18:00" },
  { day: "Tuesday", dayIndex: 2, isOpen: true, openTime: "09:00", closeTime: "18:00" },
  { day: "Wednesday", dayIndex: 3, isOpen: true, openTime: "09:00", closeTime: "18:00" },
  { day: "Thursday", dayIndex: 4, isOpen: true, openTime: "09:00", closeTime: "18:00" },
  { day: "Friday", dayIndex: 5, isOpen: true, openTime: "09:00", closeTime: "18:00" },
  { day: "Saturday", dayIndex: 6, isOpen: true, openTime: "09:00", closeTime: "16:00" },
];

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const successParam = searchParams.get("success");
  const cancelledParam = searchParams.get("cancelled");
  
  const [activeTab, setActiveTab] = useState<TabType>(
    (tabParam as TabType) || "business"
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [business, setBusiness] = useState<BusinessSettings | null>(null);
  const [hours, setHours] = useState<BusinessHours[]>(defaultHours);
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [bookingSettings, setBookingSettings] = useState<BookingSettings>({
    latitude: null,
    longitude: null,
    locationLandmark: null,
    requiresDeposit: false,
    depositType: "percentage",
    depositAmount: null,
    depositPercentage: 25,
    paymentDeadlineHours: 48,
    bankName: null,
    bankAccountName: null,
    bankAccountNumber: null,
    paymentInstructions: null,
  });
  const [isLoadingBilling, setIsLoadingBilling] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { toast } = useToast();

  // Show success/cancelled toast on mount
  useEffect(() => {
    if (successParam === "true") {
      toast({
        title: "Subscription Activated!",
        description: "Thank you for subscribing to SalonixPro.",
      });
    }
    if (cancelledParam === "true") {
      toast({
        title: "Checkout Cancelled",
        description: "You can upgrade anytime from the Billing tab.",
        variant: "destructive",
      });
    }
  }, [successParam, cancelledParam, toast]);

  // Update tab when query param changes
  useEffect(() => {
    if (tabParam && ["business", "hours", "booking", "users", "billing"].includes(tabParam)) {
      setActiveTab(tabParam as TabType);
    }
  }, [tabParam]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    currency: "",
    currencySymbol: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        setBusiness(data.business);
        setUsers(data.users || []);
        if (data.hours) {
          setHours(data.hours);
        }
        setFormData({
          name: data.business.name || "",
          email: data.business.email || "",
          phone: data.business.phone || "",
          address: data.business.address || "",
          city: data.business.city || "",
          country: data.business.country || "",
          currency: data.business.currency || "",
          currencySymbol: data.business.currencySymbol || "",
        });
        // Load booking settings
        setBookingSettings({
          latitude: data.business.latitude || null,
          longitude: data.business.longitude || null,
          locationLandmark: data.business.locationLandmark || null,
          requiresDeposit: data.business.requiresDeposit || false,
          depositType: data.business.depositType || "percentage",
          depositAmount: data.business.depositAmount || null,
          depositPercentage: data.business.depositPercentage || 25,
          paymentDeadlineHours: data.business.paymentDeadlineHours || 48,
          bankName: data.business.bankName || null,
          bankAccountName: data.business.bankAccountName || null,
          bankAccountNumber: data.business.bankAccountNumber || null,
          paymentInstructions: data.business.paymentInstructions || null,
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBilling = async () => {
    setIsLoadingBilling(true);
    try {
      const response = await fetch("/api/billing/status");
      if (response.ok) {
        const data = await response.json();
        setBilling(data);
      }
    } catch (error) {
      console.error("Error fetching billing:", error);
    } finally {
      setIsLoadingBilling(false);
    }
  };

  // Fetch billing when tab changes to billing
  useEffect(() => {
    if (activeTab === "billing") {
      fetchBilling();
    }
  }, [activeTab]);

  const handleCheckout = async (plan: "monthly" | "yearly") => {
    setIsCheckingOut(true);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to PayPal
        window.location.href = data.approvalUrl;
      } else {
        const err = await response.json();
        throw new Error(err.error || "Failed to start checkout");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout",
        variant: "destructive",
      });
      setIsCheckingOut(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? You will lose access at the end of your billing period.")) {
      return;
    }

    try {
      const response = await fetch("/api/billing/cancel", {
        method: "POST",
      });

      if (response.ok) {
        toast({
          title: "Subscription Cancelled",
          description: "Your subscription has been cancelled.",
        });
        fetchBilling();
      } else {
        const err = await response.json();
        throw new Error(err.error || "Failed to cancel subscription");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "logo");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        // Update business with new logo
        await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "logo", data: { logo: data.url } }),
        });
        toast({
          title: "Success",
          description: "Logo uploaded successfully",
        });
        fetchSettings();
      } else {
        const err = await response.json();
        throw new Error(err.error || "Upload failed");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload logo",
        variant: "destructive",
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleDeleteLogo = async () => {
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "logo", data: { logo: null } }),
      });
      toast({
        title: "Success",
        description: "Logo removed",
      });
      fetchSettings();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove logo",
        variant: "destructive",
      });
    }
  };

  const saveBusinessSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "business", data: formData }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Business settings saved successfully",
        });
        fetchSettings();
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveHours = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "hours", data: hours }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Business hours saved successfully",
        });
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save hours",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveBookingSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          type: "booking", 
          data: {
            ...bookingSettings,
            address: formData.address,
          }
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Booking settings saved successfully",
        });
        fetchSettings();
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save booking settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateHour = (dayIndex: number, field: keyof BusinessHours, value: string | boolean) => {
    setHours(prev => prev.map(h => 
      h.dayIndex === dayIndex ? { ...h, [field]: value } : h
    ));
  };

  const tabs = [
    { id: "business", label: "Business Info", icon: Building2 },
    { id: "hours", label: "Working Hours", icon: Clock },
    { id: "booking", label: "Booking & Payments", icon: Banknote },
    { id: "users", label: "Staff Users", icon: Users },
    { id: "billing", label: "Billing", icon: CreditCard },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your business settings</p>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your business settings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 ${
              activeTab === tab.id
                ? "bg-teal-50 text-teal-700 border-b-2 border-teal-600"
                : ""
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Business Info Tab */}
      {activeTab === "business" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                This information appears on receipts and invoices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Section */}
              <div className="flex items-start gap-6 pb-6 border-b">
                <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center border-2 border-dashed overflow-hidden">
                  {business?.logo ? (
                    <img
                      src={business.logo}
                      alt="Business logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Business Logo</h4>
                  <p className="text-sm text-muted-foreground">
                    Upload your logo to display on receipts and invoices
                  </p>
                  <div className="flex gap-2">
                    <label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        disabled={isUploadingLogo}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isUploadingLogo}
                        asChild
                      >
                        <span className="cursor-pointer">
                          <Upload className="w-4 h-4 mr-2" />
                          {isUploadingLogo ? "Uploading..." : "Upload Logo"}
                        </span>
                      </Button>
                    </label>
                    {business?.logo && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={handleDeleteLogo}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Max 5MB, JPEG/PNG/WebP
                  </p>
                </div>
              </div>

              {/* Business Details */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Business Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your Salon Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contact@yoursalon.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (758) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Main Street"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Castries"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="Saint Lucia"
                  />
                </div>
              </div>

              {/* Currency Settings */}
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-4">Currency Settings</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency Code</Label>
                    <Input
                      id="currency"
                      value={formData.currency}
                      onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                      placeholder="XCD"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currencySymbol">Currency Symbol</Label>
                    <Input
                      id="currencySymbol"
                      value={formData.currencySymbol}
                      onChange={(e) => setFormData(prev => ({ ...prev, currencySymbol: e.target.value }))}
                      placeholder="EC$"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <Button
                  onClick={saveBusinessSettings}
                  disabled={isSaving}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Working Hours Tab */}
      {activeTab === "hours" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Working Hours</CardTitle>
              <CardDescription>
                Set your business operating hours for each day
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {hours.map((day) => (
                <div
                  key={day.dayIndex}
                  className={`flex items-center gap-4 p-4 rounded-lg ${
                    day.isOpen ? "bg-accent/30" : "bg-muted/30"
                  }`}
                >
                  <div className="w-28">
                    <span className={`font-medium ${!day.isOpen && "text-muted-foreground"}`}>
                      {day.day}
                    </span>
                  </div>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={day.isOpen}
                      onChange={(e) => updateHour(day.dayIndex, "isOpen", e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm">{day.isOpen ? "Open" : "Closed"}</span>
                  </label>

                  {day.isOpen && (
                    <>
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={day.openTime}
                          onChange={(e) => updateHour(day.dayIndex, "openTime", e.target.value)}
                          className="w-32"
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                          type="time"
                          value={day.closeTime}
                          onChange={(e) => updateHour(day.dayIndex, "closeTime", e.target.value)}
                          className="w-32"
                        />
                      </div>
                    </>
                  )}

                  {!day.isOpen && (
                    <Badge variant="secondary" className="bg-red-100 text-red-700">
                      Closed
                    </Badge>
                  )}
                </div>
              ))}

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <Button
                  onClick={saveHours}
                  disabled={isSaving}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Hours"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Booking & Payments Tab */}
      {activeTab === "booking" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Location Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-teal-600" />
                Location
              </CardTitle>
              <CardDescription>
                Help customers find your salon with directions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main Street, Castries"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Landmark / Directions (Optional)</Label>
                <Input
                  value={bookingSettings.locationLandmark || ""}
                  onChange={(e) => setBookingSettings({ ...bookingSettings, locationLandmark: e.target.value })}
                  placeholder="Near KFC, beside the pharmacy"
                />
                <p className="text-xs text-muted-foreground">
                  Help customers find you with landmarks or directions
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Latitude</Label>
                  <Input
                    type="number"
                    step="any"
                    value={bookingSettings.latitude || ""}
                    onChange={(e) => setBookingSettings({ ...bookingSettings, latitude: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="14.0101"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Longitude</Label>
                  <Input
                    type="number"
                    step="any"
                    value={bookingSettings.longitude || ""}
                    onChange={(e) => setBookingSettings({ ...bookingSettings, longitude: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="-60.9875"
                  />
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>How to get coordinates:</strong>
                </p>
                <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                  <li>Go to <a href="https://www.google.com/maps" target="_blank" className="text-teal-600 underline">Google Maps</a></li>
                  <li>Find your salon location</li>
                  <li>Right-click on the pin</li>
                  <li>Click the coordinates to copy them</li>
                  <li>Paste here (latitude first, then longitude)</li>
                </ol>
              </div>

              {bookingSettings.latitude && bookingSettings.longitude && (
                <div className="pt-2">
                  <a
                    href={`https://www.google.com/maps?q=${bookingSettings.latitude},${bookingSettings.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700"
                  >
                    <Navigation className="w-4 h-4" />
                    Preview on Google Maps
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deposit Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-teal-600" />
                Deposit Settings
              </CardTitle>
              <CardDescription>
                Require customers to pay a deposit to confirm bookings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="requireDeposit"
                  checked={bookingSettings.requiresDeposit}
                  onChange={(e) => setBookingSettings({ ...bookingSettings, requiresDeposit: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <Label htmlFor="requireDeposit" className="cursor-pointer">
                  Require deposit to confirm bookings
                </Label>
              </div>

              {bookingSettings.requiresDeposit && (
                <div className="space-y-6 pt-4 border-t">
                  {/* Deposit Type */}
                  <div className="space-y-3">
                    <Label>Deposit Amount</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="depositType"
                          value="percentage"
                          checked={bookingSettings.depositType === "percentage"}
                          onChange={() => setBookingSettings({ ...bookingSettings, depositType: "percentage" })}
                          className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                        />
                        <span>Percentage of service</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="depositType"
                          value="fixed"
                          checked={bookingSettings.depositType === "fixed"}
                          onChange={() => setBookingSettings({ ...bookingSettings, depositType: "fixed" })}
                          className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                        />
                        <span>Fixed amount</span>
                      </label>
                    </div>
                  </div>

                  {/* Percentage or Fixed Amount */}
                  {bookingSettings.depositType === "percentage" ? (
                    <div className="space-y-2">
                      <Label>Percentage</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          value={bookingSettings.depositPercentage}
                          onChange={(e) => setBookingSettings({ ...bookingSettings, depositPercentage: parseInt(e.target.value) || 25 })}
                          className="w-24"
                        />
                        <Percent className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">of service total</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Fixed Amount</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{business?.currencySymbol || "$"}</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={bookingSettings.depositAmount || ""}
                          onChange={(e) => setBookingSettings({ ...bookingSettings, depositAmount: e.target.value ? parseFloat(e.target.value) : null })}
                          placeholder="50.00"
                          className="w-32"
                        />
                      </div>
                    </div>
                  )}

                  {/* Payment Deadline */}
                  <div className="space-y-2">
                    <Label>Payment Deadline</Label>
                    <div className="flex items-center gap-2">
                      <select
                        value={bookingSettings.paymentDeadlineHours}
                        onChange={(e) => setBookingSettings({ ...bookingSettings, paymentDeadlineHours: parseInt(e.target.value) })}
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value={24}>24 hours</option>
                        <option value={48}>48 hours</option>
                      </select>
                      <span className="text-sm text-muted-foreground">before appointment</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      If not paid by deadline, booking will be automatically cancelled
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bank Details */}
          {bookingSettings.requiresDeposit && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-teal-600" />
                  Bank Details
                </CardTitle>
                <CardDescription>
                  These details will be shown to customers for deposit payment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <Input
                    value={bookingSettings.bankName || ""}
                    onChange={(e) => setBookingSettings({ ...bookingSettings, bankName: e.target.value })}
                    placeholder="Bank of Saint Lucia"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Account Name</Label>
                  <Input
                    value={bookingSettings.bankAccountName || ""}
                    onChange={(e) => setBookingSettings({ ...bookingSettings, bankAccountName: e.target.value })}
                    placeholder="Your Business Name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input
                    value={bookingSettings.bankAccountNumber || ""}
                    onChange={(e) => setBookingSettings({ ...bookingSettings, bankAccountNumber: e.target.value })}
                    placeholder="1234567890"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Additional Instructions (Optional)</Label>
                  <textarea
                    value={bookingSettings.paymentInstructions || ""}
                    onChange={(e) => setBookingSettings({ ...bookingSettings, paymentInstructions: e.target.value })}
                    placeholder="Please include booking reference in transfer description"
                    rows={3}
                    className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                {/* Preview Box */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-amber-800 mb-2">
                    Customer Preview:
                  </p>
                  <div className="bg-white rounded p-3 text-sm">
                    <p className="font-medium mb-2">Payment Details</p>
                    <p>Bank: {bookingSettings.bankName || "(Not set)"}</p>
                    <p>Account Name: {bookingSettings.bankAccountName || "(Not set)"}</p>
                    <p>Account Number: {bookingSettings.bankAccountNumber || "(Not set)"}</p>
                    {bookingSettings.paymentInstructions && (
                      <p className="mt-2 text-muted-foreground">{bookingSettings.paymentInstructions}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={saveBookingSettings}
              disabled={isSaving}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save Booking Settings"}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Staff Users Tab */}
      {activeTab === "users" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Staff Users</CardTitle>
                  <CardDescription>
                    Manage staff accounts and access levels
                  </CardDescription>
                </div>
                <Button disabled className="bg-teal-600 hover:bg-teal-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No users found
                </div>
              ) : (
                <div className="space-y-3">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 bg-accent/30 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                          <span className="text-sm font-bold text-teal-700">
                            {user.firstName[0]}{user.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {user.email} • @{user.username}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={
                          user.role === "OWNER" ? "bg-purple-100 text-purple-700" :
                          user.role === "MANAGER" ? "bg-blue-100 text-blue-700" :
                          "bg-gray-100 text-gray-700"
                        }>
                          {user.role}
                        </Badge>
                        <Badge className={
                          user.isActive 
                            ? "bg-green-100 text-green-700" 
                            : "bg-red-100 text-red-700"
                        }>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-4 text-center">
                User management coming in next update
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Billing Tab */}
      {activeTab === "billing" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Current Plan Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-teal-600" />
                Subscription Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingBilling ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                </div>
              ) : billing ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Badge className={
                      billing.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                      billing.status === "TRIAL" ? "bg-amber-100 text-amber-700" :
                      billing.status === "PAST_DUE" ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-700"
                    }>
                      {billing.status === "TRIAL" ? "Free Trial" : billing.status}
                    </Badge>
                    {billing.plan && (
                      <span className="text-sm text-muted-foreground">
                        {billing.plan === "yearly" ? "Yearly Plan" : "Monthly Plan"}
                      </span>
                    )}
                  </div>

                  {billing.status === "TRIAL" && billing.trialDaysRemaining !== null && (
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex items-center gap-2 text-amber-800">
                        <Clock className="w-5 h-5" />
                        <span className="font-medium">
                          {billing.trialDaysRemaining === 0
                            ? "Your trial ends today!"
                            : billing.trialDaysRemaining === 1
                              ? "1 day left in your trial"
                              : `${billing.trialDaysRemaining} days left in your trial`}
                        </span>
                      </div>
                      <p className="text-sm text-amber-700 mt-1">
                        Upgrade now to continue using SalonixPro after your trial ends.
                      </p>
                    </div>
                  )}

                  {billing.status === "ACTIVE" && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 text-green-800">
                        <Check className="w-5 h-5" />
                        <span className="font-medium">Your subscription is active</span>
                      </div>
                      {billing.nextBillingDate && (
                        <p className="text-sm text-green-700 mt-1">
                          Next billing date: {new Date(billing.nextBillingDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}

                  {billing.status === "PAST_DUE" && (
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-medium">Payment failed</span>
                      </div>
                      <p className="text-sm text-red-700 mt-1">
                        Please update your payment method to continue using SalonixPro.
                      </p>
                    </div>
                  )}

                  {billing.status === "CANCELLED" && (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 text-gray-800">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-medium">Subscription cancelled</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">
                        Your access will end on {billing.subscriptionEndDate 
                          ? new Date(billing.subscriptionEndDate).toLocaleDateString() 
                          : "your billing date"}.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Unable to load billing information</p>
              )}
            </CardContent>
          </Card>

          {/* Pricing Plans */}
          {billing && (billing.status === "TRIAL" || billing.status === "CANCELLED" || billing.status === "EXPIRED") && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-teal-600" />
                  Choose Your Plan
                </CardTitle>
                <CardDescription>
                  Select a plan to continue using SalonixPro
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Monthly Plan */}
                  <div className="border-2 rounded-xl p-6 hover:border-teal-300 transition-colors">
                    <h3 className="text-lg font-semibold mb-2">Monthly</h3>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-3xl font-bold">$12</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <ul className="space-y-2 mb-6 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-teal-600" />
                        All features included
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-teal-600" />
                        Unlimited appointments
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-teal-600" />
                        Cancel anytime
                      </li>
                    </ul>
                    <Button 
                      className="w-full bg-teal-600 hover:bg-teal-700"
                      onClick={() => handleCheckout("monthly")}
                      disabled={isCheckingOut}
                    >
                      {isCheckingOut ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      Subscribe Monthly
                    </Button>
                  </div>

                  {/* Yearly Plan */}
                  <div className="border-2 border-teal-600 rounded-xl p-6 relative">
                    <Badge className="absolute -top-3 left-4 bg-teal-600">
                      Save $44/year
                    </Badge>
                    <h3 className="text-lg font-semibold mb-2">Yearly</h3>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-3xl font-bold">$100</span>
                      <span className="text-muted-foreground">/year</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      That's just $8.33/month
                    </p>
                    <ul className="space-y-2 mb-6 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-teal-600" />
                        All features included
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-teal-600" />
                        2 months free
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-teal-600" />
                        Priority support
                      </li>
                    </ul>
                    <Button 
                      className="w-full bg-teal-600 hover:bg-teal-700"
                      onClick={() => handleCheckout("yearly")}
                      disabled={isCheckingOut}
                    >
                      {isCheckingOut ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      Subscribe Yearly
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-center text-muted-foreground mt-6">
                  Secure payment via PayPal. Cancel anytime.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Manage Subscription */}
          {billing && billing.status === "ACTIVE" && billing.paypalSubscriptionId && (
            <Card>
              <CardHeader>
                <CardTitle>Manage Subscription</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-accent/30 rounded-lg">
                  <div>
                    <p className="font-medium">PayPal Subscription</p>
                    <p className="text-sm text-muted-foreground">
                      ID: {billing.paypalSubscriptionId}
                    </p>
                  </div>
                  <a
                    href="https://www.paypal.com/myaccount/autopay"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Manage in PayPal
                    </Button>
                  </a>
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    variant="destructive" 
                    onClick={handleCancelSubscription}
                  >
                    Cancel Subscription
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    You'll retain access until the end of your billing period.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}
