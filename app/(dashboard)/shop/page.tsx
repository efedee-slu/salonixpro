// app/(dashboard)/shop/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, cn } from "@/lib/utils";
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

  const statCards = [
    {
      name: "Total Products",
      value: stats.total,
      icon: Package,
      iconBg: "bg-gradient-to-br from-amber-500 to-amber-600",
      glowColor: "shadow-amber-500/20 hover:shadow-amber-500/30",
      accentColor: "from-amber-500/10 via-transparent to-transparent",
    },
    {
      name: "Inventory Value",
      value: formatCurrency(stats.totalValue),
      icon: DollarSign,
      iconBg: "bg-gradient-to-br from-orange-500 to-orange-600",
      glowColor: "shadow-orange-500/20 hover:shadow-orange-500/30",
      accentColor: "from-orange-500/10 via-transparent to-transparent",
    },
    {
      name: "Low Stock",
      value: stats.lowStock,
      extra: stats.outOfStock > 0 ? `${stats.outOfStock} out of stock` : undefined,
      icon: AlertTriangle,
      iconBg: "bg-gradient-to-br from-red-500 to-red-600",
      glowColor: "shadow-red-500/20 hover:shadow-red-500/30",
      accentColor: "from-red-500/10 via-transparent to-transparent",
    },
    {
      name: "Categories",
      value: categories.length,
      icon: Tag,
      iconBg: "bg-gradient-to-br from-yellow-500 to-yellow-600",
      glowColor: "shadow-yellow-500/20 hover:shadow-yellow-500/30",
      accentColor: "from-yellow-500/10 via-transparent to-transparent",
    },
  ];

  return (
    <div className="space-y-5 max-w-[1400px]">

      {/* ═══════ GRADIENT BANNER ═══════ */}
      <div className="animate-in stagger-1 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#78350f] via-[#92400e] to-[#b45309] p-8 lg:p-10 shadow-2xl shadow-amber-900/20 ring-1 ring-white/10">
        {/* Shimmer overlay */}
        <div className="absolute inset-0 shimmer pointer-events-none" />

        {/* Decorative animated shapes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-amber-400/15 blur-3xl animate-float" />
          <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-orange-400/10 blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full bg-yellow-400/10 blur-2xl animate-float-slow" />
          <div className="absolute top-8 right-16 w-16 h-16 border border-white/[0.08] rounded-2xl rotate-12 animate-float" />
          <div className="absolute top-1/2 right-8 w-10 h-10 border border-white/[0.06] rounded-xl rotate-45 animate-float-delayed" />
          <div className="absolute bottom-8 right-1/3 w-20 h-20 border border-white/[0.05] rounded-full animate-float-slow" />
          <div className="absolute top-4 left-1/3 w-6 h-6 bg-white/[0.04] rounded-lg rotate-12 animate-float" />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }} />
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <p className="text-amber-200/60 text-xs font-semibold tracking-widest uppercase">Inventory</p>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight text-glow leading-[1.1]">
              Shop
            </h1>
            <p className="text-amber-100/50 mt-3 text-[15px] leading-relaxed max-w-lg">
              Manage your product inventory, categories, and stock levels.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              onClick={() => setCategoryDialogOpen(true)}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 font-semibold rounded-xl h-12 px-6"
            >
              <Tag className="w-4 h-4 mr-2" />
              Manage Categories
            </Button>
            <Button
              onClick={() => setAddDialogOpen(true)}
              size="lg"
              className="glow-button bg-white text-amber-700 hover:bg-white/95 font-bold shadow-2xl shadow-black/20 h-12 px-8 text-[15px] rounded-xl border-0"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Product
            </Button>
          </div>
        </div>
      </div>

      {/* ═══════ STAT CARDS ═══════ */}
      <div className="grid gap-5 grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <div
            key={stat.name}
            className={cn(
              "animate-in glass-card glow-border group cursor-default p-5 rounded-2xl",
              stat.glowColor,
              `stagger-${index + 2}`
            )}
          >
            <div className={cn("absolute top-0 left-0 right-0 h-24 bg-gradient-to-b pointer-events-none", stat.accentColor)} />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110",
                  stat.iconBg
                )}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              {isLoading ? (
                <div className="h-10 w-24 skeleton-shimmer" />
              ) : (
                <>
                  <p className="text-4xl font-black text-gray-900 tracking-tight leading-none number-display">
                    {stat.value}
                  </p>
                  {"extra" in stat && stat.extra && (
                    <p className="text-xs text-red-500 font-bold mt-1">{stat.extra}</p>
                  )}
                </>
              )}
              <p className="text-[13px] text-gray-500 mt-2 font-semibold">{stat.name}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ═══════ CATEGORY PILLS ═══════ */}
      <div className="animate-in stagger-6 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setSelectedCategory("all")}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap shrink-0",
            selectedCategory === "all"
              ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-600/20"
              : "bg-white text-gray-600 hover:text-gray-900 ring-1 ring-gray-200/80 hover:ring-gray-300"
          )}
        >
          All ({products.length})
        </button>
        {categories.map((cat) => (
          <div key={cat.id} className="relative group flex items-center shrink-0">
            <button
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 pr-8",
                selectedCategory === cat.id
                  ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-600/20"
                  : "bg-white text-gray-600 hover:text-gray-900 ring-1 ring-gray-200/80 hover:ring-gray-300"
              )}
            >
              {cat.icon} {cat.name}
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                selectedCategory === cat.id
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-gray-500"
              )}>
                {cat._count.products}
              </span>
            </button>
            <div className="absolute right-1 flex opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleEditCategory(cat); }}
                className="w-5 h-5 rounded flex items-center justify-center hover:bg-black/10 transition-colors"
                title="Edit category"
              >
                <Edit className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat); }}
                className="w-5 h-5 rounded flex items-center justify-center hover:bg-red-100 text-red-500 transition-colors"
                title="Delete category"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={() => setCategoryDialogOpen(true)}
          className="px-3 py-2 rounded-xl text-sm font-semibold text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all duration-200 whitespace-nowrap shrink-0 border border-dashed border-gray-200"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* ═══════ SEARCH + VIEW TOGGLE ═══════ */}
      <div className="animate-in stagger-7 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-[3px] bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500" />
        <div className="p-4 sm:p-5">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-11 pr-4 py-2.5 text-sm bg-gray-50/80 border border-gray-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 transition-all font-medium placeholder:text-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-1 bg-gray-100/80 p-1 rounded-xl">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
                  viewMode === "grid" ? "bg-white shadow-sm ring-1 ring-black/5 text-gray-900" : "text-gray-400 hover:text-gray-600"
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
                  viewMode === "list" ? "bg-white shadow-sm ring-1 ring-black/5 text-gray-900" : "text-gray-400 hover:text-gray-600"
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ PRODUCTS GRID / LIST ═══════ */}
      <div className="animate-in stagger-8">
        {isLoading ? (
          viewMode === "grid" ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="h-40 skeleton-shimmer" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 skeleton-shimmer w-1/3" />
                    <div className="h-4 skeleton-shimmer w-2/3" />
                    <div className="h-3 skeleton-shimmer w-1/2" />
                    <div className="flex justify-between pt-2">
                      <div className="h-5 skeleton-shimmer w-20" />
                      <div className="h-4 skeleton-shimmer w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-[3px] bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500" />
              <div className="p-6 space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex gap-4 items-center">
                    <div className="w-14 h-14 rounded-xl skeleton-shimmer" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 skeleton-shimmer w-1/3" />
                      <div className="h-3 skeleton-shimmer w-1/2" />
                    </div>
                    <div className="w-16 h-4 skeleton-shimmer" />
                    <div className="w-20 h-5 skeleton-shimmer" />
                  </div>
                ))}
              </div>
            </div>
          )
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-[3px] bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500" />
            <div className="text-center py-16 px-4">
              <div className="inline-flex flex-col items-center border-2 border-dashed border-amber-200/60 rounded-2xl px-12 py-10 bg-gradient-to-br from-amber-50/30 to-slate-50/50">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mb-5 ring-1 ring-amber-200/50 shadow-lg shadow-amber-500/10">
                  <Package className="w-10 h-10 text-amber-500" />
                </div>
                <p className="text-gray-900 font-black text-lg tracking-tight">
                  {searchQuery ? "No products found" : "No products yet"}
                </p>
                <p className="text-sm text-gray-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
                  {searchQuery
                    ? "Try a different search term or category"
                    : "Get started by adding your first product"}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => setAddDialogOpen(true)}
                    className="mt-5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold shadow-lg shadow-amber-600/20 h-10 px-6 text-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="animate-in glass-card group overflow-hidden h-full hover:shadow-xl transition-all duration-300 rounded-2xl"
              >
                {/* Product Image */}
                <div className="h-40 bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center relative overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-14 h-14 text-amber-300/60" />
                  )}
                  {product.isFeatured && (
                    <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-500 text-white shadow-lg shadow-amber-500/30">
                      <Star className="w-3 h-3 fill-white" />
                      Featured
                    </span>
                  )}
                  {product.isOnSale && (
                    <span className="absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-1 rounded-lg bg-red-500 text-white shadow-lg shadow-red-500/30">
                      Sale
                    </span>
                  )}
                  {getAvailableStock(product) <= 0 ? (
                    <span className="absolute bottom-2.5 left-2.5 text-[10px] font-bold px-2 py-1 rounded-lg bg-red-600 text-white shadow-lg shadow-red-600/30">
                      Out of Stock
                    </span>
                  ) : getAvailableStock(product) <= product.reorderLevel ? (
                    <span className="absolute bottom-2.5 left-2.5 text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-500 text-white shadow-lg shadow-amber-500/30">
                      Low Stock ({getAvailableStock(product)})
                    </span>
                  ) : null}
                </div>

                <div className="p-5">
                  {/* Category */}
                  {product.category && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 ring-1 ring-amber-200/50 inline-block mb-2">
                      {product.category.icon} {product.category.name}
                    </span>
                  )}

                  {/* Name & SKU */}
                  <h3 className="font-bold text-gray-900 text-sm tracking-tight truncate">{product.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5 font-medium">SKU: {product.sku}</p>

                  {/* Hair Details */}
                  {(product.texture || product.lengthInches || product.color) && (
                    <p className="text-[11px] text-gray-400 mt-1.5 truncate">
                      {[
                        product.texture,
                        product.lengthInches ? `${product.lengthInches}"` : null,
                        product.color,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}

                  {/* Price */}
                  <div className="flex items-baseline gap-2 mt-3 mb-1">
                    {product.isOnSale && product.salePrice ? (
                      <>
                        <span className="text-lg font-black text-red-600 number-display">
                          {formatCurrency(Number(product.salePrice))}
                        </span>
                        <span className="text-xs line-through text-gray-400">
                          {formatCurrency(Number(product.retailPrice))}
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-black text-gray-900 number-display">
                        {formatCurrency(Number(product.retailPrice))}
                      </span>
                    )}
                  </div>

                  {/* Stock */}
                  <p className="text-[11px] text-gray-400 font-medium mb-4">
                    {getAvailableStock(product)} available
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-1 pt-3 border-t border-gray-100/80">
                    <button
                      onClick={() => handleEdit(product)}
                      className="flex-1 h-8 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleAdjustStock(product)}
                      title="Adjust stock"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                    >
                      <PackagePlus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleStockHistory(product)}
                      title="Stock history"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <History className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      title="Delete"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ═══════ LIST VIEW ═══════ */
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-[3px] bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500" />
            <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">
                  {pagination.total} {pagination.total === 1 ? "Product" : "Products"}
                </h3>
                <p className="text-sm text-gray-400 mt-0.5 font-medium">Your product inventory</p>
              </div>
            </div>
            {/* Table header */}
            <div className="hidden md:flex items-center gap-4 px-6 py-2.5 border-b border-gray-100 bg-gray-50/60">
              <div className="w-14 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Product</span>
              </div>
              <div className="w-16 text-center shrink-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Stock</span>
              </div>
              <div className="w-24 text-right shrink-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Price</span>
              </div>
              <div className="w-[136px] shrink-0" />
            </div>
            <div className="divide-y divide-gray-50">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors duration-150 group/row"
                >
                  {/* Image */}
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/10 group-hover/row:scale-105 transition-transform overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-14 h-14 rounded-xl object-cover"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-amber-400" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-gray-900 text-sm truncate">{product.name}</p>
                      {product.isFeatured && (
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                      )}
                      {product.isOnSale && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-600 ring-1 ring-red-200/50">Sale</span>
                      )}
                      {product.category && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 ring-1 ring-amber-200/50 hidden sm:inline">
                          {product.category.icon} {product.category.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="font-medium">SKU: {product.sku}</span>
                      {(product.texture || product.lengthInches || product.color) && (
                        <span className="hidden sm:inline truncate">
                          {[product.texture, product.lengthInches ? `${product.lengthInches}"` : null, product.color].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stock */}
                  <div className="hidden md:block text-center shrink-0 w-16">
                    <p className={cn(
                      "font-bold number-display text-sm",
                      getAvailableStock(product) <= 0 ? "text-red-600" : getAvailableStock(product) <= product.reorderLevel ? "text-amber-600" : "text-gray-900"
                    )}>
                      {getAvailableStock(product)}
                    </p>
                    <p className="text-[11px] font-medium">
                      {getAvailableStock(product) <= 0 ? (
                        <span className="text-red-500">out of stock</span>
                      ) : getAvailableStock(product) <= product.reorderLevel ? (
                        <span className="text-amber-500">low stock</span>
                      ) : (
                        <span className="text-gray-400">in stock</span>
                      )}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="text-right shrink-0 w-24">
                    {product.isOnSale && product.salePrice ? (
                      <>
                        <p className="font-black text-red-600 text-sm number-display">
                          {formatCurrency(Number(product.salePrice))}
                        </p>
                        <p className="text-[11px] line-through text-gray-400">
                          {formatCurrency(Number(product.retailPrice))}
                        </p>
                      </>
                    ) : (
                      <p className="font-black text-gray-900 text-sm number-display">
                        {formatCurrency(Number(product.retailPrice))}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => handleEdit(product)}
                      title="Edit"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleAdjustStock(product)}
                      title="Adjust stock"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                    >
                      <PackagePlus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleStockHistory(product)}
                      title="Stock history"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <History className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      title="Delete"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══════ PAGINATION ═══════ */}
      {pagination.totalPages > 1 && (
        <div className="animate-in stagger-9 flex items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-4">
          <p className="text-sm text-gray-400 font-medium">
            Showing <span className="font-bold text-gray-900 number-display">{(pagination.page - 1) * pagination.limit + 1}</span>-<span className="font-bold text-gray-900 number-display">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-bold text-gray-900 number-display">{pagination.total}</span> products
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
                currentPage <= 1
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-600 hover:text-gray-900 ring-1 ring-gray-200/80 hover:ring-gray-300 bg-white"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
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
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      "w-9 h-9 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center",
                      currentPage === pageNum
                        ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-600/20"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={currentPage >= pagination.totalPages}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
                currentPage >= pagination.totalPages
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-600 hover:text-gray-900 ring-1 ring-gray-200/80 hover:ring-gray-300 bg-white"
              )}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
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
