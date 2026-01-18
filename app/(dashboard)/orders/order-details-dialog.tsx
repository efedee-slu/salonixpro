// app/(dashboard)/orders/order-details-dialog.tsx
"use client";

import { useState } from "react";
import {
  Loader2,
  User,
  Phone,
  Clock,
  CheckCircle,
  Package,
  XCircle,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  Receipt,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface OrderDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  onSuccess: () => void;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  CONFIRMED: { label: "Confirmed", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  READY: { label: "Ready", color: "bg-purple-100 text-purple-800", icon: Package },
  COMPLETED: { label: "Completed", color: "bg-green-100 text-green-800", icon: CheckCircle },
  CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-800", icon: XCircle },
};

const statusFlow = ["PENDING", "CONFIRMED", "READY", "COMPLETED"];

export function OrderDetailsDialog({
  open,
  onOpenChange,
  order,
  onSuccess,
}: OrderDetailsDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

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

  const updateStatus = async (newStatus: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      toast({
        title: "Status updated",
        description: `Order status changed to ${statusConfig[newStatus]?.label}`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processPayment = async (method: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/orders/${order.id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod: method }),
      });

      if (!response.ok) {
        throw new Error("Failed to process payment");
      }

      toast({
        title: "Payment recorded",
        description: `Payment of ${formatCurrency(Number(order.total))} received via ${method.toLowerCase()}`,
      });

      setShowPayment(false);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process payment",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (!response.ok) {
        throw new Error("Failed to cancel order");
      }

      toast({
        title: "Order cancelled",
        description: "The order has been cancelled",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel order",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getNextStatus = () => {
    const currentIndex = statusFlow.indexOf(order.status);
    if (currentIndex >= 0 && currentIndex < statusFlow.length - 1) {
      return statusFlow[currentIndex + 1];
    }
    return null;
  };

  const nextStatus = getNextStatus();

  const printReceipt = () => {
    const receiptWindow = window.open("", "_blank", "width=400,height=600");
    if (!receiptWindow) return;

    const customerName = order.client
      ? `${order.client.firstName} ${order.client.lastName}`
      : order.customerName || "Walk-in Customer";

    const itemsHtml = order.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px dashed #ddd;">
            ${item.productName}<br>
            <small style="color: #666;">SKU: ${item.productSku} × ${item.quantity}</small>
          </td>
          <td style="padding: 8px 0; border-bottom: 1px dashed #ddd; text-align: right;">
            EC$ ${Number(item.lineTotal).toFixed(2)}
          </td>
        </tr>
      `
      )
      .join("");

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt #${order.orderNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Courier New', monospace; 
            padding: 20px; 
            max-width: 300px; 
            margin: 0 auto;
            font-size: 12px;
          }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { font-size: 18px; margin-bottom: 5px; }
          .header p { color: #666; font-size: 11px; }
          .divider { 
            border-top: 1px dashed #333; 
            margin: 15px 0; 
          }
          .info { margin-bottom: 15px; }
          .info p { margin: 3px 0; }
          .items { width: 100%; border-collapse: collapse; }
          .totals { margin-top: 15px; }
          .totals .row { 
            display: flex; 
            justify-content: space-between; 
            padding: 3px 0;
          }
          .totals .total { 
            font-weight: bold; 
            font-size: 16px;
            border-top: 2px solid #333;
            padding-top: 10px;
            margin-top: 5px;
          }
          .footer { 
            text-align: center; 
            margin-top: 30px; 
            padding-top: 15px;
            border-top: 1px dashed #333;
          }
          .footer p { margin: 5px 0; color: #666; }
          .payment-badge {
            display: inline-block;
            background: ${order.paymentStatus === "PAID" ? "#d1fae5" : "#fee2e2"};
            color: ${order.paymentStatus === "PAID" ? "#065f46" : "#991b1b"};
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 11px;
            margin-top: 5px;
          }
          @media print {
            body { padding: 0; }
            @page { margin: 10mm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Demo Salon</h1>
          <p>Castries, Saint Lucia</p>
          <p>Tel: (758) 123-4567</p>
        </div>
        
        <div class="divider"></div>
        
        <div class="info">
          <p><strong>Receipt #:</strong> ${order.orderNumber}</p>
          <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}</p>
          <p><strong>Customer:</strong> ${customerName}</p>
          <span class="payment-badge">${order.paymentStatus}</span>
          ${order.paymentMethod ? `<span class="payment-badge" style="margin-left: 5px;">${order.paymentMethod}</span>` : ""}
        </div>
        
        <div class="divider"></div>
        
        <table class="items">
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div class="totals">
          <div class="row">
            <span>Subtotal:</span>
            <span>EC$ ${Number(order.subtotal).toFixed(2)}</span>
          </div>
          ${
            Number(order.discount) > 0
              ? `<div class="row" style="color: #dc2626;">
                  <span>Discount:</span>
                  <span>-EC$ ${Number(order.discount).toFixed(2)}</span>
                </div>`
              : ""
          }
          <div class="row total">
            <span>TOTAL:</span>
            <span>EC$ ${Number(order.total).toFixed(2)}</span>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>Thank you for your business!</strong></p>
          <p>We appreciate your patronage</p>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    receiptWindow.document.write(receiptHtml);
    receiptWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Order #{order.orderNumber}
            </DialogTitle>
            <div className="flex gap-2">
              <Badge className={statusConfig[order.status]?.color}>
                {statusConfig[order.status]?.label}
              </Badge>
              <Badge
                className={
                  order.paymentStatus === "PAID"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }
              >
                {order.paymentStatus}
              </Badge>
            </div>
          </div>
          <DialogDescription>
            Created {formatDate(order.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pr-2">
          {/* Customer Info */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">
                {order.client
                  ? `${order.client.firstName} ${order.client.lastName}`
                  : order.customerName || "Walk-in Customer"}
              </span>
            </div>
            {(order.client?.phone || order.customerPhone) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4" />
                {order.client?.phone || order.customerPhone}
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="border rounded-lg">
            <div className="p-3 border-b bg-muted/30">
              <h4 className="font-semibold">Items ({order.items.length})</h4>
            </div>
            <div className="divide-y">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3">
                  <div className="w-10 h-10 rounded bg-teal-50 flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      SKU: {item.productSku} • Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right shrink-0 min-w-[90px]">
                    <p className="font-semibold">
                      {formatCurrency(Number(item.lineTotal))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(Number(item.salePrice || item.unitPrice))} each
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Totals */}
          <div className="border rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatCurrency(Number(order.subtotal))}</span>
          </div>
          {Number(order.discount) > 0 && (
            <div className="flex justify-between text-sm text-red-600">
              <span>Discount</span>
              <span>-{formatCurrency(Number(order.discount))}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total</span>
            <span className="text-teal-600">{formatCurrency(Number(order.total))}</span>
          </div>
          {order.paymentMethod && order.paymentStatus === "PAID" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
              {order.paymentMethod === "CASH" && <Banknote className="w-4 h-4" />}
              {order.paymentMethod === "CARD" && <CreditCard className="w-4 h-4" />}
              {order.paymentMethod === "TRANSFER" && <ArrowRightLeft className="w-4 h-4" />}
              Paid via {order.paymentMethod.toLowerCase()}
            </div>
          )}
        </div>

        {/* Staff Notes */}
        {order.staffNotes && (
          <div className="p-3 bg-yellow-50 rounded-lg">
            <Label className="text-xs text-yellow-800">Staff Notes</Label>
            <p className="text-sm mt-1">{order.staffNotes}</p>
          </div>
        )}

        {/* Payment Section */}
        {showPayment && order.paymentStatus !== "PAID" && (
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-semibold">Select Payment Method</h4>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                onClick={() => processPayment("CASH")}
                disabled={isLoading}
                className="h-20 flex-col"
              >
                <Banknote className="w-6 h-6 mb-1" />
                Cash
              </Button>
              <Button
                variant="outline"
                onClick={() => processPayment("CARD")}
                disabled={isLoading}
                className="h-20 flex-col"
              >
                <CreditCard className="w-6 h-6 mb-1" />
                Card
              </Button>
              <Button
                variant="outline"
                onClick={() => processPayment("TRANSFER")}
                disabled={isLoading}
                className="h-20 flex-col"
              >
                <ArrowRightLeft className="w-6 h-6 mb-1" />
                Transfer
              </Button>
            </div>
            <Button
              variant="ghost"
              onClick={() => setShowPayment(false)}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {/* Print Receipt Button - Always visible */}
          <Button
            variant="outline"
            onClick={printReceipt}
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Receipt
          </Button>

          {order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
            <>
              {/* Cancel Button */}
              <Button
                variant="outline"
                onClick={cancelOrder}
                disabled={isLoading}
                className="text-destructive hover:text-destructive"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel Order
              </Button>

              {/* Payment Button */}
              {order.paymentStatus !== "PAID" && !showPayment && (
                <Button
                  variant="outline"
                  onClick={() => setShowPayment(true)}
                  disabled={isLoading}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Record Payment
                </Button>
              )}

              {/* Next Status Button */}
              {nextStatus && (
                <Button
                  onClick={() => updateStatus(nextStatus)}
                  disabled={isLoading}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <>
                      {nextStatus === "CONFIRMED" && <CheckCircle className="w-4 h-4 mr-2" />}
                      {nextStatus === "READY" && <Package className="w-4 h-4 mr-2" />}
                      {nextStatus === "COMPLETED" && <CheckCircle className="w-4 h-4 mr-2" />}
                    </>
                  )}
                  Mark as {statusConfig[nextStatus]?.label}
                </Button>
              )}
            </>
          )}

          {(order.status === "COMPLETED" || order.status === "CANCELLED") && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
