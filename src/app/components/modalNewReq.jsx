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
    faCheck,
    faMicrochip,
    faCouch,
    faEye,
    faBoxOpen,
    faDollar,
    faCoffee,
} from "@fortawesome/free-solid-svg-icons";
import TextareaAutosize from "react-textarea-autosize";
import SaveAnimation from "./animationCreateRequisicion";
import { faDailymotion } from "@fortawesome/free-brands-svg-icons";
import api from "../services/axios";
import { endFirstStepStartTwoStep, endTwoStepStartThreeStep } from "../services/camunda";
import { createPortal } from "react-dom";
import LoadingView from "./loadingView";

// 1. Agrega los nuevos campos al initialForm para los tipos de producto
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
            papeleria: false,
            cafeteria: false,
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
    const [showAnimation, setShowAnimation] = useState(false);
    // nuevo estado: indica transición/carga entre pasos
    const [stepLoading, setStepLoading] = useState(false);
    // controla si el overlay está montado (visible en DOM)
    const [stepLoadingVisible, setStepLoadingVisible] = useState(false);
    // controla la clase de salida (fade-out)
    const [stepLoadingExiting, setStepLoadingExiting] = useState(false);
    const [formData, setFormData] = useState(initialForm);
    const [token, setToken] = useState("");
    const [catalogoProductos, setCatalogoProductos] = useState([]);
    const [catalogoLoading, setCatalogoLoading] = useState(false);
    const [catalogoError, setCatalogoError] = useState("");
    const [showProductosModal, setShowProductosModal] = useState(false);
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);



    const isEditMode = Boolean(
        initialData &&
        (initialData.requisicion || initialData.requisicion_id || initialData.id)
    );

    const minStep = isEditMode ? (startStep ?? 2) : 1;
    // Cambia el número máximo de pasos a 3 (ya no hay step 3 separado)
    const maxStep = isEditMode ? 2 : 3;

    useEffect(() => {
        if (typeof window !== "undefined") {
            const t = localStorage.getItem("token");
            setToken(t);
        }
    }, []);

    useEffect(() => {
        if (!open) return;
        const fetchCatalogo = async () => {
            try {
                setCatalogoLoading(true);
                setCatalogoError("");
                const res = await api.get("/api/productos", { headers: { Authorization: token ? `Bearer ${token}` : "" } });
                const data = res.data;
                const lista = Array.isArray(data) ? data : (data ? [data] : []);
                setCatalogoProductos(lista.map(p => {
                    // Asignar grupo según la lógica de negocio
                    let grupo = "";
                    if (p.grupo) {
                        grupo = p.grupo;
                    } else if (p.es_tecnologico ?? p.compra_tecnologica) {
                        grupo = "tec";
                    } else if (p.ergonomico) {
                        grupo = "erg";
                    } else if (p.nombre && p.nombre.toLowerCase().includes("papel")) {
                        grupo = "pap";
                    } else if (p.nombre && p.nombre.toLowerCase().includes("cafe")) {
                        grupo = "caf";
                    }
                    return {
                        id: p.id,
                        nombre: p.nombre,
                        cuenta_contable: p.cuenta_contable,
                        centro_costo: p.centro_costo,
                        es_tecnologico: Boolean(p.es_tecnologico ?? p.compra_tecnologica ?? false),
                        ergonomico: p.ergonomico !== undefined ? Boolean(p.ergonomico) : !Boolean(p.es_tecnologico ?? false),
                        grupo, // <-- Asignar grupo aquí
                    };
                }));
            } catch (err) {
                setCatalogoError("No se pudo cargar el catálogo de productos");
                setCatalogoProductos([]);
            } finally {
                setCatalogoLoading(false);
            }
        };
        fetchCatalogo();
    }, [open, token]);

    useEffect(() => {
        if (!open) return;

        const today = new Date().toISOString().slice(0, 10);

        const initializeForm = async () => {
            // Obtener token
            let userToken = token;
            if (!userToken && typeof window !== "undefined") {
                userToken = localStorage.getItem("token");
            }

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
            setMostrarModalProductos(false);
            setShowAnimation(false);
            setFileName("");

            // Precarga de datos del usuario
            if (userToken) {
                try {
                    const res = await api.get("/api/auth/me", {
                        headers: { Authorization: `Bearer ${userToken}` },
                    });

                    const user = res.data;
                    if (user && (user.nombre || user.area || user.sede)) {
                        setFormData(prev => ({
                            ...prev,
                            solicitante: {
                                ...prev.solicitante,
                                nombre: prev.solicitante.nombre || user.nombre || "",
                                area: prev.solicitante.area || user.area || "",
                                sede: prev.solicitante.sede || user.sede || "",
                            }
                        }));
                    }
                } catch (err) {
                    console.error("Error al obtener datos del usuario:", err);
                }
            }
        };

        initializeForm();
    }, [open, initialData, startStep, token]);

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

        // Validación: cada producto debe ser tecnológico, ergonómico, papelería o cafetería (al menos uno)
        const invalidTipo = formData.productos
            .map((p, i) => ({ p, i }))
            .filter(({ p }) =>
                !Boolean(p.compraTecnologica) &&
                !Boolean(p.ergonomico) &&
                !Boolean(p.papeleria) &&
                !Boolean(p.cafeteria)
            );
        if (invalidTipo.length > 0) {
            const list = invalidTipo
                .map(({ p, i }) => p.nombre ? `${i + 1} (${p.nombre})` : `${i + 1}`)
                .join(", ");
            toast.error(`Cada producto debe ser tecnológico, ergonómico, papelería o cafetería. Revisa los ítems: ${list}`);
            return;
        }

        try {
            setStepLoadingVisible(true);
            setStepLoading(true);
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

                const metaRes = await api.put(
                    `/api/requisiciones/${id}`,
                    metaBody,
                    {
                        headers: { "Content-Type": "application/json" },
                        withCredentials: true
                    }
                );

                if (metaRes.status < 200 || metaRes.status >= 300) {
                    throw new Error("Error actualizando requisición");
                }

                const prodRes = await api.put(
                    `/api/requisiciones/${id}/productos`,
                    { productos: productosPayload },
                    {
                        headers: { "Content-Type": "application/json" },
                        withCredentials: true
                    }
                );
                if (prodRes.status < 200 || prodRes.status >= 300) {
                    throw new Error("Error actualizando productos");
                }

                if (typeof onCreated === "function") onCreated();
                toast.success("Requisición actualizada correctamente");

                // Cerrar la modal al finalizar en modo edición
                if (typeof onClose === "function") onClose();
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

                const res = await api.post("http://localhost:8000/api/requisicion/create",
                    creationPayload,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                if (res.status !== 201) {
                    throw new Error("Error al guardar");
                }

                // 🔸 Llamamos a Camunda para completar la tarea
                try {
                    console.log("🔁 Completando tarea de Camunda (segundo paso)...");
                    await endTwoStepStartThreeStep(finalPayload);
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
        } finally {
            setStepLoading(false);
            setStepLoadingExiting(true);
            setTimeout(() => {
                setStepLoadingExiting(false);
                setStepLoadingVisible(false);
            }, 360);
        }
    };
    const handleCancelWizard = async () => {
        const key = localStorage.getItem("processInstanceKey");

        if (!key) {
            console.log("No hay proceso en curso para cancelar.");
            return;
        }

        try {
            const res = await api.post(`/api/process/${key}/cancel`);

            onClose()
            toast.info("Requisición cancelada correctamente.");

            // Limpia solo cuando se cancela en serio
            localStorage.removeItem("processInstanceKey");

            console.log(`Proceso Camunda ${key} cancelado.`, res.data);

        } catch (err) {
            console.error("Error al cancelar proceso:", err.response?.data || err);

            // mensajes más claros basados en respuesta de Camunda
            const backendMsg = err.response?.data?.response?.detail
                || err.response?.data?.error
                || "No se pudo cancelar el proceso.";

            toast.error(backendMsg);
        }
    };

    const catalogoAgrupado = catalogoProductos.reduce((acc, item) => {
        if (!acc[item.grupo]) acc[item.grupo] = [];
        acc[item.grupo].push(item);
        return acc;
    }, {});


    useEffect(() => {
        if (productoActivo >= formData.productos.length) {
            setProductoActivo(0);
        }
    }, [formData.productos.length]);

    // Al agregar producto, reiniciar categoría seleccionada
    const handleAddProducto = () => {
        const productos = [
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
        ];
        setFormData({ ...formData, productos });
        setProductoActivo(productos.length - 1);
        setCategoriaSeleccionada(null); // <-- Reinicia la categoría al agregar producto
    };

    // En el render del paso 2, reemplaza el onClick del botón de agregar producto:
    // ...
    {
        step === 2 && (
            <div className="papitoGugutata">
                {/* ...existing code... */}
                <div className="containerProductosSerios" style={{ width: "100%" }}>
                    <div className="productoItem" style={{ width: "100%" }}>
                        {/* ...existing code... */}
                    </div>
                </div>
                {/* ...existing code... */}
                <div className="campoListaProductos">
                    {/* ...existing code... */}
                    <div className="containerButtonsProductos">
                        <button
                            className="wizardModal-btn-add fullWidth"
                            onClick={handleAddProducto}
                        >
                            <FontAwesomeIcon icon={faPlus} />
                        </button>
                        {/* ...existing code... */}
                    </div>
                </div>
            </div>
        )
    }
    // ...existing code...

    // Al cambiar de producto activo, si el producto no tiene nombre o no está en la categoría actual, vuelve a categorías
    useEffect(() => {
        if (step === 2) {
            // Si el producto activo no tiene nombre o no está en la categoría seleccionada, mostrar categorías
            const prod = formData.productos[productoActivo];
            if (!prod) return;
            // Si el nombre no está en el catálogo de la categoría seleccionada, volver a categorías
            if (
                categoriaSeleccionada &&
                !((catalogoAgrupado[categoriaSeleccionada] || []).some(p => p.nombre === prod.nombre))
            ) {
                setCategoriaSeleccionada(null);
            }
        }
        // eslint-disable-next-line
    }, [productoActivo]);

    // En el select de productos, asegúrate de mostrar el nombre actual aunque no esté en el catálogo
    // ...existing code...
    {
        categoriaSeleccionada && (
            <div className="seleccionProductoContainer">
                <button className="volverCats" onClick={() => setCategoriaSeleccionada(null)}>
                    ← Volver a categorías
                </button>
                <select
                    value={formData.productos[productoActivo].nombre || ""}
                    onChange={(e) => {
                        const productos = [...formData.productos];
                        const sel = catalogoProductos.find(p => p.nombre === e.target.value);

                        if (sel) {
                            productos[productoActivo].nombre = sel.nombre;
                            productos[productoActivo].centroCosto = sel.centro_costo || "";
                            productos[productoActivo].cuentaContable = sel.cuenta_contable || "";
                            productos[productoActivo].compraTecnologica = sel.grupo === "tec";
                            productos[productoActivo].ergonomico = sel.grupo === "erg";
                            productos[productoActivo].papeleria = sel.grupo === "pap";
                            productos[productoActivo].cafeteria = sel.grupo === "caf";
                        } else {
                            productos[productoActivo].nombre = e.target.value;
                        }
                        setFormData({ ...formData, productos });
                    }}
                >
                    <option value="">Seleccione un producto</option>
                    {/* Mostrar el nombre actual si no está en el catálogo */}
                    {formData.productos[productoActivo].nombre &&
                        !(catalogoAgrupado[categoriaSeleccionada] || []).some(
                            p => p.nombre === formData.productos[productoActivo].nombre
                        ) && (
                            <option value={formData.productos[productoActivo].nombre}>
                                {formData.productos[productoActivo].nombre}
                            </option>
                        )}
                    {(catalogoAgrupado[categoriaSeleccionada] || []).map((p, idx) => (
                        <option key={`${p.id ?? 'idx' + idx}-${p.nombre}`} value={p.nombre}>{p.nombre}</option>
                    ))}
                </select>
            </div>
        )
    }
    // ...existing code...

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

    const handleNext = async () => {
        const next = Math.min(maxStep, step + 1);
        if (next === step) return;
        try {
            setStepLoadingVisible(true);
            setStepLoading(true);
            const ok = await handleBeforeEnterStep(step, next);
            if (ok) setStep(next);
        } catch (err) {
            console.error("Error en transición siguiente:", err);
        } finally {
            setStepLoading(false);
            setStepLoadingExiting(true);
            setTimeout(() => {
                setStepLoadingExiting(false);
                setStepLoadingVisible(false);
            }, 360);
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
            // Validación al avanzar de Paso 1 -> Paso 2:
            if (currentStep === 1 && nextStep === 2) {
                const payload = {
                    bienvenida: "Inicio del proceso de compras",
                };
                await endFirstStepStartTwoStep(payload);
            }
            // Validación al avanzar de Paso 2 -> Paso 3 (ahora validaciones de productos y presupuesto)
            if (currentStep === 2 && nextStep === 3) {
                // Validación: cada producto debe ser tecnológico, ergonómico, papelería o cafetería (al menos uno)
                const invalid = formData.productos
                    .map((p, i) => ({ p, i }))
                    .filter(({ p }) =>
                        !Boolean(p.compraTecnologica) &&
                        !Boolean(p.ergonomico) &&
                        !Boolean(p.papeleria) &&
                        !Boolean(p.cafeteria)
                    );
                if (invalid.length > 0) {
                    const names = invalid
                        .map(({ p, i }) => p.nombre ? `${i + 1} (${p.nombre})` : `${i + 1}`)
                        .join(", ");
                    toast.error(`Cada producto debe ser tecnológico, ergonómico, papelería o cafetería. Revisa los ítems: ${names}`);
                    return false;
                }
                // Validación: todos los productos deben tener valor estimado, centro de costo y cuenta contable
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
        } catch (err) {
            console.error("Error al cambiar de paso:", err);
            toast.error("No se pudo avanzar al siguiente paso.");
            return false;
        }
        return true;
    };

    const handleCloseModal = () => {
        // evitar cerrar durante una transición/animación
        if (stepLoadingVisible) return;
        handleCancelWizard();
    };

    const pasos = [
        {
            title: "Datos del solicitante",
            description: "Información básica de la solicitud.",
        },
        {
            title: "Detalles del producto",
            description: "Detalles de lo que necesitas.",
        },
        {
            title: "Resumen y finalización",
            description: "Revisa y confirma tu solicitud.",
        },
    ];

    const getBusinessDays = (start, end) => {
        let dateStart = new Date(start);
        let dateEnd = new Date(end);

        let count = 0;

        while (dateStart <= dateEnd) {
            const day = dateStart.getDay(); // 0 domingo, 6 sábado
            if (day !== 0 && day !== 6) count++;
            dateStart.setDate(dateStart.getDate() + 1);
        }

        return count;
    };


    const modalContent = (
        <div className="wizardModal-overlay">
            <div className="wizardModal-container">
                {/* Overlay de carga entre pasos */}
                {stepLoadingVisible && (
                    <div
                        className={`loading-container ${stepLoadingExiting ? "fade-out" : "fade-in"}`} style={{ position: "absolute", inset: 0, zIndex: 40, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.92)" }}
                    >
                        <LoadingView />
                    </div>
                )}

                <div className="wizardModal-header">
                    <div className="textHeaderNew">
                        <h2>Nueva Requisición</h2>
                        <p>Crea una solicitud de compra</p>
                    </div>
                    <div className="buttonCloseReq">
                        <button className="wizardModal-close" onClick={handleCloseModal}>
                            ✕
                        </button>
                    </div>
                </div>

                <div className="elpapadepapas">
                    <aside className="stepsSidebar">
                        <div className="stepsContainer">
                            {pasos.map((paso, index) => {
                                const id = index + 1;
                                const esActivo = step === id;
                                const esCompletado = step > id;

                                return (
                                    <div
                                        key={id}
                                        className={`stepItem ${esActivo ? "stepItemActive" : "stepItemInactive"}`}
                                    >
                                        {/* Line connector */}
                                        {index < pasos.length - 1 && (
                                            <div
                                                className={`stepConnector ${esCompletado ? "stepConnectorActive" : "stepConnectorInactive"
                                                    }`}
                                            />
                                        )}

                                        {/* Step circle */}
                                        <div
                                            className={`stepNumber ${esCompletado
                                                ? "stepNumberCompleted"
                                                : esActivo
                                                    ? "stepNumberActive"
                                                    : "stepNumberPending"
                                                }`}
                                        >
                                            {esCompletado ? <FontAwesomeIcon icon={faCheck} size={16} /> : id}
                                        </div>

                                        {/* Content */}
                                        <div>
                                            <h3
                                                className={`stepTitle ${step >= id ? "stepTitleActive" : "stepTitleInactive"
                                                    }`}
                                            >
                                                {paso.title}
                                            </h3>

                                            {/* ⭐ Nueva descripción debajo del título */}
                                            <p className="stepSubtitle">
                                                {paso.description}
                                            </p>

                                            {/* Mantiene la lógica del primer código */}
                                            <p className="stepDescription">
                                                {esActivo ? "" : esCompletado ? true : ""}
                                            </p>

                                            {esActivo && <span className="stepBadge">En progreso</span>}
                                        </div>
                                    </div>

                                );
                            })}
                        </div>
                        {step === 2 && (
                            <div className="campoListaProductos">
                                <br />
                                <h3 className="tittleOneUserNew">PRODUCTOS</h3>
                                <div className="productoNavVertical">
                                    <div className="productoListScroll">
                                        {formData.productos.map((prod, index) => (
                                            <button
                                                key={index}
                                                className={`productoTabVertical ${index === productoActivo ? "active" : ""}`}
                                                onClick={() => setProductoActivo(index)}
                                            >
                                                <FontAwesomeIcon className="iconListFiles" icon={faFile} />
                                                {prod.nombre || `Producto ${index + 1}`}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="containerButtonsProductos">
                                        <button
                                            className="wizardModal-btn-add fullWidth"
                                            onClick={handleAddProducto}
                                        >
                                            <FontAwesomeIcon icon={faPlus} />
                                        </button>

                                        <button
                                            className="wizardModal-btn-remove fullWidth"
                                            disabled={formData.productos.length <= 1}
                                            onClick={() => {
                                                const productos = formData.productos.filter(
                                                    (_, i) => i !== productoActivo
                                                );
                                                setFormData({ ...formData, productos });
                                                setProductoActivo((prev) => (prev > 0 ? prev - 1 : 0));
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </aside>

                    <div className="wizardModal-body">
                        {step === 1 && (
                            <div className="papitoGugutata">
                                <h3 className="tittleOneUserNew">Información Personal</h3>
                                <div className="inputsDatos">
                                    <div className="inputAndLabelUsersGestion">
                                        <div className="campoTextAndIcon">
                                            <FontAwesomeIcon icon={faUser} className="iconUserCreate" />
                                            <label>Nombre del solicitante</label>
                                        </div>
                                        <div className="inputAndIconUserGest">

                                            <input type="text" placeholder="Ej. Juan Pérez" value={formData.solicitante.nombre}
                                                readOnly
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
                                    <div className="inputAndLabelUsersGestion">
                                        <div className="campoTextAndIcon">
                                            <FontAwesomeIcon icon={faCalendar} className="iconUserCreate" />
                                            <label>Fecha de solicitud</label>
                                        </div>
                                        <div className="inputAndIconUserGest">
                                            <input type="date" value={formData.solicitante.fecha}
                                                readOnly
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
                                    <div className="inputAndLabelUsersGestion">
                                        <div className="campoTextAndIcon">
                                            <FontAwesomeIcon icon={faCalendar} className="iconUserCreate" />
                                            <label>Fecha requerida de entrega<label className="obligatorio">*</label></label>
                                        </div>
                                        <div className="inputAndIconUserGest">
                                            <input
                                                type="date"
                                                value={formData.solicitante.fechaRequeridoEntrega}
                                                min={new Date().toISOString().split("T")[0]}
                                                onChange={(e) => {
                                                    const nuevaFechaEntrega = e.target.value;
                                                    const fechaSolicitud = formData.solicitante.fecha;

                                                    let dias = "";

                                                    // si hay ambas fechas, calcular días hábiles
                                                    if (fechaSolicitud && nuevaFechaEntrega >= fechaSolicitud) {
                                                        dias = getBusinessDays(fechaSolicitud, nuevaFechaEntrega);
                                                    }

                                                    setFormData({
                                                        ...formData,
                                                        solicitante: {
                                                            ...formData.solicitante,
                                                            fechaRequeridoEntrega: nuevaFechaEntrega,
                                                            tiempoAproximadoGestion: dias,
                                                        },
                                                    });
                                                }}
                                            />

                                        </div>
                                    </div>
                                    <div className="inputAndLabelUsersGestion">
                                        <div className="campoTextAndIcon">
                                            <FontAwesomeIcon
                                                icon={faClock}
                                                className="iconUserCreate"
                                            />
                                            <label>Tiempo aproximado de gestión (SLA)<label className="obligatorio">*</label></label>
                                        </div>
                                        <div className="inputAndIconUserGest">
                                            <input
                                                type="text"
                                                placeholder="(cantidad) días hábiles"
                                                value={
                                                    formData.solicitante.tiempoAproximadoGestion
                                                        ? `${formData.solicitante.tiempoAproximadoGestion} ${formData.solicitante.tiempoAproximadoGestion == 1 ? "día" : "días"}`
                                                        : ""
                                                }
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                    <div className="inputAndLabelUsersGestion">
                                        <div className="campoTextAndIcon">
                                            <FontAwesomeIcon icon={faClipboard} className="iconUserCreate" />
                                            <label>
                                                Área
                                            </label>
                                        </div>
                                        <div className="inputAndIconUserGest">
                                            <input
                                                type="text"
                                                placeholder="Ej. Compras"
                                                value={getAreaNombre(formData.solicitante.area) || ""}
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                    <div className="inputAndLabelUsersGestion">
                                        <div className="campoTextAndIcon">
                                            <FontAwesomeIcon icon={faBuilding} className="iconUserCreate" />
                                            <label>
                                                Sede
                                            </label>
                                        </div>
                                        <div className="inputAndIconUserGest">
                                            <input
                                                type="text"
                                                placeholder="Ej. Cundinamarca"
                                                value={getSedeNombre(formData.solicitante.sede) || ""}
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                    <div className="inputAndLabelUsersGestion">
                                        <div className="campoTextAndIcon">
                                            <FontAwesomeIcon
                                                icon={faExclamationTriangle}
                                                className="iconUserCreate"
                                            />
                                            <label>Urgencia<label className="obligatorio">*</label></label>
                                        </div>
                                        <div className="inputAndIconUserGest">
                                            <select
                                                value={formData.solicitante.urgencia}
                                                onChange={(e) => {
                                                    const urgencia = e.target.value;

                                                    setFormData({
                                                        ...formData,
                                                        solicitante: {
                                                            ...formData.solicitante,
                                                            urgencia,
                                                            justificacion: urgencia === "Alta" ? formData.solicitante.justificacion : "",
                                                        },
                                                    });
                                                }}
                                            >
                                                <option value="">Seleccione urgencia</option>
                                                <option value="Alta">Alta</option>
                                                <option value="Media">Media</option>
                                                <option value="Baja">Baja</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="inputAndLabelUsersGestion">
                                        <div className="campoTextAndIcon">
                                            <FontAwesomeIcon icon={faBalanceScale} className="iconUserCreate" />
                                            <label>Justificación de la compra</label>
                                        </div>
                                        <div className="inputAndIconUserGest">
                                            <input
                                                type="text"
                                                placeholder="Solo si la urgencia es alta"
                                                value={formData.solicitante.justificacion}
                                                disabled={formData.solicitante.urgencia !== "Alta"}   // 👈 AQUÍ
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        solicitante: {
                                                            ...formData.solicitante,
                                                            justificacion: e.target.value,
                                                        },
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>

                                </div>
                                <div className="campoPrespuestado">
                                    <div className="firsInfo">
                                        <FontAwesomeIcon icon={faDollar} />
                                        <p>¿Está en presupuesto?</p><label className="obligatorio">*</label>
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
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PASO 2: DETALLES DEL PRODUCTO + PRESUPUESTO */}
                        {step === 2 && (
                            <div className="papitoGugutata">
                                <h3 className="tittleOneUserNew">productos o servicios</h3>
                                <div className="containerProductosSerios" style={{ width: "100%" }}>

                                    <div className="productoItem" style={{ width: "100%" }}>
                                        <div className="inputsItems">
                                            <div className="inputAndLabelUsersGestion">
                                                <div className="campoTextAndIcon">
                                                    <FontAwesomeIcon icon={faCubes} className="iconUserCreate" />
                                                    <label>Producto / Servicio<label className="obligatorio">*</label></label>
                                                </div>
                                                <div className="inputAndIconUserGest">
                                                    {catalogoLoading ? (
                                                        <select disabled value="">
                                                            <option value="">Cargando catálogo...</option>
                                                        </select>
                                                    ) : catalogoError ? (
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
                                                    ) : (
                                                        <div>
                                                            {/* --- CATEGORÍAS Y SELECT PERSONALIZADO --- */}
                                                            {!categoriaSeleccionada && (
                                                                <div className="categoriasLista">
                                                                    {[
                                                                        { id: "tec", label: "Tecnológicos" },
                                                                        { id: "erg", label: "Ergonómicos" },
                                                                        { id: "pap", label: "Papelería" },
                                                                        { id: "caf", label: "Cafetería" }
                                                                    ].map(cat => (
                                                                        <button
                                                                            key={cat.id}
                                                                            onClick={() => setCategoriaSeleccionada(cat.id)}
                                                                            className="categoriaButton"
                                                                        >
                                                                            {cat.label}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {categoriaSeleccionada && (
                                                                <div className="seleccionProductoContainer">
                                                                    <button className="volverCats" onClick={() => setCategoriaSeleccionada(null)}>
                                                                        ← Volver a categorías
                                                                    </button>

                                                                    <select
                                                                        value={formData.productos[productoActivo].nombre || ""}
                                                                        onChange={(e) => {
                                                                            const productos = [...formData.productos];
                                                                            const sel = catalogoProductos.find(p => p.nombre === e.target.value);

                                                                            if (sel) {
                                                                                productos[productoActivo].nombre = sel.nombre;
                                                                                productos[productoActivo].centroCosto = sel.centro_costo || "";
                                                                                productos[productoActivo].cuentaContable = sel.cuenta_contable || "";
                                                                                productos[productoActivo].compraTecnologica = sel.grupo === "tec";
                                                                                productos[productoActivo].ergonomico = sel.grupo === "erg";
                                                                                productos[productoActivo].papeleria = sel.grupo === "pap";
                                                                                productos[productoActivo].cafeteria = sel.grupo === "caf";
                                                                            } else {
                                                                                productos[productoActivo].nombre = e.target.value;
                                                                            }
                                                                            setFormData({ ...formData, productos });
                                                                        }}
                                                                    >
                                                                        <option value="">Seleccione un producto</option>
                                                                        {/* Mostrar el nombre actual si no está en el catálogo */}
                                                                        {formData.productos[productoActivo].nombre &&
                                                                            !(catalogoAgrupado[categoriaSeleccionada] || []).some(
                                                                                p => p.nombre === formData.productos[productoActivo].nombre
                                                                            ) && (
                                                                                <option value={formData.productos[productoActivo].nombre}>
                                                                                    {formData.productos[productoActivo].nombre}
                                                                                </option>
                                                                            )}
                                                                        {(catalogoAgrupado[categoriaSeleccionada] || []).map((p, idx) => (
                                                                            <option key={`${p.id ?? 'idx' + idx}-${p.nombre}`} value={p.nombre}>{p.nombre}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            )}

                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="inputsDatos">
                                            <div className="inputAndLabelUsersGestion">
                                                <div className="campoTextAndIcon">
                                                    <FontAwesomeIcon icon={faClipboard} className="icon" />
                                                    <label>Descripción<label className="obligatorio">*</label></label>
                                                </div>
                                                <div className="inputAndIconUserGest">
                                                    <TextareaAutosize
                                                        className="textAreaCustom"
                                                        placeholder="Detalles del producto solicitado"
                                                        value={formData.productos[productoActivo].descripcion}
                                                        onChange={(e) => {
                                                            const productos = [...formData.productos];
                                                            productos[productoActivo].descripcion = e.target.value;
                                                            setFormData({ ...formData, productos });
                                                        }}
                                                        // Permitir siempre editar descripción
                                                        disabled={false}
                                                    />
                                                </div>
                                            </div>
                                            {/* --- CANTIDAD --- */}
                                            <div className="inputAndLabelUsersGestion">
                                                <div className="campoTextAndIcon">
                                                    <FontAwesomeIcon icon={faListOl} className="icon" />
                                                    <label>Cantidad<label className="obligatorio">*</label></label>
                                                </div>
                                                <div className="inputAndIconUserGest">
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
                                            <div className="inputAndLabelUsersGestion">
                                                <div className="campoTextAndIcon">
                                                    <FontAwesomeIcon icon={faMoneyBill} className="icon" />
                                                    <label>Valor estimado<label className="obligatorio">*</label></label>
                                                </div>
                                                <div className="inputAndIconUserGest">
                                                    <input
                                                        type="text"
                                                        placeholder="Valor estimado"
                                                        value={formData.productos[productoActivo].valorEstimado || ""}
                                                        onChange={(e) => {
                                                            const raw = e.target.value;
                                                            const num = parseCurrency(raw);
                                                            const productos = [...formData.productos];
                                                            productos[productoActivo].valorEstimado = raw.trim() === "" ? "" : formatCurrency(num);
                                                            setFormData({ ...formData, productos });
                                                        }}
                                                        onBlur={(e) => {
                                                            const raw = e.target.value;
                                                            const num = parseCurrency(raw);
                                                            const productos = [...formData.productos];
                                                            productos[productoActivo].valorEstimado = raw.trim() === "" ? "" : formatCurrency(num);
                                                            setFormData({ ...formData, productos });
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            {/* --- ANEXOS --- */}
                                            <div className="inputAndLabelUsersGestion">
                                                <div className="campoTextAndIcon">
                                                    <FontAwesomeIcon icon={faPaperclip} className="icon" />
                                                    <label>Anexos</label>
                                                </div>
                                                <div className="inputAndIconUserGests">
                                                    <label
                                                        htmlFor={`fileUpload-${productoActivo}`}
                                                        className="btn-upload"
                                                    >
                                                        Seleccionar archivo
                                                    </label>
                                                    <input
                                                        type="file"
                                                        id={`fileUpload-${productoActivo}`}
                                                        className="hiddenFileInput"
                                                        onChange={(e) => {
                                                            const file = e.target.files[0];
                                                            if (file) {
                                                                const productos = [...formData.productos];
                                                                productos[productoActivo].file = file;
                                                                setFormData({ ...formData, productos });
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            {/* --- CENTRO DE COSTO --- */}
                                            <div className="inputAndLabelUsersGestion">
                                                <div className="campoTextAndIcon">
                                                    <FontAwesomeIcon icon={faClipboard} className="icon" />
                                                    <label>Centro de costo / Orden interna</label>
                                                </div>
                                                <div className="inputAndIconUserGest">
                                                    <input
                                                        type="text"
                                                        placeholder="Ej. CC-104 / OI-245"
                                                        value={formData.productos[productoActivo].centroCosto}
                                                        onChange={(e) => {
                                                            const productos = [...formData.productos];
                                                            productos[productoActivo].centroCosto = e.target.value;
                                                            setFormData({ ...formData, productos });
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            {/* --- CUENTA CONTABLE --- */}
                                            <div className="inputAndLabelUsersGestion">
                                                <div className="campoTextAndIcon">
                                                    <FontAwesomeIcon icon={faMoneyBill} className="icon" />
                                                    <label>Cuenta contable o código de material</label>
                                                </div>
                                                <div className="inputAndIconUserGest">
                                                    <input
                                                        type="text"
                                                        placeholder="Ej. 5120-Equipos"
                                                        value={formData.productos[productoActivo].cuentaContable}
                                                        onChange={(e) => {
                                                            const productos = [...formData.productos];
                                                            productos[productoActivo].cuentaContable = e.target.value;
                                                            setFormData({ ...formData, productos });
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <br />
                                        {/*
                                        <h3 className="tittleOneUserNew">tipo de producto o servicio</h3>
                                        <div className="firsInfoTwo">
                                            <div className="tecnologicoButton">
                                                <div className="iconTecno">
                                                    <FontAwesomeIcon icon={faMicrochip} />
                                                </div>
                                                <label>
                                                    Tecnológico
                                                </label>
                                                <input
                                                    type="checkbox"
                                                    checked={!!formData.productos[productoActivo].compraTecnologica}
                                                    onChange={(e) => {
                                                        const productos = [...formData.productos];
                                                        productos[productoActivo].compraTecnologica = e.target.checked;
                                                        setFormData({ ...formData, productos });
                                                    }}
                                                />
                                            </div>
                                            <div className="ergonomicoButton">
                                                <div className="iconErgo">
                                                    <FontAwesomeIcon icon={faCouch} />
                                                </div>
                                                <label>
                                                    Ergonómico
                                                </label>
                                                <input
                                                    type="checkbox"
                                                    checked={!!formData.productos[productoActivo].ergonomico}
                                                    onChange={(e) => {
                                                        const productos = [...formData.productos];
                                                        productos[productoActivo].ergonomico = e.target.checked;
                                                        setFormData({ ...formData, productos });
                                                    }}
                                                />
                                            </div>
                                            <div className="ergonomicoButton">
                                                <div className="iconErgo">
                                                    <FontAwesomeIcon icon={faClipboard} />
                                                </div>
                                                <label>
                                                    Papelería
                                                </label>
                                                <input
                                                    type="checkbox"
                                                    checked={!!formData.productos[productoActivo].papeleria}
                                                    onChange={(e) => {
                                                        const productos = [...formData.productos];
                                                        productos[productoActivo].papeleria = e.target.checked;
                                                        setFormData({ ...formData, productos });
                                                    }}
                                                />
                                            </div>
                                            <div className="ergonomicoButton">
                                                <div className="iconErgo">
                                                    <FontAwesomeIcon icon={faCoffee} />
                                                </div>
                                                <label>
                                                    Cafetería
                                                </label>
                                                <input
                                                    type="checkbox"
                                                    checked={!!formData.productos[productoActivo].cafeteria}
                                                    onChange={(e) => {
                                                        const productos = [...formData.productos];
                                                        productos[productoActivo].cafeteria = e.target.checked;
                                                        setFormData({ ...formData, productos });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        */}
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

                        {/* PASO 3: RESUMEN */}
                        {step === 3 && (
                            <div className="papitoGugutata">
                                <h3 className="tittleOneUserNew">resumen de solicitud</h3>
                                <br />
                                <div className="campoTotales">
                                    <div className="totalesCards">
                                        <p className="totalP">{formData.productos.filter((p) => p.ergonomico).length}</p>
                                        <p className="textTotal">Ergonómicos</p>
                                    </div>
                                    <div className="totalesCards">
                                        <p className="totalP">{formData.productos.filter((p) => p.papeleria).length}</p>
                                        <p className="textTotal">Papelería</p>
                                    </div>
                                    <div className="totalesCards">
                                        <p className="totalP">{formData.productos.filter((p) => p.cafeteria).length}</p>
                                        <p className="textTotal">Cafetería</p>
                                    </div>
                                    <div className="totalesCards">
                                        <p className="totalP">{formData.productos.filter((p) => p.compraTecnologica).length}</p>
                                        <p className="textTotal">Tecnológicos</p>
                                    </div>
                                </div>
                                <br />
                                <div className="totalProdAndPrice">
                                    <div className="totalesCards">
                                        <p className="totalP">{formData.productos.length}</p>
                                        <p className="textTotal">Productos</p>
                                    </div>
                                    <div className="totalesCards">
                                        <p className="totalP">{formatCurrency(getTotalEstimado(false))}</p>
                                        <p className="textTotal">Valor estimado</p>
                                    </div>
                                </div>
                                <br />
                                <div className="superaOno">
                                    {getTotalEstimado(true) > UMBRAL_10_SM ? (
                                        <div className="noSupera">
                                            <p style={{ color: "#862633", fontWeight: "bold" }}>
                                                La solicitud supera el valor de 10 salarios mínimos legales vigentes.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="siSupera">
                                            <p style={{ color: "#3DC13C", fontWeight: "bold" }}>
                                                La solicitud no supera el valor de 10 salarios mínimos legales vigentes.
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <br />
                                <h3 className="tittleOneUserNew">productos asociados</h3>
                                <div className="resumenSection" style={{ textAlign: "center" }}>
                                    {formData.productos.map((prod, index) => {
                                        return (
                                            <div key={index} className="productos">
                                                <div className="leftInfoProduct">
                                                    <div className="nameIconProduct">
                                                        <FontAwesomeIcon icon={faBoxOpen} className="iconProduct" />
                                                        <div className="nameAndTags">
                                                            <h1 className="nameProduct">{prod.nombre}</h1>
                                                            <div className="tagsProducto">
                                                                <div className={`tagOption ${prod.compraTecnologica ? "active" : ""}`}>
                                                                    Tecnológico
                                                                </div>
                                                                <div className={`tagOption ${prod.ergonomico ? "active" : ""}`}>
                                                                    Ergonómico
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="subtitlesProductos">

                                                    </div>
                                                </div>
                                                <div className="rightInfoProduct">
                                                    <h1>{prod.valorEstimado}</h1>
                                                    <p className="subtitlesProductos">Cantidad: {prod.cantidad}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                                {showProductosModal && (
                                    <div className="modalOverlay">
                                        <div className="modalSelectProductos">
                                            <h2 style={{ color: "#1d5da8" }}>Productos solicitados</h2>
                                            <div className="tablaProduc">
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
                                            <button
                                                className="closeModalBtn"
                                                style={{ marginTop: 20 }}
                                                onClick={() => setShowProductosModal(false)}
                                            >
                                                Cerrar
                                            </button>
                                        </div>
                                    </div>
                                )}
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

    // Usar portal si existe document
    if (typeof window !== "undefined" && document.body) {
        return createPortal(modalContent, document.body);
    }
    return modalContent;
}
