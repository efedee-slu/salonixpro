// app/(onboarding)/onboarding/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scissors,
  Search,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Loader2,
  Store,
  Sparkles,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CARIBBEAN_CURRENCIES } from "@/lib/currencies";

interface MasterService {
  id: string;
  code: string;
  name: string;
  category: string;
  subcategory: string;
  defaultDuration: number;
  description: string | null;
}

interface ServiceGroup {
  category: string;
  subcategory: string;
  services: MasterService[];
}

interface SelectedService {
  masterServiceId: string;
  name: string;
  price: string;
  duration: number;
  subcategory: string;
}

const BUSINESS_TYPES = [
  {
    type: "HAIR_SALON",
    label: "Hair Salon",
    description: "Cuts, colour, braids, locs, treatments & more",
    icon: "✂️",
  },
  {
    type: "BARBERSHOP",
    label: "Barber Shop",
    description: "Fades, line-ups, beard work & grooming",
    icon: "💈",
  },
  {
    type: "NAIL_SALON",
    label: "Nail Salon",
    description: "Manicures, pedicures, gel, acrylics & nail art",
    icon: "💅",
  },
  {
    type: "MULTI_SERVICE",
    label: "Multi-Service",
    description: "Combination of hair, barber & nail services",
    icon: "🏪",
  },
];

