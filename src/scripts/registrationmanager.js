// Esperar a que todo el HTML esté cargado
document.addEventListener("DOMContentLoaded", () => {
  // --- Lógica de la Tarjeta de Configuración ---

  const guardarButton = document.getElementById("guardar-periodo");
  const reporteButton = document.getElementById("generar-reporte");
  const startDateInput = document.getElementById("fecha-inicio");
  const endDateInput = document.getElementById("fecha-fin");

  if (guardarButton) {
    guardarButton.addEventListener("click", handleSavePeriod);
  }

  if (reporteButton) {
    reporteButton.addEventListener("click", () => {
      alert("Generando reporte del periodo...");
      // Aquí iría la lógica de API para generar el reporte
    });
  }

  function handleSavePeriod() {
    // Usar valueAsDate es mejor porque devuelve un objeto Date
    const startDate = startDateInput.valueAsDate;
    const endDate = endDateInput.valueAsDate;

    // 1. Validación: Campos vacíos
    // (Aunque 'required' en HTML ayuda, JS es una buena segunda capa)
    if (!startDate || !endDate) {
      alert("Por favor, selecciona una fecha de inicio y una fecha de fin.");
      return;
    }

    // 2. Validación: Orden de fechas
    if (endDate < startDate) {
      alert("La fecha de fin no puede ser anterior a la fecha de inicio.");
      endDateInput.focus(); // Ayuda al usuario a corregir
      return;
    }

    // 3. Éxito (Simulación)
    console.log("Periodo a guardar:");
    console.log("Inicio:", startDate.toISOString());
    console.log("Fin:", endDate.toISOString());

    alert(
      `Periodo guardado exitosamente:\nInicio: ${startDate.toLocaleDateString()}\nFin: ${endDate.toLocaleDateString()}`
    );

    // Aquí harías la llamada fetch() al backend para guardar
  }

  // --- Lógica de Solicitudes Pendientes (Igual que antes) ---

  const studentCards = document.querySelectorAll(".student-card");

  studentCards.forEach((card) => {
    const approveButton = card.querySelector('.btn[data-action="approve"]');
    const rejectButton = card.querySelector('.btn[data-action="reject"]');
    // Tomar el nombre del segundo <p> en la sección de info
    const studentName = card.querySelector(
      ".student-info div:nth-child(2) p"
    ).textContent;

    if (approveButton) {
      approveButton.addEventListener("click", () => {
        handleApproval(card, studentName, true);
      });
    }

    if (rejectButton) {
      rejectButton.addEventListener("click", () => {
        handleApproval(card, studentName, false);
      });
    }
  });

  function handleApproval(card, studentName, isApproved) {
    const actionText = isApproved ? "aprobado" : "rechazado";

    console.log(`Acción: ${actionText} al estudiante ${studentName}`);

    card.querySelectorAll(".btn").forEach((btn) => (btn.disabled = true));

    card.style.transition = "opacity 0.5s ease, transform 0.5s ease";
    card.style.opacity = "0.3";
    card.style.transform = "scale(0.98)";

    // En una app real, actualizarías el contador de "Pendientes"
    // y podrías eliminar la tarjeta: setTimeout(() => card.remove(), 500);
  }
});
