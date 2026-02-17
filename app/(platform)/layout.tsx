"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  FileCheck,
  Menu,
  X,
  Bell,
  LogOut,
  User,
  Search,
  Shield,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const platformNavGroups = [
  {
    label: "OVERVIEW",
    items: [
      { name: "Dashboard", href: "/platform", icon: LayoutDashboard },
    ],
  },
  {
    label: "MANAGEMENT",
    items: [
      { name: "Businesses", href: "/platform/businesses", icon: Building2 },
      { name: "Subscriptions", href: "/platform/subscriptions", icon: CreditCard },
      { name: "Beta Signups", href: "/platform/beta", icon: FileCheck },
    ],
  },
];

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;

  // Redirect non-super-admin (extra safety)
  if (session && user?.role !== "SUPER_ADMIN") {
    router.replace("/dashboard");
    return null;
  }

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : "SA";

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
          "fixed inset-y-0 left-0 z-50 w-[280px] bg-[#0f0a1e] text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-[72px] px-6">
            <Link href="/platform" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25 group-hover:shadow-violet-500/40 transition-all duration-300 group-hover:scale-105">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-black text-[17px] text-white tracking-tight">SalonixPro</span>
                <p className="text-[10px] text-white/30 font-semibold tracking-wide">Platform Admin</p>
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
            {platformNavGroups.map((group) => (
              <div key={group.label}>
                <p className="px-3 mb-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href ||
                      (item.href !== "/platform" && pathname.startsWith(item.href));

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "group/item flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 relative",
                          isActive
                            ? "bg-white/[0.08] text-white"
                            : "text-white/40 hover:text-white/80 hover:bg-white/[0.04]"
                        )}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                          isActive
                            ? "bg-gradient-to-br from-violet-500/30 to-indigo-500/20"
                            : "bg-white/[0.03] group-hover/item:bg-white/[0.06]"
                        )}>
                          <item.icon className={cn(
                            "w-[16px] h-[16px] transition-colors duration-200",
                            isActive
                              ? "text-violet-400"
                              : "text-white/30 group-hover/item:text-white/60"
                          )} />
                        </div>
                        <span className="flex-1">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Bottom User Area */}
          <div className="mx-5 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          <div className="p-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
              <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-md">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-white/80 truncate">{user?.name || "Super Admin"}</p>
                <p className="text-[10px] text-white/25 font-medium">Super Admin</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-[280px]">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl hover:bg-gray-100 lg:hidden transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>

            <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 border border-gray-200/80 w-72 text-sm text-gray-400 hover:border-gray-300 transition-colors cursor-pointer">
              <Search className="w-4 h-4" />
              <span>Search businesses...</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors group">
              <Bell className="w-[18px] h-[18px] text-gray-500 group-hover:text-gray-700 transition-colors" />
            </button>

            <div className="hidden lg:block w-px h-8 bg-gray-200 mx-1" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hidden lg:flex items-center gap-3 rounded-xl px-2.5 py-1.5 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 leading-tight">{user?.name || "Super Admin"}</p>
                    <p className="text-[10px] text-gray-400 font-medium">Platform Admin</p>
                  </div>
                  <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md shadow-violet-500/20">
                    {initials}
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end" className="w-56 mt-2 rounded-xl p-1.5">
                <DropdownMenuItem className="flex items-center gap-2.5 cursor-pointer rounded-lg px-3 py-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Profile</span>
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
        <main className="p-4 lg:p-8 min-h-[calc(100vh-4rem)] bg-slate-50/80">
          {children}
        </main>
      </div>
    </div>
  );
}
