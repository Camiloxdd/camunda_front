"use client";
import React, { useEffect, useState } from "react";

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

            // Enviar SOLO decisiones sobre productos editables (para no sobreescribir otros)
            const body = {
                decisiones: (detalles.productos || [])
                    .filter((p) => isEditableForUser(p))
                    .map((p) => ({
                        id: p.id,
                        aprobado: !!decisiones[p.id],
                    })),
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
            alert(data.message);
            onApproved();
            onClose();
        } catch (err) {
            console.error("❌ Error al guardar:", err);
            alert("No se pudo guardar las aprobaciones.");
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
                <h2>Requisición #{info.id}</h2>
                <button onClick={onClose} className="close-button">
                    ✖
                </button>

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
                        <table>
                            <thead>
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
                        {saving ? "Guardando..." : "Guardar aprobaciones"}
                    </button>
                </div>
            </div>

            <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          padding: 20px;
          border-radius: 16px;
          width: 85%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
        }
        .close-button {
          position: absolute;
          top: 10px;
          right: 10px;
          border: none;
          background: none;
          font-size: 20px;
          cursor: pointer;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        .btn-approve {
          background: #28a745;
          color: white;
          padding: 8px 16px;
          border: none;
          border-radius: 8px;
        }
      `}</style>
        </div>
    );
}