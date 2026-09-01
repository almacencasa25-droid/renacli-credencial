import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import {
  createHmac,
  timingSafeEqual,
} from "crypto"

function crearFirma(
  matriculadoId: number,
  secreto: string
) {
  return createHmac("sha256", secreto)
    .update(String(matriculadoId))
    .digest("hex")
}

function firmaValida(
  matriculadoId: number,
  firmaRecibida: string,
  secreto: string
) {
  const firmaCorrecta = crearFirma(
    matriculadoId,
    secreto
  )

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

export async function GET() {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL

    const supabaseSecret =
      process.env.SUPABASE_SECRET_KEY

    if (!supabaseUrl || !supabaseSecret) {
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

    if (partes.length !== 2) {
      return eliminarSesion()
    }

    const matriculadoId =
      Number(partes[0])

    const firma =
      partes[1]

    if (
      !Number.isInteger(
        matriculadoId
      ) ||
      matriculadoId <= 0
    ) {
      return eliminarSesion()
    }

    if (
      !firmaValida(
        matriculadoId,
        firma,
        supabaseSecret
      )
    ) {
      return eliminarSesion()
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
      Boolean(
        matriculado
          .version_reglamento
      ) &&
      Boolean(
        matriculado
          .version_privacidad
      )

    return NextResponse.json({
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

function eliminarSesion() {
  const respuesta =
    NextResponse.json({
      ok: true,
      sesion: false,
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
