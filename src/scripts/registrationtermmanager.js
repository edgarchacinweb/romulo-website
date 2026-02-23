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

  const loader = document.createElement("loader-spinner");
  loader.setAttribute("title", "Cargando registros");
  document.body.appendChild(loader);

  // --- LÓGICA CORREGIDA DE CÁLCULO DE AÑO ESCOLAR ---
  const today = new Date();
  const currentMonth = today.getMonth(); // 0 = Enero, ..., 6 = Julio, 7 = Agosto
  const currentYear = today.getFullYear();

  let startYear, endYear;

  // Si estamos en Agosto (7) o meses posteriores, ya pasó el 31 de julio.
  // Por lo tanto, NO se permite crear para el año pasado, inicia el año actual.
  if (currentMonth >= 7) { 
    startYear = currentYear;
    endYear = currentYear + 1;
  } else {
    // Si estamos entre enero y julio (0 a 6), el periodo que se crea pertenece
    // al ciclo que inició el año anterior.
    startYear = currentYear - 1;
    endYear = currentYear;
  }

  // Fijar fechas bloqueadas
  startDateInput.value = `${startYear}-09-16`;
  startDateInput.readOnly = true;

  endDateInput.value = `${endYear}-07-31`;
  endDateInput.readOnly = true;

  termPreview.textContent = `${startYear} - ${endYear}`;

  // NOTA: Se eliminó el eventListener 'change' de endDateInput porque
  // el usuario ya no puede modificar las fechas.
  // ----------------------------------------

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
        return;
      } else if (response.status !== 200) {
        throw "Error al cargar la lista de períodos escolares registrados";
      }

      return response.json();
    })
    .then((terms) => {
      if (!terms) return;
      terms.forEach((termItem, index) => {
        const item = document.createElement("tr");
        const startDate = new Date(termItem["FechaInicio"]);
        const endDate = new Date(termItem["FechaFin"]);

        item.innerHTML = `
          <td class="font-bold">${startDate.getFullYear()} - ${endDate.getFullYear()}</td>
          <td><span class="badge ${index === 0 ? "active" : "inactive"}">${
            index === 0 ? "Activo" : "Inactivo"
          }</span></td>
          <td class="text-muted">${termItem["FechaCreacion"] || 'N/A'}</td>
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
  
  btnCreate.addEventListener("click", () => {
    // Validar que tengamos ambas fechas antes de continuar
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
    
    loader.setAttribute("title", "Registrando nuevo período escolar...");
    document.body.appendChild(loader);

    // Enviar las fechas reales al backend
    fetch(`${window.APP_CONFIG.api_url}/school_term/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        FechaInicio: startDateInput.value,
        FechaFin: endDateInput.value,
        Capacidad: 30, // Dejamos la capacidad fija en 30 como estaba antes
      }),
    })
      .then((response) => {
        if (response.status === 409)
          throw "No puedes volver a registrar un período escolar que ya existe";
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
      })
      .catch((error) => {
        console.log(error);
        registrationTermStatus.setAttribute("type", "error");
        registrationTermStatus.setAttribute("text", error);
      })
      .finally(() => {
        loader.remove();
        notificationsContainer.appendChild(registrationTermStatus);
      });
  });
});