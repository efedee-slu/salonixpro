// app/(dashboard)/gallery/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Camera,
  Plus,
  Loader2,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  X,
  Upload,
  Info,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GalleryItem {
  id: string;
  title: string | null;
  description: string | null;
  beforeImageUrl: string;
  afterImageUrl: string;
  beforeImagePublicId: string;
  afterImagePublicId: string;
  serviceCategory: string | null;
  isPublic: boolean;
  isApproved: boolean;
  stylistId: string | null;
  categoryId: string | null;
  clientId: string | null;
  createdAt: string;
  stylist: { firstName: string; lastName: string } | null;
  category: { name: string } | null;
  client: { firstName: string; lastName: string } | null;
}

interface StylistOption {
  id: string;
  firstName: string;
  lastName: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface ClientOption {
  id: string;
  firstName: string;
  lastName: string;
}

const defaultForm = {
  title: "",
  description: "",
  serviceCategory: "",
  stylistId: "",
  categoryId: "",
  clientId: "",
};

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stylists, setStylists] = useState<StylistOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const { toast } = useToast();

  // Filters
  const [filterStylist, setFilterStylist] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Add/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);
  const [beforeUpload, setBeforeUpload] = useState<{ url: string; publicId: string } | null>(null);
  const [afterUpload, setAfterUpload] = useState<{ url: string; publicId: string } | null>(null);
  const [isUploading, setIsUploading] = useState<"before" | "after" | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<GalleryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGallery = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStylist) params.set("stylistId", filterStylist);
      if (filterCategory) params.set("categoryId", filterCategory);
      const res = await fetch(`/api/gallery?${params}`);
      if (res.ok) setItems(await res.json());
    } catch {
      toast({ title: "Error", description: "Failed to load gallery", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [filterStylist, filterCategory]);

  useEffect(() => { fetchGallery(); }, [fetchGallery]);

  // Load dropdown options
  useEffect(() => {
    Promise.all([
      fetch("/api/stylists").then((r) => r.ok ? r.json() : []),
      fetch("/api/services/categories").then((r) => r.ok ? r.json() : []),
      fetch("/api/clients?limit=100").then((r) => r.ok ? r.json() : { data: [] }),
    ]).then(([s, c, cl]) => {
      setStylists(Array.isArray(s) ? s : []);
      setCategories(Array.isArray(c) ? c : []);
      setClients(Array.isArray(cl?.data) ? cl.data : []);
    });
  }, []);

  const handleUpload = async (file: File, type: "before" | "after") => {
    setIsUploading(type);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "gallery");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      if (type === "before") {
        setBeforePreview(data.url);
        setBeforeUpload({ url: data.url, publicId: data.publicId });
      } else {
        setAfterPreview(data.url);
        setAfterUpload({ url: data.url, publicId: data.publicId });
      }
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message || "Failed to upload image", variant: "destructive" });
    } finally {
      setIsUploading(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "before" | "after") => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file, type);
  };

  const openAddDialog = () => {
    setEditingItem(null);
    setForm(defaultForm);
    setBeforePreview(null);
    setAfterPreview(null);
    setBeforeUpload(null);
    setAfterUpload(null);
    setDialogOpen(true);
  };

  const openEditDialog = (item: GalleryItem) => {
    setEditingItem(item);
    setForm({
      title: item.title || "",
      description: item.description || "",
      serviceCategory: item.serviceCategory || "",
      stylistId: item.stylistId || "",
      categoryId: item.categoryId || "",
      clientId: item.clientId || "",
    });
    setBeforePreview(item.beforeImageUrl);
    setAfterPreview(item.afterImageUrl);
    setBeforeUpload(null);
    setAfterUpload(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingItem && (!beforeUpload || !afterUpload)) {
      toast({ title: "Error", description: "Please upload both before and after images", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const body: any = { ...form };
      if (editingItem) {
        if (beforeUpload) {
          body.beforeImageUrl = beforeUpload.url;
          body.beforeImagePublicId = beforeUpload.publicId;
        }
        if (afterUpload) {
          body.afterImageUrl = afterUpload.url;
          body.afterImagePublicId = afterUpload.publicId;
        }
        const res = await fetch(`/api/gallery/${editingItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        toast({ title: "Updated", description: "Gallery item updated successfully." });
      } else {
        body.beforeImageUrl = beforeUpload!.url;
        body.beforeImagePublicId = beforeUpload!.publicId;
        body.afterImageUrl = afterUpload!.url;
        body.afterImagePublicId = afterUpload!.publicId;
        const res = await fetch("/api/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        toast({ title: "Added", description: "Photo pair added to gallery." });
      }
      setDialogOpen(false);
      fetchGallery();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/gallery/${deletingItem.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "Deleted", description: "Gallery item removed." });
      setDeleteDialogOpen(false);
      fetchGallery();
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleVisibility = async (item: GalleryItem) => {
    try {
      const res = await fetch(`/api/gallery/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !item.isPublic }),
      });
      if (res.ok) {
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isPublic: !i.isPublic } : i)));
        toast({ title: item.isPublic ? "Hidden" : "Visible", description: `Photo is now ${item.isPublic ? "private" : "public"}.` });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update visibility", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Gallery</h1>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger><Info className="w-4 h-4 text-muted-foreground" /></TooltipTrigger>
                <TooltipContent><p className="text-xs max-w-[200px]">Upload before and after photos of your work to showcase on your booking page</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-muted-foreground">Showcase your best transformations</p>
        </div>
        <Button onClick={openAddDialog} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="w-4 h-4 mr-2" /> Add Photos
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterStylist}
          onChange={(e) => setFilterStylist(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm bg-white"
        >
          <option value="">All Stylists</option>
          {stylists.map((s) => (
            <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
          ))}
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm bg-white"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Camera className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-1">No photos yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Showcase your best work by uploading before and after photos.</p>
            <Button onClick={openAddDialog} variant="outline">
              <Plus className="w-4 h-4 mr-2" /> Add Your First Photos
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card className={!item.isPublic ? "opacity-60" : ""}>
                <CardContent className="p-0">
                  {/* Before/After Images */}
                  <div className="grid grid-cols-2 gap-px bg-gray-200">
                    <div className="relative aspect-[4/3] bg-gray-100">
                      <img src={item.beforeImageUrl} alt="Before" className="w-full h-full object-cover" />
                      <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">BEFORE</span>
                    </div>
                    <div className="relative aspect-[4/3] bg-gray-100">
                      <img src={item.afterImageUrl} alt="After" className="w-full h-full object-cover" />
                      <span className="absolute top-2 left-2 bg-teal-600/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">AFTER</span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {item.title && <p className="font-medium text-sm truncate">{item.title}</p>}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          {item.serviceCategory && <Badge variant="secondary" className="text-[10px]">{item.serviceCategory}</Badge>}
                          {item.stylist && <span>{item.stylist.firstName} {item.stylist.lastName}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => toggleVisibility(item)}>
                                {item.isPublic ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p className="text-xs">{item.isPublic ? "Public — visible on booking page" : "Private — only visible to your team"}</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setDeletingItem(item); setDeleteDialogOpen(true); }}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    {!item.isApproved && <Badge variant="outline" className="mt-2 text-[10px] text-amber-600 border-amber-300">Pending approval</Badge>}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Photo" : "Add Before & After Photos"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update the details for this photo pair." : "Upload a before and after photo to showcase your work."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            {/* Image Uploads */}
            <div className="grid grid-cols-2 gap-4">
              {/* Before */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Before</Label>
                {beforePreview ? (
                  <div className="relative aspect-[4/3] rounded-lg overflow-hidden border">
                    <img src={beforePreview} alt="Before" className="w-full h-full object-cover" />
                    <button
                      onClick={() => { setBeforePreview(null); setBeforeUpload(null); }}
                      className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center aspect-[4/3] border-2 border-dashed rounded-lg cursor-pointer hover:border-teal-400 transition-colors">
                    {isUploading === "before" ? (
                      <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-xs text-muted-foreground">Upload before photo</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, "before")} disabled={isUploading !== null} />
                  </label>
                )}
              </div>

              {/* After */}
              <div>
                <Label className="text-sm font-medium mb-2 block">After</Label>
                {afterPreview ? (
                  <div className="relative aspect-[4/3] rounded-lg overflow-hidden border">
                    <img src={afterPreview} alt="After" className="w-full h-full object-cover" />
                    <button
                      onClick={() => { setAfterPreview(null); setAfterUpload(null); }}
                      className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center aspect-[4/3] border-2 border-dashed rounded-lg cursor-pointer hover:border-teal-400 transition-colors">
                    {isUploading === "after" ? (
                      <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-xs text-muted-foreground">Upload after photo</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, "after")} disabled={isUploading !== null} />
                  </label>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <Label className="text-sm">Title (optional)</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g., Balayage Transformation"
                className="mt-1"
              />
            </div>

            {/* Description */}
            <div>
              <Label className="text-sm">Description (optional)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Tell the story of this transformation..."
                rows={2}
                className="mt-1"
              />
            </div>

            {/* Dropdowns */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Service Category</Label>
                <select
                  value={form.categoryId}
                  onChange={(e) => {
                    const cat = categories.find((c) => c.id === e.target.value);
                    setForm((f) => ({ ...f, categoryId: e.target.value, serviceCategory: cat?.name || "" }));
                  }}
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  <option value="">None</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-sm">Stylist</Label>
                <select
                  value={form.stylistId}
                  onChange={(e) => setForm((f) => ({ ...f, stylistId: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  <option value="">None</option>
                  {stylists.map((s) => (
                    <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label className="text-sm">Client (optional, internal only)</Label>
              <select
                value={form.clientId}
                onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white"
              >
                <option value="">None</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving || isUploading !== null} className="bg-teal-600 hover:bg-teal-700">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingItem ? "Save Changes" : "Add to Gallery"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Photo</DialogTitle>
            <DialogDescription>
              This will permanently delete this before/after photo pair and remove the images. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
