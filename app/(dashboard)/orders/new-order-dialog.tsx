// app/(dashboard)/orders/new-order-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Minus, Trash2, Search, User, Package } from "lucide-react";
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
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: string;
  sku: string;
  name: string;
  retailPrice: number;
  salePrice: number | null;
  isOnSale: boolean;
  stockOnHand: number;
  stockReserved: number;
  category: {
    name: string;
    icon: string | null;
  } | null;
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface NewOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function NewOrderDialog({
  open,
  onOpenChange,
  onSuccess,
}: NewOrderDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [customerType, setCustomerType] = useState<"existing" | "walkin">("existing");
  const [guestInfo, setGuestInfo] = useState({
    name: "",
    phone: "",
  });
  const [discount, setDiscount] = useState("");
  const [staffNotes, setStaffNotes] = useState("");

  // Fetch data
  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    try {
      const [productsRes, clientsRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/clients"),
      ]);

      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.filter((p: Product) => p.stockOnHand - p.stockReserved > 0));
      }
      if (clientsRes.ok) {
        const data = await clientsRes.json();
        setClients(data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const getAvailableStock = (product: Product) => {
    return product.stockOnHand - product.stockReserved;
  };

  const getPrice = (product: Product) => {
    return product.isOnSale && product.salePrice
      ? Number(product.salePrice)
      : Number(product.retailPrice);
  };

  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.product.id === product.id);
    const available = getAvailableStock(product);

    if (existing) {
      if (existing.quantity < available) {
        setCart(
          cart.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
      }
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.product.id === productId) {
            const available = getAvailableStock(item.product);
            const newQty = Math.max(0, Math.min(available, item.quantity + delta));
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  // Calculate totals
  const subtotal = cart.reduce(
    (sum, item) => sum + getPrice(item.product) * item.quantity,
    0
  );
  const discountAmount = parseFloat(discount) || 0;
  const total = Math.max(0, subtotal - discountAmount);

  // Filter products
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Filter clients
  const filteredClients = clients.filter(
    (c) =>
      c.firstName.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.lastName.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.phone.includes(clientSearch)
  );

  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one product to the order",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClient?.id || null,
          customerName: customerType === "walkin" ? guestInfo.name : null,
          customerPhone: customerType === "walkin" ? guestInfo.phone : null,
          items: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
          discount: discountAmount,
          staffNotes: staffNotes || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create order");
      }

      toast({
        title: "Order created",
        description: "The order has been created successfully.",
      });

      // Reset form
      setCart([]);
      setSelectedClient(null);
      setGuestInfo({ name: "", phone: "" });
      setDiscount("");
      setStaffNotes("");
      setProductSearch("");
      setClientSearch("");

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create order",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>New Order</DialogTitle>
          <DialogDescription>Create a new product order</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Products Section */}
          <div className="flex flex-col overflow-hidden border rounded-lg">
            <div className="p-3 border-b bg-muted/30">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[300px]">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No products found</p>
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => addToCart(product)}
                  >
                    <div className="w-10 h-10 rounded bg-teal-50 flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.sku} • {getAvailableStock(product)} in stock
                      </p>
                    </div>
                    <div className="text-right">
                      {product.isOnSale && product.salePrice ? (
                        <>
                          <p className="font-semibold text-red-600 text-sm">
                            {formatCurrency(Number(product.salePrice))}
                          </p>
                          <p className="text-xs line-through text-muted-foreground">
                            {formatCurrency(Number(product.retailPrice))}
                          </p>
                        </>
                      ) : (
                        <p className="font-semibold text-teal-600 text-sm">
                          {formatCurrency(Number(product.retailPrice))}
                        </p>
                      )}
                    </div>
                    <Button size="sm" variant="ghost">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cart Section */}
          <div className="flex flex-col overflow-hidden border rounded-lg">
            <div className="p-3 border-b bg-muted/30">
              <h3 className="font-semibold">Cart ({cart.length} items)</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[200px]">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No items in cart</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-2 p-2 bg-accent/50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(getPrice(item.product))} each
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.product.id, -1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.product.id, 1)}
                        disabled={item.quantity >= getAvailableStock(item.product)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="font-semibold text-sm w-20 text-right">
                      {formatCurrency(getPrice(item.product) * item.quantity)}
                    </p>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeFromCart(item.product.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Customer Selection */}
            <div className="p-3 border-t space-y-3">
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={customerType === "existing" ? "default" : "outline"}
                  onClick={() => setCustomerType("existing")}
                  className={customerType === "existing" ? "bg-teal-600" : ""}
                >
                  Existing Client
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={customerType === "walkin" ? "default" : "outline"}
                  onClick={() => {
                    setCustomerType("walkin");
                    setSelectedClient(null);
                  }}
                  className={customerType === "walkin" ? "bg-teal-600" : ""}
                >
                  Walk-in
                </Button>
              </div>

              {customerType === "existing" ? (
                <div className="space-y-2">
                  {selectedClient ? (
                    <div className="flex items-center gap-2 p-2 bg-teal-50 rounded-lg">
                      <User className="w-4 h-4 text-teal-600" />
                      <span className="text-sm font-medium">
                        {selectedClient.firstName} {selectedClient.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {selectedClient.phone}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-auto h-6"
                        onClick={() => setSelectedClient(null)}
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Input
                        placeholder="Search clients..."
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                      />
                      {clientSearch && (
                        <div className="max-h-24 overflow-y-auto border rounded-lg">
                          {filteredClients.slice(0, 5).map((client) => (
                            <div
                              key={client.id}
                              className="p-2 hover:bg-accent cursor-pointer text-sm"
                              onClick={() => {
                                setSelectedClient(client);
                                setClientSearch("");
                              }}
                            >
                              {client.firstName} {client.lastName} - {client.phone}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Name (optional)"
                    value={guestInfo.name}
                    onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                  />
                  <Input
                    placeholder="Phone (optional)"
                    value={guestInfo.phone}
                    onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                  />
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="p-3 border-t bg-muted/30 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm">Discount</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0.00"
                  className="h-8 w-24"
                />
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span className="text-teal-600">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Staff Notes */}
        <div className="space-y-2">
          <Label>Staff Notes (Optional)</Label>
          <Input
            value={staffNotes}
            onChange={(e) => setStaffNotes(e.target.value)}
            placeholder="Internal notes about this order..."
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
          <Button
            onClick={handleSubmit}
            disabled={isLoading || cart.length === 0}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              `Create Order (${formatCurrency(total)})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
