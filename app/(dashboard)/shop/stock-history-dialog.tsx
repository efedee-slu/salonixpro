// app/(dashboard)/shop/stock-history-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  ArrowDown,
  ArrowUp,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface StockMovement {
  id: string;
  type: string;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  reason: string | null;
  orderId: string | null;
  createdAt: string;
}

interface StockHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
}

const typeConfig: Record<string, { label: string; color: string; variant: any }> = {
  SALE: { label: "Sale", color: "text-red-600", variant: "destructive" },
  RESTOCK: { label: "Restock", color: "text-green-600", variant: "success" },
  ADJUSTMENT: { label: "Adjustment", color: "text-blue-600", variant: "info" },
  DAMAGE: { label: "Damage", color: "text-amber-600", variant: "warning" },
  RETURN: { label: "Return", color: "text-purple-600", variant: "purple" },
};

export function StockHistoryDialog({
  open,
  onOpenChange,
  product,
}: StockHistoryDialogProps) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (open && product?.id) {
      fetchMovements();
    }
  }, [open, product?.id, page]);

  const fetchMovements = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/products/${product.id}/stock-movements?page=${page}&limit=10`
      );
      if (res.ok) {
        const json = await res.json();
        setMovements(json.data);
        setTotalPages(json.pagination.totalPages);
        setTotal(json.pagination.total);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Stock History</DialogTitle>
          <DialogDescription>
            {product.name} (SKU: {product.sku})
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : movements.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No stock movements recorded yet.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {movements.map((m) => {
                const config = typeConfig[m.type] || { label: m.type, color: "text-gray-600", variant: "secondary" };
                const isPositive = m.quantity > 0;

                return (
                  <div
                    key={m.id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/30 transition-colors"
                  >
                    <div className={`mt-0.5 p-1.5 rounded-full ${isPositive ? "bg-green-100" : "bg-red-100"}`}>
                      {isPositive ? (
                        <ArrowUp className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant={config.variant as any} className="text-xs">
                          {config.label}
                        </Badge>
                        <span className={`font-semibold ${isPositive ? "text-green-600" : "text-red-600"}`}>
                          {isPositive ? "+" : ""}{m.quantity}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {m.quantityBefore} &rarr; {m.quantityAfter} units
                      </p>
                      {m.reason && (
                        <p className="text-sm mt-1">{m.reason}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(m.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  {total} total movement{total !== 1 ? "s" : ""}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm self-center">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
