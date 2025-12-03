import React, { useState, useEffect } from "react";
import "../styles/userModal.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";

const Modal = ({ open, onClose, title, children }) => {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!open) setClosing(false);
  }, [open]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      onClose();
      setClosing(false);
    }, 300);
  };

  if (!open && !closing) return null;

  return (
    <div
      className={`modal-overlay ${closing ? "fadeOut" : "fadeIn"}`}
      onClick={handleClose}
    >
      <div
        className={`modal-container-user ${closing ? "slideDown" : "slideUp"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="headerUserModal">
          <div className="leftInfoUser">
            <div className="iconUser">
              <FontAwesomeIcon icon={faUser} />
            </div>
            <div className="textUser">
              <h2>Nuevo Usuario</h2>
              <p>Completa los campos para crear un nuevo usuario</p>
            </div>
          </div>
          <button className="btn-close" onClick={handleClose}>
            X
          </button>
        </div>
        <div className="modal-content-user">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
