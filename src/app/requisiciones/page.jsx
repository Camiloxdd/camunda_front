"use client";
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Navbar from "../components/navbar";
import { Sidebar } from "../components/Slidebar";
import "../styles/views/requisiciones.css";
import {
  faFileExcel,
  faFileWord,
  faPencil,
  faTrash,
  faPlus,
  faRefresh,
  faFilePdf,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import WizardModal from "../components/modalNewReq";
import { AuthProvider, useAuth } from "../context/AuthContext";

function RequisicionesInner() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [requisiciones, setRequisiciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState(null);

  const { role, permissions } = useAuth();

  const fetchAll = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:4000/api/requisiciones", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al obtener requisiciones");
      const data = await res.json();
      setRequisiciones(Array.isArray(data) ? data : [data]);

      console.log(data)
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Reemplaza downloadBlob por una versión con fallback
  const downloadBlobTryUrls = async (urls = [], filename) => {
    let lastError = null;
    for (const url of urls) {
      try {
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) {
          // Si es 404, intentamos la siguiente URL; para otros códigos abortamos y mostramos error
          if (res.status === 404) {
            lastError = new Error(`404 Not Found: ${url}`);
            continue;
          }
          throw new Error(`HTTP ${res.status} (${url})`);
        }
        const blob = await res.blob();
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        return; // éxito
      } catch (err) {
        console.warn("Descarga fallida para", url, err.message || err);
        lastError = err;
        // Intentamos siguiente URL en la lista
      }
    }
    console.error("Todas las descargas fallaron:", lastError);
    toast.error("Error en la descarga");
  };

  // Probar primero el endpoint de formularios (plantilla). Si no existe, intentar el endpoint de requisición.
  const handleExcel = (id) => {
    const urls = [
      `http://localhost:4000/requisiciones/${id}/excel`,
    ];
    downloadBlobTryUrls(urls, `requisicion_${id}.xlsx`);
  };

  const handleDescargarPDF = async (id) => {
    const urls = [
      `http://localhost:4000/requisiciones/${id}/pdf`,
    ];
    downloadBlobTryUrls(urls, `requisicion_${id}.pdf`);
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Seguro que deseas eliminar esta requisición?")) return;
    try {
      const res = await fetch(
        `http://localhost:4000/api/requisiciones/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("Error al eliminar");
      await fetchAll();
    } catch (err) {
      console.error(err);
      toast.error("No se pudo eliminar");
    }
  };

  const handleEditOpen = async (req) => {
    // fetch details (optional)
    try {
      const res = await fetch(
        `http://localhost:4000/api/requisiciones/${req.requisicion_id}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Error");
      const data = await res.json();
      // abrir modal en modo edición (solo steps 2 y 3)
      setModalInitialData(data);
      setOpen(true);
    } catch (err) {
      console.error(err);
      toast.error("No se pudo obtener detalles");
    }
  };

  const handleEditSave = async () => {
    try {
      const body = {
        nombre_solicitante: editing.nombre_solicitante,
        fecha: editing.fecha,
        justificacion: editing.justificacion,
        area: editing.area,
        sede: editing.sede,
        urgencia: editing.urgencia,
        presupuestada: editing.presupuestada,
      };
      const res = await fetch(
        `http://localhost:4000/api/requisiciones/${editing.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) throw new Error("Error al guardar");
      setEditing(null);
      await fetchAll();
    } catch (err) {
      console.error(err);
      toast.error("No se pudo actualizar");
    }
  };

  return (
    <div style={{ display: "flex" }}>
      <Navbar />
      <WizardModal
        open={open}
        onClose={() => { setOpen(false); setModalInitialData(null); }}
        onCreated={fetchAll}
        initialData={modalInitialData}
        startStep={modalInitialData ? 2 : undefined}
      />
      <Sidebar onToggle={setIsSidebarOpen} />
      <div
        style={{
          marginTop: "100px",
          flex: 1,
          transition: "margin-left 0.3s ease",
          marginLeft: isSidebarOpen ? "210px" : "80px",
        }}
      >
        <div className="headerUsers">
          <div className="headerInfoRequisiciones">
            <h2>Gestión de Requisiciones</h2>
            <p>Lista de todas las requisiciones en el sistema.</p>
          </div>
          <div className="buttonsRequisiciones">
            <button onClick={fetchAll}>
              <FontAwesomeIcon icon={faRefresh} />
            </button>
            {permissions?.canCreateRequisition && (
              <button onClick={() => setOpen(true)}>
                <FontAwesomeIcon icon={faPlus} />
              </button>
            )}
          </div>
        </div>

        <div className="tablaGestionUsuarios">
          <div className="tableGestUsers">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Solicitante</th>
                  <th>Fecha de creación</th>
                  <th>Justificación</th>
                  <th>Área</th>
                  <th>Sede</th>
                  <th>Valor total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9">Cargando...</td>
                  </tr>
                ) : requisiciones.length === 0 ? (
                  <tr>
                    <td colSpan="9">No hay requisiciones.</td>
                  </tr>
                ) : (
                  requisiciones.map((r) => (
                    <tr key={r.requisicion_id}>
                      <td>{r.requisicion_id}</td>
                      <td>{r.nombre_solicitante}</td>
                      <td>{new Date(r.fecha).toLocaleDateString()}</td>
                      <td>{r.justificacion}</td>
                      <td>{r.area}</td>
                      <td>{r.sede}</td>
                      <td>{r.valor_total?.toLocaleString("es-CO")}</td>
                      <td style={{ textTransform: "capitalize", fontWeight: 600 }}>
                        {r.status}
                      </td>
                      <td>
                        <button
                          title="Excel"
                          onClick={() => r.status === "Totalmente Aprobada" && handleExcel(r.requisicion_id)}
                          disabled={r.status !== "Totalmente Aprobada"}
                        >
                          <FontAwesomeIcon icon={faFileExcel} />
                        </button>
                        <button
                          title="Word"
                          onClick={() => r.status === "Totalmente Aprobada" && handleDescargarPDF(r.requisicion_id)}
                          disabled={r.status !== "Totalmente Aprobada"}
                          style={{ marginLeft: 8 }}
                        >
                          <FontAwesomeIcon icon={faFilePdf} />
                        </button>
                        <button
                          title="Editar"
                          onClick={() => handleEditOpen(r)}
                          style={{ marginLeft: 8 }}
                        >
                          <FontAwesomeIcon icon={faPencil} style={{ color: "orange" }} />
                        </button>
                        <button
                          title="Eliminar"
                          onClick={() => handleDelete(r.requisicion_id)}
                          style={{ marginLeft: 8 }}
                        >
                          <FontAwesomeIcon icon={faTrash} style={{ color: "red" }} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {editing && (
        <div
          className="modalOverlay"
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 20,
              width: 640,
              borderRadius: 6,
            }}
          >
            <h3>Editar Requisición #{editing.id}</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              <label>
                Solicitante
                <input
                  value={editing.nombre_solicitante || ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      nombre_solicitante: e.target.value,
                    })
                      ? new Date(editing.fecha).toISOString().slice(0, 10)
                      : ""
                  }
                />
              </label>
              <label style={{ gridColumn: "1 / -1" }}>
                Justificación
                <input
                  value={editing.justificacion || ""}
                  onChange={(e) => {
                    setEditing({ ...editing, justificacion: e.target.value })
                  }}
                />
              </label>
              <label>
                Fecha
                <input
                  type="date"
                  value={editing.fecha || ""}
                  onChange={(e) => {
                    setEditing({ ...editing, fecha: e.target.value })
                  }}
                />
              </label>
              <label>
                Área
                <input
                  value={editing.area || ""}
                  onChange={(e) => setEditing({ ...editing, area: e.target.value })}
                />
              </label>
              <label>
                Sede
                <input
                  value={editing.sede || ""}
                  onChange={(e) => setEditing({ ...editing, sede: e.target.value })}
                />
              </label>
              <label>
                Urgencia
                <input
                  value={editing.urgencia || ""}
                  onChange={(e) => setEditing({ ...editing, urgencia: e.target.value })}
                />
              </label>
              <label>
                Sede
                <input
                  value={editing.sede || ""}
                  onChange={(e) => setEditing({ ...editing, sede: e.target.value })}
                />
              </label>
              <label>
                Urgencia
                <input
                  value={editing.urgencia || ""}
                  onChange={(e) => setEditing({ ...editing, urgencia: e.target.value })} ange={(e) => setEditing({ ...editing, area: e.target.value })}
                />
              </label>
            </div>
            <div
              style={{
                marginTop: 12,
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
              }}
            >
              <button onClick={() => setEditing(null)}>Cancelar</button>
              <button onClick={handleEditSave}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RequisicionesPage() {
  return (
    <AuthProvider>
      <RequisicionesInner />
    </AuthProvider>
  );
}
