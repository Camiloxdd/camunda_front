import api from "../services/axios";
import axios from "../services/axios";
const API_BASE = "http://localhost:8000/api"

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

//INICIAR PROCESO
export async function iniciarProceso(variables) {
    try {
        const res = await axios.post(
            `${API_BASE}/process/start`,
            { variables },
            {
                headers: {
                    "Content-Type": "application/json",
                },
                withCredentials: true
            }
        );

        if (res.status !== 200) throw new Error("Error al iniciar el proceso.");

        const data = res.data;

        const processInstanceKey = data.processInstanceKey;

        localStorage.setItem("processInstanceKey", processInstanceKey);

        console.log("Proceso iniciado con processInstanceKey:", processInstanceKey);

        return data;
    } catch (err) {
        console.error("Error en iniciar proceso:", err.message);
        throw err;
    }
}

export async function endFirstStepStartTwoStep(variables = {}) {
    try {
        // 1. BODY correcto para /v2/user-tasks/search
        const searchPayload = {
            filter: {
                state: "CREATED",
            },
            page: {
                limit: 50,
                // after: "cursor..."  // opcional
            },
        };

        const tareasRes = await axios.post(
            `${API_BASE}/tasks/search`,
            searchPayload,
            {
                headers: { "Content-Type": "application/json" },
                withCredentials: true,
            }
        );

        const tareas = tareasRes.data?.items ?? [];

        const primerPaso = tareas
            .filter((t) => t.elementId === "Activity_1tsfyvb")
            .at(-1);

        if (!primerPaso) {
            console.warn("⏭️ No hay tareas pendientes en este paso. Ya fue completada.");
            return;
        }

        const userTaskKey = primerPaso.userTaskKey;

        // 2. BODY correcto para completar una Camunda user task (v2)
        const completePayload = {
            variables: variables ?? {},   // objeto plano de variables
            // action es opcional, pero soportado para describir el outcome
            action: "complete",
        };

        const res = await axios.post(
            `${API_BASE}/tasks/${userTaskKey}/complete`,
            completePayload,
            {
                headers: { "Content-Type": "application/json" },
                withCredentials: true,
            }
        );

        console.log("✔️ Tarea completada correctamente:", res.data);
    } catch (err) {
        console.error("❌ Error en endFirstStepStartTwoStep:", err.response?.data || err);
        throw err;
    }
}

export async function endTwoStepStartThreeStep(variables) {
    try {
        let tareasRes = await api.post(`${API_BASE}/tasks/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
        });

        let tareasData = await tareasRes.json();
        let tareas = tareasData.items || [];

        const coincidenciaUno = tareas
            .filter(t => t.elementId === "Activity_1nws0d8" && t.state === "CREATED")
            .at(-1);

        if (!coincidenciaUno) {
            console.error("⚠️ No hay tareas en Activity_1nws0d8");
            return;
        }

        const userTaskKeyUno = coincidenciaUno.userTaskKey;

        const completeUno = await fetch(`${API_BASE}/tasks/${userTaskKeyUno}/complete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ variables })
        });

        if (!completeUno.ok) throw new Error("No se pudo completar la tarea");

        console.log("✅ Tarea completada con éxito (Activity_1nws0d8)");
    } catch (err) {
        console.error("❌ Error en endTwoStepStartThreeStep:", err);
    }
}


