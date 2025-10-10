"use client";
import React, { useState, useEffect } from "react";
import Navbar from "../components/navbar";
import Slidebar from "../components/Slidebar"
import OptionsModal from "../components/optionsModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faSync, faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";
import { iniciarProceso } from "../services/camunda";

export default function Dashboard() {
    const [selectedId, setSelectedId] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [formularios, setFormularios] = useState([]);
    const [loading, setLoading] = useState(true); // 👈 estado de carga
    const router = useRouter();

    //CAMUNDA
    const handleClick = async () => {
        try {
            await iniciarProceso({
                bienvenida: "Inicio del proceso de compras",
            });

            router.push("/formulario/nuevo/");
        } catch (error) {
            console.error("Error al iniciar el proceso:", error);
        }
    };

    // Función para traer datos de la BD
    const fetchFormularios = async () => {
        try {
            setLoading(true); // 👈 empieza la animación
            const res = await fetch("http://localhost:4000/formularios");
            const data = await res.json();
            setFormularios(data);

            // 👇 mantenemos el loading visible al menos 2–3 segundos
            setTimeout(() => {
                setLoading(false);
            }, 3000);
        } catch (error) {
            console.error("❌ Error al traer formularios:", error);
            setLoading(false);
        }
    };

    // Llamar al backend cuando cargue la página
    useEffect(() => {
        fetchFormularios();
    }, []);

    return (
        <div>
            <Navbar />
            
            <OptionsModal isOpen={isOpen} onClose={() => setIsOpen(false)} selectedId={selectedId} />

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
                                        console.log("CLICK: abrir modal", form.id);
                                        setSelectedId(form.id);
                                        setIsOpen(true);
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
    );
}
