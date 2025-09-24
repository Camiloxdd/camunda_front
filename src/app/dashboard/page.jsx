"use client";
import React, { useState } from "react";
import Navbar from "../components/navbar";
import OptionsModal from "../components/optionsModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faSync, faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";

export default function Dashboard() {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    return (
        <div style={{}}>
            <OptionsModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
            <Navbar />
            <div className="space-buttons">
                <button onClick={() => router.push('/formulario/nuevo/')}>
                    <FontAwesomeIcon icon={faPlus} /> Nuevo
                </button>
                <button>
                    <FontAwesomeIcon icon={faSync} /> Actualizar
                </button>
            </div>
            <div className="body">
                <div className="header-container">
                    <p className="header-name">Nombre</p>
                    <p className="header-actions">Acciones</p>
                </div>
                <div className="table-container">
                    <div className="container-formulario">
                        <p className="tittle-formulario">REQUISICIÓN DE COMPRA O SERVICIO</p>
                        <button className="options-formulario" onClick={() => {
                            console.log("CLICK: abrir modal");
                            setIsOpen(true);
                        }}>
                            <FontAwesomeIcon icon={faEllipsis} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}