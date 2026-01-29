import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import { QueryProvider } from "@/providers/query-provider";
import { siteConfig } from "@/data/content";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || siteConfig.url || "http://localhost:3000";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.name,
  url: siteUrl,
  email: siteConfig.email,
  telephone: siteConfig.phone,
  sameAs: Object.values(siteConfig.social),
  address: {
    "@type": "PostalAddress",
    streetAddress: siteConfig.address.street,
    addressLocality: siteConfig.address.city,
    addressRegion: siteConfig.address.state,
    postalCode: siteConfig.address.pincode,
    addressCountry: siteConfig.address.country,
  },
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Ashva Experts - Water Purifier Subscription | RO, UV, Copper Purifiers",
    template: "%s | Ashva Experts",
  },
  description:
    "India's #1 water purifier subscription service. Get RO, UV, Copper & Alkaline purifiers installed in 48 hours with free maintenance, filter replacement & 24/7 support. Starting ₹399/month. No upfront cost.",
  keywords: [
    "water purifier subscription",
    "RO water purifier",
    "water purifier on rent",
    "water purifier Bangalore",
    "water purifier Mumbai",
    "water purifier Hyderabad",
    "copper water purifier",
    "alkaline water purifier",
    "water purifier maintenance",
    "best water purifier India",
  ],
  authors: [{ name: "Ashva Experts" }],
  creator: "Ashva Experts",
  publisher: "Ashva Experts",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "Ashva Experts",
    title: "Ashva Experts - Water Purifier Subscription",
    description:
      "Premium water purifiers on subscription. Free installation, maintenance & filter replacement. Starting ₹399/month.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=1200&h=630&fit=crop",
        width: 1200,
        height: 630,
        alt: "Ashva Experts - Pure Water on Subscription",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ashva Experts - Water Purifier Subscription",
    description:
      "Premium water purifiers on subscription. Free installation, maintenance & filter replacement. Starting ₹399/month.",
    images: ["https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=1200&h=630&fit=crop"],
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
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#1E40AF" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="font-body antialiased bg-surface text-foreground">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
