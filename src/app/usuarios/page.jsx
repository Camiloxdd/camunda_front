"use client";
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { AuthProvider } from "../context/AuthContext";
import Navbar from "../components/navbar";
import { Sidebar } from "../components/Slidebar";
import "../styles/views/usuarios.css";
import "../styles/userModal.css";
import {
  faBriefcase,
  faBuilding,
  faCartShopping,
  faChevronDown,
  faLock,
  faMailBulk,
  faPencil,
  faPhone,
  faPlus,
  faSave,
  faShield,
  faStore,
  faTrash,
  faUser,
  faUserCheck,
  faUserPlus,
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
      case "dicSST":
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

  // --- NUEVAS ESTADOS: búsqueda y filtro de pestañas ---
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("todos"); // 'todos' | 'admins' | 'aprobadores' | 'solicitantes'

  // Computar lista mostrada según búsqueda y pestaña
  const displayedUsers = (userList || []).filter((u) => {
    const matchesSearch = !searchTerm.trim()
      ? true
      : (u.nombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.correo || "").toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    switch (activeFilter) {
      case "admins":
        return !!u.super_admin;
      case "aprobadores":
        return !!u.aprobador;
      case "solicitantes":
        return !!u.solicitante;
      default:
        return true;
    }
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
      const token = localStorage.getItem("token");
      const res = await api.get("/api/user/list", {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      setUserList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Error al obtener usuarios");
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
      if (editingUser) {
        await api.put(
          `/api/user/update/${editingUser.id}`,
          formData,
          { headers: { Authorization: token ? `Bearer ${token}` : "" } }
        );
        toast.success("✅ Usuario actualizado correctamente");
      } else {
        await api.post(
          `/api/user/create`,
          formData,
          { headers: { Authorization: token ? `Bearer ${token}` : "" } }
        );
        toast.success("✅ Usuario creado correctamente");
      }
      await fetchUsuarios();
      setOpenModal(false);
      setEditingUser(null);
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || err?.message || "Error en la petición";
      setError(msg);
      toast.error(`❌ ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("⚠️ ¿Seguro que deseas eliminar este usuario?")) return;

    try {
      const token = localStorage.getItem("token");
      await api.delete(`/api/user/delete/${id}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      toast.success("🗑️ Usuario eliminado correctamente");
      await fetchUsuarios();
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || err?.message || "Error al eliminar usuario";
      toast.error(`❌ ${msg}`);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar onToggle={setIsSidebarOpen} />
      <div
        style={{
          marginTop: "92px",
          flex: 1,
          transition: "margin-left 0.3s ease",
          marginLeft: isSidebarOpen ? "210px" : "80px",
          backgroundColor: "#f5f5f5",
        }}
      >
        {/* Navbar: usar left/width dinámicos para que ocupe el espacio restante y quede por debajo de overlays */}
        <div
          className="navbarDashboard"
          style={{
            left: isSidebarOpen ? "285px" : "80px",
            width: `calc(100% - ${isSidebarOpen ? 285 : 80}px)`,
            zIndex: 900,
            transition: "left 0.28s ease, width 0.28s ease",
          }}
        >
          <div className="textoNavBar">
            <h1>Gestión de Usuarios</h1>
            <p>Administra los usuarios y sus permisos</p>
          </div>
          <div className="buttonsReq">
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
                <FontAwesomeIcon icon={faUserPlus} />
                <p>
                  Nuevo Usuario
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* --- NUEVO BLOQUE: tarjetas estadísticas + barra búsqueda/pestañas --- */}
        <div style={{ padding: "16px 8px 0 8px", maxWidth: "1200px", margin: "0 auto" }}>
          <div className="stats" style={{ marginBottom: 18 }}>
            <div className="statCard">
              <div className="statLabel">Total Usuarios</div>
              <div className="statValue">{userList.length}</div>
              <div className="statTrend statTrendUp">↗ +{Math.max(0, userList.length - 21)} este mes</div>
            </div>
            <div className="statCard">
              <div className="statLabel">Administradores</div>
              <div className="statValue">{userList.filter(u => u.super_admin).length}</div>
            </div>
            <div className="statCard">
              <div className="statLabel">Aprobadores</div>
              <div className="statValue">{userList.filter(u => u.aprobador).length}</div>
            </div>
            <div className="statCard">
              <div className="statLabel">Usuarios Activos</div>
              <div className="statValue">{userList.filter(u => (u.status || u.estado) !== "inactive").length}</div>
            </div>
          </div>

          <div className="searchBar" style={{ marginBottom: 12 }}>
            <div className="searchInputWrapper">
              <FontAwesomeIcon icon={faUser} className="searchIcon" />
              <input
                className="searchInput"
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filterTabs" style={{ marginLeft: 16 }}>
              <button className={`filterTab ${activeFilter === "todos" ? "filterTabActive" : ""}`} onClick={() => setActiveFilter("todos")}>Todos</button>
              <button className={`filterTab ${activeFilter === "admins" ? "filterTabActive" : ""}`} onClick={() => setActiveFilter("admins")}>Admins</button>
              <button className={`filterTab ${activeFilter === "aprobadores" ? "filterTabActive" : ""}`} onClick={() => setActiveFilter("aprobadores")}>Aprobadores</button>
              <button className={`filterTab ${activeFilter === "solicitantes" ? "filterTabActive" : ""}`} onClick={() => setActiveFilter("solicitantes")}>Solicitantes</button>
            </div>
          </div>
        </div>
        <div className="campoTablaFondo">
          <div className="tablaGestionUsuarios">
            <div className="table">
              <div className="tableHeader">
                <div>Avatar</div>
                <div style={{ textAlign: "left" }}>Usuario</div>
                <div>Departamento</div>
                <div>Rol</div>
                <div>Estado</div>
                <div>Acciones</div>
              </div>

              <div className="tableBody">
                {loading ? (
                  <div className="tableRow placeholder">
                    <div colSpan="6">
                      <div className="loading-container-users">
                        <div className="loading-cambios">
                          <img src="/coopidrogas_logo_mini.png" className="LogoCambios" alt="Logo de carga" />
                          <p className="textLoading">Cargando usuarios...</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : error ? (
                  <div className="tableRow">
                    <div style={{ gridColumn: "1 / -1", textAlign: "center", color: "red" }}>{error}</div>
                  </div>
                ) : userList.length > 0 ? (
                  // Usar displayedUsers (aplica búsqueda y pestañas)
                  displayedUsers.map((u) => {
                    const roles = [u.aprobador && "Aprobador", u.solicitante && "Solicitante", u.comprador && "Comprador"].filter(Boolean).join(", ") || "Sin rol";
                    const initials = (u.nombre || "").split(" ").map(n => n[0]).slice(0, 2).join("");
                    return (
                      <div key={u.id || u._id || u.correo} className="tableRow">
                        <div className="avatarContainer">
                          <div className="avatar avatarAdmin">{initials}</div>
                        </div>
                        <div className="userInfo">
                          <div className="userName">{u.nombre || "—"}</div>
                          <div className="userEmail">{u.correo || "—"}</div>
                        </div>
                        <div className="departmentText">{getAreaNombre(u.area || u.department)}</div>
                        <div className="badgeEstado">
                          <div className={`roleBadge ${u.super_admin ? "roleAdmin" : (u.aprobador ? "roleApprover" : "roleRequester")}`}>
                            {u.super_admin ? "Super Admin" : roles}
                          </div>
                        </div>
                        <div className="badgeEstado">
                          <div className={`statusBadge ${u.estado === "inactive" || u.status === "inactive" ? "statusInactive" : "statusActive"}`}>
                            {(u.estado === "inactive" || u.status === "inactive") ? "Inactivo" : "Activo"}
                          </div>
                        </div>
                        <div >
                          <div className="actions">
                            <button className="actionButton" onClick={() => handleEditUser(u)} title="Editar">
                              <FontAwesomeIcon icon={faPencil} />
                            </button>
                            <button className="actionButton actionButtonDanger" onClick={() => handleDeleteUser(u.id)} title="Eliminar">
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="tableRow">
                    <div style={{ gridColumn: "1 / -1", textAlign: "center" }}>No hay usuarios registrados.</div>
                  </div>
                )}
              </div>
            </div>
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
            <h3 className="tittleOneUserNew">Información Personal</h3>
            <div className="inputsDatos">
              <div className="inputAndLabelUsersGestion">
                <div className="campoTextAndIcon">
                  <FontAwesomeIcon icon={faUser} className="iconUserCreate" />
                  <label>Nombre</label>
                </div>
                <div className="inputAndIconUserGest">
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="inputAndLabelUsersGestion">
                <div className="campoTextAndIcon">
                  <FontAwesomeIcon icon={faMailBulk} className="iconUserCreate" />
                  <label>Correo</label>
                </div>
                <div className="inputAndIconUserGest">

                  <input
                    type="text"
                    name="correo"
                    value={formData.correo}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="inputAndLabelUsersGestion">
                <div className="campoTextAndIcon">
                  <FontAwesomeIcon icon={faBriefcase} className="iconUserCreate" />
                  <label>Cargo</label>
                </div>
                <div className="inputAndIconUserGest">
                  {/* replaced custom select */}
                  <select
                    name="cargo"
                    value={selectedCargo || formData.cargo || ""}
                    onChange={(e) => handleSelectCargo(e.target.value)}
                    className="nativeSelect"
                  >
                    <option value="">Selecciona un cargo</option>
                    {options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="inputAndLabelUsersGestion">
                <div className="campoTextAndIcon">
                  <FontAwesomeIcon icon={faPhone} className="iconUserCreate" />
                  <label>Telefono</label>
                </div>
                <div className="inputAndIconUserGest">
                  <input
                    type="text"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="inputAndLabelUsersGestion">
                <div className="campoTextAndIcon">
                  <FontAwesomeIcon icon={faLock} className="iconUserCreate" />
                  <label>Contraseña</label>
                </div>
                <div className="inputAndIconUserGest">

                  <input
                    type="text"
                    name="contraseña"
                    value={formData.contraseña}
                    onChange={handleChange}
                  />
                </div>
              </div>

            </div>
            <br />
            <h3 className="tittleOneUserNew">Ubicación</h3>
            <div className="otroCampoSelects">
              <div className="inputAndLabelUsersGestion">
                <div className="campoTextAndIcon">
                  <FontAwesomeIcon icon={faStore} className="iconUserCreate" />
                  <label>Sede</label>
                </div>
                <div className="inputAndIconUserGest">
                  {/* replaced custom select */}
                  <select
                    name="sede"
                    value={selectedSede || formData.sede || ""}
                    onChange={(e) => handleSelectSede(e.target.value)}
                    className="nativeSelect"
                  >
                    <option value="">Selecciona una sede</option>
                    {optionsSede.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="inputAndLabelUsersGestion">
                <div className="campoTextAndIcon">
                  <FontAwesomeIcon icon={faBuilding} className="iconUserCreate" />
                  <label>Área</label>
                </div>
                <div className="inputAndIconUserGest">
                  {/* replaced custom select */}
                  <select
                    name="area"
                    value={selectedArea || formData.area || ""}
                    onChange={(e) => handleSelectArea(e.target.value)}
                    className="nativeSelect"
                  >
                    <option value="">Selecciona un área</option>
                    {optionsArea.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <br />
            <h3 className="tittleOneUserNew">Roles y Permisos</h3>
            <div className="selectsRoles">
              <div className="superAdmin">
                <div className="switch-container">
                  <div className="infoCardAndIcon">
                    <div className="IconCardSwitch">
                      <FontAwesomeIcon icon={faShield} />
                    </div>
                    <div className="textSwitch">
                      <span>Super Administrador</span>
                      <p>Acceso Total</p>
                    </div>
                  </div>
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
                  <div className="infoCardAndIcon">
                    <div className="IconCardSwitch">
                      <FontAwesomeIcon icon={faUserCheck} />
                    </div>
                    <div className="textSwitch">
                      <span>Aprobador</span>
                      <p>Aprobar Requisiciones</p>
                    </div>
                  </div>
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
                  <div className="infoCardAndIcon">
                    <div className="IconCardSwitch">
                      <FontAwesomeIcon icon={faUser} />
                    </div>
                    <div className="textSwitch">
                      <span>Solicitante</span>
                      <p>Crear Requisiciones</p>
                    </div>
                  </div>
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
                  <div className="infoCardAndIcon">
                    <div className="IconCardSwitch">
                      <FontAwesomeIcon icon={faCartShopping} />
                    </div>
                    <div className="textSwitch">
                      <span>Comprador</span>
                      <p>Gestionar compras</p>
                    </div>
                  </div>
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

          </div>
       
          <div className="footerButtonSave">
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
