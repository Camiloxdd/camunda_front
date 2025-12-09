"use client";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "../styles/views/ApprovalModal.css";
import api from "../services/axios";
import { approvePendingSingle, startThreeStep } from "../services/camunda";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faFile, faWarning } from "@fortawesome/free-solid-svg-icons";
import TimeLap from "./timeLap";

export default function ApprovalModal({ requisicion, onClose, onApproved, user, token: tokenProp }) {
    const [detalles, setDetalles] = useState({
        currentUser: user,
        requisicion: {},
        productos: [],
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [decisiones, setDecisiones] = useState({});
    const [token, setToken] = useState("");
    const [puedeAprobar, setPuedeAprobar] = useState(false);
    const [yaAprobaste, setYaAprobaste] = useState(false);
    const [actionLoadingVisible, setActionLoadingVisible] = useState(false);
    const [actionLoadingExiting, setActionLoadingExiting] = useState(false);
    const [rejectedIds, setRejectedIds] = useState(new Set());

    useEffect(() => {
        if (tokenProp) {
            setToken(tokenProp);
            return;
        }
        if (typeof window !== "undefined") {
            const storedToken = localStorage.getItem("token") || "";
            setToken(storedToken);
        }
    }, [tokenProp]);

    useEffect(() => {
        const fetchDetalles = async () => {
            try {
                const res = await api.get(
                    `http://localhost:8000/api/requisiciones/${requisicion.requisicion_id}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                const data = await res.data;

                // Obtener aprobadores y determinar el aprobador actual (por sesión y requisición)
                const apr = await api.get(
                    `/api/requisiciones/${requisicion.requisicion_id}/aprobacion`,
                    { headers: { Authorization: token ? `Bearer ${token}` : "" } }
                );
                const aprData = apr.data || {};
                const approvers = aprData.approvers || aprData.aprobadores || [];

                // Buscar el aprobador de la sesión actual
                const uname = (user?.nombre || "").toLowerCase().trim();
                const urol = (user?.rol || user?.cargo || "").toLowerCase().trim();
                const aprobadorSesion = approvers.find(a =>
                    (String(a.nombre_aprobador || "").toLowerCase().trim() === uname) ||
                    (String(a.rol_aprobador || "").toLowerCase().trim() === urol)
                );

                // Solo puede aprobar si es el aprobador de la sesión, su estado es "pendiente" y visible
                const puedeAprobarAhora = !!aprobadorSesion &&
                    String(aprobadorSesion.estado).toLowerCase() === "pendiente" &&
                    (aprobadorSesion.visible === 1 || aprobadorSesion.visible === true);
                setPuedeAprobar(puedeAprobarAhora);

                // Filtrar productos relevantes según el rol
                const technoRoles = ["dicTYP", "gerTyC"];
                const sstRoles = ["dicSST", "gerSST"];
                const cargo = user?.cargo || "";

                let productosRelevantes = (data.productos || []);
                if (technoRoles.includes(cargo)) {
                    productosRelevantes = productosRelevantes.filter(p => p.compra_tecnologica === 1 || p.compra_tecnologica === true);
                } else if (sstRoles.includes(cargo)) {
                    productosRelevantes = productosRelevantes.filter(p => p.ergonomico === 1 || p.ergonomico === true);
                }

                setDetalles(prev => ({
                    currentUser: user,
                    requisicion: data.requisicion,
                    productos: productosRelevantes,
                    aprobadorSesion: aprobadorSesion,
                }));

                // Inicializar decisiones para todos los productos relevantes
                const init = {};
                (productosRelevantes || []).forEach((p) => {
                    init[p.id] = false;
                });
                setDecisiones(init);

                // 🔥 Solo marcar yaAprobaste si el aprobador tiene estado "aprobada" Y TODOS sus productos relevantes tienen aprobado/rechazado
                let yaAprobasteFinal = false;
                if (aprobadorSesion && String(aprobadorSesion.estado).toLowerCase() === "aprobada") {
                    // Verifica que todos los productos relevantes tengan aprobado/rechazado
                    const todosDecididos = productosRelevantes.length > 0 &&
                        productosRelevantes.every(
                            (p) => p.aprobado === "aprobado" || p.aprobado === "rechazado"
                        );
                    yaAprobasteFinal = todosDecididos;
                }
                setYaAprobaste(yaAprobasteFinal);

            } catch (err) {
                console.error("❌ Error cargando detalles:", err);
                setPuedeAprobar(false);
                setYaAprobaste(false);
            } finally {
                setLoading(false);
            }
        };

        fetchDetalles();
    }, [requisicion, token, user]);

    const isEditableForUser = (product) => {
        const cargo = user?.cargo || "";
        const technoRoles = ["dicTYP", "gerTyC"];
        const sstRoles = ["dicSST", "gerSST"];
        if (technoRoles.includes(cargo)) return !!product.compra_tecnologica;
        if (sstRoles.includes(cargo)) return !!product.ergonomico;
        return true;
    };

    const toggleDecision = (productoId, product) => {
        if (!isEditableForUser(product)) return;
        if (rejectedIds.has(productoId)) return;
        setDecisiones((prev) => ({
            ...prev,
            [productoId]: !prev[productoId],
        }));
    };

    const handleGuardar = async () => {
        try {
            const editableAll = (detalles.productos || []).filter((p) => isEditableForUser(p));
            const editable = editableAll.filter((p) => !rejectedIds.has(p.id));

            if (editable.length === 0) {
                toast.warn("No hay items editables para aprobar.");
                return;
            }

            const notSelected = editable.filter((p) => !decisiones[p.id]);
            if (notSelected.length > 0) {
                toast.warn("Debes seleccionar todos los items de tu área antes de aprobar.");
                return;
            }

            const confirmed = await confirmToast("¿Confirmas que deseas aprobar los items seleccionados?", { confirmLabel: "Aprobar", cancelLabel: "Cancelar", confirmColor: "#16a34a" });
            if (!confirmed) return;
            setSaving(true);
            setActionLoadingVisible(true);

            const nowIso = new Date().toISOString();
            const body = {
                decisiones: editable.map((p) => {
                    const currentlyApproved = !!decisiones[p.id];
                    const previouslyApproved =
                        p.aprobado === "aprobado" || p.aprobado === 1 || p.aprobado === "true";
                    let fecha_aprobado = null;
                    if (currentlyApproved) {
                        fecha_aprobado = previouslyApproved ? (p.fecha_aprobado || nowIso) : nowIso;
                    } else {
                        fecha_aprobado = null;
                    }
                    return {
                        id: p.id,
                        aprobado: currentlyApproved,
                        fecha_aprobado,
                    };
                }),
            };

            const res = await api.put(
                `/api/requisiciones/${requisicion.requisicion_id}/aprobar-items`,
                body,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "X-User-Name": detalles.currentUser?.nombre,
                        "X-User-Area": detalles.currentUser?.area,
                    },
                }
            );
            const data = res.data;
            toast.success(data.message || "Aprobaciones registradas");

            try {
                const salarioMinimo = Number(process.env.NEXT_PUBLIC_SALARIO_MINIMO) || 1160000;
                const montoTotal = Number(detalles.requisicion?.valor_total ?? 0);
                const esMayor = montoTotal >= salarioMinimo * 10;

                const filas = (detalles.productos || []).map((p) => ({
                    id: p.id,
                    cantidad: p.cantidad,
                    valor_estimado: p.valor_estimado,
                    compra_tecnologica: !!p.compra_tecnologica,
                    ergonomico: !!p.ergonomico,
                    presupuestada: !!p.presupuestada,
                }));

                const camundaVars = {
                    filas,
                    siExiste: filas.length > 0,
                    purchaseTecnology: filas.some((f) => f.compra_tecnologica && decisiones[f.id]),
                    sstAprobacion: filas.some((f) => f.ergonomico && decisiones[f.id]),
                    purchaseAprobated: filas.some((f) => f.presupuestada),
                    esMayor,
                };

                const processInstanceKey =
                    detalles.requisicion?.processInstanceKey ||
                    detalles.requisicion?.process_instance_key ||
                    detalles.requisicion?.process_key ||
                    null;
                const currentRole = detalles.currentUser?.cargo || null;

                if (!esMayor) {
                    await approvePendingSingle(camundaVars, { processInstanceKey });
                    toast.info("Se solicitó aprobación de tareas pendientes.");
                } else {
                    await startThreeStep(camundaVars, { role: currentRole, processInstanceKey });
                    toast.info("Se completó la userTask correspondiente.");
                }
            } catch (err) {
                console.error("Error al llamar a Camunda:", err);
                toast.warn("Las aprobaciones se registraron, pero Camunda no se actualizó automáticamente.");
            }

            onApproved();
            // 🔥 Recargar detalles para actualizar el estado del aprobador y productos
            await reloadDetalles();
            setActionLoadingExiting(true);
            setTimeout(() => {
                setActionLoadingExiting(false);
                setActionLoadingVisible(false);
                onClose();
            }, 360);
        } catch (err) {
            console.error("Error al guardar:", err);
            toast.error("No se pudo guardar las aprobaciones");
            setActionLoadingVisible(false);
        } finally {
            setSaving(false);
        }
    };

    const handleRechazar = async () => {
        try {
            const seleccionados = (detalles.productos || []).filter(
                (p) => isEditableForUser(p) && decisiones[p.id] === true
            );
            if (seleccionados.length === 0) {
                toast.warn("Selecciona al menos un producto de tu área para rechazar.");
                return;
            }

            const confirmed = await confirmToast("¿Confirmas que deseas rechazar los items seleccionados?", { confirmLabel: "Rechazar", cancelLabel: "Cancelar", confirmColor: "#dc2626", background: "#ef4444" });
            if (!confirmed) return;
            setSaving(true);
            setActionLoadingVisible(true);

            const nowIso = new Date().toISOString();
            const decisionesParaEnviar = seleccionados.map((p) => ({
                id: p.id,
                aprobado: false,
                fecha_aprobado: nowIso,
            }));

            const body = {
                decisiones: decisionesParaEnviar,
            };

            const res = await api.put(
                `/api/requisiciones/${requisicion.requisicion_id}/aprobar-items`,
                body,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "X-User-Name": detalles.currentUser?.nombre,
                        "X-User-Area": detalles.currentUser?.area,
                    },
                }
            );
            const data = res.data;
            toast.success(data.message || "Rechazo registrado correctamente");

            // Actualizar UI
            setDetalles((prev) => ({
                ...prev,
                productos: prev.productos.filter((p) => !seleccionados.some((s) => s.id === p.id)),
            }));
            setDecisiones((prev) => {
                const copy = { ...prev };
                seleccionados.forEach((p) => { delete copy[p.id]; });
                return copy;
            });
            setRejectedIds((prev) => {
                const newSet = new Set(prev);
                seleccionados.forEach((d) => newSet.add(d.id));
                return newSet;
            });

            // Cerrar modal
            setActionLoadingExiting(true);
            setTimeout(() => {
                setActionLoadingExiting(false);
                setActionLoadingVisible(false);
                onApproved();
                onClose();
            }, 360);

        } catch (err) {
            console.error("Error al registrar rechazo:", err);
            toast.error("No se pudo registrar el rechazo");
            setActionLoadingVisible(false);
            setSaving(false);
        }
    };

    const handleAprobaSingle = async (productoId) => {
        try {
            const producto = detalles.productos.find(p => p.id === productoId);
            if (!producto) return;

            const confirmed = await confirmToast(
                `¿Deseas aprobar "${producto.nombre}"?`,
                { confirmLabel: "Aprobar", cancelLabel: "Cancelar", confirmColor: "#16a34a" }
            );
            if (!confirmed) return;

            setSaving(true);
            setActionLoadingVisible(true);

            const nowIso = new Date().toISOString();
            const body = {
                decisiones: [{
                    id: productoId,
                    aprobado: true,
                    fecha_aprobado: nowIso,
                }],
            };

            // 🔥 Solo actualiza el producto individual, NO el estado del aprobador ni de la requisición
            const res = await api.put(
                `/api/requisiciones/${requisicion.requisicion_id}/aprobar-items`,
                body,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "X-User-Name": detalles.currentUser?.nombre,
                        "X-User-Area": detalles.currentUser?.area,
                    },
                }
            );
            if (res.status >= 400) throw new Error(res.data?.message || "Error al aprobar");

            toast.success("Producto aprobado");

            // Actualizar solo el producto aprobado en el estado local
            setDetalles(prev => ({
                ...prev,
                productos: prev.productos.map(p =>
                    p.id === productoId
                        ? { ...p, aprobado: "aprobado", fecha_aprobado: nowIso }
                        : p
                ),
            }));

            setDecisiones(prev => ({
                ...prev,
                [productoId]: false
            }));

        } catch (err) {
            if (err?.response?.status >= 400) {
                toast.error("No se pudo aprobar el producto");
            }
        } finally {
            setSaving(false);
            setActionLoadingVisible(false);
        }
    };

    const handleRechazarSingle = async (productoId) => {
        try {
            const producto = detalles.productos.find(p => p.id === productoId);
            if (!producto) return;

            const confirmed = await confirmToast(
                `¿Deseas rechazar "${producto.nombre}"?`,
                { confirmLabel: "Rechazar", cancelLabel: "Cancelar", confirmColor: "#dc2626", background: "#ef4444" }
            );
            if (!confirmed) return;

            setSaving(true);
            setActionLoadingVisible(true);

            const nowIso = new Date().toISOString();
            const body = {
                decisiones: [{
                    id: productoId,
                    aprobado: false,
                    fecha_aprobado: nowIso,
                }],
            };

            const res = await api.put(
                `/api/requisiciones/${requisicion.requisicion_id}/aprobar-items`,
                body,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "X-User-Name": detalles.currentUser?.nombre,
                        "X-User-Area": detalles.currentUser?.area,
                    },
                }
            );
            if (res.status >= 400) throw new Error(res.data?.message || "Error al rechazar");

            toast.success("Producto rechazado");

            // Recargar productos para reflejar el estado actualizado
            const resReload = await api.get(
                `http://localhost:8000/api/requisiciones/${requisicion.requisicion_id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const dataReload = await resReload.data;

            // Filtrar y actualizar productos relevantes
            const cargo = user?.cargo || "";
            let productosRelevantes = (dataReload.productos || []);
            if (technoRoles.includes(cargo)) {
                productosRelevantes = productosRelevantes.filter(p => p.compra_tecnologica === 1 || p.compra_tecnologica === true);
            } else if (sstRoles.includes(cargo)) {
                productosRelevantes = productosRelevantes.filter(p => p.ergonomico === 1 || p.ergonomico === true);
            }
            setDetalles(prev => ({
                ...prev,
                requisicion: dataReload.requisicion,
                productos: productosRelevantes,
            }));

            // Actualizar decisiones solo para productos pendientes
            const newDecisiones = {};
            productosRelevantes.forEach((p) => {
                if (!p.aprobado) newDecisiones[p.id] = false;
            });
            setDecisiones(newDecisiones);

        } catch (err) {
            if (err?.response?.status >= 400) {
                toast.error("No se pudo rechazar el producto");
            }
        } finally {
            setSaving(false);
            setActionLoadingVisible(false);
        }
    };

    const confirmToast = (message, opts = {}) => {
        return new Promise((resolve) => {
            const toastId = `confirm-${Date.now()}`;
            const content = (
                <div style={{ padding: "10px", textAlign: "center", color: "white" }}>
                    <strong style={{ display: "block", marginBottom: "8px" }}>{message}</strong>
                    <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                        <button
                            onClick={() => {
                                toast.dismiss(toastId);
                                resolve(true);
                            }}
                            style={{
                                backgroundColor: opts.confirmColor || "#16a34a",
                                color: "white",
                                border: "none",
                                padding: "6px 12px",
                                borderRadius: "5px",
                                cursor: "pointer",
                                fontWeight: "bold",
                            }}
                        >
                            {opts.confirmLabel || "Sí"}
                        </button>
                        <button
                            onClick={() => {
                                toast.dismiss(toastId);
                                resolve(false);
                            }}
                            style={{
                                backgroundColor: opts.cancelColor || "#e5e7eb",
                                color: opts.cancelTextColor || "#111827",
                                border: "none",
                                padding: "6px 12px",
                                borderRadius: "5px",
                                cursor: "pointer",
                                fontWeight: "500",
                            }}
                        >
                            {opts.cancelLabel || "Cancelar"}
                        </button>
                    </div>
                </div>
            );

            toast.info(content, {
                toastId,
                position: "top-right",
                autoClose: false,
                closeOnClick: false,
                draggable: false,
                closeButton: false,
                style: {
                    background: opts.background || "#3b82f6",
                    borderRadius: "10px",
                },
            });
        });
    };

    const formatCOP = (val) => {
        if (val == null || val === "") return "—";
        const n = Number(val);
        if (isNaN(n)) return String(val);
        return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);
    };

    if (loading) {
        return (
            <div className="modal-overlay">
                <div className="modal-content-loading">
                    <div className="content-loading">
                        <img
                            src="/coopidrogas_logo_mini.png"
                            className="LogoCambios"
                            alt="Logo de carga"
                        />
                        <p>Thinking...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!detalles) return null;
    const { requisicion: info, productos } = detalles;

    const getAreaNombre = (area) => {
        switch (area) {
            case "TyP":
                return "Tecnologia y Proyectos";
            case "SST":
                return "Seguridad y Salud en el Trabajo";
            case "GerenciaAdmin":
                return "Gerencia Adminsitrativa";
            case "GerenciaGeneral":
                return "Gerencia General";
        }
    };

    const estadoNormalized = String(
        detalles?.requisicion?.status ||
        detalles?.requisicion?.estado_aprobacion ||
        ""
    ).toLowerCase().trim();

    // 🔥 ESTADO DEL APROBADOR ACTUAL (no de la requisición)
    const estadoAprobadorActual = detalles?.aprobadorActual?.estado || "";
    const aprobadorEsRechazado = detalles?.aprobadorActual?.esRechazado || false;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                {actionLoadingVisible && (
                    <div
                        className={`approval-loading-overlay ${actionLoadingExiting ? "fade-out" : "fade-in"}`}
                        style={{ position: "absolute", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.92)", width: "100%" }}
                    >
                        <div className="loading-cambios" style={{ textAlign: "center" }}>
                            <img src="/coopidrogas_logo_mini.png" className="LogoCambios" alt="Cargando..." />
                            <p className="textLoading">Procesando...</p>
                        </div>
                    </div>
                )}
                <div className="modal-header">
                    <div className="textAndIcon">
                        <div className="iconHeaderApr">
                            <FontAwesomeIcon icon={faFile} />
                        </div>
                        <div className="textApr">
                            <h2>Requisición #{info.id}</h2>
                            <p>Revisa y aprueba los productos de esta requisición</p>
                        </div>
                    </div>

                    <button onClick={onClose} className="close-button">
                        X
                    </button>
                </div>

                <div className="modal-body">
                    {/* 🔥 AGREGAR TIMELINE AQUÍ */}
                    <TimeLap
                        requisicionId={requisicion.requisicion_id}
                        token={token}
                        open={true}
                    />
                    <br />

                    <div className="containerInfoReq">
                        <div className="cardsReq">
                            <h3 className="tittleOneUserNew">Solicitante</h3>
                            <div className="areYFecha">
                                <p className="labelTittle">{info.nombre_solicitante}</p>
                                <p className="textLabel">{getAreaNombre(info.area)}</p>
                            </div>
                        </div>
                        <div className="cardsReq">
                            <h3 className="tittleOneUserNew">Fecha</h3>
                            <div className="areaYFecha">
                                <p className="labelTittle">{new Date(info.fecha).toLocaleDateString("es-ES")}</p>
                                <p className="textLabel">{info.justificacion || "No tiene."}</p>
                            </div>
                        </div>
                        <div className="cardsReq">
                            <h3 className="tittleOneUserNew">valor total</h3>
                            <div className="areaYFecha">
                                <p className="labelTittle">{formatCOP(info.valor_total)}</p>
                                <p className="textLabel">{productos.length} producto(s)</p>
                            </div>
                        </div>
                    </div>
                    <br />
                    <div className="lineaSeparadora"></div>
                    <h3 className="tittleOneUserNew">productos asociados</h3>
                    <div className="tabla-productos">
                        {productos.map((p) => {
                            // Estado del producto
                            const productoAprobado = p.aprobado === "aprobado" || p.aprobado === 1 || p.aprobado === "true";
                            const productoRechazado = p.aprobado === "rechazado";
                            const pendiente = !productoAprobado && !productoRechazado;

                            // Permitir editar si el aprobador no ha terminado
                            const editable = isEditableForUser(p) && puedeAprobar && (!yaAprobaste);

                            // 🔥 Mostrar color verde/rojo y etiqueta SOLO si:
                            // - El aprobador yaAprobaste (final), o
                            // - El producto ya fue aprobado/rechazado por el usuario actual en esta sesión (mientras aprueba)
                            // Para esto, si el producto está aprobado y el usuario aún puede aprobar, lo mostramos verde temporalmente
                            let borderColor = "#ddd";
                            let backgroundColor = "#fff";
                            let showAprobadoTag = false;
                            let showRechazadoTag = false;

                            if (productoAprobado && (yaAprobaste || (puedeAprobar && !yaAprobaste))) {
                                borderColor = "#16a34a";
                                backgroundColor = "#dcfce7";
                                showAprobadoTag = true;
                            } else if (productoRechazado && (yaAprobaste || (puedeAprobar && !yaAprobaste))) {
                                borderColor = "#dc2626";
                                backgroundColor = "#fee2e2";
                                showRechazadoTag = true;
                            }

                            return (
                                <div
                                    key={p.id}
                                    className="containerProductoAprove"
                                    style={{
                                        border: `2px solid ${borderColor}`,
                                        backgroundColor: backgroundColor,
                                        borderRadius: "8px",
                                        padding: "12px",
                                        transition: "all 0.3s ease",
                                        opacity: editable || showAprobadoTag || showRechazadoTag ? 1 : 0.5
                                    }}
                                >
                                    <div className="leftInfoAprove">
                                        {/* Solo mostrar check si es editable */}
                                        {editable && (
                                            <div
                                                className="checkProducto"
                                                onClick={() => {
                                                    if (!editable) return;
                                                    toggleDecision(p.id, p);
                                                }}
                                                style={{
                                                    display: "flex",
                                                    background: "#e5e7eb",
                                                    color: "#111827",
                                                    cursor: editable ? "pointer" : "not-allowed"
                                                }}
                                            >
                                                {decisiones[p.id] ? "✔" : ""}
                                            </div>
                                        )}
                                        <div className="nameAndDescriptionProducto">
                                            <p className="nameProducto">{p.nombre}</p>
                                            <p className="descriptionProducto">{p.descripcion}</p>
                                            <div className="tagsProducto">
                                                <div className={`tagOption ${p.compra_tecnologica ? "active" : ""}`}>
                                                    Tecnológico
                                                </div>
                                                <div className={`tagOption ${p.ergonomico ? "active" : ""}`}>
                                                    Ergonómico
                                                </div>
                                                {showAprobadoTag && (
                                                    <div className="tagOption active" style={{ background: "#16a34a", color: "white" }}>
                                                        ✓ Aprobado
                                                    </div>
                                                )}
                                                {showRechazadoTag && (
                                                    <div className="tagOption" style={{ background: "#dc2626", color: "white" }}>
                                                        ✕ Rechazado
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rightInfoAprove">
                                        <div className="totalAndCantidad">
                                            <p className="priceProducto">{formatCOP(p.valor_estimado)}</p>
                                            <p className="cantidadProducto">Cantidad {p.cantidad}</p>
                                        </div>
                                        {/* Botones solo si editable */}
                                        {editable && (
                                            <div style={{
                                                display: "grid",
                                                gridTemplateColumns: "1fr",
                                                gap: "6px",
                                                marginLeft: "12px",
                                                minWidth: "50px"
                                            }}>
                                                <button
                                                    onClick={() => handleAprobaSingle(p.id)}
                                                    disabled={saving || actionLoadingVisible}
                                                    title="Aprobar este producto"
                                                    style={{
                                                        padding: "8px 10px",
                                                        background: "#16a34a",
                                                        color: "white",
                                                        border: "none",
                                                        borderRadius: "5px",
                                                        cursor: saving || actionLoadingVisible ? "not-allowed" : "pointer",
                                                        fontWeight: "bold",
                                                        fontSize: "14px",
                                                        opacity: saving || actionLoadingVisible ? 0.6 : 1,
                                                        transition: "all 0.2s ease",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center"
                                                    }}
                                                >
                                                    ✓
                                                </button>
                                                <button
                                                    onClick={() => handleRechazarSingle(p.id)}
                                                    disabled={saving || actionLoadingVisible}
                                                    title="Rechazar este producto"
                                                    style={{
                                                        padding: "8px 10px",
                                                        background: "#dc2626",
                                                        color: "white",
                                                        border: "none",
                                                        borderRadius: "5px",
                                                        cursor: saving || actionLoadingVisible ? "not-allowed" : "pointer",
                                                        fontWeight: "bold",
                                                        fontSize: "14px",
                                                        opacity: saving || actionLoadingVisible ? 0.6 : 1,
                                                        transition: "all 0.2s ease",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center"
                                                    }}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                {/* 🔥 VERIFICAR ESTADO DEL APROBADOR ACTUAL, NO DE LA REQUISICIÓN */}
                {aprobadorEsRechazado ? (
                    <div className="modalFooter">
                        <div className="modal-actions">
                            <div className="containerIconApprove">
                                <FontAwesomeIcon icon={faWarning} />
                            </div>
                            <div className="containerTextApprove">
                                <p className="textOneTextApprove">Tu aprobación fue rechazada automáticamente</p>
                                <p className="textTwoTextApprove">Porque el aprobador anterior rechazó todos los productos</p>
                            </div>
                        </div>
                    </div>
                ) : estadoNormalized === "rechazada" ? (
                    <div className="modalFooter">
                        <div className="modal-actions">
                            <div className="containerIconApprove">
                                <FontAwesomeIcon icon={faWarning} />
                            </div>
                            <div className="containerTextApprove">
                                <p className="textOneTextApprove">Esta requisicion fue rechazada</p>
                                <p className="textTwoTextApprove">Solicita de nuevo esta requisicion</p>
                            </div>
                        </div>
                    </div>
                ) : estadoNormalized === "totalmente aprobada" ? (
                    <div className="modalFooter">
                        <div className="modal-actions">
                            <div className="containerIconApprove">
                                <FontAwesomeIcon icon={faCircleCheck} />
                            </div>
                            <div className="containerTextApprove">
                                <p className="textOneTextApprove">Esta requisicion ya fue totalmente aprobada</p>
                                <p className="textTwoTextApprove">No necesita mas aprobaciones</p>
                            </div>
                        </div>
                    </div>
                ) : puedeAprobar ? (
                    <div className="modal-actions-buttons">
                        <button onClick={handleGuardar} disabled={saving || actionLoadingVisible} >
                            {saving ? "Aprobando..." : "Aprobar"}
                        </button>
                        <button onClick={handleRechazar} disabled={saving || actionLoadingVisible}>
                            {saving ? "Procesando..." : "Rechazar"}
                        </button>
                    </div>
                ) : yaAprobaste ? (
                    <div className="modalFooter">
                        <div className="modal-actions">
                            <div className="containerIconApprove">
                                <FontAwesomeIcon icon={faCircleCheck} />
                            </div>
                            <div className="containerTextApprove">
                                <p className="textOneTextApprove">Esta requisicion ya fue aprobada por ti</p>
                                <p className="textTwoTextApprove">Faltan mas aprobadores</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="modalFooter">
                        <div className="modal-actions">
                            <div className="containerIconApprove">
                                <FontAwesomeIcon icon={faWarning} />
                            </div>
                            <div className="containerTextApprove">
                                <p className="textOneTextApprove">Aún no es tu turno de aprobar esta requisición</p>
                                <p className="textTwoTextApprove">Espera tu turno para aprobar</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
