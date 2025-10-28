"use client";
import React, { useState, useEffect, useRef } from "react";
import { Sidebar } from "../components/Slidebar";
import Navbar from "../components/navbar";
import SearchBar from "../components/searchBar";
import ApprovalModal from "../components/ApprovalModal";
import { faFile, faFileExcel } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { approveBuyerTask } from "../services/camunda";

function DashboardInner() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [requisiciones, setRequisiciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null); // para la modal de aprobador
  const [verifyModalReq, setVerifyModalReq] = useState(null); // para comprador: detalles a mostrar en modal
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { permissions, user } = useAuth();
  const [statusFilter, setStatusFilter] = useState("todas");



  // IDs para prevenir toasts duplicados
  const sessionToastIdRef = useRef("session-started");
  const pendingToastIdRef = useRef("pending-reqs");
  const compradorToastIdRef = useRef("comprador-reqs");
  const newReqsToastIdRef = useRef("new-reqs");
  const devueltaToastIdRef = useRef("devuelta-reqs");
  const aprobadaToastIdRef = useRef("aprobada-reqs");

  const prevPendingIdsRef = useRef(new Set());
  const prevStatusesRef = useRef(new Map());
  const firstPollRef = useRef(true);

  // utilidad para formatear como pesos colombianos
  const formatCOP = (val) => {
    if (val == null || val === "") return "—";
    const n = Number(val);
    if (isNaN(n)) return String(val);
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);
  };

  const requisicionesFiltradas = requisiciones.filter((req) => {
    // 🔸 1. Filtro por texto (búsqueda en tiempo real)
    const matchesSearch = !searchQuery.trim()
      ? true
      : String(req.requisicion_id || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    // 🔸 2. Filtro por estado
    const estado = String(req.status || req.estado_aprobacion || "").toLowerCase();
    const matchesStatus =
      statusFilter === "todas" ? true : estado === statusFilter;

    return matchesSearch && matchesStatus;
  });



  const fetchRequisiciones = async () => {
    try {
      setLoading(true);

      if (permissions?.isAprobador && user?.nombre) {
        const res = await fetch(
          `http://localhost:4000/api/requisiciones/aprobador/${encodeURIComponent(user.nombre)}`,
          { credentials: "include" }
        );
        if (!res.ok) throw new Error("Error al obtener requisiciones del aprobador");
        const data = await res.json();
        const lista = Array.isArray(data) ? data : [data];

        // 🧠 Añadir estado de aprobación según el orden (del timeLap)
        const completadas = await Promise.all(
          lista.map(async (req) => {
            try {
              const r = await fetch(
                `http://localhost:4000/api/requisiciones/${req.requisicion_id}/aprobacion`,
                { credentials: "include" }
              );
              if (!r.ok) return { ...req, puedeAprobar: false };

              const info = await r.json();
              const { approvers, nextOrder } = info || {};
              if (!approvers) return { ...req, puedeAprobar: false };

              // Encontrar si este usuario está dentro del flujo
              const actual = approvers.find(
                (a) =>
                  a.nombre_aprobador?.toLowerCase() === user.nombre.toLowerCase() ||
                  a.rol_aprobador?.toLowerCase() === user.rol?.toLowerCase()
              );

              // ✅ Puede aprobar si está visible o es su turno (nextOrder)
              const puedeAprobar = actual?.visible === true || actual?.orden === nextOrder;

              return { ...req, puedeAprobar };
            } catch {
              return { ...req, puedeAprobar: false };
            }
          })
        );

        setRequisiciones(completadas);
      }
      else if (permissions?.isComprador) {
        const res = await fetch("http://localhost:4000/api/requisiciones", { credentials: "include" });
        const data = await res.json();
        const lista = (Array.isArray(data) ? data : [data]).filter(
          (r) => (r.status || r.estado) === "aprobada" || (r.status || r.estado) === "devuelta"
        );
        setRequisiciones(lista);
      }
      else if (user?.nombre) {
        const res = await fetch("http://localhost:4000/api/requisiciones", { credentials: "include" });
        const data = await res.json();
        const lista = (Array.isArray(data) ? data : [data]).filter(
          (r) => r.nombre_solicitante?.toLowerCase() === user.nombre.toLowerCase()
        );
        setRequisiciones(lista);
      }
      else {
        setRequisiciones([]);
      }
    } catch (err) {
      console.error("❌ Error cargando requisiciones:", err);
    } finally {
      setLoading(false);
    }
  };




  useEffect(() => {
    if (permissions) fetchRequisiciones();
  }, [permissions, user]);
  // refrescar cuando cambien permisos / user

  // Polling para notificaciones (nuevas, devueltas, aprobadas)
  useEffect(() => {
    let intervalId;
    const startPolling = () => {
      // inicializar estado previo para evitar falsas detecciones y permitir diffs inmediatos
      const init = async () => {
        try {
          if (permissions?.isAprobador) {
            const resPendInit = await fetch("http://localhost:4000/api/requisiciones/pendientes", { credentials: "include" });
            if (resPendInit.ok) {
              const dataPendInit = await resPendInit.json();
              prevPendingIdsRef.current = new Set((Array.isArray(dataPendInit) ? dataPendInit : [dataPendInit]).map(r => r.requisicion_id));
            }
          }
          const resAllInit = await fetch("http://localhost:4000/api/requisiciones", { credentials: "include" });
          if (resAllInit.ok) {
            const allInit = await resAllInit.json();
            prevStatusesRef.current = new Map((Array.isArray(allInit) ? allInit : [allInit]).map(r => [r.requisicion_id, r.status]));
          }
          // marcar que ya pasó la primera recolección
          firstPollRef.current = false;
        } catch (err) {
          console.error("Error inicializando polling:", err);
        }
      };

      init(); // inicializamos antes de setInterval()

      intervalId = setInterval(async () => {
        try {
          // 1) Para aprobadores: comprobar pendientes y comparar ids
          if (permissions?.isAprobador) {
            const resPend = await fetch("http://localhost:4000/api/requisiciones/pendientes", { credentials: "include" });
            if (resPend.ok) {
              const dataPend = await resPend.json();
              const pendingIds = new Set((Array.isArray(dataPend) ? dataPend : [dataPend]).map(r => r.requisicion_id));
              const prev = prevPendingIdsRef.current;
              if (!firstPollRef.current) {
                const newIds = [...pendingIds].filter(id => !prev.has(id));
                if (newIds.length > 0) {
                  // notificar nuevas y refrescar lista (evitar duplicados)
                  try {
                    if (!toast.isActive(newReqsToastIdRef.current)) {
                      toast.info("Tienes nuevas requisiciones", { toastId: newReqsToastIdRef.current });
                    }
                    // opcional: quitar notificación previo cuando se actualice lista
                    // toast.dismiss(newReqsToastIdRef.current);
                    await fetchRequisiciones();
                  } catch (e) { console.warn(e); }
                }
              }
              prevPendingIdsRef.current = pendingIds;
            }
          }

          // 2) Comprobar cambios de status globales (devuelta/aprobada)
          const resAll = await fetch("http://localhost:4000/api/requisiciones", { credentials: "include" });
          if (resAll.ok) {
            const all = await resAll.json();
            const prevStatuses = prevStatusesRef.current;
            if (!firstPollRef.current) {
              for (const r of Array.isArray(all) ? all : [all]) {
                const prev = prevStatuses.get(r.requisicion_id);
                const curr = r.status;
                if (prev && prev !== curr) {
                  const lower = String(curr || "").toLowerCase();
                  if (lower === "devuelta") {
                    try {
                      if (!toast.isActive(devueltaToastIdRef.current)) {
                        toast.warn("Han devuelto requisiciones, revísalas", { toastId: devueltaToastIdRef.current });
                      }
                      await fetchRequisiciones();
                    } catch (e) { console.warn(e); }
                  } else if (lower === "aprobada" || lower === "totalmente aprobada") {
                    try {
                      if (!toast.isActive(aprobadaToastIdRef.current)) {
                        toast.success("Se han aprobado requisiciones", { toastId: aprobadaToastIdRef.current });
                      }
                      await fetchRequisiciones();
                    } catch (e) { console.warn(e); }
                  } else {
                    // otros estados posibles: refrescar para sincronizar UI
                    await fetchRequisiciones();
                  }
                }
              }
            }
            // actualizar mapa de estados (siempre)
            prevStatusesRef.current = new Map((Array.isArray(all) ? all : [all]).map(r => [r.requisicion_id, r.status]));
          }
        } catch (err) {
          console.error("Error en polling de notificaciones:", err);
        }
      }, 10000); // cada 10s
    };

    if (permissions) startPolling();
    return () => clearInterval(intervalId);
  }, [permissions]);

  // Exponer toast en window para permitir llamadas internas del polling (opcional)
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.toast = toast;
    }
    return () => { if (typeof window !== "undefined") window.toast = undefined; };
  }, []);

  // comprador: abrir modal con resumen (igual paso 4)
  const handleVerifyOpen = async (req) => {
    try {
      setVerifyLoading(true);
      const res = await fetch(`http://localhost:4000/api/requisiciones/${req.requisicion_id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Error al obtener detalles");
      const data = await res.json();
      // data.requisicion y data.productos están presentes según backend
      setVerifyModalReq({ ...data.requisicion, productos: data.productos, requisicion_id: req.requisicion_id });
    } catch (err) {
      console.error(err);
      toast.error("No se pudo cargar la requisición");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleDevolver = async (id) => {
    const toastId = toast.info(
      <div
        style={{
          padding: "10px",
          textAlign: "center",
          color: "white",
        }}
      >
        <strong style={{ display: "block", marginBottom: "8px" }}>
          ¿Deseas devolver esta requisición para corrección?
        </strong>

        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
          <button
            style={{
              backgroundColor: "#f97316", // naranja (acción intermedia)
              color: "white",
              border: "none",
              padding: "6px 12px",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
            onClick={async () => {
              toast.dismiss(toastId);
              try {
                const res = await fetch(
                  `http://localhost:4000/api/requisiciones/${id}/devolver`,
                  {
                    method: "POST",
                    credentials: "include",
                  }
                );
                if (!res.ok) throw new Error("Error al devolver");
                toast.success("Requisición devuelta correctamente");
                setVerifyModalReq(null);
                await fetchRequisiciones();
              } catch (err) {
                console.error(err);
                toast.error("No se pudo devolver la requisición");
              }
            }}
          >
            Devolver
          </button>

          <button
            style={{
              backgroundColor: "#e5e7eb",
              color: "#111827",
              border: "none",
              padding: "6px 12px",
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
        position: "top-right", // 👈 esquina superior derecha
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        closeButton: false,
        style: {
          background: "#3b82f6", // azul consistente con las otras alertas
          borderRadius: "10px",
        },
        icon: "ℹ️",
      }
    );
  };


  // comprador: aprobar totalmente (marcar requisición 100% aprobada)
  const handleAprobar = async (id) => {
    const toastId = toast.info(
      <div
        style={{
          padding: "10px",
          textAlign: "center",
          color: "white",
        }}
      >
        <strong style={{ display: "block", marginBottom: "8px" }}>
          ¿Deseas aprobar completamente esta requisición? <br />
        </strong>

        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
          <button
            style={{
              backgroundColor: "#16a34a", // verde para aprobar
              color: "white",
              border: "none",
              padding: "6px 12px",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
            onClick={async () => {
              toast.dismiss(toastId);
              try {
                setVerifyLoading(true);
                const res = await fetch(
                  `http://localhost:4000/api/requisiciones/${id}/aprobar-total`,
                  {
                    method: "POST",
                    credentials: "include",
                  }
                );
                if (!res.ok) throw new Error("Error al aprobar");
                toast.success("Requisición aprobada correctamente");
                setVerifyModalReq(null);
                await fetchRequisiciones();

                // intentar aprobar la userTask del comprador en Camunda
                try {
                  const processInstanceKey =
                    verifyModalReq?.processInstanceKey ||
                    verifyModalReq?.process_instance_key ||
                    verifyModalReq?.process_key ||
                    undefined;

                  const vars = {
                    siExiste: (verifyModalReq?.productos?.length ?? 0) > 0,
                    purchaseAprobated: true,
                    purchaseTecnology: (verifyModalReq?.productos || []).some(
                      (p) =>
                        !!(p.compra_tecnologica || p.compraTecnologica)
                    ),
                    valor_total: verifyModalReq?.valor_total ?? undefined,
                  };

                  await approveBuyerTask(vars, { processInstanceKey });
                  console.log(
                    "approveBuyerTask ejecutada correctamente para requisición",
                    id
                  );
                } catch (camundaErr) {
                  console.warn(
                    "No se pudo completar la userTask del comprador en Camunda:",
                    camundaErr
                  );
                  toast.warn(
                    "Aprobación registrada localmente, pero no se completó en Camunda."
                  );
                }
              } catch (err) {
                console.error(err);
                toast.error("No se pudo aprobar la requisición");
              } finally {
                setVerifyLoading(false);
              }
            }}
          >
            Aprobar
          </button>

          <button
            style={{
              backgroundColor: "#e5e7eb",
              color: "#111827",
              border: "none",
              padding: "6px 12px",
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
        position: "top-right", // 👈 esquina superior derecha
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        closeButton: false,
        style: {
          background: "#3b82f6", // azul informativo
          borderRadius: "10px",
        },
        icon: "ℹ️",
      }
    );
  };

  useEffect(() => {
    // Mostrar notificación una sola vez (usar toastId para evitar duplicados)
    if (!loading && permissions?.isAprobador && requisiciones.some(r => (r.status || r.estado_aprobacion) === "pendiente")) {
      if (!toast.isActive(pendingToastIdRef.current)) {
        toast.info("Tienes requisiciones por aprobar", { toastId: pendingToastIdRef.current });
      }
    } else {
      // si ya no hay pendientes, cerrar notificación previa
      if (toast.isActive(pendingToastIdRef.current)) {
        toast.dismiss(pendingToastIdRef.current);
      }
    }

    if (!loading && permissions?.isComprador && requisiciones.some(r => (r.status || r.estado) === "aprobada")) {
      if (!toast.isActive(compradorToastIdRef.current)) {
        toast.info("Tienes requisiciones por finalizar", { toastId: compradorToastIdRef.current });
      }
    } else {
      if (toast.isActive(compradorToastIdRef.current)) {
        toast.dismiss(compradorToastIdRef.current);
      }
    }
  }, [loading, requisiciones, permissions]);

  useEffect(() => {
    // Mostrar toast de "sesión iniciada" sin duplicados (usa toastId)
    if (!toast.isActive(sessionToastIdRef.current)) {
      toast.success("Sesión iniciada correctamente!", { toastId: sessionToastIdRef.current });
    }
  }, []);


  const getAreaNombre = (area) => {
    switch (area) {
      case "TyP":
        return "Tecnología y Proyectos";
      case "SST":
        return "Seguridad y Salud en el Trabajo";
      case "GerenciaAdmin":
        return "Gerencia Administrativa";
      case "GerenciaGeneral":
        return "Gerencia General";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "pendiente":
        return "Pendiente";
      case "rechazada":
        return "Rechazada";
      case "aprobada":
        return "Aprobada";
      default:
        return status;
    }
  };

  const getStatusClass = (status) => {
    if (status === "aprobada") return "status-green";
    if (status === "rechazada") return "status-red";
    if (status === "pendiente") return "status-orange";
    return "";
  };

  return (
    <div className="dashboard-container-requisiciones" style={{ display: "flex" }}>
      <Sidebar onToggle={setIsSidebarOpen} />
      <div
        className="dashboard-content"
        style={{
          flex: 1,
          transition: "margin-left 0.3s ease",
          marginLeft: isSidebarOpen ? "210px" : "80px",
        }}
      >
        <Navbar />

        <div className="containerOneDashboard">
          <div className="firstContainerDash">
            <div className="infoGeneralUserDash">
              <h2>Dashboard</h2>
              <p>Revisa si tienes requisiciones pendientes por aprobar.</p>
            </div>

            <div className="porcents">
              <div className="totalRequisiciones">
                <div className="iconTotalReq">
                  <FontAwesomeIcon icon={faFile} />
                </div>
                <div className="infoTotalReq">
                  <p>Requisiciones totales</p>
                  <h2>{requisiciones.length}</h2>
                </div>
              </div>

              <div className="porAprobarRequisiciones">
                <div className="infoAprobarReq">
                  <p>
                    {permissions?.isAprobador ? "Requisiciones por aprobar" :
                      permissions?.isComprador ? "Requisiciones para verificar" :
                        "Requisiciones creadas"}
                  </p>
                  <h2>
                    {permissions?.isAprobador
                      ? requisiciones.filter((r) => (r.status || r.estado_aprobacion) === "pendiente").length
                      : requisiciones.length}
                  </h2>
                </div>
                <div className="iconAprobarReq">
                  <FontAwesomeIcon icon={faFileExcel} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="secondContainerDash">
          <div className="containerTwoDash">
            <div className="papaHeaderRequi">
              <div className="headerListReq">
                <h2>
                  {permissions?.isAprobador ? "Lista de Requisiciones por Aprobar" :
                    permissions?.isComprador ? "Requisiciones Aprobadas (para Verificar)" :
                      "Estado de tus requisiciones."}
                </h2>
                <p>
                  {permissions?.isAprobador ? "Selecciona la requisición que deseas aprobar." :
                    permissions?.isComprador ? "Verifica que la requisición sea correcta. Si no, devuélvela para corrección." :
                      "Bienvenido al dashboard."}
                </p>
              </div>
              <div className="barraDeNavegacion">
                <SearchBar
                  placeholder="Buscar por ID de requisición..."
                  onQueryChange={setSearchQuery}
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="selectDashboard"
                >
                  <option value="todas">Todas</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="rechazada">Rechazada</option>
                  <option value="aprobada">Aprobada</option>
                </select>
              </div>
            </div>

            <div className="listaReq">
              {loading ? (
                <div className="loading-container">
                  <div className="loading-cambios">
                    <img
                      src="/coopidrogas_logo_mini.png"
                      className="LogoCambios"
                      alt="Logo de carga"
                    />
                    <p className="textLoading">Cargando requisiciones...</p>
                  </div>
                </div>
              ) : requisicionesFiltradas.length === 0 ? (
                <div className="loading-container">
                  <div className="loading-cambios">
                    <p>
                      {permissions?.isAprobador ? "No tienes requisiciones pendientes por aprobar." :
                        permissions?.isComprador ? "No hay requisiciones aprobadas para verificar." :
                          "No hay requisiciones para mostrar."}
                    </p>
                  </div>
                </div>
              ) : (
                requisicionesFiltradas.map((req) => (
                  <div key={req.requisicion_id} className="requisicion">
                    <div className="infoIzquierda">
                      <h3 className="tittleHeaderRequeri">Requisición #{req.requisicion_id}</h3>
                      <p className="subTittles">
                        Creador:{" "}
                        <span className="subChiquitin">{req.nombre_solicitante}</span>
                      </p>
                      <p className="subTittles">
                        Fecha de creación:{" "}
                        <span className="subChiquitin">
                          {new Date(req.fecha).toLocaleDateString("es-ES")}
                        </span>
                      </p>
                      <p className="subTittles">
                        Estado:{" "}
                        <span className={`status ${getStatusClass(req.status)}`}>{getStatusLabel(req.status || req.estado_aprobacion)}</span>
                      </p>
                      <p className="subTittles">
                        Área: <span className="subChiquitin">{getAreaNombre(req.area)}</span>
                      </p>
                      <p className="subTittles">
                        Valor total:{" "}
                        <span className="subChiquitin">
                          {formatCOP(req.valor_total)}
                        </span>
                      </p>
                    </div>

                    <div className="infoDerecha">
                      <FontAwesomeIcon icon={faFileExcel} />
                      {permissions?.isAprobador ? (
                        req.puedeAprobar ? (
                          <button
                            className="buttonReqEdit"
                            onClick={() => setSelectedReq(req)} // abre modal aprobador
                          >
                            <p>Revisar</p>
                          </button>
                        ) : (
                          <button
                            className="buttonReqDisabled"
                            disabled
                          >
                            Faltan aprobaciones previas
                          </button>
                        )
                      ) : permissions?.isComprador ? (
                        <button
                          className="buttonReqEdit"
                          onClick={() => handleVerifyOpen(req)} // abre modal comprador
                        >
                          <p>Verificar</p>
                        </button>
                      ) : null}

                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* MODAL Aprobador (existente) */}
        {selectedReq && (
          <ApprovalModal
            requisicion={selectedReq}
            onClose={() => setSelectedReq(null)}
            onApproved={fetchRequisiciones} // refresca la lista al aprobar
          />
        )}

        {/* MODAL Comprador: resumen (paso 4) */}
        {verifyModalReq && (
          <div
            className="modalOverlayVerifiRequi"
          >
            <div className="modal-content">
              <div className="papitoGugutata">
                <h1 className="tittleContentComprador ">Verificar requisición #{verifyModalReq.requisicion_id}</h1>
                <div className="resumenSectionOne">
                  <div className="info-requisiciones">
                    <h3>Datos del solicitante</h3>
                    <ul>
                      <li><strong>Nombre:</strong> {verifyModalReq.nombre_solicitante || "—"}</li>
                      <li><strong>Fecha:</strong> {verifyModalReq.fecha || "—"}</li>
                      <li><strong>Área:</strong> {verifyModalReq.area || "—"}</li>
                      <li><strong>Sede:</strong> {verifyModalReq.sede || "—"}</li>
                      <li><strong>Urgencia:</strong> {verifyModalReq.urgencia || "—"}</li>
                      <li><strong>Justificación:</strong> {verifyModalReq.justificacion || "—"}</li>
                    </ul>
                  </div>
                  <div className="totalesComprador">
                    <h4>Totales</h4>
                    <ul>
                      <li><strong>Total de productos:</strong> {verifyModalReq.productos?.length || 0}</li>
                      <li><strong>Valor total:</strong> {formatCOP(verifyModalReq.valor_total)}</li>
                    </ul>
                  </div>
                </div>

                <div className="tabla-productos">
                  <h4>Productos</h4>
                  <table className="tablaResumen">
                    <thead>
                      <tr>
                        <th>#</th><th>Producto</th><th>Cantidad</th><th>Valor estimado</th><th>Tecnológico</th><th>Ergonómico</th>
                      </tr>
                    </thead>
                    <tbody>
                      {verifyModalReq.productos?.map((p, i) => (
                        <tr key={i}>
                          <td style={{ padding: 6 }}>{i + 1}</td>
                          <td style={{ padding: 6 }}>{p.nombre || p.productoOServicio || "—"}</td>
                          <td style={{ padding: 6 }}>{p.cantidad || "—"}</td>
                          <td style={{ padding: 6 }}>{/* valor estimado */}
                            {formatCOP(p.valor_estimado ?? p.valorEstimado)}
                          </td>
                          <td style={{ padding: 6 }}>{(p.compra_tecnologica || p.compraTecnologica) ? "Sí" : "No"}</td>
                          <td style={{ padding: 6 }}>{(p.ergonomico) ? "Sí" : "No"}</td>
                        </tr>
                      )) || null}
                    </tbody>
                  </table>
                </div>

                <div className="buttonsVerifiRequi">
                  <button onClick={() => setVerifyModalReq(null)}>Cerrar</button>
                  <button onClick={() => handleDevolver(verifyModalReq.requisicion_id)} disabled={verifyLoading}>
                    {verifyLoading ? "Procesando..." : "Devolver"}
                  </button>
                  <button onClick={() => handleAprobar(verifyModalReq.requisicion_id)} disabled={verifyLoading}>
                    {verifyLoading ? "Procesando..." : "Aprobar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// envolver el DashboardInner con AuthProvider para que useAuth no sea null
export default function Dashboard() {
  return (
    <AuthProvider>
      <DashboardInner />
    </AuthProvider>
  );
}
