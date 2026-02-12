// app/(dashboard)/shop/adjust-stock-dialog.tsx
"use client";

import { useState } from "react";
import { Loader2, Plus, Minus, RotateCcw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

interface Product {
  id: string;
  name: string;
  sku: string;
  stockOnHand: number;
  stockReserved: number;
}

interface AdjustStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  onSuccess: () => void;
}

const adjustmentTypes = [
  { value: "RESTOCK", label: "Restock", description: "Add new inventory", icon: Plus, color: "border-green-300 bg-green-50 text-green-700" },
  { value: "DAMAGE", label: "Damage", description: "Remove damaged items", icon: AlertTriangle, color: "border-amber-300 bg-amber-50 text-amber-700" },
  { value: "ADJUSTMENT", label: "Adjust", description: "Correct stock count", icon: RotateCcw, color: "border-blue-300 bg-blue-50 text-blue-700" },
  { value: "RETURN", label: "Return", description: "Customer return", icon: Minus, color: "border-purple-300 bg-purple-50 text-purple-700" },
];

export function AdjustStockDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
}: AdjustStockDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [type, setType] = useState("RESTOCK");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const qty = parseInt(quantity);
    if (!qty || qty <= 0) {
      toast({ title: "Error", description: "Enter a valid quantity", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/products/${product.id}/adjust-stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, quantity: qty, reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to adjust stock");
      }

      toast({
        title: "Stock adjusted",
        description: `${product.name} stock has been updated.`,
      });

      setType("RESTOCK");
      setQuantity("");
      setReason("");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to adjust stock",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const previewChange = () => {
    const qty = parseInt(quantity) || 0;
    if (type === "DAMAGE") return product.stockOnHand - qty;
    return product.stockOnHand + qty;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
          <DialogDescription>
            {product.name} (SKU: {product.sku})
          </DialogDescription>
        </DialogHeader>

        <div className="p-3 rounded-lg bg-muted/50 flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Current Stock</span>
          <span className="font-semibold">{product.stockOnHand} units</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Adjustment Type *</Label>
            <div className="grid grid-cols-2 gap-2">
              {adjustmentTypes.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-colors ${
                      type === t.value
                        ? t.color + " border-2 font-medium"
                        : "hover:bg-accent"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <div className="text-left">
                      <p className="font-medium">{t.label}</p>
                      <p className="text-xs opacity-70">{t.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adj-quantity">Quantity *</Label>
            <Input
              id="adj-quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              required
            />
          </div>

          {quantity && parseInt(quantity) > 0 && (
            <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 flex justify-between items-center">
              <span className="text-sm text-teal-700">New Stock Level</span>
              <span className="font-semibold text-teal-900">{previewChange()} units</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="adj-reason">Reason (Optional)</Label>
            <textarea
              id="adj-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Received shipment from supplier"
              className="w-full min-h-[60px] px-3 py-2 text-sm rounded-lg border border-input bg-background"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-teal-600 hover:bg-teal-700">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adjusting...
                </>
              ) : (
                "Apply Adjustment"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
