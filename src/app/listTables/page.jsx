"use client";
import React, { useState, useEffect } from "react";
import Navbar from "../components/navbar";
import OptionsModal from "../components/optionsModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faSync, faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";
import { iniciarProceso } from "../services/camunda";
import { Sidebar } from "../components/Slidebar";

export default function listTables() {
    const [selectedId, setSelectedId] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // 👈 Sidebar
    const [isModalOpen, setIsModalOpen] = useState(false); // 👈 Modal
    const [formularios, setFormularios] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const handleClick = async () => {
        try {
            await iniciarProceso({ bienvenida: "Inicio del proceso de compras" });
            router.push("/formulario/nuevo/");
        } catch (error) {
            console.error("Error al iniciar el proceso:", error);
        }
    };

    const fetchFormularios = async () => {
        try {
            setLoading(true);
            const res = await fetch("http://localhost:4000/formularios");
            const data = await res.json();
            setFormularios(data);
            setTimeout(() => setLoading(false), 2000);
        } catch (error) {
            console.error("❌ Error al traer formularios:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFormularios();
    }, []);

    return (
        <div className="dashboard-container" style={{ display: "flex" }}>
            {/* 👇 Se pasa el callback correcto al Sidebar */}
            <Sidebar onToggle={setIsSidebarOpen} />

            {/* Contenido principal que se desplaza con el Sidebar */}
            <div
                className="dashboard-content"
                style={{
                    flex: 1,
                    transition: "margin-left 0.3s ease",
                    marginLeft: isSidebarOpen ? "210px" : "80px",
                }}
            >
                <Navbar />

                {/* 👇 Modal independiente */}
                <OptionsModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    selectedId={selectedId}
                />

                <div className="space-buttons">
                    <button onClick={handleClick}>
                        <FontAwesomeIcon icon={faPlus} /> Nueva Requisición
                    </button>
                    <button onClick={fetchFormularios}>
                        <FontAwesomeIcon icon={faSync} /> Actualizar
                    </button>
                </div>

                <div className="body">
                    <div className="header-container">
                        <p className="header-name">Nombre</p>
                        <p className="header-actions">Acciones</p>
                    </div>

                    <div className="table-container">
                        {loading ? (
                            <div className="loading-container">
                                <div className="loading-cambios">
                                    <img
                                        src="/coopidrogas_logo_mini.png"
                                        className="LogoCambios"
                                        alt="Logo de carga"
                                    />
                                    <p className="textLoading">Cargando formularios...</p>
                                </div>
                            </div>
                        ) : formularios.length > 0 ? (
                            formularios.map((form) => (
                                <div key={form.id} className="container-formulario">
                                    <p className="tittle-formulario">
                                        {form.nombre || "Sin nombre"}
                                    </p>
                                    <button
                                        className="options-formulario"
                                        onClick={() => {
                                            setSelectedId(form.id);
                                            setIsModalOpen(true); // 👈 ahora abre solo el modal
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faEllipsis} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p>No hay formularios creados</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
