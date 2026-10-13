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
        src: "/api/icono",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/api/icono",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  }
}
