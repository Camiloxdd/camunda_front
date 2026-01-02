import { useState, useEffect } from "react";
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
    faArrowRight,
    faClipboard
} from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import api from "../services/axios";
import { usePathname } from "next/navigation";

export const Sidebar = ({ onToggle }) => {
    const [isHovered, setIsHovered] = useState(false);
    const router = useRouter();
    const { permissions, logout, user } = useAuth();

    const canSeeDashboard = Boolean(
        permissions?.isAprobador || permissions?.isComprador || permissions?.isSuperAdmin
    );
    const canSeeRequisiciones = Boolean(
        permissions?.isSolicitante || permissions?.isAprobador || permissions?.isComprador || permissions?.isSuperAdmin
    );
    const canSeeUsuarios = Boolean(permissions?.isSuperAdmin || permissions?.isSolicitante);

    const navItems = [{ icon: faHome, label: "Inicio", path: "/dashboard" }];
    if (canSeeUsuarios) {
        navItems.push({ icon: faClipboard, label: "Requisiciones", path: "/requisicion" });
        navItems.push({ icon: faUserGear, label: "Usuarios", path: "/usuarios" });
    } else if (canSeeDashboard) {
        navItems.push({ icon: faClipboard, label: "Requisiciones", path: "/requisicion" });
    }

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

    const isCollapsed = !isHovered;

    // Sincroniza el estado expandido/collapsed con el padre
    useEffect(() => {
        if (typeof onToggle === "function") {
            onToggle(!isCollapsed);
        }
    }, [isCollapsed, onToggle]);

    const getCargoNombre = (cargo) => {
        switch (cargo) {
            case "managerGeneral":
                return "Gerente General";
            case "managerAdmin":
                return "Gerente Administrativo";
            case "managerAreaTyc":
                return "Gerente de Área Tecnología y Proyectos";
            case "gerSST":
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
                return "Director Tecnología y Proyectos";
            case "gerTyC":
                return "Gerente Tecnología y Proyectos";
            default:
                return cargo || "Usuario";
        }
    };

    const pathname = usePathname();

    return (
        <aside
            className={`sidebar ${isCollapsed ? "sidebarCollapsed" : "sidebarExpanded"}`}
            aria-expanded={!isCollapsed}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={`logoSection ${isCollapsed ? "logoSectionCollapsed" : "logoSectionExpanded"}`}>
                <div className={`logoContainer ${isCollapsed ? "logoContainerCollapsed" : ""}`}>
                    {/* Imagen mini cuando está colapsado */}
                    {isCollapsed ? (
                        <img src="/coopidrogas_logo_mini.png" alt="Coopidrogas" className="logoImgMini" />
                    ) : (
                        // Logo grande con fondo blanco cuando está expandido
                        <div>
                            <img src="/Logo_COOPIDROGAS.png" alt="Logo COOPIDROGAS" className="logoImgMini" />
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
                        className={`navButton 
                            ${isCollapsed ? "navButtonCollapsed" : ""} 
                            ${pathname === item.path ? "navButtonActive" : "navButtonInactive"}
                        `}
                    >
                        <FontAwesomeIcon icon={item.icon} className="navIcon" />
                        {!isCollapsed && <span>{item.label}</span>}
                    </button>
                ))}
                {/* Opcional: otras entradas basadas en permisos */}
            </nav>

        </aside>
    );
};

