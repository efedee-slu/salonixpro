import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works | SalonixPro",
  description:
    "Learn how SalonixPro works — from signing up to managing your salon. Join the beta or start a free trial in minutes.",
};

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
