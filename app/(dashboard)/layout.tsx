// app/(dashboard)/layout.tsx
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-white/[0.06]">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:shadow-teal-500/30 transition-shadow">
                <Scissors className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg text-white tracking-tight">SalonixPro</span>
                <p className="text-[11px] text-white/40 font-medium">{user?.businessName || "Salon"}</p>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-5 mt-2">
            {navigationGroups.map((group) => {
              const userRole = user?.role || "ASSISTANT";
              const visibleItems = group.items.filter((item) =>
                hasMinRole(userRole, item.minRole)
              );
              if (visibleItems.length === 0) return null;
              return (
              <div key={group.label}>
                <p className="px-4 mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white/30">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.href ||
                      (item.href !== "/" && pathname.startsWith(item.href));

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "group/item flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-gradient-to-r from-teal-500/20 to-emerald-500/10 text-white shadow-sm"
                            : "text-white/50 hover:text-white/90 hover:bg-white/[0.06]"
                        )}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <item.icon className={cn(
                          "w-[18px] h-[18px] transition-colors duration-200",
                          isActive
                            ? "text-teal-400"
                            : "text-white/40 group-hover/item:text-white/70"
                        )} />
                        <span className="flex-1">{item.name}</span>
                        {isActive && (
                          <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                        )}
                        {item.badge && !isActive && (
                          <Badge
                            className="bg-white/[0.08] text-white/60 border-0 text-[10px] px-1.5 py-0 h-5"
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
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-white/80 backdrop-blur-xl border-b border-gray-100 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-gray-100 lg:hidden transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1 lg:flex-none" />

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-teal-500 rounded-full ring-2 ring-white" />
            </button>

            {/* User Menu - Desktop */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hidden lg:flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{user?.name || "User"}</p>
                    <p className="text-[11px] text-gray-400 font-medium">{user?.role || "Owner"}</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md shadow-teal-500/20">
                    {initials}
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end" className="w-56 mt-1 rounded-xl">
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-2 cursor-pointer rounded-lg">
                    <User className="w-4 h-4" />
                    <span>My Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-2 cursor-pointer rounded-lg">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8 min-h-[calc(100vh-4rem)] bg-slate-50">
          <Breadcrumbs />
          {children}
        </main>
      </div>
    </div>
  );
}
