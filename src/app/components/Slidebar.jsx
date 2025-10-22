import { useState } from "react";
import "../styles/Slidebar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faHome,
    faLock,
    faUser,
    faWrench,
    faCloud,
    faEnvelope,
    faCog,
    faBars,
    faTimes,
    faFile,
    faRightFromBracket
} from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export const Sidebar = ({ onToggle }) => {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const { permissions, logout } = useAuth(); // usar permisos y posible logout del contexto

    // Reglas solicitadas:
    // - aprobador true  => puede ver /dashboard y /requisiciones
    // - solicitante true => solo /requisiciones
    // - comprador true   => /dashboard y /requisiciones
    // - super_admin     => todo
    const canSeeDashboard = Boolean(
        permissions?.isAprobador || permissions?.isComprador || permissions?.isSuperAdmin
    );
    const canSeeRequisiciones = Boolean(
        permissions?.isSolicitante || permissions?.isAprobador || permissions?.isComprador || permissions?.isSuperAdmin
    );
    const canSeeUsuarios = Boolean(permissions?.isSuperAdmin);

    // construir navItems dinámicamente según permisos
    const navItems = [{ icon: faHome, label: "Inicio", path: "/dashboard" }]; // inicio siempre visible (puedes cambiar)

    if (canSeeDashboard && !navItems.find(i => i.path === "/dashboard")) {
        // dashboard ya incluido como "Inicio" por defecto, si prefieres camino distinto puedes ajustar
        // aquí lo dejamos consistente: Inicio -> /dashboard
    }

    if (canSeeRequisiciones) {
        navItems.push({ icon: faFile, label: "Requisiciones", path: "/requisiciones" });
    }
    if (canSeeUsuarios) {
        navItems.push({ icon: faUser, label: "Usuarios", path: "/usuarios" });
    }

    const handleToggle = () => {
        const newState = !isOpen;
        setIsOpen(newState);
        onToggle?.(newState); // Notifica al Dashboard solo si se pasó la prop
    };

    const handleNavigate = (path) => {
        router.push(path)
    }

    const handleLogout = async () => {
        try {
            // si el contexto provee logout, ejecutarlo
            if (typeof logout === "function") {
                try { logout(); } catch (e) { /* ignore */ }
            }

            // informar al backend para borrar cookie/session
            await fetch("http://localhost:4000/api/auth/logout", {
                method: "POST",
                credentials: "include",
            });

            // redirigir al login (ajusta ruta si tu app usa otra)
            router.push("/");
        } catch (err) {
            console.error("Error durante logout:", err);
            router.push("/");
        }
    }

    return (
        <section className="page sidebar-9-page">
            <aside className={`sidebar-9 ${isOpen ? "open" : ""}`}>
                <div className="inner">
                    <header className="headerSidebar">
                        <button
                            type="button"
                            className="sidebar-9-burger"
                            onClick={handleToggle}
                        >
                            <FontAwesomeIcon icon={isOpen ? faTimes : faBars} size="lg" />
                        </button>
                    </header>

                    <nav>
                        {navItems.map((item, index) => (
                            <button key={index} type="button" title={item.label} onClick={() => handleNavigate(item.path)}>
                                <FontAwesomeIcon icon={item.icon} size="lg" />
                                {isOpen && <p>{item.label}</p>}
                            </button>
                            
                        ))}
                            <button type="button" className="logoutBtn" onClick={handleLogout} title="Cerrar sesión">
                                <FontAwesomeIcon icon={faRightFromBracket} size="lg" />
                                {isOpen && <p>Cerrar sesión</p>}
                            </button>
                    </nav>

                    {/* Footer: botón de cerrar sesión */}

                </div>
            </aside>
        </section>
    );
};

