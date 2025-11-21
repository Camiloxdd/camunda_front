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
  faTimeline,
  faFile,
  faFileCircleCheck,
  faFileCircleQuestion,
  faFileCircleXmark
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import WizardModal from "../components/modalNewReq";
import { AuthProvider, useAuth } from "../context/AuthContext";
import TimeLap from "../components/timeLap";
import { iniciarProceso } from "../services/camunda";
import api from "../services/axios";
import SearchBar from "../components/searchBar";

function RequisicionesInner({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [requisiciones, setRequisiciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState(null);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [timelineReqId, setTimelineReqId] = useState(null);
  const [token, setToken] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { role, permissions } = useAuth();
  useEffect(() => {
    if (typeof window !== "undefined") {
      const t = localStorage.getItem("token");
      setToken(t);

      if (!t) {
        setUser(null);
      }
    }
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);

      const res = await api.get("/api/requisiciones");
      setRequisiciones(Array.isArray(res.data) ? res.data : [res.data]);

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

  const handleDescargarPDF = async (id) => {
    const urls = [
      `http://localhost:4000/requisiciones/${id}/pdf`,
    ];
    downloadBlobTryUrls(urls, `requisicion_${id}.pdf`);
  };

  const handleDelete = async (id) => {
    const toastId = toast.info(
      <div
        style={{
          padding: "10px",
          textAlign: "center",
          color: "white",
        }}
      >
        <strong style={{ display: "block", marginBottom: "8px" }}>
          ¿Seguro que deseas eliminar esta requisición?
        </strong>

        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
          <button
            style={{
              backgroundColor: "#dc2626",
              color: "white",
              border: "none",
              padding: "5px 12px",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
            onClick={async () => {
              toast.dismiss(toastId);
              try {
                const res = await api.delete(
                  `http://localhost:4000/api/requisiciones/${id}`,
                  {
                    method: "DELETE",
                    credentials: "include",
                  }
                );
                if (!res.ok) throw new Error("Error al eliminar");
                toast.success("Formulario eliminado correctamente.");
                await fetchAll();
              } catch (err) {
                console.error(err);
                toast.error("No se pudo eliminar ❌");
              }
            }}
          >
            Eliminar
          </button>

          <button
            style={{
              backgroundColor: "#e5e7eb",
              color: "#111827",
              border: "none",
              padding: "5px 12px",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "500",
            }}
            onClick={() => toast.dismiss(toastId)}
          >
            Cancelar
          </button>
        </div>
      </div>,
      {
        position: "top-right", // 👈 esquina inferior derecha
        autoClose: false, // No se cierra hasta que el usuario elija
        closeOnClick: false,
        draggable: false,
        closeButton: false,
        style: {
          background: "#3b82f6", // azul tipo “info”
          borderRadius: "10px",
        },
        icon: "ℹ️",
      }
    );
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

  const openTimeline = (id) => {
    setTimelineReqId(id);
    setTimelineOpen(true);
  };

  const getCargoNombre = (cargo) => {
    switch (cargo) {
      case "managerGeneral":
        return "Gerente General";
      case "managerAdmin":
        return "Gerente Administrativo";
      case "managerAreaTyc":
        return "Gerente de Área Tecnologia y Proyectos";
      case "managerAreaSST":
        return "Gerente de Área SST";
      case "dicLeaderAreaTyC":
        return "Director / Líder de Área Tec y Proyectos";
      case "dicLeaderAreaSST":
        return "Director / Líder de SST";
      case "CoordiDevWeb":
        return "Coordinador Desarrollo Web";
      case "analistaQA":
        return "Analista Requerimientos y QA";
      case "gerAdmin":
        return "Gerente Administrativo";
      case "gerGeneral":
        return "Gerente General";
      case "dicTYP":
        return "Director Tecnologia y Proyectos";
      case "gerTyC":
        return "Gerente Tecnologia y Proyectos";
      default:
        return cargo || "Usuario";
    }
  };

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

  const handleStartProcessCamunda = async () => {
    try {
      await iniciarProceso({
        bienvenida: "Se empezo el flujo de requisicion",
      })
    } catch (error) {
      console.log("Error al iniciar el proceso: ", error)
    }
  }

  const abrirModalNuevaReq = () => {
    handleStartProcessCamunda();
    setOpen(true);
  }

  const getStatusClass = (status) => {
    const s = status?.toLowerCase();

    if (s.includes("apro")) return "status-aprobada";
    if (s.includes("pend")) return "status-pendiente";
    if (s.includes("rechazada")) return "status-devuelta";

    return "status-default";
  };

  return (
    <div style={{ display: "flex" }}>
      <TimeLap open={timelineOpen} onClose={() => setTimelineOpen(false)} requisicionId={timelineReqId} />
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

        <div className="tablaGestionUsuarios">
          <div className="firstContainerDash">
                      <div className="porcents">
                        <div className="totalRequisiciones">
                          <div className="infoTotalReq">
                            <p>Requisiciones totales</p>
                            <h2>{requisiciones.length}</h2>
                          </div>
                          <div className="iconTotalReq">
                            <FontAwesomeIcon icon={faFile} />
                          </div>
                        </div>
          
                        <div className="porAprobarRequisiciones">
                          <div className="infoAprobarReq">
                            <p>Requisiciones aprobadas</p>
                            <h2>
                              {requisiciones.filter((r) => (r.estado_aprobacion || r.status) === "Totalmente Aprobada").length}
                            </h2>
                          </div>
                          <div className="iconAprobarReq">
                            <FontAwesomeIcon icon={faFileCircleCheck} />
                          </div>
                        </div> 
                        <div className="pendientesAprobaciones">
                          <div className="infoAprobarReq">
                            <p>Requisiciones pendientes</p>
                            <h2>
                              {requisiciones.filter((r) => (r.estado_aprobacion || r.status) === "pendiente").length}
                            </h2>
                          </div>
                          <div className="iconPendientesReq">
                            <FontAwesomeIcon icon={faFileCircleQuestion} />
                          </div>
                        </div>
                        <div className="rechazarAprobaciones">
                          <div className="infoAprobarReq">
                            <p>Requisiciones rechazadas</p>
                            <h2>
                              {requisiciones.filter((r) => (r.estado_aprobacion || r.status) === "rechazada").length}
                            </h2>
                          </div>
                          <div className="iconRechazarReq">
                            <FontAwesomeIcon icon={faFileCircleXmark} />
                          </div>
                        </div>
                      </div>
                    </div>
                                    <div className="papaHeaderRequi">
                    <div className="barraDeNavegacion">
                      <SearchBar
                        placeholder="Buscar por ID de requisición..."
                        onQueryChange={setSearchQuery}
                      />
                    </div>
                  </div>
          <div className="tableGestUsers">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha de solicitud</th>
                  <th>Solicitante</th>
                  <th>Área</th>
                  <th>¿Está en presupuesto?</th>
                  <th>Valor total</th>
                  <th>Urgencia</th>
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
                      <td>
                        <span className={`status-circle ${getStatusClass(r.status)}`} />
                          Requisición #{r.requisicion_id}
                      </td>
                      <td>{new Date(r.fecha).toLocaleDateString()}</td>
                      <td>{r.nombre_solicitante}</td>
                      <td>{getAreaNombre(r.area)}</td>
                      <td style={{ color: r.presupuestada ? "green" : "red", fontWeight: "bold" }}>
                        {r.presupuestada ? "Presupuestada" : "No presupuestada"}
                      </td>
                      <td>{r.valor_total?.toLocaleString("es-CO")}</td>
                      <td>{r.urgencia}</td>
                      <td>
                        <button
                          title="Ver flujo"
                          onClick={() => openTimeline(r.requisicion_id)}
                          style={{ marginLeft: 8, color: "#1d5da8" }}
                          className="iconTimeLone"
                        >
                          <FontAwesomeIcon icon={faTimeline} />
                        </button>
                        <button
                          title="Word"
                          onClick={() => handleDescargarPDF(r.requisicion_id)}
                          style={{ marginLeft: 8, }}
                          className="iconPdf"
                        >
                          <FontAwesomeIcon icon={faFilePdf} />
                        </button>
                        {permissions?.canCreateRequisition && (
                          <button
                            title="Editar"
                            onClick={() => handleEditOpen(r)}
                            style={{ marginLeft: 8 }}
                          >
                            <FontAwesomeIcon icon={faPencil} style={{ color: "#1d5da8" }} />
                          </button>
                        )}
                        {permissions?.canCreateRequisition && (
                          <button
                            title="Eliminar"
                            onClick={() => handleDelete(r.requisicion_id)}
                            style={{ marginLeft: 8 }}
                          >
                            <FontAwesomeIcon icon={faTrash} style={{ color: "red" }} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="floating-actions">
          <button onClick={fetchAll} className="fab-btn secondary">
            <FontAwesomeIcon icon={faRefresh} />
          </button>
          {permissions?.canCreateRequisition && (
            <button onClick={abrirModalNuevaReq} className="fab-btn primary">
              <FontAwesomeIcon icon={faPlus} />
            </button>
          )}
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
