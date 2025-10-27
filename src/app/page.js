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
import { useRouter } from "next/navigation"

export default function Dashboard() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const iniciarSesion = () => {
    router.push('/dashboard/')
  }

  async function handleLogIn(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`http://localhost:4000/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', 
        body: JSON.stringify({ correo, contraseña })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Login failed');
        setLoading(false);
        return;
      }

      router.push('/dashboard'); 
    } catch (err) {
      console.error(err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
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
                  <p className="login-subtitle">Bienvenido a la</p>
                  <h2 className="login-title">
                    SOLICITUD DE REQUISICIÓN
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
                      required
                      value={correo}
                      onChange={e => setCorreo(e.target.value)}
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
                        required
                        value={contraseña}
                        onChange={e => setContraseña(e.target.value)}
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
                    <Link href={"/dashboard"} className="LinkForgot">¿No puedes ingresar?</Link>
                  </p>
                </div>
              </div>
              <div className="buttonsLogin">
                <button onClick={handleLogIn}>
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
