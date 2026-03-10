import authorize from "./auth.js";

authorize("administrador");
const token = localStorage.getItem("auth");

document.addEventListener('DOMContentLoaded', async () => {
    let userdata = {};
    let schoolTerm = {};
    let schoolTerms = {};
    let lapse = {};
    let lapses = [];
    let uploadCalificationTerms = [];
    let selectedCalificationTerms = [];
    const loader = document.createElement("loader-spinner");
    const notifications = document.getElementById("notifications");
    const schoolTermField = document.getElementById("schoolTermField");
    const lapseField = document.getElementById("lapseField");
    const startDateField = document.getElementById("startDateField");
    const endDateField = document.getElementById("endDateField");
    const periodForm = document.getElementById('periodForm');
    const successMessage = document.getElementById('successMessage');
    const btnSubmit = document.getElementById("btnSubmit");
    const schoolTermFilter = document.getElementById("schoolTermFilter");
    const lapseFilter = document.getElementById("lapseFilter");
    const startDateFilter = document.getElementById("startDateFilter");
    const endDateFilter = document.getElementById("endDateFilter");

    const today = new Date().toISOString().split("T")[0];
    const dateLimit = new Date();
    const dateMax = new Date();
    dateLimit.setDate(dateLimit.getDate() + 2);
    dateMax.setDate(dateMax.getDate() + 8);
    startDateField.value = today;
    startDateField.min = today;
    endDateField.min = dateLimit.toISOString().split("T")[0];
    endDateField.max = dateMax.toISOString().split("T")[0];

    const calcEndDateField = () => {
        const newLimitDate = new Date(startDateField.value);
        newLimitDate.setDate(newLimitDate.getDate() + 2);
        const newMaxDate = new Date(startDateField.value);
        newMaxDate.setDate(newMaxDate.getDate() + 8);
        endDateField.min = newLimitDate.toISOString().split("T")[0];
        endDateField.max = newMaxDate.toISOString().split("T")[0];
    }

    startDateField.addEventListener("change", () => {
        endDateField.value = "";
        calcEndDateField();
    });

    loader.setAttribute("title", "Cargando datos...");

    const renderCards = () => {
        const resultCounters = document.querySelectorAll(".result-counter");
        resultCounters[0].textContent = selectedCalificationTerms.length;
        resultCounters[1].textContent = uploadCalificationTerms.length;
        const historyList = document.getElementById("historyList");
        historyList.innerHTML = "";
        selectedCalificationTerms.forEach(term => {
            const card = document.createElement("article");
            card.classList.add("history-item");
            const startDate = new Date(term.PeriodoEscolar.FechaInicio);
            const endDate = new Date(term.PeriodoEscolar.FechaFin);
            card.innerHTML = `
                <div class="item-main-info">
                    <h3>Período Escolar ${startDate.getFullYear()} - ${endDate.getFullYear()}, ${term.Lapso.Numero}° lapso</h3>
                    ${term["Activo"] ? "<span class='badge active'>Activo</span>" : ""}
                </div>
                <div class="item-details">
                    <div>
                        <span class="label">Inicio</span>
                        <span class="value">${term.FechaInicio}</span>
                    </div>
                    <div>
                        <span class="label">Fin</span>
                        <span class="value">${term.FechaFin}</span>
                    </div>
                    <div>
                        <span class="label">Creado</span>
                        <span class="value">${term.FechaCreacion}</span>
                    </div>
                    ${term["Activo"] ? `<button class="icon-btn edit-btn" aria-label="Editar" data-id="${term.PeriodoCargaNotaId}">
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2"
                            fill="none">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>` : `<button class="icon-btn edit-btn" aria-label="Editar" disabled>
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2"
                            fill="none">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>`}
                </div>
            `;
            historyList.appendChild(card);

        });
        const element = document.querySelector("button.edit-btn[data-id]");
        if (element) element.addEventListener("click", () => {
            const id = element.getAttribute("data-id");
            btnSubmit.setAttribute("data-action", "update");
            const thisTerm = uploadCalificationTerms.find(t => t["Activo"]);
            startDateField.value = thisTerm.FechaInicio;
            endDateField.value = thisTerm.FechaFin;
            calcEndDateField();
            startDateField.focus();
        })
    }

    try {
        document.body.appendChild(loader);
        // Cargando datos del usuario
        const userPromise = await fetch(`${window.APP_CONFIG.api_url}/user/get`, {
            "method": "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        const userResponse = await userPromise.json();
        if (!userPromise.ok) throw new Error(userResponse.message);
        userdata = { ...userResponse };

        document.getElementById("role-text").textContent = userdata.Rol;
        document.getElementById("email-text").textContent = userdata.Email;

        // Cargando período escolar actual
        const schoolTermPromise = await fetch(`${window.APP_CONFIG.api_url}/school_term/get`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        const schoolTermResponse = await schoolTermPromise.json();
        if (!schoolTermPromise.ok) throw new Error(schoolTermResponse.message);
        schoolTerm = { ...schoolTermResponse };
        schoolTermField.value = `${new Date(schoolTerm["FechaInicio"]).getFullYear()} - ${new Date(schoolTerm["FechaFin"]).getFullYear()}`;
        schoolTermField.setAttribute("data-id", schoolTerm.id)

        // Cargando lapso actual
        const lapsePromise = await fetch(`${window.APP_CONFIG.api_url}/lapsos/list`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        const lapseResponse = await lapsePromise.json();
        if (!lapsePromise.ok) throw new Error(lapseResponse.message);
        const currentDate = new Date();
        lapse = lapseResponse.find(l => l["AñoEscolar"] === `${schoolTerm.FechaInicio.split("-")[0]}-${schoolTerm.FechaFin.split("-")[0]}` && currentDate >= new Date(l.FechaInicio) && currentDate <= new Date(l.FechaFin));
        lapses = [...lapseResponse];
        lapseField.value = `${lapse?.Numero ?? ""}° Lapso`;
        lapseField.setAttribute("data-id", lapseField.LapsoId)

        // Cargando periodos de carga
        const loadCalificationTermsPromise = await fetch(`${window.APP_CONFIG.api_url}/load-calification-term/list`, {
            "method": "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        const loadCalificationTermsResponse = await loadCalificationTermsPromise.json();
        if (!loadCalificationTermsPromise.ok) throw new Error(loadCalificationTermsResponse.message);
        uploadCalificationTerms = [...loadCalificationTermsResponse];
        selectedCalificationTerms = [...loadCalificationTermsResponse];
        renderCards();

        // Cargando períodos escolares
        const schoolTermsPromise = await fetch(`${window.APP_CONFIG.api_url}/school_term/list`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        const schoolTermsResponse = await schoolTermsPromise.json();
        if (!schoolTermsPromise.ok) throw new Error(schoolTermsResponse.message);
        schoolTerms = [...schoolTermsResponse];

        schoolTermFilter.innerHTML = "";
        schoolTerms.forEach(schoolTerm => {
            const option = document.createElement("option");
            option.value = schoolTerm.id;
            option.textContent = `${new Date(schoolTerm.FechaInicio).getFullYear()}-${new Date(schoolTerm.FechaFin).getFullYear()}`;
            schoolTermFilter.appendChild(option);
        });

        lapseFilter.innerHTML = "<option value=''>Todos</option>";
        lapses.filter(l => l["AñoEscolar"] === `${schoolTerm.FechaInicio.split("-")[0]}-${schoolTerm.FechaFin.split("-")[0]}`).forEach(lapse => {
            const option = document.createElement("option");
            option.value = lapse.id;
            option.textContent = `${lapse.Numero}° Lapso`;
            lapseFilter.appendChild(option);
        });
    } catch (Error) {
        console.error(Error.stack);
        const notification = document.createElement("notification-component");
        notification.setAttribute("type", "error");
        notification.setAttribute("message", Error.message);
        notifications.appendChild(notification);
    } finally {
        loader.remove();
    }

    if (periodForm) {
        periodForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            loader.setAttribute("title", "Guardando...");
            try {
                document.body.appendChild(loader);

                // Validaciones
                if (!startDateField.value) throw new Error("Debes especificar el inicio del período de carga de calificaciones.");
                else if (!endDateField.value) throw new Error("Debes especificar el fin del período de carga de calificaciones.");
                else if (uploadCalificationTerms.find(term => new Date(term.FechaInicio) > new Date(startDateField.value))) throw new Error("Existe un período de carga de notas más reciente activo.");

                const activeElement = uploadCalificationTerms.find(t => t["Activo"]);

                console.log(btnSubmit.getAttribute("data-action") === "update");
                const calificationTermPromise = await fetch(`${window.APP_CONFIG.api_url}/load-calification-term/save`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        "FechaInicio": startDateField.value,
                        "FechaFin": endDateField.value,
                        "LapsoId": lapse.LapsoId,
                        "PeriodoEscolarId": schoolTerm.id,
                        "PeriodoCargaNotaId": btnSubmit.getAttribute("data-action") === "update" ? activeElement.PeriodoCargaNotaId : undefined
                    })
                });

                const calificationTermResponse = await calificationTermPromise.json();
                if (!calificationTermPromise.ok) throw new Error(calificationTermResponse.message);

                const newCalificationTerm = {
                    "Activo": true,
                    "FechaCreacion": new Date().toISOString().split("T")[0],
                    "FechaInicio": startDateField.value,
                    "FechaFin": endDateField.value,
                    "Lapso": { ...lapse },
                    "PeriodoEscolar": { ...schoolTerm },
                    "PeriodoCargaNotaId": calificationTermResponse.PeriodoCargaNotaId
                };

                if (btnSubmit.getAttribute("data-action") === "update") {
                    uploadCalificationTerms[0] = newCalificationTerm;
                } else {
                    uploadCalificationTerms.unshift(newCalificationTerm);
                }
                selectedCalificationTerms = [...uploadCalificationTerms];
                endDateField.value = "";
                startDateField.value = new Date().toISOString().split("T")[0];
                renderCards();
                successMessage.classList.remove('hidden');

                setTimeout(() => {
                    successMessage.classList.add('hidden');
                }, 3000);
            } catch (Error) {
                console.error(Error.stack);
                const notification = document.createElement("notification-component");
                notification.setAttribute("type", "error");
                notification.setAttribute("text", Error.message);
                notifications.appendChild(notification);
            } finally {
                loader.remove();
            }
        });
    }

    // 2. Transición de Salida y Redirección
    const logoutBtn = document.getElementById('logoutBtn');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // Seleccionamos el body para aplicarle la animación de salida
            const body = document.body;

            // Cambiamos la clase de entrada por la de salida
            body.classList.remove('page-enter');
            body.classList.add('page-exit');

            // Esperamos que termine la animación en CSS (0.6s = 600ms)
            // antes de cambiar de página a la ruta que solicitaste.
            setTimeout(() => {
                window.location.href = '/app/admin/dashboard/';
            }, 600); // Sincronizado exacto con el tiempo de transition de CSS
        });
    }
});