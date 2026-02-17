// app/(dashboard)/layout.tsx
"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  Search,
  Calculator,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

type PermissionKey = string;

const navigationGroups = [
  {
    label: "MAIN",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard, permission: null as PermissionKey | null },
      { name: "Appointments", href: "/appointments", icon: Calendar, badge: 3, permission: null as PermissionKey | null },
      { name: "Clients", href: "/clients", icon: Users, permission: null as PermissionKey | null },
      { name: "Services", href: "/services", icon: Sparkles, permission: null as PermissionKey | null },
      { name: "Stylists", href: "/stylists", icon: UserCircle, permission: "manageTeam" as PermissionKey | null },
    ],
  },
  {
    label: "SALES",
    items: [
      { name: "Shop", href: "/shop", icon: ShoppingBag, permission: "viewShop" as PermissionKey | null },
      { name: "Orders", href: "/orders", icon: Package, badge: 5, permission: "viewOrders" as PermissionKey | null },
    ],
  },
  {
    label: "FINANCE",
    items: [
      { name: "Expenses", href: "/expenses", icon: Wallet, permission: "viewExpenses" as PermissionKey | null },
      { name: "Product Costing", href: "/product-costing", icon: Calculator, permission: "viewProductCosts" as PermissionKey | null },
      { name: "Payroll", href: "/payroll", icon: DollarSign, permission: "viewPayroll" as PermissionKey | null },
      { name: "P&L Report", href: "/profit-loss", icon: TrendingUp, permission: "viewProfitLoss" as PermissionKey | null },
      { name: "Reports", href: "/reports", icon: BarChart3, permission: "viewReports" as PermissionKey | null },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      { name: "Settings", href: "/settings", icon: Settings, permission: "manageSettings" as PermissionKey | null },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, boolean> | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;

  // Redirect SUPER_ADMIN to platform dashboard
  useEffect(() => {
    if (session?.user?.role === "SUPER_ADMIN") {
      router.replace("/platform");
    }
  }, [session, router]);

  // Fetch permissions for sidebar filtering
  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/me/permissions")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.permissions) setPermissions(data.permissions);
      })
      .catch(() => {});
  }, [session?.user]);

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
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[280px] bg-[#0c1222] text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-[72px] px-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/25 group-hover:shadow-teal-500/40 transition-all duration-300 group-hover:scale-105">
                <Scissors className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-black text-[17px] text-white tracking-tight">SalonixPro</span>
                <p className="text-[10px] text-white/30 font-semibold tracking-wide">{user?.businessName || "Salon Management"}</p>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Divider */}
          <div className="mx-5 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-6 mt-2 scrollbar-hide">
            {navigationGroups.map((group) => {
              const isOwner = user?.role === "OWNER";
              const visibleItems = group.items.filter((item) => {
                if (!item.permission) return true; // null = always visible
                if (isOwner) return true; // OWNER sees everything
                if (!permissions) return false; // still loading, hide restricted items
                return permissions[item.permission] === true;
              });
              if (visibleItems.length === 0) return null;
              return (
              <div key={group.label}>
                <p className="px-3 mb-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">
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
                          "group/item flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 relative",
                          isActive
                            ? "bg-white/[0.08] text-white sidebar-glow"
                            : "text-white/40 hover:text-white/80 hover:bg-white/[0.04]"
                        )}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                          isActive
                            ? "bg-gradient-to-br from-teal-500/30 to-emerald-500/20"
                            : "bg-white/[0.03] group-hover/item:bg-white/[0.06]"
                        )}>
                          <item.icon className={cn(
                            "w-[16px] h-[16px] transition-colors duration-200",
                            isActive
                              ? "text-teal-400"
                              : "text-white/30 group-hover/item:text-white/60"
                          )} />
                        </div>
                        <span className="flex-1">{item.name}</span>
                        {item.badge && (
                          <span className={cn(
                            "text-[10px] font-bold min-w-[20px] h-5 flex items-center justify-center rounded-md px-1.5",
                            isActive
                              ? "bg-teal-500/20 text-teal-300"
                              : "bg-white/[0.06] text-white/30 animate-badge-pulse"
                          )}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
              );
            })}
          </nav>

          {/* Bottom User Area */}
          <div className="mx-5 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          <div className="p-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
              <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-md">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-white/80 truncate">{user?.name || "User"}</p>
                <p className="text-[10px] text-white/25 font-medium">{user?.role || "Owner"}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-[280px]">
        {/* Top Bar with animated gradient line */}
        <header className="gradient-bar sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl hover:bg-gray-100 lg:hidden transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>

            {/* Search (Desktop) */}
            <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 border border-gray-200/80 w-72 text-sm text-gray-400 hover:border-gray-300 transition-colors cursor-pointer">
              <Search className="w-4 h-4" />
              <span>Search...</span>
              <kbd className="ml-auto text-[10px] font-semibold bg-white border border-gray-200 rounded px-1.5 py-0.5 text-gray-400">⌘K</kbd>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors group">
              <Bell className="w-[18px] h-[18px] text-gray-500 group-hover:text-gray-700 transition-colors" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-teal-500 rounded-full ring-2 ring-white animate-pulse" />
            </button>

            {/* Divider */}
            <div className="hidden lg:block w-px h-8 bg-gray-200 mx-1" />

            {/* User Menu - Desktop */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hidden lg:flex items-center gap-3 rounded-xl px-2.5 py-1.5 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 leading-tight">{user?.name || "User"}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{user?.role || "Owner"}</p>
                  </div>
                  <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md shadow-teal-500/20">
                    {initials}
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end" className="w-56 mt-2 rounded-xl p-1.5">
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-2.5 cursor-pointer rounded-lg px-3 py-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">My Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-2.5 cursor-pointer rounded-lg px-3 py-2">
                    <Settings className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer rounded-lg px-3 py-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-medium">Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8 min-h-[calc(100vh-4rem)] bg-slate-50/80 dot-grid">
          <Breadcrumbs />
          {children}
        </main>
      </div>
    </div>
  );
}
