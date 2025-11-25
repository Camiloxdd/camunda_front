"use client";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "../styles/views/ApprovalModal.css";
import api from "../services/axios";
import { approvePendingSingle, startThreeStep } from "../services/camunda";

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
                const productosVisibles = (data.productos || []).filter(
                    (p) => p.aprobado !== "rechazado" && p.visible !== 0
                );
                setDetalles(prev => ({
                    currentUser: user,
                    requisicion: data.requisicion,
                    productos: productosVisibles,
                }));

                const init = {};
                const technoRoles = ["dicTYP", "gerTyC"];
                const sstRoles = ["dicSST", "gerSST"];
                const cargo = user?.cargo || "";

                (data.productos || []).forEach((p) => {
                    const editable =
                        (technoRoles.includes(cargo) && !!p.compra_tecnologica) ||
                        (sstRoles.includes(cargo) && !!p.ergonomico) ||
                        (!technoRoles.concat(sstRoles).includes(cargo));

                    if (editable) {
                        init[p.id] = (p.aprobado === "aprobado" || p.aprobado === 1 || p.aprobado === true) || false;
                    }
                });
                setDecisiones(init);

                try {
                    const apr = await api.get(
                        `/api/requisiciones/${requisicion.requisicion_id}/aprobacion`,
                        { headers: { Authorization: token ? `Bearer ${token}` : "" } }
                    );
                    const aprData = apr.data || {};
                    const approvers = aprData.approvers || aprData.aprobadores || [];
                    const nextOrder = aprData.nextOrder;
                    const uname = (user?.nombre || "").toLowerCase().trim();
                    const urol = (user?.rol || "").toLowerCase().trim();
                    const actual = approvers.find(a => (
                        String(a.nombre_aprobador || "").toLowerCase().trim() === uname ||
                        String(a.rol_aprobador || "").toLowerCase().trim() === urol
                    ));

                    const estadoAct = String(actual?.estado || actual?.estado_aprobador || "").toLowerCase().trim();
                    const yaApr = !!(
                        actual && (
                            actual.aprobado === 1 || actual.aprobado === true ||
                            estadoAct.includes("aprob") || !!actual.fecha_aprobacion
                        )
                    );
                    const puede = !!(
                        actual && !yaApr && (
                            actual.visible === 1 || actual.visible === true ||
                            (typeof actual.orden !== "undefined" && actual.orden === nextOrder)
                        )
                    );

                    setPuedeAprobar(puede);
                    setYaAprobaste(yaApr);
                } catch (e) {
                    setPuedeAprobar(false);
                    setYaAprobaste(false);
                }
            } catch (err) {
                console.error("❌ Error cargando detalles:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDetalles();
    }, [requisicion, token, user]);

    const technoRoles = ["dicTYP", "gerTyC"];
    const sstRoles = ["dicSST", "gerSST"];

    const isEditableForUser = (product) => {
        const cargo = detalles?.currentUser?.cargo || "";
        const esTecnologico = !!product.compra_tecnologica;
        const esErgonomico = !!product.ergonomico;

        if (!esTecnologico && !esErgonomico) {
            return true;
        }

        if (technoRoles.includes(cargo)) {
            return esTecnologico;
        }

        if (sstRoles.includes(cargo)) {
            return esErgonomico;
        }

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
                toast.warn("No hay items editables para aprobar (los items de tu área ya fueron rechazados).");
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
                        p.aprobado === "aprobado" || p.aprobado === 1 || p.aprobado === true;
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
            console.log(detalles.currentUser?.nombre)
            console.log(detalles.currentUser?.area)

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
                    toast.info("Se solicitó aprobación de tareas pendientes (flujo simplificado).");
                } else {
                    await startThreeStep(camundaVars, { role: currentRole, processInstanceKey });
                    toast.info("Se completó la userTask correspondiente a tu rol en Camunda.");
                }
            } catch (err) {
                console.error("Error al llamar a Camunda:", err);
                toast.warn("No se completaron las tareas en Camunda automáticamente.");
            }

            onApproved();
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
                action: "reject",
            };

            const res = await fetch(
                `http://localhost:4000/api/requisiciones/${requisicion.requisicion_id}/aprobar-items`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(body),
                }
            );
            if (!res.ok) throw new Error("Error al registrar rechazo");
            const data = await res.json();
            toast.success(data.message || "Rechazo registrado correctamente");

            setDecisiones((prev) => {
                const copy = { ...prev };
                decisionesParaEnviar.forEach((d) => {
                    copy[d.id] = false;
                });
                return copy;
            });

            setRejectedIds((prev) => {
                const newSet = new Set(prev);
                decisionesParaEnviar.forEach((d) => newSet.add(d.id));
                return newSet;
            });

            setActionLoadingExiting(true);
            setTimeout(() => {
                setActionLoadingExiting(false);
                setActionLoadingVisible(false);
            }, 360);
        } catch (err) {
            console.error("Error al registrar rechazo:", err);
            toast.error("No se pudo registrar el rechazo");
            setActionLoadingVisible(false);
        } finally {
            setSaving(false);
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
                <div className="modal-content">
                    <div className="content-loading">
                        <img
                            src="/coopidrogas_logo_mini.png"
                            className="LogoCambios"
                            alt="Logo de carga"
                        />
                        <p>Cargando detalles...</p>
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

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ position: "relative" }}>
                {actionLoadingVisible && (
                    <div
                        className={`approval-loading-overlay ${actionLoadingExiting ? "fade-out" : "fade-in"}`}
                        style={{ position: "absolute", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.92)" }}
                    >
                        <div className="loading-cambios" style={{ textAlign: "center" }}>
                            <img src="/coopidrogas_logo_mini.png" className="LogoCambios" alt="Cargando..." />
                            <p className="textLoading">Procesando...</p>
                        </div>
                    </div>
                )}
                <div className="modal-header">
                    <h2>Requisición #{info.id}</h2>
                    <button onClick={onClose} className="close-button">
                        X
                    </button>
                </div>

                <div className="modal-body">
                    <div className="info-requisicion">
                        <p><strong>Solicitante:</strong> {info.nombre_solicitante}</p>
                        <p><strong>Fecha:</strong> {new Date(info.fecha).toLocaleDateString("es-ES")}</p>
                        <p><strong>Área:</strong> {getAreaNombre(info.area)}</p>
                        <p><strong>Justificación:</strong> {info.justificacion || "No tiene."}</p>
                        <p><strong>Valor total:</strong> {formatCOP(info.valor_total)}</p>
                    </div>

                    <div className="tabla-productos">
                        <h3>Productos asociados</h3>
                        <table className="tablaResumen">
                            <thead >
                                <tr>
                                    <th>Aprobar</th>
                                    <th>Nombre</th>
                                    <th>Descripción</th>
                                    <th>Cantidad</th>
                                    <th>Valor estimado</th>
                                    <th>Tecnológico</th>
                                    <th>Ergonómico</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productos.map((p) => {
                                    const editable = isEditableForUser(p);
                                    return (
                                        <tr
                                            key={p.id}
                                            style={{
                                                backgroundColor: rejectedIds.has(p.id)
                                                    ? "#ffecec"
                                                    : !editable
                                                        ? "#ddddddff"
                                                        : "transparent",
                                                color: !editable ? "#666" : "inherit",
                                            }}
                                        >
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={!!decisiones[p.id]}
                                                    onChange={() => toggleDecision(p.id, p)}
                                                    disabled={!editable || rejectedIds.has(p.id)}
                                                />
                                            </td>
                                            <td>{p.nombre}</td>
                                            <td>{p.descripcion}</td>
                                            <td>{p.cantidad}</td>
                                            <td>{formatCOP(p.valor_estimado)}</td>
                                            <td>{p.compra_tecnologica ? "Sí" : "No"}</td>
                                            <td>{p.ergonomico ? "Sí" : "No"}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
                {estadoNormalized === "rechazada" ? (
                    <div className="modal-actions"><p>Esta requisicion fue rechazada</p></div>
                ) : estadoNormalized === "totalmente aprobada" ? (
                    <div className="modal-actions"><p>Esta requisicion ya esta totalmente aprobada</p></div>
                ) : puedeAprobar ? (
                    <div className="modal-actions">
                        <button onClick={handleGuardar} disabled={saving || actionLoadingVisible} className="btn-approve">
                            {saving ? "Aprobando..." : "Aprobar"}
                        </button>
                        <button onClick={handleRechazar} disabled={saving || actionLoadingVisible} className="btn-approve" style={{ marginLeft: 8 }}>
                            {saving ? "Procesando..." : "Rechazar"}
                        </button>
                    </div>
                ) : yaAprobaste ? (
                    <div className="modal-actions"><p>Esta requisicion ya fue aprobada por ti, faltan aprobadores</p></div>
                ) : (
                    <div className="modal-actions"><p>Aún no es tu turno de aprobar esta requisición</p></div>
                )}
            </div>
        </div>
    );
}
