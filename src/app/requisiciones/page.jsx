"use client";
import React, { useState } from "react";
import Navbar from "../components/navbar";
import { Sidebar } from "../components/Slidebar";
import "../styles/views/requisiciones.css";
import {
  faBriefcase,
  faBuilding,
  faFileExcel,
  faFilePdf,
  faMailBulk,
  faPencil,
  faPhone,
  faPlus,
  faRefresh,
  faSave,
  faStore,
  faTrash,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import UserModal from "../components/userModal";
import { useRouter } from "next/navigation";
import WizardModal from "../components/modalNewReq";

export default function Usuarios() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <div style={{ display: "flex" }}>
      <Navbar />
      <WizardModal open={open} onClose={() => setOpen(false)} />
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
          <div className="headerInfoRequisiciones">
            <h2>Gestion de Requisiciones</h2>
            <p>Agrega, modifica o elimina la requisicion que sea necesaria.</p>
          </div>
          <div className="buttonsRequisiciones">
            <button>
              <FontAwesomeIcon icon={faRefresh}/>
            </button>
            <button>
              <FontAwesomeIcon icon={faPlus} onClick={()=> setOpen(true)}/>
            </button>
          </div>
        </div>
        <div className="tablaGestionUsuarios">
          <div className="tableGestUsers">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Cargo</th>
                  <th>Area</th>
                  <th>Sede</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>
                    <input type="text" readOnly />
                  </td>
                  <td>
                    <input type="text" readOnly />
                  </td>
                  <td>
                    <input type="text" readOnly />
                  </td>
                  <td>
                    <input type="text" readOnly />
                  </td>
                  <td>
                    <input type="text" readOnly />
                  </td>
                  <td>
                    <div className="spaceButtonsGestUsers">
                      <button>
                        <FontAwesomeIcon
                          icon={faPencil}
                          className="iconEditUser"
                          onClick={() => setOpenModal(true)}
                        />
                      </button>
                      <span></span>
                      <button>
                        <FontAwesomeIcon
                          icon={faTrash}
                          className="iconDeleteUser"
                        />
                      </button>
                      <span></span>
                      <button>
                        <FontAwesomeIcon
                          icon={faFileExcel}
                          className="iconDownloadExcel"
                        />
                      </button>
                      <span></span>
                      <button>
                        <FontAwesomeIcon
                          icon={faFilePdf}
                          className="iconDownloadPdf"
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <UserModal open={openModal} onClose={() => setOpenModal(false)}>
        <div className="papaContainerUserModal">
          <button className="saveUsersReq">
            <p>
              <FontAwesomeIcon icon={faSave} /> Guardar
            </p>
          </button>
        </div>
      </UserModal>
    </div>
  );
}
