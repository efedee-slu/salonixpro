// app/(dashboard)/product-costing/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Calculator,
  Plus,
  Save,
  FileDown,
  Copy,
  Trash2,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  Link as LinkIcon,
  Package,
  Ship,
  Receipt,
  DollarSign,
  Percent,
  FileText,
  History,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn, formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

// ============================================
// TYPES
// ============================================

interface CustomTax {
  name: string;
  rate: number;
  amount: number;
  isPercentage: boolean;
}

interface CostingForm {
  productName: string;
  supplier: string;
  quantity: number;
  unitPrice: number;
  purchaseCurrency: string;
  localCurrency: string;
  localCurrencySymbol: string;
  exchangeRate: number;
  shippingCost: number;
  freightCost: number;
  dutyRate: number;
  exciseTax: number;
  vatRate: number;
  hslRate: number;
  customsFee: number;
  insurance: number;
  handlingFee: number;
  otherCosts: number;
  otherDescription: string;
  customTaxes: CustomTax[];
  markupPercent: number;
  targetSellingPrice: number;
  roundUp: boolean;
  linkedProductId: string;
}

interface CostingRecord {
  id: string;
  productName: string;
  supplier: string | null;
  quantity: number;
  unitPrice: number;
  purchaseCurrency: string;
  localCurrency: string;
  localCurrencySymbol: string;
  exchangeRate: number;
  landedCostPerUnit: number;
  sellingPrice: number;
  markupPercent: number;
  createdAt: string;
  linkedProduct: { id: string; name: string; sku: string } | null;
}

interface CostingTemplate {
  id: string;
  name: string;
  dutyRate: number;
  vatRate: number;
  hslRate: number;
  exciseTax: number;
  customsFee: number;
  exchangeRate: number;
  defaultMarkup: number;
  shippingEstimate: number;
  purchaseCurrency: string;
  customTaxes: CustomTax[] | null;
  notes: string | null;
}

interface ProductOption {
  id: string;
  name: string;
  sku: string;
}

// ============================================
// CONSTANTS
// ============================================

const PURCHASE_CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "\u20ac", name: "Euro" },
  { code: "GBP", symbol: "\u00a3", name: "British Pound" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "CNY", symbol: "\u00a5", name: "Chinese Yuan" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "INR", symbol: "\u20b9", name: "Indian Rupee" },
];

const DEFAULT_FORM: CostingForm = {
  productName: "",
  supplier: "",
  quantity: 1,
  unitPrice: 0,
  purchaseCurrency: "USD",
  localCurrency: "XCD",
  localCurrencySymbol: "EC$",
  exchangeRate: 2.70,
  shippingCost: 0,
  freightCost: 0,
  dutyRate: 0,
  exciseTax: 0,
  vatRate: 0,
  hslRate: 0,
  customsFee: 0,
  insurance: 0,
  handlingFee: 0,
  otherCosts: 0,
  otherDescription: "",
  customTaxes: [],
  markupPercent: 50,
  targetSellingPrice: 0,
  roundUp: true,
  linkedProductId: "",
};

// ============================================
// COMPONENT
// ============================================

