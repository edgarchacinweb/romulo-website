import authorize from "./auth.js";

authorize("administrador");

document.addEventListener("DOMContentLoaded", async () => {
  // Token de autorización
  const token = localStorage.getItem("auth");

  // Elementos
  const loader = document.createElement("loader-spinner");
  const loadNotification = document.createElement("notification-component");
  const loadNotificationContainer = document.getElementById("notifications");
  const registrationEntry = document.getElementById("period-name");
  const tableBody = document.getElementById("table-body");
  const schoolTermBtn = document.getElementById("add-school-term-btn");
  const startDateEntry = document.getElementById("start-date");
  const endDateEntry = document.getElementById("end-date");
  let schoolTerms = [];
  let registrationId = null;
  let schoolTermYear = null;

  // Cargar período escolar
  loader.setAttribute("title", "Cargando Período escolar...");
  document.body.appendChild(loader);
  try {
    const response = await fetch(
      `${window.APP_CONFIG.api_url}/school_term/get`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (response.status === 404) {
      alert("Debes registrar primero un período escolar");
      window.location.href = "/app/admin/dashboard/";
    } else if (response.status !== 200) {
      throw new Error(data.msg);
    }

    registrationId = data.id;
    schoolTermYear = new Date(data["FechaInicio"]).getFullYear();
    registrationEntry.value = `Período ${schoolTermYear} - ${
      schoolTermYear + 1
    }`;
  } catch (error) {
    loadNotification.setAttribute("type", "error");
    loadNotification.setAttribute("text", error);
    loadNotificationContainer.appendChild(loadNotification);
  }

  // Obtener todos los períodos de inscripción
  try {
    const response = await fetch(
      `${window.APP_CONFIG.api_url}/registration/list`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    let data = await response.json();

    if (response.status === 404) {
      data = [];
    } else if (response.status !== 200) {
      throw new Error(data.msg);
    }

    schoolTerms = data;
    data.forEach((e) => {
      const item = document.createElement("tr");
      const schoolTermYear = new Date(
        e["PeriodoEscolar"]["FechaInicio"]
      ).getFullYear();
      item.innerHTML = `
        <td class="font-medium">${schoolTermYear} - ${schoolTermYear + 1}</td>
        <td>${e["Inicio"]}</td>
        <td>${e["Fin"]}</td>
        <td class="text-muted">${e["FechaCreacion"]}</td>
      `;

      tableBody.appendChild(item);
    });
  } catch (error) {
    console.log(error);
  }

  loader.remove();

  // Agregar un nuevo período de inscripción
  schoolTermBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const notification = document.createElement("notification-component");
    try {
      const startDate = startDateEntry.value;
      const endDate = endDateEntry.value;
      const startEntryDate = new Date(startDate);
      const endEntryDate = new Date(endDate);

      startEntryDate.setHours(0, 0, 0, 0);
      endEntryDate.setHours(0, 0, 0, 0);

      if (!startDate || !endDate)
        throw new Error("Debes rellenar ambos campos primero");
      else if (startEntryDate > endEntryDate) {
        throw new Error(
          "La fecha de inicio no puede ser posterior a la fecha de fin."
        );
      }

      const hasOverlap = schoolTerms.some((term) => {
        const termStart = new Date(term["Inicio"]);
        const termEnd = new Date(term["Fin"]);
        const start = new Date(startEntryDate);
        const end = new Date(endEntryDate);

        // Comparar solo fechas (ignorando horas)
        const normalize = (date) => date.toISOString().split("T")[0];

        const tStart = normalize(termStart);
        const tEnd = normalize(termEnd);
        const sDate = normalize(start);
        const eDate = normalize(end);

        // Los rangos se solapan si no se cumple:
        // (nuevo_fin < existente_inicio) o (nuevo_inicio > existente_fin)
        return tStart >= sDate && tEnd <= eDate;
      });

      if (hasOverlap) {
        throw new Error(
          "Las fechas seleccionadas chocan con un periodo existente."
        );
      }

      const response = await fetch(
        `${window.APP_CONFIG.api_url}/registration/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            FechaInicio: startDate,
            FechaFin: endDate,
          }),
        }
      );

      const data = await response.json();

      if (response.status !== 201) throw new Error(data);

      const dateFormat = Intl.DateTimeFormat("es-VE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour12: true,
        hour: "2-digit",
        minute: "2-digit",
        second: "numeric",
      });

      const registrationElement = document.createElement("tr");
      registrationElement.innerHTML = `
                <td class="font-medium">${schoolTermYear} - ${
        schoolTermYear + 1
      }</td>
        <td>${startDate}</td>
        <td>${endDate}</td>
        <td class="text-muted">${dateFormat.format(new Date())}</td>
      `;

      const beforeElement = document.querySelector("tbody tr");
      console.log(beforeElement);
      if (beforeElement)
        tableBody.insertBefore(registrationElement, beforeElement);
      else tableBody.appendChild(registrationElement);

      startDateEntry.value = "";
      endDateEntry.value = "";

      notification.setAttribute("type", "success");
      notification.setAttribute(
        "text",
        "Período de inscripción definido correctamente"
      );
    } catch (error) {
      notification.setAttribute("type", "error");
      notification.setAttribute("text", error);
    } finally {
      loadNotificationContainer.appendChild(notification);
    }
  });
});
