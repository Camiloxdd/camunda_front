"use client";
import { useState } from "react";
import "../styles/modalNewReq.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faUser,
    faCalendar,
    faBalanceScale,
    faClipboard,
    faBuilding,
    faExclamationTriangle,
    faClock,
    faPaperclip,
    faPlus,
    faX,
    faCubes,
    faListOl,
    faMoneyBill,
    faLaptop,
    faCheckSquare,
    faTasks,
} from "@fortawesome/free-solid-svg-icons";

export default function WizardModal({ open, onClose }) {
    const [step, setStep] = useState(1);
    const [fileName, setFileName] = useState("");

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFileName(file.name);
        } else {
            setFileName("");
        }
    };

    if (!open) return null;

    return (
        <div className="wizardModal-overlay">
            <div className="wizardModal-container">
                <div className="wizardModal-header">
                    <h2>Solicitud de compra</h2>
                    <button className="wizardModal-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="elpapadepapas">
                    {/* === INDICADOR DE PASOS === */}
                    <div className="wizardModal-steps">
                        {[
                            "Datos del solicitante",
                            "Detalles del producto",
                            "Presupuesto",
                            "Aprobaciones",
                        ].map((titulo, index) => (
                            <div
                                key={index}
                                className={`wizardModal-step ${step === index + 1 ? "active" : ""}`}
                            >
                                <div className="wizardModal-circle">{index + 1}</div>
                                <div className="wizardModal-stepContent">
                                    <h3>
                                        Paso {index + 1}: {titulo}
                                    </h3>
                                    <p>
                                        {step === index + 1
                                            ? "En progreso"
                                            : step > index + 1
                                                ? "Completado"
                                                : "Pendiente"}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* === CONTENIDO DE CADA PASO === */}
                    <div className="wizardModal-body">
                        {/* PASO 1: DATOS DEL SOLICITANTE */}
                        {step === 1 && (
                            <div className="papitoGugutata">
                                <h1 className="tittleContentGugutata">
                                    Datos generales del solicitante
                                </h1>
                                <div className="inputsContainers">
                                    <div className="campoAdicional">
                                        <label>Nombre del solicitante</label>
                                        <div className="completeInputs">
                                            <FontAwesomeIcon icon={faUser} className="icon" />
                                            <input type="text" placeholder="Ej. Juan Pérez" />
                                        </div>
                                    </div>
                                    <div className="campoAdicional">
                                        <label>Fecha de solicitud</label>
                                        <div className="completeInputs">
                                            <FontAwesomeIcon icon={faCalendar} className="icon" />
                                            <input type="date" />
                                        </div>
                                    </div>
                                    <div className="campoAdicional">
                                        <label>Justificación de la compra</label>
                                        <div className="completeInputs">
                                            <FontAwesomeIcon icon={faBalanceScale} className="icon" />
                                            <input type="text" placeholder="Motivo de la solicitud" />
                                        </div>
                                    </div>
                                    <div className="campoAdicional">
                                        <label>Área</label>
                                        <div className="completeInputs">
                                            <FontAwesomeIcon icon={faClipboard} className="icon" />
                                            <input type="text" placeholder="Ej. Compras" />
                                        </div>
                                    </div>
                                    <div className="campoAdicional">
                                        <label>Sede</label>
                                        <div className="completeInputs">
                                            <FontAwesomeIcon icon={faBuilding} className="icon" />
                                            <input type="text" placeholder="Ej. Cundinamarca" />
                                        </div>
                                    </div>
                                    <div className="campoAdicional">
                                        <label>Urgencia</label>
                                        <div className="completeInputs">
                                            <FontAwesomeIcon
                                                icon={faExclamationTriangle}
                                                className="icon"
                                            />
                                            <input type="text" placeholder="Alta / Media / Baja" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PASO 2: DETALLES DEL PRODUCTO */}
                        {step === 2 && (
                            <div className="papitoGugutata">
                                <h1 className="tittleContentGugutata">
                                    Detalles del producto o servicio
                                </h1>
                                <div className="inputsContainers">
                                    <div className="campoAdicional">
                                        <label>Producto / Servicio</label>
                                        <div className="completeInputs">
                                            <FontAwesomeIcon icon={faCubes} className="icon" />
                                            <input
                                                type="text"
                                                placeholder="Ej. Escritorio ergonómico"
                                            />
                                        </div>
                                    </div>
                                    <div className="campoAdicional">
                                        <label>Cantidad</label>
                                        <div className="completeInputs">
                                            <FontAwesomeIcon icon={faListOl} className="icon" />
                                            <input type="number" min="1" placeholder="Ej. 5" />
                                        </div>
                                    </div>
                                    <div className="campoAdicional">
                                        <label>Centro de costo / Orden interna</label>
                                        <div className="completeInputs">
                                            <FontAwesomeIcon icon={faClipboard} className="icon" />
                                            <input type="text" placeholder="Ej. CC-104 / OI-245" />
                                        </div>
                                    </div>
                                    <div className="campoAdicional">
                                        <label>Cuenta contable o código de material</label>
                                        <div className="completeInputs">
                                            <FontAwesomeIcon icon={faMoneyBill} className="icon" />
                                            <input type="text" placeholder="Ej. 5120-Equipos" />
                                        </div>
                                    </div>
                                    <div className="campoAdicional">
                                        <label>Descripción</label>
                                        <div className="completeInputs">
                                            <FontAwesomeIcon icon={faClipboard} className="icon" />
                                            <input
                                                type="text"
                                                placeholder="Detalles del producto solicitado"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PASO 3: PRESUPUESTO Y TECNOLOGÍA */}
                        {step === 3 && (
                            <div className="papitoGugutata">
                                <h1 className="tittleContentGugutata">
                                    Presupuesto y características técnicas
                                </h1>

                                <div className="twoInfo">
                                    <div className="inputsContainers">
                                        <div className="campoAdicional">
                                            <label>Valor estimado</label>
                                            <div className="completeInputs">
                                                <FontAwesomeIcon icon={faMoneyBill} className="icon" />
                                                <input
                                                    type="text"
                                                    placeholder="Valor estimado"
                                                />
                                            </div>

                                        </div>
                                        <div className="campoAdicional">
                                            <label>Anexos</label>
                                            <div className="fileUploadContainer">
                                                <FontAwesomeIcon icon={faPaperclip} className="icon" />
                                                <label htmlFor="fileUpload" className="customFileButton">
                                                    {fileName ? fileName : "Seleccionar archivo"}
                                                </label>
                                                <input
                                                    type="file"
                                                    id="fileUpload"
                                                    className="hiddenFileInput"
                                                    onChange={handleFileChange}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="firsInfo">
                                        <label>
                                            ¿Está en presupuesto?
                                            <input type="checkbox" />
                                        </label>
                                        <label>
                                            ¿Compra tecnológica?
                                            <input type="checkbox" />
                                        </label>
                                        <label>
                                            ¿Existen ergonómicos?
                                            <input type="checkbox" />
                                        </label>
                                        <label>
                                            ¿Existen Servicios Adminsitrativos?
                                            <input type="checkbox" />
                                        </label>

                                        <label>
                                            ¿Existen Productos de riesgo?
                                            <input type="checkbox" />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PASO 4: APROBACIONES */}
                        {step === 4 && (
                            <div className="papitoGugutata">
                                <h1 className="tittleContentGugutata">
                                    Gerencias que deben aprobar
                                </h1>
                                <p style={{ marginBottom: "10px" }}>
                                    Selecciona las gerencias que deben aprobar esta solicitud:
                                </p>
                                <div className="gerenciasCheckbox">
                                    {[
                                        "Gerencia Administrativa",
                                        "Gerencia Financiera",
                                        "Gerencia Operativa",
                                        "Gerencia General",
                                    ].map((gerencia, i) => (
                                        <label key={i} className="checkboxItem">
                                            <input type="checkbox" /> {gerencia}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* === NAVEGACIÓN === */}
                <div className="wizardModal-footer">
                    {step > 1 && (
                        <button
                            className="wizardModal-btn wizardModal-prev"
                            onClick={() => setStep(step - 1)}
                        >
                            ← Anterior
                        </button>
                    )}
                    {step < 4 ? (
                        <button
                            className="wizardModal-btn wizardModal-next"
                            onClick={() => setStep(step + 1)}
                        >
                            Siguiente →
                        </button>
                    ) : (
                        <button
                            className="wizardModal-btn wizardModal-confirm"
                            onClick={onClose}
                        >
                            Finalizar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
