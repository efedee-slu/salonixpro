// app/(public)/beta/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join the SalonixPro Beta — Free Salon Software Trial",
  description:
    "Sign up for the SalonixPro beta program. Get early access to the all-in-one salon management platform built for Caribbean salons, barbershops, and nail studios.",
  openGraph: {
    title: "Join the SalonixPro Beta — Free Salon Software Trial",
    description:
      "Sign up for the SalonixPro beta program. Get early access to the all-in-one salon management platform built for Caribbean salons.",
  },
};

export default function BetaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
