import authorize from "../scripts/auth.js";

authorize("administrador");

document.addEventListener("DOMContentLoaded", async () => {
  const notificationContainer = document.getElementById("notifications");
  const saveTermBtn = document.getElementById("guardar-periodo");
  const startDateInput = document.getElementById("fecha-inicio");
  const endDateInput = document.getElementById("fecha-fin");
  const studentsContainer = document.querySelector(".students-list"); // El contenedor de tus acordeones
  const token = localStorage.getItem("auth");

  // --- 1. LÓGICA DEL CALENDARIO (Lo que ya tenías) ---
  const registrationTermResponse = await fetch(`${window.APP_CONFIG.api_url}/registration/get`);

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

      if (!startDate || !endDate) {
        notification.setAttribute("text", "Selecciona fechas de inicio y fin.");
        notificationContainer.appendChild(notification);
        return;
      }

      if (endDate < startDate) {
        notification.setAttribute("text", "La fecha fin no puede ser anterior.");
        notificationContainer.appendChild(notification);
        return;
      }

      const loader = document.createElement("loader-spinner");
      document.body.appendChild(loader);

      const response = await fetch(`${window.APP_CONFIG.api_url}/registration/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          FechaInicio: startDateInput.value,
          FechaFin: endDateInput.value,
        }),
      });

      const resultQuery = await response.json();
      loader.remove();

      if (!response.ok) {
        notification.setAttribute("text", resultQuery.message);
        notification.setAttribute("type", "error");
      } else {
        notification.setAttribute("text", "Período asignado correctamente.");
        notification.setAttribute("type", "success");
      }
      notificationContainer.appendChild(notification);
    });
  }

  // --- 2. LÓGICA DE GESTIÓN DE ESTUDIANTES (¡ESTO ES LO NUEVO!) ---

  // Función para procesar la acción (Aprobar o Rechazar)
  async function handleAction(id, action) {
    const confirmMsg = action === "approve" 
      ? "¿Segura que deseas APROBAR a este estudiante?" 
      : "¿Segura que deseas RECHAZAR esta solicitud?";
    
    if (!confirm(confirmMsg)) return;

    try {
        const response = await fetch(`${window.APP_CONFIG.api_url}/students/${action}/${id}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const res = await response.json();
        
        const notif = document.createElement("notification-component");
        if (response.ok) {
            notif.setAttribute("type", "success");
            notif.setAttribute("text", res.message);
            // Recargar la página para que desaparezca de la lista de revisión
            setTimeout(() => window.location.reload(), 1500);
        } else {
            notif.setAttribute("type", "error");
            notif.setAttribute("text", res.message);
        }
        notificationContainer.appendChild(notif);

    } catch (err) {
        console.error(err);
        alert("Error al conectar con el servidor.");
    }
  }

  // EVENT DELEGATION: Escuchamos clics en toda la página para los botones
  document.addEventListener("click", (e) => {
    // Si el clic fue en un botón de Aprobar (o dentro de él)
    const approveBtn = e.target.closest(".btn-success");
    const rejectBtn = e.target.closest(".btn-danger");

    if (approveBtn) {
        // Buscamos el ID. OJO: Asegúrate que tus botones tengan data-id o estén dentro de un contenedor con el ID
        // Como no veo tu función de renderizado, buscaremos el ID en el data-id del botón
        const studentId = approveBtn.getAttribute("data-id");
        if (studentId) handleAction(studentId, "approve");
        else alert("Error: No se encontró el ID del estudiante en el botón.");
    }

    if (rejectBtn) {
        const studentId = rejectBtn.getAttribute("data-id");
        if (studentId) handleAction(studentId, "reject");
        else alert("Error: No se encontró el ID del estudiante en el botón.");
    }
  });

  // Lógica para abrir/cerrar acordeones (Si no la tienes ya)
  document.addEventListener("click", (e) => {
    const header = e.target.closest(".accordion-header");
    if (header) {
      const item = header.parentElement;
      item.classList.toggle("active");
    }
  });

});