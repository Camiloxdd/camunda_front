"use client";
import React, { useState } from "react";
import { Sidebar } from "../components/Slidebar";
import Navbar from "../components/navbar";
import SearchBar from "../components/searchBar";
import ApprovalModal from "../components/modalAprobations";
import { faFile, faFileExcel } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div
      className="dashboard-container-requisiciones"
      style={{ display: "flex" }}
    >
      <Sidebar onToggle={setIsSidebarOpen} />
      <div
        className="dashboard-content"
        style={{
          flex: 1,
          transition: "margin-left 0.3s ease",
          marginLeft: isSidebarOpen ? "210px" : "80px",
        }}
      >
        <Navbar />
        <div className="containerOneDashboard">
          <div className="firstContainerDash">
            <div className="infoGeneralUserDash">
              <h2>Dashboard</h2>
              <p>Revisa si tienes requisiciones pendientes por aprobar.</p>
            </div>
            <div className="porcents">
              <div className="totalRequisiciones">
                <div className="iconTotalReq">
                  <FontAwesomeIcon icon={faFile} />
                </div>
                <div className="infoTotalReq">
                  <p>Requisiciones Totales</p>
                  <h2>1654</h2>
                </div>
              </div>
              <div className="porAprobarRequisiciones">
                <div className="infoAprobarReq">
                  <p>Requisiciones por Aprobar</p>
                  <h2>50</h2>
                </div>
                <div className="iconAprobarReq">
                  <FontAwesomeIcon icon={faFileExcel} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="secondContainerDash">
          <div className="containerTwoDash">
            <div className="papaHeaderRequi">
              <div className="headerListReq">
                <h2>Lista de Requisiciones por Aprobar</h2>
                <p>Selecciona la requisicion que deseas aprobar.</p>
              </div>
              <div className="barraDeNavegacion">
                <SearchBar />
              </div>
            </div>

            <div className="listaReq">
              <div className="requisicion">
                <div className="infoIzquierda">
                  <h3 className="tittleHeaderRequeri">Nombre Archivo</h3>
                  <p className="subTittles">
                    Creador:{" "}
                    <span className="subChiquitin">Juan Camilo Bello Roa</span>
                  </p>
                  <p className="subTittles">
                    Fecha de creacion:{" "}
                    <span className="subChiquitin">14/10/2025</span>
                  </p>
                  <p className="subTittles">
                    Status: <span className="subChiquitin">Aprobado</span>
                  </p>
                </div>
                <div className="infoDerecha">
                  <FontAwesomeIcon icon={faFileExcel} />
                  <button className="buttonReqEdit">
                    <p>Aprobar</p>
                  </button>
                </div>
              </div>
              <div className="requisicion">
                <div className="infoIzquierda">
                  <h3 className="tittleHeaderRequeri">Nombre Archivo</h3>
                  <p className="subTittles">
                    Creador:{" "}
                    <span className="subChiquitin">Juan Camilo Bello Roa</span>
                  </p>
                  <p className="subTittles">
                    Fecha de creacion:{" "}
                    <span className="subChiquitin">14/10/2025</span>
                  </p>
                  <p className="subTittles">
                    Status: <span className="subChiquitin">Aprobado</span>
                  </p>
                </div>
                <div className="infoDerecha">
                  <FontAwesomeIcon icon={faFileExcel} />
                  <button className="buttonReqEdit">
                    <p>Aprobar</p>
                  </button>
                </div>
              </div>
              <div className="requisicion">
                <div className="infoIzquierda">
                  <h3 className="tittleHeaderRequeri">Nombre Archivo</h3>
                  <p className="subTittles">
                    Creador:{" "}
                    <span className="subChiquitin">Juan Camilo Bello Roa</span>
                  </p>
                  <p className="subTittles">
                    Fecha de creacion:{" "}
                    <span className="subChiquitin">14/10/2025</span>
                  </p>
                  <p className="subTittles">
                    Status: <span className="subChiquitin">Aprobado</span>
                  </p>
                </div>
                <div className="infoDerecha">
                  <FontAwesomeIcon icon={faFileExcel} />
                  <button className="buttonReqEdit">
                    <p>Aprobar</p>
                  </button>
                </div>
              </div>
              <div className="requisicion">
                <div className="infoIzquierda">
                  <h3 className="tittleHeaderRequeri">Nombre Archivo</h3>
                  <p className="subTittles">
                    Creador:{" "}
                    <span className="subChiquitin">Juan Camilo Bello Roa</span>
                  </p>
                  <p className="subTittles">
                    Fecha de creacion:{" "}
                    <span className="subChiquitin">14/10/2025</span>
                  </p>
                  <p className="subTittles">
                    Status: <span className="subChiquitin">Aprobado</span>
                  </p>
                </div>
                <div className="infoDerecha">
                  <FontAwesomeIcon icon={faFileExcel} />
                  <button className="buttonReqEdit">
                    <p>Aprobar</p>
                  </button>
                </div>
              </div>
              <ApprovalModal
                userRole="managerGeneral"
                userArea="Dirección SST"
                documentData={{ nombre: "Solicitud de compra de equipos" }}
              />

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
