"use client";
import React, { useState, useEffect, useRef } from "react";
import { Sidebar } from "../components/Slidebar";
import { faRightFromBracket, faUserGear, faUserShield, faMagicWandSparkles, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { approveBuyerTask, iniciarProceso } from "../services/camunda";
import styles from "../dashboard/DashboardRequisiciones.module.css";
import api from "../services/axios";
import TimeLap from "../components/timeLap";
import { useRouter } from "next/navigation";
import { Toast } from 'primereact/toast';
import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { useLayoutEffect } from "react";
import WelcomeTime from "../components/welcomeTime";


function DashboardInner() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [requisiciones, setRequisiciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyModalReq, setVerifyModalReq] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { permissions, user } = useAuth();
  const [statusFilter, setStatusFilter] = useState("todas");
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

  const normalizeEstado = (s) => String(s || "").toLowerCase().trim();
  const isApprovedState = (s) => {
    const n = normalizeEstado(s);
    return n.includes("aprob") || n === "totalmente aprobada" || n === "aprobada";
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

  useEffect(() => {
    const handler = (e) => {
      setTimelineReqId(e.detail.requisicionId);
      setTimelineOpen(true);
    };
    window.addEventListener("openTimeLap", handler);
    return () => window.removeEventListener("openTimeLap", handler);
  }, []);

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
          marginLeft: isSidebarOpen ? "284px" : "80px",
        }}
      >
        <div className="sectionPrincipal">
          <div className="contentPrinci">
            <div className="imgCoopidrogas">
              <img src="./LOGO_COOPI_HD_4K_1080P.jpg" className="logoInicio" />
            </div>
            <div className="infoLateral">
              <div className="firstInfo">
                <div className="sparklesD">
                  <FontAwesomeIcon icon={faMagicWandSparkles} className="iconSparkles"/>
                </div>
                Bienvenido de vuelta
              </div>
              <div className="secondInfo">
                {user ? (
                  <>
                    <p className="saludoText"><WelcomeTime /></p><p className="nameText">{user.nombre}</p>
                  </>
                ) : (
                  <>
                  </>
                )}
              </div>
              <div className="threeInfo">
                <p>Gestiona tus requisiciones de manera eficiente. Crea, revisa y aprueba solicitudes en un solo lugar.</p>
              </div>
              <div className="fourInfo">
                {permissions?.isSolicitante && (
                  <>
                    <div className="newRequisicionSend">
                      <h3>¿Necesitas crear una requisición?</h3>
                      <p>Inicia el proceso en minutos con nuestro sistema simplificado</p>
                    </div>
                    <div className="buttonNewReqSend">
                      <button onClick={() => router.push('/requisicion')}><FontAwesomeIcon icon={faArrowRight} /></button>
                    </div>
                  </>
                )}
                {permissions?.isAprobador && (
                  <>
                    <>
                      <div className="newRequisicionSend">
                        <h3>¿Necesitas aprobar una requisición?</h3>
                        <p>Inicia el proceso en minutos con nuestro sistema simplificado</p>
                      </div>
                      <div className="buttonNewReqSend">
                        <button onClick={() => router.push('/requisicion')}><FontAwesomeIcon icon={faArrowRight} /></button>
                      </div>
                    </>
                  </>
                )}
                {permissions?.isComprador && (
                  <>
                    <>
                      <div className="newRequisicionSend">
                        <h3>¿Necesitas aprobar una requisición?</h3>
                        <p>Inicia el proceso en minutos con nuestro sistema simplificado</p>
                      </div>
                      <div className="buttonNewReqSend">
                        <button onClick={() => router.push('/requisicion')}><FontAwesomeIcon icon={faArrowRight} /></button>
                      </div>
                    </>
                  </>
                )}
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
