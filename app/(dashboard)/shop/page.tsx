// app/(dashboard)/shop/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Package,
  Tag,
  DollarSign,
  AlertTriangle,
  Grid3X3,
  List,
  Edit,
  Trash2,
  Star,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  History,
  PackagePlus,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { AddProductDialog } from "./add-product-dialog";
import { EditProductDialog } from "./edit-product-dialog";
import { DeleteProductDialog } from "./delete-product-dialog";
import { AddCategoryDialog } from "./add-category-dialog";
import { EditCategoryDialog } from "./edit-category-dialog";
import { DeleteCategoryDialog } from "./delete-category-dialog";
import { AdjustStockDialog } from "./adjust-stock-dialog";
import { StockHistoryDialog } from "./stock-history-dialog";

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
  stockReserved: number;
  reorderLevel: number;
  isFeatured: boolean;
  isAvailableOnline: boolean;
  isActive: boolean;
  category: {
    id: string;
    name: string;
    icon: string | null;
  } | null;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
  _count: {
    products: number;
  };
}

export default function ShopPage() {
  const { data: session } = useSession();
  const isOwnerOrManager = session?.user?.role === "OWNER" || session?.user?.role === "MANAGER";
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editCategoryDialogOpen, setEditCategoryDialogOpen] = useState(false);
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [adjustStockDialogOpen, setAdjustStockDialogOpen] = useState(false);
  const [stockHistoryDialogOpen, setStockHistoryDialogOpen] = useState(false);
  const { toast } = useToast();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page on category change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (selectedCategory !== "all") params.set("categoryId", selectedCategory);

      const res = await fetch(`/api/products?${params}`);
      if (res.ok) {
        const json = await res.json();
        setProducts(json.data ?? json);
        if (json.pagination) setPagination(json.pagination);
      }
    } catch {
      toast({ title: "Error", description: "Failed to load products", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, selectedCategory]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/products/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch {}
  }, []);

  const fetchData = useCallback(() => {
    setIsLoading(true);
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setEditDialogOpen(true);
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleSuccess = () => {
    fetchData();
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setEditCategoryDialogOpen(true);
  };

  const handleDeleteCategory = (category: Category) => {
    setEditingCategory(category);
    setDeleteCategoryDialogOpen(true);
  };

  const handleAdjustStock = (product: Product) => {
    setSelectedProduct(product);
    setAdjustStockDialogOpen(true);
  };

  const handleStockHistory = (product: Product) => {
    setSelectedProduct(product);
    setStockHistoryDialogOpen(true);
  };

  // Stats (from current page data + pagination total)
  const lowStockItems = products.filter((p) => (p.stockOnHand - p.stockReserved) <= p.reorderLevel);
  const outOfStockItems = products.filter((p) => (p.stockOnHand - p.stockReserved) <= 0);
  const stats = {
    total: pagination.total,
    active: products.filter((p) => p.isActive).length,
    lowStock: lowStockItems.length,
    outOfStock: outOfStockItems.length,
    totalValue: products.reduce(
      (sum, p) => sum + Number(p.retailPrice) * p.stockOnHand,
      0
    ),
  };

  const getAvailableStock = (product: Product) => {
    return product.stockOnHand - product.stockReserved;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shop</h1>
          <p className="text-muted-foreground">
            Manage your product inventory
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCategoryDialogOpen(true)}>
            <Tag className="w-4 h-4 mr-2" />
            Add Category
          </Button>
          <Button onClick={() => setAddDialogOpen(true)} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-teal-500 hover:shadow-md hover:-translate-y-0.5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-teal-50">
                <Package className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Products</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500 hover:shadow-md hover:-translate-y-0.5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-50">
                <ShoppingBag className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Active Products</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500 hover:shadow-md hover:-translate-y-0.5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-50">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.lowStock}</p>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                {stats.outOfStock > 0 && (
                  <p className="text-xs text-red-500 font-medium mt-0.5">
                    {stats.outOfStock} out of stock
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 hover:shadow-md hover:-translate-y-0.5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-50">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</p>
                <p className="text-sm text-muted-foreground">Inventory Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
                className={selectedCategory === "all" ? "bg-teal-600 hover:bg-teal-700" : ""}
              >
                All ({products.length})
              </Button>
              {categories.map((cat) => (
                <div key={cat.id} className="relative group flex items-center">
                  <Button
                    variant={selectedCategory === cat.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={selectedCategory === cat.id ? "bg-teal-600 hover:bg-teal-700 pr-8" : "pr-8"}
                  >
                    {cat.icon} {cat.name} ({cat._count.products})
                  </Button>
                  <div className="absolute right-1 flex opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleEditCategory(cat); }}
                      className="p-0.5 rounded hover:bg-black/10"
                      title="Edit category"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat); }}
                      className="p-0.5 rounded hover:bg-red-100 text-destructive"
                      title="Delete category"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* View Toggle */}
            <div className="flex gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid/List */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "Try a different search term"
                : "Get started by adding your first product"}
            </p>
            <Button onClick={() => setAddDialogOpen(true)} className="bg-teal-600 hover:bg-teal-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Product Image */}
                <div className="h-40 bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center relative overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-16 h-16 text-teal-300" />
                  )}
                  {product.isFeatured && (
                    <Badge className="absolute top-2 left-2 bg-amber-500">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  {product.isOnSale && (
                    <Badge className="absolute top-2 right-2 bg-red-500">
                      Sale
                    </Badge>
                  )}
                  {getAvailableStock(product) <= 0 ? (
                    <Badge className="absolute bottom-2 left-2 bg-red-600">
                      Out of Stock
                    </Badge>
                  ) : getAvailableStock(product) <= product.reorderLevel ? (
                    <Badge className="absolute bottom-2 left-2 bg-amber-500">
                      Low Stock ({getAvailableStock(product)})
                    </Badge>
                  ) : null}
                </div>

                <CardContent className="p-4">
                  {/* Category & Costing Badge */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    {product.category && (
                      <Badge variant="secondary">
                        {product.category.icon} {product.category.name}
                      </Badge>
                    )}
                    {Number(product.costPrice) > 0 ? (
                      <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">
                        <CheckCircle2 className="w-3 h-3 mr-0.5" />
                        Costed
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-700 text-[10px]">
                        <AlertTriangle className="w-3 h-3 mr-0.5" />
                        Cost unknown
                      </Badge>
                    )}
                  </div>

                  {/* Name & SKU */}
                  <h3 className="font-semibold truncate">{product.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">SKU: {product.sku}</p>

                  {/* Hair Details */}
                  {(product.texture || product.lengthInches || product.color) && (
                    <p className="text-xs text-muted-foreground mb-2">
                      {[
                        product.texture,
                        product.lengthInches ? `${product.lengthInches}"` : null,
                        product.color,
                      ]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                  )}

                  {/* Price */}
                  <div className="flex items-baseline gap-2 mb-2">
                    {product.isOnSale && product.salePrice ? (
                      <>
                        <span className="text-lg font-bold text-red-600">
                          {formatCurrency(Number(product.salePrice))}
                        </span>
                        <span className="text-sm line-through text-muted-foreground">
                          {formatCurrency(Number(product.retailPrice))}
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-teal-600">
                        {formatCurrency(Number(product.retailPrice))}
                      </span>
                    )}
                  </div>

                  {/* Cost Price (OWNER/MANAGER only) */}
                  {isOwnerOrManager && Number(product.costPrice) > 0 && (
                    <p className="text-xs text-muted-foreground mb-1">
                      Cost: {formatCurrency(Number(product.costPrice))}
                    </p>
                  )}

                  {/* Stock */}
                  <p className="text-sm text-muted-foreground mb-3">
                    Stock: {getAvailableStock(product)} available
                  </p>

                  {/* Actions */}
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleAdjustStock(product)}
                      title="Adjust stock"
                    >
                      <PackagePlus className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleStockHistory(product)}
                      title="Stock history"
                    >
                      <History className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(product)}
                      className="text-destructive hover:text-destructive h-8 w-8"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        // List View
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors"
                >
                  {/* Image */}
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center shrink-0">
                    <Package className="w-8 h-8 text-teal-300" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{product.name}</h3>
                      {product.isFeatured && (
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      )}
                      {product.isOnSale && (
                        <Badge variant="destructive" className="text-xs">Sale</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      SKU: {product.sku}
                      {product.category && ` • ${product.category.name}`}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {Number(product.costPrice) > 0 ? (
                        <Badge className="bg-emerald-100 text-emerald-700 text-[10px] h-5">
                          <CheckCircle2 className="w-3 h-3 mr-0.5" />
                          Costed
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700 text-[10px] h-5">
                          <AlertTriangle className="w-3 h-3 mr-0.5" />
                          Cost unknown
                        </Badge>
                      )}
                      {isOwnerOrManager && Number(product.costPrice) > 0 && (
                        <span className="text-xs text-muted-foreground">
                          Cost: {formatCurrency(Number(product.costPrice))}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stock */}
                  <div className="text-center shrink-0">
                    <p className={`font-semibold ${getAvailableStock(product) <= 0 ? "text-red-600" : getAvailableStock(product) <= product.reorderLevel ? "text-amber-600" : ""}`}>
                      {getAvailableStock(product)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getAvailableStock(product) <= 0 ? (
                        <span className="text-red-500 font-medium">out of stock</span>
                      ) : getAvailableStock(product) <= product.reorderLevel ? (
                        <span className="text-amber-500 font-medium">low stock</span>
                      ) : (
                        "in stock"
                      )}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="text-right shrink-0">
                    {product.isOnSale && product.salePrice ? (
                      <>
                        <p className="font-bold text-red-600">
                          {formatCurrency(Number(product.salePrice))}
                        </p>
                        <p className="text-xs line-through text-muted-foreground">
                          {formatCurrency(Number(product.retailPrice))}
                        </p>
                      </>
                    ) : (
                      <p className="font-bold text-teal-600">
                        {formatCurrency(Number(product.retailPrice))}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(product)} title="Edit">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleAdjustStock(product)} title="Adjust stock">
                      <PackagePlus className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleStockHistory(product)} title="Stock history">
                      <History className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(product)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} products
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum: number;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={currentPage === pageNum ? "bg-teal-600 hover:bg-teal-700" : ""}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={currentPage >= pagination.totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <AddProductDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        categories={categories}
        onSuccess={handleSuccess}
      />

      <AddCategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        onSuccess={handleSuccess}
      />

      {selectedProduct && (
        <>
          <EditProductDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            product={selectedProduct}
            categories={categories}
            onSuccess={handleSuccess}
          />
          <DeleteProductDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            product={selectedProduct}
            onSuccess={handleSuccess}
          />
        </>
      )}

      {editingCategory && (
        <>
          <EditCategoryDialog
            open={editCategoryDialogOpen}
            onOpenChange={setEditCategoryDialogOpen}
            category={editingCategory}
            onSuccess={handleSuccess}
          />
          <DeleteCategoryDialog
            open={deleteCategoryDialogOpen}
            onOpenChange={setDeleteCategoryDialogOpen}
            category={editingCategory}
            onSuccess={handleSuccess}
          />
        </>
      )}

      {selectedProduct && (
        <>
          <AdjustStockDialog
            open={adjustStockDialogOpen}
            onOpenChange={setAdjustStockDialogOpen}
            product={selectedProduct}
            onSuccess={handleSuccess}
          />
          <StockHistoryDialog
            open={stockHistoryDialogOpen}
            onOpenChange={setStockHistoryDialogOpen}
            product={selectedProduct}
          />
        </>
      )}
    </div>
  );
}
