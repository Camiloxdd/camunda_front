"use client";
import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faKey,
  faMailBulk,
} from "@fortawesome/free-solid-svg-icons";
import { faMicrosoft } from "@fortawesome/free-brands-svg-icons";
import Link from "next/link";
import {useRouter} from "next/navigation"

export default function Dashboard() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const iniciarSesion = () =>{
    router.push('/dashboard/')
  }

  return (
    <div className=" background-img">
      <div className="login">
        <div className="background-img-left">
          <img src="/Coopidrogas.jpg" alt="Logo" className="logo" />
        </div>
        <div className="login-right">
          <div className="login-container">
            <div className="login-form">
              <div className="login-header">
                <div className="login-text">
                  <p className="login-subtitle">Bienvenido a</p>
                  <h2 className="login-title">
                    REQUISICIÓN DE COMPRA O SERVICIO
                  </h2>
                </div>
                <img
                  src="/coopidrogas_logo_mini.png"
                  alt="Logo"
                  className="logoCoopiLogin"
                />
              </div>
              <div className="papaInputs">
                <div className="inputAndIcon">
                  <FontAwesomeIcon
                    icon={faMailBulk}
                    className="iconLogin"
                    size="15px"
                  />
                  <div className="inputAndLabel">
                    <label htmlFor="username">Usuario</label>
                    <input
                      id="username"
                      name="username"
                      className="inputLogin"
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="inputAndIcon">
                  <FontAwesomeIcon icon={faKey} className="iconLogin" />
                  <div className="inputAndLabel">
                    <label htmlFor="password">Contraseña</label>
                    <div className="containerIconAndInput">
                      <input
                        id="password"
                        name="password"
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
              </div>
              <div className="rememberAccount">
                <div className="checkboxCustom">
                  <label className="cyberpunk-checkbox-label">
                    <input type="checkbox" className="cyberpunk-checkbox" />
                    Recordarme
                  </label>
                </div>
                <div className="forgoutUser">
                  <p>
                    <Link href={window} className="LinkForgot">¿Problemas para ingresar?</Link>
                  </p>
                </div>
              </div>
              <div className="buttonsLogin">
                <button onClick={iniciarSesion}>
                  <p>Iniciar Sesion</p>
                </button>
              </div>
              <div className="divider">
                <span>O</span>
              </div>
              <div className="buttonsMicrosoft">
                <button>
                  <p>Microsoft</p>
                  <FontAwesomeIcon
                    icon={faMicrosoft}
                    className="iconMicrosoft"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
