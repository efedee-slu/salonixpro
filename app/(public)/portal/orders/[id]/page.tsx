"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Package,
  Printer,
  Store,
  Phone,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OrderDetail {
  id: string;
  orderNumber: string;
  date: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  subtotal: number;
  discount: number;
  total: number;
  business: {
    name: string;
    currencySymbol: string;
    address: string | null;
    phone: string | null;
  };
  items: {
    name: string;
    sku: string | null;
    quantity: number;
    unitPrice: number;
    salePrice: number | null;
    total: number;
  }[];
}

const statusColors: Record<string, string> = {
  PAID: "bg-green-100 text-green-800",
  UNPAID: "bg-amber-100 text-amber-800",
  REFUNDED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  READY: "bg-purple-100 text-purple-800",
  CANCELLED: "bg-red-100 text-red-800",
};

function fmtCurrency(amount: number, symbol: string) {
  return `${symbol} ${amount.toFixed(2)}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function PortalOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/portal/orders/${params.id}`);
        if (res.status === 401) {
          router.push("/portal");
          return;
        }
        if (!res.ok) {
          router.push("/portal/dashboard");
          return;
        }
        const json = await res.json();
        setOrder(json);
      } catch {
        router.push("/portal/dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!order) return null;

  const cs = order.business.currencySymbol;

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-teal-700 to-teal-600 text-white">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/portal/dashboard"
              className="flex items-center gap-2 text-teal-200 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.print()}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <Printer className="w-4 h-4 mr-1" />
              Print
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Receipt Card */}
          <Card>
            <CardContent className="p-6">
              {/* Business info */}
              <div className="text-center mb-6 pb-6 border-b border-dashed">
                <Package className="w-10 h-10 text-teal-600 mx-auto mb-2" />
                <h1 className="text-xl font-bold text-gray-900">{order.business.name}</h1>
                {order.business.address && (
                  <p className="text-sm text-gray-500 flex items-center justify-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {order.business.address}
                  </p>
                )}
                {order.business.phone && (
                  <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {order.business.phone}
                  </p>
                )}
              </div>

              {/* Order header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-sm text-gray-500">Order Number</p>
                  <p className="font-bold text-lg text-gray-900">#{order.orderNumber}</p>
                  <p className="text-sm text-gray-500 mt-1">{fmtDate(order.date)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge className={statusColors[order.status] || "bg-gray-100"}>
                    {order.status}
                  </Badge>
                  <Badge className={statusColors[order.paymentStatus] || "bg-gray-100"}>
                    {order.paymentStatus}
                  </Badge>
                </div>
              </div>

              {/* Items */}
              <div className="mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-gray-500">
                      <th className="text-left py-2 font-medium">Item</th>
                      <th className="text-center py-2 font-medium">Qty</th>
                      <th className="text-right py-2 font-medium">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-3">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {item.sku && <p className="text-xs text-gray-400">{item.sku}</p>}
                        </td>
                        <td className="py-3 text-center text-gray-600">x{item.quantity}</td>
                        <td className="py-3 text-right">
                          {item.salePrice && item.salePrice < item.unitPrice ? (
                            <div>
                              <p className="text-gray-900 font-medium">{fmtCurrency(item.total, cs)}</p>
                              <p className="text-xs text-gray-400 line-through">
                                {fmtCurrency(item.unitPrice * item.quantity, cs)}
                              </p>
                            </div>
                          ) : (
                            <p className="text-gray-900 font-medium">{fmtCurrency(item.total, cs)}</p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="space-y-2 pt-2 border-t border-dashed">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{fmtCurrency(order.subtotal, cs)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{fmtCurrency(order.discount, cs)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                  <span>Total</span>
                  <span>{fmtCurrency(order.total, cs)}</span>
                </div>
                {order.paymentMethod && (
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Payment Method</span>
                    <span>{order.paymentMethod}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
