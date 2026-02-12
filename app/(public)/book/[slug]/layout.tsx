// app/(public)/book/[slug]/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book an Appointment",
  description: "Book your next salon appointment online. Choose your services, pick a time, and confirm your booking in minutes.",
};

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
