"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function EditarFormulario() {
  const router = useRouter();
  const { id } = router.query; // ID del formulario en la URL

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    campo1: "",
    campo2: "",
    campo3: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    // Simulación de fetch a backend / Camunda
    const fetchData = async () => {
      try {
        // Aquí llamas a tu backend para traer datos de ese formulario
        /*
        const res = await fetch(`/api/formularios/${id}`);
        const data = await res.json();
        setFormData(data);
        */
        setFormData({
          campo1: "Valor cargado de BD 1",
          campo2: "Valor cargado de BD 2",
          campo3: "Valor cargado de BD 3",
        });
      } catch (err) {
        console.error("Error cargando formulario:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSave = async () => {
    console.log("Formulario actualizado:", formData);

    // Aquí envías datos actualizados al backend / Camunda
    /*
    await fetch(`/api/formularios/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    */

    alert("Formulario actualizado correctamente");
    router.push("/dashboard");
  };

  if (loading) return <p>Cargando...</p>;

  return (
    <div>
      <h1>Editar Formulario {id}</h1>

      {step === 1 && (
        <div>
          <h2>Paso 1</h2>
          <input
            type="text"
            name="campo1"
            value={formData.campo1}
            onChange={handleChange}
          />
        </div>
      )}

      {step === 2 && (
        <div>
          <h2>Paso 2</h2>
          <input
            type="text"
            name="campo2"
            value={formData.campo2}
            onChange={handleChange}
          />
        </div>
      )}

      {step === 3 && (
        <div>
          <h2>Paso 3</h2>
          <input
            type="text"
            name="campo3"
            value={formData.campo3}
            onChange={handleChange}
          />
        </div>
      )}

      <div>
        {step > 1 && <button onClick={handleBack}>Atrás</button>}
        {step < 3 && <button onClick={handleNext}>Siguiente</button>}
        {step === 3 && <button onClick={handleSave}>Guardar Cambios</button>}
      </div>
    </div>
  );
}
