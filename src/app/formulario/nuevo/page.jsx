"use client";
import { useState } from "react";
import Navbar from "../../components/navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faCalendar, faBalanceScale, faClipboard, faBuilding, faExclamationTriangle, faClock, faPaperclip} from "@fortawesome/free-solid-svg-icons";

export default function NuevoFormulario() {
  const [step, setStep] = useState(1);
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
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  return (
    <div>
      <Navbar />
      <div className="containerNewformulario">
        <div className="headerNewformulario">
          <h1 className="tittleNewformulario">Crea una nueva requisición</h1>
          <p className="descriptionNewformulario">Paso {step} de 3</p>
        </div>
        <div className="contentNewformulario">
          {step == 1 && (
            <div>
              <h1 className="tittleContent">1. Datos generales del solicitante.</h1>
              <div className="inputsContainers">
                <div className="completeInputs">
                  <FontAwesomeIcon icon={faUser} className="icon"/>
                  <input
                    type="text"
                    name="nombre"
                    placeholder="Nombre del Solicitante"
                    value={form.nombre}
                    onChange={handleChange}
                  />
                </div>
                <div className="completeInputs">
                  <FontAwesomeIcon icon={faCalendar} className="icon"/>
                  <input
                    type="date"
                    name="fechaSolicitud"
                    placeholder="Fecha de la Solicitud"
                    value={form.fechaSolicitud}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="inputsContainers">
                <div className="completeInputs">
                  <FontAwesomeIcon icon={faCalendar} className="icon"/>
                  <input
                    type="date"
                    name="fechaEntrega"
                    placeholder="Fecha requerido de entrega"
                    value={form.fechaEntrega}
                    onChange={handleChange}
                  />
                </div>
                <div className="completeInputs">
                  <FontAwesomeIcon icon={faBalanceScale} className="icon"/>
                  <input
                    type="text"
                    name="justificacion"
                    placeholder="Justificacion"
                    value={form.justificacion}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="inputsContainers">
                <div className="completeInputs">
                  <FontAwesomeIcon icon={faClipboard} className="icon"/>
                  <input
                    type="text"
                    name="area"
                    placeholder="Area del solicitante"
                    value={form.area}
                    onChange={handleChange}
                  />
                </div>
                <div className="completeInputs">
                  <FontAwesomeIcon icon={faBuilding} className="icon"/>
                  <input
                    type="text"
                    name="sede"
                    placeholder="Sede"
                    value={form.sede}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="inputsContainers">
                <div className="completeInputs">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="icon"/>
                  <input
                    type="text"
                    name="urgenciaCompra"
                    placeholder="Urgencia de la compra"
                    value={form.urgenciaCompra}
                    onChange={handleChange}
                  />
                </div>
                <div className="completeInputs">
                  <FontAwesomeIcon icon={faClock} className="icon"/>
                  <input
                    type="time"
                    name="tiempoGestion"
                    placeholder="Tiempo aproximado de gestion."
                    value={form.tiempoGestion}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="inputsContainers">
                <div className="completeInputs">
                  <FontAwesomeIcon icon={faPaperclip} className="icon"/>
                  <input
                    type="text"
                    name="anexos"
                    placeholder="Anexos"
                    value={form.anexos}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <button onClick={async () => { await startProcess(); next(); }}>
                <p>Siguiente</p>
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2>Paso 2: Detalles</h2>
              <textarea placeholder="Descripción"></textarea>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2>Paso 3: Revisión y Confirmación</h2>
              <p>Confirma los datos antes de enviar.</p>
            </div>
          )}

          <div style={{ marginTop: "20px" }}>
            {step > 1 && <button onClick={prevStep}>Anterior</button>}
            {step < 3 && <button onClick={nextStep}>Siguiente</button>}
            {step === 3 && <button onClick={() => alert("Formulario enviado ✅")}>Enviar</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
