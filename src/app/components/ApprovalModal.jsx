"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/views/ApprovalModal.css"; // archivo CSS normal

export default function ApprovalModal({ isOpen, onClose, requisicionId, aprobacionId, onApproved }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const handleToggle = (id, aprobado) => {
        setItems((prev) =>
            prev.map((i) => (i.id === id ? { ...i, aprobado: aprobado ? 1 : 0 } : i))
        );
    };

    const handleSubmit = async () => {
        try {
            const payload = {
                requisicion_id: requisicionId,
                aprobacion_id: aprobacionId,
                items_aprobados: items.map((i) => ({
                    producto_id: i.id,
                    aprobado: i.aprobado === 1,
                })),
            };
            await axios.patch("http://localhost:3001/api/requisicion/aprobar", payload);
            alert("✅ Aprobación registrada correctamente");
            onApproved?.();
            onClose();
        } catch (err) {
            console.error(err);
            alert("❌ Error al aprobar ítems");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <h2>Aprobar Ítems</h2>

                {loading ? (
                    <p>Cargando productos...</p>
                ) : (
                    <table className="modal-table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Descripción</th>
                                <th>Valor</th>
                                <th>Aprobar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.nombre}</td>
                                    <td>{item.descripcion}</td>
                                    <td>${item.valor_estimado.toLocaleString()}</td>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={item.aprobado === 1}
                                            onChange={(e) => handleToggle(item.id, e.target.checked)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                <div className="modal-buttons">
                    <button className="btn-cancel" onClick={onClose}>Cancelar</button>
                    <button className="btn-approve" onClick={handleSubmit}>Aprobar seleccionados</button>
                </div>
            </div>
        </div>
    );
}
