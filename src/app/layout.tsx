import type { Metadata, Viewport } from "next";
import "./globals.css";
import { shop } from "@/config/shop";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: `${shop.name} — ${shop.tagline}`,
  description: shop.description,
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
