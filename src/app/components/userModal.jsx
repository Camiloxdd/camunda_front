import React, { useState, useEffect } from "react";
import "../styles/userModal.css";

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
        className={`modal-container ${closing ? "slideDown" : "slideUp"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="headerUserModal">
            <h2>Gestion de usuario nuevo</h2>
            <button className="btn-close" onClick={handleClose}>
              X
            </button>
        </div>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
