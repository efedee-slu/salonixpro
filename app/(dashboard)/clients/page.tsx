// app/(dashboard)/clients/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Phone,
  Mail,
  DollarSign,
  Edit,
  Trash2,
  UserPlus,
  Users,
  Crown,
  Calendar,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { AddClientDialog } from "./add-client-dialog";
import { EditClientDialog } from "./edit-client-dialog";
import { DeleteClientDialog } from "./delete-client-dialog";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  address: string | null;
  notes: string | null;
  totalVisits: number;
  totalSpent: number;
  lastVisitAt: string | null;
  createdAt: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const { toast } = useToast();

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");
      if (response.ok) {
        const json = await response.json();
        const data = json.data ?? json;
        setClients(data);
        setFilteredClients(data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load clients",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredClients(clients);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredClients(
        clients.filter(
          (client) =>
            client.firstName.toLowerCase().includes(query) ||
            client.lastName.toLowerCase().includes(query) ||
            client.phone.includes(query) ||
            client.email?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, clients]);

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setEditDialogOpen(true);
  };

  const handleDelete = (client: Client) => {
    setSelectedClient(client);
    setDeleteDialogOpen(true);
  };

  const handleSuccess = () => {
    fetchClients();
  };

  const stats = {
    total: clients.length,
    thisMonth: clients.filter((c) => {
      const created = new Date(c.createdAt);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length,
    totalRevenue: clients.reduce((sum, c) => sum + Number(c.totalSpent), 0),
  };

  const statCards = [
    {
      name: "Total Clients",
      value: stats.total,
      icon: Users,
      iconBg: "bg-gradient-to-br from-emerald-500 to-green-600",
      glowColor: "shadow-emerald-500/20 hover:shadow-emerald-500/30",
      accentColor: "from-emerald-500/10 via-transparent to-transparent",
    },
    {
      name: "New This Month",
      value: stats.thisMonth,
      icon: UserPlus,
      iconBg: "bg-gradient-to-br from-teal-500 to-cyan-600",
      glowColor: "shadow-teal-500/20 hover:shadow-teal-500/30",
      accentColor: "from-teal-500/10 via-transparent to-transparent",
    },
    {
      name: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      iconBg: "bg-gradient-to-br from-violet-500 to-purple-600",
      glowColor: "shadow-violet-500/20 hover:shadow-violet-500/30",
      accentColor: "from-violet-500/10 via-transparent to-transparent",
    },
  ];

  return (
    <div className="space-y-5 max-w-[1400px]">

      {/* ═══════ GRADIENT BANNER ═══════ */}
      <div className="animate-in stagger-1 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#064e3b] via-[#065f46] to-[#047857] p-8 lg:p-10 shadow-2xl shadow-emerald-900/20 ring-1 ring-white/10">
        <div className="absolute inset-0 shimmer pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-emerald-400/15 blur-3xl animate-float" />
          <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-green-400/10 blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full bg-teal-400/10 blur-2xl animate-float-slow" />
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
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-emerald-200/60 text-xs font-semibold tracking-widest uppercase">People</p>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight text-glow leading-[1.1]">
              Clients
            </h1>
            <p className="text-emerald-100/50 mt-3 text-[15px] leading-relaxed max-w-lg">
              Manage your client database, track visits, and build lasting relationships.
            </p>
          </div>
          <Button
            onClick={() => setAddDialogOpen(true)}
            size="lg"
            className="glow-button bg-white text-emerald-700 hover:bg-white/95 font-bold shadow-2xl shadow-black/20 h-12 px-8 text-[15px] rounded-xl border-0 shrink-0"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Client
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

      {/* ═══════ SEARCH BAR ═══════ */}
      <div className="animate-in stagger-5 bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="h-[3px] bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500" />
        <div className="p-4 sm:p-5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              className="w-full pl-11 pr-4 py-2.5 text-sm bg-gray-50/80 border border-gray-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all font-medium placeholder:text-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ═══════ CLIENTS LIST ═══════ */}
      <div className="animate-in stagger-6">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500" />
          <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">
                {isLoading ? "Loading..." : `${filteredClients.length} ${filteredClients.length === 1 ? "Client" : "Clients"}`}
              </h3>
              <p className="text-sm text-gray-400 mt-0.5 font-medium">Your client directory</p>
            </div>
          </div>

          <div>
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-xl skeleton-shimmer" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 skeleton-shimmer w-1/3" />
                      <div className="h-3 skeleton-shimmer w-1/2" />
                    </div>
                    <div className="w-20 h-4 skeleton-shimmer" />
                  </div>
                ))}
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-16 px-4 m-6">
                <div className="inline-flex flex-col items-center border-2 border-dashed border-emerald-200/60 rounded-2xl px-12 py-10 bg-gradient-to-br from-emerald-50/30 to-slate-50/50">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center mb-5 ring-1 ring-emerald-200/50 shadow-lg shadow-emerald-500/10">
                    <Users className="w-10 h-10 text-emerald-500" />
                  </div>
                  <p className="text-gray-900 font-black text-lg tracking-tight">
                    {searchQuery ? "No clients found" : "No clients yet"}
                  </p>
                  <p className="text-sm text-gray-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
                    {searchQuery ? "Try a different search term" : "Add your first client to get started"}
                  </p>
                  {!searchQuery && (
                    <Button
                      onClick={() => setAddDialogOpen(true)}
                      className="mt-5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold shadow-lg shadow-emerald-600/20 h-10 px-6 text-sm"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Client
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100/60">
                {filteredClients.map((client, i) => {
                  const initials = `${client.firstName[0]}${client.lastName[0]}`;
                  const isVip = client.totalVisits >= 10;

                  return (
                    <motion.div
                      key={client.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.3 }}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors duration-150 group/row"
                    >
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md shadow-emerald-500/15 shrink-0 group-hover/row:scale-105 transition-transform">
                        <span className="text-[11px] font-bold text-white">{initials}</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-gray-900 text-sm truncate">
                            {client.firstName} {client.lastName}
                          </p>
                          {isVip && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 ring-1 ring-amber-200/50">
                              <Crown className="w-3 h-3" />
                              VIP
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {client.phone}
                          </span>
                          {client.email && (
                            <span className="flex items-center gap-1 hidden sm:flex">
                              <Mail className="w-3 h-3" />
                              <span className="truncate max-w-[180px]">{client.email}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="hidden md:flex items-center gap-6 text-sm shrink-0">
                        <div className="text-center">
                          <p className="font-bold text-gray-900 number-display">{client.totalVisits}</p>
                          <p className="text-[11px] text-gray-400 font-medium">Visits</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-emerald-600 number-display">{formatCurrency(Number(client.totalSpent))}</p>
                          <p className="text-[11px] text-gray-400 font-medium">Spent</p>
                        </div>
                        {client.lastVisitAt && (
                          <div className="text-center">
                            <p className="font-bold text-gray-900 text-xs">{formatDate(client.lastVisitAt)}</p>
                            <p className="text-[11px] text-gray-400 font-medium">Last Visit</p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => handleEdit(client)}
                          title="Edit"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(client)}
                          title="Delete"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <AddClientDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={handleSuccess}
      />

      {selectedClient && (
        <>
          <EditClientDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            client={selectedClient}
            onSuccess={handleSuccess}
          />
          <DeleteClientDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            client={selectedClient}
            onSuccess={handleSuccess}
          />
        </>
      )}
    </div>
  );
}
