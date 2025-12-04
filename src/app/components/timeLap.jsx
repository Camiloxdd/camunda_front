"use client";
import React, { useEffect, useState } from "react";
import "../styles/views/timeLap.css"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faClock } from "@fortawesome/free-solid-svg-icons";
import api from "../services/axios";
import { get } from "node:http";

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
        width: "100%", maxWidth: "100%", background: "#f5f5f5", borderRadius: 8, padding: 18, border: "2px solid #ddd",
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
        if (loading) return (
            <div style={{
                width: "100%",
                minHeight: 220,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}>
                <div className="loading-cambios">
                    <img
                        src="/coopidrogas_logo_mini.png"
                        className="LogoCambios"
                        alt="Logo de carga"
                    />
                    <p className="textLoading">Cargando flujo...</p>
                </div>
            </div>
        );
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
                                <FontAwesomeIcon icon={faCheckCircle} className="iconTimeLap" />
                            </div>
                            <div className="timeline-line linea-aprobada"></div>
                            <div className="timeline-info">
                                <div className="timeline-nombre text-green">
                                    {requisicion.nombre_solicitante}
                                </div>
                                <div className="timeline-fecha">Solicitante</div>
                                <div className="timeline-fecha">{getSedeNombre(requisicion.fecha)}</div>
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
                                        <FontAwesomeIcon icon={faCheckCircle} className="iconTimeLap" />
                                    ) : (
                                        <FontAwesomeIcon icon={faClock} className="iconTimeLap" />
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
                                        <p>{a.nombre_aprobador}</p>
                                    </div>
                                    <p className="timeline-fecha">{getCargoNombre(a.rol_aprobador)}</p>
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
                {Timeline({ aprobaciones: approvers })}
            </div>
        );
    };

    return (
        <div role="dialog" aria-modal="true">
            <div style={boxStyle}>
                <div className="headerTimeLap">
                    <div className="infoHeader">
                        <h3 className="tittleOneUserNew">flujo de aprobaciones</h3>
                    </div>
                </div>
                {renderBody()}
            </div>
        </div>
    );
}