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
} from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";

export const Sidebar = ({ onToggle }) => {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    const navItems = [
        { icon: faHome, label: "Inicio", path: "/dashboard" },
        { icon: faUser, label: "Usuarios", path: "/usuarios" },
        { icon: faFile, label: "Requisiciones", path: "/requisiciones" },
    ];

    const handleToggle = () => {
        const newState = !isOpen;
        setIsOpen(newState);
        onToggle?.(newState); // Notifica al Dashboard solo si se pasó la prop
    };

    const handleNavigate = (path) =>{
        router.push(path)
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
                    </nav>
                </div>
            </aside>
        </section>
    );
};