const steps = [
  { label: "Business Type", icon: Store },
  { label: "Select Services", icon: Sparkles },
  { label: "Set Prices", icon: Coins },
  { label: "Review", icon: Check },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 state
  const [businessType, setBusinessType] = useState("");
  const [currency, setCurrency] = useState(session?.user?.businessSlug ? "XCD" : "XCD");

  // Step 2 state
  const [serviceGroups, setServiceGroups] = useState<ServiceGroup[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Step 3 state
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);

  // Fetch services when business type is chosen and we move to step 2
  useEffect(() => {
    if (currentStep === 1 && businessType) {
      fetchCatalog();
    }
  }, [currentStep, businessType]);

  // Sync selectedServices when moving to step 3
  useEffect(() => {
    if (currentStep === 2) {
      syncSelectedServices();
    }
  }, [currentStep]);

  const fetchCatalog = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/onboarding?businessType=${businessType}`);
      if (res.ok) {
        const data = await res.json();
        setServiceGroups(data.groups);
        // Expand all sections by default
        const allSections = new Set<string>(data.groups.map((g: ServiceGroup) => g.subcategory));
        setExpandedSections(allSections);
      }
    } catch (err) {
      console.error("Failed to fetch catalog:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const syncSelectedServices = () => {
    const allServices = serviceGroups.flatMap((g) => g.services);
    const newSelected: SelectedService[] = [];
    Array.from(selectedIds).forEach((id) => {
      const ms = allServices.find((s) => s.id === id);
      if (ms) {
        // Keep existing price if already set
        const existing = selectedServices.find((s) => s.masterServiceId === id);
        newSelected.push({
          masterServiceId: ms.id,
          name: ms.name,
          price: existing?.price || "",
          duration: existing?.duration || ms.defaultDuration,
          subcategory: ms.subcategory,
        });
      }
    });
    setSelectedServices(newSelected);
  };

  const toggleService = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSection = (subcategory: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(subcategory)) {
        next.delete(subcategory);
      } else {
        next.add(subcategory);
      }
      return next;
    });
  };

  const selectAllInSection = (services: MasterService[]) => {
    const allSelected = services.every((s) => selectedIds.has(s.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const s of services) {
        if (allSelected) {
          next.delete(s.id);
        } else {
          next.add(s.id);
        }
      }
      return next;
    });
  };

  const updatePrice = (masterServiceId: string, price: string) => {
    setSelectedServices((prev) =>
      prev.map((s) =>
        s.masterServiceId === masterServiceId ? { ...s, price } : s
      )
    );
  };

  const updateDuration = (masterServiceId: string, duration: number) => {
    setSelectedServices((prev) =>
      prev.map((s) =>
        s.masterServiceId === masterServiceId ? { ...s, duration } : s
      )
    );
  };

  // Filter services by search
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return serviceGroups;
    const q = searchQuery.toLowerCase();
    return serviceGroups
      .map((g) => ({
        ...g,
        services: g.services.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.description?.toLowerCase().includes(q) ||
            s.subcategory.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.services.length > 0);
  }, [serviceGroups, searchQuery]);

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return businessType !== "" && currency !== "";
      case 1:
        return selectedIds.size > 0;
      case 2:
        return selectedServices.every(
          (s) => s.price !== "" && parseFloat(s.price) >= 0
        );
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessType,
          currency,
          selectedServices: selectedServices.map((s) => ({
            masterServiceId: s.masterServiceId,
            price: parseFloat(s.price),
            duration: s.duration,
          })),
        }),
      });

      if (res.ok) {
        // Update the session to reflect onboarding complete
        await updateSession();
        router.push("/dashboard");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to complete setup");
      }
    } catch (err) {
      alert("Failed to complete setup. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currencySymbol =
    CARIBBEAN_CURRENCIES.find((c) => c.code === currency)?.symbol || "$";

  // Group selected services by subcategory for review
  const selectedBySubcategory = useMemo(() => {
    const groups: Record<string, SelectedService[]> = {};
    for (const s of selectedServices) {
      if (!groups[s.subcategory]) groups[s.subcategory] = [];
      groups[s.subcategory].push(s);
    }
    return groups;
  }, [selectedServices]);

  return (
    <div className="space-y-8">
      {/* Progress Bar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          {steps.map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  i < currentStep
                    ? "bg-teal-600 text-white"
                    : i === currentStep
                    ? "bg-teal-100 text-teal-600 border-2 border-teal-600"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={`hidden sm:inline text-sm font-medium ${
                  i <= currentStep
                    ? "text-teal-600"
                    : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
              {i < steps.length - 1 && (
                <div
                  className={`hidden sm:block w-12 h-0.5 mx-2 ${
                    i < currentStep ? "bg-teal-600" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <Progress
          value={((currentStep + 1) / steps.length) * 100}
          className="h-2"
        />
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Business Type + Currency */}
        {currentStep === 0 && (
          <motion.div
            key="step-0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-2xl font-bold">What type of business do you run?</h2>
              <p className="text-muted-foreground mt-1">
                This helps us show you the most relevant services
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {BUSINESS_TYPES.map((bt) => {
                const isSelected = businessType === bt.type;
                return (
                  <Card
                    key={bt.type}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? "ring-2 ring-teal-600 bg-teal-50/50"
                        : "hover:border-teal-300"
                    }`}
                    onClick={() => setBusinessType(bt.type)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="text-3xl">{bt.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{bt.label}</h3>
                            {isSelected && (
                              <Check className="w-4 h-4 text-teal-600" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {bt.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Select your currency</h3>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full max-w-sm h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {CARIBBEAN_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} - {c.name}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>
        )}

        {/* Step 2: Select Services */}
        {currentStep === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Select your services</h2>
                <p className="text-muted-foreground mt-1">
                  Choose the services you offer. You can add more later.
                </p>
              </div>
              <Badge variant="secondary" className="text-sm self-start">
                {selectedIds.size} selected
              </Badge>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              </div>
            ) : (
              <div className="space-y-4">
                {filteredGroups.map((group) => {
                  const isExpanded = expandedSections.has(group.subcategory);
                  const selectedInGroup = group.services.filter((s) =>
                    selectedIds.has(s.id)
                  ).length;
                  const allSelected =
                    selectedInGroup === group.services.length;

                  return (
                    <Card key={`${group.category}-${group.subcategory}`}>
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => toggleSection(group.subcategory)}
                      >
                        <div className="flex items-center gap-3">
                          <ChevronDown
                            className={`w-5 h-5 transition-transform ${
                              isExpanded ? "" : "-rotate-90"
                            }`}
                          />
                          <div>
                            <h3 className="font-semibold">{group.subcategory}</h3>
                            {businessType === "MULTI_SERVICE" && (
                              <span className="text-xs text-muted-foreground">
                                {group.category.replace("_", " ")}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {selectedInGroup > 0 && (
                            <Badge className="bg-teal-100 text-teal-700">
                              {selectedInGroup}/{group.services.length}
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              selectAllInSection(group.services);
                            }}
                            className="text-xs"
                          >
                            {allSelected ? "Deselect All" : "Select All"}
                          </Button>
                        </div>
                      </div>

                      {isExpanded && (
                        <CardContent className="pt-0 pb-4 px-4">
                          <div className="space-y-2">
                            {group.services.map((service) => {
                              const isSelected = selectedIds.has(service.id);
                              return (
                                <div
                                  key={service.id}
                                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                    isSelected
                                      ? "bg-teal-50 border border-teal-200"
                                      : "hover:bg-accent/50 border border-transparent"
                                  }`}
                                  onClick={() => toggleService(service.id)}
                                >
                                  <div
                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                      isSelected
                                        ? "bg-teal-600 border-teal-600"
                                        : "border-muted-foreground/30"
                                    }`}
                                  >
                                    {isSelected && (
                                      <Check className="w-3 h-3 text-white" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm">
                                      {service.name}
                                    </p>
                                    {service.description && (
                                      <p className="text-xs text-muted-foreground truncate">
                                        {service.description}
                                      </p>
                                    )}
                                  </div>
                                  <span className="text-xs text-muted-foreground flex-shrink-0">
                                    {service.defaultDuration} min
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Step 3: Set Prices */}
        {currentStep === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold">Set your prices</h2>
              <p className="text-muted-foreground mt-1">
                Enter the price for each service in {currencySymbol}. You can
                adjust durations too.
              </p>
            </div>

            <div className="space-y-6">
              {Object.entries(selectedBySubcategory).map(
                ([subcategory, services]) => (
                  <Card key={subcategory}>
                    <div className="p-4 border-b">
                      <h3 className="font-semibold">{subcategory}</h3>
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {services.map((service) => (
                          <div
                            key={service.masterServiceId}
                            className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg bg-accent/30"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">
                                {service.name}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <span className="text-sm text-muted-foreground">
                                  {currencySymbol}
                                </span>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={service.price}
                                  onChange={(e) =>
                                    updatePrice(
                                      service.masterServiceId,
                                      e.target.value
                                    )
                                  }
                                  className="w-24 h-8 text-sm"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  min="5"
                                  step="5"
                                  value={service.duration}
                                  onChange={(e) =>
                                    updateDuration(
                                      service.masterServiceId,
                                      parseInt(e.target.value) || 30
                                    )
                                  }
                                  className="w-20 h-8 text-sm"
                                />
                                <span className="text-sm text-muted-foreground">
                                  min
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          </motion.div>
        )}

        {/* Step 4: Review */}
        {currentStep === 3 && (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold">Review & complete</h2>
              <p className="text-muted-foreground mt-1">
                Everything look good? You can always change things later.
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl mb-1">
                    {BUSINESS_TYPES.find((b) => b.type === businessType)?.icon}
                  </p>
                  <p className="font-semibold">
                    {BUSINESS_TYPES.find((b) => b.type === businessType)?.label}
                  </p>
                  <p className="text-sm text-muted-foreground">Business Type</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-teal-600 mb-1">
                    {currencySymbol}
                  </p>
                  <p className="font-semibold">{currency}</p>
                  <p className="text-sm text-muted-foreground">Currency</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-teal-600 mb-1">
                    {selectedServices.length}
                  </p>
                  <p className="font-semibold">Services</p>
                  <p className="text-sm text-muted-foreground">Selected</p>
                </CardContent>
              </Card>
            </div>

            {/* Service List */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {Object.entries(selectedBySubcategory).map(
                    ([subcategory, services]) => (
                      <div key={subcategory}>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                          {subcategory} ({services.length})
                        </h4>
                        <div className="space-y-1">
                          {services.map((service) => (
                            <div
                              key={service.masterServiceId}
                              className="flex items-center justify-between py-1.5 text-sm"
                            >
                              <span>{service.name}</span>
                              <div className="flex items-center gap-4 text-muted-foreground">
                                <span>{service.duration} min</span>
                                <span className="font-medium text-foreground">
                                  {currencySymbol}
                                  {parseFloat(service.price || "0").toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div>
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={() => setCurrentStep((s) => s - 1)}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
        </div>
        <div>
          {currentStep < steps.length - 1 ? (
            <Button
              onClick={() => setCurrentStep((s) => s + 1)}
              disabled={!canProceed()}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={isSubmitting || !canProceed()}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Complete Setup
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
