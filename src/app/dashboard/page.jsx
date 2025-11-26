"use client";
import React, { useState, useEffect, useRef } from "react";
import { Sidebar } from "../components/Slidebar";
import Navbar from "../components/navbar";
import SearchBar from "../components/searchBar";
import ApprovalModal from "../components/ApprovalModal";
import { faTrash, faPencil, faFilePdf, faTimeline, faX, faPlus, faRefresh, faFile, faFileCircleCheck, faFileCircleQuestion, faFileCircleXmark, faFileEdit, faFileExcel, faUserPen, faDownload, faBoxArchive } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Suspense } from "react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { approveBuyerTask, iniciarProceso } from "../services/camunda";
import styles from "../dashboard/DashboardRequisiciones.module.css";
import api from "../services/axios";
import WizardModal from "../components/modalNewReq";
import TimeLap from "../components/timeLap";
import ExcelJS from "exceljs";

function DashboardInner() {
  function getBadgeClass(estado) {
    const normalized = String(estado).toLowerCase().trim();

    switch (normalized) {
      case "pendiente":
        return styles.statusPending;

      case "aprobada":
        return styles.statusApproved;

      case "rechazada":
        return styles.statusRejected;

      case "totalmente aprobada":
        return styles.statusApproved; // Usar el mismo estilo que "aprobada"

      case "devuelta":
        return styles.statusPending; // Amarillo/naranja como pendiente

      default:
        return styles.statusPending; // Fallback
    }
  }

  function getBadgeClassBar(estado) {
    const normalized = String(estado).toLowerCase().trim();

    switch (normalized) {
      case "pendiente":
        return styles.statusPendingBar;

      case "aprobada":
        return styles.statusApprovedBar;

      case "rechazada":
        return styles.statusRejectedBar;

      case "totalmente aprobada":
        return styles.statusApprovedBar; // Usar el mismo estilo que "aprobada"

      case "devuelta":
        return styles.statusPendingBar; // Amarillo/naranja como pendiente

      default:
        return styles.statusPendingBar; // Fallback
    }
  }

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [requisiciones, setRequisiciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalInitialData, setModalInitialData] = useState(null);
  const [selectedReq, setSelectedReq] = useState(null);
  const [verifyModalReq, setVerifyModalReq] = useState(null);
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
  const [open, setOpen] = useState(false);
  const [solicitanteReq, setSolicitanteReq] = useState(null);
  const [token, setToken] = useState(null);
  const [openReqModal, setOpenReqModal] = useState(false);
  const [loadingSolicitante, setLoadingSolicitante] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [progress, setProgress] = useState(null);
  const [timelineReqId, setTimelineReqId] = useState(null);

  // Leer token desde localStorage al montar y actualizar si cambia en otra pestaña (event storage).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const readToken = () => setToken(localStorage.getItem("token"));
    readToken();
    const onStorage = (e) => { if (e.key === "token") setToken(e.newValue); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const formatCOP = (val) => {
    if (val == null || val === "") return "—";
    const n = Number(val);
    if (isNaN(n)) return String(val);
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);
  };

  // Normaliza un estado para comparaciones (minúsculas, trim)
  const normalizeEstado = (s) => String(s || "").toLowerCase().trim();
  const isApprovedState = (s) => {
    const n = normalizeEstado(s);
    return n.includes("aprob") || n === "totalmente aprobada" || n === "aprobada";
  };
  const isPendingState = (s) => normalizeEstado(s) === "pendiente";
  const isDevueltaState = (s) => normalizeEstado(s) === "devuelta";

  const requisicionesFiltradas = requisiciones.filter((req) => {
    const matchesSearch = !searchQuery.trim()
      ? true
      : String(req.requisicion_id || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const estado = normalizeEstado(req.status || req.estado_aprobacion || "");
    const matchesStatus = statusFilter === "todas" ? true : estado === String(statusFilter).toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const fetchRequisiciones = async () => {
    try {
      setLoading(true);

      if (permissions?.isAprobador && user?.nombre) {
        const res = await api.get(`/api/requisiciones/aprobador/${encodeURIComponent(user.nombre)}`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        const data = res.data;
        const lista = Array.isArray(data) ? data : [data];
        // 🧠 Añadir estado de aprobación según el orden (del timeLap)
        const completadas = await Promise.all(
          lista.map(async (req) => {
            try {
              const r = await api.get(`/api/requisiciones/${req.requisicion_id}/aprobacion`, {
                headers: { Authorization: token ? `Bearer ${token}` : "" },
              });
              const info = r.data;
              const { approvers, nextOrder } = info || {};
              if (!approvers) return { ...req, puedeAprobar: false, yaAprobaste: false };

              const actual = approvers.find(
                (a) =>
                  a.nombre_aprobador?.toLowerCase() === user.nombre.toLowerCase() ||
                  a.rol_aprobador?.toLowerCase() === user.rol?.toLowerCase()
              );

              const puedeAprobar = actual?.visible === true || actual?.orden === nextOrder;

              // Detectar si el aprobador ya aprobó esta requisición
              const yaAprobaste = !!(actual &&
                (actual.aprobado === true ||
                  actual.approved === true ||
                  String(actual.estado_aprobador || "").toLowerCase() === "aprobado")
              );

              // incluir approvers y flags útiles para la UI
              return {
                ...req,
                approvers,
                nextOrder,
                puedeAprobar: !!puedeAprobar,
                yaAprobaste: !!yaAprobaste,
                isApprover: !!actual,
              };
            } catch {
              return { ...req, puedeAprobar: false, yaAprobaste: false, isApprover: false, approvers: [] };
            }
          })
        );

        setRequisiciones(completadas);
      }
      else if (permissions?.isComprador) {
        // No filtrar aquí: asignar la lista tal como venga del backend y loguear para debugging.
        const res = await api.get("/api/requisiciones", { headers: { Authorization: token ? `Bearer ${token}` : "" } });
        const data = res.data;
        const listaRaw = Array.isArray(data) ? data : (data ? [data] : []);
        console.debug("fetchRequisiciones (comprador) - recibidos:", listaRaw.length, listaRaw.slice(0, 3));
        // Asignar la lista completa; la UI aplicará el filtrado/normalización si hace falta.
        setRequisiciones(listaRaw);
      }
      else if (user?.nombre) {
        const res = await api.get("/api/requisiciones", { headers: { Authorization: token ? `Bearer ${token}` : "" } });
        const data = res.data;
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
    let intervalId;
    const startPolling = () => {
      const init = async () => {
        try {
          if (permissions?.isAprobador) {
            const resPendInit = await api.get(
              "/api/requisiciones/pendientes",
              { headers: { Authorization: token ? `Bearer ${token}` : "", "X-User-Id": user?.id } }
            );
            const dataPendInit = resPendInit.data;


            prevPendingIdsRef.current = new Set(
              (Array.isArray(dataPendInit) ? dataPendInit : [dataPendInit]).map(r => r.requisicion_id)
            );

          }
          const resAllInit = await api.get(
            "/api/requisiciones",
            { headers: { Authorization: token ? `Bearer ${token}` : "" } }
          );

          const allInit = resAllInit.data;
          prevStatusesRef.current = new Map(
            (Array.isArray(allInit) ? allInit : [allInit]).map(r => [r.requisicion_id, r.status])
          );

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
            const resPend = await api.get("/api/requisiciones/pendientes", {
              headers: { Authorization: token ? `Bearer ${token}` : "", "X-User-Id": user?.id },
            });
            if (resPend.status >= 200 && resPend.status < 300) {
              const dataPend = resPend.data;
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
          const resAll = await api.get("/api/requisiciones", { headers: { Authorization: token ? `Bearer ${token}` : "" } });
          if (resAll.status >= 200 && resAll.status < 300) {
            const all = resAll.data;
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
    if (!permissions || !token) return;
    startPolling();
    return () => clearInterval(intervalId);
  }, [permissions]);

  useEffect(() => {
    if (permissions) fetchRequisiciones();
  }, [permissions, user]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.toast = toast;
    }
    return () => { if (typeof window !== "undefined") window.toast = undefined; };
  }, []);

  const handleVerifyOpen = async (req) => {
    try {
      setVerifyLoading(true);

      if (!token) {
        toast.error("Token no encontrado. Por favor inicia sesión.");
        setVerifyLoading(false);
        return;
      }

      const res = await api.get(`/api/requisiciones/${req.requisicion_id}`, { headers: { Authorization: token ? `Bearer ${token}` : "" } });
      if (res.status < 200 || res.status >= 300) throw new Error("Error al obtener detalles");
      const data = res.data;

      // 👇👇 AGREGA ESTO AQUÍ 👇👇
      console.log("🔵 DATA COMPLETA:", data);
      console.log("🟦 Productos recibidos:", data.productos);
      console.log("🟩 Requisición recibida:", data.requisicion);

      setVerifyModalReq({
        ...data.requisicion,
        productos: data.productos,
        requisicion_id: req.requisicion_id
      });

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
                const res = await api.post(`/api/requisiciones/${id}/devolver`, {}, { headers: { Authorization: token ? `Bearer ${token}` : "" } });
                if (res.status < 200 || res.status >= 300) throw new Error("Error al devolver");
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
                const res = await api.post(`/api/requisiciones/${id}/aprobar-total`, {}, { headers: { Authorization: token ? `Bearer ${token}` : "" } });
                if (res.status < 200 || res.status >= 300) throw new Error("Error al aprobar");
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
                    siExiste: (verifyModalReq?.productos || []).some(p => !!p.ergonomico),
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
    if (!loading && permissions?.isAprobador && requisiciones.some(r => isPendingState(r.status || r.estado_aprobacion))) {
      if (!toast.isActive(pendingToastIdRef.current)) {
        toast.info("Tienes requisiciones por aprobar", { toastId: pendingToastIdRef.current });
      }
    } else {
      // si ya no hay pendientes, cerrar notificación previa
      if (toast.isActive(pendingToastIdRef.current)) {
        toast.dismiss(pendingToastIdRef.current);
      }
    }

    if (!loading && permissions?.isComprador && requisiciones.some(r => isApprovedState(r.status || r.estado))) {
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

  function getStatusLabel(estado) {
    const normalized = String(estado).toLowerCase().trim();

    switch (normalized) {
      case "pendiente":
        return "Pendiente";
      case "rechazada":
        return "Rechazada";
      case "aprobada":
        return "Aprobada";
      case "totalmente aprobada":
        return "Totalmente Aprobada";
      case "devuelta":
        return "Devuelta";
      default:
        return estado || "Desconocido";
    }
  }

  useEffect(() => {
    fetchRequisiciones();

  }, []);

  const abrirModalNuevaReq = () => {
    handleStartProcessCamunda();
    setOpen(true);
  }

  const handleStartProcessCamunda = async () => {
    try {
      await iniciarProceso({})
    } catch (error) {
      console.log("Error al iniciar el proceso: ", error)
    }
  }

  const handleOpenSolicitanteModal = async (req) => {
    try {
      setLoadingSolicitante(true);
      if (!token) {
        toast.error("Token no encontrado. Por favor inicia sesión.");
        setLoadingSolicitante(false);
        return;
      }

      const res = await api.get(
        `/api/requisiciones/${req.requisicion_id}`,
        {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        }
      );

      const data = res.data;

      console.log("🔵 Req solicitante:", data);

      // Intentar obtener información de aprobadores (flujo)
      let aprobadores = [];
      try {
        const apr = await api.get(
          `/api/requisiciones/${req.requisicion_id}/aprobacion`,
          { headers: { Authorization: token ? `Bearer ${token}` : "" } }
        );
        const aprData = apr.data || {};
        const rawApprovers = aprData.approvers || aprData.aprobadores || [];
        // Mapear aprobadores para incluir si es el usuario actual y su estado
        aprobadores = rawApprovers.map((a) => {
          const isCurrent =
            a.nombre_aprobador?.toLowerCase() === user?.nombre?.toLowerCase() ||
            a.rol_aprobador?.toLowerCase() === user?.rol?.toLowerCase();
          const userStatus = isCurrent
            ? normalizeEstado(a.estado || a.estado_aprobador || a.estado_aprobacion || "")
            : null;
          return {
            ...a,
            isCurrent,
            userStatus,
          };
        });
      } catch (e) {
        console.warn("No se pudo obtener data de aprobadores:", e);
      }

      // Asegurar que siempre haya un campo `requisicion_id` (fallbacks)
      setSolicitanteReq({
        ...data.requisicion,
        productos: data.productos,
        requisicion_id:
          data.requisicion?.requisicion_id ??
          data.requisicion_id ??
          req.requisicion_id,
        aprobadores, // añadir lista de aprobadores al estado
      });

      setOpenReqModal(true);
    } catch (err) {
      console.error(err);
      toast.error("No se pudo cargar la requisición");
    } finally {
      setLoadingSolicitante(false);
    }
  };

  // Calcular estado normalizado de la requisición seleccionada (para usar en el modal del solicitante)
  const estadoSolicitante = solicitanteReq
    ? String(
      solicitanteReq?.status ||
      solicitanteReq?.estado_aprobacion ||
      solicitanteReq?.estado ||
      ""
    ).toLowerCase()
    : "";

  // Helper para mostrar estado legible de cada aprobador
  const getApproverLabel = (a) => {
    // posibles campos: aprobado, approved, estado_aprobador, visible, orden
    if (!a) return "Desconocido";
    if (a.aprobado === true || a.approved === true || String(a.estado_aprobador || "").toLowerCase() === "aprobado") {
      return "Aprobado";
    }
    if (a.visible === true) return "Visible";
    return "Pendiente";
  };

  const getAreaNombre = (areaId) => {
    switch (areaId) {
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

  const getCargoNombre = (cargoId) => {
    switch (cargoId) {
      case "managerGeneral":
        return "Gerente General";
      case "managerAdmin":
        return "Gerente Administrativo";
      case "managerAreaTyc":
        return "Gerente de Área Tecnologia y Proyectos";
      case "managerSST":
        return "Gerente de Área SST";
      case "dicTyC":
        return "Director / Líder de Área Tec y Proyectos";
      case "dicSST":
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
        return cargoId || "Usuario";
    }
  };

  const handleEditOpen = async (req) => {
    // fetch details (optional)
    try {
      const res = await api.get(
        `/api/requisiciones/${req.requisicion_id}`,
        { headers: { Authorization: token ? `Bearer ${token}` : "" } }
      );
      if (res.status < 200 || res.status >= 300) throw new Error("Error al obtener requisiciones del aprobador");
      const data = res.data;
      // abrir modal en modo edición (solo steps 2 y 3)
      setModalInitialData(data);
      setOpen(true);
    } catch (err) {
      console.error(err);
      toast.error("No se pudo obtener detalles");
    }
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
                const res = await api.delete(`/api/requisiciones/${id}`, { headers: { Authorization: token ? `Bearer ${token}` : "" } });
                if (res.status < 200 || res.status >= 300) throw new Error("Error al eliminar");
                toast.success("Formulario eliminado correctamente.");
                setOpenReqModal(false);
                await fetchRequisiciones();
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

  const openTimeline = (id) => {
    setTimelineReqId(id);
    setTimelineOpen(true);
  };

  const handleDescargarPDF = async (id) => {
    try {
      setProgress("Preparando datos...");

      const res = await api.get(`/api/requisiciones/${id}/pdf`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
        responseType: "blob",
        onDownloadProgress: (progressEvent) => {
          const total = progressEvent.total || 1;
          const percent = Math.round((progressEvent.loaded * 100) / total);
          setProgress(`Descargando PDF (${percent}%)...`);
        }
      });

      setProgress("Finalizando...");

      const blob = new Blob([res.data], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `requisicion_${id}.pdf`;
      link.click();

      URL.revokeObjectURL(blobUrl);

      setProgress(null); // oculta barra
      toast.success("PDF descargado correctamente.");
    } catch (err) {
      console.error(err);
      setProgress(null);
      toast.error("Error descargando PDF.");
    }
  };

  return (
    <div className="dashboard-container-requisiciones" style={{ display: "flex" }}>
      <Sidebar onToggle={setIsSidebarOpen} />
      <TimeLap open={timelineOpen} onClose={() => setTimelineOpen(false)} requisicionId={timelineReqId} token={token} />
      <div
        className="dashboard-content"
        style={{
          flex: 1,
          transition: "margin-left 0.3s ease",
          marginLeft: isSidebarOpen ? "210px" : "80px",
        }}
      >
        <Navbar />
        <WizardModal
          open={open}
          onClose={() => { setOpen(false); setModalInitialData(null); }}
          onCreated={fetchRequisiciones}
          initialData={modalInitialData}
          startStep={modalInitialData ? 2 : undefined}
        />
        <Suspense fallback={<div>Cargando...</div>}>
          <div className="containerOneDashboard">
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
                      {requisiciones.filter((r) => isApprovedState(r.estado_aprobacion || r.status)).length}
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
                      {requisiciones.filter((r) => isPendingState(r.estado_aprobacion || r.status)).length}
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
                      {requisiciones.filter((r) => normalizeEstado(r.estado_aprobacion || r.status) === "rechazada").length}
                    </h2>
                  </div>
                  <div className="iconRechazarReq">
                    <FontAwesomeIcon icon={faFileCircleXmark} />
                  </div>
                </div>
                <div className="floating-actions">
                  <button onClick={fetchRequisiciones} className="fab-btn secondary">
                    <FontAwesomeIcon icon={faRefresh} />
                  </button>
                  {permissions?.canCreateRequisition && (
                    <button onClick={abrirModalNuevaReq} className="fab-btn primary">
                      <FontAwesomeIcon icon={faPlus} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Suspense>
        <div className="secondContainerDash">
          <div className="containerTwoDash">
            <div className="papaHeaderRequi">
              <div className="barraDeNavegacion">
                <SearchBar
                  placeholder="Buscar por ID de requisición..."
                  onQueryChange={setSearchQuery}
                />
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
                requisicionesFiltradas.map((req) => {
                  const estado = String(req.status || req.estado_aprobacion || "").toLowerCase();
                  const fecha = req.fecha || req.created_at || "—";
                  const valor = req.valor_total || req.valor || 0;

                  return (
                    <div key={req.requisicion_id} className="cardAccent" onClick={async () => {
                      if (permissions?.isComprador) {
                        handleVerifyOpen(req);
                        return;
                      }
                      if (permissions?.isAprobador) {
                        setSelectedReq(req);
                        return;
                      }
                      handleOpenSolicitanteModal(req);
                      setSolicitanteReq(req);
                      setOpenReqModal(true);
                    }}
                    >
                      <div className={`${styles.accentBar} ${getBadgeClassBar(estado)}`}></div>

                      <div className={styles.accentContent}>
                        <div className={styles.accentHeader}>
                          <div className={styles.accentLeft}>
                            <h3 className={styles.accentTitle}>Req. #{req.requisicion_id}</h3>
                            <p className={styles.accentCreator}>{req.nombre_solicitante}</p>
                          </div>

                          <span className={`${styles.badge} ${getBadgeClass(estado)}`}>
                            {getStatusLabel(estado)}
                          </span>


                        </div>

                        <div className={styles.accentFooter}>
                          <p className={styles.accentDate}>
                            {fecha}
                          </p>
                          <p className={styles.accentPrice}>
                            {formatCOP(valor)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
        {selectedReq && (
          <ApprovalModal
            requisicion={selectedReq}
            onClose={() => setSelectedReq(null)}
            onApproved={fetchRequisiciones}
            user={user}             // ← APORTA EL USUARIO LOGUEADO
            token={token}
          />
        )}
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
                        <th>#</th><th>Producto</th><th>Cantidad</th><th>Valor estimado</th><th>Cuenta Contable</th><th>Centro Costo</th><th>Tecnológico</th><th>Ergonómico</th>
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
                          <td style={{ padding: 6 }}>{p.cuenta_contable}</td>
                          <td>{p.centro_costo}</td>

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
        {openReqModal && solicitanteReq && (
          <div className="modalOverlay">
            <div className="modalBox">
              <style>{`
                .skeleton-line{
                  display:inline-block;
                  height:12px;
                  border-radius:6px;
                  background: linear-gradient(90deg, #e9e9e9 25%, #f5f5f5 50%, #e9e9e9 75%);
                  background-size: 200% 100%;
                  animation: shimmer 1.2s linear infinite;
                }
                @keyframes shimmer{
                  0%{ background-position: 200% 0; }
                  100%{ background-position: -200% 0; }
                }
              `}</style>

              <div className="infoIzquierdaReq">
                <div className="containerProductosAsociados">
                  <h2>Productos Asociados</h2>
                  <div className="containerDeverdadTabla">
                    <div className="tabla-productos-container">

                      <table>
                        <thead>
                          <tr>
                            <th>Producto / Servicio</th>
                            <th>Cuenta Contable</th>
                            <th>Centro Costo</th>
                            <th className="center">Cantidad</th>
                            <th className="right">Valor Unitario</th>
                            <th className="center">Tecnológico</th>
                            <th className="center">Ergonómico</th>
                          </tr>
                        </thead>

                        <tbody>
                          {loadingSolicitante ? (
                            // skeleton rows mientras carga
                            Array.from({ length: 3 }).map((_, sIdx) => (
                              <tr key={"sk-" + sIdx} className={sIdx % 2 === 0 ? "fila-par" : "fila-impar"}>
                                <td>
                                  <div className="skeleton-line" style={{ width: "60%", height: 14 }} />
                                </td>
                                <td className="center">
                                  <div className="skeleton-line" style={{ width: "30%", height: 12 }} />
                                </td>
                                <td className="center">
                                  <div className="skeleton-line" style={{ width: "30%", height: 12 }} />
                                </td>
                                <td className="center">
                                  <div className="skeleton-line" style={{ width: "30%", height: 12 }} />
                                </td>
                                <td className="right">
                                  <div className="skeleton-line" style={{ width: "40%", height: 12 }} />
                                </td>
                                <td className="center">
                                  <div className="skeleton-line" style={{ width: "30%", height: 12 }} />
                                </td>
                                <td className="center">
                                  <div className="skeleton-line" style={{ width: "30%", height: 12 }} />
                                </td>
                              </tr>
                            ))
                          ) : (
                            solicitanteReq?.productos?.map((producto, idx) => (
                              <tr key={producto.id ?? idx} className={idx % 2 === 0 ? "fila-par" : "fila-impar"}>
                                <td>
                                  <p className="prod-nombre">{producto.nombre}</p>
                                  <p className="prod-desc">{producto.descripcion}</p>
                                </td>

                                <td>
                                  <p className="prod-cuenta">{producto.cuenta_contable}</p>
                                </td>

                                <td>
                                  <p className="prod-centro">{producto.centro_costo}</p>
                                </td>

                                <td className="center">
                                  <p className="bold">{producto.cantidad}</p>
                                </td>

                                <td className="right">
                                  <p className="valor">
                                    {formatCOP(producto.valor_estimado)}
                                  </p>
                                </td>

                                <td className="center">
                                  <span className={producto.compra_tecnologica ? "ok" : "no"}>
                                    {producto.compra_tecnologica ? "✓ Sí" : "No"}
                                  </span>
                                </td>

                                <td className="center">
                                  <span className={producto.ergonomico ? "ok" : "no"}>
                                    {producto.ergonomico ? "✓ Sí" : "No"}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <div className="infoDerechaReq">
                <div className="detallesReqCompletos">
                  <div className="detallesRequisicion">
                    <h1>Detalles</h1>
                    {loadingSolicitante ? (
                      <div className="areaYFecha">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="containerInfoReq" style={{ marginBottom: 10 }}>
                            <div className="skeleton-line" style={{ width: i % 2 ? "50%" : "80%", height: 14 }} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="areaYFecha">
                        <div className="containerInfoReq">
                          <p className="labelTittle">Área:</p>
                          <p className="textLabel">{getAreaNombre(solicitanteReq.area) || "—"}</p>
                        </div>
                        <div className="containerInfoReq">
                          <p className="labelTittle">Sede:</p>
                          <p className="textLabel">{solicitanteReq.sede || "—"}</p>
                        </div>
                        <div className="containerInfoReq">
                          <p className="labelTittle">Fecha:</p>
                          <p className="textLabel">{solicitanteReq.fecha || "—"}</p>
                        </div>
                        <div className="containerInfoReq">
                          <p className="labelTittle">Justificación:</p>
                          <p className="textLabel">{solicitanteReq.justificacion || "No tiene."}</p>
                        </div>
                        <div className="containerInfoReq">
                          <p className="labelTittle">Nivel de Urgencia:</p>
                          <p className="textLabel">{solicitanteReq.urgencia || "—"}</p>
                        </div>
                        <div className="containerInfoReq">
                          <p className="labelTittle">¿Esta presupuestada?:</p>
                          <p className="textLabel">{solicitanteReq.presupuestada ? "Sí" : "No"}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="montoPrecioReq">
                  <div className="containerMontoTotal">
                    <p className="labelMonto">Monto Total</p>
                    <p className="labelTotal">{formatCOP(solicitanteReq.valor_total)}</p>
                    <p className="labelMontoText">Valor total estimado para esta requisición</p>
                  </div>
                </div>
              </div>
              <div className="headerInfoReq">
                <div className="contentIzquierda">
                  {progress && (
                    <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow-lg">
                      {progress}
                    </div>
                  )}

                  {loadingSolicitante ? (
                    <>
                      <div className="tittle">
                        <p style={{ fontSize: 18 }}>
                          <span className="skeleton-line" style={{ width: 140, height: 20 }} />
                        </p>
                      </div>
                      <div className="tagEstado" style={{ marginTop: 8 }}>
                        <span className="skeleton-line" style={{ width: 80, height: 18, borderRadius: 12 }} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="tittle">
                        <p>REQUISICION #{solicitanteReq.requisicion_id}</p>
                      </div>
                      <div className="tagEstado">
                        <span className={`${styles.badge} ${getBadgeClass(estadoSolicitante)}`}>
                          {getStatusLabel(estadoSolicitante)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                <div className="buttonsHeaderInfoReq">
                  <button
                    title="Ver flujo"
                    onClick={() => openTimeline(solicitanteReq.requisicion_id)}
                    style={{ color: "#1d5da8", fontSize: "18px" }}
                    className="iconTimeLone"
                  >
                    <FontAwesomeIcon icon={faTimeline} />
                  </button>
                  {/*
                  <button
                    title="Word"
                    onClick={() => handleDescargarPDF(solicitanteReq.requisicion_id)}
                    style={{ color: "#1d5da8", fontSize: "18px" }}
                    className="iconPdf"
                  >
                    <FontAwesomeIcon icon={faDownload} />
                  </button>
                  */}
                  {permissions?.canCreateRequisition && (
                    <button
                      title="Editar"
                      onClick={() => handleEditOpen(solicitanteReq)}
                    >
                      <FontAwesomeIcon icon={faPencil} style={{ color: "#1d5da8", fontSize: "18px" }} />
                    </button>
                  )}
                  {permissions?.canCreateRequisition && (
                    <button
                      title="Eliminar"
                      onClick={() => handleDelete(solicitanteReq.requisicion_id)}
                    >
                      <FontAwesomeIcon icon={faTrash} style={{ color: "red", fontSize: "18px" }} />
                    </button>
                  )}
                  <button
                    className="modalCloseReq"
                    style={{ color: "#1d5da8", fontSize: "18px", }}
                    onClick={() => {
                      setOpenReqModal(false);
                      setSolicitanteReq(null);
                    }}
                  >
                    <FontAwesomeIcon icon={faX} />
                  </button>
                </div>
              </div>
            </div>
            {/*
            <div className="modalBox">
              <h2>Requisición #{solicitanteReq.requisicion_id}</h2>
              <p><strong>Solicitante:</strong> {solicitanteReq.nombre_solicitante}</p>
              <p><strong>Valor total:</strong> {formatCOP(solicitanteReq.valor_total)}</p>
              <p><strong>Estado:</strong> {getStatusLabel(solicitanteReq.status)}</p>
              <p><strong>Fecha:</strong> {solicitanteReq.fecha}</p>
              <button
                className="modalCloseReq"
                onClick={() => {
                  setOpenReqModal(false);
                  setSolicitanteReq(null);
                }}
              >
                Cerrar
              </button>
            </div>
            */}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <AuthProvider>
      <DashboardInner />
    </AuthProvider>
  );
}
