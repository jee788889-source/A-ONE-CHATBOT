import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BRANDING } from "@/lib/branding";

export const metadata: Metadata = {
  title: {
    default: "A-ONE Foods | AI Customer Assistant",
    template: "%s · A-ONE Foods AI Assistant",
  },
  description:
    "Discover A-ONE Foods products, get product information, and connect with the A-ONE Foods team through our AI assistant.",
  applicationName: "A-ONE Foods AI Assistant",
  authors: [{ name: "A-ONE Foods", url: "https://aonefoods.pk" }],
  keywords: [
    "A-ONE Foods",
    "A-ONE AI Assistant",
    "Pakistani snacks",
    "Nimko",
    "Spices",
    "Recipe Mixes",
    "Sindhi Biryani Masala",
    "Daal Moong",
    "Frozen Foods",
    "Distributor",
    "Faisalabad",
    "Lahore",
    "Karachi",
    "Halal Foods",
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "A-ONE Foods | AI Customer Assistant",
    description:
      "Discover A-ONE Foods products, get product information, and connect with the A-ONE Foods team through our AI assistant.",
    siteName: "A-ONE Foods",
    type: "website",
    locale: "en_PK",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#E05314",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('aone_theme') === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-dvh font-sans antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
