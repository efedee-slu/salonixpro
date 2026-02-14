// app/(public)/portal/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Portal",
  description:
    "View your appointments, order history, and manage your bookings through the SalonixPro client portal.",
  openGraph: {
    title: "Client Portal — SalonixPro",
    description:
      "View your appointments, order history, and manage your bookings through the SalonixPro client portal.",
  },
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
