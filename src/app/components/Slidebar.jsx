import { useState } from "react"
import logo from "/Logo_COOPIDROGAS.png"

const navItems = ["Inicio", "Requicisiones"];

export default function Slidebar (){
    const [isOpen, setIsOpen] = useState(false);

    return(
        <aside className={'slidebar ${isOpen ?  "open" :}a '}>

        </aside>
    )
}