
import React, {useState, useEffect} from "react";

export default function WelcomeTime() {
    const [mensaje, setMensaje] = useState("");

    useEffect(() =>{
        const hora = new Date().getHours();
        if(hora >= 1 && hora <12){
            setMensaje("Buen día,");
        } else if(hora >=12 && hora <18){
            setMensaje("Buenas tardes,");
        } else {
            setMensaje("Buenas noches,");
        }
    })

    return <>{mensaje}</>;
}