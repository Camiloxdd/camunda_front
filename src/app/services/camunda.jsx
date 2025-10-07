const API_BASE = "http://localhost:4000/api"

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

//INICIAR PROCESO
export async function iniciarProceso(variables) {
    try {
        const res = await fetch(`${API_BASE}/process/start`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ variables })
        });

        if (!res.ok) throw new Error("Error al iniciar el proceso.");

        return await res.json();
    } catch (err) {
        console.error("Error en iniciar proceso:", err.message);
        throw err;
    }
}

export async function endFirstStepStartTwoStep(variables) {
    try {
        const tareasRes = await fetch(`${API_BASE}/tasks/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
        });

        const tareasData = await tareasRes.json();
        console.log("Tareas recibidas desde Camunda:", tareasData);

        const tareas = tareasData.items || [];

        const coincidencias = tareas.filter(
            t => t.elementId === "Activity_0s4zd0u" && t.state === "CREATED"
        );
        const primerPaso = coincidencias.at(-1);

        if (!primerPaso) {
            console.error("No hay tareas en first_Step");
            return;
        }

        const userTaskKey = primerPaso.userTaskKey;

        const completeRes = await fetch(
            `http://localhost:4000/api/tasks/${userTaskKey}/complete`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    variables: {
                        ejemploVar: "paso al segundo paso"
                    }
                }),
            }
        );

        if (!completeRes.ok) throw new Error("No se pudo completar la tarea");

        console.log("Segundo paso completado correctamente");
    } catch (err) {
        console.error(err);
    }
}

export async function endTwoStepStartThreeStep(variables) {
    try {
        // 1️⃣ Buscar la tarea "Activity_0re7x0w"
        let tareasRes = await fetch(`${API_BASE}/tasks/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
        });

        let tareasData = await tareasRes.json();
        let tareas = tareasData.items || [];

        const coincidenciaUno = tareas
            .filter(t => t.elementId === "Activity_0re7x0w" && t.state === "CREATED")
            .at(-1);

        if (!coincidenciaUno) {
            console.error("⚠️ No hay tareas en Activity_0re7x0w");
            return;
        }

        const userTaskKeyUno = coincidenciaUno.userTaskKey;
        const processInstanceKey = coincidenciaUno.processInstanceKey;

        // 2️⃣ Completar primera tarea
        const completeUno = await fetch(`${API_BASE}/tasks/${userTaskKeyUno}/complete`, {
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
        });

        if (!completeUno.ok) throw new Error("No se pudo completar la primera tarea");

        console.log("✅ Primera tarea completada (Activity_0re7x0w)");

        // 3️⃣ Esperar un momento a que se generen las del multi-instance
        await delay(5000);

        //MULTI-INSTANCIA
        let tareasResTwo = await fetch(`${API_BASE}/tasks/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
        });

        let tareasDataTwo = await tareasResTwo.json();
        console.log("Tareas recibidas tras multi-instance:", tareasDataTwo);

        // 🔹 Filtrar solo las del multi-instance con el mismo processInstanceKey
        const coincidenciasMulti = tareasDataTwo.items
            .filter(t =>
                t.elementId === "Activity_0170y1s" &&
                t.state === "CREATED" &&
                t.processInstanceKey === processInstanceKey
            );

        if (coincidenciasMulti.length === 0) {
            console.error("⚠️ No hay tareas activas en el multi-instance");
            return;
        }

        console.log("✅ Tareas multi-instance encontradas:", coincidenciasMulti.map(t => t.userTaskKey));

        // 5️⃣ Completar todas las tareas encontradas
        await Promise.all(
            coincidenciasMulti.map(tareaTwo =>
                fetch(`${API_BASE}/tasks/${tareaTwo.userTaskKey}/complete`, {
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
                })
            )
        );

        console.log("✅ Todas las tareas del multi-instance completadas");
    } catch (err) {
        console.error("❌ Error en endTwoStepStartThreeStep:", err);
    }
}

