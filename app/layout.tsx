// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "@/styles/globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import NextTopLoader from "nextjs-toploader";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://salonixpro.com"),
  title: {
    default:
      "SalonixPro — Professional Salon Management Software | Caribbean",
    template: "%s — SalonixPro",
  },
  description:
    "All-in-one salon management platform for Caribbean salons. Online booking, POS, inventory, staff scheduling, client portal & reports. Built for Saint Lucia and the Caribbean.",
  keywords: [
    "salon management software",
    "salon booking system",
    "Caribbean salon software",
    "Saint Lucia salon",
    "appointment scheduling",
    "salon POS",
    "salon inventory management",
    "beauty salon software",
  ],
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    apple: "/icons/icon-192x192.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SalonixPro",
  },
  applicationName: "SalonixPro",
  formatDetection: {
    telephone: false,
  },
  alternates: {
    canonical: "https://salonixpro.com",
  },
  openGraph: {
    type: "website",
    url: "https://salonixpro.com",
    title:
      "SalonixPro — Professional Salon Management Software | Caribbean",
    description:
      "All-in-one salon management platform for Caribbean salons. Online booking, POS, inventory, staff scheduling, client portal & reports. Built for Saint Lucia and the Caribbean.",
    siteName: "SalonixPro",
    locale: "en_US",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "SalonixPro — Professional Salon Management Software for the Caribbean",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "SalonixPro — Professional Salon Management Software | Caribbean",
    description:
      "All-in-one salon management platform for Caribbean salons. Online booking, POS, inventory, staff scheduling, client portal & reports. Built for Saint Lucia and the Caribbean.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#0D9488",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SalonixPro" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#0D9488" />
        <meta name="msapplication-tap-highlight" content="no" />
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  name: "SalonixPro",
                  url: "https://salonixpro.com",
                  logo: "https://salonixpro.com/icons/icon-512x512.svg",
                  description:
                    "Professional salon management software for Caribbean salons, barbershops, and nail studios.",
                  sameAs: [],
                },
                {
                  "@type": "SoftwareApplication",
                  name: "SalonixPro",
                  applicationCategory: "BusinessApplication",
                  operatingSystem: "Web",
                  description:
                    "All-in-one salon management platform for Caribbean salons. Online booking, POS, inventory, staff scheduling, client portal & reports.",
                  url: "https://salonixpro.com",
                  offers: {
                    "@type": "Offer",
                    price: "0",
                    priceCurrency: "USD",
                    description: "14-day free trial",
                  },
                  aggregateRating: {
                    "@type": "AggregateRating",
                    ratingValue: "5",
                    ratingCount: "1",
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body className={`${inter.variable} ${outfit.variable} font-sans`}>
        <NextTopLoader color="#0d9488" showSpinner={false} />
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </SessionProvider>
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
