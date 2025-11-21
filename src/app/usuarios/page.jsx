"use client";
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { AuthProvider } from "../context/AuthContext";
import Navbar from "../components/navbar";
import { Sidebar } from "../components/Slidebar";
import "../styles/views/usuarios.css";
import {
  faBriefcase,
  faBuilding,
  faChevronDown,
  faLock,
  faMailBulk,
  faPencil,
  faPhone,
  faPlus,
  faSave,
  faStore,
  faTrash,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import UserModal from "../components/userModal";
import api from "../services/axios";

function UsuariosInner() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selectedCargo, setSelectedCargo] = useState("");
  const [selectedArea, setSelectedArea] = useState(false);
  const [isOpenCargo, setIsOpenCargo] = useState(false);
  const [isOpenArea, setIsOpenArea] = useState(false);
  const [selectedSede, setSelectedSede] = useState("");
  const [isOpenSede, setIsOpenSede] = useState(false);
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  const [token, setToken] = useState(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const t = localStorage.getItem("token");
      setToken(t);

      if (!t) {
        setUser(null);
      }
    }
  }, []);

  const options = [
    { value: "dicTYP", label: "Director Tecnologia y Proyectos" },
    { value: "dicSST", label: "Director SST" },
    { value: "gerTyC", label: "Gerente Tecnologia y Proyectos" },
    { value: "gerSST", label: "Gerente SST" },
    { value: "gerAdmin", label: "Gerente Administrativo" },
    { value: "gerGeneral", label: "Gerente General" },
    { value: "analistaQA", label: "Analista Requerimientos y QA" },
    { value: "CoordiDevWeb", label: "Coordinador Desarrollo Web" },
  ];

  const optionsArea = [
    { value: "TyP", label: "Tecnologia y Proyectos" },
    { value: "SST", label: "Seguridad y Salud en el Trabajo" },
    { value: "GerenciaAdmin", label: "Gerencia Adminsitrativa" },
    { value: "GerenciaGeneral", label: "Gerencia General" },
  ];

  const optionsSede = [
    { value: "cota", label: "Cota" },
    { value: "medellin", label: "Medellin" },
    { value: "bucaramanga", label: "Bucaramanga" },
    { value: "barranquilla", label: "Barranquilla" },
    { value: "pereira", label: "Pereira" },
    { value: "cali", label: "Cali" },
  ];

  const handleSelectCargo = (value) => {
    setSelectedCargo(value);
    setFormData({
      ...formData,
      cargo: value,
    });
    setIsOpenCargo(false);
  };

  const handleSelectArea = (value) => {
    setSelectedArea(value);
    setFormData({
      ...formData,
      area: value,
    });
    setIsOpenArea(false);
  };

  const handleSelectSede = (value) => {
    setSelectedSede(value);
    setFormData({
      ...formData,
      sede: value,
    });
    setIsOpenSede(false);
  };

  const getCargoNombre = (cargo) => {
    switch (cargo) {
      case "managerGeneral":
        return "Gerente General";
      case "managerAdmin":
        return "Gerente Administrativo";
      case "managerAreaTyc":
        return "Gerente de Área Tecnologia y Proyectos";
      case "managerAreaSST":
        return "Gerente de Área SST";
      case "dicLeaderAreaTyC":
        return "Director / Líder de Área Tec y Proyectos";
      case "dicLeaderAreaSST":
        return "Director / Líder de SST";
      case "CoordiDevWeb":
        return "Coordinador Desarrollo Web";
      case "analistaQA":
        return "Analista Requerimientos y QA";
      case "gerAdmin":
        return "Gerente Administrativo";
      case "gerGeneral":
        return "Gerente General";
      case "dicTYP":
        return "Director Tecnologia y Proyectos";
      case "gerTyC":
        return "Gerente Tecnologia y Proyectos";
      default:
        return cargo || "Usuario";
    }
  };

  const getSedeNombre = (sede) => {
    switch (sede) {
      case "cota":
        return "Cota";
    }
  };

  const getAreaNombre = (area) => {
    switch (area) {
      case "TyP":
        return "Tecnologia y Proyectos";
      case "SST":
        return "Seguridad y Salud en el Trabajo";
      case "GerenciaAdmin":
        return "Gerencia Adminsitrativa";
      case "GerenciaGeneral":
        return "Gerencia General";
    }
  };

  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    cargo: "",
    telefono: "",
    sede: "",
    area: "",
    contraseña: "",
    super_admin: false,
    aprobador: false,
    solicitante: false,
    comprador: false,
  });

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      nombre: user.nombre || "",
      correo: user.correo || "",
      cargo: user.cargo || "",
      telefono: user.telefono || "",
      sede: user.sede || "",
      area: user.area || "",
      contraseña: "",
      super_admin: !!user.super_admin,
      aprobador: !!user.aprobador,
      solicitante: !!user.solicitante,
      comprador: !!user.comprador,
    });

    setSelectedCargo(user.cargo);
    setSelectedArea(user.area);
    setSelectedSede(user.sede);

    setOpenModal(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked,
    });
  };

  const fetchUsuarios = async () => {
    try {
      setLoading(true);

      const res = await api.get("/api/user/list");
      setUserList(Array.isArray(res.data) ? res.data : [res.data]);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleSaveUser = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const url = editingUser
        ? `http://localhost:4000/api/user/update/${editingUser.id}`
        : "http://localhost:4000/api/user/create";

      const method = editingUser ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Error al guardar el usuario");

      toast.success(
        editingUser
          ? "✅ Usuario actualizado correctamente"
          : "✅ Usuario creado correctamente"
      );

      await fetchUsuarios();
      setOpenModal(false);
      setEditingUser(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
      toast.error(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("⚠️ ¿Seguro que deseas eliminar este usuario?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:4000/api/user/delete/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!res.ok) throw new Error("Error al eliminar el usuario");

      toast.success("🗑️ Usuario eliminado correctamente");
      await fetchUsuarios();
    } catch (err) {
      console.error(err);
      toast.error(`❌ ${err.message}`);
    }
  };

  return (
    <div style={{ display: "flex" }}>
      <Navbar />
      <Sidebar onToggle={setIsSidebarOpen} />
      <div
        style={{
          marginTop: "100px",
          flex: 1,
          transition: "margin-left 0.3s ease",
          marginLeft: isSidebarOpen ? "210px" : "80px",
        }}
      >
        <div className="headerUsers">
          <div className="infoHeaderUsers">
            <h2>Gestion de Usuarios</h2>
            <p>Agrega, modifica o elimina el usuario que sea necesario.</p>
          </div>
          <div className="newUserButton">
            <button
              onClick={() => {
                setEditingUser(null);
                setFormData({
                  nombre: "",
                  correo: "",
                  cargo: "",
                  telefono: "",
                  sede: "",
                  area: "",
                  contraseña: "",
                  super_admin: false,
                  aprobador: false,
                  solicitante: false,
                  comprador: false,
                });
                setSelectedCargo("");
                setSelectedArea("");
                setSelectedSede("");
                setOpenModal(true);
              }}
            >
              <p>
                <FontAwesomeIcon icon={faPlus} />
              </p>
            </button>
          </div>
        </div>
        <div className="tablaGestionUsuarios">
          <div className="tableGestUsers">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Cargo</th>
                  <th>Area</th>
                  <th>Sede</th>
                  <th>Super Admin</th>
                  <th>Rol Requisicion</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center" }}>
                      Cargando usuarios...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", color: "red" }}>
                      {error}
                    </td>
                  </tr>
                ) : userList.length > 0 ? (
                  userList.map((user) => (
                    <tr key={user.id || user._id || user.correo}>
                      <td>{user.nombre}</td>
                      <td>{user.correo}</td>
                      <td>{getCargoNombre(user.cargo)}</td>
                      <td>{getAreaNombre(user.area)}</td>
                      <td>{getSedeNombre(user.sede)}</td>
                      <td>{user.super_admin ? "Sí" : "No"}</td>
                      <td>
                        {[
                          user.aprobador && "Aprobador",
                          user.solicitante && "Solicitante",
                          user.comprador && "Comprador",
                        ]
                          .filter(Boolean)
                          .join(", ") || "Sin rol"}
                      </td>

                      <td>
                        <div className="spaceButtonsGestUsers">
                          <button onClick={() => handleEditUser(user)}>
                            <FontAwesomeIcon
                              icon={faPencil}
                              className="iconEditUser"
                            />
                          </button>
                          <button onClick={() => handleDeleteUser(user.id)}>
                            <FontAwesomeIcon
                              icon={faTrash}
                              className="iconDeleteUser"
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center" }}>
                      No hay usuarios registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <UserModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setEditingUser(null);
          setFormData({
            nombre: "",
            correo: "",
            cargo: "",
            telefono: "",
            sede: "",
            area: "",
            contraseña: "",
            super_admin: false,
            aprobador: false,
            solicitante: false,
            comprador: false,
          });
        }}
      >
        <div className="papaContainerUserModal">
          <div className="infoGestionUser">
            <div className="inputsDatos">
              <div className="inputAndLabelUsersGestion">
                <label>Nombre</label>
                <div className="inputAndIconUserGest">
                  <FontAwesomeIcon icon={faUser} className="icon" />
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="inputAndLabelUsersGestion">
                <label>Correo</label>
                <div className="inputAndIconUserGest">
                  <FontAwesomeIcon icon={faMailBulk} className="icon" />
                  <input
                    type="text"
                    name="correo"
                    value={formData.correo}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="inputAndLabelUsersGestion">
                <label>Cargo</label>
                <div className="inputAndIconUserGest">
                  <FontAwesomeIcon icon={faBriefcase} className="icon" />
                  <div className="custom-select-container">
                    <div
                      className={`custom-select ${isOpenCargo ? "open" : ""}`}
                      onClick={() => setIsOpenCargo(!isOpenCargo)}
                    >
                      <span>
                        {selectedCargo
                          ? options.find((opt) => opt.value === selectedCargo)?.label
                          : "Selecciona un cargo"}
                      </span>
                      <FontAwesomeIcon
                        icon={faChevronDown}
                        className={`arrow ${isOpenCargo ? "rotate" : ""}`}
                      />
                    </div>

                    {isOpenCargo && (
                      <ul className="custom-options">
                        {options.map((opt) => (
                          <li
                            key={opt.value}
                            className={`option ${selectedCargo === opt.value ? "selected" : ""
                              }`}
                            onClick={() => handleSelectCargo(opt.value)}
                          >
                            {opt.label}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
              <div className="inputAndLabelUsersGestion">
                <label>Telefono</label>
                <div className="inputAndIconUserGest">
                  <FontAwesomeIcon icon={faPhone} className="icon" />
                  <input
                    type="text"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="inputAndLabelUsersGestion">
                <label>Contraseña</label>
                <div className="inputAndIconUserGest">
                  <FontAwesomeIcon icon={faLock} className="icon" />
                  <input
                    type="text"
                    name="contraseña"
                    value={formData.contraseña}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="inputAndLabelUsersGestion">
                <label>Sede</label>
                <div className="inputAndIconUserGest">
                  <FontAwesomeIcon icon={faStore} className="icon" />
                  <div className="custom-select-container">
                    <div
                      className={`custom-select ${isOpenSede ? "open" : ""}`}
                      onClick={() => setIsOpenSede(!isOpenSede)}
                    >
                      <span>
                        {selectedSede
                          ? optionsSede.find((opt) => opt.value === selectedSede)?.label
                          : "Selecciona una sede"}
                      </span>
                      <FontAwesomeIcon
                        icon={faChevronDown}
                        className={`arrow ${isOpenSede ? "rotate" : ""}`}
                      />
                    </div>

                    {isOpenSede && (
                      <ul className="custom-options">
                        {optionsSede.map((opt) => (
                          <li
                            key={opt.value}
                            className={`option ${selectedSede === opt.value ? "selected" : ""
                              }`}
                            onClick={() => handleSelectSede(opt.value)}
                          >
                            {opt.label}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
              <div className="inputAndLabelUsersGestion">
                <label>Área</label>
                <div className="inputAndIconUserGest">
                  <FontAwesomeIcon icon={faBuilding} className="icon" />
                  <div className="custom-select-container">
                    <div
                      className={`custom-select ${isOpenArea ? "open" : ""}`}
                      onClick={() => setIsOpenArea(!isOpenArea)}
                    >
                      <span>
                        {selectedArea
                          ? optionsArea.find((opt) => opt.value === selectedArea)?.label
                          : "Selecciona un área"}
                      </span>
                      <FontAwesomeIcon
                        icon={faChevronDown}
                        className={`arrow ${isOpenArea ? "rotate" : ""}`}
                      />
                    </div>

                    {isOpenArea && (
                      <ul className="custom-options">
                        {optionsArea.map((opt) => (
                          <li
                            key={opt.value}
                            className={`option ${selectedArea === opt.value ? "selected" : ""
                              }`}
                            onClick={() => handleSelectArea(opt.value)}
                          >
                            {opt.label}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="selectsRoles">
              <div className="superAdmin">
                <div className="switch-container">
                  <span>Super Administrador</span>
                  <label className="switch">
                    <input
                      type="checkbox"
                      name="super_admin"
                      checked={formData.super_admin}
                      onChange={handleCheckboxChange}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              <div className="superAdmin">
                <div className="switch-container">
                  <span>Aprobador</span>
                  <label className="switch">
                    <input
                      type="checkbox"
                      name="aprobador"
                      checked={formData.aprobador}
                      onChange={handleCheckboxChange}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              <div className="superAdmin">
                <div className="switch-container">
                  <span>Solicitante</span>
                  <label className="switch">
                    <input
                      type="checkbox"
                      name="solicitante"
                      checked={formData.solicitante}
                      onChange={handleCheckboxChange}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              <div className="superAdmin">
                <div className="switch-container">
                  <span>Comprador</span>
                  <label className="switch">
                    <input
                      type="checkbox"
                      name="comprador"
                      checked={formData.comprador}
                      onChange={handleCheckboxChange}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>
            <button className="saveUsersReq" onClick={handleSaveUser}>
              <p>
                <FontAwesomeIcon icon={faSave} /> Guardar
              </p>
            </button>
          </div>
        </div>
      </UserModal>
    </div>
  );
}

export default function Usuarios() {
  return (
    <AuthProvider>
      <UsuariosInner />
    </AuthProvider>
  );
}
