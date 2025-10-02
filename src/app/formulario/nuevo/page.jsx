"use client";
import { useState, useEffect } from "react";
import Navbar from "../../components/navbar";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import emailjs from "emailjs-com"
import { faUser, faCalendar, faBalanceScale, faClipboard, faBuilding, faExclamationTriangle, faClock, faPaperclip, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import { endFirstStepStartTwoStep, endTwoStepStartThreeStep, startThreeStep } from "@/app/services/camunda";

export default function NuevoFormulario() {
  const router = useRouter();

  function calcularRango(monto) {
    return monto > 1423000;
  }

  function rangoInputs(monto) {
    if (monto > 1423000) {
      return { esMayor: true, inputs: 4 };
    } else if (monto === 1423000) {
      return { esMayor: false, inputs: 2 };
    } else {
      return { esMayor: false, inputs: 0 };
    }
  }

  const handleClickOne = async () => {
    try {
      await endFirstStepStartTwoStep({
        bienvenida: "Inicio del segundo proceso"
      });

      nextStep();
    } catch (error) {
      console.error("Error al iniciar el proceso: ", error)
    }
  }

  const handleClickTwo = async () => {
    try {
      const monto = Number(filas[0].valor);
      const esMayor = calcularRango(monto);

      const siExiste = filas.some(f => f.siExiste);
      const purchaseTecnology = filas.some(f => f.purchaseTecnology)
      const sstAprobacion = filas.some(f => f.sstAprobacion)
      const vobo = filas.some(f => f.vobo)
      const purchaseAprobated = filas.some(f => f.purchaseAprobated)

      const purchaseAprobatedTecnology = purchaseTecnology && purchaseAprobated;
      const purchaseAprobatedErgonomic = siExiste && purchaseAprobated;

      await endTwoStepStartThreeStep({
        siExiste,
        purchaseTecnology,
        sstAprobacion,
        vobo,
        purchaseAprobated,
        esMayor,
        purchaseAprobatedTecnology,
        purchaseAprobatedErgonomic,
        filas,
      })

      nextStep();
    } catch (error) {
      console.error("Error al iniciar el proceso: ", error)
    }
  }

  const handleClickThree = async () => {
    try {
      const monto = Number(filas[0].valor);
      const esMayor = calcularRango(monto);

      const siExiste = filas.some(f => f.siExiste);
      const purchaseTecnology = filas.some(f => f.purchaseTecnology)
      const sstAprobacion = filas.some(f => f.sstAprobacion)
      const vobo = filas.some(f => f.vobo)
      const purchaseAprobated = filas.some(f => f.purchaseAprobated)
      const purchaseAprobatedTecnology = purchaseTecnology && purchaseAprobated;
      const purchaseAprobatedErgonomic = siExiste && purchaseAprobated;

      await startThreeStep({
        siExiste,
        purchaseTecnology,
        sstAprobacion,
        vobo,
        purchaseAprobated,
        purchaseAprobatedTecnology,
        purchaseAprobatedErgonomic,
        filas,
      })
    }
    catch (error) {
      console.error("Error al iniciar el proceso: ", error)
    }
  }

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    nombre: "",
    fechaSolicitud: "",
    fechaEntrega: "",
    justificacion: "",
    area: "",
    sede: "",
    urgenciaCompra: "",
    tiempoGestion: "",
    anexos: "",
    observacionesOne: "",
    observacionesTwo: "",
    observacionesThree: "",
    nombreSolicitante: "",
    firmaSolicitante: "",
    nombreAdministrativo: "",
    firmaAdministrativo: "",
    nombreGerente: "",
    firmaGerente: "",
    autorizacionGerencia: "",
    fechaCompras: "",
    horaCompras: "",
    consecutivoCompras: "",
    firmaCompras: "",
  });

  const [filas, setFilas] = useState([
    {
      descripcion: "",
      cantidad: "",
      centro: "",
      cuenta: "",
      purchaseAprobated: false,
      valor: "",
      vobo: false,
      siExiste: false,
      purchaseTecnology: false,
      sstAprobacion: false,
    }
  ]);

  const agregarFila = () => {
    setFilas([
      ...filas,
      {
        descripcion: "",
        cantidad: "",
        centro: "",
        cuenta: "",
        purchaseAprobated: false,
        valor: "",
        vobo: false,
        siExiste: false,
        purchaseTecnology: false,
        sstAprobacion: false,
      }
    ]);
  };

  const manejarCambio = (index, campo, valor) => {
    const nuevasFilas = [...filas];
    nuevasFilas[index][campo] = valor;
    setFilas(nuevasFilas);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const monto = Number(filas[0]?.valor || 0);
  const rango = rangoInputs(monto);


  const enviarFormulario = async () => {
    try {

      const res = await fetch("http://localhost:4000/formularios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form, filas }),
      });
      const data = await res.json();

      if (!data.success) {
        Swal.fire({
          icon: "error",
          title: "error",
          text: "Error al guardar",
        })
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Formulario guardado",
        text: `✅ ID: ${data.formularioId}`,
        confirmButtonColor: "#3085d6",
      });

      await emailjs.send(
        "service_k9jsfri",
        "template_9yq44n9",
        {
          to_email: "juancamiloblloroa@gmail.com",
          name: form.nombre,
          formularioId: data.formularioId,
          message: "Se ha creado un nuevo formulario en el sistema."
        },
        "_ga863Tjy13VI-b4G"
      );

      console.log("Correo enviado a juancamiloblloroa@gmail.com");

      router.push("/");

    } catch (error) {
      console.error(error);
      alert("Error en la conexión con el servidor o al enviar correo");
    }
  };

  useEffect(() => {
    const now = new Date();
    const fechaHoy = now.toISOString().split("T")[0]; // yyyy-mm-dd
    setForm(prev => ({ ...prev, fechaSolicitud: fechaHoy }));
  }, []); // <--- vacío

  return (
    <div>
      <Navbar />
      <div className="buttonBackDash">
        <button onClick={() => router.push('/')}>
          <FontAwesomeIcon icon={faArrowLeft} className="iconBack" />
          <p>Volver al inicio</p>
        </button>
      </div>
      <div className="containerNewformulario">
        <div className="headerNewformulario">
          <h1 className="tittleNewformulario">Crea una nueva requisición</h1>
          <p className="descriptionNewformulario">Paso {step} de 3</p>
        </div>
        <div className="contentNewformulario">
          {step == 1 && (
            <div className=" ">
              <h1 className="tittleContent">Datos generales del solicitante.</h1>
              <div className="inputsContainers">
                <div className="completeInputs">
                  <FontAwesomeIcon icon={faUser} className="icon" />
                  <input
                    type="text"
                    name="nombre"
                    placeholder="Nombre del Solicitante"
                    value={form.nombre}
                    onChange={handleChange}
                  />
                </div>
                <div className="completeInputs">
                  <FontAwesomeIcon icon={faCalendar} className="icon" />
                  <input
                    type="date"
                    name="fechaSolicitud"
                    placeholder="Fecha de la Solicitud"
                    value={form.fechaSolicitud}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="inputsContainers">
                <div className="completeInputs">
                  <FontAwesomeIcon icon={faCalendar} className="icon" />
                  <input
                    type="date"
                    name="fechaEntrega"
                    placeholder="Fecha requerido de entrega"
                    value={form.fechaEntrega}
                    onChange={handleChange}
                  />
                </div>
                <div className="completeInputs">
                  <FontAwesomeIcon icon={faBalanceScale} className="icon" />
                  <input
                    type="text"
                    name="justificacion"
                    placeholder="Justificacion"
                    value={form.justificacion}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="inputsContainers">
                <div className="completeInputs">
                  <FontAwesomeIcon icon={faClipboard} className="icon" />
                  <input
                    type="text"
                    name="area"
                    placeholder="Area del solicitante"
                    value={form.area}
                    onChange={handleChange}
                  />
                </div>
                <div className="completeInputs">
                  <FontAwesomeIcon icon={faBuilding} className="icon" />
                  <input
                    type="text"
                    name="sede"
                    placeholder="Sede"
                    value={form.sede}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="inputsContainers">
                <div className="completeInputs">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="icon" />
                  <input
                    type="text"
                    name="urgenciaCompra"
                    placeholder="Urgencia de la compra"
                    value={form.urgenciaCompra}
                    onChange={handleChange}
                  />
                </div>
                <div className="completeInputs">
                  <FontAwesomeIcon icon={faClock} className="icon" />
                  <input
                    type="text"
                    name="tiempoGestion"
                    placeholder="Tiempo aproximado de gestion."
                    value={form.tiempoGestion}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="inputsContainers">
                <div className="completeInputs">
                  <FontAwesomeIcon icon={faPaperclip} className="icon" />
                  <input
                    type="text"
                    name="anexos"
                    placeholder="Anexos"
                    value={form.anexos}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="spaceButtons">
                <button
                  onClick={handleClickOne}
                  className="navegationButton"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}

          {step == 2 && (
            <div>
              <div className="tableContainer">
                <h1 className="tittleTable">DESCRIPCION DEL ELEMENTO</h1>
                <div className="tabla-container">
                  <table className="tabla">
                    <thead>
                      <tr className="tabla-encabezado-principal">
                        <th>ITEM</th>
                        <th>DESCRIPCIÓN</th>
                        <th>CANTIDAD</th>
                        <th>CENTRO DE COSTO U ORDEN INTERNA</th>
                        <th>CUENTA CONTABLE O CÓDIGO DE MATERIAL</th>
                        <th>¿EXISTEN ERGONOMICOS?</th>
                        <th>¿COMPRA TECNOLOGICA?</th>
                        <th colSpan={2}>¿ESTÁ EN PRESUPUESTO?</th>
                        <th>VALOR (*)</th>
                        <th>VOBO GERENTE DE TECNOLOGÍA</th>
                        {filas.some(f => f.siExiste) && (
                          <th colSpan={2}>¿REQUIERE APROBACION DE SST?</th>
                        )}
                      </tr>
                    </thead>

                    <tbody>
                      {filas.map((fila, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>
                            <input
                              className="input-texto"
                              type="text"
                              value={fila.descripcion}
                              onChange={(e) => manejarCambio(index, "descripcion", e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              className="input-numero"
                              type="number"
                              min="0"
                              value={fila.cantidad}
                              onChange={(e) => manejarCambio(index, "cantidad", e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              className="input-texto"
                              type="text"
                              value={fila.centro}
                              onChange={(e) => manejarCambio(index, "centro", e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              className="input-texto"
                              type="text"
                              value={fila.cuenta}
                              onChange={(e) => manejarCambio(index, "cuenta", e.target.value)}
                            />
                          </td>
                          <td className="text-center">
                            <input
                              type="checkbox"
                              checked={fila.siExiste || false}
                              onChange={(e) =>
                                manejarCambio(index, "siExiste", e.target.checked)
                              }
                            />
                          </td>
                          <td className="text-center">
                            <input
                              type="checkbox"
                              checked={fila.purchaseTecnology || false}
                              onChange={(e) =>
                                manejarCambio(index, "purchaseTecnology", e.target.checked)
                              }
                            />
                          </td>
                          <td colSpan={2}>
                            <input
                              type="checkbox"
                              checked={fila.purchaseAprobated || false}
                              onChange={(e) =>
                                manejarCambio(index, "purchaseAprobated", e.target.checked)
                              }
                            />
                          </td>
                          <td>
                            <input
                              className="input-numero"
                              type="number"
                              min="0"
                              value={fila.valor || ""}
                              onChange={(e) =>
                                manejarCambio(index, "valor", e.target.value)
                              }
                            />
                          </td>
                          <td>
                            <input
                              className="input-texto"
                              type="checkbox"
                              checked={fila.vobo || false}
                              onChange={(e) => manejarCambio(index, "vobo", e.target.checked)}
                            />
                          </td>
                          {fila.siExiste && (
                            <td className="text-center" colSpan={2}>
                              <input
                                type="checkbox"
                                checked={fila.sstAprobacion || false}
                                onChange={(e) =>
                                  manejarCambio(index, "sstAprobacion", e.target.checked)
                                }
                              />
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="spaceButtons">
                <button className="btn-agregar" onClick={agregarFila}>
                  <p>+</p>
                </button>
                <p className="separator">|</p>
                <button onClick={prevStep} className="navegationButton">
                  <p>Volver</p>
                </button>
                <button
                  onClick={handleClickTwo}
                  className="navegationButton"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="tittleHeaderRevision">Revisión, Firmas y Confirmación</p>
              <div>
                <div>
                  <div className="firmasContainer">
                    <div className="campoInfo">
                      <div className="headerInfo">
                        <p>DIRECTOR/ LIDER DE AREA</p>
                      </div>
                      <div className="nombre">
                        <div className="text">
                          <p>NOMBRE:</p>
                        </div>
                        <input
                          type="text"
                          name="nombreSolicitante"
                          placeholder="Escribe..."
                          value={form.nombreSolicitante}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="firma">
                        <div className="text">
                          <p>FIRMA:</p>
                        </div>
                        <input type="text"
                          name="firmaSolicitante"
                          placeholder="Escribe..."
                          value={form.firmaSolicitante}
                          onChange={handleChange}
                          className="inputFirma" />
                      </div>
                    </div>
                    <div className="campoInfo">
                      <div className="headerInfo">
                        <p>GERENTE DE AREA</p>
                      </div>
                      <div className="nombre">
                        <div className="text">
                          <p>NOMBRE:</p>
                        </div>
                        <input
                          type="text"
                          name="nombreAdministrativo"
                          placeholder="Escribe..."
                          value={form.nombreAdministrativo}
                          onChange={handleChange} />
                      </div>
                      <div className="firma">
                        <div className="text">
                          <p>FIRMA:</p>
                        </div>
                        <input
                          type="text"
                          name="firmaAdministrativo"
                          placeholder="Escribe..."
                          value={form.firmaAdministrativo}
                          onChange={handleChange}
                          className="inputFirma" />
                      </div>
                    </div>
                    {rango.inputs === 4 && (
                      <div className="campoInfo">
                        <div className="headerInfo">
                          <p>GERENTE ADMINISTRATIVO</p>
                        </div>
                        <div className="nombre">
                          <div className="text">
                            <p>NOMBRE:</p>
                          </div>
                          <input
                            type="text"
                            name="nombreGerente"
                            placeholder="Escribe..."
                            value={form.nombreGerente}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="firma">
                          <div className="text">
                            <p>FIRMA:</p>
                          </div>
                          <input
                            type="text"
                            name="firmaGerente"
                            placeholder="Escribe..."
                            value={form.firmaGerente}
                            onChange={handleChange}
                            className="inputFirma" />
                        </div>
                      </div>)}
                  </div>
                </div>
                {rango.inputs === 4 && (
                  <div className="autorizacionGerenciaGeneral">
                    <div className="autorizacionGeneral">
                      <div className="headerGeneral">
                        <p>GERENCIA GENERAL</p>
                      </div>
                      <div className="campoGeneral">
                        <input
                          type="text"
                          name="autorizacionGerencia"
                          className="inputGerenciaGeneral"
                          placeholder="Escribe..."
                          value={form.autorizacionGerencia}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div className="recepcionCompras">
                      <div className="firma">
                        <div className="headerFirma">
                          <p>FIRMA SERVICIOS ADMIN</p>
                        </div>
                        <div className="campoFirma">
                          <input
                            type="text"
                            name="firmaCompras"
                            placeholder="Escribe..."
                            value={form.firmaCompras}
                            onChange={handleChange}
                            className="inputFirma"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          )}
          <div className="spaceButtons">
            {step === 3 && <button className="navegationButton" onClick={prevStep}>Volver</button>}
            {step === 3 && <button
              onClick={handleClickThree}
              className="navegationButton"
            >
              Enviar
            </button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
