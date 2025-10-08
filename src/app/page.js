"use client";
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faUser } from "@fortawesome/free-solid-svg-icons";

export default function Dashboard() {
  return (
    <div className=" background-img">
      <div className="login">
        <div className="background-img-left">
          <img src="/coopidrogas_sede.png" alt="Logo" className="logo" />
        </div>
        <div className="login-right">
          <div className="login-container">
            <div className="login-header">
              <img
                src="/coopidrogas_logo_mini.png"
                alt="Logo"
                className="logoCoopiLogin"
              />
              <div className="login-text">
                <h2 className="login-title">Inicio de sesión</h2>
                <p className="login-subtitle">
                  REQUISICIÓN DE COMPRA O SERVICIO
                </p>
              </div>
            </div>
            <div className="login-form">
              <div className="inputAndIcon">
                <FontAwesomeIcon icon={faUser} className="icon" />
                <input className="inputLogin" placeholder="Usuario" autoComplete="on"/>
              </div>
              <div className="inputAndIcon">
                <FontAwesomeIcon icon={faLock} className="icon" />
                <input className="inputLogin" placeholder="Contraseña" autoComplete="on"/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
