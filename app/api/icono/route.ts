import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const respuesta = await fetch("https://www.renacli.com.ar/api/identidad/icono-credencial", { cache: "no-store", redirect: "follow" })
    if (!respuesta.ok) throw new Error("Icono no disponible")
    return new NextResponse(await respuesta.arrayBuffer(), {
      headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=300, must-revalidate", "X-Content-Type-Options": "nosniff" },
    })
  } catch {
    return NextResponse.redirect(new URL("/icon-512.png", request.url), 307)
  }
}
