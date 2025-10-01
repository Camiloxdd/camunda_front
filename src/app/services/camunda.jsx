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
            t => t.elementId === "Activity_1bncyzk" && t.state === "CREATED"
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
        // 🔹 1. Consultar todas las tareas disponibles
        let tareasRes = await fetch(`${API_BASE}/tasks/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
        });

        let tareasData = await tareasRes.json();
        console.log("Tareas recibidas desde Camunda:", tareasData);

        let tareas = tareasData.items || [];

        // 🔹 2. Buscar la PRIMERA tarea (Activity_0ezzzly)
        const coincidenciaUno = tareas.filter(
            t => t.elementId === "Activity_0ezzzly" && t.state === "CREATED"
        ).at(-1);

        if (!coincidenciaUno) {
            console.error("No hay tareas en Activity_0ezzzly");
            return;
        }

        const userTaskKeyUno = coincidenciaUno.userTaskKey;

        // 🔹 3. Completar la primera tarea
        const completeUno = await fetch(
            `${API_BASE}/tasks/${userTaskKeyUno}/complete`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    variables: {
                        mensaje: "Primera parte del segundo paso completada"
                    }
                }),
            }
        );

        if (!completeUno.ok) throw new Error("No se pudo completar la primera tarea del segundo paso");

        console.log("✅ Primera tarea completada (Activity_0ezzzly)");

        console.log("⏳ Esperando 10 segundos antes de buscar y completar la segunda tarea...");
        await delay(5000);

        // 🔹 4. VOLVER a consultar todas las tareas (porque recién se creó la segunda)
        tareasRes = await fetch(`${API_BASE}/tasks/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
        });

        tareasData = await tareasRes.json();
        console.log("Tareas después de completar la primera:", tareasData);

        tareas = tareasData.items || [];

        // 🔹 5. Buscar la SEGUNDA tarea (Activity_1t3886i)
        const coincidenciaDos = tareas.filter(
            t => t.elementId === "Activity_1t3886i" && t.state === "CREATED"
        ).at(-1);

        if (!coincidenciaDos) {
            console.error("No hay tareas en Activity_checkbox");
            return;
        }

        const userTaskKeyDos = coincidenciaDos.userTaskKey;

        const completeDos = await fetch(
            `${API_BASE}/tasks/${userTaskKeyDos}/complete`,
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
                    }
                })
            }
        );

        if (!completeDos.ok) throw new Error("No se pudo completar la segunda tarea con el checkbox");

        console.log("✅ Segunda tarea completada (Activity_checkbox)");

        console.log("⏳ Esperando 10 segundos antes de buscar y completar la segunda tarea...");
        await delay(5000);

        if (variables.sstAprobacion) {
            console.log("🔍 Se requiere aprobación SST, buscando tarea...");

            const tareasResSST = await fetch(`${API_BASE}/tasks/search`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({})
            });

            const tareasDataSST = await tareasResSST.json();
            const tareasSST = tareasDataSST.items || [];

            const coincidenciaSST = tareasSST.filter(
                t => t.elementId === "Activity_0floi22" && t.state === "CREATED"
            ).at(-1);

            if (coincidenciaSST) {
                const userTaskKeySST = coincidenciaSST.userTaskKey;

                const completeSST = await fetch(
                    `${API_BASE}/tasks/${userTaskKeySST}/complete`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            variables: {
                            }
                        })
                    }
                );

                if (!completeSST.ok) throw new Error("No se pudo completar la tarea de SST");

                console.log("✅ Tarea de SST completada");
            } else {
                console.warn("⚠ No se encontró la tarea Activity_SST, aunque se pidió SST");
            }
        } else {
            console.log("⏩ No se requiere aprobación de SST");
        }

        console.log("⏳ Esperando 10 segundos antes de buscar y completar la segunda tarea...");
        await delay(5000);

        if (variables.vobo) {
            console.log("🔍 Se requiere aprobación Gerencia Tecnologia y Proyectos, buscando tarea...");

            const tareasResSST = await fetch(`${API_BASE}/tasks/search`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({})
            });

            const tareasDataSST = await tareasResSST.json();
            const tareasSST = tareasDataSST.items || [];

            const coincidenciaSST = tareasSST.filter(
                t => t.elementId === "Activity_1y8l4of" && t.state === "CREATED"
            ).at(-1);

            if (coincidenciaSST) {
                const userTaskKeySST = coincidenciaSST.userTaskKey;

                const completeSST = await fetch(
                    `${API_BASE}/tasks/${userTaskKeySST}/complete`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            variables: {
                            }
                        })
                    }
                );

                if (!completeSST.ok) throw new Error("No se pudo completar la tarea de Gerencia Tecnologia y Proyectos");

                console.log("✅ Tarea de Gerencia Tecnologia y Proyectos completada");
            } else {
                console.warn("⚠ No se encontró la tarea Gerencia Tecnologia y Proyectos, aunque se pidió Gerencia Tecnologia y Proyectos");
            }
        } else {
            console.log("⏩ No se requiere aprobación de Gerencia Tecnologia y Proyectos");
        }
    } catch (err) {
        console.error("❌ Error en endTwoStepStartThreeStep:", err);
    }
}

