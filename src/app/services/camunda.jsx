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
        const searchPayload = {
            filter: {
                state: "CREATED",
            },
            page: {
                limit: 50,
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
            .filter((t) => t.elementId === "Activity_0xnsgqx")
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


export async function startThreeStep(variables, options = {}) {
    try {
        const { role, processInstanceKey } = options || {};

        // 🟦 Mapeo rol → elementId EXACTO del BPMN
        const roleToElementId = {
            gerAdmin:    "Activity_09tpl6b",
            gerGeneral:  "Activity_07fx7j4",
            dicTYP:      "Activity_18he80t",
            gerTyC:      "Activity_0b50dmc",
            dicSST:      "Activity_18he80t",
            gerSST:      "Activity_0b50dmc",
            analistaQA:  "Activity_1l9e8gd",
            analistaCA:  "Activity_076dv9c",
        };

        // 🟦 ElementId según el rol recibido
        const elementIdForRole = role ? roleToElementId[role] : null;

        // 🟦 Payload PROPER v2 para buscar tareas
        const searchPayload = {
            filter: {
                state: "CREATED",
            },
            page: {
                limit: 50
            }
        };

        // 🔍 Buscar tareas activas
        const tareasRes = await axios.post(
            `${API_BASE}/tasks/search`,
            searchPayload,
            variables,
            {
                headers: { "Content-Type": "application/json" },
                withCredentials: true,
            }
        );

        const tareas = tareasRes.data?.items ?? [];

        // 🧠 Aplicar la misma lógica que endTwoStepStartThreeStep
        // pero filtrando por:
        //  1. rol (elementId)
        //  2. processInstanceKey
        //  3. en estado CREATED  
        let coincidencias = tareas.filter(t =>
            t.state === "CREATED" &&
            (processInstanceKey
                ? String(t.processInstanceKey) === String(processInstanceKey)
                : true) &&
            (elementIdForRole ? t.elementId === elementIdForRole : true)
        );

        if (!coincidencias.length) {
            console.warn("⚠️ No hay tareas pendientes para este rol / proceso.");
            return;
        }

        // 🟦 MISMA LÓGICA: elegir siempre la última (orden correcto)
        const tareaSeleccionada = coincidencias.at(-1);
        const userTaskKey = tareaSeleccionada.userTaskKey;

        console.log("📌 TASK SELECCIONADA startThreeStep:", {
            userTaskKey,
            elementId: tareaSeleccionada.elementId,
            processInstanceKey: tareaSeleccionada.processInstanceKey
        });

        // 🟦 Mismo payload de finalización de user-task (v2)
        const completePayload = {
            variables: variables ?? {},
            action: "complete"
        };

        console.log(variables);

        // ✔️ Completar solo ESA tarea específica
        const res = await axios.post(
            `${API_BASE}/tasks/${userTaskKey}/complete`,
            completePayload,
            {
                headers: { "Content-Type": "application/json" },
                withCredentials: true,
            }
        );

        console.log("🎉 startThreeStep → tarea completada:", res.data);

    } catch (err) {
        console.error("❌ Error en startThreeStep:", err.response?.data || err);
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

        // 🔵 Elementos de aprobación del paso "simple"
        const aprobacionesIds = [
            "Activity_18he80t",
            "Activity_0b50dmc",
            "Activity_09tpl6b",
            "Activity_07fx7j4",
        ];

        // 🔍 Payload correcto de búsqueda Camunda v2
        const searchPayload = {
            filter: {
                state: "CREATED",
            },
            page: {
                limit: 50,
            },
        };

        // 🔍 Buscar tareas
        const tareasRes = await axios.post(
            `${API_BASE}/tasks/search`,
            searchPayload,
            {
                headers: { "Content-Type": "application/json" },
                withCredentials: true,
            }
        );

        const tareas = tareasRes.data?.items ?? [];

        // 🧠 Filtrar tareas de aprobación + estado CREATED + processInstanceKey
        const coincidencias = tareas.filter(
            (t) =>
                aprobacionesIds.includes(t.elementId) &&
                t.state === "CREATED" &&
                (processInstanceKey
                    ? String(t.processInstanceKey) === String(processInstanceKey)
                    : true)
        );

        if (coincidencias.length === 0) {
            console.log("⏳ No hay tareas de aprobación pendientes (approvePendingSingle).");
            return;
        }

        // 🔵 MISMA LÓGICA: se toma la ÚLTIMA del grupo
        const tareaSeleccionada = coincidencias.at(-1);
        const userTaskKey = tareaSeleccionada.userTaskKey;

        console.log("📌 Tarea seleccionada (approvePendingSingle):", {
            userTaskKey,
            elementId: tareaSeleccionada.elementId,
            processInstanceKey: tareaSeleccionada.processInstanceKey,
        });

        console.log("Variables para completar:", variables);

        // 🟢 Payload correcto para completar (Camunda v2)
        const completePayload = {
            variables: variables ?? {},
            action: "complete",
        };

        // ✔ Completar solo la tarea correcta
        const res = await axios.post(
            `${API_BASE}/tasks/${userTaskKey}/complete`,
            completePayload,
            {
                headers: { "Content-Type": "application/json" },
                withCredentials: true,
            }
        );

        console.log("🎉 Tarea completada correctamente (approvePendingSingle):", res.data);
    } catch (err) {
        console.error("❌ Error en approvePendingSingle:", err.response?.data || err);
        throw err;
    }
}


export async function approveBuyerTask(variables = {}, options = {}) {
    try {
        const { processInstanceKey } = options || {};

        // 1. Buscar tareas desde el backend (MISMO ORDEN)
        const searchPayload = {
            filter: {
                state: "CREATED",
            },
            page: {
                limit: 50,
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

        const tareas = tareasRes.data?.items || [];

        // 2. Filtrar sólo la tarea del comprador (MISMO ORDEN)
        const coincidencias = tareas.filter(t =>
            t.elementId === "Activity_1tb4s1c" &&
            t.state === "CREATED" &&
            (processInstanceKey ? String(t.processInstanceKey) === String(processInstanceKey) : true)
        );

        if (coincidencias.length === 0) {
            console.log(
                "⏳ No se encontraron userTasks 'Activity_1tb4s1c' en estado CREATED para aprobar."
            );
            return;
        }

        console.log(
            "✅ UserTasks de comprador encontradas:",
            coincidencias.map(t => ({
                userTaskKey: t.userTaskKey,
                processInstanceKey: t.processInstanceKey,
            }))
        );

        // 3. MISMA LÓGICA NUEVA → se toma **SOLO LA ÚLTIMA**
        const tareaSeleccionada = coincidencias.at(-1);
        const userTaskKey = tareaSeleccionada.userTaskKey;

        console.log("📌 Tarea seleccionada (approveBuyerTask):", {
            userTaskKey,
            elementId: tareaSeleccionada.elementId,
            processInstanceKey: tareaSeleccionada.processInstanceKey,
        });

        // 4. Payload correcto para completar (MISMA LÓGICA NUEVA)
        const completePayload = {
            variables: variables ?? {},
            action: "complete",
        };

        // 5. Completar tarea (SOLO UNA)
        const res = await axios.post(
            `${API_BASE}/tasks/${userTaskKey}/complete`,
            completePayload,
            {
                headers: { "Content-Type": "application/json" },
                withCredentials: true,
            }
        );

        console.log("🎉 UserTask 'Activity_1tb4s1c' aprobada correctamente:", res.data);

        return {
            success: true,
            userTaskKey,
            processInstanceKey: tareaSeleccionada.processInstanceKey,
        };

    } catch (err) {
        console.error("❌ Error en approveBuyerTask:", err.response?.data || err);
        throw err;
    }
}


