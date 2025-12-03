import react from "react";
import "../styles/newSlideBar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFile, faHome, faPlus } from "@fortawesome/free-solid-svg-icons";

export default function NewSlideBar() {
  return (
    <div className="containerSlideBar">
      <div className="containerImage">
        <img src="/coopidrogas_logo_mini.png" alt="Logo" className="logoSlideBar" />
      </div>
      <div className="spaceButtons">
        <div className="buttonsNavigation">
          <button className="buttonSlideBar">
            <FontAwesomeIcon icon={faHome} size="lg" />
          </button>
          <button className="buttonSlideBar">
            <FontAwesomeIcon icon={faFile} size="lg" />
          </button>
          <button className="buttonSlideBar">
            <FontAwesomeIcon icon={faPlus} size="lg" />
          </button>
        </div>
      </div>
    </div>
  )
}