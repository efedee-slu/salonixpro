// app/(dashboard)/layout.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scissors,
  LayoutDashboard,
  Calendar,
  Users,
  Sparkles,
  UserCircle,
  ShoppingBag,
  Package,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  Moon,
  Sun,
  Loader2,
  Clock,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { NotificationBell } from "@/components/dashboard/notification-bell";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
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
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [trialInfo, setTrialInfo] = useState<{
    subscriptionStatus: string;
    daysRemaining: number | null;
  } | null>(null);

  // Fetch trial info
  useEffect(() => {
    if (session?.user?.businessId) {
      fetch("/api/business/trial")
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) {
            setTrialInfo(data);
          }
        })
        .catch(console.error);
    }
  }, [session?.user?.businessId]);

  // Redirect to login if not authenticated
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const user = session?.user;
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : "U";

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  // Trial banner component
  const TrialBanner = () => {
    if (!trialInfo || trialInfo.subscriptionStatus !== "TRIAL") return null;
    
    const days = trialInfo.daysRemaining || 0;
    const isUrgent = days <= 3;
    
    return (
      <div className={cn(
        "px-4 py-2 text-center text-sm font-medium",
        isUrgent 
          ? "bg-gradient-to-r from-slate-700 to-slate-800 text-white" 
          : "bg-gradient-to-r from-teal-600 to-teal-700 text-white"
      )}>
        <div className="flex items-center justify-center gap-2">
          <Clock className="w-4 h-4" />
          <span>
            {days === 0 
              ? "Your trial ends today!" 
              : days === 1 
                ? "1 day left in your trial" 
                : `${days} days left in your free trial`}
          </span>
          <Link href="/settings?tab=billing">
            <Button 
              size="sm" 
              variant="secondary"
              className="h-7 text-xs ml-2 bg-white text-teal-700 hover:bg-white/90"
            >
              <Zap className="w-3 h-3 mr-1" />
              Upgrade Now
            </Button>
          </Link>
        </div>
      </div>
    );
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
                        isActive ? "bg-white/20 text-white hover:bg-white/30" : "bg-teal-100 text-teal-700"
                      )}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/50">
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                <span className="text-sm font-semibold text-teal-700">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate capitalize">{user?.role?.toLowerCase() || "Staff"}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="shrink-0"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-lg border-b">
          <div className="flex items-center justify-between h-full px-4 lg:px-8">
            {/* Left Side */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-accent"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              {/* Search */}
              <div className="hidden md:block relative w-64 lg:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients, appointments..."
                  className="pl-10 h-10 bg-accent/50 border-0"
                />
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <NotificationBell />

              {/* Theme Toggle */}
              <Button variant="ghost" size="icon">
                <Sun className="w-5 h-5 dark:hidden" />
                <Moon className="w-5 h-5 hidden dark:block" />
              </Button>

              {/* User Menu (Desktop) */}
              <div className="hidden md:flex items-center gap-3 pl-4 border-l ml-2">
                <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center">
                  <span className="text-sm font-semibold text-teal-700">{initials}</span>
                </div>
                <div className="hidden lg:block">
                  <p className="text-sm font-medium">{user?.name || "User"}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role?.toLowerCase() || "Staff"}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </header>

        {/* Trial Banner */}
        <TrialBanner />

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>

        {/* PWA Install Prompt */}
        <PWAInstallPrompt />
      </div>
    </div>
  );
}
