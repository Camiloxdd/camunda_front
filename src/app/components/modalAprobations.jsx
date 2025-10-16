import React from "react";

const ApprovalModal = ({ userRole, userArea, documentData }) => {
  // Estructura de áreas
  const areas = {
    tecnologia: "Tecnología y Proyectos",
    sst: "Dirección SST",
  };

  // Condiciones para mostrar cada paso
  const canViewStep1 =
    userRole === "dicLeaderArea" &&
    (userArea === areas.tecnologia || userArea === areas.sst);

  const canViewStep2 =
    userRole === "managerArea" &&
    (userArea === areas.tecnologia || userArea === areas.sst);

  const canViewStep3 =
    userRole === "managerAdmin" &&
    (userArea === areas.tecnologia || userArea === areas.sst);

  const canViewStep4 =
    userRole === "managerGeneral" &&
    (userArea === areas.tecnologia || userArea === areas.sst);

  return (
    <div className="modalContainer">
      <div className="modalContent">
        <h2 className="modalTitle">Aprobación de Documento</h2>

        {/* STEP 1 - Director o Líder del Área */}
        {canViewStep1 && (
          <div className="step step1">
            <h3>1️⃣ Revisión del Director / Líder de Área ({userArea})</h3>
            <p>
              Aquí se muestra la información para el rol <b>dicLeaderArea</b> de{" "}
              {userArea}.
            </p>
            <p>Detalles del documento: {documentData?.nombre}</p>
          </div>
        )}

        {/* STEP 2 - Gerente del Área */}
        {canViewStep2 && (
          <div className="step step2">
            <h3>2️⃣ Aprobación del Gerente de Área ({userArea})</h3>
            <p>
              Esta vista solo es visible para el rol <b>managerArea</b> de{" "}
              {userArea}.
            </p>
            <p>Documento: {documentData?.nombre}</p>
          </div>
        )}

        {/* STEP 3 - Gerente Administrativo */}
        {canViewStep3 && (
          <div className="step step3">
            <h3>3️⃣ Revisión del Gerente Administrativo</h3>
            <p>
              Solo visible para el rol <b>managerAdmin</b>.
            </p>
            <p>Documento: {documentData?.nombre}</p>
          </div>
        )}

        {/* STEP 4 - Gerente General */}
        {canViewStep4 && (
          <div className="step step4">
            <h3>4️⃣ Aprobación Final del Gerente General</h3>
            <p>
              Solo visible para el rol <b>managerGeneral</b>.
            </p>
            <p>Documento: {documentData?.nombre}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalModal;
