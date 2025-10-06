"use client";
import { useState, useEffect } from "react";
import Navbar from "../../../components/navbar";
import { useRouter, useParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faCalendar, faBalanceScale, faClipboard, faBuilding, faExclamationTriangle, faClock, faPaperclip, faArrowLeft, faPlus } from "@fortawesome/free-solid-svg-icons";

export default function NuevoFormulario() {
    const { selectedId } = useParams();
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0); // ⬅️ progreso del loader
    const initialForm = {
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
    };
    const [form, setForm] = useState(initialForm);

    const [filas, setFilas] = useState([]);

    function formatDate(date) {
        if (!date) return "";
        if (typeof date === "string" && date.length === 10) return date;
        const d = new Date(date);
        if (isNaN(d)) return "";
        return d.toISOString().slice(0, 10);
    }

    function normalizeForm(data) {
        const source = data ?? {};
        const merged = { ...initialForm, ...source };
        return {
            ...merged,
            fechaSolicitud: formatDate(source?.fechaSolicitud),
            fechaEntrega: formatDate(source?.fechaEntrega),
            fechaCompras: formatDate(source?.fechaCompras),
        };
    }

    useEffect(() => {
        async function cargarDatos() {
            try {
                setLoading(true);
                setProgress(0);

                // Simulamos progreso
                const interval = setInterval(() => {
                    setProgress((prev) => {
                        if (prev >= 100) {
                            clearInterval(interval);
                            return 100;
                        }
                        return prev + 5;
                    });
                }, 100);

                const res = await fetch(`http://localhost:4000/formularios/${selectedId}`);
                if (!res.ok) throw new Error("Error al cargar los datos");
                const data = await res.json();

                setForm(normalizeForm(data.formulario));
                setFilas(Array.isArray(data.filas) ? data.filas : []);

                // mínimo 2 segundos de loader
                setTimeout(() => setLoading(false), 2000);
            } catch (error) {
                console.error(error);
                setLoading(false);
            }
        }

        if (selectedId) {
            cargarDatos();
        }
    }, [selectedId]);


    const agregarFila = () => {
        setFilas([
            ...filas,
            {
                descripcion: "",
                cantidad: "",
                centro: "",
                cuenta: "",
                presupuesto: "",
                valor: "",
                vobo: ""
            }
        ]);
    };

    const manejarCambio = (index, campo, valor) => {
        const nuevasFilas = [...filas];
        nuevasFilas[index][campo] = valor;
        setFilas(nuevasFilas);
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
    const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));
    const guardarFormulario = async () => {
        try {
            const res = await fetch(`http://localhost:4000/formularios/${selectedId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ form, filas }),
            });
            if (!res.ok) throw new Error("Error al guardar los datos");
            alert("Formulario actualizado correctamente ✅");
        } catch (error) {
            console.error(error);
            alert("Error al guardar los datos ❌");
        }
    };
    // Removed duplicate fetch effect to avoid state thrashing and undefined fields

    if (loading) {
        const radius = 60;
        const circumference = 2 * Math.PI * radius;

        return (
            <div className="loading-container-wizzard">
                <div className="circular-loader">
                    <img src="/coopidrogas_logo_mini.png" alt="Logo" className="logo-loader" />
                    <svg className="progress-ring" width="140" height="140">
                        <circle
                            className="progress-ring__background"
                            stroke="#e6e6e6"
                            strokeWidth="8"
                            fill="transparent"
                            r={radius}
                            cx="70"
                            cy="70"
                        />
                        <circle
                            className="progress-ring__circle"
                            stroke="#009688"
                            strokeWidth="8"
                            fill="transparent"
                            r={radius}
                            cx="70"
                            cy="70"
                            style={{
                                strokeDasharray: circumference,
                                strokeDashoffset: circumference - (progress / 100) * circumference,
                                transition: "stroke-dashoffset 0.3s ease"
                            }}
                        />
                    </svg>
                </div>
                <p className="loading-text">Cargando formulario... {progress}%</p>
            </div>
        );
    }

    return (
        <div>
            <Navbar />
            <div className="buttonBackDash">
                <button onClick={() => router.push('/')}>
                    <FontAwesomeIcon icon={faArrowLeft} className="iconBack" />
                    <p>Volver al inicio</p>
                </button>
            </div>
            <div className="containerNewformulario">
                <div className="headerNewformulario">
                    <h1 className="tittleNewformulario">Crea una nueva requisición</h1>
                    <p className="descriptionNewformulario">Paso {step} de 3</p>
                </div>
                <div className="contentNewformulario">
                    {step == 1 && (
                        <div>
                            <h1 className="tittleContent">Datos generales del solicitante.</h1>
                            <div className="inputsContainers">
                                <div className="completeInputs">
                                    <FontAwesomeIcon icon={faUser} className="icon" />
                                    <input
                                        type="text"
                                        name="nombre"
                                        placeholder="Nombre del Solicitante"
                                        value={form?.nombre || ""}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="completeInputs">
                                    <FontAwesomeIcon icon={faCalendar} className="icon" />
                                    <input
                                        type="date"
                                        name="fechaSolicitud"
                                        placeholder="Fecha de la Solicitud"
                                        value={form?.fechaSolicitud || ""}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="inputsContainers">
                                <div className="completeInputs">
                                    <FontAwesomeIcon icon={faCalendar} className="icon" />
                                    <input
                                        type="date"
                                        name="fechaEntrega"
                                        placeholder="Fecha requerido de entrega"
                                        value={form?.fechaEntrega || ""}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="completeInputs">
                                    <FontAwesomeIcon icon={faBalanceScale} className="icon" />
                                    <input
                                        type="text"
                                        name="justificacion"
                                        placeholder="Justificacion"
                                        value={form?.justificacion || ""}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="inputsContainers">
                                <div className="completeInputs">
                                    <FontAwesomeIcon icon={faClipboard} className="icon" />
                                    <input
                                        type="text"
                                        name="area"
                                        placeholder="Area del solicitante"
                                        value={form?.area || ""}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="completeInputs">
                                    <FontAwesomeIcon icon={faBuilding} className="icon" />
                                    <input
                                        type="text"
                                        name="sede"
                                        placeholder="Sede"
                                        value={form?.sede || ""}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="inputsContainers">
                                <div className="completeInputs">
                                    <FontAwesomeIcon icon={faExclamationTriangle} className="icon" />
                                    <input
                                        type="text"
                                        name="urgenciaCompra"
                                        placeholder="Urgencia de la compra"
                                        value={form?.urgenciaCompra || ""}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="completeInputs">
                                    <FontAwesomeIcon icon={faClock} className="icon" />
                                    <input
                                        type="time"
                                        name="tiempoGestion"
                                        placeholder="Tiempo aproximado de gestion."
                                        value={form?.tiempoGestion || ""}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="inputsContainers">
                                <div className="completeInputs">
                                    <FontAwesomeIcon icon={faPaperclip} className="icon" />
                                    <input
                                        type="text"
                                        name="anexos"
                                        placeholder="Anexos"
                                        value={form?.anexos || ""}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="spaceButtons">
                                <button onClick={nextStep} className="navegationButton">Siguiente</button>
                            </div>
                        </div>
                    )}

                    {step == 2 && (
                        <div>
                            <div className="tableContainer">
                                <h1 className="tittleTable">DESCRIPCION DEL ELEMENTO</h1>
                                <div className="tabla-container">
                                    <table className="tabla">
                                        <thead>
                                            <tr className="tabla-encabezado-principal">
                                                <th>ITEM</th>
                                                <th>DESCRIPCIÓN</th>
                                                <th>CANTIDAD</th>
                                                <th>CENTRO DE COSTO U ORDEN INTERNA</th>
                                                <th>CUENTA CONTABLE O CÓDIGO DE MATERIAL</th>
                                                <th colSpan={3}>¿ESTÁ EN PRESUPUESTO?</th>
                                                <th>VOBO GERENTE DE TECNOLOGÍA</th>
                                            </tr>
                                            <tr className="tabla-encabezado-secundario">
                                                <th colSpan={5}></th>
                                                <th>SI</th>
                                                <th>NO</th>
                                                <th>VALOR (*)</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filas.map((fila, index) => (
                                                <tr key={index}>
                                                    <td>{index + 1}</td>
                                                    <td>
                                                        <input
                                                            className="input-texto"
                                                            type="text"
                                                            value={fila.descripcion}
                                                            onChange={(e) =>
                                                                manejarCambio(index, "descripcion", e.target.value)
                                                            }
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            className="input-numero"
                                                            type="number"
                                                            min="0"
                                                            value={fila.cantidad}
                                                            onChange={(e) =>
                                                                manejarCambio(index, "cantidad", e.target.value)
                                                            }
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            className="input-texto"
                                                            type="text"
                                                            value={fila.centro}
                                                            onChange={(e) =>
                                                                manejarCambio(index, "centro", e.target.value)
                                                            }
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            className="input-texto"
                                                            type="text"
                                                            value={fila.cuenta}
                                                            onChange={(e) =>
                                                                manejarCambio(index, "cuenta", e.target.value)
                                                            }
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            className="input-radio"
                                                            type="radio"
                                                            name={`presupuesto-${index}`}
                                                            checked={fila.presupuesto === "si"}
                                                            onChange={() => manejarCambio(index, "presupuesto", "si")}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            className="input-radio"
                                                            type="radio"
                                                            name={`presupuesto-${index}`}
                                                            checked={fila.presupuesto === "no"}
                                                            onChange={() => manejarCambio(index, "presupuesto", "no")}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            className="input-numero"
                                                            type="number"
                                                            min="0"
                                                            value={fila.valor}
                                                            onChange={(e) => manejarCambio(index, "valor", e.target.value)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            className="input-texto"
                                                            type="text"
                                                            value={fila.vobo}
                                                            onChange={(e) =>
                                                                manejarCambio(index, "vobo", e.target.value)
                                                            }
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="spaceButtons">
                                <button className="btn-agregar" onClick={agregarFila}>
                                    <FontAwesomeIcon icon={faPlus} className="iconPlus" />
                                </button>
                                <p className="separator">|</p>
                                <button onClick={prevStep} className="navegationButton">
                                    <p>Volver</p>
                                </button>
                                <button onClick={nextStep} className="navegationButton">
                                    <p>Siguiente</p>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div>
                            <p className="tittleHeaderRevision">Revisión, Firmas y Confirmación</p>
                            <div>
                                <div>
                                    <div className="headerObservaciones">
                                        <p>OBSERVACIONES</p>
                                    </div>
                                    <div className="observacionesInputs">
                                        <input
                                            type="text"
                                            name="observacionesOne"
                                            placeholder="Escribe..."
                                            value={form.observacionesOne}
                                            onChange={handleChange}
                                        />
                                        <input
                                            type="text"
                                            name="observacionesTwo"
                                            placeholder="Escribe..."
                                            value={form.observacionesTwo}
                                            onChange={handleChange}
                                        />
                                        <input
                                            type="text"
                                            name="observacionesThree"
                                            placeholder="Escribe..."
                                            value={form.observacionesThree}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="firmasContainer">
                                        <div className="campoInfo">
                                            <div className="headerInfo">
                                                <p>SOLICITANTE</p>
                                            </div>
                                            <div className="nombre">
                                                <div className="text">
                                                    <p>NOMBRE:</p>
                                                </div>
                                                <input
                                                    type="text"
                                                    name="nombreSolicitante"
                                                    placeholder="Escribe..."
                                                    value={form.nombreSolicitante}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="firma">
                                                <div className="text">
                                                    <p>FIRMA:</p>
                                                </div>
                                                <input type="text"
                                                    name="firmaSolicitante"
                                                    placeholder="Escribe..."
                                                    value={form.firmaSolicitante}
                                                    onChange={handleChange}
                                                    className="inputFirma" />
                                            </div>
                                        </div>
                                        <div className="campoInfo">
                                            <div className="headerInfo">
                                                <p>DIRECTOR ADMINISTRATIVO</p>
                                            </div>
                                            <div className="nombre">
                                                <div className="text">
                                                    <p>NOMBRE:</p>
                                                </div>
                                                <input
                                                    type="text"
                                                    name="nombreAdministrativo"
                                                    placeholder="Escribe..."
                                                    value={form.nombreAdministrativo}
                                                    onChange={handleChange} />
                                            </div>
                                            <div className="firma">
                                                <div className="text">
                                                    <p>FIRMA:</p>
                                                </div>
                                                <input
                                                    type="text"
                                                    name="firmaAdministrativo"
                                                    placeholder="Escribe..."
                                                    value={form.firmaAdministrativo}
                                                    onChange={handleChange}
                                                    className="inputFirma" />
                                            </div>
                                        </div>
                                        <div className="campoInfo">
                                            <div className="headerInfo">
                                                <p>GERENTE DE AREA</p>
                                            </div>
                                            <div className="nombre">
                                                <div className="text">
                                                    <p>NOMBRE:</p>
                                                </div>
                                                <input
                                                    type="text"
                                                    name="nombreGerente"
                                                    placeholder="Escribe..."
                                                    value={form.nombreGerente}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                            <div className="firma">
                                                <div className="text">
                                                    <p>FIRMA:</p>
                                                </div>
                                                <input
                                                    type="text"
                                                    name="firmaGerente"
                                                    placeholder="Escribe..."
                                                    value={form.firmaGerente}
                                                    onChange={handleChange}
                                                    className="inputFirma" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="autorizacionGerenciaGeneral">
                                    <div className="autorizacionGeneral">
                                        <div className="headerGeneral">
                                            <p>AUTORIZACION GERENCIA GENERAL</p>
                                        </div>
                                        <div className="campoGeneral">
                                            <input
                                                type="text"
                                                name="autorizacionGerencia"
                                                placeholder="Escribe..."
                                                value={form.autorizacionGerencia}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="recepcionCompras">
                                        <div className="fecha">
                                            <div className="headerFecha">
                                                <p>FECHA</p>
                                            </div>
                                            <div className="campoFecha">
                                                <input
                                                    type="date"
                                                    name="fechaCompras"
                                                    placeholder="Escribe..."
                                                    value={form.fechaCompras}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                        <div className="hora">
                                            <div className="headerHora">
                                                <p>HORA</p>
                                            </div>
                                            <div className="campoHora">
                                                <input
                                                    type="time"
                                                    name="horaCompras"
                                                    placeholder="Escribe..."
                                                    value={form.horaCompras}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                        <div className="consecutivo">
                                            <div className="headerConsecutivo">
                                                <p>CONSECUTIVO</p>
                                            </div>
                                            <div className="campoConsecutivo">
                                                <input
                                                    type="text"
                                                    name="consecutivoCompras"
                                                    placeholder="Escribe..."
                                                    value={form.consecutivoCompras}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                        <div className="firma">
                                            <div className="headerFirma">
                                                <p>FIRMA</p>
                                            </div>
                                            <div className="campoFirma">
                                                <input
                                                    type="text"
                                                    name="firmaCompras"
                                                    placeholder="Escribe..."
                                                    value={form.firmaCompras}
                                                    onChange={handleChange}
                                                    className="inputFirma"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    )}
                    <div className="spaceButtons">
                        {step === 3 && <button className="navegationButton" onClick={prevStep}>Volver</button>}
                        {step === 3 && <button className="navegationButton" onClick={async () => { await guardarFormulario(); router.push('/') }}>Guardar</button>}
                    </div>
                </div>
            </div>
        </div>
    );
}