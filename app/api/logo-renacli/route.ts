import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const respuesta = await fetch("https://www.renacli.com.ar/api/identidad/logo", { cache: "no-store" })
    if (!respuesta.ok) return new NextResponse(null, { status: 502 })
    const imagen = await respuesta.arrayBuffer()
    return new NextResponse(imagen, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch {
    return new NextResponse(null, { status: 502 })
  }
}
