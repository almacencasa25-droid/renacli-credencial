import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const matricula = String(body.matricula ?? "").trim()
    const clave = String(body.clave ?? "").trim()

    const aceptaReglamento =
      body.aceptaReglamento === true

    const aceptaPrivacidad =
      body.aceptaPrivacidad === true

    const autorizaPublicacion =
      body.autorizaPublicacion === true

    if (!matricula || !clave) {
      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "No se pudo validar la identidad del técnico.",
        },
        { status: 400 }
      )
    }

    if (
      !aceptaReglamento ||
      !aceptaPrivacidad
    ) {
      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "Debés aceptar el Reglamento y la Política de Privacidad.",
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

    /*
     * 1. Volvemos a comprobar
     *    matrícula y clave.
     */
    const {
      data: accesoData,
      error: accesoError,
    } = await supabase.rpc(
      "verificar_acceso_app_tecnico",
      {
        p_numero_matricula: matricula,
        p_clave: clave,
      }
    )

    if (accesoError) {
      console.error(
        "Error verificando acceso para consentimiento:",
        accesoError
      )

      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "No se pudo verificar la identidad del técnico.",
        },
        { status: 500 }
      )
    }

    const acceso =
      Array.isArray(accesoData) &&
      accesoData.length > 0
        ? accesoData[0]
        : null

    if (
      !acceso ||
      acceso.acceso_valido !== true ||
      !acceso.matriculado_id
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

    const matriculadoId =
      Number(acceso.matriculado_id)

    if (
      !Number.isInteger(matriculadoId) ||
      matriculadoId <= 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "No se pudo identificar al técnico.",
        },
        { status: 500 }
      )
    }

    /*
     * 2. Guardamos la aceptación.
     */
    const {
      error: consentimientoError,
    } = await supabase.rpc(
      "registrar_consentimiento_tecnico",
      {
        p_matriculado_id:
          matriculadoId,

        p_acepta_reglamento:
          aceptaReglamento,

        p_acepta_privacidad:
          aceptaPrivacidad,

        p_autoriza_publicacion:
          autorizaPublicacion,

        p_version_reglamento:
          "1.0",

        p_version_privacidad:
          "1.0",

        p_dispositivo_id:
          null,
      }
    )

    if (consentimientoError) {
      console.error(
        "Error registrando consentimiento:",
        consentimientoError
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
