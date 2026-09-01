"use client"

import {
  FormEvent,
  UIEvent,
  useEffect,
  useState,
} from "react"

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

const textoReglamento = `
REGLAMENTO GENERAL RENACLI — Versión 1.0

1. OBJETO
RENACLI es un sistema privado de evaluación, acreditación,
registro y verificación de técnicos vinculados con la
climatización y la refrigeración.

La matrícula RENACLI no sustituye habilitaciones, licencias,
matrículas o registros exigidos por autoridades competentes
cuando correspondan.

2. REQUISITOS
Para incorporarse al registro, el postulante deberá cumplir
los requisitos establecidos por RENACLI, presentar la
documentación requerida y aprobar las instancias de
evaluación que correspondan.

3. EVALUACIÓN
La acreditación podrá comprender evaluación teórica,
práctica, documental o una combinación de ellas.

4. EMISIÓN DE MATRÍCULA
Una vez cumplidos los requisitos, RENACLI podrá asignar un
número de matrícula individual y verificable.

5. VIGENCIA
La matrícula tendrá la vigencia determinada por RENACLI y
deberá renovarse conforme las condiciones informadas.

6. OBLIGACIONES DEL MATRICULADO
El técnico deberá actuar de manera responsable, mantener sus
datos actualizados y respetar las buenas prácticas propias de
su actividad.

7. RECLAMOS
RENACLI podrá recibir reclamos relacionados con trabajos o
conductas de técnicos registrados.

La sola presentación de un reclamo no implica culpabilidad
ni suspensión automática.

8. DERECHO A DESCARGO
El matriculado tendrá derecho a conocer los hechos que se le
atribuyan y realizar su correspondiente descargo.

9. ADVERTENCIAS
RENACLI podrá emitir advertencias cuando corresponda,
teniendo en cuenta la naturaleza y gravedad de cada caso.

10. SUSPENSIÓN
La matrícula podrá ser suspendida cuando existan causas
debidamente evaluadas que justifiquen esa medida.

11. SUSPENSIÓN PREVENTIVA
Ante situaciones objetivamente graves relacionadas con
riesgo, fraude, suplantación de identidad o uso indebido de
la matrícula, podrá disponerse una suspensión preventiva
mientras se analiza el caso.

12. REHABILITACIÓN
Cuando desaparezcan las causas que originaron la suspensión,
RENACLI podrá rehabilitar la matrícula.

13. BAJA DEFINITIVA
Podrá disponerse la baja cuando corresponda conforme al
reglamento, respetando el procedimiento aplicable.

14. EFECTOS DE LA BAJA
Una matrícula dada de baja dejará de figurar como vigente y
no podrá presentarse como activa.

15. RENOVACIÓN
La renovación podrá requerir actualización de documentación,
datos, acreditaciones o cualquier requisito vigente.

16. PROTECCIÓN DE DATOS
RENACLI tratará los datos personales conforme su Política de
Privacidad y la normativa aplicable.

17. QR Y CONSULTA PÚBLICA
La credencial podrá incorporar mecanismos de verificación
digital, códigos QR y otros elementos destinados a
comprobar autenticidad y vigencia.

18. PROHIBICIÓN DE CESIÓN
La matrícula, credencial, clave y demás mecanismos de acceso
son personales e intransferibles.

19. USO DEL NOMBRE RENACLI
La inscripción no autoriza a presentar a RENACLI como
organismo estatal, autoridad pública ni entidad oficial del
Estado.

20. MODIFICACIONES
RENACLI podrá actualizar este reglamento. Cuando una nueva
versión requiera nueva aceptación, el técnico deberá
aceptarla antes de continuar utilizando la credencial.

FIN DEL REGLAMENTO GENERAL — VERSIÓN 1.0
`

