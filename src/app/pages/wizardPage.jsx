import React from "react";
import WizardView from "../components/wizardView";

const WizardPage = () => {
  const handleFinish = (data) => {
    console.log("Formulario completado:", data);
    localStorage.setItem("formData", JSON.stringify(data));
    alert("Formulario completado ✅");
  };

  return (
    <div>
      <WizardView onFinish={handleFinish} />
    </div>
  );
};

export default WizardPage;
