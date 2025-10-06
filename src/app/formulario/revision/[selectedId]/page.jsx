"use client";

import { useEffect, useState, use, useRef } from "react";
import Navbar from "@/app/components/navbar";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faCalendar, faClipboard, faBuilding, faFileExcel, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function PdfViewer({ params }) {

    const { selectedId } = use(params);

    const started = useRef(false);

    useEffect(() => {
        if (!selectedId || started.current) return;
        started.current = true;

        const iniciarRevision = async () => {
            try {
                await fetch("http://localhost:4000/api/process/start-revision", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        businessKey: selectedId,
                        variables: { formularioId: { value: selectedId, type: "String" } }
                    }),
                });
                console.log("Proceso de revisión iniciado");
            } catch (err) {
                alert("Error iniciando proceso de revisión en Camunda");
                console.error(err);
            }
        };
        iniciarRevision();
    }, [selectedId]);

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
    const [filas, setFilas] = useState([
        {
            descripcion: "",
            cantidad: "",
            centro: "",
            cuenta: "",
            purchaseAprobated: false,
            valor: "",
            vobo: false,
            siExiste: false,
            purchaseTecnology: false,
            sstAprobacion: false,
        }
    ]);
    const agregarFila = () => {
        setFilas([
            ...filas,
            {
                descripcion: "",
                cantidad: "",
                centro: "",
                cuenta: "",
                purchaseAprobated: false,
                valor: "",
                vobo: false,
                siExiste: false,
                purchaseTecnology: false,
                sstAprobacion: false,
            }
        ]);
    };

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
                setItems(data.filas || []);
            } catch (error) {
                console.error(error);
            }
        }

        if (selectedId) {
            cargarDatos();
        }
    }, [selectedId]);

    const [showModal, setShowModal] = useState(false);
    const [items, setItems] = useState([]);

    const toggleItemAprobado = (index) => {
        const newItems = [...items];
        newItems[index].purchaseAprobated = !newItems[index].purchaseAprobated;
        setItems(newItems);
    };


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
        const wb = XLSX.utils.book_new();

        // Hoja de información general
        const wsForm = XLSX.utils.json_to_sheet([form]);
        XLSX.utils.book_append_sheet(wb, wsForm, "Formulario");

        // Hoja de ítems
        const itemsData = items.map(item => ({
            Descripción: item.descripcion,
            Cantidad: item.cantidad,
            Centro: item.centro,
            Cuenta: item.cuenta,
            Valor: item.valor,
            Aprobado: item.purchaseAprobated ? "Sí" : "No"
        }));

        const wsItems = XLSX.utils.json_to_sheet(itemsData);

        // Colorear filas
        const range = XLSX.utils.decode_range(wsItems['!ref']);
        for (let R = 1; R <= range.e.r; ++R) {
            const aprobado = items[R - 1]?.purchaseAprobated;
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                if (!wsItems[cellAddress]) continue;
                wsItems[cellAddress].s = {
                    fill: {
                        fgColor: { rgb: aprobado ? "C6EFCE" : "FFC7CE" },
                    },
                };
            }
        }

        wb.Sheets["Ítems"] = wsItems;
        XLSX.utils.book_append_sheet(wb, wsItems, "Ítems");

        const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array", cellStyles: true });
        saveAs(new Blob([wbout], { type: "application/octet-stream" }), "requisicion.xlsx");
    };

    const completarListaFormularios = async () => {
        try {
            const tareasRes = await fetch("http://localhost:4000/api/tasks/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({})
            });
            const tareasData = await tareasRes.json();
            const tareas = tareasData.items || [];
            const tareaLista = tareas.find(
                t => t.name === "Lista de formularios" && t.state === "CREATED"
            );
            if (tareaLista) {
                await fetch(`http://localhost:4000/api/tasks/${tareaLista.userTaskKey}/complete`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ variables: {} }),
                });
                alert("User task 'Lista de formularios' completada ✅");
            } else {
                alert("No hay user task 'Lista de formularios' activa");
            }
        } catch (err) {
            console.error("Error completando 'Lista de formularios':", err);
            alert("Error completando 'Lista de formularios'");
        }
    };


    async function completarRevisionCamunda(estado) {
        try {
            const tareasRes = await fetch("http://localhost:4000/api/tasks/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({})
            });
            const tareasData = await tareasRes.json();
            const tareas = tareasData.items || [];

            const tareaRevision = tareas.find(
                t => t.name === "Cambiar el estado del formulario" && t.state === "CREATED"
            );
            if (!tareaRevision) {
                alert("No hay tarea de revisión activa en Camunda");
                return;
            }

            // 2. Completa la tarea usando el endpoint correcto y payload adecuado
            await fetch(`http://localhost:4000/api/user-tasks/${tareaRevision.userTaskKey}/completion`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    variables: {
                        estado // "Aprobado", "No aprobado" o "Por revisar"
                    },
                    action: "COMPLETED"
                }),
            });

            // 3. Actualiza el estado en tu backend
            await actualizarEstado(estado);

            alert(`Estado actualizado a "${estado}" y tarea completada en Camunda`);
        } catch (err) {
            alert("Error completando tarea en Camunda");
            console.error(err);
        }
    }

    const [isAprobado, setIsAprobado] = useState(null);

    const handleAprobacion = async (estado) => {
        if (estado === "Aprobado") {
            setIsAprobado(true);
        } else if (estado === "No aprobado") {
            setIsAprobado(false);
        } else {
            setIsAprobado(null);
        }

        await completarRevisionCamunda(estado);
    };

    const downloadExcelFromBackend = async () => {
        try {
            // ✅ Llama al backend para que prepare el Excel (sin enviar nada)
            await fetch(`http://localhost:4000/formularios/${selectedId}`, {
                method: "PUT",
            });

            // ✅ Luego descarga el archivo generado
            const res = await fetch(`http://localhost:4000/formularios/${selectedId}/excel`);
            if (!res.ok) throw new Error("Error al generar Excel");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `formulario_${selectedId}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("❌ Error al descargar Excel:", err);
            alert("No fue posible descargar el Excel");
        }
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
                    <div className="headerTittleRevision" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <h1 className="tittleRevision">Información de la requisición</h1>
                        <button
                            onClick={() => setShowModal(true)}
                            style={{
                                backgroundColor: "#007bff",
                                color: "#fff",
                                border: "none",
                                borderRadius: "8px",
                                padding: "8px 16px",
                                cursor: "pointer",
                            }}
                        >
                            Ver ítems
                        </button>
                    </div>

                    <div className="spaceInputsss">
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
                                        readOnly
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
                                        readOnly
                                    />
                                </div>
                            </div>
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
                                        readOnly
                                    />
                                </div>
                            </div>
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
                                        readOnly
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
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="buttonsDownload">
                            <FontAwesomeIcon
                                icon={faFileExcel}
                                className="iconCustom"
                            />
                            <div className="spaceButtonsReview">
                                <button className="navegationButton" onClick={() => handleAprobacion("Aprobado")}>Aprobado</button>
                                <button className="navegationButton" onClick={() => handleAprobacion("No aprobado")}>No Aprobado</button>
                                <button className="navegationButton" onClick={() => handleAprobacion("Por revisar")}>Por revisar</button>
                                {isAprobado === true && (
                                    <>
                                        <button
                                            className="navegationButton"
                                            onClick={downloadExcelFromBackend}
                                        >
                                            Descargar Excel
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {showModal && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        backgroundColor: "rgba(0,0,0,0.5)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 9999,
                    }}
                >
                    <div
                        style={{
                            background: "#fff",
                            padding: "20px",
                            borderRadius: "10px",
                            width: "80%",
                            maxHeight: "80vh",
                            overflowY: "auto",
                        }}
                    >
                        <h2>Ítems de la requisición</h2>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ backgroundColor: "#f5f5f5" }}>
                                    <th>Descripción</th>
                                    <th>Cantidad</th>
                                    <th>Centro</th>
                                    <th>Cuenta</th>
                                    <th>Valor</th>
                                    <th>Aprobado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, i) => (
                                    <tr key={i} style={{ textAlign: "center", borderBottom: "1px solid #ddd" }}>
                                        <td>{item.descripcion}</td>
                                        <td>{item.cantidad}</td>
                                        <td>{item.centro}</td>
                                        <td>{item.cuenta}</td>
                                        <td>{item.valor}</td>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={item.purchaseAprobated}
                                                onChange={() => toggleItemAprobado(i)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{ marginTop: "20px", textAlign: "right" }}>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    backgroundColor: "#dc3545",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "6px",
                                    padding: "8px 16px",
                                    cursor: "pointer",
                                }}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
