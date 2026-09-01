import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const matriculadoId = Number(body.matriculadoId)
    const autorizaPublicacion =
      body.autorizaPublicacion === true

    if (
      !Number.isInteger(matriculadoId) ||
      matriculadoId <= 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          mensaje: "Técnico inválido.",
        },
        { status: 400 }
      )
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL

    const supabaseSecret =
      process.env.SUPABASE_SECRET_KEY

    if (!supabaseUrl || !supabaseSecret) {
      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "La aplicación no está configurada correctamente.",
        },
        { status: 500 }
      )
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseSecret,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )

    const { error } = await supabase.rpc(
      "registrar_consentimiento_tecnico",
      {
        p_matriculado_id: matriculadoId,
        p_acepta_reglamento: true,
        p_acepta_privacidad: true,
        p_autoriza_publicacion:
          autorizaPublicacion,
        p_version_reglamento: "1.0",
        p_version_privacidad: "1.0",
        p_dispositivo_id: null,
      }
    )

    if (error) {
      console.error(
        "Error registrando consentimiento:",
        error
      )

      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "No se pudo registrar la aceptación.",
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      mensaje:
        "Consentimiento registrado correctamente.",
    })
  } catch (error) {
    console.error(
      "Error inesperado registrando consentimiento:",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        mensaje:
          "Ocurrió un error al guardar la aceptación.",
      },
      { status: 500 }
    )
  }
}
