import authorize from "./auth.js";

authorize("administrador");

document.addEventListener("DOMContentLoaded", () => {
  // Token de autorización
  const token = localStorage.getItem("auth");

  // Elementos
  const btnCreate = document.getElementById("btn-create");
  const notificationsContainer = document.getElementById("notifications");
  const termPreview = document.getElementById("next-period-text");
  const termContainer = document.getElementById("history-body");
  
  const startDateInput = document.getElementById("term-start-date");
  const endDateInput = document.getElementById("term-end-date");
  
  let activePeriodId = null;
  let activePeriodEndDate = null;

  const loader = document.createElement("loader-spinner");
  loader.setAttribute("title", "Cargando registros");
  document.body.appendChild(loader);

  // Fechas bloqueadas por defecto hasta que cargue la info
  startDateInput.readOnly = true;
  endDateInput.readOnly = true;
  btnCreate.disabled = true;

  // Listar todos los períodos escolares
  const dateFormat = Intl.DateTimeFormat("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour12: true,
    hour: "2-digit",
    minute: "2-digit",
    second: "numeric",
  });

  fetch(`${window.APP_CONFIG.api_url}/school_term/get_all`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => {
      if (response.status === 404) {
        const notification = document.createElement("notification-component");
        notification.setAttribute("type", "warning");
        notification.setAttribute("text", "No hay períodos escolares creados");
        notificationsContainer.appendChild(notification);
        return [];
      } else if (response.status !== 200) {
        throw "Error al cargar la lista de períodos escolares registrados";
      }

      return response.json();
    })
    .then((terms) => {
      if (!terms || terms.length === 0) {
          // No hay períodos, sugerir un período inicial basado en la fecha actual
          const today = new Date();
          const currentMonth = today.getMonth(); // 0 = Enero, ..., 6 = Julio, 7 = Agosto
          const currentYear = today.getFullYear();

          let startYear, endYear;

          if (currentMonth >= 7) { 
            startYear = currentYear;
            endYear = currentYear + 1;
          } else {
            startYear = currentYear - 1;
            endYear = currentYear;
          }

          termPreview.textContent = `${startYear} - ${endYear}`;
          startDateInput.value = `${startYear}-09-16`;
          endDateInput.value = `${endYear}-07-31`;
          startDateInput.readOnly = true;
          endDateInput.readOnly = true;
          
          btnCreate.disabled = false;
          btnCreate.textContent = `Registrar Período Inicial ${startYear} - ${endYear}`;
          btnCreate.style.backgroundColor = "";
          btnCreate.style.cursor = "pointer";
          
          return;
      }
      
      let periodAlreadyExists = false;
      let targetStartYear = null;
      let targetEndYear = null;

      terms.forEach((termItem, index) => {
        if (index === 0) {
            activePeriodId = termItem["id"] || termItem["PeriodoEscolarId"];
            activePeriodEndDate = termItem["FechaFin"];
            const activePeriodStartDate = termItem["FechaInicio"];
            
            // Lógica de Caducidad
            const currentDate = new Date();
            const expirationDate = new Date(`${activePeriodEndDate}T23:59:59`);

            if (currentDate > expirationDate) {
                // Período Caducado
                const prevStartYear = parseInt(activePeriodStartDate.split("-")[0]);
                targetStartYear = prevStartYear + 1;
                targetEndYear = targetStartYear + 1;
                
                termPreview.textContent = `${targetStartYear} - ${targetEndYear}`;
                startDateInput.value = `${targetStartYear}-09-16`;
                endDateInput.value = `${targetEndYear}-07-31`;
                
                btnCreate.disabled = false;
                btnCreate.textContent = `Registrar Período ${targetStartYear} - ${targetEndYear}`;
                btnCreate.style.backgroundColor = ""; // Default CSS class
                btnCreate.style.cursor = "pointer";
                btnCreate.title = "Abre un nuevo período escolar automáticamente.";
            } else {
                // Período Activo y vigente
                periodAlreadyExists = true;
                targetStartYear = parseInt(activePeriodStartDate.split("-")[0]);
                targetEndYear = targetStartYear + 1;

                termPreview.textContent = `${targetStartYear} - ${targetEndYear}`;
                startDateInput.value = `${targetStartYear}-09-16`;
                endDateInput.value = activePeriodEndDate;

                btnCreate.disabled = true;
                btnCreate.textContent = "Período actual ya registrado";
                btnCreate.style.backgroundColor = "#9ca3af"; // Color gris
                btnCreate.style.cursor = "not-allowed";
                btnCreate.title = "Debes esperar a que finalice este período para crear el siguiente.";
            }
        }
        
        const startDate = new Date(termItem["FechaInicio"] + "T00:00:00");
        const endDate = new Date(termItem["FechaFin"] + "T00:00:00");
        const rowPeriodText = `${startDate.getFullYear()} - ${endDate.getFullYear()}`;

        const termId = termItem["id"] || termItem["PeriodoEscolarId"];
        const item = document.createElement("tr");
        item.innerHTML = `
          <td class="font-bold">${rowPeriodText}</td>
          <td><span class="badge ${index === 0 ? "active" : "inactive"}">${
            index === 0 ? "Activo" : "Inactivo"
          }</span></td>
          <td class="text-muted">${termItem["FechaCreacion"] || 'N/A'}</td>
          <td>
            <a href="detalles_periodo.html?id=${termId}" class="btn-icon" title="Ver Detalles de Período" style="text-decoration:none;">
              👁️
            </a>
          </td>
        `;

        termContainer.appendChild(item);
      });

    })
    .catch((error) => {
      const notification = document.createElement("notification-component");
      notification.setAttribute("type", "error");
      notification.setAttribute("text", error);
      notificationsContainer.appendChild(notification);
    })
    .finally(() => {
      loader.remove();
    });

  // Crear período escolar
  const registrationTermStatus = document.createElement("notification-component");
  
  // LÓGICA DE EDICIÓN DE FECHA DE FIN
  const editEndDateBtn = document.getElementById("edit-end-date");
  const saveEndDateBtn = document.getElementById("save-end-date");
  const cancelEndDateBtn = document.getElementById("cancel-end-date");
  let tempEndDateValue = "";

  if (editEndDateBtn) {
    editEndDateBtn.addEventListener("click", () => {
      tempEndDateValue = endDateInput.value;
      endDateInput.removeAttribute("readonly");
      endDateInput.classList.remove("input-readonly");
      endDateInput.focus();

      editEndDateBtn.style.display = "none";
      saveEndDateBtn.style.display = "inline-block";
      cancelEndDateBtn.style.display = "inline-block";
    });

    cancelEndDateBtn.addEventListener("click", () => {
      endDateInput.value = tempEndDateValue;
      endDateInput.setAttribute("readonly", "true");
      endDateInput.classList.add("input-readonly");

      editEndDateBtn.style.display = "inline-block";
      saveEndDateBtn.style.display = "none";
      cancelEndDateBtn.style.display = "none";
    });

    saveEndDateBtn.addEventListener("click", async () => {
      const newEndDate = endDateInput.value;
      if (!newEndDate) {
        const notif = document.createElement("notification-component");
        notif.setAttribute("type", "warning");
        notif.setAttribute("text", "La fecha de fin original es inválida o está vacía.");
        notificationsContainer.appendChild(notif);
        return;
      }
      if (newEndDate === tempEndDateValue) {
        cancelEndDateBtn.click();
        return;
      }

      if (!activePeriodId) {
        const notif = document.createElement("notification-component");
        notif.setAttribute("type", "warning");
        notif.setAttribute("text", "No hay un período activo para editar.");
        notificationsContainer.appendChild(notif);
        return;
      }

      loader.setAttribute("title", "Actualizando fecha de fin...");
      document.body.appendChild(loader);

      try {
        const response = await fetch(`${window.APP_CONFIG.api_url}/school_term/${activePeriodId}/end_date`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ FechaFin: newEndDate })
        });

        if (!response.ok) {
          const result = await response.json();
          throw result.message || "Error al actualizar la fecha de fin";
        }

        const result = await response.json();
        
        endDateInput.setAttribute("readonly", "true");
        endDateInput.classList.add("input-readonly");
        editEndDateBtn.style.display = "inline-block";
        saveEndDateBtn.style.display = "none";
        cancelEndDateBtn.style.display = "none";
        
        tempEndDateValue = newEndDate;

        const notification = document.createElement("notification-component");
        notification.setAttribute("type", "success");
        notification.setAttribute("text", result.message || "Fecha de fin actualizada correctamente.");
        notificationsContainer.appendChild(notification);
        
        // Actualizar visualmente la tabla de historicos si es necesario
        // En este caso, solo recargamos la página después de un pequeño delay
        setTimeout(() => window.location.reload(), 1500);
      } catch (error) {
        const notification = document.createElement("notification-component");
        notification.setAttribute("type", "error");
        notification.setAttribute("text", error);
        notificationsContainer.appendChild(notification);
      } finally {
        loader.remove();
      }
    });
  }

  btnCreate.addEventListener("click", () => {
    // Si el botón fue deshabilitado por el código anterior, salir de la función
    if (btnCreate.disabled) return;

    if (!startDateInput.value || !endDateInput.value) {
        alert("Ocurrió un error leyendo las fechas predeterminadas.");
        return;
    }

    const sYear = startDateInput.value.split('-')[0];
    const eYear = endDateInput.value.split('-')[0];

    const confirmation = confirm(
      `¿Seguro que quieres crear el período escolar ${sYear} - ${eYear} (del 16 de Septiembre al 31 de Julio)?`
    );

    if (!confirmation) return;
    
    // Deshabilitar botón durante el proceso para evitar doble clic
    btnCreate.disabled = true;
    
    loader.setAttribute("title", "Registrando nuevo período escolar...");
    document.body.appendChild(loader);

    fetch(`${window.APP_CONFIG.api_url}/school_term/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        FechaInicio: startDateInput.value,
        FechaFin: endDateInput.value,
        Capacidad: 30, 
      }),
    })
      .then(async (response) => {
        if (response.status === 409 || response.status === 400) {
            const errorData = await response.json();
            throw errorData.message || "No puedes registrar un período que ya existe o tiene fechas inválidas.";
        }
        else if (response.status !== 201)
          throw "Error al crear el período escolar";
          
        const lastActive = document.querySelector(".active");
        if (lastActive) {
          lastActive.classList.replace("active", "inactive");
          lastActive.textContent = "Inactivo";
        }
        registrationTermStatus.setAttribute("type", "success");

        const newSchoolTermElement = document.createElement("tr");
        newSchoolTermElement.innerHTML = `
          <td class="font-bold">${sYear} - ${eYear}</td>
          <td><span class="badge active">Activo</span></td>
          <td class="text-muted">${dateFormat.format(new Date())}</td>
        `;

        registrationTermStatus.setAttribute(
          "text",
          "Nuevo período escolar registrado correctamente"
        );

        termContainer.insertBefore(
          newSchoolTermElement,
          termContainer.firstElementChild,
        );

        // Bloquear el botón permanentemente después del éxito
        btnCreate.textContent = "Período actual ya registrado";
        btnCreate.style.backgroundColor = "#9ca3af"; 
        btnCreate.style.cursor = "not-allowed";

      })
      .catch((error) => {
        console.log(error);
        btnCreate.disabled = false; // Reactivar en caso de error
        registrationTermStatus.setAttribute("type", "error");
        registrationTermStatus.setAttribute("text", error);
      })
      .finally(() => {
        loader.remove();
        notificationsContainer.appendChild(registrationTermStatus);
      });
  });
});