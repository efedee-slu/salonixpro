// app/(dashboard)/shop/edit-product-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import { Loader2, Upload, Package } from "lucide-react";
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

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  images: string[];
  texture: string | null;
  lengthInches: number | null;
  color: string | null;
  costPrice: number;
  retailPrice: number;
  salePrice: number | null;
  isOnSale: boolean;
  promoText: string | null;
  stockOnHand: number;
  reorderLevel: number;
  isFeatured: boolean;
  isAvailableOnline: boolean;
  isActive: boolean;
  category: {
    id: string;
  } | null;
}

interface EditProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  categories: Category[];
  onSuccess: () => void;
}

export function EditProductDialog({
  open,
  onOpenChange,
  product,
  categories,
  onSuccess,
}: EditProductDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    description: "",
    categoryId: "",
    texture: "",
    lengthInches: "",
    color: "",
    costPrice: "",
    retailPrice: "",
    salePrice: "",
    isOnSale: false,
    promoText: "",
    stockOnHand: "0",
    reorderLevel: "5",
    isFeatured: false,
    isAvailableOnline: true,
    isActive: true,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        sku: product.sku,
        name: product.name,
        description: product.description || "",
        categoryId: product.category?.id || "",
        texture: product.texture || "",
        lengthInches: product.lengthInches?.toString() || "",
        color: product.color || "",
        costPrice: product.costPrice?.toString() || "",
        retailPrice: product.retailPrice?.toString() || "",
        salePrice: product.salePrice?.toString() || "",
        isOnSale: product.isOnSale,
        promoText: product.promoText || "",
        stockOnHand: product.stockOnHand.toString(),
        reorderLevel: product.reorderLevel.toString(),
        isFeatured: product.isFeatured,
        isAvailableOnline: product.isAvailableOnline,
        isActive: product.isActive,
      });
      setImageUrl(product.images && product.images.length > 0 ? product.images[0] : null);
    }
  }, [product]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("type", "product");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      if (response.ok) {
        const data = await response.json();
        setImageUrl(data.url);
        toast({ title: "Image uploaded" });
      } else {
        const err = await response.json();
        throw new Error(err.error || "Upload failed");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          image: imageUrl,
          categoryId: formData.categoryId || null,
          lengthInches: formData.lengthInches ? parseInt(formData.lengthInches) : null,
          costPrice: parseFloat(formData.costPrice) || 0,
          retailPrice: parseFloat(formData.retailPrice),
          salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
          stockOnHand: parseInt(formData.stockOnHand) || 0,
          reorderLevel: parseInt(formData.reorderLevel) || 5,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update product");
      }

      toast({
        title: "Product updated",
        description: "The product has been updated successfully.",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update product details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Image */}
          <div className="flex items-center gap-4 pb-4 border-b">
            <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed">
              {imageUrl ? (
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Package className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div>
              <label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <Button type="button" variant="outline" size="sm" asChild disabled={isUploading}>
                  <span className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploading ? "Uploading..." : imageUrl ? "Change Image" : "Upload Image"}
                  </span>
                </Button>
              </label>
              <p className="text-xs text-muted-foreground mt-1">Optional - Max 5MB</p>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-sku">SKU *</Label>
              <Input
                id="edit-sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                placeholder="HAIR-001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-categoryId">Category</Label>
              <select
                id="edit-categoryId"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
              >
                <option value="">No Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-name">Product Name *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Brazilian Body Wave"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Product description..."
              className="w-full min-h-[60px] px-3 py-2 text-sm rounded-lg border border-input bg-background"
            />
          </div>

          {/* Hair Attributes */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Hair Attributes (Optional)</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-texture">Texture</Label>
                <select
                  id="edit-texture"
                  value={formData.texture}
                  onChange={(e) => setFormData({ ...formData, texture: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
                >
                  <option value="">Select...</option>
                  <option value="Straight">Straight</option>
                  <option value="Body Wave">Body Wave</option>
                  <option value="Loose Wave">Loose Wave</option>
                  <option value="Deep Wave">Deep Wave</option>
                  <option value="Curly">Curly</option>
                  <option value="Kinky Curly">Kinky Curly</option>
                  <option value="Kinky Straight">Kinky Straight</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lengthInches">Length (inches)</Label>
                <Input
                  id="edit-lengthInches"
                  type="number"
                  min="8"
                  max="40"
                  value={formData.lengthInches}
                  onChange={(e) => setFormData({ ...formData, lengthInches: e.target.value })}
                  placeholder="18"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-color">Color</Label>
                <Input
                  id="edit-color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="Natural Black"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Pricing</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-costPrice">Cost Price (EC$)</Label>
                <Input
                  id="edit-costPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  placeholder="50.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-retailPrice">Retail Price (EC$) *</Label>
                <Input
                  id="edit-retailPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.retailPrice}
                  onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
                  placeholder="150.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-salePrice">Sale Price (EC$)</Label>
                <Input
                  id="edit-salePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.salePrice}
                  onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                  placeholder="120.00"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isOnSale}
                  onChange={(e) => setFormData({ ...formData, isOnSale: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm">On Sale</span>
              </label>
              {formData.isOnSale && (
                <Input
                  value={formData.promoText}
                  onChange={(e) => setFormData({ ...formData, promoText: e.target.value })}
                  placeholder="Promo text (e.g., '20% OFF!')"
                  className="flex-1"
                />
              )}
            </div>
          </div>

          {/* Inventory */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Inventory</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-stockOnHand">Stock On Hand</Label>
                <Input
                  id="edit-stockOnHand"
                  type="number"
                  min="0"
                  value={formData.stockOnHand}
                  onChange={(e) => setFormData({ ...formData, stockOnHand: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-reorderLevel">Reorder Level</Label>
                <Input
                  id="edit-reorderLevel"
                  type="number"
                  min="0"
                  value={formData.reorderLevel}
                  onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Options</h4>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm">Featured Product</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isAvailableOnline}
                  onChange={(e) => setFormData({ ...formData, isAvailableOnline: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm">Available Online</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm">Active</span>
              </label>
            </div>
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
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
