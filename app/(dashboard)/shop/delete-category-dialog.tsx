// app/(dashboard)/shop/delete-category-dialog.tsx
"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  _count: {
    products: number;
  };
}

interface DeleteCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category;
  onSuccess: () => void;
}

export function DeleteCategoryDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: DeleteCategoryDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/products/categories/${category.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete category");
      }

      toast({
        title: "Category deleted",
        description: `"${category.name}" has been removed.`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
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
          <DialogTitle>Delete Category</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this category?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-amber-900">
                {category.icon} {category.name}
              </p>
              {category._count.products > 0 ? (
                <p className="text-sm text-amber-700 mt-1">
                  This category has {category._count.products} product{category._count.products !== 1 ? "s" : ""}.
                  They will be moved to &quot;Uncategorized&quot;.
                </p>
              ) : (
                <p className="text-sm text-amber-700 mt-1">
                  This category has no products.
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Category"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
