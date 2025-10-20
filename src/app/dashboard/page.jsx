"use client";
import React, { useState, useEffect } from "react";
import { Sidebar } from "../components/Slidebar";
import Navbar from "../components/navbar";
import SearchBar from "../components/searchBar";
import ApprovalModal from "../components/ApprovalModal";
import { faFile, faFileExcel } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [requisiciones, setRequisiciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null); // para la modal

  const fetchRequisiciones = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/requisiciones/pendientes", {
        credentials: "include", // necesario para enviar cookie JWT
      });
      if (!res.ok) throw new Error("Error al obtener requisiciones");
      const data = await res.json();
      console.log("📦 Requisiciones cargadas desde backend:", data);
      setRequisiciones(Array.isArray(data) ? data : [data]);
    } catch (err) {
      console.error("❌ Error cargando requisiciones:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequisiciones();
  }, []);

  return (
    <div className="dashboard-container-requisiciones" style={{ display: "flex" }}>
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
                  <h2>{requisiciones.length}</h2>
                </div>
              </div>

              <div className="porAprobarRequisiciones">
                <div className="infoAprobarReq">
                  <p>Requisiciones por Aprobar</p>
                  <h2>
                    {requisiciones.filter((r) => r.estado_aprobacion === "pendiente").length}
                  </h2>
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
                <p>Selecciona la requisición que deseas aprobar.</p>
              </div>
              <div className="barraDeNavegacion">
                <SearchBar />
              </div>
            </div>

            <div className="listaReq">
              {loading ? (
                <p>Cargando requisiciones...</p>
              ) : requisiciones.length === 0 ? (
                <p>No tienes requisiciones pendientes por aprobar.</p>
              ) : (
                requisiciones.map((req) => (
                  <div key={req.requisicion_id} className="requisicion">
                    <div className="infoIzquierda">
                      <h3 className="tittleHeaderRequeri">{req.justificacion}</h3>
                      <p className="subTittles">
                        Creador:{" "}
                        <span className="subChiquitin">{req.nombre_solicitante}</span>
                      </p>
                      <p className="subTittles">
                        Fecha de creación:{" "}
                        <span className="subChiquitin">
                          {new Date(req.fecha).toLocaleDateString("es-ES")}
                        </span>
                      </p>
                      <p className="subTittles">
                        Estado:{" "}
                        <span className="subChiquitin">{req.estado_aprobacion}</span>
                      </p>
                      <p className="subTittles">
                        Área: <span className="subChiquitin">{req.area}</span>
                      </p>
                      <p className="subTittles">
                        Valor total:{" "}
                        <span className="subChiquitin">
                          ${req.valor_total?.toLocaleString("es-CO")}
                        </span>
                      </p>
                    </div>

                    <div className="infoDerecha">
                      <FontAwesomeIcon icon={faFileExcel} />
                      <button
                        className="buttonReqEdit"
                        onClick={() => setSelectedReq(req)} // abre modal
                      >
                        <p>Aprobar</p>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* MODAL */}
        {selectedReq && (
          <ApprovalModal
            requisicion={selectedReq}
            onClose={() => setSelectedReq(null)}
            onApproved={fetchRequisiciones} // refresca la lista al aprobar
          />
        )}
      </div>
    </div>
  );
}
