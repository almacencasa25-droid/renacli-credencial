import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const matricula = String(body.matricula ?? "").trim()
    const clave = String(body.clave ?? "").trim()

    if (!matricula || !clave) {
      return NextResponse.json(
        {
          ok: false,
          mensaje: "Ingresá matrícula y clave.",
        },
        { status: 400 }
      )
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL

    const supabaseSecret =
      process.env.SUPABASE_SECRET_KEY

    if (!supabaseUrl || !supabaseSecret) {
      console.error(
        "Faltan variables de Supabase en renacli-credencial"
      )

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

    const { data, error } = await supabase.rpc(
      "verificar_acceso_app_tecnico",
      {
        p_numero_matricula: matricula,
        p_clave: clave,
      }
    )

    if (error) {
      console.error(
        "Error verificando acceso del técnico:",
        error
      )

      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "No se pudo verificar el acceso.",
        },
        { status: 500 }
      )
    }

    const resultado =
      Array.isArray(data) && data.length > 0
        ? data[0]
        : null

    if (
      !resultado ||
      resultado.acceso_valido !== true
    ) {
      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "Matrícula o clave incorrecta.",
        },
        { status: 401 }
      )
    }

    return NextResponse.json({
      ok: true,
      tecnico: {
        id: resultado.matriculado_id,
        matricula: resultado.numero_matricula,
        nombre: resultado.apellido_nombre,
      },
    })
  } catch (error) {
    console.error(
      "Error inesperado en login:",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        mensaje:
          "Ocurrió un error al iniciar sesión.",
      },
      { status: 500 }
    )
  }
}
