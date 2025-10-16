"use client";
import { useState, useEffect } from "react";
import "../styles/modalNewReq.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faUser,
    faCalendar,
    faBalanceScale,
    faClipboard,
    faBuilding,
    faExclamationTriangle,
    faPaperclip,
    faPlus,
    faX,
    faCubes,
    faListOl,
    faMoneyBill,
    faFile,
    faTrash,
    faSackDollar,
} from "@fortawesome/free-solid-svg-icons";
import TextareaAutosize from "react-textarea-autosize";

export default function WizardModal({ open, onClose }) {
    const [step, setStep] = useState(1);
    const [fileName, setFileName] = useState("");
    const [productoActivo, setProductoActivo] = useState(0);
    const [mostrarModalProductos, setMostrarModalProductos] = useState(false);
    const [productoActivo3, setProductoActivo3] = useState(0);
    const [mostrarModalProductos3, setMostrarModalProductos3] = useState(false);



    const [formData, setFormData] = useState({
        solicitante: {
            nombre: "",
            fecha: "",
            justificacion: "",
            area: "",
            sede: "",
            urgencia: "",
            presupuestada: false,
        },
        productos: [
            {
                nombre: "",
                cantidad: 1,
                descripcion: "",
                compraTecnologica: false,
                ergonomico: false,
                valorEstimado: "",
                centroCosto: "",
                cuentaContable: "",
                aprobaciones: [],
            },
        ],
    });

    console.log(formData)

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) setFileName(file.name);
        else setFileName("");
    };

    const totalGeneral = formData.productos.reduce((acc, p) => {
        const num = parseFloat(p.valorEstimado) || 0;
        return acc + num;
    }, 0);

    const handleSubmitFinal = async () => {
        try {
            const res = await fetch("http://localhost:4000/api/solicitudes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (!res.ok) throw new Error("Error al guardar");
            alert("Solicitud creada con éxito");
            onClose();
        } catch (err) {
            console.error(err);
            alert("Hubo un error al guardar");
        }
    };

    useEffect(() => {
        if (productoActivo3 >= formData.productos.length) {
            setProductoActivo3(0);
        }
    }, [formData.productos.length]);

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
                                            <input type="text" placeholder="Ej. Juan Pérez" value={formData.solicitante.nombre}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        solicitante: {
                                                            ...formData.solicitante,
                                                            nombre: e.target.value,
                                                        },
                                                    })
                                                } />
                                        </div>
                                    </div>
                                    <div className="campoAdicional">
                                        <label>Fecha de solicitud</label>
                                        <div className="completeInputs">
                                            <FontAwesomeIcon icon={faCalendar} className="icon" />
                                            <input type="date" value={formData.solicitante.fecha}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        solicitante: {
                                                            ...formData.solicitante,
                                                            fecha: e.target.value,
                                                        },
                                                    })
                                                } />
                                        </div>
                                    </div>
                                    <div className="campoAdicional">
                                        <label>Justificación de la compra</label>
                                        <div className="completeInputs">
                                            <FontAwesomeIcon icon={faBalanceScale} className="icon" />
                                            <input type="text" placeholder="Motivo de la solicitud" value={formData.solicitante.justificacion}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        solicitante: {
                                                            ...formData.solicitante,
                                                            justificacion: e.target.value,
                                                        },
                                                    })
                                                } />
                                        </div>
                                    </div>
                                    <div className="campoAdicional">
                                        <label>Área</label>
                                        <div className="completeInputs">
                                            <FontAwesomeIcon icon={faClipboard} className="icon" />
                                            <input type="text" placeholder="Ej. Compras" value={formData.solicitante.area}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        solicitante: {
                                                            ...formData.solicitante,
                                                            area: e.target.value,
                                                        },
                                                    })
                                                } />
                                        </div>
                                    </div>
                                    <div className="campoAdicional">
                                        <label>Sede</label>
                                        <div className="completeInputs">
                                            <FontAwesomeIcon icon={faBuilding} className="icon" />
                                            <input type="text" placeholder="Ej. Cundinamarca" value={formData.solicitante.sede}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        solicitante: {
                                                            ...formData.solicitante,
                                                            sede: e.target.value,
                                                        },
                                                    })
                                                } />
                                        </div>
                                    </div>
                                    <div className="campoAdicional">
                                        <label>Urgencia</label>
                                        <div className="completeInputs">
                                            <FontAwesomeIcon
                                                icon={faExclamationTriangle}
                                                className="icon"
                                            />
                                            <input type="text" placeholder="Alta / Media / Baja"
                                                value={formData.solicitante.urgencia}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        solicitante: {
                                                            ...formData.solicitante,
                                                            urgencia: e.target.value,
                                                        },
                                                    })
                                                } />
                                        </div>
                                    </div>
                                </div>
                                <div className="firsInfo">
                                    <label>
                                        ¿Está en presupuesto?
                                        <input
                                            type="checkbox"
                                            checked={formData.solicitante.presupuestada}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    solicitante: {
                                                        ...formData.solicitante,
                                                        presupuestada: e.target.checked,
                                                    },
                                                })
                                            }
                                        />
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* PASO 2: DETALLES DEL PRODUCTO */}
                        {step === 2 && (
                            <div className="papitoGugutata">
                                <h1 className="tittleContentGugutata">Detalles del producto o servicio</h1>
                                <div className="productoNav">
                                    {formData.productos.slice(0, 3).map((prod, index) => (
                                        <button
                                            key={index}
                                            className={`productoTab ${index === productoActivo ? "active" : ""}`}
                                            onClick={() => setProductoActivo(index)}
                                        >
                                            <FontAwesomeIcon className="iconListFiles" icon={faFile} />{prod.nombre || `Producto ${index + 1}`}
                                        </button>
                                    ))}
                                    {formData.productos.length > 3 && (
                                        <button
                                            className="productoTab verTodos"
                                            onClick={() => setMostrarModalProductos(true)}
                                        >
                                            Ver todos ({formData.productos.length})
                                        </button>
                                    )}
                                    <button
                                        className="wizardModal-btn-remove"
                                        disabled={formData.productos.length <= 1}
                                        onClick={() => {
                                            const productos = formData.productos.filter(
                                                (_, i) => i !== productoActivo
                                            );
                                            setFormData({ ...formData, productos });
                                            setProductoActivo((prev) =>
                                                prev > 0 ? prev - 1 : 0
                                            );
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                    <button
                                        className="wizardModal-btn-add"
                                        onClick={() =>
                                            setFormData({
                                                ...formData,
                                                productos: [
                                                    ...formData.productos,
                                                    {
                                                        nombre: "",
                                                        cantidad: 1,
                                                        descripcion: "",
                                                        compraTecnologica: false,
                                                        ergonomico: false,
                                                        valorEstimado: "",
                                                        centroCosto: "",
                                                        cuentaContable: "",
                                                        aprobaciones: [],
                                                    },
                                                ],
                                            })
                                        }
                                    >
                                        <FontAwesomeIcon icon={faPlus} />
                                    </button>
                                </div>
                                <div className="productoItem">
                                    <div className="inputsContainers">
                                        <div className="campoAdicional">
                                            <label>Producto / Servicio</label>
                                            <div className="completeInputs">
                                                <FontAwesomeIcon icon={faCubes} className="icon" />
                                                <input
                                                    type="text"
                                                    placeholder="Ej. Escritorio ergonómico"
                                                    value={formData.productos[productoActivo].nombre}
                                                    onChange={(e) => {
                                                        const productos = [...formData.productos];
                                                        productos[productoActivo].nombre = e.target.value;
                                                        setFormData({ ...formData, productos });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="campoAdicional">
                                            <label>Cantidad</label>
                                            <div className="completeInputs">
                                                <FontAwesomeIcon icon={faListOl} className="icon" />
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={formData.productos[productoActivo].cantidad}
                                                    onChange={(e) => {
                                                        const productos = [...formData.productos];
                                                        productos[productoActivo].cantidad = e.target.value;
                                                        setFormData({ ...formData, productos });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="campoAdicional">
                                            <label>Descripción</label>
                                            <div className="completeInputs">
                                                <FontAwesomeIcon icon={faClipboard} className="icon" />
                                                <TextareaAutosize
                                                    className="textAreaCustom"
                                                    placeholder="Detalles del producto solicitado"
                                                    value={formData.productos[productoActivo].descripcion}
                                                    onChange={(e) => {
                                                        const productos = [...formData.productos];
                                                        productos[productoActivo].descripcion = e.target.value;
                                                        setFormData({ ...formData, productos });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="firsInfoTwo">
                                            <label>
                                                ¿Es un producto Tecnologico?
                                                <input
                                                    type="checkbox"
                                                    checked={formData.productos[productoActivo].compraTecnologica}
                                                    onChange={(e) => {
                                                        const productos = [...formData.productos];
                                                        productos[productoActivo].compraTecnologica = e.target.checked;
                                                        setFormData({ ...formData, productos });
                                                    }}
                                                />
                                            </label>
                                            <label>
                                                ¿Es un producto Ergonomico?
                                                <input
                                                    type="checkbox"
                                                    checked={formData.productos[productoActivo].ergonomico}
                                                    onChange={(e) => {
                                                        const productos = [...formData.productos];
                                                        productos[productoActivo].ergonomico = e.target.checked;
                                                        setFormData({ ...formData, productos });
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                {mostrarModalProductos && (
                                    <div className="modalOverlay">
                                        <div className="modalSelectProductos">
                                            <h3>Selecciona un producto</h3>
                                            {formData.productos.map((prod, index) => (
                                                <div
                                                    key={index}
                                                    className="modalProductoItem"
                                                    onClick={() => {
                                                        setProductoActivo(index);
                                                        setMostrarModalProductos(false);
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={faFile} className="iconListFiles" /> {prod.nombre || `Producto ${index + 1}`}
                                                </div>
                                            ))}
                                            <button
                                                className="closeModalBtn"
                                                onClick={() => setMostrarModalProductos(false)}
                                            >
                                                Cerrar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {/* PASO 3: PRESUPUESTO Y TECNOLOGÍA */}
                        {step === 3 && (

                            <div className="papitoGugutata">
                                <h1 className="tittleContentGugutata">
                                    Presupuesto y características técnicas
                                </h1>
                                <div className="productoNav">
                                    {formData.productos.slice(0, 3).map((prod, index) => (
                                        <button
                                            key={index}
                                            className={`productoTab ${index === productoActivo3 ? "active" : ""}`}
                                            onClick={() => setProductoActivo3(index)}
                                        >
                                            <FontAwesomeIcon icon={faSackDollar} className="iconListFiles" />
                                            {prod.nombre || `Producto ${index + 1}`}
                                        </button>
                                    ))}

                                    {formData.productos.length > 3 && (
                                        <button
                                            className={`productoTab verTodos ${productoActivo3 >= 3 ? "active" : ""
                                                }`}
                                            onClick={() => {
                                                if (productoActivo3 < 3) {
                                                    setMostrarModalProductos3(true);
                                                } else {
                                                    setMostrarModalProductos3(true);
                                                }
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faSackDollar} className="iconListFiles" />
                                            {productoActivo3 >= 3
                                                ? formData.productos[productoActivo3].nombre ||
                                                `Producto ${productoActivo3 + 1}`
                                                : `Ver todos (${formData.productos.length})`}
                                        </button>
                                    )}
                                </div>
                                <div className="productoItem">
                                    <div className="inputsContainers">
                                        <div className="campoAdicional">
                                            <label>Valor estimado</label>
                                            <div className="completeInputs">
                                                <FontAwesomeIcon icon={faMoneyBill} className="icon" />
                                                <input
                                                    type="number"
                                                    placeholder="Valor estimado"
                                                    value={formData.productos[productoActivo3].valorEstimado}
                                                    onChange={(e) => {
                                                        const productos = [...formData.productos];
                                                        productos[productoActivo3].valorEstimado = e.target.value;
                                                        setFormData({ ...formData, productos });
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="campoAdicional">
                                            <label>Anexos</label>
                                            <div className="fileUploadContainer">
                                                <FontAwesomeIcon icon={faPaperclip} className="icon" />
                                                <label
                                                    htmlFor={`fileUpload-${productoActivo3}`}
                                                    className="customFileButton"
                                                >
                                                    {formData.productos[productoActivo3].fileName
                                                        ? formData.productos[productoActivo3].fileName
                                                        : "Seleccionar archivo"}
                                                </label>
                                                <input
                                                    type="file"
                                                    id={`fileUpload-${productoActivo3}`}
                                                    className="hiddenFileInput"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            const productos = [...formData.productos];
                                                            productos[productoActivo3].fileName = file.name;
                                                            productos[productoActivo3].file = file;
                                                            setFormData({ ...formData, productos });
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="campoAdicional">
                                            <label>Centro de costo / Orden interna</label>
                                            <div className="completeInputs">
                                                <FontAwesomeIcon icon={faClipboard} className="icon" />
                                                <input
                                                    type="text"
                                                    placeholder="Ej. CC-104 / OI-245"
                                                    value={formData.productos[productoActivo3].centroCosto}
                                                    onChange={(e) => {
                                                        const productos = [...formData.productos];
                                                        productos[productoActivo3].centroCosto = e.target.value;
                                                        setFormData({ ...formData, productos });
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="campoAdicional">
                                            <label>Cuenta contable o código de material</label>
                                            <div className="completeInputs">
                                                <FontAwesomeIcon icon={faMoneyBill} className="icon" />
                                                <input
                                                    type="text"
                                                    placeholder="Ej. 5120-Equipos"
                                                    value={formData.productos[productoActivo3].cuentaContable}
                                                    onChange={(e) => {
                                                        const productos = [...formData.productos];
                                                        productos[productoActivo3].cuentaContable = e.target.value;
                                                        setFormData({ ...formData, productos });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {mostrarModalProductos3 && (
                                    <div className="modalOverlay">
                                        <div className="modalSelectProductos">
                                            <h3>Selecciona un producto</h3>
                                            {formData.productos.map((prod, index) => (
                                                <div
                                                    key={index}
                                                    className="modalProductoItem"
                                                    onClick={() => {
                                                        setProductoActivo3(index);
                                                        setMostrarModalProductos3(false);
                                                    }}
                                                >
                                                    💰 {prod.nombre || `Producto ${index + 1}`}
                                                </div>
                                            ))}
                                            <button
                                                className="closeModalBtn"
                                                onClick={() => setMostrarModalProductos3(false)}
                                            >
                                                Cerrar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {/* PASO 4: APROBACIONES */}
                        {step === 4 && (
                            <div className="papitoGugutata">
                                <h1 className="tittleContentGugutata">Resumen de solicitud</h1>

                                {/* === DATOS DEL SOLICITANTE y TOTALES === */}
                                <div className="resumenSectionOne">
                                    <div className="infoSolicitanteFinal">
                                        <h2>Datos del solicitante</h2>
                                        <ul>
                                            <li><strong>Nombre:</strong> {formData.solicitante.nombre || "—"}</li>
                                            <li><strong>Fecha:</strong> {formData.solicitante.fecha || "—"}</li>
                                            <li><strong>Área:</strong> {formData.solicitante.area || "—"}</li>
                                            <li><strong>Sede:</strong> {formData.solicitante.sede || "—"}</li>
                                            <li><strong>Urgencia:</strong> {formData.solicitante.urgencia || "—"}</li>
                                            <li><strong>Justificación:</strong> {formData.solicitante.justificacion || "—"}</li>
                                            <li><strong>Compra Presupuestada:</strong> {formData.solicitante.presupuestada || "—"}</li>
                                        </ul>
                                    </div>

                                    <div className="totalesProductos">
                                        <h2>Totales generales</h2>
                                        <ul>
                                            <li>
                                                <strong>Total de productos:</strong> {formData.productos.length}
                                            </li>
                                            <li>
                                                <strong>Total ergonómicos:</strong>{" "}
                                                {formData.productos.filter((p) => p.ergonomico).length}
                                            </li>
                                            <li>
                                                <strong>Total tecnológicos:</strong>{" "}
                                                {formData.productos.filter((p) => p.compraTecnologica).length}
                                            </li>
                                            <li>
                                                <strong>Valor total estimado:</strong>{" "}
                                                {formData.productos
                                                    .reduce(
                                                        (sum, p) => sum + (parseFloat(p.valorEstimado) || 0),
                                                        0
                                                    )
                                                    .toLocaleString("es-CO", {
                                                        style: "currency",
                                                        currency: "COP",
                                                        minimumFractionDigits: 0,
                                                    })}
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                {/* === DETALLES DE PRODUCTOS === */}
                                <div className="resumenSection">
                                    <h2>Productos solicitados</h2>
                                    <table className="tablaResumen">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Producto / Servicio</th>
                                                <th>Cantidad</th>
                                                <th>Valor estimado</th>
                                                <th>Compra tecnológica</th>
                                                <th>Ergonómico</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.productos.map((prod, index) => (
                                                <tr key={index}>
                                                    <td>{index + 1}</td>
                                                    <td>{prod.nombre || "—"}</td>
                                                    <td>{prod.cantidad}</td>
                                                    <td>
                                                        {prod.valorEstimado
                                                            ? `$${Number(prod.valorEstimado).toLocaleString()}`
                                                            : "—"}
                                                    </td>
                                                    <td>{prod.compraTecnologica ? "Sí" : "No"}</td>
                                                    <td>{prod.ergonomico ? "Sí" : "No"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
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
