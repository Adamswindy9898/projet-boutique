import type { Metadata, Viewport } from "next";
import "./globals.css";
import { shop } from "@/config/shop";
import { Providers } from "@/components/Providers";
import { InstallAppPrompt } from "@/components/InstallAppPrompt";

export const metadata: Metadata = {
  title: {
    default: "www.ousmatech.com — OUSMATECH",
    template: `%s | ${shop.name}`,
  },
  description: shop.description,
  applicationName: shop.name,
  manifest: "/manifest.webmanifest",
  icons: {
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: shop.name,
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Providers>
          {children}
          <InstallAppPrompt />
        </Providers>
      </body>
    </html>
  );
}
