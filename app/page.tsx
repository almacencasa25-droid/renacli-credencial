"use client"

import { FormEvent, useState } from "react"

type ResultadoLogin = {
  ok: boolean
  mensaje?: string
  tecnico?: {
    id: number
    matricula: string
    nombre: string
  }
  consentimiento?: {
    aceptado: boolean
    autoriza_publicacion: boolean
  }
}

export default function HomePage() {
  const [matricula, setMatricula] = useState("")
  const [clave, setClave] = useState("")
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState("")
  const [tipoMensaje, setTipoMensaje] = useState<
    "ok" | "error" | ""
  >("")

  const [tecnico, setTecnico] =
    useState<ResultadoLogin["tecnico"]>()

  const [requiereConsentimiento, setRequiereConsentimiento] =
    useState(false)

  async function enviarFormulario(event: FormEvent) {
    event.preventDefault()

    setCargando(true)
    setMensaje("")
    setTipoMensaje("")

    try {
      const respuesta = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matricula,
          clave,
        }),
      })

      const resultado: ResultadoLogin =
        await respuesta.json()

      if (!respuesta.ok || !resultado.ok) {
        setTipoMensaje("error")
        setMensaje(
          resultado.mensaje ??
            "No se pudo iniciar sesión."
        )
        return
      }

      setTecnico(resultado.tecnico)

      if (
        resultado.consentimiento?.aceptado !== true
      ) {
        setRequiereConsentimiento(true)
        setMensaje("")
        return
      }

      setTipoMensaje("ok")
      setMensaje(
        `Acceso correcto. Bienvenido ${
          resultado.tecnico?.nombre ?? ""
        }`
      )
    } catch {
      setTipoMensaje("error")
      setMensaje(
        "No se pudo conectar con RENACLI."
      )
    } finally {
      setCargando(false)
    }
  }

  if (requiereConsentimiento && tecnico) {
    return (
      <main
        style={{
          minHeight: "100vh",
          padding: "24px",
          background: "#f4f7fb",
        }}
      >
        <section
          style={{
            width: "100%",
            maxWidth: "620px",
            margin: "30px auto",
            background: "white",
            borderRadius: "22px",
            padding: "28px",
            boxShadow:
              "0 20px 60px rgba(15, 23, 42, 0.12)",
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                margin: "0 auto 12px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#e0f2fe",
                fontSize: "32px",
              }}
            >
              ❄
            </div>

            <h1
              style={{
                margin: 0,
                color: "#0f172a",
              }}
            >
              RENACLI
            </h1>

            <p
              style={{
                margin: "6px 0 0",
                color: "#64748b",
              }}
            >
              Primer ingreso
            </p>
          </div>

          <div
            style={{
              padding: "14px",
              background: "#eff6ff",
              borderRadius: "12px",
              marginBottom: "22px",
            }}
          >
            <strong>{tecnico.nombre}</strong>

            <div
              style={{
                marginTop: "4px",
                color: "#475569",
                fontSize: "14px",
              }}
            >
              Matrícula: {tecnico.matricula}
            </div>
          </div>

          <h2
            style={{
              fontSize: "20px",
              marginBottom: "10px",
            }}
          >
            Aceptación obligatoria
          </h2>

          <p
            style={{
              color: "#475569",
              lineHeight: 1.6,
            }}
          >
            Antes de utilizar la Credencial Digital,
            tenés que leer y aceptar el Reglamento
            General de RENACLI y la Política de
            Privacidad.
          </p>

          <div
            style={{
              display: "grid",
              gap: "10px",
              marginTop: "20px",
            }}
          >
            <a
              href="https://renacli-web.vercel.app/reglamento"
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "13px",
                border: "1px solid #cbd5e1",
                borderRadius: "10px",
                textAlign: "center",
                fontWeight: "bold",
                color: "#075985",
              }}
            >
              Ver Reglamento General
            </a>

            <a
              href="https://renacli-web.vercel.app/privacidad"
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "13px",
                border: "1px solid #cbd5e1",
                borderRadius: "10px",
                textAlign: "center",
                fontWeight: "bold",
                color: "#075985",
              }}
            >
              Ver Política de Privacidad
            </a>
          </div>

          <div
            style={{
              marginTop: "24px",
              padding: "16px",
              background: "#fffbeb",
              borderRadius: "12px",
              color: "#92400e",
              fontSize: "14px",
              lineHeight: 1.5,
            }}
          >
            En el próximo paso vas a poder marcar
            personalmente las aceptaciones y la
            autorización de publicación de datos.
          </div>
        </section>
      </main>
    )
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background:
          "linear-gradient(180deg, #075985 0%, #0c4a6e 42%, #f4f7fb 42%)",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "white",
          borderRadius: "22px",
          padding: "28px",
          boxShadow:
            "0 20px 60px rgba(15, 23, 42, 0.18)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "26px",
          }}
        >
          <div
            style={{
              width: "68px",
              height: "68px",
              margin: "0 auto 14px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#e0f2fe",
              color: "#075985",
              fontSize: "34px",
            }}
          >
            ❄
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              color: "#0f172a",
            }}
          >
            RENACLI
          </h1>

          <p
            style={{
              margin: "6px 0 0",
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            Credencial Digital del Técnico RENACLI
          </p>
        </div>

        <form onSubmit={enviarFormulario}>
          <label
            style={{
              display: "block",
              marginBottom: "7px",
              fontSize: "13px",
              fontWeight: "bold",
            }}
          >
            Número de matrícula
          </label>

          <input
            value={matricula}
            onChange={(e) =>
              setMatricula(
                e.target.value.toUpperCase()
              )
            }
            placeholder="RNC-000000"
            required
            disabled={cargando}
            style={{
              width: "100%",
              padding: "13px 14px",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              marginBottom: "18px",
            }}
          />

          <label
            style={{
              display: "block",
              marginBottom: "7px",
              fontSize: "13px",
              fontWeight: "bold",
            }}
          >
            Clave de acceso
          </label>

          <input
            type="password"
            value={clave}
            onChange={(e) =>
              setClave(e.target.value)
            }
            placeholder="Ingresá tu clave"
            required
            disabled={cargando}
            style={{
              width: "100%",
              padding: "13px 14px",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              marginBottom: "20px",
            }}
          />

          <button
            type="submit"
            disabled={cargando}
            style={{
              width: "100%",
              border: 0,
              borderRadius: "10px",
              padding: "13px 16px",
              background: cargando
                ? "#94a3b8"
                : "#075985",
              color: "white",
              fontWeight: "bold",
            }}
          >
            {cargando
              ? "Verificando..."
              : "Ingresar"}
          </button>
        </form>

        {mensaje && (
          <div
            style={{
              marginTop: "18px",
              padding: "12px 14px",
              borderRadius: "10px",
              background:
                tipoMensaje === "ok"
                  ? "#dcfce7"
                  : "#fee2e2",
              color:
                tipoMensaje === "ok"
                  ? "#166534"
                  : "#991b1b",
              fontSize: "13px",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            {mensaje}
          </div>
        )}
      </section>
    </main>
  )
}
