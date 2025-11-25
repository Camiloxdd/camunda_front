"use client";
import React, { useEffect, useState } from "react";
import "../styles/views/timeLap.css"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faClock } from "@fortawesome/free-solid-svg-icons";
import api from "../services/axios";

export default function TimeLap({ open, onClose, requisicionId, token }) {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(null);
    const [requisicion, setRequisicion] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!open || !requisicionId) return;

        let mounted = true;

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                // Petición paralela para ambos endpoints
                const [progressRes, requisicionRes] = await Promise.all([
                    api.get(`/api/requisiciones/${requisicionId}/aprobacion`, {
                        headers: { Authorization: token ? `Bearer ${token}` : "" },
                    }),
                    api.get(`/api/requisiciones/${requisicionId}`, {
                        headers: { Authorization: token ? `Bearer ${token}` : "" },
                    })
                ]);

                if (progressRes.status < 200 || progressRes.status >= 300) {
                    throw new Error("Error fetching progress");
                }

                if (requisicionRes.status < 200 || requisicionRes.status >= 300) {
                    throw new Error("Error fetching requisicion");
                }

                if (mounted) {
                    setProgress(progressRes.data);
                    setRequisicion(requisicionRes.data.requisicion); // <-- CAMBIO AQUÍ
                }
            } catch (err) {
                console.error(err);
                if (mounted) {
                    setError("No se pudo obtener la información");
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            mounted = false;
        };
    }, [open, requisicionId, token]);

    if (!open) return null;

    const overlayStyle = {
        position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex",
        alignItems: "center", justifyContent: "center", zIndex: 9999, width: "100%"
    };
    const boxStyle = {
        width: "60%", maxWidth: "95%", background: "#fff", borderRadius: 8, padding: 18, boxShadow: "0 6px 20px rgba(0,0,0,0.2)"
    };
    const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 };
    const listStyle = { listStyle: "none", padding: 0, margin: 0 };
    const itemStyle = (isNext) => ({
        padding: "8px 10px",
        borderRadius: 6,
        marginBottom: 8,
        background: isNext ? "#eaf4ff" : "#f7f7f7",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        border: isNext ? "1px solid #1d5da8" : "1px solid rgba(0,0,0,0.06)"
    });

    const getCargoNombre = (cargo) => {
        switch (cargo) {
            case "managerGeneral":
                return "Gerente General";
            case "managerAdmin":
                return "Gerente Administrativo";
            case "managerAreaTyc":
                return "Gerente de Área Tecnología y Proyectos";
            case "gerSST":
                return "Gerente de Área SST";
            case "dicLeaderAreaTyC":
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
                return "Director Tecnología y Proyectos";
            case "gerTyC":
                return "Gerente Tecnología y Proyectos";
            default:
                return cargo || "Usuario";
        }
    };

    const getSedeNombre = (sede) => {
        switch (sede) {
            case "cota":
                return "Cota";
            default:
                return sede || "";
        }
    };

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
            default:
                return area || "";
        }
    };

    const renderBody = () => {
        if (loading) return <div>Cargando flujo...</div>;
        if (error) return <div style={{ color: "red" }}>{error}</div>;
        if (!progress) return <div>No hay información.</div>;

        const {
            valorRequisicion,
            requiredMinimum,
            totalApprovals,
            approvedCount,
            pendientesCount,
            lastApprovedOrder,
            nextOrder,
            approvers
        } = progress;

        const percent = totalApprovals ? Math.round((approvedCount / totalApprovals) * 100) : 0;

        // calcular días entre la primera y la última aprobación (si hay fechas)
        const computeApprovalDurationDays = (aprobaciones = []) => {
            if (!Array.isArray(aprobaciones)) return null;
            const timestamps = aprobaciones
                .map(a => a && a.fecha_aprobacion ? new Date(a.fecha_aprobacion).getTime() : null)
                .filter(Boolean)
                .sort((a, b) => a - b);
            if (timestamps.length < 2) return timestamps.length === 1 ? 0 : null;
            const diffMs = timestamps[timestamps.length - 1] - timestamps[0];
            const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            return days;
        };

        const approvalDays = computeApprovalDurationDays(approvers);
        const fullyApproved = totalApprovals && approvedCount === totalApprovals && approvalDays !== null;

        const Timeline = ({ aprobaciones }) => {
            return (
                <div className="timeline-container">
                    {/* Nodo del solicitante */}
                    {requisicion?.nombre_solicitante && (
                        <div className="timeline-node">
                            <div className="timeline-circle aprobado">
                                <FontAwesomeIcon icon={faCheckCircle} className="icon" />
                            </div>
                            <div className="timeline-line linea-aprobada"></div>
                            <div className="timeline-info">
                                <div className="timeline-nombre text-green">
                                    {requisicion.nombre_solicitante}
                                </div>
                                <div className="timeline-fecha">Solicitante</div>
                            </div>
                        </div>
                    )}

                    {/* Nodos de aprobadores */}
                    {aprobaciones.map((a, index) => {
                        const aprobado = a.estado === "aprobada";
                        const siguiente = a.visible === 1 || a.visible === true;
                        const showLine = index < aprobaciones.length - 1;
                        const fecha = a.fecha_aprobacion
                            ? new Date(a.fecha_aprobacion).toISOString().split("T")[0]
                            : "-";

                        return (
                            <div key={index} className="timeline-node">
                                <div
                                    className={`timeline-circle ${aprobado ? "aprobado" : siguiente ? "activo" : "pendiente"
                                        }`}
                                >
                                    {aprobado ? (
                                        <FontAwesomeIcon icon={faCheckCircle} className="icon" />
                                    ) : (
                                        <FontAwesomeIcon icon={faClock} className="icon" />
                                    )}
                                </div>

                                {showLine && (
                                    <div
                                        className={`timeline-line ${aprobado ? "linea-aprobada" : "linea-pendiente"
                                            }`}
                                    ></div>
                                )}

                                <div className="timeline-info">
                                    <div className={`timeline-nombre ${aprobado ? "text-green" : ""}`}>
                                        {a.nombre_aprobador || a.rol_aprobador}
                                    </div>
                                    <div className="timeline-fecha">{fecha}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        };

        return (
            <div>
                <div style={{ height: 10, background: "#eee", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ width: `${percent}%`, background: "#1d5da8", height: "100%" }} />
                </div>

                <div className="listaAprobaciones">
                    <ul style={listStyle}>
                        {Array.isArray(approvers) && approvers.length > 0 ? approvers.map((a) => {
                            const isNext = (nextOrder && a.orden === nextOrder) || a.visible === 1 || a.visible === true;
                            return (
                                <li key={a.id} style={itemStyle(isNext)}>
                                    <div>
                                        <div style={{ fontWeight: 700 }}>{a.nombre_aprobador || a.rol_aprobador}</div>
                                        <div style={{ fontSize: 12, color: "#555" }}>
                                            {getCargoNombre(a.rol_aprobador)}{(a.area || a.sede) ? ` • ${getAreaNombre(a.area) || a.area}${a.sede ? ` • ${getSedeNombre(a.sede) || a.sede}` : ""}` : ""}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ fontWeight: 700, color: a.estado === "aprobada" ? "green" : a.estado === "pendiente" ? "red" : "#444" }}>
                                            {a.estado || "pendiente"}
                                        </div>
                                        <div style={{ fontSize: 12, color: "#777" }}>
                                            {a.fecha_aprobacion
                                                ? new Date(a.fecha_aprobacion).toLocaleDateString("es-CO")
                                                : "—"}
                                        </div>

                                    </div>
                                </li>
                            );
                        }) : <li style={{ padding: 8 }}>No hay aprobadores asignados.</li>}
                    </ul>
                </div>
                {Timeline({ aprobaciones: approvers })}
            </div>
        );
    };

    return (
        <div style={overlayStyle} role="dialog" aria-modal="true">
            <div style={boxStyle}>
                <div className="headerTimeLap">
                    <div className="infoHeader">
                        <h2>Flujo de aprobaciones</h2>
                        <div style={{ fontSize: 15, color: "#666" }}>
                            {requisicionId ? `Requisición #${requisicionId}` : ""}
                        </div>
                    </div>
                    <div className="spaceButtonTime">
                        <button onClick={onClose}>✕</button>
                    </div>
                </div>
                {renderBody()}

            </div>
        </div>
    );
}