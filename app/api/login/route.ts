import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createHmac } from "crypto"

function crearFirma(
  matriculadoId: number,
  secreto: string
) {
  return createHmac("sha256", secreto)
    .update(String(matriculadoId))
    .digest("hex")
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const matricula = String(
      body.matricula ?? ""
    ).trim()

    const clave = String(
      body.clave ?? ""
    ).trim()

    if (!matricula || !clave) {
      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "Ingresá matrícula y clave.",
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

    const {
      data,
      error,
    } = await supabase.rpc(
      "verificar_acceso_app_tecnico",
      {
        p_numero_matricula: matricula,
        p_clave: clave,
      }
    )

    if (error) {
      console.error(
        "Error verificando acceso:",
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
      Array.isArray(data) &&
      data.length > 0
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

    const {
      data: matriculado,
      error: errorMatriculado,
    } = await supabase
      .from("matriculados")
      .select(`
        id,
        numero_matricula,
        apellido_nombre,
        localidad,
        provincia,
        especialidad,
        telefono,
        foto_url,
        fecha_emision,
        fecha_vencimiento,
        estado,
        acepta_reglamento,
        acepta_privacidad,
        autoriza_publicacion,
        fecha_aceptacion_terminos,
        version_reglamento,
        version_privacidad
      `)
      .eq(
        "id",
        resultado.matriculado_id
      )
      .single()

    if (
      errorMatriculado ||
      !matriculado
    ) {
      console.error(
        "Error leyendo datos del técnico:",
        errorMatriculado
      )

      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "No se pudo consultar el estado del técnico.",
        },
        { status: 500 }
      )
    }

    const {
      data: codigoData,
      error: errorCodigo,
    } = await supabase.rpc(
      "obtener_codigo_qr_actual",
      {
        p_matriculado_id:
          matriculado.id,
      }
    )

    if (errorCodigo) {
      console.error(
        "Error obteniendo QR:",
        errorCodigo
      )
    }

    const codigoVerificacion =
      Array.isArray(codigoData) &&
      codigoData.length > 0
        ? codigoData[0]
            .codigo_verificacion
        : null

    const urlVerificacion =
      codigoVerificacion
        ? `https://renacli-web.vercel.app/verificar/${codigoVerificacion}`
        : null

    const consentimientoAceptado =
      matriculado.acepta_reglamento ===
        true &&
      matriculado.acepta_privacidad ===
        true &&
      Boolean(
        matriculado
          .fecha_aceptacion_terminos
      ) &&
      Boolean(
        matriculado.version_reglamento
      ) &&
      Boolean(
        matriculado.version_privacidad
      )

    /*
     * Creamos una sesión persistente.
     * NO guardamos la contraseña.
     */
    const firma = crearFirma(
      matriculado.id,
      supabaseSecret
    )

    const token =
      `${matriculado.id}.${firma}`

    const respuesta =
      NextResponse.json({
        ok: true,

        tecnico: {
          id: matriculado.id,

          matricula:
            matriculado.numero_matricula,

          nombre:
            matriculado.apellido_nombre,

          foto:
            matriculado.foto_url,

          estado:
            matriculado.estado ||
            "vigente",

          especialidad:
            matriculado.especialidad,

          localidad:
            matriculado.localidad,

          provincia:
            matriculado.provincia,

          telefono:
            matriculado.telefono,

          fechaEmision:
            matriculado.fecha_emision,

          fechaVencimiento:
            matriculado.fecha_vencimiento,

          codigoVerificacion,

          urlVerificacion,
        },

        consentimiento: {
          aceptado:
            consentimientoAceptado,

          autoriza_publicacion:
            matriculado
              .autoriza_publicacion ===
            true,
        },
      })

    respuesta.cookies.set(
      "renacli_credencial_session",
      token,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "strict",
        path: "/",

        /*
         * La sesión puede permanecer
         * hasta un año.
         */
        maxAge:
          60 * 60 * 24 * 365,
      }
    )

    return respuesta
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
