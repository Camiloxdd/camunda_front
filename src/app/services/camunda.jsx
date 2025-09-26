const API_BASE = "http://localhost:4000/api"


//INICIAR PROCESO
export async function iniciarProceso(variables){
    try{
        const res = await fetch(`${API_BASE}/process/start`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({variables})
        });

        if (!res.ok) throw new Error("Error al iniciar el proceso.");

        return await res.json();
    }catch (err) {
        console.error("Error en iniciar proceso:", err.message);
        throw err;
    }
}

