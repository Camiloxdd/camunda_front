"use client";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "../styles/modalNewReq.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faUser,
    faCalendar,
    faBalanceScale,
    faClipboard,
    faBuilding,
    faExclamationTriangle,
    faPaperclip,
    faPlus,
    faX,
    faCubes,
    faListOl,
    faMoneyBill,
    faFile,
    faTrash,
    faSackDollar,
    faClock,
} from "@fortawesome/free-solid-svg-icons";
import TextareaAutosize from "react-textarea-autosize";
import SaveAnimation from "./animationCreateRequisicion";
import { faDailymotion } from "@fortawesome/free-brands-svg-icons";
import { endFirstStepStartTwoStep, endTwoStepStartThreeStep } from "../services/camunda";

const initialForm = {
    solicitante: {
        nombre: "",
        fecha: "",
        fechaRequeridoEntrega: "",
        tiempoAproximadoGestion: "",
        justificacion: "",
        area: "",
        sede: "",
        urgencia: "",
        presupuestada: false,
        status: "pendiente"
    },
    productos: [
        {
            nombre: "",
            cantidad: 1,
            descripcion: "",
            compraTecnologica: false,
            ergonomico: false,
            valorEstimado: "",
            centroCosto: "",
            cuentaContable: "",
            aprobaciones: [],
        },
    ],
};

