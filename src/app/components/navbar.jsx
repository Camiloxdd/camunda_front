"use client";
import { useState, useEffect } from "react";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function Navbar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch("http://localhost:4000/api/auth/me", {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data))
      .catch(() => setUser(null));
  }, []);

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
      default:
        return cargo || "Usuario";
    }
  };

  return (
    <nav className="navbar">
      <img src="/coopidrogas_logo_mini.png" alt="Logo" className="logo" />

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
            <FontAwesomeIcon icon={faUser} />
          </div>
        </div>
      </div>
    </nav>
  );
}
