// app/(dashboard)/orders/order-details-dialog.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Loader2,
  User,
  Phone,
  CheckCircle,
  XCircle,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  Printer,
  Smartphone,
  ShoppingBag,
  X,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";

interface OrderItem {
  id: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  salePrice: number | null;
  lineTotal: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  subtotal: number;
  discount: number;
  total: number;
  customerName: string | null;
  customerPhone: string | null;
  staffNotes: string | null;
  createdAt: string;
  completedAt: string | null;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  } | null;
  items: OrderItem[];
}

interface BusinessInfo {
  name: string;
  address: string | null;
  city: string | null;
  country: string;
  phone: string | null;
  email: string | null;
  logo: string | null;
  currencySymbol: string;
}

interface OrderDetailsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  onSuccess: () => void;
}

const statusStyles: Record<string, string> = {
  PENDING: "background:#fef9c3;color:#854d0e;",
  CONFIRMED: "background:#dbeafe;color:#1e40af;",
  READY: "background:#f3e8ff;color:#6b21a8;",
  COMPLETED: "background:#dcfce7;color:#166534;",
  CANCELLED: "background:#fee2e2;color:#991b1b;",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  READY: "Ready",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

type PanelView = "details" | "checkout" | "success";

export function OrderDetailsDialog({
  open,
  onOpenChange,
  order,
  onSuccess,
}: OrderDetailsPanelProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<PanelView>("details");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [completedPaymentMethod, setCompletedPaymentMethod] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setVisible(false);
    setTimeout(() => onOpenChange(false), 300);
  }, [onOpenChange]);

  // Mount/unmount and animate
  useEffect(() => {
    if (open) {
      setMounted(true);
      setView("details");
      setSelectedPaymentMethod(null);
      setCompletedPaymentMethod(null);
      // Trigger animation after mount
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Lock body scroll
  useEffect(() => {
    if (mounted) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mounted]);

  // Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) close();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, close]);

  // Fetch business info
  useEffect(() => {
    if (open && !businessInfo) {
      fetch("/api/settings")
        .then((res) => res.json())
        .then((data) => {
          if (data.business) {
            setBusinessInfo({
              name: data.business.name,
              address: data.business.address,
              city: data.business.city,
              country: data.business.country,
              phone: data.business.phone,
              email: data.business.email,
              logo: data.business.logo,
              currencySymbol: data.business.currencySymbol || "EC$",
            });
          }
        })
        .catch(() => {});
    }
  }, [open, businessInfo]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const customerName = order.client
    ? `${order.client.firstName} ${order.client.lastName}`
    : order.customerName || "Walk-in Customer";

  const sym = businessInfo?.currencySymbol || "EC$";

  const updateStatus = async (newStatus: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error("Failed");
      onSuccess();
    } catch {
      toast({ title: "Error", description: "Failed to update order status", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const completeCheckout = async () => {
    if (!selectedPaymentMethod) return;
    setIsLoading(true);
    try {
      const payRes = await fetch(`/api/orders/${order.id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod: selectedPaymentMethod }),
      });
      if (!payRes.ok) throw new Error("Failed");
      const statusRes = await fetch(`/api/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      if (!statusRes.ok) throw new Error("Failed");
      setCompletedPaymentMethod(selectedPaymentMethod);
      setView("success");
      onSuccess();
    } catch {
      toast({ title: "Error", description: "Failed to complete checkout", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const cancelOrder = async () => {
    if (!confirm("Cancel this order?")) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (!response.ok) throw new Error("Failed");
      toast({ title: "Order cancelled" });
      onSuccess();
      close();
    } catch {
      toast({ title: "Error", description: "Failed to cancel order", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const printReceipt = (paymentMethod?: string | null) => {
    const receiptWindow = window.open("", "_blank", "width=450,height=700");
    if (!receiptWindow) return;
    const biz = businessInfo;
    const bizName = biz?.name || "Salon";
    const bizAddress = [biz?.address, biz?.city, biz?.country].filter(Boolean).join(", ");
    const bizPhone = biz?.phone || "";
    const bizEmail = biz?.email || "";
    const s = biz?.currencySymbol || "EC$";
    const paidVia = paymentMethod || order.paymentMethod || "";
    const itemsHtml = order.items.map((item) => `
      <tr>
        <td style="padding:6px 0;border-bottom:1px dashed #ccc;"><strong>${item.productName}</strong><br><span style="color:#888;font-size:11px;">SKU: ${item.productSku}</span></td>
        <td style="padding:6px 0;border-bottom:1px dashed #ccc;text-align:center;">${item.quantity}</td>
        <td style="padding:6px 0;border-bottom:1px dashed #ccc;text-align:right;white-space:nowrap;">${s} ${Number(item.unitPrice).toFixed(2)}</td>
        <td style="padding:6px 0;border-bottom:1px dashed #ccc;text-align:right;white-space:nowrap;font-weight:600;">${s} ${Number(item.lineTotal).toFixed(2)}</td>
      </tr>`).join("");
    const logoHtml = biz?.logo ? `<img src="${biz.logo}" alt="${bizName}" style="max-width:80px;max-height:80px;margin:0 auto 10px;display:block;" />` : "";
    const receiptHtml = `<!DOCTYPE html><html><head><title>Receipt #${order.orderNumber}</title>
<style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Segoe UI',Arial,sans-serif;padding:30px;max-width:380px;margin:0 auto;font-size:13px;color:#333;}.header{text-align:center;margin-bottom:20px;}.header h1{font-size:22px;margin-bottom:4px;}.header .contact{color:#666;font-size:11px;line-height:1.6;}.divider{border:none;border-top:1px dashed #999;margin:16px 0;}.info-row{display:flex;justify-content:space-between;padding:2px 0;font-size:12px;}.info-row .label{color:#888;}.items{width:100%;border-collapse:collapse;margin:8px 0;}.items th{text-align:left;font-size:11px;color:#888;text-transform:uppercase;padding-bottom:6px;border-bottom:1px solid #333;}.items th:nth-child(2){text-align:center;}.items th:nth-child(3),.items th:nth-child(4){text-align:right;}.totals .row{display:flex;justify-content:space-between;padding:3px 0;font-size:13px;}.totals .total-row{font-weight:bold;font-size:18px;border-top:2px solid #333;padding-top:10px;margin-top:6px;}.payment-info{text-align:center;margin-top:12px;padding:8px;background:#f0fdf4;border-radius:6px;font-size:12px;color:#166534;}.footer{text-align:center;margin-top:28px;padding-top:16px;border-top:1px dashed #999;}.footer .thanks{font-size:15px;font-weight:600;margin-bottom:4px;}.footer .sub{color:#888;font-size:11px;}@media print{body{padding:10px;}@page{margin:8mm;}}</style></head>
<body><div class="header">${logoHtml}<h1>${bizName}</h1><div class="contact">${bizAddress ? `<div>${bizAddress}</div>` : ""}${bizPhone ? `<div>Tel: ${bizPhone}</div>` : ""}${bizEmail ? `<div>${bizEmail}</div>` : ""}</div></div>
<hr class="divider"/><div class="info"><div class="info-row"><span class="label">Receipt #</span><span><strong>${order.orderNumber}</strong></span></div><div class="info-row"><span class="label">Date</span><span>${new Date(order.createdAt).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}</span></div><div class="info-row"><span class="label">Customer</span><span>${customerName}</span></div></div>
<hr class="divider"/><table class="items"><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>${itemsHtml}</tbody></table>
<div class="totals"><div class="row"><span>Subtotal</span><span>${s} ${Number(order.subtotal).toFixed(2)}</span></div>${Number(order.discount) > 0 ? `<div class="row" style="color:#dc2626;"><span>Discount</span><span>-${s} ${Number(order.discount).toFixed(2)}</span></div>` : ""}<div class="row total-row"><span>TOTAL</span><span>${s} ${Number(order.total).toFixed(2)}</span></div></div>
${paidVia ? `<div class="payment-info">Paid via ${paidVia.charAt(0) + paidVia.slice(1).toLowerCase()}</div>` : ""}
<div class="footer"><div class="thanks">Thank you!</div><div class="sub">We appreciate your patronage</div></div>
<script>window.onload=function(){window.print();}</script></body></html>`;
    receiptWindow.document.write(receiptHtml);
    receiptWindow.document.close();
  };

  if (!mounted) return null;

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 9998,
    opacity: visible ? 1 : 0,
    transition: "opacity 0.3s ease",
  };

  const panelStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    width: "600px",
    maxWidth: "100vw",
    backgroundColor: "white",
    boxShadow: "-4px 0 25px rgba(0,0,0,0.15)",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    transform: visible ? "translateX(0)" : "translateX(100%)",
    transition: "transform 0.3s ease",
    overflowX: "hidden",
    overflowY: "hidden",
  };

  const closeBtnStyle: React.CSSProperties = {
    position: "absolute",
    top: "16px",
    right: "16px",
    zIndex: 10,
    background: "#f3f4f6",
    border: "none",
    borderRadius: "8px",
    padding: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const headerStyle: React.CSSProperties = {
    padding: "24px",
    borderBottom: "1px solid #e5e7eb",
    flexShrink: 0,
  };

  const bodyStyle: React.CSSProperties = {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
    padding: "24px",
  };

  const footerStyle: React.CSSProperties = {
    padding: "16px 24px",
    borderTop: "1px solid #e5e7eb",
    flexShrink: 0,
    backgroundColor: "white",
  };

  const badgeStyle = (status: string) => ({
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: "9999px",
    fontSize: "12px",
    fontWeight: 600 as const,
    ...(status === "PENDING" && { backgroundColor: "#fef9c3", color: "#854d0e" }),
    ...(status === "CONFIRMED" && { backgroundColor: "#dbeafe", color: "#1e40af" }),
    ...(status === "READY" && { backgroundColor: "#f3e8ff", color: "#6b21a8" }),
    ...(status === "COMPLETED" && { backgroundColor: "#dcfce7", color: "#166534" }),
    ...(status === "CANCELLED" && { backgroundColor: "#fee2e2", color: "#991b1b" }),
  });

  const btnPrimary: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    height: "48px",
    backgroundColor: "#0d9488",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: 600,
    cursor: "pointer",
  };

  const btnOutline: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    flex: 1,
    height: "40px",
    backgroundColor: "white",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
  };

  const btnDanger: React.CSSProperties = {
    ...btnOutline,
    color: "#dc2626",
    borderColor: "#fca5a5",
  };

  // ── SUCCESS VIEW ──
  const renderSuccess = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={headerStyle}>
        <h2 style={{ fontSize: "18px", fontWeight: 700 }}>Order Complete</h2>
      </div>
      <div style={{ ...bodyStyle, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: "24px" }}>
        <div style={{ width: "80px", height: "80px", backgroundColor: "#dcfce7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CheckCircle style={{ width: "40px", height: "40px", color: "#16a34a" }} />
        </div>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>Order Completed!</h2>
          <p style={{ color: "#6b7280" }}>Order #{order.orderNumber} has been completed.</p>
        </div>
        <div style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px", textAlign: "left" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px" }}>
            <span style={{ color: "#6b7280" }}>Customer</span>
            <span style={{ fontWeight: 500 }}>{customerName}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px" }}>
            <span style={{ color: "#6b7280" }}>Items</span>
            <span style={{ fontWeight: 500 }}>{order.items.length}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px" }}>
            <span style={{ color: "#6b7280" }}>Payment</span>
            <span style={{ fontWeight: 500, textTransform: "capitalize" }}>{(completedPaymentMethod || "").toLowerCase()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "20px", borderTop: "1px solid #e5e7eb", paddingTop: "12px", marginTop: "8px" }}>
            <span>Total Paid</span>
            <span style={{ color: "#0d9488" }}>{formatCurrency(Number(order.total), sym)}</span>
          </div>
        </div>
      </div>
      <div style={footerStyle}>
        <div style={{ display: "flex", gap: "12px" }}>
          <button style={btnOutline} onClick={() => printReceipt(completedPaymentMethod)}>
            <Printer style={{ width: "16px", height: "16px" }} /> Print Receipt
          </button>
          <button style={{ ...btnPrimary, flex: 1, height: "40px", fontSize: "14px" }} onClick={close}>
            Done
          </button>
        </div>
      </div>
    </div>
  );

  // ── CHECKOUT VIEW ──
  const renderCheckout = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={headerStyle}>
        <h2 style={{ fontSize: "18px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
          <ShoppingBag style={{ width: "20px", height: "20px" }} /> Checkout
        </h2>
        <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}>Order #{order.orderNumber}</p>
      </div>
      <div style={bodyStyle}>
        {/* Order Summary */}
        <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", marginBottom: "20px" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
            <h4 style={{ fontSize: "14px", fontWeight: 600 }}>Order Summary</h4>
          </div>
          {order.items.map((item) => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
              <div>
                <p style={{ fontWeight: 500, fontSize: "14px" }}>{item.productName}</p>
                <p style={{ fontSize: "12px", color: "#9ca3af" }}>Qty: {item.quantity}</p>
              </div>
              <span style={{ fontWeight: 600, fontSize: "14px", whiteSpace: "nowrap" }}>
                {formatCurrency(Number(item.lineTotal), sym)}
              </span>
            </div>
          ))}
          <div style={{ padding: "12px 16px", backgroundColor: "#f9fafb" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "4px" }}>
              <span>Subtotal</span>
              <span>{formatCurrency(Number(order.subtotal), sym)}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#dc2626", marginBottom: "4px" }}>
                <span>Discount</span>
                <span>-{formatCurrency(Number(order.discount), sym)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "20px", paddingTop: "8px" }}>
              <span>Total</span>
              <span style={{ color: "#0d9488" }}>{formatCurrency(Number(order.total), sym)}</span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <h4 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>Select Payment Method</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {[
            { id: "CASH", label: "Cash", Icon: Banknote },
            { id: "CARD", label: "Card", Icon: CreditCard },
            { id: "MOBILE", label: "Mobile Money", Icon: Smartphone },
            { id: "TRANSFER", label: "Bank Transfer", Icon: ArrowRightLeft },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedPaymentMethod(m.id)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "20px",
                borderRadius: "12px",
                border: selectedPaymentMethod === m.id ? "2px solid #0d9488" : "2px solid #e5e7eb",
                backgroundColor: selectedPaymentMethod === m.id ? "#f0fdfa" : "white",
                color: selectedPaymentMethod === m.id ? "#0d9488" : "#374151",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <m.Icon style={{ width: "28px", height: "28px" }} />
              <span style={{ fontSize: "14px", fontWeight: 500 }}>{m.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={footerStyle}>
        <button
          onClick={completeCheckout}
          disabled={isLoading || !selectedPaymentMethod}
          style={{
            ...btnPrimary,
            opacity: isLoading || !selectedPaymentMethod ? 0.5 : 1,
            marginBottom: "8px",
          }}
        >
          {isLoading && <Loader2 style={{ width: "20px", height: "20px", animation: "spin 1s linear infinite" }} />}
          {!isLoading && <CheckCircle style={{ width: "20px", height: "20px" }} />}
          Complete Order — {formatCurrency(Number(order.total), sym)}
        </button>
        <button onClick={() => setView("details")} disabled={isLoading} style={{ ...btnOutline, width: "100%" }}>
          Back to Details
        </button>
      </div>
    </div>
  );

  // ── DETAILS VIEW ──
  const renderDetails = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700 }}>Order #{order.orderNumber}</h2>
          <span style={badgeStyle(order.status)}>{statusLabels[order.status] || order.status}</span>
          <span style={badgeStyle(order.paymentStatus === "PAID" ? "COMPLETED" : "CANCELLED")}>
            {order.paymentStatus}
          </span>
        </div>
        <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}>{formatDate(order.createdAt)}</p>
      </div>

      {/* Scrollable Body */}
      <div style={bodyStyle}>
        {/* Customer Info */}
        <div style={{ padding: "16px", backgroundColor: "#f9fafb", borderRadius: "8px", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <User style={{ width: "16px", height: "16px", color: "#6b7280" }} />
            <span style={{ fontWeight: 500 }}>{customerName}</span>
          </div>
          {(order.client?.phone || order.customerPhone) && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#6b7280" }}>
              <Phone style={{ width: "16px", height: "16px" }} />
              {order.client?.phone || order.customerPhone}
            </div>
          )}
        </div>

        {/* Items */}
        <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", marginBottom: "20px", overflow: "hidden" }}>
          {/* Item rows */}
          {order.items.map((item, idx) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 16px",
                gap: "12px",
                borderBottom: idx < order.items.length - 1 ? "1px solid #f3f4f6" : "none",
              }}
            >
              <div style={{ minWidth: 0, flex: "0 1 auto" }}>
                <p style={{ fontWeight: 500, fontSize: "14px" }}>{item.productName}</p>
                <p style={{ fontSize: "12px", color: "#9ca3af" }}>SKU: {item.productSku} &middot; Qty: {item.quantity}</p>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "16px", flexShrink: 0 }}>
                {Number(item.quantity) > 1 && (
                  <span style={{ fontSize: "13px", color: "#9ca3af", whiteSpace: "nowrap" }}>
                    @ {formatCurrency(Number(item.salePrice || item.unitPrice), sym)}
                  </span>
                )}
                <span style={{ fontSize: "14px", fontWeight: 600, whiteSpace: "nowrap" }}>
                  {formatCurrency(Number(item.lineTotal), sym)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "6px" }}>
            <span style={{ color: "#6b7280" }}>Subtotal</span>
            <span>{formatCurrency(Number(order.subtotal), sym)}</span>
          </div>
          {Number(order.discount) > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#dc2626", marginBottom: "6px" }}>
              <span>Discount</span>
              <span>-{formatCurrency(Number(order.discount), sym)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "22px", borderTop: "1px solid #e5e7eb", paddingTop: "12px", marginTop: "4px" }}>
            <span>Total</span>
            <span style={{ color: "#0d9488" }}>{formatCurrency(Number(order.total), sym)}</span>
          </div>
          {order.paymentMethod && order.paymentStatus === "PAID" && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "#6b7280", marginTop: "8px" }}>
              {order.paymentMethod === "CASH" && <Banknote style={{ width: "16px", height: "16px" }} />}
              {order.paymentMethod === "CARD" && <CreditCard style={{ width: "16px", height: "16px" }} />}
              {order.paymentMethod === "MOBILE" && <Smartphone style={{ width: "16px", height: "16px" }} />}
              {order.paymentMethod === "TRANSFER" && <ArrowRightLeft style={{ width: "16px", height: "16px" }} />}
              Paid via {order.paymentMethod.toLowerCase()}
            </div>
          )}
        </div>

        {/* Staff Notes */}
        {order.staffNotes && (
          <div style={{ padding: "16px", backgroundColor: "#fefce8", borderRadius: "8px" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "#854d0e", marginBottom: "4px" }}>Staff Notes</p>
            <p style={{ fontSize: "14px" }}>{order.staffNotes}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={footerStyle}>
        {order.status === "COMPLETED" || order.status === "CANCELLED" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <button style={btnOutline} onClick={() => printReceipt()}>
              <Printer style={{ width: "16px", height: "16px" }} /> Print Receipt
            </button>
            <button style={btnOutline} onClick={close}>Close</button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {/* Row 1: Print Receipt | Record Payment */}
            <button style={btnOutline} onClick={() => printReceipt()}>
              <Printer style={{ width: "16px", height: "16px" }} /> Print Receipt
            </button>
            <button
              style={{ ...btnPrimary, height: "40px", fontSize: "14px", opacity: order.paymentStatus === "PAID" ? 0.5 : 1 }}
              onClick={() => setView("checkout")}
              disabled={order.paymentStatus === "PAID"}
            >
              <CreditCard style={{ width: "16px", height: "16px" }} /> Record Payment
            </button>
            {/* Row 2: Cancel Order | Mark as Complete */}
            <button style={btnDanger} onClick={cancelOrder} disabled={isLoading}>
              <XCircle style={{ width: "16px", height: "16px" }} /> Cancel Order
            </button>
            <button
              style={{ ...btnPrimary, height: "40px", fontSize: "14px", backgroundColor: "#16a34a", opacity: isLoading ? 0.5 : 1 }}
              onClick={() => updateStatus("COMPLETED")}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 style={{ width: "16px", height: "16px" }} /> : <CheckCircle style={{ width: "16px", height: "16px" }} />}
              Mark Complete
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ── RENDER VIA PORTAL ──
  const panelContent = (
    <>
      {/* Overlay */}
      <div style={overlayStyle} onClick={close} />
      {/* Panel */}
      <div ref={panelRef} style={panelStyle}>
        {/* Close button */}
        <button style={closeBtnStyle} onClick={close}>
          <X style={{ width: "20px", height: "20px" }} />
        </button>
        {view === "success" && renderSuccess()}
        {view === "checkout" && renderCheckout()}
        {view === "details" && renderDetails()}
      </div>
      {/* Spin animation for loader */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );

  if (typeof window === "undefined") return null;
  return createPortal(panelContent, document.body);
}
