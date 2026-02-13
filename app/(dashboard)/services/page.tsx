// app/(dashboard)/services/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Clock,
  DollarSign,
  Edit,
  Trash2,
  Sparkles,
  FolderOpen,
  LayoutGrid,
  List,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDuration, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { AddServiceDialog } from "./add-service-dialog";
import { EditServiceDialog } from "./edit-service-dialog";
import { DeleteServiceDialog } from "./delete-service-dialog";
import { AddCategoryDialog } from "./add-category-dialog";
import { BrowseCatalogDialog } from "./browse-catalog-dialog";

interface ServiceCategory {
  id: string;
  name: string;
  icon: string | null;
  _count?: { services: number };
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  isActive: boolean;
  categoryId: string | null;
  masterServiceId: string | null;
  category: ServiceCategory | null;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [addServiceOpen, setAddServiceOpen] = useState(false);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [browseCatalogOpen, setBrowseCatalogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [servicesRes, categoriesRes] = await Promise.all([
        fetch("/api/services"),
        fetch("/api/services/categories"),
      ]);

      if (servicesRes.ok) {
        const json = await servicesRes.json();
        const data = json.data ?? json;
        setServices(data);
        setFilteredServices(data);
      }

      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = services;

    if (selectedCategory) {
      filtered = filtered.filter((s) => s.categoryId === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.description?.toLowerCase().includes(query) ||
          s.category?.name.toLowerCase().includes(query)
      );
    }

    setFilteredServices(filtered);
  }, [searchQuery, selectedCategory, services]);

  const handleEdit = (service: Service) => {
    setSelectedService(service);
    setEditDialogOpen(true);
  };

  const handleDelete = (service: Service) => {
    setSelectedService(service);
    setDeleteDialogOpen(true);
  };

  const handleSuccess = () => {
    fetchData();
  };

  const stats = {
    total: services.length,
    active: services.filter((s) => s.isActive).length,
    categories: categories.length,
    avgPrice: services.length > 0
      ? services.reduce((sum, s) => sum + Number(s.price), 0) / services.length
      : 0,
  };

  const statCards = [
    {
      name: "Total Services",
      value: stats.total,
      icon: Sparkles,
      iconBg: "bg-gradient-to-br from-violet-500 to-purple-600",
      glowColor: "shadow-violet-500/20 hover:shadow-violet-500/30",
      accentColor: "from-violet-500/10 via-transparent to-transparent",
    },
    {
      name: "Active",
      value: stats.active,
      icon: CheckCircle2,
      iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
      glowColor: "shadow-emerald-500/20 hover:shadow-emerald-500/30",
      accentColor: "from-emerald-500/10 via-transparent to-transparent",
    },
    {
      name: "Categories",
      value: stats.categories,
      icon: FolderOpen,
      iconBg: "bg-gradient-to-br from-fuchsia-500 to-pink-600",
      glowColor: "shadow-fuchsia-500/20 hover:shadow-fuchsia-500/30",
      accentColor: "from-fuchsia-500/10 via-transparent to-transparent",
    },
    {
      name: "Avg Price",
      value: formatCurrency(stats.avgPrice),
      icon: DollarSign,
      iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
      glowColor: "shadow-amber-500/20 hover:shadow-amber-500/30",
      accentColor: "from-amber-500/10 via-transparent to-transparent",
    },
  ];

  return (
    <div className="space-y-5 max-w-[1400px]">

      {/* ═══════ GRADIENT BANNER ═══════ */}
      <div className="animate-in stagger-1 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2e1065] via-[#4c1d95] to-[#6d28d9] p-8 lg:p-10 shadow-2xl shadow-violet-900/20 ring-1 ring-white/10">
        <div className="absolute inset-0 shimmer pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-violet-400/15 blur-3xl animate-float" />
          <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-purple-400/10 blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full bg-fuchsia-400/10 blur-2xl animate-float-slow" />
          <div className="absolute top-8 right-16 w-16 h-16 border border-white/[0.08] rounded-2xl rotate-12 animate-float" />
          <div className="absolute top-1/2 right-8 w-10 h-10 border border-white/[0.06] rounded-xl rotate-45 animate-float-delayed" />
          <div className="absolute bottom-8 right-1/3 w-20 h-20 border border-white/[0.05] rounded-full animate-float-slow" />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }} />
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              <p className="text-violet-200/60 text-xs font-semibold tracking-widest uppercase">Menu</p>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight text-glow leading-[1.1]">
              Services
            </h1>
            <p className="text-violet-100/50 mt-3 text-[15px] leading-relaxed max-w-lg">
              Manage your service menu, categories, and pricing for your salon.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              onClick={() => setBrowseCatalogOpen(true)}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 font-semibold rounded-xl h-12 px-6"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Catalog
            </Button>
            <Button
              onClick={() => setAddServiceOpen(true)}
              size="lg"
              className="glow-button bg-white text-violet-700 hover:bg-white/95 font-bold shadow-2xl shadow-black/20 h-12 px-8 text-[15px] rounded-xl border-0"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Service
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
              "animate-in glass-card glow-border group cursor-default p-6",
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
                <p className="text-4xl font-black text-gray-900 tracking-tight leading-none number-display">
                  {stat.value}
                </p>
              )}
              <p className="text-[13px] text-gray-500 mt-2 font-semibold">{stat.name}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ═══════ CATEGORY TABS ═══════ */}
      <div className="animate-in stagger-6 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap shrink-0",
            selectedCategory === null
              ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-600/20"
              : "bg-white text-gray-600 hover:text-gray-900 ring-1 ring-gray-200/80 hover:ring-gray-300"
          )}
        >
          All Services
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap shrink-0 flex items-center gap-1.5",
              selectedCategory === category.id
                ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-600/20"
                : "bg-white text-gray-600 hover:text-gray-900 ring-1 ring-gray-200/80 hover:ring-gray-300"
            )}
          >
            {category.icon} {category.name}
            {category._count && (
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                selectedCategory === category.id
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-gray-500"
              )}>
                {category._count.services}
              </span>
            )}
          </button>
        ))}
        <button
          onClick={() => setAddCategoryOpen(true)}
          className="px-3 py-2 rounded-xl text-sm font-semibold text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-all duration-200 whitespace-nowrap shrink-0 border border-dashed border-gray-200"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* ═══════ SEARCH + VIEW TOGGLE ═══════ */}
      <div className="animate-in stagger-7 bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="h-[3px] bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />
        <div className="p-4 sm:p-5">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search services..."
                className="w-full pl-11 pr-4 py-2.5 text-sm bg-gray-50/80 border border-gray-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all font-medium placeholder:text-gray-400"
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
                <LayoutGrid className="w-4 h-4" />
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

      {/* ═══════ SERVICES GRID/LIST ═══════ */}
      <div className="animate-in stagger-8">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 space-y-4">
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-xl skeleton-shimmer" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 skeleton-shimmer w-2/3" />
                    <div className="h-3 skeleton-shimmer w-1/3" />
                  </div>
                </div>
                <div className="h-3 skeleton-shimmer w-full" />
                <div className="flex justify-between">
                  <div className="h-4 skeleton-shimmer w-16" />
                  <div className="h-5 skeleton-shimmer w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="text-center py-16 px-4">
              <div className="inline-flex flex-col items-center border-2 border-dashed border-violet-200/60 rounded-2xl px-12 py-10 bg-gradient-to-br from-violet-50/30 to-slate-50/50">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center mb-5 ring-1 ring-violet-200/50 shadow-lg shadow-violet-500/10">
                  <Sparkles className="w-10 h-10 text-violet-500" />
                </div>
                <p className="text-gray-900 font-black text-lg tracking-tight">No services found</p>
                <p className="text-sm text-gray-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
                  {searchQuery || selectedCategory ? "Try a different search or category" : "Add your first service to get started"}
                </p>
                {!searchQuery && !selectedCategory && (
                  <Button
                    onClick={() => setAddServiceOpen(true)}
                    className="mt-5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold shadow-lg shadow-violet-600/20 h-10 px-6 text-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Service
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map((service, i) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
              >
                <div className="glass-card group p-6 h-full hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-bold text-gray-900 text-sm tracking-tight truncate">{service.name}</h3>
                        {!service.isActive && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 ring-1 ring-gray-200/50">Inactive</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {service.category && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-50 text-violet-600 ring-1 ring-violet-200/50">
                            {service.category.icon} {service.category.name}
                          </span>
                        )}
                        {service.masterServiceId && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-600 ring-1 ring-teal-200/50">
                            <BookOpen className="w-3 h-3 inline mr-0.5" />
                            Catalog
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => handleEdit(service)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(service)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {service.description && (
                    <p className="text-xs text-gray-400 mb-4 line-clamp-2 leading-relaxed">{service.description}</p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100/80 mt-auto">
                    <span className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDuration(service.duration)}
                    </span>
                    <p className="text-lg font-black text-gray-900 number-display">
                      {formatCurrency(Number(service.price))}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="h-[3px] bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />
            <div className="divide-y divide-gray-100/60">
              {filteredServices.map((service, i) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.3 }}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors group/row"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/15 shrink-0 group-hover/row:scale-105 transition-transform">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-gray-900 text-sm truncate">{service.name}</p>
                      {!service.isActive && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-500">Inactive</span>
                      )}
                      {service.category && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-50 text-violet-600 ring-1 ring-violet-200/50 hidden sm:inline">
                          {service.category.icon} {service.category.name}
                        </span>
                      )}
                    </div>
                    {service.description && (
                      <p className="text-xs text-gray-400 truncate">{service.description}</p>
                    )}
                  </div>

                  <span className="flex items-center gap-1 text-xs text-gray-400 font-medium shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDuration(service.duration)}
                  </span>
                  <p className="font-black text-gray-900 text-sm number-display w-24 text-right shrink-0">
                    {formatCurrency(Number(service.price))}
                  </p>

                  <div className="flex gap-0.5 shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => handleEdit(service)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(service)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <AddServiceDialog
        open={addServiceOpen}
        onOpenChange={setAddServiceOpen}
        categories={categories}
        onSuccess={handleSuccess}
      />

      <AddCategoryDialog
        open={addCategoryOpen}
        onOpenChange={setAddCategoryOpen}
        onSuccess={handleSuccess}
      />

      <BrowseCatalogDialog
        open={browseCatalogOpen}
        onOpenChange={setBrowseCatalogOpen}
        onSuccess={handleSuccess}
      />

      {selectedService && (
        <>
          <EditServiceDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            service={selectedService}
            categories={categories}
            onSuccess={handleSuccess}
          />
          <DeleteServiceDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            service={selectedService}
            onSuccess={handleSuccess}
          />
        </>
      )}
    </div>
  );
}
