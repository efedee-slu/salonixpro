// app/(dashboard)/layout.tsx
"use client";

import { useState, useEffect } from "react";
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
  ChevronRight,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Appointments", href: "/appointments", icon: Calendar, badge: 3 },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Services", href: "/services", icon: Sparkles },
  { name: "Stylists", href: "/stylists", icon: UserCircle },
  { name: "Shop", href: "/shop", icon: ShoppingBag },
  { name: "Orders", href: "/orders", icon: Package, badge: 5 },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
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
          "fixed inset-y-0 left-0 z-50 w-72 bg-card border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                <Scissors className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <span className="font-bold text-lg">SalonixPro</span>
                <p className="text-xs text-muted-foreground">{user?.businessName || "Salon"}</p>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-accent"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== "/" && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-teal-600 text-white shadow-lg shadow-teal-600/25"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <Badge 
                      variant={isActive ? "secondary" : "default"}
                      className={cn(
                        "ml-auto",
                        isActive ? "bg-white/20 text-white" : "bg-teal-100 text-teal-700"
                      )}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Section & Logout - Bottom of Sidebar */}
          <div className="p-4 border-t">
            {/* User Info */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-accent/50 mb-3">
              <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
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
            <div className="hidden lg:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground">{user?.role || "Owner"}</p>
              </div>
              <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
