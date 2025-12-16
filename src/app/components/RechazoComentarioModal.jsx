import React, { useState } from "react";
import "../styles/rechazoComentarioModal.css";

export default function RechazoComentarioModal({ open, onClose, onSubmit }) {
    const [comentario, setComentario] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = () => {
        if (!comentario.trim()) {
            setError("El comentario es obligatorio.");
            return;
        }
        onSubmit(comentario);
        setComentario("");
        setError("");
    };

    if (!open) return null;
    return (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
            <div className="modal-content-rechazo">
                <h3 className="tittleOneUserNew">MOTIVO DEL RECHAZO</h3>
                <textarea
                    value={comentario}
                    onChange={e => setComentario(e.target.value)}
                    rows={4}
                    placeholder="Agrega un comentario..."
                    className="commentRechazo"
                />
                {error && <div className="error">{error}</div>}
                <div className="containerButtonsRechazo">
                    <button onClick={onClose} className="cancelarButton">Cancelar</button>
                    <button onClick={handleSubmit} className="rechazarButton">Rechazar</button>
                </div>
            </div>
        </div>
    );
}
