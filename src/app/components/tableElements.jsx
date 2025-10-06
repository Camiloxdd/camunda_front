// components/ModalItems.jsx
import React from "react";

export default function tableElements({ show, onClose, items = [], onToggle }){
  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "10px",
          width: "80%",
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          Ítems de la requisición
        </h2>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f5f5f5" }}>
              <th>Descripción</th>
              <th>Cantidad</th>
              <th>Centro</th>
              <th>Cuenta</th>
              <th>Valor</th>
              <th>Aprobado</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr
                key={i}
                style={{
                  textAlign: "center",
                  borderBottom: "1px solid #ddd",
                }}
              >
                <td>{item.descripcion}</td>
                <td>{item.cantidad}</td>
                <td>{item.centro}</td>
                <td>{item.cuenta}</td>
                <td>{item.valor}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={item.purchaseAprobated}
                    onChange={() => onToggle(i)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: "20px", textAlign: "right" }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: "#dc3545",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              padding: "8px 16px",
              cursor: "pointer",
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

