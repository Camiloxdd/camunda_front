import { useState } from "react";
import "../styles/Slidebar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faHome,
    faUser,
    faCloud,
    faBars,
    faTimes,
    faRightFromBracket,
    faUserGear,
    faArrowLeft,
    faArrowRight
} from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import api from "../services/axios";   

export const Sidebar = ({ onToggle }) => {
     const [isOpen, setIsOpen] = useState(false);
     const router = useRouter();
     const { permissions, logout, user } = useAuth(); // obtener user para mostrar nombre/rol

     const canSeeDashboard = Boolean(
         permissions?.isAprobador || permissions?.isComprador || permissions?.isSuperAdmin
     );
     const canSeeRequisiciones = Boolean(
         permissions?.isSolicitante || permissions?.isAprobador || permissions?.isComprador || permissions?.isSuperAdmin
     );
     const canSeeUsuarios = Boolean(permissions?.isSuperAdmin || permissions?.isSolicitante);

     const navItems = [{ icon: faHome, label: "Inicio", path: "/dashboard" }];

     if (canSeeUsuarios) {
         navItems.push({ icon: faUserGear, label: "Usuarios", path: "/usuarios" });
     }

     const handleToggle = () => {
         const newState = !isOpen;
         setIsOpen(newState);
         onToggle?.(newState); // Notifica al Dashboard
     };

     const handleNavigate = (path) => {
         router.push(path)
     }

     const handleLogout = async () => {
         try {
             const token = localStorage.getItem("token");
             if (typeof logout === "function") {
                 try { logout(); } catch (e) { /* ignore */ }
             }
             await api.post("http://localhost:8000/api/auth/logout", {
                 headers: { Authorization: `Bearer ${token}` },
             });
             router.push("/");
         } catch (err) {
             console.error("Error durante logout:", err);
             router.push("/");
         }
     }

     const isCollapsed = !isOpen;

     return (
         <aside
             className={`sidebar ${isCollapsed ? "sidebarCollapsed" : "sidebarExpanded"}`}
             aria-expanded={!isCollapsed}
         >
             {/* Toggle */}
             <button onClick={handleToggle} className="toggleButton" aria-label="Toggle sidebar">
                 <FontAwesomeIcon icon={isCollapsed ? faArrowRight : faArrowLeft} size="lg" />
             </button>

             {/* Logo / Header */}
             <div className={`logoSection ${isCollapsed ? "logoSectionCollapsed" : "logoSectionExpanded"}`}>
                <div className={`logoContainer ${isCollapsed ? "logoContainerCollapsed" : ""}`}>
                    {/* Imagen mini cuando está colapsado */}
                    {isCollapsed ? (
                        <img src="/coopidrogas_logo_mini.png" alt="Coopidrogas" className="logoImgMini" />
                    ) : (
                        // Logo grande con fondo blanco cuando está expandido
                        <div className="logoIconWhite">
                            <img src="/Logo_COOPIDROGAS.png" alt="Logo COOPIDROGAS" className="logoImgLarge" />
                        </div>
                    )}

                    {!isCollapsed && (
                        <div className="logoText">
                        </div>
                    )}
                </div>
            </div>

             {/* Navigation */}
             <nav className="nav">
                 {navItems.map((item, index) => (
                     <button
                         key={index}
                         type="button"
                         title={isCollapsed ? item.label : undefined}
                         onClick={() => handleNavigate(item.path)}
                         className={`navButton ${isCollapsed ? "navButtonCollapsed" : ""} navButtonInactive`}
                     >
                         <FontAwesomeIcon icon={item.icon} className="navIcon" />
                         {!isCollapsed && <span>{item.label}</span>}
                     </button>
                 ))}
                 {/* Opcional: otras entradas basadas en permisos */}
             </nav>

             {/* User / Footer */}
             <div className="userSection">
                 <div className={`userCard ${isCollapsed ? "userCardCollapsed" : ""}`}>
                     <div className="userAvatar">
                         <FontAwesomeIcon icon={faUser} style={{ color: "var(--textColor)" }}/>
                     </div>
                     {!isCollapsed && (
                         <div className="userDetails">
                             <div className="userInfo">
                                 <p className="userName">{user?.nombre || "Usuario"}</p>
                                 <p className="userRole">{user?.rol || user?.cargo || "—"}</p>
                             </div>
                             <button className="logoutButton" onClick={handleLogout} title="Cerrar sesión">
                                 <FontAwesomeIcon icon={faRightFromBracket} />
                             </button>
                         </div>
                     )}
                 </div>
             </div>
         </aside>
     );
 };

