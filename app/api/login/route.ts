import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createHmac } from "crypto"

function crearFirma(
  matriculadoId: number,
  dispositivoId: string,
  secreto: string
) {
  return createHmac("sha256", secreto)
    .update(`${matriculadoId}:${dispositivoId}`)
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

    const dispositivoId = String(
      body.dispositivoId ?? ""
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

    if (
      !dispositivoId ||
      dispositivoId.length < 8
    ) {
      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "No se pudo identificar este dispositivo.",
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
     * Primero verificamos matrícula y clave.
     */
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

    const matriculadoId =
      Number(resultado.matriculado_id)

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
     * Ahora comprobamos el teléfono.
     *
     * Primer ingreso:
     * se vincula este dispositivo.
     *
     * Mismo teléfono:
     * permite continuar.
     *
     * Otro teléfono:
     * devuelve false.
     */
    const {
      data: dispositivoPermitido,
      error: errorDispositivo,
    } = await supabase.rpc(
      "vincular_dispositivo_app_tecnico",
      {
        p_matriculado_id:
          matriculadoId,

        p_dispositivo_id:
          dispositivoId,
      }
    )

    if (errorDispositivo) {
      console.error(
        "Error vinculando dispositivo:",
        errorDispositivo
      )

      return NextResponse.json(
        {
          ok: false,
          mensaje:
            "No se pudo verificar el dispositivo.",
        },
        { status: 500 }
      )
    }

    if (dispositivoPermitido !== true) {
      return NextResponse.json(
        {
          ok: false,
          codigo:
            "DISPOSITIVO_NO_AUTORIZADO",
          mensaje:
            "Esta credencial ya se encuentra vinculada a otro dispositivo. Para utilizarla en un nuevo teléfono deberá solicitar la desvinculación a RENACLI.",
        },
        { status: 403 }
      )
    }

    /*
     * Consultamos los datos de la credencial.
     */
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
        matriculadoId
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
     * Creamos una sesión firmada
     * vinculada también a este dispositivo.
     *
     * La contraseña NO se guarda.
     */
    const firma = crearFirma(
      matriculado.id,
      dispositivoId,
      supabaseSecret
    )

    const token =
      `${matriculado.id}.${dispositivoId}.${firma}`

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
