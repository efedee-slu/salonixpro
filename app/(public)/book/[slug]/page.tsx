// app/(public)/book/[slug]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scissors,
  User,
  Calendar,
  Clock,
  ChevronRight,
  ChevronLeft,
  Check,
  MapPin,
  Phone,
  Mail,
  Building2,
  Loader2,
  AlertCircle,
  Navigation,
  Banknote,
  Copy,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CustomerChat } from "@/components/chat/customer-chat";

interface Business {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string;
  currencySymbol: string;
  logo: string | null;
  businessHours: BusinessHour[] | null;
  // Location
  latitude: number | null;
  longitude: number | null;
  locationLandmark: string | null;
  // Deposit settings
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

interface BusinessHour {
  day: string;
  dayIndex: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface ServiceCategory {
  id: string;
  name: string;
  services: Service[];
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  categoryId: string;
}

interface Stylist {
  id: string;
  firstName: string;
  lastName: string;
  title: string | null;
  bio: string | null;
  photo: string | null;
}

interface TimeSlot {
  time: string;
  display: string;
  available: boolean;
}

type Step = "services" | "stylist" | "datetime" | "details" | "confirm";

export default function PublicBookingPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);

  const [currentStep, setCurrentStep] = useState<Step>("services");
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const [customerInfo, setCustomerInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingReference, setBookingReference] = useState<string | null>(null);
  const [depositInfo, setDepositInfo] = useState<{
    requiresDeposit: boolean;
    depositAmount: number | null;
    paymentDeadline: string | null;
    bankDetails: {
      bankName: string | null;
      bankAccountName: string | null;
      bankAccountNumber: string | null;
      paymentInstructions: string | null;
    } | null;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchBusinessData();
    }
  }, [slug]);

  useEffect(() => {
    if (selectedDate && selectedStylist) {
      fetchAvailableSlots();
    }
  }, [selectedDate, selectedStylist]);

  const fetchBusinessData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/public/book/${slug}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError("Business not found");
        } else {
          setError("Failed to load booking page");
        }
        return;
      }
      const data = await response.json();
      setBusiness(data.business);
      setCategories(data.categories);
      setStylists(data.stylists);
    } catch (err) {
      setError("Failed to load booking page");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedDate || !selectedStylist || !business) return;
    
    setIsLoadingSlots(true);
    try {
      const dateStr = selectedDate.toISOString().split("T")[0];
      const duration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
      const response = await fetch(
        `/api/public/book/${slug}/slots?date=${dateStr}&stylistId=${selectedStylist.id}&duration=${duration}`
      );
      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data.slots);
      }
    } catch (err) {
      console.error("Error fetching slots:", err);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const toggleService = (service: Service) => {
    setSelectedServices((prev) => {
      const exists = prev.find((s) => s.id === service.id);
      if (exists) {
        return prev.filter((s) => s.id !== service.id);
      }
      return [...prev, service];
    });
  };

  const getTotalDuration = () => {
    return selectedServices.reduce((sum, s) => sum + s.duration, 0);
  };

  const getTotalPrice = () => {
    return selectedServices.reduce((sum, s) => sum + s.price, 0);
  };

  const formatCurrency = (amount: number) => {
    return `${business?.currencySymbol || "$"}${amount.toFixed(2)}`;
  };

  const getNextDays = (count: number) => {
    const days: Date[] = [];
    const today = new Date();
    for (let i = 0; i < count; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const isDayOpen = (date: Date) => {
    if (!business?.businessHours) return true;
    const dayIndex = date.getDay();
    const dayHours = business.businessHours.find((h) => h.dayIndex === dayIndex);
    return dayHours?.isOpen ?? false;
  };

  const handleSubmit = async () => {
    if (!business || !selectedStylist || !selectedDate || !selectedTime) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/public/book/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          services: selectedServices.map((s) => s.id),
          stylistId: selectedStylist.id,
          date: selectedDate.toISOString().split("T")[0],
          time: selectedTime,
          customer: customerInfo,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setBookingReference(data.reference);
        setDepositInfo({
          requiresDeposit: data.requiresDeposit || false,
          depositAmount: data.depositAmount,
          paymentDeadline: data.paymentDeadline,
          bankDetails: data.bankDetails,
        });
        setBookingComplete(true);
      } else {
        const err = await response.json();
        alert(err.error || "Failed to create booking");
      }
    } catch (err) {
      alert("Failed to create booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmitPayment = async () => {
    if (!bookingReference) return;
    
    setIsSubmittingPayment(true);
    try {
      // Get the appointment ID from somewhere - for now we'll use the reference
      const response = await fetch(`/api/public/payment-submitted`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingReference,
          slug,
        }),
      });

      if (response.ok) {
        setPaymentSubmitted(true);
      }
    } catch (err) {
      console.error("Error submitting payment notification:", err);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const getDirectionsUrl = () => {
    if (business?.latitude && business?.longitude) {
      return `https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`;
    }
    if (business?.address) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address + ", " + business.city)}`;
    }
    return null;
  };

  const steps: { id: Step; label: string; icon: React.ElementType }[] = [
    { id: "services", label: "Services", icon: Scissors },
    { id: "stylist", label: "Stylist", icon: User },
    { id: "datetime", label: "Date & Time", icon: Calendar },
    { id: "details", label: "Your Details", icon: Mail },
    { id: "confirm", label: "Confirm", icon: Check },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const canProceed = () => {
    switch (currentStep) {
      case "services":
        return selectedServices.length > 0;
      case "stylist":
        return selectedStylist !== null;
      case "datetime":
        return selectedDate !== null && selectedTime !== null;
      case "details":
        return (
          customerInfo.firstName.trim() !== "" &&
          customerInfo.lastName.trim() !== "" &&
          customerInfo.phone.trim() !== ""
        );
      default:
        return true;
    }
  };

  const goNext = () => {
    const idx = currentStepIndex;
    if (idx < steps.length - 1) {
      setCurrentStep(steps[idx + 1].id);
    }
  };

  const goBack = () => {
    const idx = currentStepIndex;
    if (idx > 0) {
      setCurrentStep(steps[idx - 1].id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading booking page...</p>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Booking Unavailable</h1>
            <p className="text-muted-foreground">{error || "Business not found"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-lg"
        >
          <Card>
            <CardContent className="pt-8 pb-8">
              {/* Success Icon */}
              <div className="text-center mb-6">
                <div className={`w-20 h-20 rounded-full ${depositInfo?.requiresDeposit ? "bg-amber-100" : "bg-green-100"} flex items-center justify-center mx-auto mb-4`}>
                  {depositInfo?.requiresDeposit ? (
                    <CreditCard className="w-10 h-10 text-amber-600" />
                  ) : (
                    <Check className="w-10 h-10 text-green-600" />
                  )}
                </div>
                <h1 className="text-2xl font-bold mb-2">
                  {depositInfo?.requiresDeposit ? "Booking Reserved!" : "Booking Confirmed!"}
                </h1>
                <p className="text-muted-foreground">
                  Your appointment has been successfully scheduled.
                </p>
              </div>
              
              {/* Reference Number */}
              {bookingReference && (
                <div className="bg-muted/50 rounded-lg p-4 mb-6 text-center">
                  <p className="text-sm text-muted-foreground">Booking Reference</p>
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-xl font-mono font-bold">{bookingReference}</p>
                    <button 
                      onClick={() => handleCopy(bookingReference, "reference")}
                      className="p-1 hover:bg-muted rounded"
                    >
                      {copiedField === "reference" ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Deposit Required Section */}
              {depositInfo?.requiresDeposit && depositInfo.bankDetails && (
                <div className="mb-6">
                  {/* Important Notice */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-800">Payment Required</p>
                        <p className="text-sm text-slate-600 mt-1">
                          A deposit is required to secure this booking. Payment must be completed within {business?.paymentDeadlineHours || 48} hours of this confirmation.
                        </p>
                        {depositInfo.paymentDeadline && (
                          <p className="text-sm font-medium text-slate-800 mt-2">
                            Pay by: {new Date(depositInfo.paymentDeadline).toLocaleDateString("en-US", { 
                              weekday: "short", 
                              month: "short", 
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit"
                            })}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 mt-2">
                          If payment is not received within this timeframe, the appointment may be automatically cancelled and released to other clients.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Deposit Amount */}
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-teal-800">Deposit Required</span>
                      <span className="text-xl font-bold text-teal-700">
                        {business?.currencySymbol}{depositInfo.depositAmount?.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                      <Banknote className="w-5 h-5 text-teal-600" />
                      <h3 className="font-semibold">Payment Details</h3>
                    </div>
                    
                    {depositInfo.bankDetails.bankName && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Bank</span>
                        <span className="font-medium">{depositInfo.bankDetails.bankName}</span>
                      </div>
                    )}
                    
                    {depositInfo.bankDetails.bankAccountName && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Account Name</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{depositInfo.bankDetails.bankAccountName}</span>
                          <button 
                            onClick={() => handleCopy(depositInfo.bankDetails!.bankAccountName!, "accountName")}
                            className="p-1 hover:bg-muted rounded"
                          >
                            {copiedField === "accountName" ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {depositInfo.bankDetails.bankAccountNumber && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Account Number</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium">{depositInfo.bankDetails.bankAccountNumber}</span>
                          <button 
                            onClick={() => handleCopy(depositInfo.bankDetails!.bankAccountNumber!, "accountNumber")}
                            className="p-1 hover:bg-muted rounded"
                          >
                            {copiedField === "accountNumber" ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-muted-foreground">Reference</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-teal-600">{bookingReference}</span>
                        <button 
                          onClick={() => handleCopy(bookingReference!, "refCopy")}
                          className="p-1 hover:bg-muted rounded"
                        >
                          {copiedField === "refCopy" ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {depositInfo.bankDetails.paymentInstructions && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground">{depositInfo.bankDetails.paymentInstructions}</p>
                      </div>
                    )}
                  </div>

                  {/* Payment Confirmation Button */}
                  <div className="mt-4">
                    {paymentSubmitted ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                        <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <p className="font-medium text-green-800">Payment Notification Sent!</p>
                        <p className="text-sm text-green-600">
                          The salon will confirm your booking once they verify the payment.
                        </p>
                      </div>
                    ) : (
                      <Button 
                        onClick={handleSubmitPayment}
                        disabled={isSubmittingPayment}
                        className="w-full bg-teal-600 hover:bg-teal-700"
                      >
                        {isSubmittingPayment ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Notifying Salon...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            I've Made the Payment
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Appointment Details */}
              <div className="bg-accent/30 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold mb-2">Appointment Details</h4>
                <p><strong>Date:</strong> {selectedDate?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
                <p><strong>Time:</strong> {selectedTime}</p>
                <p><strong>Stylist:</strong> {selectedStylist?.firstName} {selectedStylist?.lastName}</p>
                <p><strong>Services:</strong> {selectedServices.map(s => s.name).join(", ")}</p>
                <p><strong>Total:</strong> {formatCurrency(getTotalPrice())}</p>
              </div>

              {/* Location & Contact */}
              <div className="mt-6 pt-6 border-t space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p>{business?.address}</p>
                    {business?.locationLandmark && (
                      <p className="text-muted-foreground">{business.locationLandmark}</p>
                    )}
                  </div>
                </div>
                
                {getDirectionsUrl() && (
                  <a 
                    href={getDirectionsUrl()!} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 text-sm"
                  >
                    <Navigation className="w-4 h-4" />
                    Get Directions
                  </a>
                )}
                
                {business?.phone && (
                  <p className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${business.phone}`} className="hover:text-teal-600">
                      {business.phone}
                    </a>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                {business.logo ? (
                  <img src={business.logo} alt={business.name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <Building2 className="w-5 h-5 text-teal-600" />
                )}
              </div>
              <div>
                <h1 className="font-bold text-lg">{business.name}</h1>
                <p className="text-xs text-muted-foreground">
                  {business.city}, {business.country}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${index < steps.length - 1 ? "flex-1" : ""}`}
              >
                <div
                  className={`flex items-center gap-2 ${
                    index <= currentStepIndex
                      ? "text-teal-600"
                      : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      index < currentStepIndex
                        ? "bg-teal-600 text-white"
                        : index === currentStepIndex
                        ? "bg-teal-100 text-teal-600 border-2 border-teal-600"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index < currentStepIndex ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium">
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      index < currentStepIndex ? "bg-teal-600" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Services */}
          {currentStep === "services" && (
            <motion.div
              key="services"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold">Select Services</h2>
                <p className="text-muted-foreground">Choose one or more services</p>
              </div>

              {categories.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No services available
                  </CardContent>
                </Card>
              ) : (
                categories.map((category) => (
                  <div key={category.id} className="space-y-3">
                    <h3 className="font-semibold text-lg">{category.name}</h3>
                    <div className="grid gap-3">
                      {category.services.map((service) => {
                        const isSelected = selectedServices.some(
                          (s) => s.id === service.id
                        );
                        return (
                          <Card
                            key={service.id}
                            className={`cursor-pointer transition-all ${
                              isSelected
                                ? "ring-2 ring-teal-600 bg-teal-50/50"
                                : "hover:border-teal-300"
                            }`}
                            onClick={() => toggleService(service)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">{service.name}</h4>
                                    {isSelected && (
                                      <Check className="w-4 h-4 text-teal-600" />
                                    )}
                                  </div>
                                  {service.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {service.description}
                                    </p>
                                  )}
                                  <p className="text-sm text-muted-foreground mt-1">
                                    <Clock className="w-3 h-3 inline mr-1" />
                                    {service.duration} min
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-teal-600">
                                    {formatCurrency(service.price)}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {/* Step 2: Stylist */}
          {currentStep === "stylist" && (
            <motion.div
              key="stylist"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold">Choose Your Stylist</h2>
                <p className="text-muted-foreground">Select who you'd like to see</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {stylists.map((stylist) => {
                  const isSelected = selectedStylist?.id === stylist.id;
                  return (
                    <Card
                      key={stylist.id}
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? "ring-2 ring-teal-600 bg-teal-50/50"
                          : "hover:border-teal-300"
                      }`}
                      onClick={() => setSelectedStylist(stylist)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center overflow-hidden">
                            {stylist.photo ? (
                              <img
                                src={stylist.photo}
                                alt={`${stylist.firstName} ${stylist.lastName}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xl font-bold text-teal-600">
                                {stylist.firstName[0]}
                                {stylist.lastName[0]}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">
                                {stylist.firstName} {stylist.lastName}
                              </h4>
                              {isSelected && (
                                <Check className="w-4 h-4 text-teal-600" />
                              )}
                            </div>
                            {stylist.title && (
                              <Badge variant="secondary" className="mt-1">
                                {stylist.title}
                              </Badge>
                            )}
                            {stylist.bio && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {stylist.bio}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 3: Date & Time */}
          {currentStep === "datetime" && (
            <motion.div
              key="datetime"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold">Pick Date & Time</h2>
                <p className="text-muted-foreground">
                  Duration: {getTotalDuration()} minutes
                </p>
              </div>

              {/* Date Selection */}
              <div>
                <h3 className="font-medium mb-3">Select a Date</h3>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {getNextDays(14).map((date) => {
                    const isOpen = isDayOpen(date);
                    const isSelected =
                      selectedDate?.toDateString() === date.toDateString();
                    const isToday =
                      date.toDateString() === new Date().toDateString();

                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => isOpen && setSelectedDate(date)}
                        disabled={!isOpen}
                        className={`flex-shrink-0 w-16 py-3 rounded-lg text-center transition-all ${
                          !isOpen
                            ? "bg-muted text-muted-foreground cursor-not-allowed"
                            : isSelected
                            ? "bg-teal-600 text-white"
                            : "bg-white border hover:border-teal-300"
                        }`}
                      >
                        <p className="text-xs uppercase">
                          {date.toLocaleDateString("en-US", { weekday: "short" })}
                        </p>
                        <p className="text-lg font-bold">{date.getDate()}</p>
                        <p className="text-xs">
                          {date.toLocaleDateString("en-US", { month: "short" })}
                        </p>
                        {isToday && (
                          <p className="text-[10px] mt-1">Today</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div>
                  <h3 className="font-medium mb-3">Select a Time</h3>
                  {isLoadingSlots ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No available times for this date
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.time}
                          onClick={() => slot.available && setSelectedTime(slot.time)}
                          disabled={!slot.available}
                          className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                            !slot.available
                              ? "bg-muted text-muted-foreground cursor-not-allowed line-through"
                              : selectedTime === slot.time
                              ? "bg-teal-600 text-white"
                              : "bg-white border hover:border-teal-300"
                          }`}
                        >
                          {slot.display}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 4: Customer Details */}
          {currentStep === "details" && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold">Your Details</h2>
                <p className="text-muted-foreground">Enter your contact information</p>
              </div>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={customerInfo.firstName}
                        onChange={(e) =>
                          setCustomerInfo((prev) => ({
                            ...prev,
                            firstName: e.target.value,
                          }))
                        }
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={customerInfo.lastName}
                        onChange={(e) =>
                          setCustomerInfo((prev) => ({
                            ...prev,
                            lastName: e.target.value,
                          }))
                        }
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) =>
                        setCustomerInfo((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      placeholder="+1 (758) 123-4567"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email (optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) =>
                        setCustomerInfo((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="john@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Special Requests (optional)</Label>
                    <textarea
                      id="notes"
                      value={customerInfo.notes}
                      onChange={(e) =>
                        setCustomerInfo((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      placeholder="Any special requests or notes..."
                      className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 5: Confirm */}
          {currentStep === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold">Confirm Your Booking</h2>
                <p className="text-muted-foreground">Review your appointment details</p>
              </div>

              <Card>
                <CardContent className="p-6 space-y-4">
                  {/* Services */}
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      Services
                    </h4>
                    <div className="space-y-2">
                      {selectedServices.map((service) => (
                        <div
                          key={service.id}
                          className="flex justify-between items-center"
                        >
                          <div>
                            <p className="font-medium">{service.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {service.duration} min
                            </p>
                          </div>
                          <p className="font-medium">
                            {formatCurrency(service.price)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <hr />

                  {/* Stylist */}
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      Stylist
                    </h4>
                    <p className="font-medium">
                      {selectedStylist?.firstName} {selectedStylist?.lastName}
                    </p>
                  </div>

                  <hr />

                  {/* Date & Time */}
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      Date & Time
                    </h4>
                    <p className="font-medium">
                      {selectedDate?.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-muted-foreground">{selectedTime}</p>
                  </div>

                  <hr />

                  {/* Customer Info */}
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      Your Information
                    </h4>
                    <p className="font-medium">
                      {customerInfo.firstName} {customerInfo.lastName}
                    </p>
                    <p className="text-muted-foreground">{customerInfo.phone}</p>
                    {customerInfo.email && (
                      <p className="text-muted-foreground">{customerInfo.email}</p>
                    )}
                    {customerInfo.notes && (
                      <p className="text-sm mt-2 p-2 bg-muted rounded">
                        Note: {customerInfo.notes}
                      </p>
                    )}
                  </div>

                  <hr />

                  {/* Total */}
                  <div className="flex justify-between items-center text-lg">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-teal-600">
                      {formatCurrency(getTotalPrice())}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Summary & Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              {selectedServices.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {selectedServices.length} service{selectedServices.length !== 1 ? "s" : ""} •{" "}
                    {getTotalDuration()} min
                  </p>
                  <p className="font-bold text-teal-600">
                    {formatCurrency(getTotalPrice())}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {currentStepIndex > 0 && (
                <Button variant="outline" onClick={goBack}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              )}
              {currentStep === "confirm" ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Confirm Booking
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={goNext}
                  disabled={!canProceed()}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  Continue
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Spacer for fixed bottom bar */}
        <div className="h-24" />
      </main>

      {/* Customer Chatbot */}
      {business && (
        <CustomerChat
          business={{
            name: business.name,
            phone: business.phone || undefined,
            address: business.address || undefined,
            city: business.city || undefined,
            openingTime: business.businessHours?.[0]?.openTime,
            closingTime: business.businessHours?.[0]?.closeTime,
            workingDays: business.businessHours
              ?.filter((h) => h.isOpen)
              .map((h) => h.day),
            currencySymbol: business.currencySymbol,
            services: categories.flatMap((cat) =>
              cat.services.map((s) => ({
                id: s.id,
                name: s.name,
                price: s.price,
                duration: s.duration,
                category: cat.name,
              }))
            ),
          }}
        />
      )}
    </div>
  );
}
