import React, { useState, useEffect, useRef } from "react";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import '../styles/searchBar.css'

export default function searchBar({ onQueryChange, placeholder = "Escribe tu consulta..." }) {
	const [value, setValue] = useState("");
	const callbackRef = useRef(onQueryChange);

	// mantener referencia actualizada del callback sin forzar re-ejecución del efecto principal
	useEffect(() => {
		callbackRef.current = onQueryChange;
	}, [onQueryChange]);

	// debounce: sólo depende de 'value' (no de la función)
	useEffect(() => {
		const t = setTimeout(() => {
			const cb = callbackRef.current;
			if (typeof cb === "function") cb(value);
		}, 400);
		return () => clearTimeout(t);
	}, [value]);

	return (
		<div className="searchBar">
			<div className="inputAndIconSearch">
				<FontAwesomeIcon icon={faSearch} className="searchIcon" />
				<input
					type="text"
					placeholder={placeholder}
					value={value}
					onChange={(e) => setValue(e.target.value)}
				/>
			</div>
		</div>
	);
}