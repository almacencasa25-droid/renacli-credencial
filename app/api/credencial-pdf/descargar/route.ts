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

    return (
      uno.length === dos.length &&
      timingSafeEqual(uno, dos)
    )
  } catch {
    return false
  }
}

async function autenticar(request: Request) {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL

  const secret =
    process.env.SUPABASE_SECRET_KEY

  if (!url || !secret) {
    return null
  }

  const dispositivoId = String(
    request.headers.get(
      "x-renacli-device-id",
    ) ?? "",
  ).trim()

  if (dispositivoId.length < 8) {
    return null
  }

  const cookieStore =
    await cookies()

  const token =
    cookieStore.get(
      "renacli_credencial_session",
    )?.value

  if (!token) {
    return null
  }

  const partes = token.split(".")

  if (partes.length !== 3) {
    return null
  }

  const matriculadoId =
    Number(partes[0])

  if (
    !Number.isInteger(matriculadoId) ||
    matriculadoId <= 0
  ) {
    return null
  }

  if (
    partes[1] !== dispositivoId
  ) {
    return null
  }

  const firma =
    crearFirma(
      matriculadoId,
      dispositivoId,
      secret,
    )

  if (
    !compararFirmas(
      partes[2],
      firma,
    )
  ) {
    return null
  }

  const supabase =
    createClient(
      url,
      secret,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    )

  const {
    data: permitido,
    error,
  } = await supabase.rpc(
    "vincular_dispositivo_app_tecnico",
    {
      p_matriculado_id:
        matriculadoId,
      p_dispositivo_id:
        dispositivoId,
    },
  )

  if (
    error ||
    permitido !== true
  ) {
    return null
  }

  return {
    matriculadoId,
    supabase,
  }
}

export async function GET(
  request: Request,
) {
  const sesion =
    await autenticar(request)

  if (!sesion) {
    return NextResponse.json(
      {
        ok: false,
        mensaje:
          "Sesión no autorizada.",
      },
      {
        status: 401,
      },
    )
  }

  const {
    data: solicitud,
    error,
  } = await sesion.supabase
    .from(
      "solicitudes_credencial_pdf",
    )
    .select(
      "estado, pdf_path, codigo_documento",
    )
    .eq(
      "matriculado_id",
      sesion.matriculadoId,
    )
    .maybeSingle()

  if (
    error ||
    !solicitud ||
    solicitud.estado !==
      "disponible" ||
    !solicitud.pdf_path
  ) {
    return NextResponse.json(
      {
        ok: false,
        mensaje:
          "No hay un PDF disponible para descargar.",
      },
      {
        status: 404,
      },
    )
  }

  const {
    data: archivo,
    error: errorDescarga,
  } =
    await sesion.supabase.storage
      .from(
        "credenciales-pdf",
      )
      .download(
        solicitud.pdf_path,
      )

  if (
    errorDescarga ||
    !archivo
  ) {
    console.error(
      "Error descargando PDF privado:",
      errorDescarga,
    )

    return NextResponse.json(
      {
        ok: false,
        mensaje:
          "No se pudo descargar el PDF.",
      },
      {
        status: 500,
      },
    )
  }

  const bytes =
    Buffer.from(
      await archivo.arrayBuffer(),
    )

  const ahora =
    new Date().toISOString()

  const {
    error: errorEntrega,
  } = await sesion.supabase
    .from(
      "solicitudes_credencial_pdf",
    )
    .update({
      estado: "entregada",
      entregado_en: ahora,
      updated_at: ahora,
    })
    .eq(
      "matriculado_id",
      sesion.matriculadoId,
    )
    .eq(
      "estado",
      "disponible",
    )

  if (errorEntrega) {
    return NextResponse.json(
      {
        ok: false,
        mensaje:
          "No se pudo registrar la entrega del PDF.",
      },
      {
        status: 500,
      },
    )
  }

  /*
    IMPORTANTE:
    El archivo NO se elimina del bucket.

    La solicitud queda marcada como
    "entregada", por lo que el técnico
    no podrá volver a descargarla desde
    el flujo normal.

    El PDF permanece guardado para que
    Administración pueda conservar y
    consultar el documento vigente.
  */

  const nombre =
    `Credencial-RENACLI-${
      solicitud.codigo_documento ||
      "tecnico"
    }.pdf`

  return new NextResponse(
    bytes,
    {
      status: 200,
      headers: {
        "Content-Type":
          "application/pdf",

        "Content-Disposition":
          `attachment; filename="${nombre}"`,

        "Cache-Control":
          "private, no-store, max-age=0",

        "X-RENACLI-Document-Code":
          solicitud.codigo_documento ||
          "",
      },
    },
  )
}
