"use client"

import { useEffect, useState } from "react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
}

export default function InstalarPage() {
  const [eventoInstalacion, setEventoInstalacion] =
    useState<BeforeInstallPromptEvent | null>(null)

  const [esIphone, setEsIphone] =
    useState(false)

  const [instalada, setInstalada] =
    useState(false)

  useEffect(() => {
    const userAgent =
      window.navigator.userAgent.toLowerCase()

    const iphone =
      /iphone|ipad|ipod/.test(userAgent)

    setEsIphone(iphone)

    if (
      window.matchMedia(
        "(display-mode: standalone)"
      ).matches
    ) {
      setInstalada(true)
    }

    function guardarEvento(evento: Event) {
      evento.preventDefault()

      setEventoInstalacion(
        evento as BeforeInstallPromptEvent
      )
    }

    function appInstalada() {
      setInstalada(true)
      setEventoInstalacion(null)
    }

    window.addEventListener(
      "beforeinstallprompt",
      guardarEvento
    )

    window.addEventListener(
      "appinstalled",
      appInstalada
    )

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        guardarEvento
      )

      window.removeEventListener(
        "appinstalled",
        appInstalada
      )
    }
  }, [])

  async function instalarAndroid() {
    if (!eventoInstalacion) return

    await eventoInstalacion.prompt()

    const resultado =
      await eventoInstalacion.userChoice

    if (resultado.outcome === "accepted") {
      setEventoInstalacion(null)
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #075985 0%, #075985 42%, #eef5fa 42%, #eef5fa 100%)",
        padding: "40px 18px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "520px",
          margin: "0 auto",
          background: "white",
          borderRadius: "22px",
          padding: "28px",
          boxShadow:
            "0 18px 45px rgba(0,0,0,.16)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "42px",
            marginBottom: "8px",
          }}
        >
          ❄
        </div>

        <h1
          style={{
            margin: 0,
            color: "#0f172a",
            fontSize: "28px",
          }}
        >
          RENACLI
        </h1>

        <p
          style={{
            marginTop: "8px",
            color: "#64748b",
          }}
        >
          Credencial Digital
        </p>

        <hr
          style={{
            border: 0,
            borderTop:
              "1px solid #e2e8f0",
            margin: "24px 0",
          }}
        />

        {instalada ? (
          <>
            <h2
              style={{
                color: "#166534",
              }}
            >
              Aplicación instalada
            </h2>

            <p
              style={{
                color: "#475569",
                lineHeight: 1.6,
              }}
            >
              La Credencial Digital RENACLI
              ya está instalada en este
              dispositivo.
            </p>
          </>
        ) : esIphone ? (
          <>
            <h2
              style={{
                color: "#0f172a",
              }}
            >
              Instalar en iPhone
            </h2>

            <p
              style={{
                color: "#475569",
                lineHeight: 1.6,
              }}
            >
              En iPhone la instalación se
              realiza desde Safari.
            </p>

            <div
              style={{
                textAlign: "left",
                background: "#f8fafc",
                border:
                  "1px solid #e2e8f0",
                borderRadius: "14px",
                padding: "18px",
                marginTop: "18px",
                lineHeight: 1.7,
                color: "#334155",
              }}
            >
              <strong>1.</strong> Abrí esta
              página con Safari.
              <br />
              <strong>2.</strong> Tocá el botón
              Compartir.
              <br />
              <strong>3.</strong> Elegí{" "}
              <strong>
                “Agregar a pantalla de inicio”
              </strong>
              .
              <br />
              <strong>4.</strong> Confirmá con{" "}
              <strong>Agregar</strong>.
            </div>
          </>
        ) : (
          <>
            <h2
              style={{
                color: "#0f172a",
              }}
            >
              Instalar Credencial Digital
            </h2>

            <p
              style={{
                color: "#475569",
                lineHeight: 1.6,
              }}
            >
              Instalá RENACLI en tu teléfono
              para acceder rápidamente a tu
              credencial.
            </p>

            {eventoInstalacion ? (
              <button
                type="button"
                onClick={instalarAndroid}
                style={{
                  width: "100%",
                  marginTop: "18px",
                  padding: "15px",
                  border: 0,
                  borderRadius: "10px",
                  background: "#075985",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "16px",
                  cursor: "pointer",
                }}
              >
                INSTALAR EN ESTE TELÉFONO
              </button>
            ) : (
              <div
                style={{
                  marginTop: "18px",
                  padding: "16px",
                  borderRadius: "12px",
                  background: "#f8fafc",
                  border:
                    "1px solid #e2e8f0",
                  color: "#475569",
                  lineHeight: 1.6,
                  fontSize: "14px",
                }}
              >
                Si no aparece el botón de
                instalación, abrí el menú de
                Chrome y elegí{" "}
                <strong>
                  “Instalar aplicación”
                </strong>{" "}
                o{" "}
                <strong>
                  “Agregar a pantalla principal”
                </strong>
                .
              </div>
            )}
          </>
        )}

        <a
          href="/"
          style={{
            display: "inline-block",
            marginTop: "24px",
            color: "#075985",
            fontWeight: "bold",
            textDecoration: "none",
          }}
        >
          Abrir Credencial Digital
        </a>
      </div>
    </main>
  )
}
