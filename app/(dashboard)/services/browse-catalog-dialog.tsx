// app/(dashboard)/services/browse-catalog-dialog.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Check,
  ChevronDown,
  Loader2,
  Clock,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

interface CatalogService {
  id: string;
  code: string;
  name: string;
  category: string;
  subcategory: string;
  defaultDuration: number;
  description: string | null;
  enabled: boolean;
}

interface CatalogGroup {
  category: string;
  subcategory: string;
  services: CatalogService[];
}

interface BrowseCatalogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BrowseCatalogDialog({
  open,
  onOpenChange,
  onSuccess,
}: BrowseCatalogDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [groups, setGroups] = useState<CatalogGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );
  const [enablingId, setEnablingId] = useState<string | null>(null);
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      fetchCatalog();
    }
  }, [open]);

  const fetchCatalog = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/services/catalog");
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups);
        // Expand first section by default
        if (data.groups.length > 0) {
          setExpandedSections(new Set([data.groups[0].subcategory]));
        }
      }
    } catch (err) {
      console.error("Failed to load catalog:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (subcategory: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(subcategory)) {
        next.delete(subcategory);
      } else {
        next.add(subcategory);
      }
      return next;
    });
  };

  const handleEnable = async (service: CatalogService) => {
    const price = priceInputs[service.id];
    if (!price || parseFloat(price) < 0) {
      toast({
        title: "Price required",
        description: "Please enter a valid price before enabling this service.",
        variant: "destructive",
      });
      return;
    }

    setEnablingId(service.id);
    try {
      const res = await fetch("/api/services/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          masterServiceId: service.id,
          price: parseFloat(price),
        }),
      });

      if (res.ok) {
        toast({
          title: "Service added",
          description: `${service.name} has been added to your services.`,
        });
        // Mark as enabled locally
        setGroups((prev) =>
          prev.map((g) => ({
            ...g,
            services: g.services.map((s) =>
              s.id === service.id ? { ...s, enabled: true } : s
            ),
          }))
        );
        onSuccess();
      } else {
        const err = await res.json();
        toast({
          title: "Error",
          description: err.error || "Failed to add service",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to add service",
        variant: "destructive",
      });
    } finally {
      setEnablingId(null);
    }
  };

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const q = searchQuery.toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        services: g.services.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.description?.toLowerCase().includes(q) ||
            s.subcategory.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.services.length > 0);
  }, [groups, searchQuery]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-600" />
            Browse Service Catalog
          </DialogTitle>
          <DialogDescription>
            Add services from the SalonixPro catalog to your menu. Set a price
            and click Enable.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search catalog..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGroups.map((group) => {
              const isExpanded = expandedSections.has(group.subcategory);
              const enabledCount = group.services.filter(
                (s) => s.enabled
              ).length;

              return (
                <Card key={`${group.category}-${group.subcategory}`}>
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => toggleSection(group.subcategory)}
                  >
                    <div className="flex items-center gap-2">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          isExpanded ? "" : "-rotate-90"
                        }`}
                      />
                      <span className="font-medium text-sm">
                        {group.subcategory}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {enabledCount}/{group.services.length} enabled
                    </Badge>
                  </div>

                  {isExpanded && (
                    <CardContent className="pt-0 pb-3 px-3">
                      <div className="space-y-2">
                        {group.services.map((service) => (
                          <div
                            key={service.id}
                            className={`flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-lg text-sm ${
                              service.enabled
                                ? "bg-teal-50/50 opacity-60"
                                : "bg-accent/30"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {service.name}
                                </span>
                                {service.enabled && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs bg-teal-100 text-teal-700"
                                  >
                                    <Check className="w-3 h-3 mr-1" />
                                    Added
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {service.defaultDuration} min
                                {service.description && (
                                  <>
                                    <span>-</span>
                                    <span className="truncate">
                                      {service.description}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            {!service.enabled && (
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="Price"
                                  value={priceInputs[service.id] || ""}
                                  onChange={(e) =>
                                    setPriceInputs((prev) => ({
                                      ...prev,
                                      [service.id]: e.target.value,
                                    }))
                                  }
                                  className="w-24 h-7 text-sm"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <Button
                                  size="sm"
                                  className="h-7 bg-teal-600 hover:bg-teal-700 text-xs"
                                  disabled={enablingId === service.id}
                                  onClick={() => handleEnable(service)}
                                >
                                  {enablingId === service.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    "Enable"
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
