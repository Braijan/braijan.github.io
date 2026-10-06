import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { SITE } from "@/lib/site";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.name,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: SITE.name,
    description: SITE.description,
    url: SITE.url,
    locale: "en_US",
    images: [{ url: "/images/brian.jpg", width: 1077, height: 1077, alt: SITE.name }],
  },
  twitter: {
    card: "summary",
    title: SITE.name,
    description: SITE.description,
    images: ["/images/brian.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0b0d",
  width: "device-width",
  initialScale: 1,
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: SITE.name,
  url: SITE.url,
  image: `${SITE.url}/images/brian.jpg`,
  jobTitle: "Security Product Engineer",
  worksFor: { "@type": "Organization", name: "Enigma Networks" },
  founder: {
    "@type": "Organization",
    name: "The Smith Syndicate",
    url: SITE.syndicate,
  },
  alumniOf: { "@type": "CollegeOrUniversity", name: "Johnson & Wales University" },
  sameAs: [SITE.linkedin, SITE.github],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="bg-background">
      <body
        className={`${fraunces.variable} ${geist.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
        <div className="grain" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
