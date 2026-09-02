import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RENACLI Credencial Digital",
    short_name: "RENACLI",
    description:
      "Credencial Digital RENACLI para técnicos matriculados.",
    start_url: "/",
    display: "standalone",
    background_color: "#eef5fa",
    theme_color: "#0d4f7c",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  }
}