export async function startThreeStep(variables) {
    try {

        // ============ DIRECTOR ============
        let tareasResDirector = await fetch(`${API_BASE}/tasks/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
        });

        let tareasDataDirector = await tareasResDirector.json();
        console.log("📌 Tareas recibidas (Director):", tareasDataDirector);

        // 🔹 Filtrar por elementId y estado, sin quemar el processInstanceKey
        const coincidenciasDirector = tareasDataDirector.items
            .filter(t =>
                t.elementId === "Activity_1q9ps8g" && // ID real del userTask Director
                t.state === "CREATED"
            );

        if (coincidenciasDirector.length === 0) {
            console.error("⚠️ No hay tareas activas del Director");
            return;
        }

        console.log("✅ Tareas de Director encontradas:", coincidenciasDirector.map(t => ({
            userTaskKey: t.userTaskKey,
            processInstanceKey: t.processInstanceKey
        })));

        await Promise.all(
            coincidenciasDirector.map(tareaDir =>
                fetch(`${API_BASE}/tasks/${tareaDir.userTaskKey}/complete`, {
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
                })
            )
        );

        console.log("🎉 Todas las tareas de Director fueron completadas");

        await delay(5000);

        // ============ GERENTE DE ÁREA ============
        let tareasResGerenteArea = await fetch(`${API_BASE}/tasks/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
        });

        let tareasDataGerenteArea = await tareasResGerenteArea.json();
        console.log("📌 Tareas recibidas (GerenteArea):", tareasDataGerenteArea);

        const coincidenciasGerenteArea = tareasDataGerenteArea.items
            .filter(t =>
                t.elementId === "Activity_0c2xslp" && // ID real del userTask Gerente
                t.state === "CREATED"
            );

        if (coincidenciasGerenteArea.length === 0) {
            console.error("⚠️ No hay tareas activas del GerenteArea");
            return;
        }

        console.log("✅ Tareas de GerenteArea encontradas:", coincidenciasGerenteArea.map(t => ({
            userTaskKey: t.userTaskKey,
            processInstanceKey: t.processInstanceKey
        })));

        await Promise.all(
            coincidenciasGerenteArea.map(tareaGerenteArea =>
                fetch(`${API_BASE}/tasks/${tareaGerenteArea.userTaskKey}/complete`, {
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
                })
            )
        );

        console.log("🎉 Todas las tareas de GerenteArea fueron completadas");

        await delay(3000);

                // ============ GERENTE DE ÁREA ============
        let tareasResGerenteAreaFinal = await fetch(`${API_BASE}/tasks/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
        });

        let tareasDataGerenteAreaFinal = await tareasResGerenteAreaFinal.json();
        console.log("📌 Tareas recibidas (GerenteArea):", tareasDataGerenteAreaFinal);

        const FinalcoincidenciasGerenteArea = tareasDataGerenteAreaFinal.items
            .filter(t =>
                t.elementId === "Activity_1gfg2b4" && // ID real del userTask Gerente
                t.state === "CREATED"
            );

        if (FinalcoincidenciasGerenteArea.length === 0) {
            console.error("⚠️ No hay tareas activas del GerenteArea");
            return;
        }

        console.log("✅ Tareas de GerenteArea encontradas:", FinalcoincidenciasGerenteArea.map(t => ({
            userTaskKey: t.userTaskKey,
            processInstanceKey: t.processInstanceKey
        })));

        await Promise.all(
            FinalcoincidenciasGerenteArea.map(tareaGerenteAreaFinal =>
                fetch(`${API_BASE}/tasks/${tareaGerenteAreaFinal.userTaskKey}/complete`, {
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
                })
            )
        );

        console.log("🎉 Todas las tareas de GerenteArea fueron completadas");

        await delay(4000);

                // ============ GERENTE DE ÁREA ============
        let tareasResGerenteAreaFinalisima = await fetch(`${API_BASE}/tasks/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
        });

        let tareasDataGerenteAreaFinalisima = await tareasResGerenteAreaFinalisima.json();
        console.log("📌 Tareas recibidas (GerenteArea):", tareasDataGerenteAreaFinal);

        const FinalisimacoincidenciasGerenteArea = tareasDataGerenteAreaFinalisima.items
            .filter(t =>
                t.elementId === "Activity_03zql95" && // ID real del userTask Gerente
                t.state === "CREATED"
            );

        if (FinalisimacoincidenciasGerenteArea.length === 0) {
            console.error("⚠️ No hay tareas activas del GerenteArea");
            return;
        }

        console.log("✅ Tareas de GerenteArea encontradas:", FinalisimacoincidenciasGerenteArea.map(t => ({
            userTaskKey: t.userTaskKey,
            processInstanceKey: t.processInstanceKey
        })));

        await Promise.all(
            FinalisimacoincidenciasGerenteArea.map(tareaGerenteAreaFinalisima =>
                fetch(`${API_BASE}/tasks/${tareaGerenteAreaFinalisima.userTaskKey}/complete`, {
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
                })
            )
        );

        console.log("🎉 Todas las tareas de GerenteArea fueron completadas");

    } catch (err) {
        console.error("❌ Error en startThreeStep:", err);
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

