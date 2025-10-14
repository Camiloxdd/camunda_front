import React from "react";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import '../styles/searchBar.css'

export default function searchBar(){
    return(
        <div className="searchBar">
            <div className="inputAndIconSearch">
                <FontAwesomeIcon icon={faSearch} className="searchIcon"/>
                <input type="text" placeholder="Escribe tu consulta..."/>
            </div>
        </div>
    )
}