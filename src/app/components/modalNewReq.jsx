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
    // nuevo estado: indica transición/carga entre pasos
    const [stepLoading, setStepLoading] = useState(false);
    // controla si el overlay está montado (visible en DOM)
    const [stepLoadingVisible, setStepLoadingVisible] = useState(false);
    // controla la clase de salida (fade-out)
    const [stepLoadingExiting, setStepLoadingExiting] = useState(false);
    const [mostrarModalProductos3, setMostrarModalProductos3] = useState(false);
    const [formData, setFormData] = useState(initialForm);



    const isEditMode = Boolean(
        initialData &&
        (initialData.requisicion || initialData.requisicion_id || initialData.id)
    );

    const minStep = isEditMode ? (startStep ?? 2) : 1;
    const maxStep = isEditMode ? 3 : 4;

    useEffect(() => {
        if (!open) return;

        const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd

        if (isEditMode) {

            const req = initialData.requisicion ?? initialData;
            const rawList = []
                .concat(
                    initialData.productos || [],
                    initialData.productos_list || [],
                    initialData.items || [],
                    initialData.productos_aprobados || [],
                    initialData.productos_rechazados || [],
                    initialData.approved_products || [],
                    initialData.rejected_products || [],
                    initialData.requisicion_productos || []
                )
                .filter(Boolean);

            const seen = new Set();
            const productosBack = [];
            rawList.forEach((p) => {
                const idPart = String(p.id ?? p.producto_id ?? p.nombre ?? p.name ?? "");
                const estadoPart = String(p.aprobado ?? p.estado ?? p.status ?? p.estado_aprobacion ?? "").trim();
                const valorPart = String(p.valor_estimado ?? p.valorEstimado ?? p.valor ?? "").trim();
                const cantidadPart = String(p.cantidad ?? p.qty ?? "").trim();
                const key = `${idPart}::${estadoPart}::${cantidadPart}::${valorPart}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    productosBack.push(p);
                }
            });

            const formatCurrencyLocal = (num) =>
                new Intl.NumberFormat("es-CO", {
                    style: "currency",
                    currency: "COP",
                    minimumFractionDigits: 0,
                }).format(Number(num) || 0);

            const mappedProductos = (productosBack || []).map((p) => {
                const rawValor = p.valor_estimado ?? p.valorEstimado ?? p.valor ?? "";
                let valorEstimadoFormatted = "";
                if (rawValor !== null && rawValor !== undefined && rawValor !== "") {
                    const num = Number(rawValor);
                    valorEstimadoFormatted = !isNaN(num) ? formatCurrencyLocal(num) : String(rawValor);
                }

                let aprobacionesNormalized = [];
                if (Array.isArray(p.aprobaciones) && p.aprobaciones.length) {
                    aprobacionesNormalized = p.aprobaciones.map(a => (typeof a === "string" ? { status: a } : { status: a.status ?? a.estado ?? a }));
                } else if (Array.isArray(p.aprobado) && p.aprobado.length) {
                    aprobacionesNormalized = p.aprobado.map(a => (typeof a === "string" ? { status: a } : { status: a.status ?? a.estado ?? a }));
                } else {
                    const raw = p.aprobaciones ?? p.aprobado ?? p.estado ?? p.status ?? p.estado_aprobacion ?? null;
                    if (raw !== null && raw !== undefined && String(raw).trim() !== "") {
                        aprobacionesNormalized = [{ status: String(raw) }];
                    }
                }

                return {
                    id: p.id ?? p.producto_id ?? null,
                    nombre: p.nombre ?? p.name ?? "",
                    cantidad: p.cantidad ?? p.qty ?? 1,
                    descripcion: p.descripcion ?? p.description ?? "",
                    compraTecnologica: Boolean(p.compra_tecnologica ?? p.compraTecnologica ?? (p.compra_tecnologica_numeric ?? 0)),
                    ergonomico: Boolean(p.ergonomico ?? p.ergonomico_numeric ?? false),
                    valorEstimado: valorEstimadoFormatted,
                    centroCosto: p.centro_costo ?? p.centroCosto ?? p.centro ?? "",
                    cuentaContable: p.cuenta_contable ?? p.cuentaContable ?? p.cuenta ?? "",
                    aprobaciones: aprobacionesNormalized,
                    aprobadoRaw: p.aprobado ?? p.aprobado_estado ?? p.estado ?? p.status ?? null,
                    fileName: p.fileName ?? "",
                };
            });

            setFormData({
                solicitante: {
                    nombre: req.nombre_solicitante ?? req.nombre ?? "",
                    fecha: req.fecha ? String(req.fecha).slice(0, 10) : today,
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

        (async () => {
            try {
                const res = await fetch("http://localhost:8000/api/auth/me", {
                    credentials: "include",
                });
                if (!res.ok) return;
                const user = await res.json();
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

    const SALARIO_MINIMO = 1423000;
    const SALARIOS_UMBRAL = 10;
    const UMBRAL_10_SM = SALARIO_MINIMO * SALARIOS_UMBRAL;

    const parseCurrency = (val) => {
        if (val == null) return 0;
        if (typeof val === "number") return val;
        const s = String(val);
        const cleaned = s.replace(/[^0-9\-.,]/g, "").replace(/\./g, "");
        const normalized = cleaned.replace(/,/g, ".");
        const num = parseFloat(normalized);
        return isNaN(num) ? 0 : num;
    };

    const formatCurrency = (num) => {
        const n = Number(num) || 0;
        return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);
    };

    const getTotalEstimado = (onlyApproved = false) => {
        return formData.productos.reduce((sum, p) => {
            if (onlyApproved) {
                const aprobaciones = p.aprobaciones || [];
                if (Array.isArray(aprobaciones) && aprobaciones.length > 0) {
                    const tieneAprob = aprobaciones.some(a => {
                        const raw = String(a?.status ?? a ?? "").toLowerCase();
                        return raw.includes("aprob");
                    });
                    if (!tieneAprob) return sum;
                } else if (p.aprobadoRaw != null && String(p.aprobadoRaw).trim() !== "") {
                    if (!String(p.aprobadoRaw).toLowerCase().includes("aprob")) return sum;
                }
            }

            const valor = parseCurrency(p.valorEstimado) || 0;
            const cantidad = parseInt(p.cantidad, 10) || 1;
            return sum + valor * cantidad;
        }, 0);
    };

    const calcularRango = (valor_) => {
        const total = getTotalEstimado();
        if (valor_ === "total") return total;
        return total > UMBRAL_10_SM;
    };

    const DB_UMBRAL_SIMPLE = 1423000;
    async function checkRequisicionValorTotalFromDB(id) {
        try {
            if (!id) return false;
            const res = await fetch(`http://localhost:8000/api/requisiciones/${id}`, {
                credentials: "include",
            });
            if (!res.ok) {
                console.error("No se pudo obtener la requisición desde el backend");
                return false;
            }
            const data = await res.json();
            const valor = parseFloat(data.valor_total ?? data.valorTotal ?? data.valor ?? 0) || 0;
            return valor > DB_UMBRAL_SIMPLE;
        } catch (err) {
            console.error("Error consultando requisición:", err);
            return false;
        }
    }

    const handleSubmitFinal = async () => {
        if (!formData.solicitante.nombre || !formData.solicitante.fecha) {
            toast.error("Por favor completa los datos del solicitante antes de guardar.");
            return;
        }

        if (formData.productos.length === 0) {
            toast.error("Agrega al menos un producto.");
            return;
        }

        // Validación: cada producto debe ser tecnológico o ergonómico (o ambos)
        const invalidTipo = formData.productos
            .map((p, i) => ({ p, i }))
            .filter(({ p }) => !Boolean(p.compraTecnologica) && !Boolean(p.ergonomico));
        if (invalidTipo.length > 0) {
            const list = invalidTipo
                .map(({ p, i }) => p.nombre ? `${i + 1} (${p.nombre})` : `${i + 1}`)
                .join(", ");
            toast.error(`Cada producto debe ser tecnológico o ergonómico. Revisa los ítems: ${list}`);
            return;
        }

        try {
            const requisicionId = initialData?.requisicion?.id;
            const ergonomicos = formData.productos.some((p) => Boolean(p.ergonomico));
            const tecnologicos = formData.productos.some((p) => Boolean(p.compraTecnologica));
            const compraPresupuestada = Boolean(formData.solicitante.presupuestada);
            const totalEstimado = getTotalEstimado();
            const esMayor = totalEstimado > UMBRAL_10_SM;

            const productosPayload = formData.productos.map((p) => ({
                nombre: p.nombre,
                cantidad: Number(p.cantidad) || 1,
                valorEstimado: parseCurrency(p.valorEstimado) || 0,
                descripcion: p.descripcion,
                compraTecnologica: p.compraTecnologica ? 1 : 0,
                ergonomico: p.ergonomico ? 1 : 0,
                centroCosto: p.centroCosto || "",
                cuentaContable: p.cuentaContable || "",
            }));

            const formularioenJSON = JSON.stringify(formData);

            const isTech = formData.productos.some((p) => {
                const v = p.compraTecnologica ?? p.compra_tecnologica;
                return v === true || v === 1 || String(v) === "1" || String(v).toLowerCase() === "true";
            });

            const isErgo = formData.productos.some((p) => {
                const v = p.ergonomico ?? p.ergonomico;
                return v === true || v === 1 || String(v) === "1" || String(v).toLowerCase() === "true";
            });

            const tecnologicosFromForm = isTech;
            const ergonomicosFromForm = isErgo;

            const finalPayload = {
                siExiste: productosPayload.length > 0,
                purchaseTecnology: Boolean(tecnologicosFromForm),
                purchaseTecnologyNumeric: tecnologicosFromForm ? 1 : 0,
                sstAprobacion: Boolean(ergonomicosFromForm),
                purchaseAprobated: compraPresupuestada,
                esMayor,
                filas: formularioenJSON,
                valor_total: totalEstimado,
                requireGerAdmin: !compraPresupuestada,
                requireGerGeneral: !compraPresupuestada,
            };

            if (isEditMode) {
                // 🔹 --- MODO EDICIÓN (sin cambios)
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
                    valor_total: getTotalEstimado(),
                };

                const metaRes = await fetch(`http://localhost:8000/api/requisiciones/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(metaBody),
                });
                if (!metaRes.ok) throw new Error("Error actualizando requisición");

                const prodRes = await fetch(`http://localhost:8000/api/requisiciones/${id}/productos`, {
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
                // 🔹 --- MODO CREACIÓN + COMPLETAR TAREA EN CAMUNDA ---
                const processInstanceKey = localStorage.getItem("processInstanceKey");

                const creationPayload = {
                    solicitante: formData.solicitante,
                    productos: productosPayload,
                    valor_total: getTotalEstimado(),
                    filas: formularioenJSON,
                    processInstanceKey,
                };

                const res = await fetch("http://localhost:8000/api/requisicion/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(creationPayload),
                });

                if (!res.ok) throw new Error("Error al guardar");

                // 🔸 Llamamos a Camunda para completar la tarea
                try {
                    console.log("🔁 Completando tarea de Camunda (segundo paso)...");
                    await endTwoStepStartThreeStep(finalPayload); // 👈 pasa tus variables del flujo
                    console.log("✅ Tarea completada correctamente en Camunda");
                } catch (err) {
                    console.error("❌ Error completando tarea en Camunda:", err);
                    toast.error("Error al avanzar en el flujo de aprobación");
                }

                if (typeof onCreated === "function") onCreated();

                console.log("📦 Datos de la requisición enviada:", creationPayload);
                toast.success("Requisición creada correctamente");
                setShowAnimation(true);
            }
        } catch (err) {
            console.error(err);
            toast.error("Hubo un error al guardar");
        }
    };

    const handleCancelWizard = async () => {
        const key = localStorage.getItem("processInstanceKey");
        if (key) {
            try {
                await fetch(`http://localhost:8000/api/process/${key}/cancel`, { method: "POST" });
                localStorage.removeItem("processInstanceKey");
                toast.info("Requisicion cancelada correctamente.");
                console.log(`Proceso Camunda ${key} cancelado.`);
            } catch (err) {
                console.error("Error al cancelar proceso:", err);
                toast.error("No se pudo cancelar el proceso.");
            }
        } else {
            console.log("No hay proceso en curso para cancelar.");
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
		try {
			// mostrar overlay
			setStepLoadingVisible(true);
			setStepLoading(true);
			const ok = await handleBeforeEnterStep(step, next);
			if (ok) setStep(next);
		} catch (err) {
			console.error("Error en transición siguiente:", err);
		} finally {
			// disparar animación de salida y limpiar después de su duración
			setStepLoading(false);
			setStepLoadingExiting(true);
			setTimeout(() => {
				setStepLoadingExiting(false);
				setStepLoadingVisible(false);
			}, 360); // debe coincidir con la duración CSS (ej. 350ms)
		}
	};

    const handlePrev = async () => {
		const prev = Math.max(minStep, step - 1);
		try {
			setStepLoadingVisible(true);
			setStepLoading(true);
			// pequeña pausa visual para que el loading sea perceptible
			await new Promise((r) => setTimeout(r, 250));
			setStep(prev);
		} catch (err) {
			console.error("Error en transición anterior:", err);
		} finally {
			setStepLoading(false);
			setStepLoadingExiting(true);
			setTimeout(() => {
				setStepLoadingExiting(false);
				setStepLoadingVisible(false);
			}, 360);
		}
	};

    const handleBeforeEnterStep = async (currentStep, nextStep) => {
        try {
            // Validación al avanzar de Paso 2 -> Paso 3:
            if (currentStep === 2 && nextStep === 3) {
                const invalid = formData.productos
                    .map((p, i) => ({ p, i }))
                    .filter(({ p }) => !Boolean(p.compraTecnologica) && !Boolean(p.ergonomico));
                if (invalid.length > 0) {
                    const names = invalid
                        .map(({ p, i }) => p.nombre ? `${i + 1} (${p.nombre})` : `${i + 1}`)
                        .join(", ");
                    toast.error(`Cada producto debe ser tecnológico o ergonómico. Revisa los ítems: ${names}`);
                    return false;
                }
            }

            if (currentStep === 3 && nextStep === 4) {
                const productosIncompletos = formData.productos.filter(
                    (p) =>
                        !p.valorEstimado?.toString().trim() ||
                        !p.centroCosto?.toString().trim() ||
                        !p.cuentaContable?.toString().trim()
                );

                if (productosIncompletos.length > 0) {
                    toast.error(
                        "Todos los productos deben tener valor estimado, centro de costo y cuenta contable antes de continuar."
                    );
                    return false;
                }
            }

            // 🔹 Inicio del proceso normal (ya existente)
            if (currentStep === 1 && nextStep === 2) {
                const payload = {
                    bienvenida: "Inicio del proceso de compras",
                };
                await endFirstStepStartTwoStep(payload);
            }
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
                return "Tecnología y Proyectos";
            case "SST":
                return "Seguridad y Salud en el Trabajo";
            case "GerenciaAdmin":
                return "Gerencia Administrativa";
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

    const handleCloseModal = () => {
		// evitar cerrar durante una transición/animación
		if (stepLoadingVisible) return;
		handleCancelWizard();
		onClose();
	};

    return (
        <div className="wizardModal-overlay">
            {/* asegurar que el overlay interno quede confinado a este container */}
            <div className="wizardModal-container" style={{ position: "relative" }}>
 				{/* Overlay de carga entre pasos (solo dentro del container) */}
 				{stepLoadingVisible && (
 					<div
						className={`loading-container ${stepLoadingExiting ? "fade-out" : "fade-in"}`}						style={{ position: "absolute", inset: 0, zIndex: 40, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.92)" }}
					>
						<div className="loading-cambios" style={{ textAlign: "center" }}>
							<img
								src="/coopidrogas_logo_mini.png"
								className="LogoCambios"
								alt="Cargando..."
								// ancho/alto controlados en CSS; la rotación viene de .LogoCambios
							/>
							<p className="textLoading" style={{ marginTop: 10 }}>Cargando...</p>
					</div>
					</div>
 				)}
 
                <div className="wizardModal-header">
                    <h2>Solicitud de compra</h2>
                    <button className="wizardModal-close" onClick={handleCloseModal}>
                        ✕
                    </button>
                </div>

                <div className="elpapadepapas">
                    <div className="wizardModal-steps">
                        {[
                            "Datos del solicitante",
                            "Detalles del producto",
                            "Presupuesto",
                            "Resumen y finalización",
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
                                        <label>Fecha requerida de entrega<label className="obligatorio">*</label></label>
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
                                        <label>Tiempo aproximado de gestión (SLA)<label className="obligatorio">*</label></label>
                                        <div className="completeInputs">
                                            <FontAwesomeIcon
                                                icon={faCalendar}
                                                className="icon"
                                            />
                                            <input type="text" placeholder="(cantidad) días hábiles"
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
                                            <input type="text" placeholder="Solo si la urgencia es alta" value={formData.solicitante.justificacion}
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
                                        <label className="obligatorio">*</label><p>¿Está en presupuesto?</p>
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
                                                ¿Es un producto tecnológico?<label className="obligatorio">*</label>
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
                                                ¿Es un producto ergonómico?<label className="obligatorio">*</label>
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
                                                    type="text"
                                                    placeholder="Valor estimado"
                                                    value={formData.productos[productoActivo3].valorEstimado || ""}
                                                    onChange={(e) => {
                                                        const raw = e.target.value;
                                                        const num = parseCurrency(raw);
                                                        const productos = [...formData.productos];
                                                        productos[productoActivo3].valorEstimado = raw.trim() === "" ? "" : formatCurrency(num);
                                                        setFormData({ ...formData, productos });
                                                    }}
                                                    onBlur={(e) => {
                                                        const raw = e.target.value;
                                                        const num = parseCurrency(raw);
                                                        const productos = [...formData.productos];
                                                        productos[productoActivo3].valorEstimado = raw.trim() === "" ? "" : formatCurrency(num);
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
                        {step === 4 && (
                            <div className="papitoGugutata">
                                <h1 className="tittleContentGugutata">Resumen de solicitud</h1>

                                <div className="resumenSectionOne">
                                    <div className="infoSolicitanteFinal">
                                        <h2>Datos del solicitante</h2>
                                        <ul>
                                            <li><strong>Nombre:</strong> {formData.solicitante.nombre || "No tiene."}</li>
                                            <li><strong>Fecha:</strong> {formData.solicitante.fecha || "No tiene."}</li>
                                            <li><strong>Área:</strong> {getAreaNombre(formData.solicitante.area || "No tiene.")}</li>
                                            <li><strong>Sede:</strong> {getSedeNombre(formData.solicitante.sede || "No tiene.")}</li>
                                            <li><strong>Urgencia:</strong> {formData.solicitante.urgencia || "No tiene."}</li>
                                            <li><strong>Justificación:</strong> {formData.solicitante.justificacion || "No tiene."}</li>
                                            <p>
                                                <strong>¿Está en presupuesto?:</strong>{" "}
                                                {formData.solicitante.presupuestada ? (
                                                    <span style={{ color: "green", fontWeight: "bold" }}>Sí lo está</span>
                                                ) : (
                                                    <span style={{ color: "red", fontWeight: "bold" }}>No lo está</span>
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
                                                {formatCurrency(getTotalEstimado(true))}
                                                {getTotalEstimado(true) > UMBRAL_10_SM ? (
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
                                                            ? (typeof prod.valorEstimado === "string" && prod.valorEstimado.includes("$")
                                                                ? prod.valorEstimado
                                                                : formatCurrency(parseCurrency(prod.valorEstimado)))
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
                <div className="wizardModal-footer">
                    {step > minStep && (
                        <button
                            className="wizardModal-btn wizardModal-prev"
                            onClick={handlePrev}
                            disabled={showAnimation || stepLoadingVisible}
                        >
                            ← Anterior
                        </button>
                    )}
                    {step < maxStep ? (
                        <button
                            className="wizardModal-btn wizardModal-next"
                            onClick={handleNext}
                            disabled={showAnimation || stepLoadingVisible}
                        >
                            Siguiente →
                        </button>
                    ) : (
                        <button
                            className="wizardModal-btn wizardModal-confirm"
                            onClick={handleSubmitFinal}
                            disabled={showAnimation || stepLoadingVisible}
                        >
                            Finalizar
                        </button>
                    )}
                </div>
             </div>
 
         </div>
     );
 }
