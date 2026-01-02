"use client";
import React, { useState, useEffect, useRef } from "react";
import { Sidebar } from "../components/Slidebar";
import Navbar from "../components/navbar";
import SearchBar from "../components/searchBar";
import ApprovalModal from "../components/ApprovalModal";
import { faTrash, faPencil, faUser, faFilePdf, faTimeline, faX, faPlus, faRefresh, faFile, faFileCircleCheck, faFileCircleQuestion, faFileCircleXmark, faFileEdit, faFileExcel, faUserPen, faDownload, faBoxArchive, faEye, faCalendarAlt, faCalendar, faAngleDown, faGear, faRightFromBracket, faUserGear, faUserShield, faClipboardList, faClipboardCheck, faClipboardQuestion } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Suspense } from "react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { approveBuyerTask, iniciarProceso } from "../services/camunda";
import styles from "../dashboard/DashboardRequisiciones.module.css";
import api from "../services/axios";
import WizardModal from "../components/modalNewReq";
import TimeLap from "../components/timeLap";
import { useRouter } from "next/navigation";
import { Toast } from 'primereact/toast';
import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { useLayoutEffect } from "react";
import LoadingView from "../components/loadingView";


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

  const getSedeNombre = (sede) => {
    switch (sede) {
      case "cota":
        return "Cota";
    }
  };

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
  const sessionToastIdRef = useRef("session-started");
  const pendingToastIdRef = useRef("pending-reqs");
  const router = useRouter();
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
  const [productosSolicitante, setProductosSolicitante] = useState([]);
  const [openUserModal, setOpenUserModal] = useState(false)
  const toastRef = useRef(null);

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
    let matchesStatus = true;
    if (statusFilter === "todas") {
      matchesStatus = true;
    } else if (statusFilter === "aprobada") {
      matchesStatus = estado === "aprobada" || estado === "totalmente aprobada";
    } else {
      matchesStatus = estado === String(statusFilter).toLowerCase();
    }

    return matchesSearch && matchesStatus;
  });

  const fetchRequisiciones = async () => {
    try {
      setLoading(true);

      if (permissions?.isAprobador && user?.nombre) {
        const res = await api.get(`/api/requisiciones/aprobador/${encodeURIComponent(user.nombre)}`, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        let data = res.data;
        let lista = Array.isArray(data) ? data : [data];
        // Ordenar por requisicion_id descendente (más reciente primero)
        lista = lista.sort((a, b) => Number(b.requisicion_id) - Number(a.requisicion_id));
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
        const res = await api.get("/api/requisiciones", { headers: { Authorization: token ? `Bearer ${token}` : "" } });
        let data = res.data;
        let listaRaw = Array.isArray(data) ? data : (data ? [data] : []);
        // Ordenar por requisicion_id descendente
        listaRaw = listaRaw.sort((a, b) => Number(b.requisicion_id) - Number(a.requisicion_id));
        setRequisiciones(listaRaw);
      }
      else if (user?.nombre) {
        const res = await api.get("/api/requisiciones", { headers: { Authorization: token ? `Bearer ${token}` : "" } });
        let data = res.data;
        let lista = (Array.isArray(data) ? data : [data]).filter(
          (r) => r.nombre_solicitante?.toLowerCase() === user.nombre.toLowerCase()
        );
        // Ordenar por requisicion_id descendente
        lista = lista.sort((a, b) => Number(b.requisicion_id) - Number(a.requisicion_id));
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

      // 1. Obtener datos de la requisición (cabecera)
      const res = await api.get(`/api/requisiciones/${req.requisicion_id}`, { headers: { Authorization: token ? `Bearer ${token}` : "" } });
      if (res.status < 200 || res.status >= 300) throw new Error("Error al obtener detalles");
      const data = res.data;

      // 2. Obtener productos usando el nuevo endpoint dedicado
      const resProd = await api.get(`/api/requisiciones/${req.requisicion_id}/productos`, { headers: { Authorization: token ? `Bearer ${token}` : "" } });
      const productos = resProd.data?.productos || [];

      // 👇👇 AGREGA ESTO AQUÍ 👇👇
      console.log("🔵 DATA COMPLETA:", data);
      console.log("🟦 Productos recibidos (endpoint dedicado):", productos);
      console.log("🟩 Requisición recibida:", data.requisicion);

      setVerifyModalReq({
        ...data.requisicion,
        productos: productos,
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

  // Nueva función para aprobar un producto individualmente
  const handleAprobarProducto = async (requisicionId, productoId) => {
    const toastId = toast.info(
      <div
        style={{
          padding: "10px",
          textAlign: "center",
          color: "white",
        }}
      >
        <strong style={{ display: "block", marginBottom: "8px" }}>
          ¿Deseas aprobar este producto?
        </strong>
        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
          <button
            style={{
              backgroundColor: "#16a34a",
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
                const res = await api.post(
                  `/api/requisiciones/${requisicionId}/productos/${productoId}/aprobar`,
                  {},
                  { headers: { Authorization: token ? `Bearer ${token}` : "" } }
                );
                if (res.status < 200 || res.status >= 300) throw new Error("Error al aprobar producto");
                toast.success("Producto aprobado correctamente");
                // Refrescar detalles de la requisición
                await handleVerifyOpen({ requisicion_id: requisicionId });
                await fetchRequisiciones();
              } catch (err) {
                console.error(err);
                toast.error("No se pudo aprobar el producto");
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
        position: "top-right",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        closeButton: false,
        style: {
          background: "#3b82f6",
          borderRadius: "10px",
        },
        icon: "ℹ️",
      }
    );
  };

  useEffect(() => {
    // Mostrar notificación una sola vez (usar toastId para evitar duplicados)
    if (!loading && permissions?.isAprobador) {
      const tieneRequisicionesPendientes = requisiciones.some(
        r => normalizeEstado(r.status || r.estado_aprobacion || "") === "pendiente"
      );

      if (tieneRequisicionesPendientes) {
        if (!toast.isActive(pendingToastIdRef.current)) {
          toast.info("Tienes requisiciones por aprobar", { toastId: pendingToastIdRef.current });
        }
      } else {
        // Si no hay pendientes, cerrar notificación previa
        if (toast.isActive(pendingToastIdRef.current)) {
          toast.dismiss(pendingToastIdRef.current);
        }
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
      setOpenReqModal(true); // 🔥 Abre el modal INMEDIATAMENTE con estado de carga

      if (!token) {
        toast.error("Token no encontrado. Por favor inicia sesión.");
        setLoadingSolicitante(false);
        return;
      }

      // 1. Obtener datos de la requisición (cabecera)
      const res = await api.get(
        `/api/requisiciones/${req.requisicion_id}`,
        {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        }
      );
      const data = res.data;

      // 2. Obtener productos usando el endpoint dedicado
      const resProd = await api.get(
        `/api/requisiciones/${req.requisicion_id}/productos`,
        { headers: { Authorization: token ? `Bearer ${token}` : "" } }
      );
      const productos = resProd.data?.productos || [];
      setProductosSolicitante(productos);


      console.log(productos)

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
        requisicion_id:
          data.requisicion?.requisicion_id ??
          data.requisicion_id ??
          req.requisicion_id,
        aprobadores: []// añadir lista de aprobadores al estado
      });

    } catch (err) {
      console.error(err);
      toast.error("No se pudo cargar la requisición");
      setOpenReqModal(false);
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
      case "dicCAF":
        return "Director Cafetería";
      case "gerCAF":
        return "Gerente Cafetería";
      case "dicPAP":
        return "Director Papelería";
      case "gerPAP":
        return "Gerente Papelería";
      default:
        return cargoId || "Usuario";
    }
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
      case "CAF":
        return "Cafetería";
      case "PAP":
        return "Papelería";
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

  useEffect(() => {
    const handler = (e) => {
      setTimelineReqId(e.detail.requisicionId);
      setTimelineOpen(true);
    };
    window.addEventListener("openTimeLap", handler);
    return () => window.removeEventListener("openTimeLap", handler);
  }, []);

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

  const getUserRoles = (user) => {
    const roles = [];

    if (user.super_admin) roles.push("Super Admin");
    if (user.aprobador) roles.push("Aprobador");
    if (user.solicitante) roles.push("Solicitante");
    if (user.comprador) roles.push("Comprador");

    return roles.length > 0 ? roles.join(" | ") : "Sin rol asignado";
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openUserModal.current && !openUserModal.current.contains(e.target)) {
        setOpenUserModal(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (typeof logout === "function") {
        try { logout(); } catch (e) { /* ignore */ }
      }
      await api.post("http://localhost:8000/api/auth/logout", {
        headers: { Authorization: `Bearer ${token}` },
      });
      router.push("/");
    } catch (err) {
      console.error("Error durante logout:", err);
      router.push("/");
    }
  }

  // Ajuste de tamaño del Toast PrimeReact por CSS-in-JS (opcional, para forzar tamaño)
  useLayoutEffect(() => {
    const styleId = "custom-prime-toast-size";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.innerHTML = `
        .p-toast {
          min-width: 320px !important;
          max-width: 420px !important;
          font-size: 1.1rem !important;
        }
        .p-toast-message {
          min-height: 56px !important;
          padding: 18px 24px !important;
        }
        .p-toast-message-text {
          font-size: 1.08rem !important;
        }
        .p-toast-summary {
          font-size: 1.12rem !important;
          font-weight: 600 !important;
        }
        .p-toast-detail {
          font-size: 1.08rem !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div className="dashboard-container-requisiciones" style={{ display: "flex" }}>
      <Toast ref={toastRef} position="top-right" />
      <Sidebar onToggle={setIsSidebarOpen} />
      <TimeLap open={timelineOpen} onClose={() => setTimelineOpen(false)} requisicionId={timelineReqId} token={token} />
      <div
        className="dashboard-content"
        style={{
          flex: 1,
          transition: "margin-left 0.3s ease",
          marginLeft: isSidebarOpen ? "280px" : "80px",
        }}
      >
        <div className="navbarDashboard"
          style={{
            left: isSidebarOpen ? "285px" : "80px",
            width: `calc(100% - ${isSidebarOpen ? 285 : 80}px)`,
            zIndex: 900,
            transition: "left 0.28s ease, width 0.28s ease",
          }}>
          <div className="textoNavBar">
            <h1>Dashboard</h1>
          </div>

          <div className="campoButtonsAndInfoUser">
            <div className="infoUser">
              <div className="nameAndRol">
                {user ? (
                  <>
                    <h3>Hola, {user.nombre}</h3>
                    <p>{getCargoNombre(user.cargo)}</p>
                  </>
                ) : (
                  <>
                    <h3>Cargando usuario...</h3>
                    <p></p>
                  </>
                )}
              </div>
              <div className="imgUser" onClick={() => setOpenUserModal(!openUserModal)} style={{ cursor: "pointer", position: "relative" }}>
                <FontAwesomeIcon icon={faUser} />
              </div>

            </div>
          </div>
        </div>
        <div className="containerInfoRequisiciones">
          <div className="secondContainerDash">
            <div className="containerTwoDash">
              <div className="firstSectionProcents">

              </div>
              <div className="containerPorcents">
                <div className="porcentsRequisiciones">
                  <div
                    className="campoFiltroReq"
                    style={{ cursor: "pointer" }}
                    onClick={() => setStatusFilter("todas")}
                  >
                    <div className="iconoContainerFiltro">
                      <FontAwesomeIcon icon={faClipboardList} className="iconoFiltroReq" />
                    </div>
                    <div className="spaceCantidad">
                      <p className="spaceCantidad">{requisiciones.length}</p>
                    </div>
                    <div className="infoFiltroReq">
                      <p>Requisiciones totales</p>
                    </div>
                  </div>
                  <div
                    className="campoFiltroReq"
                    style={{ cursor: "pointer" }}
                    onClick={() => setStatusFilter("aprobada", "Totalmente Aprobada")}
                  >
                    <div className="iconoContainerFiltro">
                      <FontAwesomeIcon icon={faClipboardCheck} className="iconoFiltroReq" />
                    </div>
                    <div className="spaceCantida">
                      <p className="spaceCantidad">
                        {requisiciones.filter((r) => isApprovedState(r.estado_aprobacion || r.status)).length}
                      </p>
                    </div>
                    <div className="infoFiltroReq">
                      <p>Requisiciones aprobadas</p>
                    </div>
                  </div>
                  <div
                    className="campoFiltroReq"
                    style={{ cursor: "pointer" }}
                    onClick={() => setStatusFilter("pendiente")}
                  >
                    <div className="iconoContainerFiltro">
                      <FontAwesomeIcon icon={faClipboardQuestion} className="iconoFiltroReq" />
                    </div>
                    <div className="spaceCantidad">
                      <p>
                        {requisiciones.filter((r) => isPendingState(r.estado_aprobacion || r.status)).length}
                      </p>
                    </div>
                    <div className="infoFiltroReq">
                      <p>Requisiciones pendientes</p>
                    </div>
                  </div>
                  <div
                    className="campoFiltroReq"
                    style={{ cursor: "pointer" }}
                    onClick={() => setStatusFilter("rechazada")}
                  >
                    <div className="iconoContainerFiltro">
                      <FontAwesomeIcon icon={faClipboardCheck} className="iconoFiltroReq" />
                    </div>
                    <div className="spaceCantidad">
                      <p>
                        {requisiciones.filter((r) => normalizeEstado(r.estado_aprobacion || r.status) === "rechazada").length}
                      </p>
                    </div>
                    <div className="infoFiltroReq">
                      <p>Requisiciones rechazadas</p>
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
                  <div className="buttonsReq">
                    {permissions?.isSolicitante && (
                      <button onClick={abrirModalNuevaReq} className="fab-btn primary">
                        <FontAwesomeIcon icon={faPlus} /> Nueva requisición
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="tablaRequisicion">
                <div className="listaReq">
                  {loading ? (
                    <LoadingView />
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
                    /* Tabla de requisiciones (usando clases del ejemplo de row) */
                    <div className="requisitionsTableContainer">
                      <table className="requisitionsTable">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Fecha de Solicitud</th>
                            <th>Solicitante</th>
                            <th>Area</th>
                            <th>Valor</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {requisicionesFiltradas.map((req) => {
                            const estado = String(req.status || req.estado_aprobacion || "").toLowerCase();
                            const fecha = req.fecha || req.created_at || "—";
                            const valor = req.valor_total || req.valor || 0;

                            const onRowClick = async () => {
                              if (permissions?.isComprador) {
                                setVerifyLoading(true); // Mostrar loading inmediatamente
                                setVerifyModalReq({});  // Abre la modal con loading
                                await handleVerifyOpen(req); // Luego carga los datos
                                return;
                              }
                              if (permissions?.isAprobador) {
                                setSelectedReq(req);
                                return;
                              }
                              // Para solicitante: mostrar loading primero
                              setLoadingSolicitante(true);
                              setOpenReqModal(true); // Abre la modal con loading
                              await handleOpenSolicitanteModal(req); // Luego carga los datos
                              setSolicitanteReq(req);
                              // setOpenReqModal(true); // Ya se abre antes
                            };

                            return (
                              <tr key={req.requisicion_id} className="row">
                                <td className="colSpan2 idCell">
                                  <div className="idBadge"><span className="idText">REQ-{req.requisicion_id}</span></div>
                                </td>
                                <td className="colSpan2 dateCell">
                                  <div className="fecha">
                                    <FontAwesomeIcon icon={faCalendar} className="calendarIcon" />
                                    {fecha}
                                  </div>
                                </td>
                                <td className="requesterCell">
                                  <div className="requesterDiv">
                                    <div className="requesterInfo">
                                      <span className="requesterName">{req.nombre_solicitante || "—"}</span>
                                      <span className="requesterLabel">Solicitante</span>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <div className="areaCell" style={{ color: "var(--textColorV)", fontWeight: "bold" }}>
                                    {getAreaNombre(req.area) || "—"}
                                  </div>
                                </td>
                                <td className="colSpan2 amountCell">
                                  <div className="valor">
                                    {formatCOP(valor)}
                                  </div>
                                </td>
                                <td className="colSpan2 statusCell">
                                  <div className="campoStatus">
                                    <div className={`${styles.badge} ${getBadgeClass(estado)} statusBadge`}>
                                      {getStatusLabel(estado)}
                                    </div>
                                  </div>
                                </td>
                                <td className="colSpan1 actionsCell">
                                  <div className="campoBotonesReq">
                                    <button
                                      className="actionButton actionButtonVisible"
                                      onClick={(e) => { e.stopPropagation(); onRowClick(); }}
                                      title="Ver detalle"
                                    >
                                      <FontAwesomeIcon icon={faEye} />
                                    </button>
                                    {permissions?.isSolicitante && (
                                      <div className="campoBotonesReq">
                                        <button
                                          className="actionButton actionButtonVisible"
                                          onClick={(e) => { e.stopPropagation(); handleEditOpen(req); }}
                                          title="Editar"
                                        >
                                          <FontAwesomeIcon icon={faPencil} />
                                        </button>
                                        <button
                                          className="actionButton actionButtonVisible"
                                          onClick={(e) => { e.stopPropagation(); handleDelete(req.requisicion_id); }}
                                          title="Eliminar"
                                        >
                                          <FontAwesomeIcon icon={faTrash} style={{ color: "red" }} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        {openUserModal && (
          <div
            className="userMenuDropdown animateDropdown"
            style={{
              position: "absolute",
              top: "80px",
              right: "20px",
              width: "300px",
              background: "white",
              borderRadius: "12px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              overflow: "hidden",
              zIndex: 9999
            }}
          >
            {/* HEADER AZUL */}
            <div style={{
              background: "linear-gradient(135deg, #1d5da8, #1d5da8)",
              padding: "14px 16px",
              color: "white"
            }}>
              <p style={{ fontSize: "12px", opacity: 0.8, margin: 0 }}>SESIÓN INICIADA CON</p>
              <p style={{ fontSize: "14px", fontWeight: "bold", marginTop: "2px" }}>
                {user?.correo}
              </p>
            </div>

            {/* CONTENIDO */}
            <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: "18px" }}>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }} className="nose">
                <FontAwesomeIcon icon={faUserGear} className="iconNormal" />
                <p>{getAreaNombre(user.area)}</p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }} className="nose">
                <FontAwesomeIcon icon={faUserShield} className="iconNormal" />
                <p>{getUserRoles(user)}</p>
              </div>

              <div
                onClick={handleLogout}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  cursor: "pointer"
                }}
                className="textLogout"
              >
                <FontAwesomeIcon icon={faRightFromBracket} className="buttonLogout" />
                <span>Cerrar sesión</span>
              </div>

            </div>
          </div>
        )}
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
          <div className="modalOverlay">
            <div className="modal-content">
              {/* 🔥 OVERLAY DE CARGA */}
              {verifyLoading && (
                <div
                  className="approval-loading-overlay"
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 60,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "white",
                    borderRadius: "10px"
                  }}
                >
                  <LoadingView />
                </div>
              )}

              <div className="modal-header">
                <div className="textAndIcon">
                  <div className="iconHeaderApr">
                    <FontAwesomeIcon icon={faFile} />
                  </div>
                  <div className="textApr">
                    <h2>Verificar requisición #{verifyModalReq.requisicion_id}</h2>
                    <p>Aprobación final del comprador</p>
                  </div>
                </div>
                <button onClick={() => setVerifyModalReq(null)} className="close-button">
                  X
                </button>
              </div>

              <div className="modal-body">
                <TimeLap
                  requisicionId={verifyModalReq.requisicion_id}
                  token={token}
                  open={true}
                />
                <br />
                <div className="containerInfoReq">
                  <div className="cardsReq">
                    <h3 className="tittleOneUserNew">Datos del solicitante</h3>
                    <div className="areaYFecha">
                      <p className="labelTittle">{verifyModalReq.nombre_solicitante}</p>
                      <p className="textLabel">{verifyModalReq.area || "—"}</p>
                    </div>
                  </div>
                  <div className="cardsReq">
                    <h3 className="tittleOneUserNew">Fecha</h3>
                    <div className="areaYFecha">
                      <p className="labelTittle">{verifyModalReq.fecha || "—"}</p>
                      <p className="textLabel">{verifyModalReq.justificacion || "No tiene."}</p>
                    </div>
                  </div>
                  <div className="cardsReq">
                    <h3 className="tittleOneUserNew">Valor total</h3>
                    <div className="areaYFecha">
                      <p className="labelTittle">{formatCOP(verifyModalReq.valor_total)}</p>
                      <p className="textLabel">{verifyModalReq.productos?.length || 0} producto(s)</p>
                    </div>
                  </div>
                </div>
                <br />
                <div className="lineaSeparadora"></div>
                <h3 className="tittleOneUserNew">Productos asociados</h3>
                <div className="tabla-productos">
                  {verifyModalReq.productos?.map((p, i) => (
                    <div key={i} className="containerProductoAprove">
                      <div className="leftInfoAprove">
                        <div className="nameAndDescriptionProducto">
                          <p className="nameProducto">{p.nombre || p.productoOServicio || "—"}</p>
                          <p className="descriptionProducto">{p.descripcion || ""}</p>
                          <div className="tagsProducto">
                            <div className={`tagOption ${p.compra_tecnologica ? "active" : ""}`}>
                              Tecnológico
                            </div>
                            <div className={`tagOption ${p.ergonomico ? "active" : ""}`}>
                              Ergonómico
                            </div>
                            <div className={`tagOption ${p.aprobado === "aprobado" ? "active" : p.aprobado === "rechazado" ? "" : ""}`}
                              style={{
                                background: p.aprobado === "aprobado" ? "#dcfce7" : p.aprobado === "rechazado" ? "#fee2e2" : "#fef3c7",
                                color: p.aprobado === "aprobado" ? "#166534" : p.aprobado === "rechazado" ? "#991b1b" : "#92400e"
                              }}
                            >
                              {p.aprobado === "aprobado" ? "Aprobado" : p.aprobado === "rechazado" ? "Rechazado" : "Pendiente"}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="rightInfoAprove">
                        <div className="totalAndCantidad">
                          <p className="priceProducto">{formatCOP(p.valor_estimado ?? p.valorEstimado)}</p>
                          <p className="cantidadProducto">Cant: {p.cantidad}</p>
                        </div>
                      </div>
                    </div>
                  )) || null}
                </div>
              </div>

              <div className="modal-actions-verifyModal" style={{ padding: "11px", borderTop: "2px solid #ddd", display: "flex", gap: "10px", justifyContent: "center" }}>
                <button onClick={() => handleDevolver(verifyModalReq.requisicion_id)} disabled={verifyLoading} >
                  {verifyLoading ? "Procesando..." : "Devolver"}
                </button>
                <button onClick={() => handleAprobar(verifyModalReq.requisicion_id)} disabled={verifyLoading} >
                  {verifyLoading ? "Procesando..." : "Aprobar Total"}
                </button>
              </div>
            </div>
          </div>
        )}
        {openReqModal && (
          <div className="modalOverlay">
            <div className="modalBox">
              {loadingSolicitante ? (
                <LoadingView />
              ) : solicitanteReq ? (
                // 🔥 CONTENIDO CARGADO
                <>
                  <div className="headerInfo">
                    <button
                      className="modalCloseReq"
                      onClick={() => {
                        setOpenReqModal(false);
                        setSolicitanteReq(null);
                      }}
                    >
                      <FontAwesomeIcon icon={faX} />
                    </button>
                    <div className="tittleReq">
                      <h1>REQUISICIÓN #{solicitanteReq.requisicion_id}</h1>
                    </div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", width: "78%", justifyContent: "space-between" }}>
                      <div className="tagEstado">
                        <span className={`${styles.badge} ${getBadgeClass(estadoSolicitante)}`}>
                          {getStatusLabel(estadoSolicitante)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDescargarPDF(solicitanteReq.requisicion_id)}
                        disabled={solicitanteReq.status === "pendiente" || progress !== null}
                        className="downloadPdfButton"
                        onMouseEnter={(e) => {
                          if (progress === null) e.target.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = "translateY(0)";
                        }}
                      >
                        <FontAwesomeIcon icon={faFilePdf} />
                        {progress ? `${progress}` : "Descargar PDF"}
                      </button>
                    </div>
                  </div>

                  <div className="contentModalReq">
                    <TimeLap
                      requisicionId={solicitanteReq.requisicion_id}
                      token={token}
                      open={true}
                    />
                    <br />
                    <div className="infoGeneralReq">
                      <div className="detallesGeneralReq" style={{ display: "flex", gap: "24px" }}>
                        <div className="detallesReq">
                          <h3 className="tittleOneUserNew">datos del solicitante</h3>
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
                                <p className="labelTittle">Nombre</p>
                                <p className="textLabel">{solicitanteReq.nombre_solicitante || "—"}</p>
                              </div>
                              <div className="containerInfoReq">
                                <p className="labelTittle">Área</p>
                                <p className="textLabel">{getAreaNombre(solicitanteReq.area)}</p>
                              </div>
                              <div className="containerInfoReq">
                                <p className="labelTittle">Sede</p>
                                <p className="textLabel">{getSedeNombre(solicitanteReq.sede)}</p>
                              </div>
                              <div className="containerInfoReq">
                                <p className="labelTittle">Fecha</p>
                                <p className="textLabel">{solicitanteReq.fecha || "—"}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="detallesGeneralReq">
                        <div className="detallesReq">
                          <div className="areaYFecha">
                            <h3 className="tittleOneUserNew">resumen de productos</h3>
                            <div className="containerInfoReq">
                              <p className="labelTittle">Total productos</p>
                              <p className="textLabel">{productosSolicitante.length}</p>
                            </div>
                            <div className="containerInfoReq">
                              <p className="labelTittle">Ergonómicos</p>
                              <p className="textLabel">
                                {productosSolicitante.filter(p => p.ergonomico === 1 || p.ergonomico === true).length}
                              </p>
                            </div>
                            <div className="containerInfoReq">
                              <p className="labelTittle">Tecnológicos</p>
                              <p className="textLabel">
                                {productosSolicitante.filter(p => p.compra_tecnologica === 1 || p.compra_tecnologica === true).length}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="detallesGeneralReq">
                        <div className="detallesReq">
                          <div className="areaYFecha">
                            <h3 className="tittleOneUserNew">informacion financiera</h3>
                            <div className="containerInfoReq">
                              <p className="labelTittle">Valor Total</p>
                              <p className="textLabel">{formatCOP(solicitanteReq.valor_total)}</p>
                            </div>
                            <div className="containerInfoReq">
                              <p className="labelTittle">En presupuesto</p>
                              <p className="textLabel">
                                {solicitanteReq.presupuestada ? "Sí" : "No"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <br />
                    <div className="tablaContainerRequisicione">
                      <h3 className="tittleOneUserNew">productos solicitados</h3>
                      <div className="tablaProductosR">
                        <div className="tabla-productos-header">
                          <div>PRODUCTO / SERVICIO</div>
                          <div>CUENTA CONTABLE</div>
                          <div>CENTRO COSTO</div>
                          <div style={{ textAlign: "center" }}>CANTIDAD</div>
                          <div style={{ textAlign: "center" }}>VALOR UNITARIO</div>
                          <div style={{ textAlign: "center" }}>ESTADO</div>
                          <div style={{ textAlign: "center" }}>TECNOLÓGICO</div>
                          <div style={{ textAlign: "center" }}>ERGONÓMICO</div>
                        </div>

                        <div className="tabla-productos-body">
                          {productosSolicitante && productosSolicitante.length > 0 ? (
                            productosSolicitante.map((producto, idx) => (
                              <div
                                key={producto.id ?? idx}
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "1.8fr 1fr 1fr 1fr 1fr 1fr 0.8fr 0.8fr",
                                  gap: "12px",
                                  padding: "12px 16px",
                                  borderBottom: "1px solid #e5e7eb",
                                  backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f9fafb",
                                  alignItems: "center",
                                  textAlign: "center"
                                }}
                              >
                                {/* Producto */}
                                <div>
                                  <p className="textColor" style={{ fontWeight: "600", margin: "0 0 4px 0", fontSize: "13px" }}>
                                    {producto.nombre || producto.productoOServicio || "—"}
                                  </p>
                                  <p style={{ textAlign: "center", fontSize: "11px", color: "var(--textColorP)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {producto.descripcion || ""}
                                  </p>
                                </div>

                                {/* Cuenta Contable */}
                                <div style={{ textAlign: "center", fontSize: "13px", color: "var(--textColorP)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {producto.cuenta_contable || "—"}
                                </div>

                                {/* Centro Costo */}
                                <div style={{ fontSize: "13px", color: "var(--textColorP)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {producto.centro_costo || "—"}
                                </div>

                                {/* Cantidad */}
                                <div style={{ textAlign: "center", fontSize: "13px", color: "var(--textColorP)", fontWeight: "600" }}>
                                  {producto.cantidad || "—"}
                                </div>

                                {/* Valor Unitario */}
                                <div style={{ textAlign: "center", fontWeight: "600", fontSize: "13px", color: "var(--textColorV)" }}>
                                  {formatCOP(producto.valor_estimado ?? producto.valorEstimado ?? 0)}
                                </div>

                                {/* Estado */}
                                <div style={{ textAlign: "center", position: "relative" }}>
                                  <span
                                    className="estado-tag-tooltip"
                                    style={{
                                      display: "inline-block",
                                      padding: "4px 8px",
                                      borderRadius: "4px",
                                      fontSize: "11px",
                                      fontWeight: "600",
                                      backgroundColor: producto.aprobado === "aprobado" ? "#dcfce7" : producto.aprobado === "rechazado" ? "#fee2e2" : "#fef3c7",
                                      color: producto.aprobado === "aprobado" ? "#166534" : producto.aprobado === "rechazado" ? "#991b1b" : "#92400e",
                                      whiteSpace: "nowrap",
                                      position: "relative",
                                      cursor: (producto.usuario_accion || producto.comentarios) ? "pointer" : "default"
                                    }}
                                  >
                                    {producto.aprobado || "Pendiente"}
                                    {/* Bolita naranja animada si hay comentario o usuario_accion */}
                                    {(producto.usuario_accion || producto.comentarios) && (
                                      <span
                                        className="estado-bolita-animada"
                                        style={{
                                          position: "absolute",
                                          top: -3,
                                          right: -2,
                                          width: 9,
                                          height: 9,
                                          borderRadius: "50%",
                                          background: "#f59e42",
                                          boxShadow: "0 0 0 0 #f59e42",
                                          animation: "estado-bolita-pulse 1.2s infinite",
                                          zIndex: 2,
                                          border: "1.5px solid #fff"
                                        }}
                                      />
                                    )}
                                    {/* Tooltip/modal pequeño al hacer hover */}
                                    {(producto.usuario_accion || producto.comentarios) && (
                                      <span className="estado-tooltip-content">
                                        <div style={{ padding: 8, minWidth: 180 }}>
                                          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                                            <h3 className="tittleOneUserNew">{producto.aprobado === "aprobado" ? "Aprobado" : "Rechazado"}</h3>
                                          </div>
                                          {producto.usuario_accion && (
                                            <div style={{ fontSize: 12, marginBottom: 2, color: "#6b7280", marginTop: -10 }}>
                                              <span style={{ color: "var(--textColor)", fontWeight: "bold" }}>Por:</span> {producto.usuario_accion}
                                            </div>
                                          )}
                                          {producto.comentarios && (
                                            <div style={{ fontSize: 12, color: "#6b7280" }}>
                                              <span style={{ color: "var(--textColor)", fontWeight: "bold" }}>Comentario:</span> {producto.comentarios}
                                            </div>
                                          )}
                                        </div>
                                      </span>
                                    )}
                                  </span>
                                  {/* CSS para tooltip y animación */}
                                  <style>{`
                                    .estado-tag-tooltip {
                                      position: relative;
                                    }
                                    .estado-tooltip-content {
                                      display: none;
                                      position: absolute;
                                      top: 110%;
                                      left: 50%;
                                      transform: translateX(-50%);
                                      background: #fff;
                                      color: #222;
                                      border-radius: 8px;
                                      box-shadow: 0 4px 16px rgba(0,0,0,0.13);
                                      z-index: 100;
                                      min-width: 180px;
                                      font-size: 13px;
                                      border: 1px solid #f3f4f6;
                                      pointer-events: none;
                                    }
                                    .estado-tag-tooltip:hover .estado-tooltip-content {
                                      display: block;
                                      pointer-events: auto;
                                    }
                                    @keyframes estado-bolita-pulse {
                                      0% { box-shadow: 0 0 0 0 #f59e4280; }
                                      70% { box-shadow: 0 0 0 8px #f59e4200; }
                                      100% { box-shadow: 0 0 0 0 #f59e4200; }
                                    }
                                  `}</style>
                                </div>

                                {/* Tecnológico */}
                                <div style={{ textAlign: "center" }}>
                                  <span
                                    style={{
                                      display: "inline-block",
                                      padding: "4px 6px",
                                      borderRadius: "4px",
                                      fontSize: "11px",
                                      fontWeight: "600",
                                      backgroundColor: (producto.compra_tecnologica === 1 || producto.compra_tecnologica === true) ? "#dbeafe" : "#f3f4f6",
                                      color: (producto.compra_tecnologica === 1 || producto.compra_tecnologica === true) ? "#0369a1" : "#6b7280"
                                    }}
                                  >
                                    {(producto.compra_tecnologica === 1 || producto.compra_tecnologica === true) ? "✓" : "—"}
                                  </span>
                                </div>

                                {/* Ergonómico */}
                                <div style={{ textAlign: "center" }}>
                                  <span
                                    style={{
                                      display: "inline-block",
                                      padding: "4px 6px",
                                      borderRadius: "4px",
                                      fontSize: "11px",
                                      fontWeight: "600",
                                      backgroundColor: (producto.ergonomico === 1 || producto.ergonomico === true) ? "#dcfce7" : "#f3f4f6",
                                      color: (producto.ergonomico === 1 || producto.ergonomico === true) ? "#166534" : "#6b7280"
                                    }}
                                  >
                                    {(producto.ergonomico === 1 || producto.ergonomico === true) ? "✓" : "—"}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div
                              style={{
                                padding: "24px 16px",
                                textAlign: "center",
                                color: "#9ca3af",
                                borderBottom: "1px solid #e5e7eb"
                              }}
                            >
                              No hay productos asociados a esta requisición.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}
      </div>
      <WizardModal
        open={open}
        onClose={() => { setOpen(false); setModalInitialData(null); }}
        onCreated={fetchRequisiciones}
        initialData={modalInitialData}
        startStep={modalInitialData ? 2 : undefined}
      />
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