export async function startThreeStep(variables, options = {}) {
    try {
        const { role, processInstanceKey } = options || {};

        // Mapea cargos/roles a elementId(s) en el proceso BPMN
        const roleToElementId = {
            // Ajusta estas claves según tus cargos reales
            gerAdmin: "Activity_00mm8pt",
            gerGeneral: "Activity_1fpwffg",
            dicTYP: "Activity_08exhj3",
            gerTyC: "Activity_1msgoom",
            dicSST: "Activity_08exhj3",
            gerSST: "Activity_1msgoom",
            analistaQA: "Activity_1l9e8gd",
            analistaQA: "Activity_076dv9c",
        };

        const elementIdForRole = role ? roleToElementId[role] : null;

        // Buscar tareas (backend devuelve todas las tareas; filtramos localmente)
        const tareasRes = await fetch(`${API_BASE}/tasks/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
        });

        const tareasData = await tareasRes.json();
        const tareas = tareasData.items || [];

        // Filtrar por estado CREATED, por processInstanceKey (si viene) y por elementId (si se pudo mapear)
        const coincidencias = tareas.filter(t =>
            t.state === "CREATED" &&
            (processInstanceKey ? String(t.processInstanceKey) === String(processInstanceKey) : true) &&
            (elementIdForRole ? t.elementId === elementIdForRole : true)
        );

        if (coincidencias.length === 0) {
            console.log("⚠️ No se encontraron userTasks para completar (startThreeStep) - revisar role/processInstanceKey");
            return;
        }

        console.log("✅ UserTasks a completar (startThreeStep):", coincidencias.map(t => ({ userTaskKey: t.userTaskKey, elementId: t.elementId, processInstanceKey: t.processInstanceKey })));

        await Promise.all(
            coincidencias.map(tarea =>
                fetch(`${API_BASE}/tasks/${tarea.userTaskKey}/complete`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ variables })
                })
            )
        );

        console.log("🎉 Tareas completadas por rol/proceso (startThreeStep).");
    } catch (err) {
        console.error("❌ Error en startThreeStep:", err);
        throw err;
    }
}

export async function EndFourStep(variables) {
    try {
        const aprobacionesIds = ["Activity_1mpfix0", "Activity_05mekco"];

        const tareasCompletadas = new Set();
        let pendientes = new Set();

        while (true) {
            console.log("\n🔄 Buscando nuevas tareas de aprobación...");

            let tareasRes = await fetch(`${API_BASE}/tasks/search`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({})
            });

            let tareasData = await tareasRes.json();
            let tareas = tareasData.items || [];

            // Filtrar solo las que son de aprobación y están en CREATED
            const coincidencias = tareas.filter(
                t =>
                    aprobacionesIds.includes(t.elementId) &&
                    t.state === "CREATED" &&
                    !tareasCompletadas.has(t.userTaskKey)
            );

            // Agregar esas tareas al set de pendientes
            coincidencias.forEach(t => pendientes.add(t.elementId));

            if (pendientes.size === 0) {
                console.log("⏳ No hay tareas de aprobación, saliendo...");
                break; // si no hay ninguna, no tiene sentido esperar
            }

            if (coincidencias.length === 0) {
                console.log("⏳ No hay nuevas tareas todavía, esperando...");
                await new Promise(resolve => setTimeout(resolve, 2000));
                continue;
            }

            console.log(
                "✅ Nuevas tareas encontradas:",
                coincidencias.map(t => ({
                    userTaskKey: t.userTaskKey,
                    elementId: t.elementId,
                    processInstanceKey: t.processInstanceKey
                }))
            );

            await Promise.all(
                coincidencias.map(async tarea => {
                    try {
                        let res = await fetch(
                            `${API_BASE}/tasks/${tarea.userTaskKey}/complete`,
                            {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    variables: {
                                        siExiste: variables.siExiste,
                                        purchaseTecnology: variables.purchaseTecnology,
                                        sstAprobacion: variables.sstAprobacion,
                                        vobo: variables.vobo,
                                        purchaseAprobated: variables.purchaseAprobated,
                                        esMayor: variables.esMayor,
                                        purchaseAprobatedTecnology: variables.purchaseAprobatedTecnology,
                                        purchaseAprobatedErgonomic: variables.purchaseAprobatedErgonomic,
                                        filas: variables.filas,
                                    }
                                })
                            }
                        );

                        if (!res.ok) throw new Error(`Error HTTP ${res.status}`);

                        console.log(`🎯 Tarea ${tarea.elementId} completada`);
                        tareasCompletadas.add(tarea.userTaskKey);
                        pendientes.delete(tarea.elementId); // quitar de pendientes
                    } catch (err) {
                        console.error(
                            `❌ Error al completar ${tarea.elementId}:`,
                            err.message
                        );
                    }
                })
            );

            // 👌 Si ya no queda nada pendiente, salir
            if (pendientes.size === 0) {
                console.log("🏁 Todas las aprobaciones finalizadas.");
                break;
            }
        }
    } catch (err) {
        console.error("❌ Error en EndFourStep:", err);
    }
}


export async function approvePendingSingle(variables, options = {}) {
    try {
        const { processInstanceKey } = options || {};
        const aprobacionesIds = ["Activity_08exhj3", "Activity_1msgoom", "Activity_00mm8pt", "Activity_1fpwffg"]; // ajustar ids según proceso

        const tareasRes = await fetch(`${API_BASE}/tasks/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
        });

        const tareasData = await tareasRes.json();
        const tareas = tareasData.items || [];

        const coincidencias = tareas.filter(
            t =>
                aprobacionesIds.includes(t.elementId) &&
                t.state === "CREATED" &&
                (processInstanceKey ? String(t.processInstanceKey) === String(processInstanceKey) : true)
        );

        if (coincidencias.length === 0) {
            console.log("⏳ No hay tareas de aprobación pendientes (one-step) para el proceso indicado.");
            return;
        }

        console.log("✅ Tareas pendientes encontradas (one-step):", coincidencias.map(t => ({ userTaskKey: t.userTaskKey, elementId: t.elementId })));

        await Promise.all(
            coincidencias.map(tarea =>
                fetch(`${API_BASE}/tasks/${tarea.userTaskKey}/complete`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ variables })
                })
            )
        );

        console.log("🎉 Todas las tareas pendientes fueron completadas (one-step).");
    } catch (err) {
        console.error("❌ Error en approvePendingSingle:", err);
        throw err;
    }
}

export async function approveBuyerTask(variables = {}, options = {}) {
    try {
        const { processInstanceKey } = options || {};

        // Buscar tareas desde el backend
        const tareasRes = await fetch(`${API_BASE}/tasks/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}) // no enviamos filtros por defecto; backend devuelve listado de user-tasks
        });

        const tareasData = await tareasRes.json();
        const tareas = tareasData.items || [];

        // Filtrar sólo las userTasks del comprador (elementId especificado) y que estén en estado CREATED
        const coincidencias = tareas.filter(t =>
            t.elementId === "Activity_19kdsft" &&
            t.state === "CREATED" &&
            (processInstanceKey ? String(t.processInstanceKey) === String(processInstanceKey) : true)
        );

        if (coincidencias.length === 0) {
            console.log("⏳ No se encontraron userTasks 'Activity_19kdsft' en estado CREATED para aprobar.");
            return;
        }

        console.log("✅ UserTasks de comprador encontradas:", coincidencias.map(t => ({ userTaskKey: t.userTaskKey, processInstanceKey: t.processInstanceKey })));

        await Promise.all(
            coincidencias.map(tarea =>
                fetch(`${API_BASE}/tasks/${tarea.userTaskKey}/complete`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ variables })
                })
            )
        );

        console.log("🎉 UserTask(s) 'Activity_19kdsft' aprobada(s) correctamente.");
    } catch (err) {
        console.error("❌ Error en approveBuyerTask:", err);
        throw err;
    }
}

