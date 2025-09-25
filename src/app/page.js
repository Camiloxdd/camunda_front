"use client";
import React, { useState, useEffect } from "react";
import Navbar from "./components/navbar";
import OptionsModal from "./components/optionsModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faSync, faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";

export default function Dashboard() {
    const [selectedId, setSelectedId] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [formularios, setFormularios] = useState([]); // acá guardamos lo que viene de la BD
    const router = useRouter();

    // Función para traer datos de la BD
    const fetchFormularios = async () => {
        try {
            const res = await fetch("http://localhost:4000/formularios");
            const data = await res.json();
            setFormularios(data);
        } catch (error) {
            console.error("❌ Error al traer formularios:", error);
        }
    };

    // Llamar al backend cuando cargue la página
    useEffect(() => {
        fetchFormularios();
    }, []);

    return (
        <div style={{}}>
            <Navbar />
            <OptionsModal isOpen={isOpen} onClose={() => setIsOpen(false)} selectedId={selectedId} />
            <div className="space-buttons">
                <button
                    onClick={async () => {
                        // Inicia el proceso en Camunda 8 SaaS
                        const res = await fetch("http://localhost:4000/api/process/start", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                variables: {
                                    // Puedes enviar datos iniciales aquí si quieres
                                    creador: "usuario@correo.com"
                                }
                            })
                        });
                        const data = await res.json();
                        // Opcional: puedes guardar el processInstanceKey en localStorage o pasarlo por query param
                        // localStorage.setItem("processInstanceKey", data.instanceId);

                        // Ahora navega al formulario nuevo
                        router.push('/formulario/nuevo/');
                    }}
                >
                    <FontAwesomeIcon icon={faPlus} /> Nuevo
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
                    {formularios.length > 0 ? (
                        formularios.map((form) => (
                            <div key={form.id} className="container-formulario">
                                <p className="tittle-formulario">
                                    {form.nombre || "Sin nombre"} {/* mostramos el nombre */}
                                </p>
                                <button
                                    className="options-formulario"
                                    onClick={() => {
                                        console.log("CLICK: abrir modal", form.id);
                                        setSelectedId(form.id);   // 👈 guardamos el id del formulario
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
