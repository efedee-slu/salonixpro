// app/(dashboard)/shop/edit-category-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
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
  description?: string | null;
  _count: {
    products: number;
  };
}

interface EditCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category;
  onSuccess: () => void;
}

const iconOptions = [
  "💇", "💆", "✨", "🧴", "💅", "👁️", "💄", "🪮", "💎", "🌸", "🎀", "👗",
];

export function EditCategoryDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: EditCategoryDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    icon: "💇",
    description: "",
  });

  useEffect(() => {
    if (category && open) {
      setFormData({
        name: category.name,
        icon: category.icon || "💇",
        description: (category as any).description || "",
      });
    }
  }, [category, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/products/categories/${category.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update category");
      }

      toast({
        title: "Category updated",
        description: "The product category has been updated.",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update category",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>
            Update the category details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-cat-name">Category Name *</Label>
            <Input
              id="edit-cat-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Hair Extensions"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="grid grid-cols-6 gap-2">
              {iconOptions.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`p-3 text-xl rounded-lg border transition-colors ${
                    formData.icon === icon
                      ? "border-teal-600 bg-teal-50"
                      : "hover:bg-accent"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-cat-description">Description (Optional)</Label>
            <textarea
              id="edit-cat-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Category description..."
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
