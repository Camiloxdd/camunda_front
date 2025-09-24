"use client";

import { useState } from "react";
import Navbar from "@/app/components/navbar";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faCalendar, faClipboard, faBuilding, faFileExcel, faArrowLeft } from "@fortawesome/free-solid-svg-icons";

export default function PdfViewer() {
    const router = useRouter();

    const [form, setForm] = useState({
        nombre: "",
        fechaSolicitud: "",
        fechaEntrega: "",
        justificacion: "",
        area: "",
        sede: "",
        urgenciaCompra: "",
        tiempoGestion: "",
        anexos: "",
        observacionesOne: "",
        observacionesTwo: "",
        observacionesThree: "",
        nombreSolicitante: "",
        firmaSolicitante: "",
        nombreAdministrativo: "",
        firmaAdministrativo: "",
        nombreGerente: "",
        firmaGerente: "",
        autorizacionGerencia: "",
        fechaCompras: "",
        horaCompras: "",
        consecutivoCompras: "",
        firmaCompras: "",
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    return (
        <div>
            <Navbar />
            <div className="buttonBackDash">
                <button onClick={() => router.push('/')}>
                    <FontAwesomeIcon icon={faArrowLeft} className="iconBack" />
                    <p>Volver al inicio</p>
                </button>
            </div>
            <div className="containerRevision">
                <iframe
                    src="https://seaep.es/wp-content/uploads/2019/06/Pr%C3%A1ctica-sobre-el-Test-de-Retenci%C3%B3n-Visual-de-Benton-TRVB-G%C3%B3mez-Rodr%C3%ADguez-y-Vald%C3%A9s-2012.pdf"
                    className="pdfFrame"
                />
                <div className="revisionInfo">

                    <div className="spaceInputsss">
                        <h1 className="tittleRevision">Información de la revisión</h1>
                        <div className="inputsContainersRevision">
                            <div className="inputAndText">
                                <p>Nombre del solicitante</p>
                                <div className="completeInputsRevision">
                                    <FontAwesomeIcon icon={faUser} className="icon" />
                                    <input
                                        type="text"
                                        name="nombre"
                                        placeholder="Nombre del Solicitante"
                                        value={form.nombre}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="inputAndText">
                                <p>Fecha de solicitud</p>
                                <div className="completeInputsRevision">
                                    <FontAwesomeIcon icon={faCalendar} className="icon" />
                                    <input
                                        type="date"
                                        name="fechaSolicitud"
                                        placeholder="Fecha de la Solicitud"
                                        value={form.fechaSolicitud}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="inputsContainersRevision">
                            <div className="inputAndText">
                                <p>Fecha requerida de entrega</p>
                                <div className="completeInputsRevision">
                                    <FontAwesomeIcon icon={faCalendar} className="icon" />
                                    <input
                                        type="date"
                                        name="fechaEntrega"
                                        placeholder="Fecha requerido de entrega"
                                        value={form.fechaEntrega}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="inputsContainersRevision">
                            <div className="inputAndText">
                                <p>Area del solicitante</p>
                                <div className="completeInputsRevision">
                                    <FontAwesomeIcon icon={faClipboard} className="icon" />
                                    <input
                                        type="text"
                                        name="area"
                                        placeholder="Area del solicitante"
                                        value={form.area}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="inputAndText">
                                <p>Sede del solicitante</p>
                                <div className="completeInputsRevision">
                                    <FontAwesomeIcon icon={faBuilding} className="icon" />
                                    <input
                                        type="text"
                                        name="sede"
                                        placeholder="Sede"
                                        value={form.sede}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="buttonsDownload">
                        <FontAwesomeIcon icon={faFileExcel} className="iconCustom" />
                        <div className="spaceButtonsReview">
                            <button className="navegationButton">Aprobado</button>
                            <button className="navegationButton">No Aprobado</button>
                            <button className="navegationButton">Por revisar</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
