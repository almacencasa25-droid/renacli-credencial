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
}

export default function HomePage() {
  const [matricula, setMatricula] = useState("")
  const [clave, setClave] = useState("")
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState("")
  const [tipoMensaje, setTipoMensaje] = useState<
    "ok" | "error" | ""
  >("")

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
            Credencial Digital del Técnico
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
            autoComplete="username"
            required
            disabled={cargando}
            style={{
              width: "100%",
              padding: "13px 14px",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              marginBottom: "18px",
              background: cargando
                ? "#f8fafc"
                : "white",
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
            autoComplete="current-password"
            required
            disabled={cargando}
            style={{
              width: "100%",
              padding: "13px 14px",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              marginBottom: "20px",
              background: cargando
                ? "#f8fafc"
                : "white",
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
              cursor: cargando
                ? "not-allowed"
                : "pointer",
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

        <p
          style={{
            margin: "18px 0 0",
            textAlign: "center",
            color: "#64748b",
            fontSize: "12px",
            lineHeight: 1.5,
          }}
        >
          Acceso exclusivo para técnicos con
          matrícula RENACLI y clave asignada por
          Administración.
        </p>
      </section>
    </main>
  )
}
