"use client";
import Link from "next/link";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function Navbar() {
  return (
    <nav className="navbar">
      <img src="/coopidrogas_logo_mini.png" alt="Logo" className="logo" />
        <div className="nav-links">
            <div className="infoUser">
              <div className="nameAndRol">
                <h3>Hola, Juan Camilo Bello Roa</h3>
                <p>Administrador</p>
              </div>
              <div className="imgUser">
                <FontAwesomeIcon icon={faUser} />
              </div>
            </div>
        </div>
    </nav>
  );
}
