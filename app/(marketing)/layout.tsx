// app/(marketing)/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "SalonixPro — Professional Salon Management for the Caribbean",
  },
  description:
    "The all-in-one platform for Caribbean salons, barbershops, and nail studios. Appointments, clients, inventory, finances — everything in one place.",
  openGraph: {
    title: "SalonixPro — Professional Salon Management for the Caribbean",
    description:
      "The all-in-one platform for Caribbean salons, barbershops, and nail studios. Appointments, clients, inventory, finances — everything in one place.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "SalonixPro",
      url: "https://salonixpro.com",
      description:
        "Professional salon management platform for the Caribbean. Appointments, clients, inventory, and finances in one place.",
      logo: "https://salonixpro.com/favicon.svg",
    },
    {
      "@type": "SoftwareApplication",
      name: "SalonixPro",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: "https://salonixpro.com",
      description:
        "All-in-one salon management platform for appointments, clients, inventory, and finances.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free trial available",
      },
    },
  ],
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
