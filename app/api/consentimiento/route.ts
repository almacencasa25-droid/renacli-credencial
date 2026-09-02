import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import {
  createHmac,
  timingSafeEqual,
} from "crypto"

const VERSION_REGLAMENTO = "1.1"
const VERSION_PRIVACIDAD = "1.0"

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
    .update(`${matriculadoId}:${dispositivoId}`)
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
      recibida.length !== correcta.length
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
      request.headers.get(
        "x-renacli-device-id"
      ) ??
        body.dispositivoId ??
        ""
    ).trim()

    const aceptaReglamento =
      body.aceptaReglamento === true

    const aceptaPrivacidad =
      body.aceptaPrivacidad === true

    const autorizaPublicacion =
      body.autorizaPublicacion === true

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

    let matriculadoId: number | null =
      null

    /*
     * CASO 1:
     * Primer ingreso.
     *
     * Si llegan matrícula y clave,
     * volvemos a comprobarlas.
     */
    if (matricula && clave) {
      const {
        data: accesoData,
        error: accesoError,
      } = await supabase.rpc(
        "verificar_acceso_app_tecnico",
        {
          p_numero_matricula:
            matricula,

          p_clave:
            clave,
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

      matriculadoId =
        Number(
          acceso.matriculado_id
        )
    } else {
      /*
       * CASO 2:
       * Técnico que ya tiene una
       * sesión válida en este teléfono.
       *
       * No volvemos a pedir la clave.
       */
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

      const cookieStore =
        await cookies()

      const token =
        cookieStore.get(
          "renacli_credencial_session"
        )?.value

      if (!token) {
        return NextResponse.json(
          {
            ok: false,
            mensaje:
              "La sesión ya no es válida. Ingresá nuevamente.",
          },
          { status: 401 }
        )
      }

      const partes =
        token.split(".")

      if (
        partes.length !== 2 &&
        partes.length !== 3
      ) {
        return NextResponse.json(
          {
            ok: false,
            mensaje:
              "La sesión no es válida. Ingresá nuevamente.",
          },
          { status: 401 }
        )
      }

      const idSesion =
        Number(partes[0])

      if (
        !Number.isInteger(
          idSesion
        ) ||
        idSesion <= 0
      ) {
        return NextResponse.json(
          {
            ok: false,
            mensaje:
              "La sesión no es válida. Ingresá nuevamente.",
          },
          { status: 401 }
        )
      }

      /*
       * Sesión antigua:
       * id.firma
       */
      if (partes.length === 2) {
        const firmaRecibida =
          partes[1]

        const firmaCorrecta =
          crearFirmaAntigua(
            idSesion,
            supabaseSecret
          )

        if (
          !compararFirmas(
            firmaRecibida,
            firmaCorrecta
          )
        ) {
          return NextResponse.json(
            {
              ok: false,
              mensaje:
                "La sesión no es válida. Ingresá nuevamente.",
            },
            { status: 401 }
          )
        }
      }

      /*
       * Sesión nueva:
       * id.dispositivo.firma
       */
      if (partes.length === 3) {
        const dispositivoGuardado =
          partes[1]

        const firmaRecibida =
          partes[2]

        if (
          dispositivoGuardado !==
          dispositivoId
        ) {
          return NextResponse.json(
            {
              ok: false,
              mensaje:
                "Esta sesión no pertenece a este dispositivo.",
            },
            { status: 403 }
          )
        }

        const firmaCorrecta =
          crearFirmaNueva(
            idSesion,
            dispositivoGuardado,
            supabaseSecret
          )

        if (
          !compararFirmas(
            firmaRecibida,
            firmaCorrecta
          )
        ) {
          return NextResponse.json(
            {
              ok: false,
              mensaje:
                "La sesión no es válida. Ingresá nuevamente.",
            },
            { status: 401 }
          )
        }
      }

      /*
       * Verificamos además que este
       * teléfono siga siendo el
       * dispositivo autorizado.
       */
      const {
        data: dispositivoPermitido,
        error: errorDispositivo,
      } = await supabase.rpc(
        "vincular_dispositivo_app_tecnico",
        {
          p_matriculado_id:
            idSesion,

          p_dispositivo_id:
            dispositivoId,
        }
      )

      if (errorDispositivo) {
        console.error(
          "Error verificando dispositivo para consentimiento:",
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

      if (
        dispositivoPermitido !== true
      ) {
        return NextResponse.json(
          {
            ok: false,
            mensaje:
              "Esta credencial está vinculada a otro dispositivo.",
          },
          { status: 403 }
        )
      }

      matriculadoId =
        idSesion
    }

    if (
      !matriculadoId ||
      !Number.isInteger(
        matriculadoId
      ) ||
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
     * Guardamos la nueva aceptación.
     *
     * El historial anterior se conserva
     * en historial_consentimientos.
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
          VERSION_REGLAMENTO,

        p_version_privacidad:
          VERSION_PRIVACIDAD,

        p_dispositivo_id:
          dispositivoId || null,
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
