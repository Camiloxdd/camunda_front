"use client";
import React, { useState } from "react";
import { Sidebar } from "../components/Slidebar";
import Navbar from "../components/navbar";
import { faFile ,faFileExcel } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function dashboard() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="dashboard-container" style={{ display: "flex" }}>
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
                                    <FontAwesomeIcon icon={faFile}/>
                                </div>
                                <div className="infoTotalReq">
                                    <p>Requisiciones Totales</p>
                                    <h2>1654</h2>
                                </div>
                            </div>
                            <div className="porAprobarRequisiciones">
                                <div className="infoAprobarReq">
                                    <p>Requisiciones por Aprobar</p>
                                    <h2>50</h2>
                                </div>
                                <div className="iconAprobarReq">
                                    <FontAwesomeIcon icon={faFileExcel}/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}