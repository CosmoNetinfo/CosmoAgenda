import { MetadataRoute } from "next";
import { APP_CONFIG } from "@/config/app";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_CONFIG.name,
    short_name: APP_CONFIG.shortName,
    description: APP_CONFIG.description,
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: APP_CONFIG.theme.bgCream,
    theme_color: APP_CONFIG.theme.bgCream,
    categories: ["productivity", "utilities"],
    // Web Share Target (Requisito 3 - condivisione diretta da Android)
    share_target: {
      action: "/ideas",
      method: "GET",
      params: {
        title: "title",
        text: "text",
        url: "url",
      },
    } as any,
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
