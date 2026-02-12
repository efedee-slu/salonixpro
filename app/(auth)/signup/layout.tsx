// app/(auth)/signup/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Started",
  description: "Create your SalonixPro account and start managing your salon, barbershop, or nail studio today. Free trial included.",
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
