"use client";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import Navbar from "../../components/navbar";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import emailjs from "emailjs-com";
import {
  faUser,
  faCalendar,
  faBalanceScale,
  faClipboard,
  faBuilding,
  faExclamationTriangle,
  faClock,
  faPaperclip,
  faArrowLeft,
  faPlus,
  faX,
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import {
  endFirstStepStartTwoStep,
  EndFourStep,
  endTwoStepStartThreeStep,
  startThreeStep,
} from "@/app/services/camunda";
import gsap from "gsap";

export default function NuevoFormulario() {
  const contentRef = useRef(null);

  const router = useRouter();

  // reemplazamos la lectura directa de filas[0].valor por una función que calcule el total
  function calcularTotalProductos() {
    // suma segura de todos los valores (si valor no es número se interpreta como 0)
    return filas.reduce((acum, f) => acum + (Number(f.valor) || 0), 0);
  }

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
        bienvenida: "Inicio del segundo proceso",
      });

      nextStep();
    } catch (error) {
      console.error("Error al iniciar el proceso: ", error);
    }
  };

  const handleClickTwo = async () => {
    try {
      const monto = calcularTotalProductos();
      const esMayor = calcularRango(monto);

      const siExiste = filas.some((f) => f.siExiste);
      const purchaseTecnology = filas.some((f) => f.purchaseTecnology);
      const sstAprobacion = filas.some((f) => f.sstAprobacion);
      const vobo = filas.some((f) => f.vobo);
      const purchaseAprobated = filas.some((f) => f.purchaseAprobated);

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
      });

      nextStep();
    } catch (error) {
      console.error("Error al iniciar el proceso: ", error);
    }
  };

  const handleClickThree = async () => {
    try {
      const monto = calcularTotalProductos();
      const esMayor = calcularRango(monto);

      const siExiste = filas.some((f) => f.siExiste);
      const purchaseTecnology = filas.some((f) => f.purchaseTecnology);
      const sstAprobacion = filas.some((f) => f.sstAprobacion);
      const vobo = filas.some((f) => f.vobo);
      const purchaseAprobated = filas.some((f) => f.purchaseAprobated);
      const purchaseAprobatedTecnology = purchaseTecnology && purchaseAprobated;
      const purchaseAprobatedErgonomic = siExiste && purchaseAprobated;

      await startThreeStep({
        siExiste,
        purchaseTecnology,
        sstAprobacion,
        vobo,
        esMayor,
        purchaseAprobated,
        purchaseAprobatedTecnology,
        purchaseAprobatedErgonomic,
        filas,
      });

      nextStep();
    } catch (error) {
      console.error("Error al iniciar el proceso: ", error);
    }
  };

  const handleClickFour = async () => {
    try {
      const monto = calcularTotalProductos();
      const esMayor = calcularRango(monto);

      const siExiste = filas.some((f) => f.siExiste);
      const purchaseTecnology = filas.some((f) => f.purchaseTecnology);
      const sstAprobacion = filas.some((f) => f.sstAprobacion);
      const vobo = filas.some((f) => f.vobo);
      const purchaseAprobated = filas.some((f) => f.purchaseAprobated);
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
      });
      enviarFormulario();
    } catch (error) {
      console.error("Error al iniciar el proceso: ", error);
    }
  };

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
    nombreSolicitante: "",
    firmaSolicitante: "",
    nombreAdministrativo: "",
    firmaAdministrativo: "",
    nombreGerente: "",
    firmaGerente: "",
    autorizacionGerencia: "",
    firmaCompras: "",
  });
  console.log(form);

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
      aprobatedStatus: false,
    },
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
        aprobatedStatus: false,
      },
    ]);
    console.log(filas);
  };

  const manejarCambio = (index, campo, valor) => {
    // actualizar filas
    setFilas((prev) => {
      const nuevasFilas = [...prev];
      nuevasFilas[index] = { ...nuevasFilas[index], [campo]: valor };
      return nuevasFilas;
    });

    // mantener sincronía con items (preservando aprobatedStatus si ya existía)
    setItems((prev) => {
      const nuevas = Array.isArray(prev) ? [...prev] : [];
      // asegurar longitud
      while (nuevas.length <= index) nuevas.push({});
      nuevas[index] = { ...nuevas[index], [campo]: valor };
      return nuevas;
    });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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

  const monto = calcularTotalProductos();
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
        });
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
          message: "Se ha creado un nuevo formulario en el sistema.",
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
    const fechaHoy = now.toISOString().split("T")[0];
    setForm((prev) => ({ ...prev, fechaSolicitud: fechaHoy }));
  }, []);

  useEffect(() => {
    if (step === 3) {
      setItems(filas);
    }
  }, [step, filas]);

  const [items, setItems] = useState(() => {
    try {
      const saved =
        typeof window !== "undefined"
          ? localStorage.getItem("approvalItems")
          : null;
      return saved ? JSON.parse(saved) : filas;
    } catch (e) {
      return filas;
    }
  });
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    setItems((prev) => {
      const base = Array.isArray(prev) ? prev : [];
      const merged = filas.map((f, i) => {
        const prevItem = base[i] || {};
        return {
          ...f,
          aprobatedStatus:
            typeof prevItem.aprobatedStatus !== "undefined"
              ? prevItem.aprobatedStatus
              : f.aprobatedStatus || false,
        };
      });
      return merged;
    });
  }, [filas]);

  useEffect(() => {
    setItems((prev) => {
      const base = Array.isArray(prev) ? prev : [];
      const merged = filas.map((f, i) => {
        const prevItem = base[i] || {};
        return {
          ...f,
          aprobatedStatus:
            typeof prevItem.aprobatedStatus !== "undefined"
              ? prevItem.aprobatedStatus
              : f.aprobatedStatus || false,
        };
      });
      return merged;
    });
  }, [filas]);

  const [visibleSnapshotIds, setVisibleSnapshotIds] = useState([]);

  useEffect(() => {
    // Al entrar a cada step hacemos snapshot:
    if (step < 3) {
      setVisibleSnapshotIds([]);
      return;
    }
    if (step === 3) {
      // En step 3 mostramos TODOS los ítems para poder aprobar/desaprobar
      setVisibleSnapshotIds(items.map((_, i) => i));
      return;
    }
    // En steps > 3: muestra los índices de los items que AL MOMENTO de entrar al step están aprobados
    const visibles = [];
    items.forEach((it, i) => {
      if (it && it.aprobatedStatus) visibles.push(i);
    });
    setVisibleSnapshotIds(visibles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // toggle de aprobación: actualiza items y filas (pero la visibilidad en el step actual se mantiene
  // porque usamos snapshot por step; el cambio afectará pasos siguientes)
  const toggleAprobacion = (index) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...(copy[index] || {}),
        aprobatedStatus: !copy[index]?.aprobatedStatus,
      };
      // 🔹 Guardar también en filas de inmediato
      setFilas(copy);
      return copy;
    });
  };

  const itemsToShow = visibleSnapshotIds.map((i) => items[i]).filter(Boolean);

  useLayoutEffect(() => {
    if (contentRef.current) {
      const direction = step > prevStepRef.current ? 100 : -100;

      gsap.fromTo(
        contentRef.current,
        { x: direction, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, ease: "power2.out" }
      );

      prevStepRef.current = step;
    }
  }, [step]);

  const prevStepRef = useRef(step);

  const [itemsAprobadosStep3, setItemsAprobadosStep3] = useState([]);
  const [itemsPendientesStep4, setItemsPendientesStep4] = useState([]);
  const [itemsAprobadosStep4, setItemsAprobadosStep4] = useState([]);
  const [itemsPendientesStep5, setItemsPendientesStep5] = useState([]);
  const [itemsAprobadosStep5, setItemsAprobadosStep5] = useState([]);
  const [itemsPendientesStep6, setItemsPendientesStep6] = useState([]);
  // Para mostrar solo las filas aprobadas en el paso 4:
  // Siempre parte de filas, que tiene el estado completo
  const itemsStep3 = filas; // Paso 3: todos los ítems
  const itemsStep4 = itemsStep3.filter((item) => item.aprobatedStatus); // Paso 4: solo aprobados del paso 3
  const itemsStep5 = itemsStep4.filter((item) => item.aprobatedStatus); // Paso 5: solo aprobados del paso 4
  const itemsStep6 = itemsStep5.filter((item) => item.aprobatedStatus); // Paso 6: solo aprobados del paso 5
  const itemsStep7 = itemsStep6.filter((item) => item.aprobatedStatus); // Paso 7: solo aprobados del paso 6
  const itemsStep8 = itemsStep7.filter((item) => item.aprobatedStatus); // Paso 8: solo aprobados del paso 7

  const nextStep = () => {
    setStep((prev) => {
      if (prev === 3) {
        // Guardar los aprobados y los pendientes del paso 3
        const aprobadosPaso3 = items.filter(
          (item) => item.aprobatedStatus === true
        );
        const pendientesPaso4 = items.filter(
          (item) => item.aprobatedStatus !== true
        );

        // Actualiza las filas para que el valor de aprobatedStatus quede guardado
        setFilas(items);

        // Guarda en estado
        setItemsAprobadosStep3(aprobadosPaso3);
        setItemsPendientesStep4(pendientesPaso4);

        // 🔹 Al pasar al paso 4, mostramos solo los aprobados
        setItems(aprobadosPaso3);

        return 4;
      }

      if (prev === 4) {
        const aprobadosPaso4 = items.filter(
          (item) => item.aprobatedStatus === true
        );
        const pendientesPaso5 = items.filter(
          (item) => item.aprobatedStatus !== true
        );

        // Guardamos valores reales
        setFilas(items);
        setItemsAprobadosStep4(aprobadosPaso4);
        setItemsPendientesStep5(pendientesPaso5);

        // 🔹 Solo los aprobados pasan al siguiente paso
        setItems(aprobadosPaso4);

        return 5;
      }

      if (prev === 5) {
        const aprobadosPaso5 = items.filter(
          (item) => item.aprobatedStatus === true
        );
        const pendientesPaso6 = items.filter(
          (item) => item.aprobatedStatus !== true
        );

        setFilas(items);
        setItemsAprobadosStep5(aprobadosPaso5);
        setItemsPendientesStep6(pendientesPaso6);

        setItems(aprobadosPaso5);

        return 6;
      }

      // 🔹 Continúa normalmente hasta el paso 9
      return Math.min(prev + 1, 9);
    });
  };

  return (
    <div>
      <Navbar />
      <div className="buttonBackDash">
        <button onClick={() => router.push("/")}>
          <FontAwesomeIcon icon={faArrowLeft} className="iconBack" />
        </button>
      </div>
      <div className="headerNewformulario">
        <h1 className="tittleNewformulario">Crea una nueva requisición</h1>
        <p className="descriptionNewformulario">Paso {step} de 8</p>
      </div>
      <div className="containerNewformulario">
        <div className="contentNewformulario" ref={contentRef}>
          {step == 1 && (
            <div className="gugutata">
              <h1 className="tittleContent">
                Datos generales del solicitante.
              </h1>
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
                    <FontAwesomeIcon
                      icon={faExclamationTriangle}
                      className="icon"
                    />
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
                <button onClick={handleClickOne} className="navegationButton">
                  Siguiente
                </button>
              </div>
            </div>
          )}

          {step == 2 && (
            <div className="containerTablitas">
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
                              onChange={(e) =>
                                manejarCambio(
                                  index,
                                  "productoOServicio",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              className="input-numero"
                              type="number"
                              min="0"
                              value={fila.cantidad}
                              onChange={(e) =>
                                manejarCambio(index, "cantidad", e.target.value)
                              }
                            />
                          </td>
                          <td>
                            <input
                              className="input-texto"
                              type="text"
                              value={fila.centro}
                              onChange={(e) =>
                                manejarCambio(index, "centro", e.target.value)
                              }
                            />
                          </td>
                          <td>
                            <input
                              className="input-texto"
                              type="text"
                              value={fila.cuenta}
                              onChange={(e) =>
                                manejarCambio(index, "cuenta", e.target.value)
                              }
                            />
                          </td>
                          <td className="text-center">
                            <input
                              type="checkbox"
                              checked={fila.siExiste || false}
                              onChange={(e) =>
                                manejarCambio(
                                  index,
                                  "siExiste",
                                  e.target.checked
                                )
                              }
                            />
                          </td>
                          <td className="text-center">
                            <input
                              type="checkbox"
                              checked={fila.purchaseTecnology || false}
                              onChange={(e) =>
                                manejarCambio(
                                  index,
                                  "purchaseTecnology",
                                  e.target.checked
                                )
                              }
                            />
                          </td>
                          <td colSpan={2}>
                            <input
                              type="checkbox"
                              checked={fila.purchaseAprobated || false}
                              onChange={(e) =>
                                manejarCambio(
                                  index,
                                  "purchaseAprobated",
                                  e.target.checked
                                )
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
                              onChange={(e) =>
                                manejarCambio(
                                  index,
                                  "descripcion",
                                  e.target.value
                                )
                              }
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
                                cursor: "pointer",
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                const file = e.dataTransfer.files[0];
                                if (file && file.type.startsWith("image/")) {
                                  const reader = new FileReader();
                                  reader.onload = (event) =>
                                    manejarCambio(
                                      index,
                                      "imagen",
                                      event.target.result
                                    );
                                  reader.readAsDataURL(file);
                                }
                              }}
                              onDragOver={(e) => e.preventDefault()}
                            >
                              {fila.imagen ? (
                                <img
                                  src={fila.imagen}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
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
                <button onClick={handleClickTwo} className="navegationButton">
                  Siguiente
                </button>
                <div className="headerPrecio">
                  <div className="textPrecio">Total:</div>
                  <div className="TotalPrecio">
                    <p>
                      $
                      {filas.reduce(
                        (acum, fila) => acum + (Number(fila.valor) || 0),
                        0
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="tittleHeaderRevision">
                Revisión, Firmas y Confirmación
              </p>
              <div className="papiContainer">
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
                        <input
                          type="text"
                          name="firmaSolicitante"
                          placeholder=""
                          value={form.firmaSolicitante}
                          onChange={handleChange}
                          className="inputFirma"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modalContent">
                    <h2 className="modalHeader">Aprobación de Ítems</h2>
                    <div className="tableContainer">
                      <table className="modalTable">
                        <thead>
                          <tr>
                            <th>PRODUCTO / SERVICIO</th>
                            <th>CANTIDAD</th>
                            <th>VALOR</th>
                            <th>CUENTA</th>
                            <th>APROBADO</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itemsStep3.map((item, idx) => (
                            <tr key={idx}>
                              <td>{item.productoOServicio}</td>
                              <td>{item.cantidad}</td>
                              <td>{item.valor}</td>
                              <td>{item.cuenta}</td>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={item.aprobatedStatus || false}
                                  onChange={() => toggleAprobacion(idx)}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button
                      className="confirmButton"
                      onClick={() => {
                        setFilas(items);
                        setMostrarModal(false);
                      }}
                    >
                      Guardar cambios
                    </button>
                  </div>
                </div>
              </div>
              <div className="spaceButtons">
                {step === 3 && (
                  <button className="navegationButton" onClick={prevStep}>
                    Volver
                  </button>
                )}
                {step === 3 && (
                  <button onClick={nextStep} className="navegationButton">
                    Siguiente
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <p className="tittleHeaderRevision">
                Revisión, Firmas y Confirmación
              </p>
              <div className="papiContainer">
                <div className="containerStepFour">
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
                          onChange={handleChange}
                        />
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
                          className="inputFirma"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modalContent">
                    <h2 className="modalHeader">Aprobación de Ítems</h2>
                    <div className="tableContainer">
                      <table className="modalTable">
                        <thead>
                          <tr>
                            <th>PRODUCTO / SERVICIO</th>
                            <th>CANTIDAD</th>
                            <th>VALOR</th>
                            <th>CUENTA</th>
                            <th>APROBADO</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itemsStep4.map((item, idx) => (
                            <tr key={idx}>
                              <td>{item.productoOServicio}</td>
                              <td>{item.cantidad}</td>
                              <td>{item.valor}</td>
                              <td>{item.cuenta}</td>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={item.aprobatedStatus || false}
                                  onChange={() => {
                                    // Busca el índice real en filas
                                    const realIdx = filas.findIndex(
                                      (f) => f === item
                                    );
                                    toggleAprobacion(realIdx);
                                  }}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button
                      className="confirmButton"
                      onClick={() => {
                        setFilas(items);
                        setMostrarModal(false);
                      }}
                    >
                      Guardar cambios
                    </button>
                  </div>
                </div>
              </div>
              <div className="spaceButtons">
                {step === 4 && (
                  <button className="navegationButton" onClick={prevStep}>
                    Volver
                  </button>
                )}
                {step === 4 && (
                  <button
                    onClick={handleClickThree}
                    className="navegationButton"
                  >
                    Siguiente
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <p className="tittleHeaderRevision">
                Revisión, Firmas y Confirmación
              </p>
              <div className="papiContainer">
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
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modalContent">
                    <h2 className="modalHeader">Aprobación de Ítems</h2>
                    <div className="tableContainer">
                      <table className="modalTable">
                        <thead>
                          <tr>
                            <th>PRODUCTO / SERVICIO</th>
                            <th>CANTIDAD</th>
                            <th>VALOR</th>
                            <th>CUENTA</th>
                            <th>APROBADO</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itemsStep5.map((item, idx) => (
                            <tr key={idx}>
                              <td>{item.productoOServicio}</td>
                              <td>{item.cantidad}</td>
                              <td>{item.valor}</td>
                              <td>{item.cuenta}</td>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={item.aprobatedStatus || false}
                                  onChange={() => {
                                    const realIdx = filas.findIndex(
                                      (f) => f === item
                                    );
                                    toggleAprobacion(realIdx);
                                  }}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button
                      className="confirmButton"
                      onClick={() => {
                        setFilas(items);
                        setMostrarModal(false);
                      }}
                    >
                      Guardar cambios
                    </button>
                  </div>
                </div>
              </div>
              <div className="spaceButtons">
                {step === 5 && (
                  <button className="navegationButton" onClick={prevStep}>
                    Volver
                  </button>
                )}
                {step === 5 && (
                  <button onClick={nextStep} className="navegationButton">
                    Enviar
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 6 && (
            <div>
              <p className="tittleHeaderRevision">
                Revisión, Firmas y Confirmación
              </p>
              <div className="papiContainer">
                <div className="containerStepFour">
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
                          className="inputFirma"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modalContent">
                    <h2 className="modalHeader">Aprobación de Ítems</h2>
                    <div className="tableContainer">
                      <table className="modalTable">
                        <thead>
                          <tr>
                            <th>PRODUCTO / SERVICIO</th>
                            <th>CANTIDAD</th>
                            <th>VALOR</th>
                            <th>CUENTA</th>
                            <th>APROBADO</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itemsStep6.map((item, idx) => (
                            <tr key={idx}>
                              <td>{item.productoOServicio}</td>
                              <td>{item.cantidad}</td>
                              <td>{item.valor}</td>
                              <td>{item.cuenta}</td>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={item.aprobatedStatus || false}
                                  onChange={() => {
                                    const realIdx = filas.findIndex(
                                      (f) => f === item
                                    );
                                    toggleAprobacion(realIdx);
                                  }}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button
                      className="confirmButton"
                      onClick={() => {
                        setFilas(items);
                        setMostrarModal(false);
                      }}
                    >
                      Guardar cambios
                    </button>
                  </div>
                </div>
              </div>
              <div className="spaceButtons">
                {step === 6 && (
                  <button className="navegationButton" onClick={prevStep}>
                    Volver
                  </button>
                )}
                {step === 6 && (
                  <button onClick={nextStep} className="navegationButton">
                    Enviar
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 7 && (
            <div>
              <p className="tittleHeaderRevision">
                Revisión, Firmas y Confirmación
              </p>
              <div className="papiContainer">
                <div className="containerStepFour">
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
                          className="inputFirma"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modalContent">
                    <h2 className="modalHeader">Aprobación de Ítems</h2>
                    <div className="tableContainer">
                      <table className="modalTable">
                        <thead>
                          <tr>
                            <th>PRODUCTO / SERVICIO</th>
                            <th>CANTIDAD</th>
                            <th>VALOR</th>
                            <th>CUENTA</th>
                            <th>APROBADO</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itemsStep7.map((item, idx) => (
                            <tr key={idx}>
                              <td>{item.productoOServicio}</td>
                              <td>{item.cantidad}</td>
                              <td>{item.valor}</td>
                              <td>{item.cuenta}</td>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={item.aprobatedStatus || false}
                                  onChange={() => {
                                    const realIdx = filas.findIndex(
                                      (f) => f === item
                                    );
                                    toggleAprobacion(realIdx);
                                  }}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button
                      className="confirmButton"
                      onClick={() => {
                        setFilas(items);
                        setMostrarModal(false);
                      }}
                    >
                      Guardar cambios
                    </button>
                  </div>
                </div>
              </div>
              <div className="spaceButtons">
                {step === 7 && (
                  <button onClick={prevStep} className="navegationButton">
                    Volver
                  </button>
                )}
                {step === 7 && (
                  <button onClick={nextStep} className="navegationButton">
                    Enviar
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 8 && (
            <div>
              <p className="tittleHeaderRevision">Revisión de productos</p>
              <div className="containerStepFour">
                {/* --- SOLO TECNOLÓGICO --- */}
                {itemsStep8.length === 1 &&
                  itemsStep8[0].purchaseTecnology &&
                  !itemsStep8[0].siExiste && (
                    <div className="campoInfo">
                      <div className="headerInfo">
                        <p>Aprobación del Gerente de Tecnológia y proyectos</p>
                      </div>
                      <div className="camposTextualesUltimoStep">
                        <input
                          type="checkbox"
                          id={`vobo-0`}
                          checked={itemsStep8[0].vobo || false}
                          onChange={(e) =>
                            manejarCambio(
                              filas.findIndex((f) => f === itemsStep8[0]),
                              "vobo",
                              e.target.checked
                            )
                          }
                        />
                        <label htmlFor={`vobo-0`}>
                          <div></div>
                        </label>
                      </div>
                    </div>
                  )}

                {/* --- SOLO ERGONÓMICO --- */}
                {itemsStep8.length === 1 &&
                  itemsStep8[0].siExiste &&
                  !itemsStep8[0].purchaseTecnology && (
                    <div className="campoInfo">
                      <div className="headerInfo">
                        <p>Se requiere aprobación de Dirección SST</p>
                      </div>
                      <div className="camposTextualesUltimoStep">
                        <input
                          type="checkbox"
                          id={`sstAprobacion-0`}
                          checked={itemsStep8[0].sstAprobacion || false}
                          onChange={(e) =>
                            manejarCambio(
                              filas.findIndex((f) => f === itemsStep8[0]),
                              "sstAprobacion",
                              e.target.checked
                            )
                          }
                        />
                        <label htmlFor={`sstAprobacion-0`}>
                          <div></div>
                        </label>
                      </div>
                    </div>
                  )}

                {/* --- AMBOS TIPOS PRESENTES --- */}
                {itemsStep8.length > 1 && (
                  <>
                    {itemsStep8.some((item) => item.purchaseTecnology) && (
                      <div className="campoInfo">
                        <div className="headerInfo">
                          <p>
                            Aprobación del Gerente de Tecnológia y proyectos
                          </p>
                        </div>
                        {itemsStep8.map((fila, index) =>
                          fila.purchaseTecnology ? (
                            <div
                              key={index}
                              className="camposTextualesUltimoStep"
                            >
                              <input
                                type="checkbox"
                                id={`vobo-${index}`}
                                checked={fila.vobo || false}
                                onChange={(e) =>
                                  manejarCambio(
                                    filas.findIndex((f) => f === fila),
                                    "vobo",
                                    e.target.checked
                                  )
                                }
                              />
                              <label htmlFor={`vobo-${index}`}>
                                <div></div>
                              </label>
                            </div>
                          ) : null
                        )}
                      </div>
                    )}
                    {itemsStep8.some((item) => item.siExiste) && (
                      <div className="campoInfo">
                        <div className="headerInfo">
                          <p>Se requiere aprobación de Dirección SST</p>
                        </div>
                        {itemsStep8.map((fila, index) =>
                          fila.siExiste ? (
                            <div
                              key={index}
                              className="camposTextualesUltimoStep"
                            >
                              <input
                                type="checkbox"
                                id={`sstAprobacion-${index}`}
                                checked={fila.sstAprobacion || false}
                                onChange={(e) =>
                                  manejarCambio(
                                    filas.findIndex((f) => f === fila),
                                    "sstAprobacion",
                                    e.target.checked
                                  )
                                }
                              />
                              <label htmlFor={`sstAprobacion-${index}`}>
                                <div></div>
                              </label>
                            </div>
                          ) : null
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* ...tu tabla y botones siguen igual... */}
                <div className="modalContent">
                  <h2 className="modalHeader">Aprobación de Ítems</h2>
                  <div className="tableContainer">
                    <table className="modalTable">
                      <thead>
                        <tr>
                          <th>PRODUCTO / SERVICIO</th>
                          <th>CANTIDAD</th>
                          <th>VALOR</th>
                          <th>CUENTA</th>
                          <th>APROBADO</th>
                        </tr>
                      </thead>
                      <tbody>
                        {itemsStep8.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.productoOServicio}</td>
                            <td>{item.cantidad}</td>
                            <td>{item.valor}</td>
                            <td>{item.cuenta}</td>
                            <td>
                              <input
                                type="checkbox"
                                checked={item.aprobatedStatus || false}
                                onChange={() => {
                                  const realIdx = filas.findIndex(
                                    (f) => f === item
                                  );
                                  toggleAprobacion(realIdx);
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button
                    className="confirmButton"
                    onClick={() => {
                      setFilas(items);
                      setMostrarModal(false);
                    }}
                  >
                    Guardar cambios
                  </button>
                </div>
              </div>
              <div className="spaceButtons">
                <button className="navegationButton" onClick={prevStep}>
                  Volver
                </button>
                <button onClick={handleClickFour} className="navegationButton">
                  Enviar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
