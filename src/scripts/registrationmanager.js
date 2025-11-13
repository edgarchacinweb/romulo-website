// Esperar a que todo el HTML esté cargado
document.addEventListener("DOMContentLoaded", () => {
  const notificationContainer = document.getElementById("notifications");
  const saveTermBtn = document.getElementById("guardar-periodo");
  const reporteButton = document.getElementById("generar-reporte");
  const startDateInput = document.getElementById("fecha-inicio");
  const endDateInput = document.getElementById("fecha-fin");

  if (saveTermBtn) {
    saveTermBtn.addEventListener("click", () => {
      const startDate = startDateInput.valueAsDate;
      const endDate = endDateInput.valueAsDate;
      const notification = document.createElement("notification-component");
      notification.setAttribute("type", "warning");

      // 1. Validación: Campos vacíos
      if (!startDate || !endDate) {
        notification.setAttribute(
          "text",
          "Por favor, selecciona una fecha de inicio y una fecha de fin."
        );
        notificationContainer.appendChild(notification);
        return;
      }

      // 2. Validación: Orden de fechas
      if (endDate < startDate) {
        notification.setAttribute(
          "text",
          "La fecha de fin no puede ser anterior a la fecha de inicio."
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
          "Debes establecer al menos 7 días de período de inscripción"
        );
        startDateInput.focus();
        notificationContainer.appendChild(notification);
      }
    });
  }
});
