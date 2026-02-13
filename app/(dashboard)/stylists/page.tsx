// app/(dashboard)/stylists/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Phone,
  Mail,
  Calendar,
  Edit,
  Trash2,
  UserCircle,
  Clock,
  Users,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { AddStylistDialog } from "./add-stylist-dialog";
import { EditStylistDialog } from "./edit-stylist-dialog";
import { DeleteStylistDialog } from "./delete-stylist-dialog";
import { ScheduleDialog } from "./schedule-dialog";

interface StylistSchedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isWorking: boolean;
}

interface Stylist {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  bio: string | null;
  avatar: string | null;
  isActive: boolean;
  createdAt: string;
  schedules: StylistSchedule[];
  _count?: {
    appointments: number;
  };
}

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function StylistsPage() {
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [filteredStylists, setFilteredStylists] = useState<Stylist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null);
  const { toast } = useToast();

  const fetchStylists = async () => {
    try {
      const response = await fetch("/api/stylists");
      if (response.ok) {
        const json = await response.json();
        const data = json.data ?? json;
        setStylists(data);
        setFilteredStylists(data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load stylists",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStylists();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredStylists(stylists);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredStylists(
        stylists.filter(
          (stylist) =>
            stylist.firstName.toLowerCase().includes(query) ||
            stylist.lastName.toLowerCase().includes(query) ||
            stylist.email?.toLowerCase().includes(query) ||
            stylist.phone?.includes(query)
        )
      );
    }
  }, [searchQuery, stylists]);

  const handleEdit = (stylist: Stylist) => {
    setSelectedStylist(stylist);
    setEditDialogOpen(true);
  };

  const handleDelete = (stylist: Stylist) => {
    setSelectedStylist(stylist);
    setDeleteDialogOpen(true);
  };

  const handleSchedule = (stylist: Stylist) => {
    setSelectedStylist(stylist);
    setScheduleDialogOpen(true);
  };

  const handleSuccess = () => {
    fetchStylists();
  };

  const getWorkingDays = (schedules: StylistSchedule[]) => {
    return schedules
      .filter((s) => s.isWorking)
      .map((s) => dayNames[s.dayOfWeek])
      .join(", ");
  };

  const stats = {
    total: stylists.length,
    active: stylists.filter((s) => s.isActive).length,
    totalAppointments: stylists.reduce((sum, s) => sum + (s._count?.appointments || 0), 0),
  };

  const statCards = [
    {
      name: "Total Stylists",
      value: stats.total,
      icon: Users,
      iconBg: "bg-gradient-to-br from-rose-500 to-pink-600",
      glowColor: "shadow-rose-500/20 hover:shadow-rose-500/30",
      accentColor: "from-rose-500/10 via-transparent to-transparent",
    },
    {
      name: "Active",
      value: stats.active,
      icon: UserCircle,
      iconBg: "bg-gradient-to-br from-pink-500 to-fuchsia-600",
      glowColor: "shadow-pink-500/20 hover:shadow-pink-500/30",
      accentColor: "from-pink-500/10 via-transparent to-transparent",
    },
    {
      name: "Total Appointments",
      value: stats.totalAppointments,
      icon: Calendar,
      iconBg: "bg-gradient-to-br from-violet-500 to-purple-600",
      glowColor: "shadow-violet-500/20 hover:shadow-violet-500/30",
      accentColor: "from-violet-500/10 via-transparent to-transparent",
    },
  ];

  return (
    <div className="space-y-5 max-w-[1400px]">

      {/* ═══════ GRADIENT BANNER ═══════ */}
      <div className="animate-in stagger-1 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#4a0525] via-[#831843] to-[#be185d] p-8 lg:p-10 shadow-2xl shadow-rose-900/20 ring-1 ring-white/10">
        <div className="absolute inset-0 shimmer pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-rose-400/15 blur-3xl animate-float" />
          <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-pink-400/10 blur-3xl animate-float-delayed" />
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
              <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
              <p className="text-rose-200/60 text-xs font-semibold tracking-widest uppercase">Team</p>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight text-glow leading-[1.1]">
              Stylists
            </h1>
            <p className="text-rose-100/50 mt-3 text-[15px] leading-relaxed max-w-lg">
              Manage your team members, their schedules, and performance.
            </p>
          </div>
          <Button
            onClick={() => setAddDialogOpen(true)}
            size="lg"
            className="glow-button bg-white text-rose-700 hover:bg-white/95 font-bold shadow-2xl shadow-black/20 h-12 px-8 text-[15px] rounded-xl border-0 shrink-0"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Stylist
          </Button>
        </div>
      </div>

      {/* ═══════ STAT CARDS ═══════ */}
      <div className="grid gap-5 grid-cols-2 lg:grid-cols-3">
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

      {/* ═══════ SEARCH ═══════ */}
      <div className="animate-in stagger-5 bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="h-[3px] bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500" />
        <div className="p-4 sm:p-5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search stylists..."
              className="w-full pl-11 pr-4 py-2.5 text-sm bg-gray-50/80 border border-gray-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300 transition-all font-medium placeholder:text-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ═══════ STYLISTS GRID ═══════ */}
      <div className="animate-in stagger-6">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 space-y-4">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-2xl skeleton-shimmer" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 skeleton-shimmer w-2/3" />
                    <div className="h-3 skeleton-shimmer w-1/2" />
                  </div>
                </div>
                <div className="h-3 skeleton-shimmer w-full" />
                <div className="h-3 skeleton-shimmer w-3/4" />
              </div>
            ))}
          </div>
        ) : filteredStylists.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="text-center py-16 px-4">
              <div className="inline-flex flex-col items-center border-2 border-dashed border-rose-200/60 rounded-2xl px-12 py-10 bg-gradient-to-br from-rose-50/30 to-slate-50/50">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center mb-5 ring-1 ring-rose-200/50 shadow-lg shadow-rose-500/10">
                  <UserCircle className="w-10 h-10 text-rose-500" />
                </div>
                <p className="text-gray-900 font-black text-lg tracking-tight">
                  {searchQuery ? "No stylists found" : "No stylists yet"}
                </p>
                <p className="text-sm text-gray-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
                  {searchQuery ? "Try a different search" : "Add your first stylist to get started"}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => setAddDialogOpen(true)}
                    className="mt-5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold shadow-lg shadow-rose-600/20 h-10 px-6 text-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Stylist
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredStylists.map((stylist, i) => {
              const initials = `${stylist.firstName[0]}${stylist.lastName[0]}`;
              const workingDays = stylist.schedules?.length > 0
                ? getWorkingDays(stylist.schedules) || "No working days"
                : "Schedule not set";

              return (
                <motion.div
                  key={stylist.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                  <div className="glass-card group p-6 h-full hover:shadow-xl transition-all duration-300">
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/15 shrink-0 group-hover:scale-105 transition-transform">
                        {stylist.avatar ? (
                          <img
                            src={stylist.avatar}
                            alt={stylist.firstName}
                            className="w-14 h-14 rounded-2xl object-cover"
                          />
                        ) : (
                          <span className="text-lg font-bold text-white">{initials}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 text-sm tracking-tight truncate">
                            {stylist.firstName} {stylist.lastName}
                          </h3>
                          {!stylist.isActive && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 ring-1 ring-gray-200/50">Inactive</span>
                          )}
                        </div>
                        {stylist.bio && (
                          <p className="text-xs text-gray-400 line-clamp-2 mt-1 leading-relaxed">{stylist.bio}</p>
                        )}
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="space-y-1.5 mb-3">
                      {stylist.phone && (
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Phone className="w-3.5 h-3.5" />
                          {stylist.phone}
                        </div>
                      )}
                      {stylist.email && (
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="truncate">{stylist.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Schedule */}
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{workingDays}</span>
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100/80">
                      {stylist._count && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-rose-500" />
                          <span className="font-bold text-gray-900 number-display">{stylist._count.appointments}</span>
                          <span className="text-gray-400">appointments</span>
                        </div>
                      )}
                      <div className="flex gap-0.5 ml-auto">
                        <button
                          onClick={() => handleSchedule(stylist)}
                          title="Schedule"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-50 transition-colors"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(stylist)}
                          title="Edit"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(stylist)}
                          title="Delete"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <AddStylistDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={handleSuccess}
      />

      {selectedStylist && (
        <>
          <EditStylistDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            stylist={selectedStylist}
            onSuccess={handleSuccess}
          />
          <DeleteStylistDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            stylist={selectedStylist}
            onSuccess={handleSuccess}
          />
          <ScheduleDialog
            open={scheduleDialogOpen}
            onOpenChange={setScheduleDialogOpen}
            stylist={selectedStylist}
            onSuccess={handleSuccess}
          />
        </>
      )}
    </div>
  );
}
