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
import api from "./services/axios";
import { toast } from "react-toastify";
import LoadingLogin from "./components/loadingLogin";

export default function Dashboard() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleLogIn(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post(`/api/auth/login`, {
        email: correo,
        password: contraseña
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const data = res.data;
      localStorage.setItem('token', data.token);

      toast.success("Sesión iniciada correctamente", {
        position: "top-right",
        autoClose: 1800,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        progress: undefined,
        theme: "colored",
      });

      setTimeout(() => {
        router.push('/dashboard');
      }, 1800);
    } catch (err) {
      console.error(err);
      if (err.response) {
        setError(err.response.data.message || 'Credenciales inválidas');
      } else {
        setError('Error de conexión con el servidor');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className=" background-img">
      <div className="login-container">
        <div className="login-form">
          <div className="login-header">
            <div className="login-text">
              <p className="login-subtitle">Bienvenido a la</p>
              <h2 className="login-title">
                SOLICITUD DE REQUISICIÓN DE COMPRAS
              </h2>
            </div>
            <img
              src="/coopidrogas_logo_mini.png"
              alt="Logo"
              className="logoCoopiLogin"
            />
          </div>
          <form className="papaInputs" onSubmit={handleLogIn}>
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
                  disabled={loading}
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
                    disabled={loading}
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
            {error && (
              <div style={{ color: "#dc2626", margin: "8px 0", fontWeight: "bold", textAlign: "center" }}>
                {error}
              </div>
            )}
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
              <button type="submit" disabled={loading} style={{ position: "relative", minHeight: 22 }}>
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "50%" }}>
                    <LoadingLogin />
                  </span>
                ) : (
                  <p>Iniciar Sesion</p>
                )}
              </button>
            </div>
          </form>
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

      <div className="background-img-left">
        <img src="/Coopidrogas.jpg" alt="Logo" className="logo" />
      </div>
    </div>
  );
}
