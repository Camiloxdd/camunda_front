"use client";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExcel } from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function OptionsModal({ isOpen, onClose, selectedId }) {
    const router = useRouter();
    if (typeof document === "undefined") return null;

    const handleDelete = async () => {
        try {
            await fetch(`http://localhost:4000/formularios/${selectedId}`, {
                method: "DELETE",
            });
            alert("Formulario eliminado ✅");
            onClose();
            router.refresh(); 
        } catch (err) {
            console.error(err);
            alert("Error eliminando");
        }
    };

    const handleEdit = () => {
        onClose();
        router.push(`/formulario/edicion/${selectedId}`); 
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="overlay"
                    onClick={onClose}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="modal"
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="container">
                            <button className="closeModal" onClick={onClose}>X</button>
                            <div className="headerModal">
                                <h1 className="titleModal">Opciones del documento.</h1>
                            </div>
                            <div className="infos">
                                <div className="buttonsModal">
                                    <button className="buttonEdit" onClick={handleEdit}>
                                        Editar
                                    </button>
                                    <button className="buttonDelete" onClick={handleDelete}>
                                        Eliminar
                                    </button>
                                    <button className="buttonDelete">
                                        Descargar PDF
                                        <FontAwesomeIcon icon={faFileExcel} style={{ marginLeft: '8px' }} />
                                    </button>
                                    <button className="buttonDelete" onClick={() => {
                                        router.push(`/formulario/revision/${selectedId}`);
                                        onClose();
                                    }}>
                                        Revisar formulario
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}

/*"use client";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExcel } from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function OptionsModal({ isOpen, onClose }) {
    const router = useRouter();
    if (typeof document === "undefined") return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="overlay"
                    onClick={onClose}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="modal"
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="container">
                            <button className="closeModal" onClick={() => { onClose(); }}>X</button>
                            <div className="headerModal">
                                <h1 className="titleModal">
                                    Opciones del documento.
                                </h1>
                            </div>
                            <div className="infos">
                                <div className="infoGeneral">
                                    <div className="fecha">
                                        <p className="labelInfo">Fecha de creación:</p>
                                        <div className="fechaBase">
                                            <p>12/03/2024</p>
                                        </div>
                                    </div>
                                    <div className="estado">
                                        <p className="labelInfo">Estado:</p>
                                        <div className="estadoBase">
                                            <p>En revisión</p>
                                        </div>
                                    </div>
                                    <div className="estado">
                                        <p className="labelInfo">Creado por:</p>
                                        <div className="estadoBase">
                                            <p>Juan Camilo Bello Roa</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="buttonsModal">
                                    <button className="buttonEdit" onClick={() => {
                                        console.log("EDITAR");
                                        onClose();
                                    }}>
                                        Editar
                                    </button>
                                    <button className="buttonDelete" onClick={() => {
                                        router.push('/formulario/revision/');
                                        onClose();
                                    }}>
                                        Revisar formulario
                                    </button>
                                    <button className="buttonDelete" onClick={() => {
                                        console.log("ELIMINAR");
                                        onClose();
                                    }}>
                                        Eliminar
                                    </button>
                                    <button className="buttonDelete" onClick={() => {
                                        console.log("ELIMINAR");
                                        onClose();
                                    }}>
                                        Descargar PDF
                                        <FontAwesomeIcon icon={faFileExcel} style={{ marginLeft: '8px' }} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
*/