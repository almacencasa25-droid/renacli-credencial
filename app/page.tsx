"use client"

import {
  FormEvent,
  UIEvent,
  useEffect,
  useState,
} from "react"

import QRCode from "qrcode"

type Tecnico = {
  id: number
  matricula: string
  nombre: string
  foto: string | null
  estado: string
  especialidad: string | null
  localidad: string | null
  provincia: string | null
  telefono: string | null
  fechaEmision: string | null
  fechaVencimiento: string | null
  codigoVerificacion: string | null
  urlVerificacion: string | null
}

type ResultadoLogin = {
  ok: boolean
  mensaje?: string
  sesion?: boolean

  tecnico?: Tecnico

  consentimiento?: {
    aceptado: boolean
    autoriza_publicacion: boolean
    requiereActualizacion?: boolean
    versionReglamentoActual?: string
    versionPrivacidadActual?: string
    versionReglamentoAceptada?: string | null
    versionPrivacidadAceptada?: string | null
  }
}

const textoReglamento = `
REGLAMENTO GENERAL RENACLI — Versión 1.1

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

13. BAJA Y BAJA DEFINITIVA
Podrá disponerse la baja cuando corresponda conforme al
reglamento, respetando el procedimiento aplicable.

Cuando la baja responda a una medida disciplinaria, deberá
respetarse el análisis del caso y el derecho a descargo que
corresponda.

La matrícula RNC asignada será única para su titular mientras
mantenga la continuidad de su registro y cumpla las
condiciones de renovación establecidas por RENACLI.

La falta de renovación durante cinco (5) años consecutivos,
contados desde la fecha de vencimiento de la última vigencia,
podrá producir la baja definitiva por falta de renovación.

Hasta que se cumpla dicho plazo de cinco (5) años
consecutivos, el número RNC permanecerá reservado para su
titular y no podrá ser asignado a otra persona.

Producida la baja definitiva por falta de renovación y
cumplido el plazo indicado, RENACLI podrá liberar el número
RNC para una futura reasignación a otro técnico.

14. EFECTOS DE LA BAJA
Una matrícula dada de baja dejará de figurar como vigente y
no podrá presentarse como activa.

La credencial dejará de acreditar al titular como matriculado
RENACLI vigente mientras se mantenga la baja.

La baja común no libera el número RNC asignado. El número
permanecerá reservado mientras no se cumplan cinco (5) años
consecutivos sin renovación desde la fecha de vencimiento de
la última vigencia.

Cuando corresponda una baja definitiva por falta de
renovación y el número sea liberado, RENACLI podrá
reasignarlo a un nuevo titular. La reasignación no implica
continuidad, identidad ni relación entre el nuevo titular y
cualquier titular anterior de ese número.

RENACLI podrá conservar internamente el historial
administrativo y de asignaciones anteriores conforme a las
reglas legales aplicables sobre conservación y protección de
datos, a fin de mantener la trazabilidad de cada período de
asignación.

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

FIN DEL REGLAMENTO GENERAL — VERSIÓN 1.1
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

function formatearFecha(fecha: string | null) {
  if (!fecha) return "No informada"

  const partes = fecha.split("-")

  if (partes.length < 3) {
    return fecha
  }

  const anio = partes[0]
  const mes = partes[1]
  const dia = partes[2].substring(0, 2)

  return `${dia}/${mes}/${anio}`
}


function obtenerEstadoYVencimiento(
  estadoOriginal: string,
  fechaVencimiento: string | null,
  ahora: Date
) {
  const estadoNormalizado = estadoOriginal
    .trim()
    .toLowerCase()

  let estadoEfectivo = estadoOriginal
  let avisoVencimiento = ""

  if (!fechaVencimiento) {
    return {
      estadoEfectivo,
      avisoVencimiento,
    }
  }

  const partes = fechaVencimiento
    .substring(0, 10)
    .split("-")

  if (partes.length !== 3) {
    return {
      estadoEfectivo,
      avisoVencimiento,
    }
  }

  const anio = Number(partes[0])
  const mes = Number(partes[1])
  const dia = Number(partes[2])

  if (
    !Number.isFinite(anio) ||
    !Number.isFinite(mes) ||
    !Number.isFinite(dia)
  ) {
    return {
      estadoEfectivo,
      avisoVencimiento,
    }
  }

  const hoyUTC = Date.UTC(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate()
  )

  const vencimientoUTC = Date.UTC(
    anio,
    mes - 1,
    dia
  )

  const diasRestantes = Math.ceil(
    (vencimientoUTC - hoyUTC) /
      (1000 * 60 * 60 * 24)
  )

  if (
    estadoNormalizado === "vigente" &&
    diasRestantes < 0
  ) {
    estadoEfectivo = "Vencida"
  }

  if (estadoNormalizado === "vigente") {
    if (
      diasRestantes >= 2 &&
      diasRestantes <= 20
    ) {
      avisoVencimiento =
        `Atención: tu matrícula vence en ${diasRestantes} días.`
    } else if (diasRestantes === 1) {
      avisoVencimiento =
        "Atención: tu matrícula vence mañana."
    } else if (diasRestantes === 0) {
      avisoVencimiento =
        "Atención: tu matrícula vence hoy."
    }
  }

  return {
    estadoEfectivo,
    avisoVencimiento,
  }
}

function colorEstado(estado: string) {
  const valor = estado.toLowerCase()

  if (valor === "vigente") {
    return {
      fondo: "#dcfce7",
      texto: "#166534",
    }
  }

  if (
    valor === "suspendida" ||
    valor === "suspendido"
  ) {
    return {
      fondo: "#fef3c7",
      texto: "#92400e",
    }
  }

  return {
    fondo: "#fee2e2",
    texto: "#991b1b",
  }
}

function crearDispositivoId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID()
  }

  return (
    "rnc-" +
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).substring(2) +
    "-" +
    Math.random().toString(36).substring(2)
  )
}

export default function HomePage() {
  const [matricula, setMatricula] = useState("")
  const [clave, setClave] = useState("")

  const [
    dispositivoId,
    setDispositivoId,
  ] = useState("")

  const [
    dispositivoListo,
    setDispositivoListo,
  ] = useState(false)

  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const [
    comprobandoSesion,
    setComprobandoSesion,
  ] = useState(true)

  const [mensaje, setMensaje] = useState("")
  const [tipoMensaje, setTipoMensaje] = useState<
    "ok" | "error" | ""
  >("")

  const [tecnico, setTecnico] =
    useState<Tecnico | null>(null)

  const [
    requiereConsentimiento,
    setRequiereConsentimiento,
  ] = useState(false)

  const [
    actualizandoReglamento,
    setActualizandoReglamento,
  ] = useState(false)

  const [
    autorizaPublicacionActual,
    setAutorizaPublicacionActual,
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
    consentimientoGuardado,
    setConsentimientoGuardado,
  ] = useState(false)

  const [qrImagen, setQrImagen] = useState("")

  const [ahora, setAhora] = useState(
    new Date()
  )

  /*
   * Creamos una identificación única
   * para esta instalación/navegador.
   *
   * Se guarda localmente y no contiene
   * la matrícula ni la contraseña.
   */
  useEffect(() => {
    try {
      const claveLocal =
        "renacli_dispositivo_id"

      const existente =
        localStorage.getItem(claveLocal)

      if (
        existente &&
        existente.trim().length >= 8
      ) {
        setDispositivoId(
          existente.trim()
        )

        setDispositivoListo(true)
        return
      }

      const nuevo =
        crearDispositivoId()

      localStorage.setItem(
        claveLocal,
        nuevo
      )

      setDispositivoId(nuevo)
      setDispositivoListo(true)
    } catch (error) {
      console.error(
        "Error creando identificador del dispositivo:",
        error
      )

      /*
       * Si localStorage fallara,
       * generamos igualmente uno
       * para evitar bloquear la pantalla.
       */
      const temporal =
        crearDispositivoId()

      setDispositivoId(temporal)
      setDispositivoListo(true)
    }
  }, [])

  /*
   * Al abrir la aplicación comprobamos
   * si este dispositivo ya tiene sesión.
   */
  useEffect(() => {
    if (
      !dispositivoListo ||
      !dispositivoId
    ) {
      return
    }

    async function comprobarSesion() {
      try {
        const respuesta = await fetch(
          "/api/sesion",
          {
            method: "GET",
            cache: "no-store",

            headers: {
              "x-renacli-device-id":
                dispositivoId,
            },
          }
        )

        const resultado: ResultadoLogin =
          await respuesta.json()

        if (
          respuesta.ok &&
          resultado.ok &&
          resultado.sesion === true &&
          resultado.tecnico &&
          resultado.consentimiento
        ) {
          setTecnico(resultado.tecnico)

          setAutorizaPublicacionActual(
            resultado.consentimiento
              .autoriza_publicacion === true
          )

          if (
            resultado.consentimiento
              .aceptado === true
          ) {
            setConsentimientoGuardado(true)
          } else {
            setActualizandoReglamento(true)
            setRequiereConsentimiento(true)
          }
        }
      } catch (error) {
        console.error(
          "No se pudo comprobar la sesión:",
          error
        )
      } finally {
        setComprobandoSesion(false)
      }
    }

    comprobarSesion()
  }, [
    dispositivoListo,
    dispositivoId,
  ])

  useEffect(() => {
    const timer = setInterval(() => {
      setAhora(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    async function generarQr() {
      if (
        !tecnico?.urlVerificacion ||
        !consentimientoGuardado
      ) {
        setQrImagen("")
        return
      }

      try {
        const imagen =
          await QRCode.toDataURL(
            tecnico.urlVerificacion,
            {
              width: 420,
              margin: 1,
              errorCorrectionLevel: "M",
            }
          )

        setQrImagen(imagen)
      } catch (error) {
        console.error(
          "Error generando QR:",
          error
        )

        setQrImagen("")
      }
    }

    generarQr()
  }, [
    tecnico?.urlVerificacion,
    consentimientoGuardado,
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

    if (!dispositivoId) {
      setTipoMensaje("error")

      setMensaje(
        "No se pudo identificar este dispositivo."
      )

      return
    }

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
            dispositivoId,
          }),
        }
      )

      const resultado: ResultadoLogin =
        await respuesta.json()

      if (
        !respuesta.ok ||
        !resultado.ok
      ) {
        setTipoMensaje("error")

        setMensaje(
          resultado.mensaje ??
            "No se pudo iniciar sesión."
        )

        return
      }

      if (!resultado.tecnico) {
        setTipoMensaje("error")

        setMensaje(
          "No se pudieron obtener los datos del técnico."
        )

        return
      }

      setTecnico(resultado.tecnico)

      if (
        resultado.consentimiento
          ?.aceptado !== true
      ) {
        setActualizandoReglamento(false)

        setAutorizaPublicacionActual(
          resultado.consentimiento
            ?.autoriza_publicacion === true
        )

        setRequiereConsentimiento(true)
        return
      }

      setConsentimientoGuardado(true)
    } catch {
      setTipoMensaje("error")

      setMensaje(
        "No se pudo conectar con RENACLI."
      )
    } finally {
      setCargando(false)
    }
  }

  async function aceptarYContinuar() {
    if (
      !tecnico ||
      !aceptaReglamento ||
      !aceptaPrivacidad
    ) {
      return
    }

    setGuardando(true)
    setMensaje("")
    setTipoMensaje("")

    try {
      const respuesta = await fetch(
        "/api/consentimiento",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "x-renacli-device-id":
              dispositivoId,
          },

          body: JSON.stringify({
            matricula,
            clave,
            dispositivoId,

            aceptaReglamento: true,
            aceptaPrivacidad: true,

            autorizaPublicacion:
              actualizandoReglamento
                ? autorizaPublicacionActual
                : true,
          }),
        }
      )

      const resultado =
        await respuesta.json()

      if (
        !respuesta.ok ||
        !resultado.ok
      ) {
        setMensaje(
          resultado.mensaje ??
            "No se pudo guardar la aceptación."
        )

        setTipoMensaje("error")
        return
      }

      setRequiereConsentimiento(false)
      setActualizandoReglamento(false)
      setConsentimientoGuardado(true)
      setClave("")
    } catch {
      setMensaje(
        "No se pudo guardar la aceptación."
      )

      setTipoMensaje("error")
    } finally {
      setGuardando(false)
    }
  }

  if (
    comprobandoSesion ||
    !dispositivoListo
  ) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
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
            padding: "38px 28px",
            textAlign: "center",
            boxShadow:
              "0 20px 60px rgba(15,23,42,0.18)",
          }}
        >
          <div
            style={{
              fontSize: "42px",
            }}
          >
            ❄
          </div>

          <h1
            style={{
              marginBottom: "8px",
            }}
          >
            RENACLI
          </h1>

          <p
            style={{
              color: "#64748b",
            }}
          >
            Verificando credencial...
          </p>
        </section>
      </main>
    )
  }

  if (
    consentimientoGuardado &&
    tecnico
  ) {
    const {
      estadoEfectivo,
      avisoVencimiento,
    } = obtenerEstadoYVencimiento(
      tecnico.estado,
      tecnico.fechaVencimiento,
      ahora
    )

    const colores =
      colorEstado(estadoEfectivo)

    const ubicacion =
      [
        tecnico.localidad,
        tecnico.provincia,
      ]
        .filter(Boolean)
        .join(", ") ||
      "No informada"

    const fechaHora =
      ahora.toLocaleString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })

    return (
      <main
        style={{
          minHeight: "100vh",
          padding: "18px",
          background:
            "linear-gradient(180deg,#075985 0%,#0c4a6e 34%,#eaf1f7 34%)",
        }}
      >
        <section
          style={{
            width: "100%",
            maxWidth: "480px",
            margin: "0 auto",
            overflow: "hidden",
            background: "white",
            borderRadius: "24px",
            boxShadow:
              "0 20px 60px rgba(15,23,42,0.22)",
          }}
        >
          <header
            style={{
              padding: "24px 22px",
              textAlign: "center",
              background: "#082f49",
              color: "white",
            }}
          >
            <div
              style={{
                fontSize: "34px",
                lineHeight: 1,
              }}
            >
              ❄
            </div>

            <h1
              style={{
                margin: "8px 0 2px 0",
                fontSize: "31px",
                letterSpacing: "1px",
              }}
            >
              RENACLI
            </h1>

            <div
              style={{
                fontSize: "11px",
                fontWeight: "bold",
                letterSpacing: "0.7px",
                opacity: 0.9,
              }}
            >
              REGISTRO NACIONAL DE
              CLIMATIZACIÓN Y REFRIGERACIÓN
            </div>

            <div
              style={{
                marginTop: "14px",
                fontSize: "13px",
                fontWeight: "bold",
              }}
            >
              CREDENCIAL DIGITAL
            </div>
          </header>

          <div
            style={{
              padding: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "18px",
              }}
            >
              {tecnico.foto ? (
                <img
                  src={tecnico.foto}
                  alt={`Foto de ${tecnico.nombre}`}
                  style={{
                    width: "135px",
                    height: "165px",
                    objectFit: "cover",
                    borderRadius: "18px",
                    border:
                      "4px solid #e2e8f0",
                    boxShadow:
                      "0 8px 20px rgba(15,23,42,0.12)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "135px",
                    height: "165px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      "center",
                    padding: "12px",
                    textAlign: "center",
                    color: "#64748b",
                    background: "#f8fafc",
                    border:
                      "2px dashed #cbd5e1",
                    borderRadius: "18px",
                  }}
                >
                  Foto no cargada
                </div>
              )}
            </div>

            <h2
              style={{
                margin: 0,
                textAlign: "center",
                fontSize: "24px",
                color: "#0f172a",
              }}
            >
              {tecnico.nombre}
            </h2>

            <div
              style={{
                marginTop: "10px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#64748b",
                  fontWeight: "bold",
                }}
              >
                MATRÍCULA
              </div>

              <div
                style={{
                  marginTop: "3px",
                  fontSize: "27px",
                  fontWeight: "900",
                  color: "#075985",
                  letterSpacing: "1px",
                }}
              >
                {tecnico.matricula}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "12px",
              }}
            >
              <div
                style={{
                  padding: "8px 18px",
                  borderRadius: "999px",
                  fontWeight: "bold",
                  fontSize: "14px",
                  background:
                    colores.fondo,
                  color: colores.texto,
                }}
              >
                ●{" "}
                {estadoEfectivo.toUpperCase()}
              </div>
            </div>

            {avisoVencimiento ? (
              <div
                style={{
                  marginTop: "16px",
                  padding: "14px 16px",
                  borderRadius: "14px",
                  background: "#fff7ed",
                  border: "1px solid #fdba74",
                  color: "#9a3412",
                  textAlign: "center",
                  fontSize: "14px",
                  fontWeight: "bold",
                  lineHeight: 1.45,
                }}
              >
                ⚠ {avisoVencimiento}
              </div>
            ) : null}

            <div
              style={{
                marginTop: "22px",
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: "12px",
              }}
            >
              <Dato
                titulo="Especialidad"
                valor={
                  tecnico.especialidad ||
                  "No informada"
                }
              />

              <Dato
                titulo="Ubicación"
                valor={ubicacion}
              />

              <Dato
                titulo="Emisión"
                valor={formatearFecha(
                  tecnico.fechaEmision
                )}
              />

              <Dato
                titulo="Vencimiento"
                valor={formatearFecha(
                  tecnico.fechaVencimiento
                )}
              />
            </div>

            <div
              style={{
                marginTop: "24px",
                padding: "18px",
                textAlign: "center",
                background: "#f8fafc",
                border:
                  "1px solid #e2e8f0",
                borderRadius: "18px",
              }}
            >
              {qrImagen ? (
                <img
                  src={qrImagen}
                  alt="Código QR de verificación"
                  style={{
                    width: "190px",
                    height: "190px",
                    display: "block",
                    margin: "0 auto",
                  }}
                />
              ) : (
                <div
                  style={{
                    height: "190px",
                    display: "flex",
                    justifyContent:
                      "center",
                    alignItems: "center",
                    color: "#64748b",
                  }}
                >
                  Generando QR...
                </div>
              )}

              <div
                style={{
                  marginTop: "8px",
                  fontSize: "12px",
                  color: "#475569",
                  fontWeight: "bold",
                }}
              >
                Escaneá para verificar esta
                matrícula
              </div>
            </div>

            <div
              style={{
                marginTop: "18px",
                padding: "14px",
                borderRadius: "14px",
                background: "#eff6ff",
                border:
                  "1px solid #bfdbfe",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "bold",
                  color: "#475569",
                }}
              >
                FECHA Y HORA DE VISUALIZACIÓN
              </div>

              <div
                style={{
                  marginTop: "4px",
                  fontWeight: "bold",
                  color: "#0f172a",
                }}
              >
                {fechaHora}
              </div>

              {tecnico.codigoVerificacion ? (
                <>
                  <div
                    style={{
                      marginTop: "12px",
                      fontSize: "11px",
                      fontWeight: "bold",
                      color: "#475569",
                    }}
                  >
                    CÓDIGO DE VERIFICACIÓN
                  </div>

                  <div
                    style={{
                      marginTop: "4px",
                      fontSize: "11px",
                      fontWeight: "bold",
                      color: "#075985",
                      wordBreak:
                        "break-all",
                    }}
                  >
                    {
                      tecnico.codigoVerificacion
                    }
                  </div>
                </>
              ) : null}
            </div>

            <div
              style={{
                marginTop: "18px",
                padding: "12px",
                textAlign: "center",
                background: "#f1f5f9",
                borderRadius: "12px",
                color: "#475569",
                fontSize: "11px",
                lineHeight: 1.5,
              }}
            >
              RENACLI es un sistema privado de
              evaluación, acreditación y
              registro. Esta matrícula no
              sustituye habilitaciones,
              licencias o registros exigidos
              por autoridades competentes
              cuando correspondan.
            </div>
          </div>
        </section>
      </main>
    )
  }

  if (
    requiereConsentimiento &&
    tecnico
  ) {
    const puedeContinuar =
      aceptaReglamento &&
      aceptaPrivacidad

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

            <h1>RENACLI</h1>

            <p
              style={{
                color: "#64748b",
              }}
            >
              {actualizandoReglamento
                ? "Actualización de Reglamento"
                : "Primer ingreso"}
            </p>
          </div>

          {actualizandoReglamento ? (
            <div
              style={{
                padding: "14px",
                background: "#fff7ed",
                border: "1px solid #fdba74",
                borderRadius: "12px",
                marginBottom: "18px",
                color: "#9a3412",
                fontSize: "14px",
                lineHeight: 1.55,
              }}
            >
              <strong>
                El Reglamento General RENACLI fue actualizado a la versión 1.1.
              </strong>

              <div
                style={{
                  marginTop: "6px",
                }}
              >
                Para continuar utilizando tu credencial digital,
                debés leer y aceptar la nueva versión. No es
                necesario volver a ingresar tu matrícula ni tu clave.
              </div>
            </div>
          ) : null}

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
            RENACLI versión 1.1
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
            Privacidad RENACLI versión 1.0
          </label>

          {puedeContinuar && (
            <div
              style={{
                marginTop: "24px",
              }}
            >
              <div
                style={{
                  padding: "14px",
                  marginBottom: "14px",
                  background: "#eff6ff",
                  borderRadius: "10px",
                  color: "#334155",
                  fontSize: "13px",
                  lineHeight: 1.55,
                }}
              >
                {actualizandoReglamento
                  ? "Al continuar, confirmás la aceptación del Reglamento General RENACLI versión 1.1 y de la Política de Privacidad versión 1.0. Se conservará tu elección anterior respecto de la autorización de publicación."
                  : "Al continuar, autorizás la publicación de los datos necesarios para la identificación y verificación pública de tu matrícula RENACLI, conforme la Política de Privacidad aceptada."}
              </div>

              <button
                type="button"
                onClick={
                  aceptarYContinuar
                }
                disabled={guardando}
                style={{
                  width: "100%",
                  padding: "15px",
                  border: 0,
                  borderRadius: "11px",
                  background: guardando
                    ? "#94a3b8"
                    : "#075985",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "16px",
                  cursor: guardando
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                {guardando
                  ? "Guardando aceptación..."
                  : "ACEPTO Y CONTINUAR"}
              </button>
            </div>
          )}

          {mensaje && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px",
                borderRadius: "10px",
                background: "#fee2e2",
                color: "#991b1b",
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              {mensaje}
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
            Credencial Digital del Técnico
            RENACLI
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
              margin: "7px 0 18px",
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
              margin: "7px 0 20px",
              border:
                "1px solid #cbd5e1",
              borderRadius: "10px",
            }}
          />

          <button
            type="submit"
            disabled={
              cargando ||
              !dispositivoListo
            }
            style={{
              width: "100%",
              padding: "13px",
              border: 0,
              borderRadius: "10px",
              background: "#075985",
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

function Dato({
  titulo,
  valor,
}: {
  titulo: string
  valor: string
}) {
  return (
    <div
      style={{
        padding: "12px",
        borderRadius: "12px",
        background: "#f8fafc",
        border:
          "1px solid #e2e8f0",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          color: "#64748b",
          fontWeight: "bold",
          textTransform: "uppercase",
        }}
      >
        {titulo}
      </div>

      <div
        style={{
          marginTop: "4px",
          color: "#0f172a",
          fontSize: "13px",
          fontWeight: "bold",
          wordBreak: "break-word",
        }}
      >
        {valor}
      </div>
    </div>
  )
}
