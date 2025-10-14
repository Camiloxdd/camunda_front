"use client";
import React, { useState } from "react";
import Navbar from "../components/navbar";
import { Sidebar } from "../components/Slidebar";
import "../styles/views/usuarios.css";
import {
  faBriefcase,
  faBuilding,
  faMailBulk,
  faPencil,
  faPhone,
  faSave,
  faStore,
  faTrash,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import UserModal from "../components/userModal";

export default function Usuarios() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openModal, setOpenModal] = useState(false);

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
          <h2>Gestion de Requisiciones</h2>
          <p>Agrega, modifica o elimina la requisicion que sea necesaria.</p>
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
          <div className="infoGestionUser">
            <div className="inputsDatos">
              <div className="inputAndLabelUsersGestion">
                <label>Nombre</label>
                <div className="inputAndIconUserGest">
                  <FontAwesomeIcon icon={faUser} className="icon" />
                  <input type="text" />
                </div>
              </div>
              <div className="inputAndLabelUsersGestion">
                <label>Correo</label>
                <div className="inputAndIconUserGest">
                  <FontAwesomeIcon icon={faMailBulk} className="icon" />
                  <input type="text" />
                </div>
              </div>
              <div className="inputAndLabelUsersGestion">
                <label>Cargo</label>
                <div className="inputAndIconUserGest">
                  <FontAwesomeIcon icon={faBriefcase} className="icon" />
                  <input type="text" />
                </div>
              </div>
              <div className="inputAndLabelUsersGestion">
                <label>Telefono</label>
                <div className="inputAndIconUserGest">
                  <FontAwesomeIcon icon={faPhone} className="icon" />
                  <input type="text" />
                </div>
              </div>
              <div className="inputAndLabelUsersGestion">
                <label>Area</label>
                <div className="inputAndIconUserGest">
                  <FontAwesomeIcon icon={faBuilding} className="icon" />
                  <input type="text" />
                </div>
              </div>
              <div className="inputAndLabelUsersGestion">
                <label>Sede</label>
                <div className="inputAndIconUserGest">
                  <FontAwesomeIcon icon={faStore} className="icon" />
                  <input type="text" />
                </div>
              </div>
            </div>
            <div className="selectsRoles">
              <div className="superAdmin">
                <div className="switch-container">
                  <span>Super Administrador</span>
                  <label className="switch">
                    <input type="checkbox" />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
              <div className="superAdmin">
                <div className="switch-container">
                  <span>Administrador</span>
                  <label className="switch">
                    <input type="checkbox" />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
              <div className="superAdmin">
                <div className="switch-container">
                  <span>Solicitante</span>
                  <label className="switch">
                    <input type="checkbox" />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
              <div className="superAdmin">
                <div className="switch-container">
                  <span>Comprador</span>
                  <label className="switch">
                    <input type="checkbox" />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>
            <button className="saveUsersReq">
                <p><FontAwesomeIcon icon={faSave}/> Guardar</p>
            </button>
          </div>
        </div>
      </UserModal>
    </div>
  );
}
