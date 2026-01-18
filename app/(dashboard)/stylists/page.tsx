// app/(dashboard)/stylists/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  const { data: session } = useSession();
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [filteredStylists, setFilteredStylists] = useState<Stylist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null);

  // Fetch stylists
  const fetchStylists = async () => {
    try {
      const response = await fetch("/api/stylists");
      if (response.ok) {
        const data = await response.json();
        setStylists(data);
        setFilteredStylists(data);
      }
    } catch (error) {
      console.error("Error fetching stylists:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStylists();
  }, []);

  // Search filter
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stylists</h1>
          <p className="text-muted-foreground">
            Manage your team and their schedules
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Stylist
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-teal-50">
                <Users className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Stylists</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-50">
                <UserCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Active Stylists</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-50">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalAppointments}</p>
                <p className="text-sm text-muted-foreground">Total Appointments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search stylists..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stylists Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filteredStylists.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <UserCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No stylists found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Try a different search" : "Add your first stylist to get started"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setAddDialogOpen(true)} className="bg-teal-600 hover:bg-teal-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Stylist
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStylists.map((stylist) => (
            <motion.div
              key={stylist.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                      {stylist.avatar ? (
                        <img
                          src={stylist.avatar}
                          alt={stylist.firstName}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-xl font-semibold text-teal-700">
                          {stylist.firstName[0]}{stylist.lastName[0]}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">
                          {stylist.firstName} {stylist.lastName}
                        </h3>
                        {!stylist.isActive && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      {stylist.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {stylist.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 mb-4">
                    {stylist.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        {stylist.phone}
                      </div>
                    )}
                    {stylist.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{stylist.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Schedule */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Clock className="w-4 h-4" />
                    <span>
                      {stylist.schedules?.length > 0
                        ? getWorkingDays(stylist.schedules) || "No working days"
                        : "Schedule not set"}
                    </span>
                  </div>

                  {/* Stats */}
                  {stylist._count && (
                    <div className="flex items-center gap-4 text-sm mb-4 pt-4 border-t">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-teal-600" />
                        <span className="font-medium">{stylist._count.appointments}</span>
                        <span className="text-muted-foreground">appointments</span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleSchedule(stylist)}
                    >
                      <Clock className="w-4 h-4 mr-1" />
                      Schedule
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(stylist)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(stylist)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

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
