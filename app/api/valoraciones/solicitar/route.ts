import { createHmac, timingSafeEqual } from "crypto"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function firmaValida(recibida: string, correcta: string) {
  try {
    const a = Buffer.from(recibida, "hex")
    const b = Buffer.from(correcta, "hex")
    return a.length === b.length && timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const secreto = process.env.SUPABASE_SECRET_KEY
    const dispositivoId = String(request.headers.get("x-renacli-device-id") ?? "").trim()
    if (!supabaseUrl || !secreto) return NextResponse.json({ ok: false, mensaje: "Configuración incompleta." }, { status: 500 })
    if (dispositivoId.length < 8) return NextResponse.json({ ok: false, mensaje: "No se pudo identificar el dispositivo." }, { status: 401 })

    const token = (await cookies()).get("renacli_credencial_session")?.value
    const partes = token?.split(".") ?? []
    if (partes.length !== 3) return NextResponse.json({ ok: false, mensaje: "La sesión venció. Volvé a ingresar." }, { status: 401 })

    const matriculadoId = Number(partes[0])
    const dispositivoGuardado = partes[1]
    const firmaCorrecta = createHmac("sha256", secreto).update(`${matriculadoId}:${dispositivoGuardado}`).digest("hex")
    if (!Number.isInteger(matriculadoId) || matriculadoId <= 0 || dispositivoGuardado !== dispositivoId || !firmaValida(partes[2], firmaCorrecta)) {
      return NextResponse.json({ ok: false, mensaje: "La sesión no es válida." }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, secreto, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data: permitido, error: errorDispositivo } = await supabase.rpc("vincular_dispositivo_app_tecnico", {
      p_matriculado_id: matriculadoId,
      p_dispositivo_id: dispositivoId,
    })
    if (errorDispositivo || permitido !== true) return NextResponse.json({ ok: false, mensaje: "Este dispositivo no está autorizado." }, { status: 403 })

    const { data, error } = await supabase.rpc("crear_solicitud_valoracion_trabajo", { p_matriculado_id: matriculadoId })
    if (error) {
      console.error("Error creando solicitud de valoración:", error)
      return NextResponse.json({ ok: false, mensaje: "No se pudo generar el QR." }, { status: 500 })
    }
    const solicitud = Array.isArray(data) ? data[0] : null
    if (!solicitud?.codigo) return NextResponse.json({ ok: false, mensaje: "No se pudo generar el QR." }, { status: 500 })

    const sitio = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.renacli.com.ar").replace(/\/$/, "")
    return NextResponse.json({
      ok: true,
      codigo: solicitud.codigo,
      venceEn: solicitud.vence_en,
      url: `${sitio}/valorar/${solicitud.codigo}`,
    })
  } catch (error) {
    console.error("Error solicitando valoración:", error)
    return NextResponse.json({ ok: false, mensaje: "No se pudo generar el QR." }, { status: 500 })
  }
}
