"use client";

import { useEffect, useState, use } from "react";
import Navbar from "@/app/components/navbar";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faCalendar, faClipboard, faBuilding, faFileExcel, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function PdfViewer({ params }) {
    const { selectedId } = use(params);
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
        estado: "",
    });

    useEffect(() => {
        async function fetchData() {
            const res = await fetch(`http://localhost:4000/formularios/${selectedId}`);
            const data = await res.json();
            setForm(data.formulario);
        }
        if (selectedId) fetchData();
    }, [selectedId]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    function formatDate(date) {
        if (!date) return "";
        if (typeof date === "string" && date.length === 10) return date;
        const d = new Date(date);
        if (isNaN(d)) return "";
        return d.toISOString().slice(0, 10);
    }

    useEffect(() => {
        async function cargarDatos() {
            try {
                const res = await fetch(`http://localhost:4000/formularios/${selectedId}`);
                if (!res.ok) throw new Error("Error al cargar los datos");
                const data = await res.json();

                setForm({
                    ...data.formulario,
                    fechaSolicitud: formatDate(data.formulario.fechaSolicitud),
                    fechaEntrega: formatDate(data.formulario.fechaEntrega),
                    fechaCompras: formatDate(data.formulario.fechaCompras),
                });
                setFilas(data.filas || []);
            } catch (error) {
                console.error(error);
            }
        }

        if (selectedId) {
            cargarDatos();
        }
    }, [selectedId]);

    const actualizarEstado = async (nuevoEstado) => {
        try {
            await fetch(`http://localhost:4000/formularios/${selectedId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ form: { ...form, estado: nuevoEstado }, filas: [] }),
            });
            setForm((prev) => ({ ...prev, estado: nuevoEstado }));
        } catch (err) {
            alert("Error actualizando estado");
        }
    };

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet([form]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Formulario");
        const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        saveAs(new Blob([wbout], { type: "application/octet-stream" }), "formulario.xlsx");
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
                    src="/pdf/formulario.pdf"
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
                            <button className="navegationButton" onClick={() => actualizarEstado("Aprobado")}>Aprobado</button>
                            <button className="navegationButton" onClick={() => actualizarEstado("No aprobado")}>No Aprobado</button>
                            <button className="navegationButton" onClick={() => actualizarEstado("Por revisar")}>Por revisar</button>
                            {(form.estado === "Aprobado") && (
                                <>
                                    <button
                                        onClick={async () => {
                                            const res = await fetch(`http://localhost:4000/formularios/${selectedId}/excel`);
                                            const blob = await res.blob();
                                            const url = window.URL.createObjectURL(blob);
                                            const a = document.createElement("a");
                                            a.href = url;
                                            a.download = `formulario_${selectedId}.xlsx`;
                                            a.click();
                                            window.URL.revokeObjectURL(url);
                                        }}
                                        className="navegationButton"
                                    >
                                        Descargar Excel
                                    </button>
                                    <button
                                        onClick={() => window.open(`/pdf/formulario.pdf`, "_blank")}
                                        className="navegationButton"
                                    >
                                        Descargar PDF
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
