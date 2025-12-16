import React from "react";
import "../styles/loadingView.css";

export default function LoadingView() {
    return (
        <div className="containerLoading">
            <img src="./ICONO-COOPI-CARGA.gif" className="iconLoading" />
            <h1 className="textLoadingIcon">Thinking...</h1>
        </div>
    )
}