import authorize from "../scripts/auth.js";

authorize("administrador");

// Esperar a que todo el HTML esté cargado
document.addEventListener("DOMContentLoaded", async () => {
  const notificationContainer = document.getElementById("notifications");
  const saveTermBtn = document.getElementById("guardar-periodo");
  // const reporteButton = document.getElementById("generar-reporte");
  const startDateInput = document.getElementById("fecha-inicio");
  const endDateInput = document.getElementById("fecha-fin");

  // Cargando periodo de inscripcion
  const registrationTermResponse = await fetch(
    `${window.APP_CONFIG.api_url}/registration/get`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (registrationTermResponse.ok) {
    const registrationTerm = await registrationTermResponse.json();
    startDateInput.value = registrationTerm.Inicio;
    endDateInput.value = registrationTerm.Fin;
  }

  if (saveTermBtn) {
    saveTermBtn.addEventListener("click", async () => {
      const startDate = startDateInput.valueAsDate;
      const endDate = endDateInput.valueAsDate;
      const notification = document.createElement("notification-component");
      notification.setAttribute("type", "warning");

      // 1. Validación: Campos vacíos
      if (!startDate || !endDate) {
        notification.setAttribute(
          "text",
          "Por favor, selecciona una fecha de inicio y una fecha de fin.",
        );
        notificationContainer.appendChild(notification);
        return;
      }

      // 2. Validación: Orden de fechas
      if (endDate < startDate) {
        notification.setAttribute(
          "text",
          "La fecha de fin no puede ser anterior a la fecha de inicio.",
        );
        endDateInput.focus();
        notificationContainer.appendChild(notification);
        return;
      }

      // 2. Validación: Diferencia de fechas
      const diffenceInMilliseconds = endDate - startDate;
      const dayInMilliseconds = 1000 * 60 * 60 * 24;

      if (diffenceInMilliseconds < dayInMilliseconds * 7) {
        notification.setAttribute(
          "text",
          "Debes establecer al menos 7 días de período de inscripción",
        );
        startDateInput.focus();
        notificationContainer.appendChild(notification);
        return;
      }

      const loader = document.createElement("loader-spinner");
      document.body.appendChild(loader);

      const date1 = startDateInput.value;
      const date2 = endDateInput.value;

      const token = localStorage.getItem("auth");
      const response = await fetch(
        `${window.APP_CONFIG.api_url}/registration/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            FechaInicio: date1.toString(),
            FechaFin: date2.toString(),
          }),
        },
      );

      const resultQuery = await response.json();

      if (!response.ok) {
        console.log(resultQuery);
        notification.setAttribute("text", resultQuery.message);
        notification.setAttribute("type", "error");
        loader.remove();
        notificationContainer.appendChild(notification);
        console.log(startDateInput.value, endDateInput.value);
        return;
      }

      notification.setAttribute(
        "text",
        "Período de inscripción asignado correctamente.",
      );

      loader.remove();
      notification.setAttribute("type", "success");
      notificationContainer.appendChild(notification);
    });
  }
});
