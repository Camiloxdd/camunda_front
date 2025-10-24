"use client";
import React, { useEffect, useState } from "react";
import "../styles/views/timeLap.css"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faClock } from "@fortawesome/free-solid-svg-icons";

export default function TimeLap({ open, onClose, requisicionId }) {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!open || !requisicionId) return;
        let mounted = true;
        const fetchProgress = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`http://localhost:4000/api/requisiciones/${requisicionId}/aprobacion`, { credentials: "include" });
                if (!res.ok) throw new Error("Error fetching progress");
                const data = await res.json();
                if (mounted) setProgress(data);
            } catch (err) {
                console.error(err);
                if (mounted) setError("No se pudo obtener el flujo de aprobaciones");
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchProgress();
        return () => { mounted = false; };
    }, [open, requisicionId]);

    if (!open) return null;

    const overlayStyle = {
        position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex",
        alignItems: "center", justifyContent: "center", zIndex: 9999
    };
    const boxStyle = {
        width: 760, maxWidth: "95%", background: "#fff", borderRadius: 8, padding: 18, boxShadow: "0 6px 20px rgba(0,0,0,0.2)"
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

        const Timeline = ({ aprobaciones }) => {
            return (
                <div className="timeline-container">
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
                <div className="containerInfoTime">
                    <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                        <div><strong>Aprobadas</strong><div>{approvedCount}/{totalApprovals}</div></div>
                        <div><strong>Pendientes</strong><div>{pendientesCount}</div></div>
                    </div>

                </div>

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
            <div className="boxStyle">
                <div className="headerTimeLap">
                    <div className="infoHeader">
                        <h2>Flujo de aprobaciones</h2>
                        <div style={{ fontSize: 15, color: "#666" }}>{requisicionId ? `Requisición #${requisicionId}` : ""}</div>
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

