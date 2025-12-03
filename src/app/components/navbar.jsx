"use client";
import { useAuth } from "../context/AuthContext";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Navbar() {
  const { user } = useAuth();

  const getCargoNombre = (cargo) => {
    switch (cargo) {
      case "managerGeneral":
        return "Gerente General";
      case "managerAdmin":
        return "Gerente Administrativo";
      case "managerArea":
        return "Gerente de Área";
      case "dicLeaderArea":
        return "Líder de Área";
      case "CoordiDevWeb":
        return "Coordinador Desarrollo Web"
      case "analistaQA":
        return "Analista Requerimientos y QA"
      case "gerAdmin":
        return "Gerente Administrativo"
      case "gerGeneral":
        return "Gerente General"
      case "dicTYP":
        return "Director Tecnología y Proyectos"
      case "gerTyC":
        return "Gerente Tecnología y Proyectos"
      case "dicSST":
        return "Director Seguridad y Salud en el Trabajo";
      case "gerSST":
        return "Gerente Seguridad y Salud en el Trabajo";
      default:
        return cargo || "Usuario";
    }
  };

  return (
    <nav className="navbar">
      <div className="logoAndTittle">
        <img src="/coopidrogas_logo_mini.png" alt="Logo" className="logo" />
        <div className="tittleLogo">
          <h2>Gestión de Requisiciones</h2>
          <p>Lista de todas las requisiciones en el sistema</p>
        </div>
      </div>
      <div className="nav-links">
        <div className="infoUser">
          <div className="nameAndRol">
            {user ? (
              <>
                <h3>Hola, {user.nombre}</h3>
                <p>{getCargoNombre(user.cargo)}</p>
              </>
            ) : (
              <>
                <h3>Cargando usuario...</h3>
                <p></p>
              </>
            )}
          </div>
          <div className="imgUser">
            <button></button>
            <FontAwesomeIcon icon={faUser} />
          </div>
        </div>
      </div>

    </nav>
  );
}
