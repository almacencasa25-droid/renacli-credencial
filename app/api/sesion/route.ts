import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import {
  createHmac,
  timingSafeEqual,
} from "crypto"

const VERSION_REGLAMENTO_ACTUAL = "1.1"
const VERSION_PRIVACIDAD_ACTUAL = "1.0"

function crearFirmaAntigua(
  matriculadoId: number,
  secreto: string
) {
  return createHmac("sha256", secreto)
    .update(String(matriculadoId))
    .digest("hex")
}

function crearFirmaNueva(
  matriculadoId: number,
  dispositivoId: string,
  secreto: string
) {
  return createHmac("sha256", secreto)
    .update(
      `${matriculadoId}:${dispositivoId}`
    )
    .digest("hex")
}

function compararFirmas(
  firmaRecibida: string,
  firmaCorrecta: string
) {
  try {
    const recibida = Buffer.from(
      firmaRecibida,
      "hex"
    )

    const correcta = Buffer.from(
      firmaCorrecta,
      "hex"
    )

    if (
      recibida.length !==
      correcta.length
    ) {
      return false
    }

    return timingSafeEqual(
      recibida,
      correcta
    )
  } catch {
    return false
  }
}

function eliminarSesion(
  mensaje?: string
) {
  const respuesta =
    NextResponse.json({
      ok: true,
      sesion: false,
      mensaje,
    })

  respuesta.cookies.set(
    "renacli_credencial_session",
    "",
    {
      httpOnly: true,

      secure:
        process.env.NODE_ENV ===
        "production",

      sameSite: "strict",

      path: "/",

      maxAge: 0,
    }
  )

  return respuesta
}

export async function GET(
  request: Request
) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL

    const supabaseSecret =
      process.env.SUPABASE_SECRET_KEY

    if (
      !supabaseUrl ||
      !supabaseSecret
    ) {
      return NextResponse.json(
        {
          ok: false,
          sesion: false,
          mensaje:
            "La aplicación no está configurada correctamente.",
        },
        { status: 500 }
      )
    }

    /*
     * El identificador lo envía la app
     * desde el navegador actual.
     */
    const dispositivoId =
      String(
        request.headers.get(
          "x-renacli-device-id"
        ) ?? ""
      ).trim()

    if (
      !dispositivoId ||
      dispositivoId.length < 8
    ) {
      return eliminarSesion(
        "No se pudo identificar este dispositivo."
      )
    }

    const cookieStore =
      await cookies()

    const token =
      cookieStore.get(
        "renacli_credencial_session"
      )?.value

    if (!token) {
      return NextResponse.json({
        ok: true,
        sesion: false,
      })
    }

    const partes =
      token.split(".")

    /*
     * Admitimos temporalmente dos
     * formatos:
     *
     * ANTIGUO:
     * id.firma
     *
     * NUEVO:
     * id.dispositivo.firma
     *
     * Así podemos migrar la sesión
     * que ya estaba abierta.
     */
    if (
      partes.length !== 2 &&
      partes.length !== 3
    ) {
      return eliminarSesion()
    }

    const matriculadoId =
      Number(partes[0])

    if (
      !Number.isInteger(
        matriculadoId
      ) ||
      matriculadoId <= 0
    ) {
      return eliminarSesion()
    }

    let necesitaMigracion =
      false

    /*
     * SESIÓN ANTIGUA
     */
    if (partes.length === 2) {
      const firmaRecibida =
        partes[1]

      const firmaCorrecta =
        crearFirmaAntigua(
          matriculadoId,
          supabaseSecret
        )

      if (
        !compararFirmas(
          firmaRecibida,
          firmaCorrecta
        )
      ) {
        return eliminarSesion()
      }

      necesitaMigracion = true
    }

    /*
     * SESIÓN NUEVA
     */
    if (partes.length === 3) {
      const dispositivoGuardado =
        partes[1]

      const firmaRecibida =
        partes[2]

      /*
       * La sesión pertenece a otro
       * dispositivo.
       */
      if (
        dispositivoGuardado !==
        dispositivoId
      ) {
        return eliminarSesion(
          "Esta sesión no pertenece a este dispositivo."
        )
      }

      const firmaCorrecta =
        crearFirmaNueva(
          matriculadoId,
          dispositivoGuardado,
          supabaseSecret
        )

      if (
        !compararFirmas(
          firmaRecibida,
          firmaCorrecta
        )
      ) {
        return eliminarSesion()
      }
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
     * Comprobamos siempre contra
     * Supabase que este sea el
     * teléfono vinculado.
     *
     * Si todavía no hay ninguno,
     * este queda vinculado.
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
        "Error verificando dispositivo de sesión:",
        errorDispositivo
      )

      return eliminarSesion(
        "No se pudo verificar el dispositivo."
      )
    }

    if (
      dispositivoPermitido !== true
    ) {
      return eliminarSesion(
        "Esta credencial está vinculada a otro dispositivo."
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
        fecha_ultima_acreditacion,
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
        "Error leyendo sesión del técnico:",
        errorMatriculado
      )

      return eliminarSesion()
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
      matriculado.version_reglamento ===
        VERSION_REGLAMENTO_ACTUAL &&
      matriculado.version_privacidad ===
        VERSION_PRIVACIDAD_ACTUAL

    const respuesta =
      NextResponse.json({
        ok: true,
        sesion: true,

        tecnico: {
          id:
            matriculado.id,

          matricula:
            matriculado
              .numero_matricula,

          nombre:
            matriculado
              .apellido_nombre,

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
            matriculado.fecha_ultima_acreditacion ||
            matriculado.fecha_emision,

          fechaVencimiento:
            matriculado.fecha_vencimiento,

          codigoVerificacion,

          urlVerificacion,
        },

        consentimiento: {
          aceptado:
            consentimientoAceptado,

          requiereActualizacion:
            !consentimientoAceptado,

          versionReglamentoActual:
            VERSION_REGLAMENTO_ACTUAL,

          versionPrivacidadActual:
            VERSION_PRIVACIDAD_ACTUAL,

          versionReglamentoAceptada:
            matriculado.version_reglamento,

          versionPrivacidadAceptada:
            matriculado.version_privacidad,

          autoriza_publicacion:
            matriculado
              .autoriza_publicacion ===
            true,
        },
      })

    /*
     * Si veníamos de la sesión antigua,
     * la reemplazamos automáticamente
     * por una sesión vinculada al
     * dispositivo actual.
     */
    if (necesitaMigracion) {
      const firmaNueva =
        crearFirmaNueva(
          matriculadoId,
          dispositivoId,
          supabaseSecret
        )

      const tokenNuevo =
        `${matriculadoId}.${dispositivoId}.${firmaNueva}`

      respuesta.cookies.set(
        "renacli_credencial_session",
        tokenNuevo,
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
    }

    return respuesta
  } catch (error) {
    console.error(
      "Error comprobando sesión:",
      error
    )

    return NextResponse.json(
      {
        ok: false,
        sesion: false,
        mensaje:
          "No se pudo comprobar la sesión.",
      },
      { status: 500 }
    )
  }
}
