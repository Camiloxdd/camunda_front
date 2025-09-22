"use client";
import React from "react";
import WizardView from "./components/wizardView";

export default function ReviewPage() {
  const [submittedData, setSubmittedData] = useState(null);

  const handleFinish = (data) =>{
    console.log("Datos recibidos: ", data);
    setSubmittedData(data)
  }
  return (
    <div>
      <h2>Revisión de Datos</h2>
      <WizardView onFinish={handleFinish} /> 
      
      {submittedData && (
        <div>
          <h3>Resumen:</h3>
          <p>Descripción: {submittedData.descripcion}</p>
          <p>Cantidad: {submittedData.cantidad}</p>
        </div>
      )}
    </div>
  );
}
