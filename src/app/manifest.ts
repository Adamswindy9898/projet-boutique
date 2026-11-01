import type { MetadataRoute } from "next";
import { shop } from "@/config/shop";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "www.ousmatech.com",
    short_name: "OUSMATECH",
    description: shop.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f6f8fc",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
