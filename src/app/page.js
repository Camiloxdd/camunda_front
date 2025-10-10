"use client";
import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faUser, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

export default function Dashboard() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className=" background-img">
      <div className="login">
        <div className="background-img-left">
          <img src="/coopidrogas_sede.jpeg" alt="Logo" className="logo" />
        </div>
        <div className="login-right">
          <div className="login-container">
            <div className="login-header">
              <div className="login-text">
                <p className="login-subtitle">
                  Bienvenido a
                </p>
                <h2 className="login-title">REQUISICIÓN DE COMPRA O SERVICIO</h2>
              </div>
              <img
                src="/coopidrogas_logo_mini.png"
                alt="Logo"
                className="logoCoopiLogin"
              />
            </div>
            <div className="login-form">
              <div className="inputAndIcon">
                <FontAwesomeIcon icon={faUser} className="iconLogin" size="15px" />
                <div className="inputAndLabel">
                  <label>Usuario</label>
                  <input className="inputLogin" autoComplete="on" />
                </div>
              </div>
              <div className="inputAndIcon">
                <FontAwesomeIcon icon={faLock} className="iconLogin" />
                <div className="inputAndLabel">
                  <label>Contraseña</label>
                  <div className="containerIconAndInput">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="inputLogin"
                      autoComplete="current-password"
                    />
                    <div className="spaceIcons">
                      <FontAwesomeIcon
                        icon={showPassword ? faEyeSlash : faEye}
                        className="eyeIcon"
                        onClick={() => setShowPassword(!showPassword)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="rememberAccount">
                <div className="remember">
                  <input
                    type="checkbox"
                  />
                  <p>Recordarme</p>
                </div>
                <div className="">

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}
