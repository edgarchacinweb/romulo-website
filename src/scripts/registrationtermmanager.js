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
  const loader = document.createElement("loader-spinner");
  loader.setAttribute("title", "Cargando registros");
  document.body.appendChild(loader);

  const currentDate = new Date().getFullYear();
  termPreview.textContent = `${currentDate} - ${currentDate + 1}`;

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
        // console.log(termItem);
        const item = document.createElement("tr");
        const startDate = new Date(termItem["FechaInicio"]);
        const endDate = new Date(termItem["FechaFin"]);
        console.log(startDate, endDate);
        console.log(termItem["FechaCreacion"]);

        item.innerHTML = `
          <td class="font-bold">${startDate.getFullYear()} - ${endDate.getFullYear()}</td>
          <td><span class="badge ${index === 0 ? "active" : "inactive"}">${
            index === 0 ? "Activo" : "Inactivo"
          }</span></td>
          <td class="text-muted">${termItem["FechaCreacion"]}</td>
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

  // Crear período de inscripción
  const registrationTermStatus = document.createElement(
    "notification-component",
  );
  loader.setAttribute("title", "Registrando nuevo período escolar...");

  btnCreate.addEventListener("click", () => {
    const confirmation = confirm(
      "¿Seguro que quieres crear este período escolar?",
    );

    if (!confirmation) return;
    document.body.appendChild(loader);

    fetch(`${window.APP_CONFIG.api_url}/school_term/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        FechaInicio: `${currentDate}-01-02`,
        FechaFin: `${currentDate + 1}-01-02`,
        Capacidad: 30,
      }),
    })
      .then((response) => {
        if (response.status === 409)
          throw "No puedes volver a registrar un período escolar que ya existe";
        else if (response.status !== 201)
          throw "Error al crear el período escolar";
        const lastActive = document.querySelector(".active");
        lastActive.classList.replace("active", "inactive");
        lastActive.textContent = "Inactivo";
        registrationTermStatus.setAttribute("type", "success");

        const newSchoolTermElement = document.createElement("tr");
        newSchoolTermElement.innerHTML = `
          <td class="font-bold">${currentDate} - ${currentDate + 1}</td>
          <td><span class="badge active">Activo</span></td>
          <td class="text-muted">${dateFormat.format(new Date())}</td>
        `;

        registrationTermStatus.setAttribute(
          "text",
          "Nuevo período escolar registrado correctamente",
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
