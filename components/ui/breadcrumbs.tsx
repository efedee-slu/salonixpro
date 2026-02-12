"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, ChevronRight } from "lucide-react";

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  appointments: "Appointments",
  clients: "Clients",
  services: "Services",
  stylists: "Stylists",
  shop: "Shop",
  orders: "Orders",
  reports: "Reports",
  settings: "Settings",
};

export function Breadcrumbs() {
  const pathname = usePathname();

  // Don't show on dashboard root
  if (pathname === "/" || pathname === "/dashboard") return null;

  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav className="flex items-center gap-2 mb-6">
      <Link href="/" className="breadcrumb flex items-center gap-1">
        <Home className="w-4 h-4" />
      </Link>
      {segments.map((segment, index) => {
        const href = "/" + segments.slice(0, index + 1).join("/");
        const isLast = index === segments.length - 1;
        const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

        return (
          <span key={segment} className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4 breadcrumb-separator" />
            {isLast ? (
              <span className="text-sm font-medium text-foreground">{label}</span>
            ) : (
              <Link href={href} className="breadcrumb">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