export default function WizardModal({ open, onClose, onCreated, initialData, startStep }) {
    const [step, setStep] = useState(1);
    const [fileName, setFileName] = useState("");
    const [productoActivo, setProductoActivo] = useState(0);
    const [mostrarModalProductos, setMostrarModalProductos] = useState(false);
    const [productoActivo3, setProductoActivo3] = useState(0);
    const [showAnimation, setShowAnimation] = useState(false);
    const [mostrarModalProductos3, setMostrarModalProductos3] = useState(false);
    const [formData, setFormData] = useState(initialForm);

    const isEditMode = Boolean(initialData && initialData.requisicion);
    // aplicar restricciones de pasos sólo en modo edición
    const minStep = isEditMode ? (startStep ?? 2) : 1;
    const maxStep = isEditMode ? 3 : 4;

    // === NUEVO: precarga cuando se abre en modo edición o en creación ===
    useEffect(() => {
        if (!open) return;

        const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd

        if (isEditMode) {
            // construir formData a partir de initialData
            const req = initialData.requisicion;
            const productosBack = initialData.productos || [];
            const mappedProductos = (productosBack || []).map((p) => ({
                id: p.id,
                nombre: p.nombre || "",
                cantidad: p.cantidad ?? 1,
                descripcion: p.descripcion || "",
                compraTecnologica: Boolean(p.compra_tecnologica),
                ergonomico: Boolean(p.ergonomico),
                valorEstimado: p.valor_estimado ?? "",
                centroCosto: p.centro_costo || "",
                cuentaContable: p.cuenta_contable || "",
                aprobaciones: [], // opcional
                fileName: "",
            }));

            setFormData({
                solicitante: {
                    nombre: req.nombre_solicitante || "",
                    fecha: req.fecha ? req.fecha.slice(0, 10) : today,
                    fechaRequeridoEntrega: req.fecha_requerido_entrega ? req.fecha_requerido_entrega.slice(0, 10) : "",
                    tiempoAproximadoGestion: req.tiempo_aproximado_gestion || "",
                    justificacion: req.justificacion || "",
                    area: req.area || "",
                    sede: req.sede || "",
                    urgencia: req.urgencia || "",
                    presupuestada: Boolean(req.presupuestada),
                    status: req.status || "pendiente"
                },
                productos: mappedProductos.length ? mappedProductos : [...initialForm.productos]
            });
            setStep(startStep ?? 2);
        } else {
            // modo creación: resetear
            const resetForm = JSON.parse(JSON.stringify(initialForm));
            resetForm.solicitante.fecha = today;
            setFormData(resetForm);
            setStep(1);
        }

        setProductoActivo(0);
        setProductoActivo3(0);
        setMostrarModalProductos(false);
        setMostrarModalProductos3(false);
        setShowAnimation(false);
        setFileName("");

        // intentar obtener datos del usuario desde el backend
        (async () => {
            try {
                const res = await fetch("http://localhost:4000/api/auth/me", {
                    credentials: "include",
                });
                if (!res.ok) return;
                const user = await res.json();
                // si no estamos en modo edición, aplicar precarga; si sí, no sobrescribir nombre/area salvo que falten
                setFormData(prev => {
                    if (isEditMode) {
                        return {
                            ...prev,
                            solicitante: {
                                ...prev.solicitante,
                                nombre: prev.solicitante.nombre || user.nombre || "",
                                area: prev.solicitante.area || user.area || "",
                                sede: prev.solicitante.sede || user.sede || "",
                            }
                        };
                    }
                    return {
                        ...prev,
                        solicitante: {
                            ...prev.solicitante,
                            nombre: user.nombre || prev.solicitante.nombre,
                            area: user.area || prev.solicitante.area,
                            sede: user.sede || prev.solicitante.sede,
                        }
                    };
                });

            } catch (err) {
                console.error("No se pudo obtener usuario para precarga:", err);
            }
        })();
    }, [open, initialData, startStep]);

    const handleSubmitFinal = async () => {
        // Validar datos mínimos
        if (!formData.solicitante.nombre || !formData.solicitante.fecha) {
            toast.error("Por favor completa los datos del solicitante antes de guardar.");
            return;
        }

        if (formData.productos.length === 0) {
            toast.error("Agrega al menos un producto.");
            return;
        }

        try {
            // --- NUEVO: antes de guardar, enviar payload final con esMayor ---
            const requisicionId = initialData?.requisicion?.id;
            const ergonomicos = formData.productos.some((p) => Boolean(p.ergonomico));
            const tecnologicos = formData.productos.some((p) => Boolean(p.compraTecnologica));
            const compraPresupuestada = Boolean(formData.solicitante.presupuestada);

            const esMayor = requisicionId
                ? await checkRequisicionValorTotalFromDB(requisicionId)
                : calcularRango();

            const formularioenJSON = JSON.stringify(formData);

            const finalPayload = {
                siExiste: ergonomicos,
                purchaseTecnology: tecnologicos,
                purchaseAprobated: compraPresupuestada,
                esMayor,
                filas: formularioenJSON,
            };

            // enviar al servicio que procesa el paso final
            try {
                await endTwoStepStartThreeStep(finalPayload);
            } catch (err) {
                console.error("Error enviando payload final:", err);
                // No bloqueamos el guardado por este error, pero se puede mostrar alerta opcional
            }
            // --- fin nuevo ---

            if (isEditMode) {
                // editar metadata
                const id = initialData.requisicion.id;
                const metaBody = {
                    nombre_solicitante: formData.solicitante.nombre,
                    fecha: formData.solicitante.fecha,
                    fecha_requerido_entrega: formData.solicitante.fechaRequeridoEntrega,
                    tiempo_aproximado_gestion: formData.solicitante.tiempoAproximadoGestion,
                    justificacion: formData.solicitante.justificacion,
                    area: formData.solicitante.area,
                    sede: formData.solicitante.sede,
                    urgencia: formData.solicitante.urgencia,
                    presupuestada: formData.solicitante.presupuestada,
                };
                const metaRes = await fetch(`http://localhost:4000/api/requisiciones/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(metaBody),
                });
                if (!metaRes.ok) throw new Error("Error actualizando requisición");

                // actualizar productos (reemplazar)
                const productosPayload = formData.productos.map((p) => ({
                    nombre: p.nombre,
                    cantidad: Number(p.cantidad) || 1,
                    descripcion: p.descripcion,
                    compraTecnologica: p.compraTecnologica ? 1 : 0,
                    ergonomico: p.ergonomico ? 1 : 0,
                    valorEstimado: Number(p.valorEstimado) || 0,
                    centroCosto: p.centroCosto || '',
                    cuentaContable: p.cuentaContable || '',
                }));

                const prodRes = await fetch(`http://localhost:4000/api/requisiciones/${id}/productos`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ productos: productosPayload }),
                });
                if (!prodRes.ok) throw new Error("Error actualizando productos");

                if (typeof onCreated === "function") onCreated();
                toast.success("Requisición actualizada correctamente");
                onClose();
            } else {
                // crear nueva requisición (flow existente)
                const res = await fetch("http://localhost:4000/api/requisicion/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });
                if (!res.ok) throw new Error("Error al guardar");
                if (typeof onCreated === "function") onCreated();
                // animación como antes
                console.log("datos de la requisicion", formData);
                setShowAnimation(true);
            }
        } catch (err) {
            console.error(err);
            toast.error("Hubo un error al guardar ❌");
        }
    };

    useEffect(() => {
        if (productoActivo3 >= formData.productos.length) {
            setProductoActivo3(0);
        }
    }, [formData.productos.length]);

    const handleNext = async () => {
        const next = Math.min(maxStep, step + 1);
        if (next === step) return;
        const ok = await handleBeforeEnterStep(step, next);
        if (ok) setStep(next);
    };

    const handlePrev = () => {
        const prev = Math.max(minStep, step - 1);
        setStep(prev);
    };

    // ====== MOVE/ADD: Umbral y funciones de cálculo ANTES de usarlas en handleBeforeEnterStep ======
    // Umbral: 10 salarios mínimos (valor dado por el usuario)
    const SALARIO_MINIMO = 1423000;
    const SALARIOS_UMBRAL = 10;
    const UMBRAL_10_SM = SALARIO_MINIMO * SALARIOS_UMBRAL;

    // Calcula el total estimado sumando (valorEstimado * cantidad) de cada producto
    const getTotalEstimado = () => {
        return formData.productos.reduce((sum, p) => {
            const valor = parseFloat(p.valorEstimado) || 0;
            const cantidad = parseInt(p.cantidad, 10) || 1;
            return sum + valor * cantidad;
        }, 0);
    };

    // Retorna booleano si supera 10 salarios mínimos (mantiene la firma original parcialmente)
    const calcularRango = (valor_) => {
        const total = getTotalEstimado();
        if (valor_ === "total") return total;
        return total > UMBRAL_10_SM;
    };

    // --- NUEVO: consulta sencilla a la tabla/endpoint requisiciones para verificar valor_total ---
    const DB_UMBRAL_SIMPLE = 1423000;
    async function checkRequisicionValorTotalFromDB(id) {
        try {
            if (!id) return false;
            const res = await fetch(`http://localhost:4000/api/requisiciones/${id}`, {
                credentials: "include",
            });
            if (!res.ok) {
                console.error("No se pudo obtener la requisición desde el backend");
                return false;
            }
            const data = await res.json();
            // soporta campos comunes: valor_total o valorTotal o valor
            const valor = parseFloat(data.valor_total ?? data.valorTotal ?? data.valor ?? 0) || 0;
            return valor > DB_UMBRAL_SIMPLE;
        } catch (err) {
            console.error("Error consultando requisición:", err);
            return false;
        }
    }
    // --- fin nuevo ---

    const handleBeforeEnterStep = async (currentStep, nextStep) => {
        try {
            // obtener id de requisicion si existe
            // const requisicionId = initialData?.requisicion?.id;

            if (currentStep === 1 && nextStep === 2) {
                const payload = {
                    bienvenida: "Inicio del proceso de compras"
                }
                await endFirstStepStartTwoStep(payload);
            }

            // Eliminado: envío para paso 4 aquí.
            // Ahora el envío final se hace en handleSubmitFinal (al hacer click en Finalizar).

        } catch (err) {
            console.error("Error al cambiar de paso:", err);
            toast.error("No se pudo avanzar al siguiente paso.");
            return false;
        }
        return true;
    };


    if (!open) return null;

    const getAreaNombre = (area) => {
        switch (area) {
            case "TyP":
                return "Tecnologia y Proyectos";
            case "SST":
                return "Seguridad y Salud en el Trabajo";
            case "GerenciaAdmin":
                return "Gerencia Adminitrativa";
            case "GerenciaGeneral":
                return "Gerencia General";
        }
    };

    const getSedeNombre = (sede) => {
        switch (sede) {
            case "cota":
                return "Cota";
        }
    };

    return (
        <div className="wizardModal-overlay">
            <div className="wizardModal-container">
                <div className="wizardModal-header">
                    <h2>Solicitud de compra</h2>
                    <button className="wizardModal-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="elpapadepapas">
                    <div className="wizardModal-steps">
                        {[
                            "Datos del solicitante",
                            "Detalles del producto",
                            "Presupuesto",
                            "Resumen y Finalizacion",
                        ].map((titulo, index) => (
                            <div
                                key={index}
                                className={`wizardModal-step ${step === index + 1 ? "active" : ""}`}
                            >
                                <div className="wizardModal-circle">{index + 1}</div>
                                <div className="wizardModal-stepContent">
                                    <h3>
                                        Paso {index + 1}: {titulo}
                                    </h3>
                                    <p>
                                        {step === index + 1
                                            ? "En progreso"
                                            : step > index + 1
                                        }
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* === CONTENIDO DE CADA PASO === */}
                    <div className="wizardModal-body">
                        {step === 1 && (
                            <div className="papitoGugutata">
                                <h1 className="tittleContentGugutata">
                                    Datos generales del solicitante
                                </h1>
                                <div className="inputsContainers">
                                    <div className="campoAdicional">
                                        <label>Nombre del solicitante<label className="obligatorio">*</label></label>
                                        <div className="completeInputs">
                                            <FontAwesomeIcon icon={faUser} className="icon" />
                                            <input type="text" placeholder="Ej. Juan Pérez" value={formData.solicitante.nombre}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        solicitante: {
                                                            ...formData.solicitante,
                                                            nombre: e.target.value,
                                                        },
                                                    })
                                                } />
                                        </div>
                                    </div>
                                    <div className="campoAdicional">
                                        <label>Fecha de solicitud<label className="obligatorio">*</label></label>
                                        <div className="completeInputs">
                                            <FontAwesomeIcon icon={faCalendar} className="icon" />
                                            <input type="date" value={formData.solicitante.fecha}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        solicitante: {
                                                            ...formData.solicitante,
                                                            fecha: e.target.value,
                                                        },
                                                    })
                                                } />
                                        </div>
                                    </div>
                                    <div className="campoAdicional">
                                        <label>Fecha requerido de entrega<label className="obligatorio">*</label></label>
                                        <div className="completeInputs">
                                            <FontAwesomeIcon icon={faCalendar} className="icon" />
                                            <input type="date" value={formData.solicitante.fechaRequeridoEntrega}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        solicitante: {
                                                            ...formData.solicitante,
                                                            fechaRequeridoEntrega: e.target.value,
                                                        },
                                                    })
                                                } />
                                        </div>
                                    </div>
                                    <div className="campoAdicional">
                                        <label>Tiempo aproximado de gestion (SLA)<label className="obligatorio">*</label></label>
                                        <div className="completeInputs">
                                            <FontAwesomeIcon
                                                icon={faCalendar}
                                                className="icon"
                                            />
                                            <input type="text" placeholder="(cantidad) dias habiles"
                                                value={formData.solicitante.tiempoAproximadoGestion}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        solicitante: {
                                                            ...formData.solicitante,
                                                            tiempoAproximadoGestion: e.target.value,
                                                        },
                                                    })
                                                } />
                                        </div>
                                    </div>
                                    <div className="campoAdicional">
                                        <label>
                                            Área <label className="obligatorio">*</label>
                                        </label>
                                        <div className="completeInputs">
                                            <FontAwesomeIcon icon={faClipboard} className="icon" />
                                            <input
                                                type="text"
                                                placeholder="Ej. Compras"
                                                value={getAreaNombre(formData.solicitante.area) || ""}
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                    <div className="campoAdicional">
                                        <label>
                                            Sede <label className="obligatorio">*</label>
                                        </label>
                                        <div className="completeInputs">
                                            <FontAwesomeIcon icon={faBuilding} className="icon" />
                                            <input
                                                type="text"
                                                placeholder="Ej. Cundinamarca"
                                                value={getSedeNombre(formData.solicitante.sede) || ""}
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                    <div className="campoAdicional">
                                        <label>Urgencia<label className="obligatorio">*</label></label>
                                        <div className="completeInputs">
                                            <FontAwesomeIcon
                                                icon={faExclamationTriangle}
                                                className="icon"
                                            />
                                            <input type="text" placeholder="Alta / Media / Baja"
                                                value={formData.solicitante.urgencia}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        solicitante: {
                                                            ...formData.solicitante,
                                                            urgencia: e.target.value,
                                                        },
                                                    })
                                                } />
                                        </div>
                                    </div>
                                    <div className="campoAdicional">
                                        <label>Justificación de la compra</label>
                                        <div className="completeInputs">
                                            <FontAwesomeIcon icon={faBalanceScale} className="icon" />
                                            <input type="text" placeholder="SOLO si la urgencia es Alta" value={formData.solicitante.justificacion}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        solicitante: {
                                                            ...formData.solicitante,
                                                            justificacion: e.target.value,
                                                        },
                                                    })
                                                } />
                                        </div>
                                    </div>
                                </div>
                                <div className="firsInfo">
                                    <label>
                                        ¿Está en presupuesto?<label className="obligatorio">*</label>
                                        <input
                                            type="checkbox"
                                            checked={formData.solicitante.presupuestada}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    solicitante: {
                                                        ...formData.solicitante,
                                                        presupuestada: e.target.checked,
                                                    },
                                                })
                                            }
                                        />
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* PASO 2: DETALLES DEL PRODUCTO */}
                        {step === 2 && (
                            <div className="papitoGugutata">
                                <h1 className="tittleContentGugutata">Detalles del producto o servicio</h1>
                                <div className="productoNav">
                                    {formData.productos.slice(0, 3).map((prod, index) => (
                                        <button
                                            key={index}
                                            className={`productoTab ${index === productoActivo ? "active" : ""}`}
                                            onClick={() => setProductoActivo(index)}
                                        >
                                            <FontAwesomeIcon className="iconListFiles" icon={faFile} />{prod.nombre || `Producto ${index + 1}`}
                                        </button>
                                    ))}
                                    {formData.productos.length > 3 && (
                                        <button
                                            className="productoTab verTodos"
                                            onClick={() => setMostrarModalProductos(true)}
                                        >
                                            Ver todos ({formData.productos.length})
                                        </button>
                                    )}
                                    <button
                                        className="wizardModal-btn-remove"
                                        disabled={formData.productos.length <= 1}
                                        onClick={() => {
                                            const productos = formData.productos.filter(
                                                (_, i) => i !== productoActivo
                                            );
                                            setFormData({ ...formData, productos });
                                            setProductoActivo((prev) =>
                                                prev > 0 ? prev - 1 : 0
                                            );
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                    <button
                                        className="wizardModal-btn-add"
                                        onClick={() =>
                                            setFormData({
                                                ...formData,
                                                productos: [
                                                    ...formData.productos,
                                                    {
                                                        nombre: "",
                                                        cantidad: 1,
                                                        descripcion: "",
                                                        compraTecnologica: false,
                                                        ergonomico: false,
                                                        valorEstimado: "",
                                                        centroCosto: "",
                                                        cuentaContable: "",
                                                        aprobaciones: [],
                                                    },
                                                ],
                                            })
                                        }
                                    >
                                        <FontAwesomeIcon icon={faPlus} />
                                    </button>
                                </div>
                                <div className="productoItem">
                                    <div className="inputsContainers">
                                        <div className="campoAdicional">
                                            <label>Producto / Servicio<label className="obligatorio">*</label></label>
                                            <div className="completeInputs">
                                                <FontAwesomeIcon icon={faCubes} className="icon" />
                                                <input
                                                    type="text"
                                                    placeholder="Ej. Escritorio ergonómico"
                                                    value={formData.productos[productoActivo].nombre}
                                                    onChange={(e) => {
                                                        const productos = [...formData.productos];
                                                        productos[productoActivo].nombre = e.target.value;
                                                        setFormData({ ...formData, productos });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="campoAdicional">
                                            <label>Cantidad<label className="obligatorio">*</label></label>
                                            <div className="completeInputs">
                                                <FontAwesomeIcon icon={faListOl} className="icon" />
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={formData.productos[productoActivo].cantidad}
                                                    onChange={(e) => {
                                                        const productos = [...formData.productos];
                                                        productos[productoActivo].cantidad = e.target.value;
                                                        setFormData({ ...formData, productos });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="campoAdicional">
                                            <label>Descripción<label className="obligatorio">*</label></label>
                                            <div className="completeInputs">
                                                <FontAwesomeIcon icon={faClipboard} className="icon" />
                                                <TextareaAutosize
                                                    className="textAreaCustom"
                                                    placeholder="Detalles del producto solicitado"
                                                    value={formData.productos[productoActivo].descripcion}
                                                    onChange={(e) => {
                                                        const productos = [...formData.productos];
                                                        productos[productoActivo].descripcion = e.target.value;
                                                        setFormData({ ...formData, productos });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="firsInfoTwo">
                                            <label>
                                                ¿Es un producto Tecnologico?<label className="obligatorio">*</label>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.productos[productoActivo].compraTecnologica}
                                                    onChange={(e) => {
                                                        const productos = [...formData.productos];
                                                        productos[productoActivo].compraTecnologica = e.target.checked;
                                                        setFormData({ ...formData, productos });
                                                    }}
                                                />
                                            </label>
                                            <label>
                                                ¿Es un producto Ergonomico?<label className="obligatorio">*</label>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.productos[productoActivo].ergonomico}
                                                    onChange={(e) => {
                                                        const productos = [...formData.productos];
                                                        productos[productoActivo].ergonomico = e.target.checked;
                                                        setFormData({ ...formData, productos });
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                {mostrarModalProductos && (
                                    <div className="modalOverlay">
                                        <div className="modalSelectProductos">
                                            <h3>Selecciona un producto</h3>
                                            {formData.productos.map((prod, index) => (
                                                <div
                                                    key={index}
                                                    className="modalProductoItem"
                                                    onClick={() => {
                                                        setProductoActivo(index);
                                                        setMostrarModalProductos(false);
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={faFile} className="iconListFiles" /> {prod.nombre || `Producto ${index + 1}`}
                                                </div>
                                            ))}
                                            <button
                                                className="closeModalBtn"
                                                onClick={() => setMostrarModalProductos(false)}
                                            >
                                                Cerrar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {/* PASO 3: PRESUPUESTO Y TECNOLOGÍA */}
                        {step === 3 && (

                            <div className="papitoGugutata">
                                <h1 className="tittleContentGugutata">
                                    Presupuesto y características técnicas
                                </h1>
                                <div className="productoNav">
                                    {formData.productos.slice(0, 3).map((prod, index) => (
                                        <button
                                            key={index}
                                            className={`productoTab ${index === productoActivo3 ? "active" : ""}`}
                                            onClick={() => setProductoActivo3(index)}
                                        >
                                            <FontAwesomeIcon icon={faSackDollar} className="iconListFiles" />
                                            {prod.nombre || `Producto ${index + 1}`}
                                        </button>
                                    ))}

                                    {formData.productos.length > 3 && (
                                        <button
                                            className={`productoTab verTodos ${productoActivo3 >= 3 ? "active" : ""
                                                }`}
                                            onClick={() => {
                                                if (productoActivo3 < 3) {
                                                    setMostrarModalProductos3(true);
                                                } else {
                                                    setMostrarModalProductos3(true);
                                                }
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faSackDollar} className="iconListFiles" />
                                            {productoActivo3 >= 3
                                                ? formData.productos[productoActivo3].nombre ||
                                                `Producto ${productoActivo3 + 1}`
                                                : `Ver todos (${formData.productos.length})`}
                                        </button>
                                    )}
                                </div>
                                <div className="productoItem">
                                    <div className="inputsContainers">
                                        <div className="campoAdicional">
                                            <label>Valor estimado<label className="obligatorio">*</label></label>
                                            <div className="completeInputs">
                                                <FontAwesomeIcon icon={faMoneyBill} className="icon" />
                                                <input
                                                    type="number"
                                                    placeholder="Valor estimado"
                                                    value={formData.productos[productoActivo3].valorEstimado}
                                                    onChange={(e) => {
                                                        const productos = [...formData.productos];
                                                        productos[productoActivo3].valorEstimado = e.target.value;
                                                        setFormData({ ...formData, productos });
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="campoAdicional">
                                            <label>Anexos</label>
                                            <div className="fileUploadContainer">
                                                <FontAwesomeIcon icon={faPaperclip} className="icon" />
                                                <label
                                                    htmlFor={`fileUpload-${productoActivo3}`}
                                                    className="customFileButton"
                                                >
                                                    {formData.productos[productoActivo3].fileName
                                                        ? formData.productos[productoActivo3].fileName
                                                        : "Seleccionar archivo"}
                                                </label>
                                                <input
                                                    type="file"
                                                    id={`fileUpload-${productoActivo3}`}
                                                    className="hiddenFileInput"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            const productos = [...formData.productos];
                                                            productos[productoActivo3].fileName = file.name;
                                                            productos[productoActivo3].file = file;
                                                            setFormData({ ...formData, productos });
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="campoAdicional">
                                            <label>Centro de costo / Orden interna<label className="obligatorio">*</label></label>
                                            <div className="completeInputs">
                                                <FontAwesomeIcon icon={faClipboard} className="icon" />
                                                <input
                                                    type="text"
                                                    placeholder="Ej. CC-104 / OI-245"
                                                    value={formData.productos[productoActivo3].centroCosto}
                                                    onChange={(e) => {
                                                        const productos = [...formData.productos];
                                                        productos[productoActivo3].centroCosto = e.target.value;
                                                        setFormData({ ...formData, productos });
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="campoAdicional">
                                            <label>Cuenta contable o código de material<label className="obligatorio">*</label></label>
                                            <div className="completeInputs">
                                                <FontAwesomeIcon icon={faMoneyBill} className="icon" />
                                                <input
                                                    type="text"
                                                    placeholder="Ej. 5120-Equipos"
                                                    value={formData.productos[productoActivo3].cuentaContable}
                                                    onChange={(e) => {
                                                        const productos = [...formData.productos];
                                                        productos[productoActivo3].cuentaContable = e.target.value;
                                                        setFormData({ ...formData, productos });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {mostrarModalProductos3 && (
                                    <div className="modalOverlay">
                                        <div className="modalSelectProductos">
                                            <h3>Selecciona un producto</h3>
                                            {formData.productos.map((prod, index) => (
                                                <div
                                                    key={index}
                                                    className="modalProductoItem"
                                                    onClick={() => {
                                                        setProductoActivo3(index);
                                                        setMostrarModalProductos3(false);
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={faSackDollar} className="iconListFiles" /> {prod.nombre || `Producto ${index + 1}`}
                                                </div>
                                            ))}
                                            <button
                                                className="closeModalBtn"
                                                onClick={() => setMostrarModalProductos3(false)}
                                            >
                                                Cerrar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {/* PASO 4: APROBACIONES */}
                        {step === 4 && (
                            <div className="papitoGugutata">
                                <h1 className="tittleContentGugutata">Resumen de solicitud</h1>

                                {/* === DATOS DEL SOLICITANTE y TOTALES === */}
                                <div className="resumenSectionOne">
                                    <div className="infoSolicitanteFinal">
                                        <h2>Datos del solicitante</h2>
                                        <ul>
                                            <li><strong>Nombre:</strong> {formData.solicitante.nombre || "—"}</li>
                                            <li><strong>Fecha:</strong> {formData.solicitante.fecha || "—"}</li>
                                            <li><strong>Área:</strong> {formData.solicitante.area || "—"}</li>
                                            <li><strong>Sede:</strong> {formData.solicitante.sede || "—"}</li>
                                            <li><strong>Urgencia:</strong> {formData.solicitante.urgencia || "—"}</li>
                                            <li><strong>Justificación:</strong> {formData.solicitante.justificacion || "—"}</li>
                                            <p>
                                                <strong>¿Está en presupuesto?:</strong>{" "}
                                                {formData.solicitante.presupuestada ? (
                                                    <span style={{ color: "green", fontWeight: "bold" }}>Si lo esta</span>
                                                ) : (
                                                    <span style={{ color: "red", fontWeight: "bold" }}>No lo esta</span>
                                                )}
                                            </p>
                                        </ul>
                                    </div>

                                    <div className="totalesProductos">
                                        <h2>Totales generales</h2>
                                        <ul>
                                            <li>
                                                <strong>Total de productos:</strong> {formData.productos.length}
                                            </li>
                                            <li>
                                                <strong>Total ergonómicos:</strong>{" "}
                                                {formData.productos.filter((p) => p.ergonomico).length}
                                            </li>
                                            <li>
                                                <strong>Total tecnológicos:</strong>{" "}
                                                {formData.productos.filter((p) => p.compraTecnologica).length}
                                            </li>
                                            <li>
                                                <strong>Valor total estimado:</strong>{" "}
                                                {getTotalEstimado().toLocaleString("es-CO", {
                                                    style: "currency",
                                                    currency: "COP",
                                                    minimumFractionDigits: 0,
                                                })}
                                                {/* Indicador si supera 10 salarios mínimos */}
                                                {getTotalEstimado() > UMBRAL_10_SM ? (
                                                    <span style={{ color: "red", fontWeight: "bold", marginLeft: 8 }}>
                                                        — Supera 10 salarios mínimos
                                                    </span>
                                                ) : (
                                                    <span style={{ color: "green", fontWeight: "bold", marginLeft: 8 }}>
                                                        — No supera 10 salarios mínimos
                                                    </span>
                                                )}
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                {/* === DETALLES DE PRODUCTOS === */}
                                <div className="resumenSection">
                                    <h2>Productos solicitados</h2>
                                    <table className="tablaResumen">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Producto / Servicio</th>
                                                <th>Cantidad</th>
                                                <th>Valor estimado</th>
                                                <th>Compra tecnológica</th>
                                                <th>Ergonómico</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.productos.map((prod, index) => (
                                                <tr key={index}>
                                                    <td>{index + 1}</td>
                                                    <td>{prod.nombre || "—"}</td>
                                                    <td>{prod.cantidad}</td>
                                                    <td>
                                                        {prod.valorEstimado
                                                            ? `$${Number(prod.valorEstimado).toLocaleString()}`
                                                            : "—"}
                                                    </td>
                                                    <td>{prod.compraTecnologica ? "Sí" : "No"}</td>
                                                    <td>{prod.ergonomico ? "Sí" : "No"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        {showAnimation && (
                            <SaveAnimation
                                autoPlay={true}
                                onFinish={() => {
                                    setShowAnimation(false);
                                    onClose();
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* === NAVEGACIÓN === */}
                <div className="wizardModal-footer">
                    {step > minStep && (
                        <button
                            className="wizardModal-btn wizardModal-prev"
                            onClick={handlePrev}
                            disabled={showAnimation}
                        >
                            ← Anterior
                        </button>
                    )}
                    {step < maxStep ? (
                        <button
                            className="wizardModal-btn wizardModal-next"
                            onClick={handleNext}
                            disabled={showAnimation}
                        >
                            Siguiente →
                        </button>
                    ) : (
                        <button
                            className="wizardModal-btn wizardModal-confirm"
                            onClick={handleSubmitFinal}
                            disabled={showAnimation}
                        >
                            Finalizar
                        </button>
                    )}
                </div>
            </div>

        </div>
    );
}
