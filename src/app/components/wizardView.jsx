"use client";
// frontend/src/WizardView.jsx
import React, { useState } from "react";

export default function WizardView() {
  const [step, setStep] = useState(1);
  const [processInstanceKey, setProcessInstanceKey] = useState(null);
  const [loading, setLoading] = useState(false);
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

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const startProcess = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/start-process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form }),
      });
      const data = await res.json();
      if (data && data.processInstanceKey) {
        setProcessInstanceKey(data.processInstanceKey);
        setStep(2);
        console.log("Proceso iniciado:", data.processInstanceKey);
      } else {
        console.error("Error al iniciar proceso:", data);
        alert("No se pudo iniciar el proceso. Revisa backend/worker logs.");
      }
    } catch (err) {
      console.error("Error llamando start-process:", err);
      alert("Error de conexión al backend. Revisa consola.");
    } finally {
      setLoading(false);
    }
  };

  const next = () => setStep((s) => Math.min(4, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div style={{ padding: 20 }}>
      <h2>Wizard — Paso {step}</h2>

      {step === 1 && (
        <div>
          <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre" />
          <input type="date" name="fechaSolicitud" value={form.fechaSolicitud} onChange={handleChange} />
          <input type="date" name="fechaEntrega" value={form.fechaEntrega} onChange={handleChange} />
          <input name="justificacion" value={form.justificacion} onChange={handleChange} placeholder="Justificación" />
          {/* agrega los demás inputs que quieras */}
          <div style={{ marginTop: 10 }}>
            <button onClick={startProcess} disabled={loading}>
              {loading ? "Iniciando..." : "Iniciar proceso y siguiente"}
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <p>Step 2 — descripción del elemento (tu UI de tabla aquí)</p>
          <button onClick={prev}>Volver</button>
          <button onClick={next}>Siguiente</button>
        </div>
      )}

      {step === 3 && (
        <div>
          <p>Step 3 — confirmación</p>
          <p>ProcessInstanceKey: {processInstanceKey}</p>
          <button onClick={prev}>Volver</button>
          <button onClick={next}>Finalizar</button>
        </div>
      )}

      {step === 4 && <div><h3>✅ Flujo finalizado (UI). Revisa Operate para confirmar el fin del proceso.</h3></div>}
    </div>
  );
}