export async function startThreeStep(variables) {
    try {
        if (variables.esMayor) {
            console.log("🔍 aprobando actividades de mas de 1 salario minimo, buscando tarea...");

            const tareasResSST1 = await fetch(`${API_BASE}/tasks/search`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({})
            });

            const tareasDataSST1 = await tareasResSST1.json();
            const tareasSST1 = tareasDataSST1.items || [];

            const coincidenciaSST1 = tareasSST1.filter(
                t => t.elementId === "Activity_03una7u" && t.state === "CREATED"
            ).at(-1);

            if (coincidenciaSST1) {
                const userTaskKeySST1 = coincidenciaSST1.userTaskKey;

                const completeSST1 = await fetch(
                    `${API_BASE}/tasks/${userTaskKeySST1}/complete`,
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
                            }
                        })
                    }
                );

                if (!completeSST1.ok) throw new Error("No se pudo completar la tarea de SST");

                console.log("✅ Tarea de autorizacion UNO completada");
            }
            else {
                console.warn("⚠ No se encontró la tarea Activity_SST, aunque se pidió SST");
            }

            console.log("⏳ Esperando 10 segundos antes de buscar y completar la segunda tarea...");
            await delay(5000);

            //SEGUNDO APROBAR
            console.log("🔍 aprobando actividades de mas de 1 salario minimo, buscando tarea...");

            const tareasResSST2 = await fetch(`${API_BASE}/tasks/search`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({})
            });

            const tareasDataSST2 = await tareasResSST2.json();
            const tareasSST2 = tareasDataSST2.items || [];

            const coincidenciaSST2 = tareasSST2.filter(
                t => t.elementId === "Activity_05m9ppf" && t.state === "CREATED"
            ).at(-1);

            if (coincidenciaSST2) {
                const userTaskKeySST2 = coincidenciaSST2.userTaskKey;

                const completeSST2 = await fetch(
                    `${API_BASE}/tasks/${userTaskKeySST2}/complete`,
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
                            }
                        })
                    }
                );

                if (!completeSST2.ok) throw new Error("No se pudo completar la tarea de SST");

                console.log("✅ Tarea de Autorizacion Dos completada");
            }
            else {
                console.warn("⚠ No se encontró la tarea Activity_SST, aunque se pidió SST");
            }

            console.log("⏳ Esperando 10 segundos antes de buscar y completar la segunda tarea...");
            await delay(5000);

            //TERCERA ACTIVIDAD
            console.log("🔍 aprobando actividades de mas de 1 salario minimo, buscando tarea...");

            const tareasResSST3 = await fetch(`${API_BASE}/tasks/search`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({})
            });

            const tareasDataSST3 = await tareasResSST3.json();
            const tareasSST3 = tareasDataSST3.items || [];

            const coincidenciaSST3 = tareasSST3.filter(
                t => t.elementId === "Activity_0u3zvk2" && t.state === "CREATED"
            ).at(-1);

            if (coincidenciaSST3) {
                const userTaskKeySST3 = coincidenciaSST3.userTaskKey;

                const completeSST3 = await fetch(
                    `${API_BASE}/tasks/${userTaskKeySST3}/complete`,
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
                            }
                        })
                    }
                );

                if (!completeSST3.ok) throw new Error("No se pudo completar la tarea de SST");

                console.log("✅ Tarea de Autorizacion Tres completada");
            }
            else {
                console.warn("⚠ No se encontró la tarea Activity_SST, aunque se pidió SST");
            }

            console.log("⏳ Esperando 10 segundos antes de buscar y completar la segunda tarea...");
            await delay(5000);

            //CUARTA ACTIVIDAD
            console.log("🔍 Buscando tarea 4 (Activity_1sfvf4m)...");

            const tareasResSST4 = await fetch(`${API_BASE}/tasks/search`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({})
            });

            const tareasDataSST4 = await tareasResSST4.json();
            const tareasSST4 = tareasDataSST4.items || [];

            // Buscar la primera tarea con el elementId correspondiente (sin filtrar por state)
            const coincidenciaSST4 = tareasSST4.filter(
                t => t.elementId === "Activity_1sfvf4m" && t.state === "CREATED"
            ).at(-1);

            if (coincidenciaSST4) {
                const userTaskKeySST4 = coincidenciaSST4.userTaskKey;
                console.log("✅ Encontrada tarea 4 con userTaskKey:", userTaskKeySST4);

                const completeSST4 = await fetch(
                    `${API_BASE}/tasks/${userTaskKeySST4}/complete`,
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
                            }
                        })
                    }
                );

                if (!completeSST4.ok) throw new Error("No se pudo completar la tarea 4");
                console.log("✅ Tarea de Autorización Cuatro completada");
            } else {
                console.warn("⚠ No se encontró la tarea 4 (Activity_1sfvf4m) en Camunda");
            }

        } else {
            console.log("🔍 aprobando actividades de mas de 1 salario minimo, buscando tarea...");

            const tareasResSST = await fetch(`${API_BASE}/tasks/search`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({})
            });

            const tareasDataSST = await tareasResSST.json();
            const tareasSST = tareasDataSST.items || [];

            const coincidenciaSST = tareasSST.filter(
                t => t.elementId === "Activity_03una7u" && t.state === "CREATED"
            ).at(-1);

            if (coincidenciaSST) {
                const userTaskKeySST = coincidenciaSST.userTaskKey;

                const completeSST = await fetch(
                    `${API_BASE}/tasks/${userTaskKeySST}/complete`,
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
                            }
                        })
                    }
                );

                if (!completeSST.ok) throw new Error("No se pudo completar la tarea de SST");

                console.log("✅ Tarea de SST completada");
            }
            else {
                console.warn("⚠ No se encontró la tarea Activity_SST, aunque se pidió SST");
            }

            console.log("⏳ Esperando 10 segundos antes de buscar y completar la segunda tarea...");
            await delay(10000);

            //SIGUIENTE ACTIVIDAD
            console.log("🔍 aprobando actividades de mas de 1 salario minimo, buscando tarea...");

            const tareasResSST2 = await fetch(`${API_BASE}/tasks/search`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({})
            });

            const tareasDataSST2 = await tareasResSST2.json();
            const tareasSST2 = tareasDataSST2.items || [];

            const coincidenciaSST2 = tareasSST2.filter(
                t => t.elementId === "Activity_05m9ppf" && t.state === "CREATED"
            ).at(-1);

            if (coincidenciaSST2) {
                const userTaskKeySST2 = coincidenciaSST2.userTaskKey;

                const completeSST2 = await fetch(
                    `${API_BASE}/tasks/${userTaskKeySST2}/complete`,
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
                            }
                        })
                    }
                );

                if (!completeSST2.ok) throw new Error("No se pudo completar la tarea de SST");

                console.log("✅ Tarea de SST completada");
            }
            else {
                console.warn("⚠ No se encontró la tarea Activity_SST, aunque se pidió SST");
            }
        }
    } catch (err) {
        console.error("asd:", err)
    }
}


