"use client";
import { useState, useEffect } from "react";
import Navbar from "../../components/navbar";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import emailjs from "emailjs-com"
import { faUser, faCalendar, faBalanceScale, faClipboard, faBuilding, faExclamationTriangle, faClock, faPaperclip, faArrowLeft, faPlus } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import { endFirstStepStartTwoStep, EndFourStep, endTwoStepStartThreeStep, startThreeStep } from "@/app/services/camunda";
import { motion, AnimatePresence } from "framer-motion";


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

      nextStep();
    } catch (error) {
      console.error("Error al iniciar el proceso: ", error)
    }
  }

  const handleClickFour = async () => {
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

      await EndFourStep({
        siExiste,
        purchaseTecnology,
        sstAprobacion,
        vobo,
        purchaseAprobated,
        purchaseAprobatedTecnology,
        purchaseAprobatedErgonomic,
        filas,
      })

      router.push("/");
    } catch (error) {
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
      productoOServicio: "",
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
        productoOServicio: "",
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

  const nextStep = () => {
    setStep((prev) => {
      if (prev === 3) {
        // desde step 3, si inputs === 4 mostramos step 4, sino saltamos al 5
        return rango.inputs === 4 ? 4 : 5;
      } else {
        return prev + 1; // otros steps normales
      }
    });
  };

  const prevStep = () => {
    setStep((prev) => {
      if (prev === 5) {
        // Step 5: si step 4 no aplica, saltamos al 3
        return rango.inputs === 4 ? 4 : 3;
      }
      if (prev === 4) {
        // Step 4: siempre vuelve al 3
        return 3;
      }
      return Math.max(prev - 1, 1); // otros steps normales
    });
  };

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
            <div className="gugutata">
              <h1 className="tittleContent">Datos generales del solicitante.</h1>
              <div className="inputsContainers">
                <div className="campoAdicional">
                  <label>Nombre del solicitante</label>
                  <div className="completeInputs">
                    <FontAwesomeIcon icon={faUser} className="icon" />
                    <input
                      type="text"
                      name="nombre"
                      placeholder=" "
                      value={form.nombre}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="campoAdicional">
                  <label>Fecha de solicitud</label>
                  <div className="completeInputs">
                    <FontAwesomeIcon icon={faCalendar} className="icon" />
                    <input
                      type="date"
                      name="fechaSolicitud"
                      placeholder=" "
                      value={form.fechaSolicitud}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
              <div className="inputsContainers">
                <div className="campoAdicional">
                  <label>Fecha requerido de entrega</label>
                  <div className="completeInputs">
                    <FontAwesomeIcon icon={faCalendar} className="icon" />
                    <input
                      type="date"
                      name="fechaEntrega"
                      placeholder=" "
                      value={form.fechaEntrega}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="campoAdicional">
                  <label>Justificacion de la compra</label>
                  <div className="completeInputs">
                    <FontAwesomeIcon icon={faBalanceScale} className="icon" />
                    <input
                      type="text"
                      name="justificacion"
                      placeholder=" "
                      value={form.justificacion}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
              <div className="inputsContainers">
                <div className="campoAdicional">
                  <label>Area del solicitante</label>
                  <div className="completeInputs">
                    <FontAwesomeIcon icon={faClipboard} className="icon" />
                    <input
                      type="text"
                      name="area"
                      placeholder=" "
                      value={form.area}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="campoAdicional">
                  <label>Sede del solicitante</label>
                  <div className="completeInputs">

                    <FontAwesomeIcon icon={faBuilding} className="icon" />
                    <input
                      type="text"
                      name="sede"
                      placeholder=" "
                      value={form.sede}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
              <div className="inputsContainers">
                <div className="campoAdicional">
                  <label>Urgencia de la compra</label>
                  <div className="completeInputs">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="icon" />
                    <input
                      type="text"
                      name="urgenciaCompra"
                      placeholder=" "
                      value={form.urgenciaCompra}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="campoAdicional">
                  <label>Tiempo aproximado de gestion</label>
                  <div className="completeInputs">
                    <FontAwesomeIcon icon={faClock} className="icon" />
                    <input
                      type="text"
                      name="tiempoGestion"
                      placeholder=" "
                      value={form.tiempoGestion}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
              <div className="inputsContainers">
                <div className="campoAdicional">
                  <label>Anexos</label>
                  <div className="completeInputs">
                    <FontAwesomeIcon icon={faPaperclip} className="icon" />
                    <input
                      type="text"
                      name="anexos"
                      placeholder=" "
                      value={form.anexos}
                      onChange={handleChange}
                    />
                  </div>
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
                        <th>PRODUCTO / SERVICIO</th>
                        <th>CANTIDAD</th>
                        <th>CENTRO DE COSTO U ORDEN INTERNA</th>
                        <th>CUENTA CONTABLE O CÓDIGO DE MATERIAL</th>
                        <th>¿EXISTEN ERGONOMICOS?</th>
                        <th>¿COMPRA TECNOLOGICA?</th>
                        <th colSpan={2}>¿ESTÁ EN PRESUPUESTO?</th>
                        <th>VALOR (*)</th>
                        <th>DESCRIPCION</th>
                        <th>ANEXOS</th>
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
                              value={fila.productoOServicio}
                              onChange={(e) => manejarCambio(index, "productoOServicio", e.target.value)}
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
                              type="text"
                              value={fila.descripcion}
                              onChange={(e) => manejarCambio(index, "descripcion", e.target.value)}
                            />
                          </td>
                          <td>
                            <div
                              style={{
                                width: "60px",
                                height: "60px",
                                border: "2px dashed #aaa",
                                display: "flex",
                                alignItems: "center",
                                marginLeft: "6px",
                                justifyContent: "center",
                                cursor: "pointer"
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                const file = e.dataTransfer.files[0];
                                if (file && file.type.startsWith("image/")) {
                                  const reader = new FileReader();
                                  reader.onload = (event) => manejarCambio(index, "imagen", event.target.result);
                                  reader.readAsDataURL(file);
                                }
                              }}
                              onDragOver={(e) => e.preventDefault()}
                            >
                              {fila.imagen ? (
                                <img src={fila.imagen} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                <p>Suelta aquí</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="spaceButtons">
                <button className="btn-agregar" onClick={agregarFila}>
                  <FontAwesomeIcon icon={faPlus} className="iconPlus" />
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
                <div className="headerPrecio">
                  <div className="textPrecio">
                    Total:
                  </div>
                  <div className="TotalPrecio">
                    <p>${filas.reduce(
                      (acum, fila) => acum + (Number(fila.valor) || 0),
                      0
                    )}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="tittleHeaderRevision">Revisión, Firmas y Confirmación</p>
              <div className="containerStepFour">
                <div className="campoInfo">
                  <div className="headerInfo">
                    <p>DIRECTOR/ LIDER DE AREA</p>
                  </div>
                  <div className="camposTextuales">
                    <label>Nombre</label>
                    <div className="text">
                      <input
                        type="text"
                        name="nombreSolicitante"
                        placeholder=""
                        value={form.nombreSolicitante}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="camposTextuales">
                    <label>Firma</label>
                    <div className="text">
                      <input type="text"
                        name="firmaSolicitante"
                        placeholder=""
                        value={form.firmaSolicitante}
                        onChange={handleChange}
                        className="inputFirma" />
                    </div>
                  </div>
                </div>
                <div className="campoInfo">
                  <div className="headerInfo">
                    <p>GERENTE DE AREA</p>
                  </div>
                  <div className="camposTextuales">
                    <label>Nombre</label>
                    <div className="text">
                      <input
                        type="text"
                        name="nombreAdministrativo"
                        placeholder=""
                        value={form.nombreAdministrativo}
                        onChange={handleChange} />
                    </div>
                  </div>
                  <div className="camposTextuales">
                    <label>Firma</label>
                    <div className="text">
                      <input
                        type="text"
                        name="firmaAdministrativo"
                        placeholder=""
                        value={form.firmaAdministrativo}
                        onChange={handleChange}
                        className="inputFirma" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="spaceButtons">
            {step === 3 && <button className="navegationButton" onClick={prevStep}>Volver</button>}
            {step === 3 && <button
              onClick={nextStep}
              className="navegationButton"
            >
              Siguiente
            </button>
            }
          </div>

          {step === 4 && (
            <div>
              <p className="tittleHeaderRevision">Revisión, Firmas y Confirmación</p>
              <div className="containerStepFour">
                <div className="campoInfo">
                  <div className="headerInfo">
                    <p>GERENCIA GENERAL</p>
                  </div>
                  <div className="camposTextuales">
                    <label>Nombre</label>
                    <div className="text">
                      <input
                        type="text"
                        name="autorizacionGerencia"
                        className="inputGerenciaGeneral"
                        placeholder=""
                        value={form.autorizacionGerencia}
                        onChange={handleChange} />
                    </div>
                  </div>
                </div>
                <div className="campoInfo">
                  <div className="headerInfo">
                    <p>GERENTE ADMINISTRATIVO</p>
                  </div>
                  <div className="camposTextuales">
                    <label>Nombre</label>
                    <div className="text">
                      <input
                        type="text"
                        name="nombreGerente"
                        placeholder=""
                        value={form.nombreGerente}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="camposTextuales">
                    <label>Firma</label>
                    <div className="text">
                      <input
                        type="text"
                        name="firmaGerente"
                        placeholder=""
                        value={form.firmaGerente}
                        onChange={handleChange}
                        className="inputFirma" />
                    </div>
                  </div>
                </div>
                <div className="campoInfo">
                  <div className="headerInfo">
                    <p>FIRMA SERVICIO ADMIN</p>
                  </div>
                  <div className="camposTextuales">
                    <label>Nombre</label>
                    <div className="text">
                      <input
                        type="text"
                        name="firmaCompras"
                        placeholder=""
                        value={form.firmaCompras}
                        onChange={handleChange}
                        className="inputFirma" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="spaceButtons">
            {step === 4 && (
              <button className="navegationButton" onClick={prevStep}>
                Volver
              </button>
            )}
            {step === 4 && (
              <button className="navegationButton" onClick={handleClickThree}>
                Siguiente
              </button>
            )}
          </div>


          {step === 5 && (
            <div>
              <p className="tittleHeaderRevision">Revisión de productos</p>
              <div className="containerStepFour">
                {/* Productos ergonómicos */}
                {filas.some(f => f.siExiste) && (
                  <div className="campoInfo">
                    <div className="headerInfo">
                      <p>Se requiere aprobación de Dirección SST</p>
                    </div>
                    {filas
                      .filter(f => f.siExiste)
                      .map((fila, index) => (
                        <div key={index} className="camposTextualesUltimoStep">
                          <input
                            type="checkbox"
                            id={`sstAprobacion-${index}`}
                            checked={fila.sstAprobacion || false}
                            onChange={(e) =>
                              manejarCambio(filas.indexOf(fila), "sstAprobacion", e.target.checked)
                            }
                          />
                          <label htmlFor={`sstAprobacion-${index}`}>
                            <div></div>
                          </label>
                        </div>
                      ))}
                  </div>

                )}
                {/* Productos tecnológicos */}
                {filas.some(f => f.purchaseTecnology) && (
                  <div className="campoInfo">
                    <div className="headerInfo">
                      <p>
                        Aprobación del Gerente de Tecnológia y proyectos
                      </p>
                    </div>
                    {filas
                      .filter(f => f.purchaseTecnology)
                      .map((fila, index) => (
                        <div key={index} className="camposTextualesUltimoStep">
                          <input
                            type="checkbox"
                            id={`vobo-${index}`}
                            checked={fila.vobo || false}
                            onChange={(e) =>
                              manejarCambio(filas.indexOf(fila), "vobo", e.target.checked)
                            }
                          />
                          <label htmlFor={`vobo-${index}`}>
                            <div></div>
                          </label>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="spaceButtons">
            {step === 5 && <button className="navegationButton" onClick={prevStep}>Volver</button>}
            {step === 5 && <button
              onClick={handleClickFour}
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
