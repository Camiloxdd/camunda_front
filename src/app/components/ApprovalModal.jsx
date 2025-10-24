"use client";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "../styles/views/ApprovalModal.css";

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
                setDetalles(data);

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
        if (technoRoles.includes(cargo)) {
            return !!product.compra_tecnologica;
        }
        if (sstRoles.includes(cargo)) {
            return !!product.ergonomico;
        }
        // otros roles pueden editar todo
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
            onApproved();
            onClose();
        } catch (err) {
            console.error("❌ Error al guardar:", err);
            toast.error("No se pudo guardar las aprobaciones");
        } finally {
            setSaving(false);
        }
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
                        <p><strong>Área:</strong> {info.area}</p>
                        <p><strong>Justificación:</strong> {info.justificacion}</p>
                        <p><strong>Valor total:</strong> ${info.valor_total?.toLocaleString("es-CO")}</p>
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
                                                backgroundColor: !editable ? "#f5f5f5" : "transparent",
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
                                            <td>${p.valor_estimado?.toLocaleString("es-CO")}</td>
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
                </div>
            </div>
        </div>
    );
}