"use client";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "../styles/views/ApprovalModal.css";
import { approvePendingSingle, startThreeStep } from "../services/camunda";

export default function ApprovalModal({ requisicion, onClose, onApproved }) {
    const [detalles, setDetalles] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [decisiones, setDecisiones] = useState({}); // { producto_id: true/false }

    useEffect(() => {
        const fetchDetalles = async () => {
            try {
                const res = await fetch(
                    `http://localhost:4000/api/requisiciones/${requisicion.requisicion_id}`,
                    { credentials: "include" }
                );
                const data = await res.json();
                const productosVisibles = (data.productos || []).filter(
                    (p) => p.aprobado !== "rechazado" && p.visible !== 0
                );

                // Guardar los detalles pero solo con productos visibles
                setDetalles({
                    ...data,
                    productos: productosVisibles,
                });

                // inicializa decisiones SOLO para productos que el usuario puede editar
                const init = {};
                const technoRoles = ["dicTYP", "gerTyC"];
                const sstRoles = ["dicSST", "gerSST"];
                const cargo = data?.currentUser?.cargo || "";

                (data.productos || []).forEach((p) => {
                    const editable =
                        (technoRoles.includes(cargo) && !!p.compra_tecnologica) ||
                        (sstRoles.includes(cargo) && !!p.ergonomico) ||
                        (!technoRoles.concat(sstRoles).includes(cargo)); // otros roles pueden editar todo

                    if (editable) {
                        init[p.id] = (p.aprobado === "aprobado" || p.aprobado === 1 || p.aprobado === true) || false;
                    }
                });
                setDecisiones(init);
            } catch (err) {
                console.error("❌ Error cargando detalles:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDetalles();
    }, [requisicion]);

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
        setDecisiones((prev) => ({
            ...prev,
            [productoId]: !prev[productoId],
        }));
    };

    const handleGuardar = async () => {
        try {
            setSaving(true);
            toast.info("Guardando aprobaciones...", { autoClose: 2000 });

            const nowIso = new Date().toISOString();
            const body = {
                decisiones: (detalles.productos || [])
                    .filter((p) => isEditableForUser(p))
                    .map((p) => {
                        const currentlyApproved = !!decisiones[p.id];
                        const previouslyApproved =
                            p.aprobado === "aprobado" || p.aprobado === 1 || p.aprobado === true;
                        let fecha_aprobado = null;
                        if (currentlyApproved) {
                            if (previouslyApproved) {
                                fecha_aprobado = p.fecha_aprobado || nowIso;
                            } else {
                                fecha_aprobado = nowIso;
                            }
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

            const res = await fetch(
                `http://localhost:4000/api/requisiciones/${requisicion.requisicion_id}/aprobar-items`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(body),
                }
            );

            if (!res.ok) throw new Error("Error al guardar aprobaciones");
            const data = await res.json();
            toast.success(data.message || "Aprobaciones registradas");

            // --- NUEVA LÓGICA: dependiendo del monto total, usar una u otra llamada a Camunda ---
            try {
                const salarioMinimo = Number(process.env.NEXT_PUBLIC_SALARIO_MINIMO) || 1160000;
                const montoTotal = Number(info.valor_total || detalles.requisicion?.valor_total || 0);
                const esMayor = montoTotal >= salarioMinimo * 10;

                // filas con el detalle por producto (se envía también para trazabilidad)
                const filas = (detalles.productos || []).map(p => ({
                    id: p.id,
                    cantidad: p.cantidad,
                    valor_estimado: p.valor_estimado,
                    compra_tecnologica: !!p.compra_tecnologica,
                    ergonomico: !!p.ergonomico,
                    presupuestada: !!p.presupuestada,
                }));

                // variables booleanas que el proceso Camunda espera
                const camundaVars = {
                    filas,
                    siExiste: filas.length > 0,
                    purchaseTecnology: filas.some(f => f.compra_tecnologica && f.aprobado),
                    sstAprobacion: filas.some(f => f.ergonomico && f.aprobado),
                    purchaseAprobated: filas.some(f => f.presupuestada),
                    esMayor,

                };

                // intentar obtener processInstanceKey (intenta varios nombres por si cambia el back)
                const processInstanceKey =
                    detalles.requisicion?.processInstanceKey ||
                    detalles.requisicion?.process_instance_key ||
                    detalles.requisicion?.process_key ||
                    null;

                const currentRole = detalles.currentUser?.cargo || null;

                if (!esMayor) {
                    // caso < 10 salarios mínimos -> 1 petición para aprobar pendientes (filtrada por processInstanceKey si existe)
                    await approvePendingSingle(camundaVars, { processInstanceKey });
                    toast.info("Se solicitó aprobación de tareas pendientes (flujo simplificado).");
                } else {
                    // caso >= 10 salarios mínimos -> completar SOLO las userTask del rol/proceso actual
                    await startThreeStep(camundaVars, { role: currentRole, processInstanceKey });
                    toast.info("Se completó la userTask correspondiente a tu rol en Camunda.");
                }
            } catch (err) {
                console.error("Error al llamar a Camunda:", err);
                toast.warn("No se completaron las tareas en Camunda automáticamente.");
            }

            onApproved();
            onClose();
        } catch (err) {
            console.error("Error al guardar:", err);
            toast.error("No se pudo guardar las aprobaciones");
        } finally {
            setSaving(false);
        }
    };

    const handleRechazar = async () => {
        try {
            setSaving(true);
            toast.info("Registrando rechazo...", { autoClose: 2000 });

            const nowIso = new Date().toISOString();

            // 🔹 Tomar solo los productos seleccionados (check activo = rechazado)
            const decisionesParaEnviar = (detalles.productos || [])
                .filter((p) => isEditableForUser(p) && decisiones[p.id] === true)
                .map((p) => ({
                    id: p.id,
                    aprobado: false,
                    fecha_aprobado: nowIso,
                }));

            // ⚠️ Si no se seleccionó ninguno, mostrar alerta y salir
            if (decisionesParaEnviar.length === 0) {
                toast.warn("Selecciona al menos un producto para rechazar.");
                setSaving(false);
                return;
            }

            // 🔹 Actualizar el estado local (solo para los seleccionados)
            setDecisiones((prev) => {
                const copy = { ...prev };
                decisionesParaEnviar.forEach((p) => {
                    copy[p.id] = false;
                });
                return copy;
            });

            // 🔹 Enviar al backend solo los seleccionados
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

            onApproved();
            onClose();
        } catch (err) {
            console.error("Error al registrar rechazo:", err);
            toast.error("No se pudo registrar el rechazo");
        } finally {
            setSaving(false);
        }
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
                    <p>Cargando detalles...</p>
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

    return (
        <div className="modal-overlay">
            <div className="modal-content">
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
                                                backgroundColor: !editable ? "#ddddddff" : "transparent",
                                                color: !editable ? "#666" : "inherit",
                                            }}
                                        >
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={!!decisiones[p.id]}
                                                    onChange={() => toggleDecision(p.id, p)}
                                                    disabled={!editable}
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

                <div className="modal-actions">
                    <button onClick={handleGuardar} disabled={saving} className="btn-approve">
                        {saving ? "Aprobando..." : "Aprobar"}
                    </button>
                    <button onClick={handleRechazar} disabled={saving} className="btn-approve" style={{ marginLeft: 8 }}>
                        {saving ? "Procesando..." : "Rechazar"}
                    </button>
                </div>
            </div>
        </div>
    );
}