export default function ProductCostingPage() {
  const [form, setForm] = useState<CostingForm>(DEFAULT_FORM);
  const [history, setHistory] = useState<CostingRecord[]>([]);
  const [templates, setTemplates] = useState<CostingTemplate[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState("");
  const [showHistory, setShowHistory] = useState(true);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [linkProductDialogOpen, setLinkProductDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch business settings, history, templates, and products
  useEffect(() => {
    Promise.all([
      fetch("/api/settings").then((r) => r.ok ? r.json() : null),
      fetch("/api/product-costing?limit=50").then((r) => r.ok ? r.json() : null),
      fetch("/api/product-costing/templates").then((r) => r.ok ? r.json() : null),
      fetch("/api/products?limit=100").then((r) => r.ok ? r.json() : null),
    ]).then(([settings, costings, tpls, prods]) => {
      if (settings) {
        setForm((prev) => ({
          ...prev,
          localCurrency: settings.currency || "XCD",
          localCurrencySymbol: settings.currencySymbol || "EC$",
        }));
      }
      if (costings?.data) setHistory(costings.data);
      if (tpls) setTemplates(tpls);
      if (prods?.data) setProducts(prods.data.map((p: any) => ({ id: p.id, name: p.name, sku: p.sku })));
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  // ============================================
  // LIVE CALCULATIONS
  // ============================================

  const calc = useMemo(() => {
    const qty = form.quantity || 1;
    const unitPx = form.unitPrice || 0;
    const rate = form.exchangeRate || 1;
    const totalPurchase = unitPx * qty;
    const totalPurchaseLocal = totalPurchase * rate;

    // Shipping (in purchase currency → convert to local)
    const shippingLocal = (form.shippingCost || 0) * rate;
    const shippingPerUnit = shippingLocal / qty;

    // CIF value (Cost + Insurance + Freight in local currency)
    const cifTotal = totalPurchaseLocal + shippingLocal + (form.insurance || 0);
    const cifPerUnit = cifTotal / qty;

    // Duty on CIF
    const dutyRate = form.dutyRate || 0;
    const dutyTotal = cifTotal * (dutyRate / 100);
    const dutyPerUnit = dutyTotal / qty;

    // Excise tax on CIF + duty
    const exciseBase = cifTotal + dutyTotal;
    const exciseTotal = (form.exciseTax || 0) > 0 ? exciseBase * ((form.exciseTax || 0) / 100) : 0;
    const excisePerUnit = exciseTotal / qty;

    // VAT base = CIF + duty + excise
    const vatBase = cifTotal + dutyTotal + exciseTotal;
    const vatRate = form.vatRate || 0;
    const vatTotal = vatBase * (vatRate / 100);
    const vatPerUnit = vatTotal / qty;

    // HSL base = CIF + duty + excise
    const hslRate = form.hslRate || 0;
    const hslTotal = vatBase * (hslRate / 100);
    const hslPerUnit = hslTotal / qty;

    // Custom taxes
    let customTaxTotal = 0;
    const customTaxDetails = (form.customTaxes || []).map((ct) => {
      const amt = ct.isPercentage ? vatBase * (ct.rate / 100) : ct.rate * qty;
      customTaxTotal += amt;
      return { ...ct, amount: amt, perUnit: amt / qty };
    });

    // Fixed fees
    const customsFeeTotal = (form.customsFee || 0);
    const customsFeePerUnit = customsFeeTotal / qty;

    // Local freight
    const freightTotal = (form.freightCost || 0);
    const freightPerUnit = freightTotal / qty;

    // Insurance per unit
    const insurancePerUnit = (form.insurance || 0) / qty;

    // Handling fee
    const handlingTotal = (form.handlingFee || 0);
    const handlingPerUnit = handlingTotal / qty;

    // Other costs
    const otherTotal = (form.otherCosts || 0);
    const otherPerUnit = otherTotal / qty;

    // Total landed cost
    const totalLandedCost =
      totalPurchaseLocal +
      shippingLocal +
      dutyTotal +
      exciseTotal +
      vatTotal +
      hslTotal +
      customTaxTotal +
      customsFeeTotal +
      freightTotal +
      (form.insurance || 0) +
      handlingTotal +
      otherTotal;

    const landedCostPerUnit = totalLandedCost / qty;

    // Markup & selling price
    const markupPercent = form.markupPercent || 0;
    const markupAmount = landedCostPerUnit * (markupPercent / 100);
    let sellingPrice = landedCostPerUnit + markupAmount;

    // Round up option
    let suggestedRetail = sellingPrice;
    if (form.roundUp && sellingPrice > 0) {
      suggestedRetail = Math.ceil(sellingPrice) - 0.01;
      if (suggestedRetail < sellingPrice) {
        suggestedRetail = Math.ceil(sellingPrice + 1) - 0.01;
      }
    }

    // Profit
    const profitPerUnit = sellingPrice - landedCostPerUnit;
    const profitMargin = sellingPrice > 0 ? (profitPerUnit / sellingPrice) * 100 : 0;

    // Tax recovery info
    const taxRecoveryPerUnit = vatPerUnit + hslPerUnit;

    // Total order values
    const totalOrderCost = totalLandedCost;
    const totalOrderValue = suggestedRetail * qty;

    // Purchase currency symbol
    const purchaseCurrencyObj = PURCHASE_CURRENCIES.find((c) => c.code === form.purchaseCurrency);
    const pSymbol = purchaseCurrencyObj?.symbol || "$";

    return {
      pSymbol,
      localSymbol: form.localCurrencySymbol,
      qty,
      unitPx,
      rate,
      purchasePricePerUnit: unitPx,
      purchasePricePerUnitLocal: unitPx * rate,
      shippingPerUnitPurchase: (form.shippingCost || 0) / qty,
      shippingPerUnit,
      dutyPerUnit,
      vatPerUnit,
      hslPerUnit,
      excisePerUnit,
      customsFeePerUnit,
      freightPerUnit,
      insurancePerUnit,
      handlingPerUnit,
      otherPerUnit,
      customTaxDetails,
      landedCostPerUnit,
      markupPercent,
      markupAmount,
      sellingPrice,
      suggestedRetail,
      profitPerUnit,
      profitMargin,
      taxRecoveryPerUnit,
      totalOrderCost,
      totalOrderValue,
      // For saving
      dutyAmount: dutyTotal,
      vatAmount: vatTotal,
      hslAmount: hslTotal,
      totalLandedCost,
      totalLandedCostLocal: totalLandedCost,
    };
  }, [form]);

  // ============================================
  // HANDLERS
  // ============================================

  const updateField = useCallback((field: keyof CostingForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateNumberField = useCallback((field: keyof CostingForm, value: string) => {
    const num = value === "" ? 0 : parseFloat(value);
    if (!isNaN(num)) {
      setForm((prev) => ({ ...prev, [field]: num }));
    }
  }, []);

  // Reverse calculate markup from target selling price
  const handleTargetPriceChange = useCallback((value: string) => {
    const target = parseFloat(value);
    if (!isNaN(target) && target > 0 && calc.landedCostPerUnit > 0) {
      const markup = ((target - calc.landedCostPerUnit) / calc.landedCostPerUnit) * 100;
      setForm((prev) => ({
        ...prev,
        targetSellingPrice: target,
        markupPercent: Math.max(0, Math.round(markup * 100) / 100),
      }));
    } else {
      setForm((prev) => ({ ...prev, targetSellingPrice: parseFloat(value) || 0 }));
    }
  }, [calc.landedCostPerUnit]);

  const addCustomTax = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      customTaxes: [...prev.customTaxes, { name: "", rate: 0, amount: 0, isPercentage: true }],
    }));
  }, []);

  const updateCustomTax = useCallback((index: number, field: keyof CustomTax, value: any) => {
    setForm((prev) => {
      const taxes = [...prev.customTaxes];
      taxes[index] = { ...taxes[index], [field]: value };
      return { ...prev, customTaxes: taxes };
    });
  }, []);

  const removeCustomTax = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      customTaxes: prev.customTaxes.filter((_, i) => i !== index),
    }));
  }, []);

  // Save costing
  const handleSave = async () => {
    if (!form.productName.trim()) {
      toast({ title: "Error", description: "Product name is required", variant: "destructive" });
      return;
    }
    if (form.unitPrice <= 0) {
      toast({ title: "Error", description: "Unit price must be greater than 0", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        productName: form.productName,
        supplier: form.supplier || null,
        quantity: form.quantity,
        unitPrice: form.unitPrice,
        purchaseCurrency: form.purchaseCurrency,
        shippingCost: form.shippingCost,
        freightCost: form.freightCost,
        dutyRate: form.dutyRate,
        dutyAmount: calc.dutyAmount,
        vatRate: form.vatRate,
        vatAmount: calc.vatAmount,
        hslRate: form.hslRate,
        hslAmount: calc.hslAmount,
        exciseTax: form.exciseTax,
        customsFee: form.customsFee,
        insurance: form.insurance,
        handlingFee: form.handlingFee,
        otherCosts: form.otherCosts,
        otherDescription: form.otherDescription || null,
        customTaxes: form.customTaxes.length > 0 ? form.customTaxes : null,
        totalLandedCost: calc.totalLandedCost,
        totalLandedCostLocal: calc.totalLandedCostLocal,
        landedCostPerUnit: calc.landedCostPerUnit,
        localCurrency: form.localCurrency,
        localCurrencySymbol: form.localCurrencySymbol,
        exchangeRate: form.exchangeRate,
        markupPercent: form.markupPercent,
        sellingPrice: form.roundUp ? calc.suggestedRetail : calc.sellingPrice,
        linkedProductId: form.linkedProductId || null,
      };

      const url = editingId
        ? `/api/product-costing/${editingId}`
        : "/api/product-costing";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      toast({
        title: editingId ? "Costing updated" : "Costing saved",
        description: form.linkedProductId
          ? "Product cost price and selling price have been updated"
          : "Product costing has been saved",
      });

      // Refresh history
      const histRes = await fetch("/api/product-costing?limit=50");
      if (histRes.ok) {
        const data = await histRes.json();
        setHistory(data.data || []);
      }

      // Reset form
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setForm((prev) => ({
      ...DEFAULT_FORM,
      localCurrency: prev.localCurrency,
      localCurrencySymbol: prev.localCurrencySymbol,
    }));
    setEditingId(null);
  };

  // Load template
  const loadTemplate = (template: CostingTemplate) => {
    setForm((prev) => ({
      ...prev,
      dutyRate: Number(template.dutyRate),
      vatRate: Number(template.vatRate),
      hslRate: Number(template.hslRate),
      exciseTax: Number(template.exciseTax),
      customsFee: Number(template.customsFee),
      exchangeRate: Number(template.exchangeRate),
      markupPercent: Number(template.defaultMarkup),
      shippingCost: Number(template.shippingEstimate),
      purchaseCurrency: template.purchaseCurrency,
      customTaxes: template.customTaxes || [],
    }));
    toast({ title: "Template loaded", description: `"${template.name}" applied` });
  };

  // Save as template
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast({ title: "Error", description: "Template name is required", variant: "destructive" });
      return;
    }

    try {
      const res = await fetch("/api/product-costing/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName,
          dutyRate: form.dutyRate,
          vatRate: form.vatRate,
          hslRate: form.hslRate,
          exciseTax: form.exciseTax,
          customsFee: form.customsFee,
          exchangeRate: form.exchangeRate,
          defaultMarkup: form.markupPercent,
          shippingEstimate: form.shippingCost,
          purchaseCurrency: form.purchaseCurrency,
          customTaxes: form.customTaxes.length > 0 ? form.customTaxes : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save template");
      }

      const tpl = await res.json();
      setTemplates((prev) => [...prev, tpl]);
      setTemplateDialogOpen(false);
      setTemplateName("");
      toast({ title: "Template saved", description: `"${tpl.name}" saved successfully` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Delete template
  const deleteTemplate = async (id: string) => {
    try {
      await fetch(`/api/product-costing/templates/${id}`, { method: "DELETE" });
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      toast({ title: "Template deleted" });
    } catch {
      toast({ title: "Error", description: "Failed to delete template", variant: "destructive" });
    }
  };

  // Duplicate from history
  const duplicateCosting = (record: CostingRecord) => {
    // Fetch the full record first
    fetch(`/api/product-costing/${record.id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm((prev) => ({
          ...prev,
          productName: data.productName + " (copy)",
          supplier: data.supplier || "",
          quantity: data.quantity,
          unitPrice: Number(data.unitPrice),
          purchaseCurrency: data.purchaseCurrency,
          exchangeRate: Number(data.exchangeRate),
          shippingCost: Number(data.shippingCost),
          freightCost: Number(data.freightCost),
          dutyRate: Number(data.dutyRate),
          exciseTax: Number(data.exciseTax),
          vatRate: Number(data.vatRate),
          hslRate: Number(data.hslRate),
          customsFee: Number(data.customsFee),
          insurance: Number(data.insurance),
          handlingFee: Number(data.handlingFee),
          otherCosts: Number(data.otherCosts),
          otherDescription: data.otherDescription || "",
          customTaxes: data.customTaxes || [],
          markupPercent: Number(data.markupPercent),
          linkedProductId: "",
        }));
        setEditingId(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
        toast({ title: "Costing duplicated", description: "Edit and save as a new costing" });
      });
  };

  // Delete costing
  const deleteCosting = async (id: string) => {
    try {
      await fetch(`/api/product-costing/${id}`, { method: "DELETE" });
      setHistory((prev) => prev.filter((h) => h.id !== id));
      toast({ title: "Costing deleted" });
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  // Export to PDF
  const exportToPDF = async () => {
    try {
      const jspdf = await import("jspdf");
      const { default: jsPDF } = jspdf;
      await import("jspdf-autotable");

      const doc = new jsPDF();
      const localSym = form.localCurrencySymbol;

      // Title
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Product Costing Sheet", 14, 22);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

      // Product Info
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Product Information", 14, 42);

      (doc as any).autoTable({
        startY: 46,
        head: [["Field", "Value"]],
        body: [
          ["Product Name", form.productName || "-"],
          ["Supplier", form.supplier || "-"],
          ["Quantity", String(form.quantity)],
          ["Unit Price", `${calc.pSymbol} ${form.unitPrice.toFixed(2)}`],
          ["Currency", `${form.purchaseCurrency} \u2192 ${form.localCurrency}`],
          ["Exchange Rate", String(form.exchangeRate)],
        ],
        theme: "grid",
        headStyles: { fillColor: [13, 148, 136] },
        margin: { left: 14 },
      });

      // Cost Breakdown
      const afterFirst = (doc as any).lastAutoTable.finalY + 10;
      doc.setFont("helvetica", "bold");
      doc.text("Cost Breakdown (per unit)", 14, afterFirst);

      const breakdownRows = [
        ["Purchase price", `${localSym} ${calc.purchasePricePerUnitLocal.toFixed(2)}`],
        ["Shipping", `${localSym} ${calc.shippingPerUnit.toFixed(2)}`],
        ["Customs duty", `${localSym} ${calc.dutyPerUnit.toFixed(2)}`],
        ["VAT / Sales Tax", `${localSym} ${calc.vatPerUnit.toFixed(2)}`],
      ];
      if (form.hslRate > 0) {
        breakdownRows.push(["Health & Security Levy", `${localSym} ${calc.hslPerUnit.toFixed(2)}`]);
      }
      if (form.exciseTax > 0) {
        breakdownRows.push(["Excise tax", `${localSym} ${calc.excisePerUnit.toFixed(2)}`]);
      }
      breakdownRows.push(
        ["Customs fee", `${localSym} ${calc.customsFeePerUnit.toFixed(2)}`],
        ["Transport", `${localSym} ${calc.freightPerUnit.toFixed(2)}`],
        ["Insurance", `${localSym} ${calc.insurancePerUnit.toFixed(2)}`],
        ["Other costs", `${localSym} ${calc.otherPerUnit.toFixed(2)}`],
      );

      (doc as any).autoTable({
        startY: afterFirst + 4,
        head: [["Item", "Amount"]],
        body: breakdownRows,
        foot: [
          ["TOTAL LANDED COST PER UNIT", `${localSym} ${calc.landedCostPerUnit.toFixed(2)}`],
          [`Markup (${calc.markupPercent}%)`, `${localSym} ${calc.markupAmount.toFixed(2)}`],
          ["SELLING PRICE", `${localSym} ${calc.suggestedRetail.toFixed(2)}`],
          ["Profit per unit", `${localSym} ${calc.profitPerUnit.toFixed(2)}`],
          ["Profit margin", `${calc.profitMargin.toFixed(1)}%`],
        ],
        theme: "grid",
        headStyles: { fillColor: [13, 148, 136] },
        footStyles: { fillColor: [240, 253, 250], textColor: [0, 0, 0], fontStyle: "bold" },
        margin: { left: 14 },
      });

      // Total Order
      const afterSecond = (doc as any).lastAutoTable.finalY + 10;
      (doc as any).autoTable({
        startY: afterSecond,
        body: [
          ["Total Order Cost", `${localSym} ${calc.totalOrderCost.toFixed(2)}`],
          ["Total Order Value at Retail", `${localSym} ${calc.totalOrderValue.toFixed(2)}`],
        ],
        theme: "grid",
        bodyStyles: { fontStyle: "bold", fontSize: 11 },
        margin: { left: 14 },
      });

      doc.save(`costing-${form.productName || "product"}-${Date.now()}.pdf`);
      toast({ title: "PDF exported" });
    } catch {
      toast({ title: "Error", description: "Failed to export PDF", variant: "destructive" });
    }
  };

  // Filtered history
  const filteredHistory = useMemo(() => {
    if (!historySearch) return history;
    const q = historySearch.toLowerCase();
    return history.filter(
      (h) =>
        h.productName.toLowerCase().includes(q) ||
        (h.supplier && h.supplier.toLowerCase().includes(q))
    );
  }, [history, historySearch]);

  // ============================================
  // RENDER HELPERS
  // ============================================

  const NumInput = ({
    label,
    value,
    onChange,
    suffix,
    prefix,
    placeholder,
    helpText,
    className,
  }: {
    label: string;
    value: number;
    onChange: (v: string) => void;
    suffix?: string;
    prefix?: string;
    placeholder?: string;
    helpText?: string;
    className?: string;
  }) => (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-sm font-medium flex items-center gap-1.5">
        {label}
        {helpText && <HelpTooltip text={helpText} />}
      </Label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {prefix}
          </span>
        )}
        <Input
          type="number"
          step="any"
          min="0"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "0"}
          className={cn(prefix && "pl-10", suffix && "pr-8")}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-50">
              <Calculator className="w-7 h-7 text-teal-600" />
            </div>
            Product Costing Calculator
          </h1>
          <p className="text-muted-foreground mt-1">
            Calculate landed costs and selling prices for imported products
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {templates.length > 0 && (
            <div className="relative group">
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-1.5" />
                Load Template
                <ChevronDown className="w-3.5 h-3.5 ml-1" />
              </Button>
              <div className="absolute right-0 top-full mt-1 bg-white border rounded-xl shadow-lg z-20 min-w-[220px] py-1 hidden group-focus-within:block group-hover:block">
                {templates.map((t) => (
                  <div key={t.id} className="flex items-center px-3 py-2 hover:bg-gray-50">
                    <button
                      className="flex-1 text-left text-sm"
                      onClick={() => loadTemplate(t)}
                    >
                      {t.name}
                    </button>
                    <button
                      onClick={() => deleteTemplate(t.id)}
                      className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTemplateDialogOpen(true)}
          >
            <Save className="w-4 h-4 mr-1.5" />
            Save as Template
          </Button>
          <Button variant="outline" size="sm" onClick={exportToPDF}>
            <FileDown className="w-4 h-4 mr-1.5" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,420px]">
        {/* LEFT: Form */}
        <div className="space-y-6">
          {/* Section 1: Product Info */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-4 h-4 text-teal-600" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Product Name *</Label>
                  <Input
                    value={form.productName}
                    onChange={(e) => updateField("productName", e.target.value)}
                    placeholder="e.g. Brazilian Body Wave 18&quot;"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Supplier / Source</Label>
                  <Input
                    value={form.supplier}
                    onChange={(e) => updateField("supplier", e.target.value)}
                    placeholder="e.g. Amazon US, Sally Beauty"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <NumInput
                  label="Quantity ordered"
                  value={form.quantity}
                  onChange={(v) => updateNumberField("quantity", v)}
                  placeholder="1"
                />
                <NumInput
                  label="Unit purchase price *"
                  value={form.unitPrice}
                  onChange={(v) => updateNumberField("unitPrice", v)}
                  prefix={PURCHASE_CURRENCIES.find((c) => c.code === form.purchaseCurrency)?.symbol || "$"}
                />
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Purchase currency</Label>
                  <select
                    value={form.purchaseCurrency}
                    onChange={(e) => updateField("purchaseCurrency", e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {PURCHASE_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.symbol}) - {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Currency Conversion */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-teal-600" />
                Currency Conversion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Your business currency</Label>
                  <div className="h-10 flex items-center px-3 rounded-md border bg-gray-50 text-sm font-medium">
                    {form.localCurrencySymbol} ({form.localCurrency})
                  </div>
                </div>
                <NumInput
                  label="Exchange rate"
                  value={form.exchangeRate}
                  onChange={(v) => updateNumberField("exchangeRate", v)}
                  helpText="Enter the exchange rate you actually paid, including any bank fees"
                  placeholder="2.70"
                />
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-muted-foreground">Preview</Label>
                  <div className="h-10 flex items-center px-3 rounded-md border bg-teal-50/50 text-sm">
                    1 {form.purchaseCurrency} = {form.exchangeRate} {form.localCurrency}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Shipping & Freight */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Ship className="w-4 h-4 text-teal-600" />
                Shipping & Freight
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <NumInput
                  label="International shipping cost"
                  value={form.shippingCost}
                  onChange={(v) => updateNumberField("shippingCost", v)}
                  prefix={PURCHASE_CURRENCIES.find((c) => c.code === form.purchaseCurrency)?.symbol || "$"}
                  helpText="Total shipping in purchase currency"
                />
                <NumInput
                  label="Local freight/transport cost"
                  value={form.freightCost}
                  onChange={(v) => updateNumberField("freightCost", v)}
                  prefix={form.localCurrencySymbol}
                  helpText="Port/customs to your store, in local currency"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Duties & Taxes */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="w-4 h-4 text-teal-600" />
                Duties & Taxes
                <HelpTooltip text="Enter the tax rates for your country. These vary across the Caribbean. VAT and HSL paid on imports are part of your landed cost if your business is below the VAT registration threshold." />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <NumInput
                  label="Customs duty rate"
                  value={form.dutyRate}
                  onChange={(v) => updateNumberField("dutyRate", v)}
                  suffix="%"
                  helpText="Your country's import duty rate for this product"
                />
                <NumInput
                  label="Excise tax"
                  value={form.exciseTax}
                  onChange={(v) => updateNumberField("exciseTax", v)}
                  suffix="%"
                  helpText="Enter if applicable for this product"
                />
                <NumInput
                  label="VAT / Sales Tax"
                  value={form.vatRate}
                  onChange={(v) => updateNumberField("vatRate", v)}
                  suffix="%"
                  helpText="e.g. 12.5% Saint Lucia, 15% Barbados, 16.5% Jamaica GCT"
                />
                <NumInput
                  label="Health & Security Levy"
                  value={form.hslRate}
                  onChange={(v) => updateNumberField("hslRate", v)}
                  suffix="%"
                  helpText="Optional - some countries have this, some don't"
                />
                <NumInput
                  label="Customs processing fee"
                  value={form.customsFee}
                  onChange={(v) => updateNumberField("customsFee", v)}
                  prefix={form.localCurrencySymbol}
                  helpText="Fixed fee in local currency"
                />
              </div>

              {/* Custom Taxes */}
              {form.customTaxes.map((ct, idx) => (
                <div key={idx} className="flex items-end gap-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-xs">Tax/Fee name</Label>
                    <Input
                      value={ct.name}
                      onChange={(e) => updateCustomTax(idx, "name", e.target.value)}
                      placeholder="e.g. Environmental Levy"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="w-24 space-y-1.5">
                    <Label className="text-xs">Rate</Label>
                    <Input
                      type="number"
                      step="any"
                      value={ct.rate || ""}
                      onChange={(e) => updateCustomTax(idx, "rate", parseFloat(e.target.value) || 0)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="w-24 space-y-1.5">
                    <Label className="text-xs">Type</Label>
                    <select
                      value={ct.isPercentage ? "pct" : "fixed"}
                      onChange={(e) => updateCustomTax(idx, "isPercentage", e.target.value === "pct")}
                      className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
                    >
                      <option value="pct">%</option>
                      <option value="fixed">Fixed</option>
                    </select>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCustomTax(idx)}
                    className="text-red-500 hover:text-red-700 h-9 px-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={addCustomTax}
                className="w-full border-dashed"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add another tax/fee
              </Button>
            </CardContent>
          </Card>

          {/* Section 5: Other Costs */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-teal-600" />
                Other Costs
                <span className="text-xs font-normal text-muted-foreground">(in {form.localCurrency})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <NumInput
                  label="Insurance"
                  value={form.insurance}
                  onChange={(v) => updateNumberField("insurance", v)}
                  prefix={form.localCurrencySymbol}
                />
                <NumInput
                  label="Handling fees"
                  value={form.handlingFee}
                  onChange={(v) => updateNumberField("handlingFee", v)}
                  prefix={form.localCurrencySymbol}
                />
                <NumInput
                  label="Other costs"
                  value={form.otherCosts}
                  onChange={(v) => updateNumberField("otherCosts", v)}
                  prefix={form.localCurrencySymbol}
                />
              </div>
              {(form.otherCosts > 0 || form.otherDescription) && (
                <div className="mt-3">
                  <Label className="text-sm font-medium">Description of other costs</Label>
                  <Input
                    value={form.otherDescription}
                    onChange={(e) => updateField("otherDescription", e.target.value)}
                    placeholder="e.g. Broker fee, storage, etc."
                    className="mt-1.5"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 6: Markup & Pricing */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Percent className="w-4 h-4 text-teal-600" />
                Markup & Pricing
                <HelpTooltip text="Your markup should cover all import costs including taxes paid, since small businesses below the VAT threshold typically cannot charge VAT separately to customers." />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <NumInput
                  label="Markup percentage"
                  value={form.markupPercent}
                  onChange={(v) => updateNumberField("markupPercent", v)}
                  suffix="%"
                />
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">OR target selling price</Label>
                  <Input
                    type="number"
                    step="any"
                    value={form.targetSellingPrice || ""}
                    onChange={(e) => handleTargetPriceChange(e.target.value)}
                    placeholder="Reverse calculate markup"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Round to .99</Label>
                  <button
                    onClick={() => updateField("roundUp", !form.roundUp)}
                    className={cn(
                      "w-full h-10 rounded-md border text-sm font-medium transition-colors",
                      form.roundUp
                        ? "bg-teal-50 border-teal-300 text-teal-700"
                        : "bg-gray-50 border-gray-200 text-gray-500"
                    )}
                  >
                    {form.roundUp ? "Enabled" : "Disabled"}
                  </button>
                </div>
              </div>

              {/* Link to product */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <LinkIcon className="w-4 h-4 text-gray-400 shrink-0" />
                {form.linkedProductId ? (
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-sm">
                      Linked to: <strong>{products.find((p) => p.id === form.linkedProductId)?.name || "Product"}</strong>
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {products.find((p) => p.id === form.linkedProductId)?.sku}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateField("linkedProductId", "")}
                      className="ml-auto h-7 text-xs"
                    >
                      Unlink
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-sm text-muted-foreground">
                      Link to a product in Shop to update its cost price
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLinkProductDialogOpen(true)}
                      className="ml-auto h-7 text-xs"
                    >
                      <LinkIcon className="w-3 h-3 mr-1" />
                      Link Product
                    </Button>
                  </div>
                )}
              </div>

              {/* Save buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-teal-600 hover:bg-teal-700 flex-1 sm:flex-none"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {editingId ? "Update Costing" : form.linkedProductId ? "Save & Update Product" : "Save Costing"}
                </Button>
                {editingId && (
                  <Button variant="outline" onClick={resetForm}>
                    Cancel Edit
                  </Button>
                )}
                <Button variant="outline" onClick={resetForm}>
                  Clear Form
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Live Calculation Panel */}
        <div className="lg:sticky lg:top-24 lg:self-start space-y-6">
          <Card className="border-teal-200 shadow-md">
            <CardHeader className="pb-3 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-t-xl">
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="w-4 h-4 text-teal-600" />
                Live Cost Breakdown
                <span className="text-xs font-normal text-muted-foreground">(per unit)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {/* Header row */}
                <div className="grid grid-cols-[1fr,auto,auto] gap-2 px-4 py-2 text-xs font-semibold text-muted-foreground bg-gray-50">
                  <span>Item</span>
                  <span className="text-right w-24">{form.purchaseCurrency}</span>
                  <span className="text-right w-28">{form.localCurrency}</span>
                </div>

                {/* Purchase price */}
                <CalcRow
                  label="Purchase price"
                  purchaseAmt={calc.purchasePricePerUnit}
                  localAmt={calc.purchasePricePerUnitLocal}
                  pSymbol={calc.pSymbol}
                  lSymbol={calc.localSymbol}
                />

                {/* Shipping */}
                <CalcRow
                  label="Shipping"
                  purchaseAmt={calc.shippingPerUnitPurchase}
                  localAmt={calc.shippingPerUnit}
                  pSymbol={calc.pSymbol}
                  lSymbol={calc.localSymbol}
                />

                {/* Duty */}
                <CalcRow
                  label="Customs duty"
                  localAmt={calc.dutyPerUnit}
                  lSymbol={calc.localSymbol}
                />

                {/* VAT */}
                <CalcRow
                  label="VAT / Sales Tax"
                  localAmt={calc.vatPerUnit}
                  lSymbol={calc.localSymbol}
                />

                {/* HSL */}
                {form.hslRate > 0 && (
                  <CalcRow
                    label="HSL"
                    localAmt={calc.hslPerUnit}
                    lSymbol={calc.localSymbol}
                  />
                )}

                {/* Excise */}
                {form.exciseTax > 0 && (
                  <CalcRow
                    label="Excise tax"
                    localAmt={calc.excisePerUnit}
                    lSymbol={calc.localSymbol}
                  />
                )}

                {/* Custom taxes */}
                {calc.customTaxDetails.map((ct, i) => (
                  <CalcRow
                    key={i}
                    label={ct.name || `Custom tax ${i + 1}`}
                    localAmt={ct.perUnit}
                    lSymbol={calc.localSymbol}
                  />
                ))}

                {/* Customs fee */}
                <CalcRow
                  label="Customs fee"
                  localAmt={calc.customsFeePerUnit}
                  lSymbol={calc.localSymbol}
                />

                {/* Transport */}
                <CalcRow
                  label="Transport"
                  localAmt={calc.freightPerUnit}
                  lSymbol={calc.localSymbol}
                />

                {/* Insurance */}
                {form.insurance > 0 && (
                  <CalcRow
                    label="Insurance"
                    localAmt={calc.insurancePerUnit}
                    lSymbol={calc.localSymbol}
                  />
                )}

                {/* Handling */}
                {form.handlingFee > 0 && (
                  <CalcRow
                    label="Handling fee"
                    localAmt={calc.handlingPerUnit}
                    lSymbol={calc.localSymbol}
                  />
                )}

                {/* Other */}
                {form.otherCosts > 0 && (
                  <CalcRow
                    label="Other costs"
                    localAmt={calc.otherPerUnit}
                    lSymbol={calc.localSymbol}
                  />
                )}

                {/* Divider + Total */}
                <div className="px-4 py-3 bg-teal-50 font-bold">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">TOTAL LANDED COST</span>
                    <span className="text-base text-teal-700">
                      {calc.localSymbol} {calc.landedCostPerUnit.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Markup */}
                <div className="px-4 py-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Markup ({calc.markupPercent}%)</span>
                    <span>{calc.localSymbol} {calc.markupAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Selling Price */}
                <div className="px-4 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold rounded-b-none">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">SELLING PRICE</span>
                    <span className="text-lg">{calc.localSymbol} {calc.sellingPrice.toFixed(2)}</span>
                  </div>
                  {form.roundUp && calc.suggestedRetail !== calc.sellingPrice && (
                    <div className="flex justify-between items-center mt-1 text-white/80 text-xs">
                      <span>Suggested retail (.99)</span>
                      <span>{calc.localSymbol} {calc.suggestedRetail.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary stats */}
              <div className="px-4 py-3 space-y-2 border-t bg-gray-50/50">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Profit per unit</span>
                  <span className="font-semibold text-emerald-600">
                    {calc.localSymbol} {calc.profitPerUnit.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Profit margin</span>
                  <span className="font-semibold">{calc.profitMargin.toFixed(1)}%</span>
                </div>
                {calc.taxRecoveryPerUnit > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      Tax recovery per unit
                      <HelpTooltip text="VAT + HSL built into your selling price" />
                    </span>
                    <span className="text-amber-600 font-medium">
                      {calc.localSymbol} {calc.taxRecoveryPerUnit.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t space-y-1.5">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Total order cost</span>
                    <span>{calc.localSymbol} {calc.totalOrderCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold text-teal-700">
                    <span>Total order value</span>
                    <span>{calc.localSymbol} {calc.totalOrderValue.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-right">
                    for {calc.qty} unit{calc.qty !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* History Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="w-4 h-4 text-teal-600" />
              Costing History
              <Badge variant="secondary" className="text-xs">{history.length}</Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="pl-9 h-8 w-48 text-sm"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
              >
                {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        {showHistory && (
          <CardContent className="p-0">
            {filteredHistory.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Calculator className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No costings yet. Save your first calculation above.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-t bg-gray-50/80">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Supplier</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Qty</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Landed Cost/Unit</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Selling Price</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Markup</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Linked</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredHistory.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium">{record.productName}</td>
                        <td className="px-4 py-3 text-muted-foreground">{record.supplier || "-"}</td>
                        <td className="px-4 py-3 text-right">{record.quantity}</td>
                        <td className="px-4 py-3 text-right font-mono">
                          {record.localCurrencySymbol} {Number(record.landedCostPerUnit).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-teal-700">
                          {record.localCurrencySymbol} {Number(record.sellingPrice).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">{Number(record.markupPercent).toFixed(0)}%</td>
                        <td className="px-4 py-3">
                          {record.linkedProduct ? (
                            <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                              {record.linkedProduct.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {new Date(record.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => duplicateCosting(record)}
                              className="h-7 w-7 p-0"
                              title="Duplicate"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteCosting(record.id)}
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Save Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Template name</Label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder='e.g. "Amazon Import", "Miami Supplier"'
              />
            </div>
            <p className="text-sm text-muted-foreground">
              This will save your current tax rates, exchange rate, shipping estimate, and markup as a reusable template.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate} className="bg-teal-600 hover:bg-teal-700">
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Product Dialog */}
      <Dialog open={linkProductDialogOpen} onOpenChange={setLinkProductDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link to Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4 max-h-[400px] overflow-y-auto">
            {products.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No products found. Add products in the Shop first.
              </p>
            ) : (
              products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    updateField("linkedProductId", p.id);
                    setLinkProductDialogOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg border text-left hover:bg-gray-50 transition-colors",
                    form.linkedProductId === p.id && "border-teal-500 bg-teal-50"
                  )}
                >
                  <Package className="w-5 h-5 text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.sku}</p>
                  </div>
                  {form.linkedProductId === p.id && (
                    <Badge className="bg-teal-100 text-teal-700 text-xs">Selected</Badge>
                  )}
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// Calculation Row Component
// ============================================

function CalcRow({
  label,
  purchaseAmt,
  localAmt,
  pSymbol,
  lSymbol,
}: {
  label: string;
  purchaseAmt?: number;
  localAmt: number;
  pSymbol?: string;
  lSymbol: string;
}) {
  return (
    <div className="grid grid-cols-[1fr,auto,auto] gap-2 px-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right w-24 font-mono text-xs text-muted-foreground">
        {purchaseAmt !== undefined && pSymbol
          ? `${pSymbol} ${purchaseAmt.toFixed(2)}`
          : "-"}
      </span>
      <span className="text-right w-28 font-mono text-xs">
        {lSymbol} {localAmt.toFixed(2)}
      </span>
    </div>
  );
}