const textoPrivacidad = `
POLÍTICA DE PRIVACIDAD RENACLI — Versión 1.0

1. RESPONSABLE Y ALCANCE
RENACLI administra información vinculada con técnicos
registrados dentro de su sistema privado de evaluación,
acreditación y verificación.

2. DATOS QUE PUEDEN RECOPILARSE
Podrán tratarse datos identificatorios, datos de contacto,
fotografía, información profesional, documentación,
matrícula, especialidad, localidad, provincia, fechas de
emisión y vencimiento y datos necesarios para la gestión del
registro.

3. FINALIDADES DEL TRATAMIENTO
Los datos podrán utilizarse para gestionar la matrícula,
identificar al técnico, verificar vigencia, administrar
renovaciones, mantener la credencial digital y cumplir las
funciones propias del sistema RENACLI.

4. INFORMACIÓN DE CONSULTA PÚBLICA
Cuando corresponda y exista autorización aplicable, la
consulta pública podrá mostrar determinados datos destinados
a verificar la identidad y estado de la matrícula.

RENACLI no deberá publicar información privada que no resulte
necesaria para esa finalidad.

5. CONSENTIMIENTO
Cuando el tratamiento o publicación requiera consentimiento,
el técnico deberá prestarlo de manera expresa.

El sistema podrá registrar la fecha y versión del documento
aceptado como constancia de dicha decisión.

6. CONSERVACIÓN Y SEGURIDAD
RENACLI adoptará medidas razonables destinadas a proteger la
información y evitar accesos no autorizados.

7. ACCESO, ACTUALIZACIÓN, RECTIFICACIÓN Y SUPRESIÓN
El titular podrá solicitar, según corresponda, acceso,
actualización, rectificación o supresión de sus datos de
acuerdo con la normativa aplicable y las obligaciones de
conservación existentes.

8. SERVICIOS TECNOLÓGICOS
Para prestar sus servicios RENACLI podrá utilizar
proveedores tecnológicos necesarios para almacenamiento,
alojamiento, funcionamiento de la aplicación y protección
de la información.

9. CAMBIOS EN ESTA POLÍTICA
La Política de Privacidad podrá actualizarse.

Cuando una nueva versión requiera una nueva aceptación, el
técnico deberá revisarla y aceptarla antes de continuar
utilizando la credencial.

10. CONTACTO
Las consultas relacionadas con privacidad podrán realizarse
por los medios de contacto publicados por RENACLI.

FIN DE LA POLÍTICA DE PRIVACIDAD — VERSIÓN 1.0
`

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

  const [
    requiereConsentimiento,
    setRequiereConsentimiento,
  ] = useState(false)

  const [
    llegoFinalReglamento,
    setLlegoFinalReglamento,
  ] = useState(false)

  const [
    llegoFinalPrivacidad,
    setLlegoFinalPrivacidad,
  ] = useState(false)

  const [
    aceptaReglamento,
    setAceptaReglamento,
  ] = useState(false)

  const [
    aceptaPrivacidad,
    setAceptaPrivacidad,
  ] = useState(false)

  const [
    pasoPublicacion,
    setPasoPublicacion,
  ] = useState(false)

  useEffect(() => {
    if (
      requiereConsentimiento &&
      aceptaReglamento &&
      aceptaPrivacidad
    ) {
      const timer = window.setTimeout(() => {
        setPasoPublicacion(true)
      }, 500)

      return () => window.clearTimeout(timer)
    }
  }, [
    requiereConsentimiento,
    aceptaReglamento,
    aceptaPrivacidad,
  ])

  function detectarFinal(
    event: UIEvent<HTMLDivElement>,
    tipo: "reglamento" | "privacidad"
  ) {
    const elemento = event.currentTarget

    const llego =
      elemento.scrollTop +
        elemento.clientHeight >=
      elemento.scrollHeight - 8

    if (!llego) return

    if (tipo === "reglamento") {
      setLlegoFinalReglamento(true)
    } else {
      setLlegoFinalPrivacidad(true)
    }
  }

  async function enviarFormulario(
    event: FormEvent
  ) {
    event.preventDefault()

    setCargando(true)
    setMensaje("")
    setTipoMensaje("")

    try {
      const respuesta = await fetch(
        "/api/login",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            matricula,
            clave,
          }),
        }
      )

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
        resultado.consentimiento
          ?.aceptado !== true
      ) {
        setRequiereConsentimiento(true)
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

  if (
    requiereConsentimiento &&
    tecnico &&
    pasoPublicacion
  ) {
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
              "0 20px 60px rgba(15,23,42,0.12)",
          }}
        >
          <div
            style={{
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "36px",
              }}
            >
              ❄
            </div>

            <h1>RENACLI</h1>

            <p
              style={{
                color: "#64748b",
              }}
            >
              Autorización de publicación
            </p>
          </div>

          <div
            style={{
              marginTop: "22px",
              padding: "16px",
              borderRadius: "12px",
              background: "#eff6ff",
            }}
          >
            <strong>
              {tecnico.nombre}
            </strong>

            <div>
              Matrícula:{" "}
              {tecnico.matricula}
            </div>
          </div>

          <div
            style={{
              marginTop: "24px",
              padding: "18px",
              border:
                "1px solid #cbd5e1",
              borderRadius: "12px",
              lineHeight: 1.6,
            }}
          >
            <strong>
              Reglamento aceptado ✓
            </strong>

            <br />

            <strong>
              Política de Privacidad
              aceptada ✓
            </strong>
          </div>

          <h2
            style={{
              marginTop: "26px",
            }}
          >
            Publicación de datos
          </h2>

          <p
            style={{
              lineHeight: 1.6,
              color: "#475569",
            }}
          >
            En el siguiente paso vas a
            decidir expresamente si
            autorizás la publicación de
            los datos previstos para la
            verificación pública de tu
            matrícula.
          </p>

          <div
            style={{
              padding: "14px",
              marginTop: "18px",
              background: "#fffbeb",
              color: "#92400e",
              borderRadius: "10px",
            }}
          >
            Esta autorización será una
            decisión independiente de la
            aceptación del Reglamento y
            de la Política de Privacidad.
          </div>
        </section>
      </main>
    )
  }

  if (
    requiereConsentimiento &&
    tecnico
  ) {
    return (
      <main
        style={{
          minHeight: "100vh",
          padding: "20px",
          background: "#f4f7fb",
        }}
      >
        <section
          style={{
            width: "100%",
            maxWidth: "680px",
            margin: "20px auto",
            background: "white",
            borderRadius: "22px",
            padding: "26px",
            boxShadow:
              "0 20px 60px rgba(15,23,42,0.12)",
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                fontSize: "36px",
              }}
            >
              ❄
            </div>

            <h1
              style={{
                marginBottom: "4px",
              }}
            >
              RENACLI
            </h1>

            <span
              style={{
                color: "#64748b",
              }}
            >
              Primer ingreso
            </span>
          </div>

          <div
            style={{
              padding: "14px",
              background: "#eff6ff",
              borderRadius: "12px",
              marginBottom: "24px",
            }}
          >
            <strong>
              {tecnico.nombre}
            </strong>

            <div>
              Matrícula:{" "}
              {tecnico.matricula}
            </div>
          </div>

          <h2>
            Reglamento General
          </h2>

          <p
            style={{
              fontSize: "13px",
              color: "#64748b",
            }}
          >
            Deslizá hasta el final para
            habilitar la aceptación.
          </p>

          <div
            onScroll={(event) =>
              detectarFinal(
                event,
                "reglamento"
              )
            }
            style={{
              height: "220px",
              overflowY: "auto",
              whiteSpace: "pre-line",
              padding: "16px",
              border:
                "1px solid #cbd5e1",
              borderRadius: "12px",
              background: "#f8fafc",
              lineHeight: 1.55,
              fontSize: "14px",
            }}
          >
            {textoReglamento}
          </div>

          <label
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              marginTop: "12px",
              padding: "12px",
              borderRadius: "10px",
              background:
                llegoFinalReglamento
                  ? "#f0fdf4"
                  : "#f1f5f9",
              color:
                llegoFinalReglamento
                  ? "#166534"
                  : "#94a3b8",
              cursor:
                llegoFinalReglamento
                  ? "pointer"
                  : "not-allowed",
            }}
          >
            <input
              type="checkbox"
              disabled={
                !llegoFinalReglamento
              }
              checked={
                aceptaReglamento
              }
              onChange={(e) =>
                setAceptaReglamento(
                  e.target.checked
                )
              }
            />

            Acepto el Reglamento General
            RENACLI versión 1.0
          </label>

          <h2
            style={{
              marginTop: "30px",
            }}
          >
            Política de Privacidad
          </h2>

          <p
            style={{
              fontSize: "13px",
              color: "#64748b",
            }}
          >
            Deslizá hasta el final para
            habilitar la aceptación.
          </p>

          <div
            onScroll={(event) =>
              detectarFinal(
                event,
                "privacidad"
              )
            }
            style={{
              height: "220px",
              overflowY: "auto",
              whiteSpace: "pre-line",
              padding: "16px",
              border:
                "1px solid #cbd5e1",
              borderRadius: "12px",
              background: "#f8fafc",
              lineHeight: 1.55,
              fontSize: "14px",
            }}
          >
            {textoPrivacidad}
          </div>

          <label
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              marginTop: "12px",
              padding: "12px",
              borderRadius: "10px",
              background:
                llegoFinalPrivacidad
                  ? "#f0fdf4"
                  : "#f1f5f9",
              color:
                llegoFinalPrivacidad
                  ? "#166534"
                  : "#94a3b8",
              cursor:
                llegoFinalPrivacidad
                  ? "pointer"
                  : "not-allowed",
            }}
          >
            <input
              type="checkbox"
              disabled={
                !llegoFinalPrivacidad
              }
              checked={
                aceptaPrivacidad
              }
              onChange={(e) =>
                setAceptaPrivacidad(
                  e.target.checked
                )
              }
            />

            Acepto la Política de
            Privacidad RENACLI versión
            1.0
          </label>

          {aceptaReglamento &&
            aceptaPrivacidad && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "14px",
                  textAlign: "center",
                  borderRadius: "10px",
                  background: "#dcfce7",
                  color: "#166534",
                  fontWeight: "bold",
                }}
              >
                Documentos aceptados.
                Continuando...
              </div>
            )}
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
          "linear-gradient(180deg,#075985 0%,#0c4a6e 42%,#f4f7fb 42%)",
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
            "0 20px 60px rgba(15,23,42,0.18)",
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
              fontSize: "38px",
            }}
          >
            ❄
          </div>

          <h1>RENACLI</h1>

          <p
            style={{
              color: "#64748b",
            }}
          >
            Credencial Digital del
            Técnico RENACLI
          </p>
        </div>

        <form
          onSubmit={
            enviarFormulario
          }
        >
          <label>
            <strong>
              Número de matrícula
            </strong>
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
            style={{
              width: "100%",
              padding: "13px",
              margin:
                "7px 0 18px",
              border:
                "1px solid #cbd5e1",
              borderRadius: "10px",
            }}
          />

          <label>
            <strong>
              Clave de acceso
            </strong>
          </label>

          <input
            type="password"
            value={clave}
            onChange={(e) =>
              setClave(
                e.target.value
              )
            }
            required
            style={{
              width: "100%",
              padding: "13px",
              margin:
                "7px 0 20px",
              border:
                "1px solid #cbd5e1",
              borderRadius: "10px",
            }}
          />

          <button
            type="submit"
            disabled={cargando}
            style={{
              width: "100%",
              padding: "13px",
              border: 0,
              borderRadius: "10px",
              background: "#075985",
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
              padding: "12px",
              borderRadius: "10px",
              textAlign: "center",
              background:
                tipoMensaje === "ok"
                  ? "#dcfce7"
                  : "#fee2e2",
              color:
                tipoMensaje === "ok"
                  ? "#166534"
                  : "#991b1b",
            }}
          >
            {mensaje}
          </div>
        )}
      </section>
    </main>
  )
}
