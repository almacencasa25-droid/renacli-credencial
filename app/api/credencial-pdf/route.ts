import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { createHmac, timingSafeEqual } from "crypto"

function crearFirma(
  matriculadoId: number,
  dispositivoId: string,
  secreto: string,
) {
  return createHmac("sha256", secreto)
    .update(`${matriculadoId}:${dispositivoId}`)
    .digest("hex")
}

function compararFirmas(a: string, b: string) {
  try {
    const uno = Buffer.from(a, "hex")
    const dos = Buffer.from(b, "hex")
    return uno.length === dos.length && timingSafeEqual(uno, dos)
  } catch {
    return false
  }
}

async function autenticar(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secret = process.env.SUPABASE_SECRET_KEY
  if (!url || !secret) return null

  const dispositivoId = String(
    request.headers.get("x-renacli-device-id") ?? "",
  ).trim()
  if (dispositivoId.length < 8) return null

  const cookieStore = await cookies()
  const token = cookieStore.get("renacli_credencial_session")?.value
  if (!token) return null

  const partes = token.split(".")
  if (partes.length !== 3) return null

  const matriculadoId = Number(partes[0])
  if (!Number.isInteger(matriculadoId) || matriculadoId <= 0) return null
  if (partes[1] !== dispositivoId) return null

  const firma = crearFirma(matriculadoId, dispositivoId, secret)
  if (!compararFirmas(partes[2], firma)) return null

  const supabase = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: permitido, error } = await supabase.rpc(
    "vincular_dispositivo_app_tecnico",
    {
      p_matriculado_id: matriculadoId,
      p_dispositivo_id: dispositivoId,
    },
  )

  if (error || permitido !== true) return null
  return { matriculadoId, supabase }
}

export async function GET(request: Request) {
  const sesion = await autenticar(request)
  if (!sesion) {
    return NextResponse.json(
      { ok: false, mensaje: "Sesión no autorizada." },
      { status: 401 },
    )
  }

  const { data, error } = await sesion.supabase
    .from("solicitudes_credencial_pdf")
    .select("estado, categoria_tecnica, codigo_documento, solicitado_en, aprobado_en, entregado_en")
    .eq("matriculado_id", sesion.matriculadoId)
    .maybeSingle()

  if (error) {
    console.error("Error consultando solicitud PDF:", error)
    return NextResponse.json(
      { ok: false, mensaje: "No se pudo consultar la solicitud PDF." },
      { status: 500 },
    )
  }

  if (!data || data.estado === "entregada") {
    return NextResponse.json({ ok: true, estado: "sin_solicitud" })
  }

  return NextResponse.json({ ok: true, ...data })
}

export async function POST(request: Request) {
  const sesion = await autenticar(request)
  if (!sesion) {
    return NextResponse.json(
      { ok: false, mensaje: "Sesión no autorizada." },
      { status: 401 },
    )
  }

  const { data: matriculado, error: errorMatriculado } = await sesion.supabase
    .from("matriculados")
    .select("categoria_tecnica")
    .eq("id", sesion.matriculadoId)
    .single()

  if (errorMatriculado || !matriculado) {
    return NextResponse.json(
      { ok: false, mensaje: "No se pudo identificar la categoría del técnico." },
      { status: 500 },
    )
  }

  const { data: actual, error: errorActual } = await sesion.supabase
    .from("solicitudes_credencial_pdf")
    .select("estado")
    .eq("matriculado_id", sesion.matriculadoId)
    .maybeSingle()

  if (errorActual) {
    return NextResponse.json(
      { ok: false, mensaje: "No se pudo verificar la solicitud actual." },
      { status: 500 },
    )
  }

  if (actual && (actual.estado === "solicitada" || actual.estado === "disponible")) {
    return NextResponse.json({ ok: true, estado: actual.estado })
  }

  const ahora = new Date().toISOString()
  const { error } = await sesion.supabase
    .from("solicitudes_credencial_pdf")
    .upsert(
      {
        matriculado_id: sesion.matriculadoId,
        estado: "solicitada",
        categoria_tecnica: matriculado.categoria_tecnica || "base",
        pdf_path: null,
        codigo_documento: null,
        solicitado_en: ahora,
        aprobado_en: null,
        entregado_en: null,
        updated_at: ahora,
      },
      { onConflict: "matriculado_id" },
    )

  if (error) {
    console.error("Error creando solicitud PDF:", error)
    return NextResponse.json(
      { ok: false, mensaje: "No se pudo enviar la solicitud PDF." },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, estado: "solicitada" })
}
