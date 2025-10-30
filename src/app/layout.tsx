import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AIUB Portal - American International University-Bangladesh",
    template: "%s | AIUB Portal"
  },
  description: "Official student portal for American International University-Bangladesh. Access your grades, course schedules, registration, and academic information securely.",
  keywords: [
    "AIUB",
    "American International University Bangladesh",
    "student portal",
    "grade report",
    "course schedule",
    "registration",
    "academic portal",
    "university portal",
    "student dashboard",
    "CSE courses",
    "Bangladesh university"
  ],
  authors: [{ name: "Md Rijoan Maruf", url: "https://rijoan.com" }],
  creator: "Md Rijoan Maruf",
  publisher: "Md Rijoan Maruf",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://aiub.rijoan.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://aiub.rijoan.com",
    title: "AIUB Portal - American International University-Bangladesh",
    description: "Official student portal for American International University-Bangladesh. Access your grades, course schedules, registration, and academic information securely.",
    siteName: "AIUB Portal",
    images: [
      {
        url: "/aiub-og-image.jpg",
        width: 1200,
        height: 630,
        alt: "AIUB Portal - American International University-Bangladesh",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AIUB Portal - American International University-Bangladesh",
    description: "Official student portal for American International University-Bangladesh. Access your grades, course schedules, registration, and academic information securely.",
    images: ["/aiub-og-image.jpg"],
    creator: "@aiub_portal",
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
  icons: {
    icon: [
      { url: "/aiub.svg", type: "image/svg+xml" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/aiub.svg",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#2563eb",
      },
    ],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AIUB Portal",
  },
  category: "education",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1f2937" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "AIUB Portal",
    "description": "Official student portal for American International University-Bangladesh. Access your grades, course schedules, registration, and academic information securely.",
    "url": "https://aiub.rijoan.com",
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "Web Browser",
    "softwareVersion": "1.0.0",
    "author": {
      "@type": "Person",
      "name": "Md Rijoan Maruf",
      "url": "https://rijoan.com",
      "sameAs": [
        "https://rijoan.com"
      ]
    },
    "publisher": {
      "@type": "Person",
      "name": "Md Rijoan Maruf",
      "url": "https://rijoan.com"
    },
    "provider": {
      "@type": "EducationalOrganization",
      "name": "American International University-Bangladesh",
      "alternateName": "AIUB",
      "url": "https://www.aiub.edu",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "Bangladesh",
        "addressLocality": "Dhaka"
      }
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "screenshot": [
      "https://aiub.rijoan.com/screenshot-mobile.png",
      "https://aiub.rijoan.com/screenshot-desktop.png"
    ]
  };

  return (
    <html lang="en" className="light" >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
