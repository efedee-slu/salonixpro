// app/(dashboard)/layout.tsx
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Sparkles,
  UserCircle,
  ShoppingBag,
  Package,
  BarChart3,
  Settings,
  Menu,
  X,
  Scissors,
  Bell,
  LogOut,
  User,
  Wallet,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

// Role hierarchy levels for nav filtering
const ROLE_LEVELS: Record<string, number> = {
  OWNER: 4,
  MANAGER: 3,
  STYLIST: 2,
  ASSISTANT: 1,
};

function hasMinRole(userRole: string, minRole: string): boolean {
  return (ROLE_LEVELS[userRole] ?? 0) >= (ROLE_LEVELS[minRole] ?? 0);
}

const navigationGroups = [
  {
    label: "MAIN",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard, minRole: "ASSISTANT" },
      { name: "Appointments", href: "/appointments", icon: Calendar, badge: 3, minRole: "ASSISTANT" },
      { name: "Clients", href: "/clients", icon: Users, minRole: "ASSISTANT" },
      { name: "Services", href: "/services", icon: Sparkles, minRole: "ASSISTANT" },
      { name: "Stylists", href: "/stylists", icon: UserCircle, minRole: "MANAGER" },
    ],
  },
  {
    label: "SALES",
    items: [
      { name: "Shop", href: "/shop", icon: ShoppingBag, minRole: "MANAGER" },
      { name: "Orders", href: "/orders", icon: Package, badge: 5, minRole: "STYLIST" },
    ],
  },
  {
    label: "FINANCE",
    items: [
      { name: "Expenses", href: "/expenses", icon: Wallet, minRole: "MANAGER" },
      { name: "Payroll", href: "/payroll", icon: DollarSign, minRole: "OWNER" },
      { name: "P&L Report", href: "/profit-loss", icon: TrendingUp, minRole: "MANAGER" },
      { name: "Reports", href: "/reports", icon: BarChart3, minRole: "MANAGER" },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      { name: "Settings", href: "/settings", icon: Settings, minRole: "MANAGER" },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;

  // Get initials for avatar
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : "U";

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-teal-900 via-teal-950 to-slate-950 text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
                <Scissors className="w-5 h-5 text-teal-300" />
              </div>
              <div>
                <span className="font-bold text-lg text-white">SalonixPro</span>
                <p className="text-xs text-white/50">{user?.businessName || "Salon"}</p>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-4">
            {navigationGroups.map((group) => {
              const userRole = user?.role || "ASSISTANT";
              const visibleItems = group.items.filter((item) =>
                hasMinRole(userRole, item.minRole)
              );
              if (visibleItems.length === 0) return null;
              return (
              <div key={group.label}>
                <p className="px-4 mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.href ||
                      (item.href !== "/" && pathname.startsWith(item.href));

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-white/15 text-white"
                            : "text-white/60 hover:text-white hover:bg-white/10"
                        )}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <item.icon className={cn("w-5 h-5", isActive && "text-teal-300")} />
                        <span className="flex-1">{item.name}</span>
                        {item.badge && (
                          <Badge
                            variant={isActive ? "secondary" : "default"}
                            className={cn(
                              "ml-auto",
                              isActive ? "bg-teal-400/20 text-teal-200" : "bg-white/10 text-white/70"
                            )}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
              );
            })}
          </nav>

        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-background/95 backdrop-blur border-b lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-accent lg:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1 lg:flex-none" />

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-accent">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-teal-600 rounded-full" />
            </button>

            {/* User Menu - Desktop */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hidden lg:flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors cursor-pointer">
                  <div className="text-right">
                    <p className="text-sm font-medium">{user?.name || "User"}</p>
                    <p className="text-xs text-muted-foreground">{user?.role || "Owner"}</p>
                  </div>
                  <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {initials}
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end" className="w-56 mt-1">
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                    <User className="w-4 h-4" />
                    <span>My Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          <Breadcrumbs />
          {children}
        </main>
      </div>
    </div>
  );
}
