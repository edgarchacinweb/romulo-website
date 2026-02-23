import authorize from "./auth.js";

authorize("administrador");

document.addEventListener("DOMContentLoaded", () => {
  const notificationContainer = document.getElementById(
    "notificationContainer",
  );
  const token = localStorage.getItem("auth");

  // --- 1. Cargar Total de Estudiantes ---
  (async () => {
    try {
      const studentsResponse = await fetch(
        `${window.APP_CONFIG.api_url}/registration/count/students`, 
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, 
          },
        },
      );

      if (!studentsResponse.ok) throw new Error("Error al cargar la matrícula");

      const data = await studentsResponse.json();
      const el = document.getElementById("totalStudents");
      if (el) el.innerHTML = `${data.count}`;
    } catch (err) {
      console.error(err);
      const notification = document.createElement("notification-component");
      notification.setAttribute("type", "error");
      notification.setAttribute(
        "text",
        "Error al cargar la matrícula de estudiantes",
      );
      if (notificationContainer)
        notificationContainer.appendChild(notification);
    }
  })();

  // --- 2. Cargar Total de Personal Docente ---
  (async () => {
    try {
      const teacherResponse = await fetch(
        `${window.APP_CONFIG.api_url}/registration/count/teachers`, 
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!teacherResponse.ok)
        throw new Error("Error al cargar personal docente");

      const data = await teacherResponse.json();
      const el = document.getElementById("totalTeachers");
      if (el) el.innerHTML = `${data.count}`;
    } catch (err) {
      console.error(err);
      const notification = document.createElement("notification-component");
      notification.setAttribute("type", "error");
      notification.setAttribute(
        "text",
        "Error al cargar la plantilla del personal docente",
      );
      if (notificationContainer)
        notificationContainer.appendChild(notification);
    }
  })();

  // --- 3. Cargar Período Escolar Actual (MODIFICADO) ---
  (async () => {
    try {
      // Pedimos la lista completa en lugar del último
      const schoolTermResponse = await fetch(
        `${window.APP_CONFIG.api_url}/school_term/list`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!schoolTermResponse.ok)
        throw new Error("Error al cargar período escolar");

      const terms = await schoolTermResponse.json();

      // Determinar cuál es el periodo actual basado en la fecha de hoy
      const today = new Date();
      const currentMonth = today.getMonth(); // 0 = Enero, ..., 7 = Agosto
      const currentYear = today.getFullYear();
      
      // Regla: A partir de agosto (7) iniciamos ciclo del año en curso. 
      // Antes de agosto, seguimos en el ciclo que inició el año pasado.
      const activeStartYear = currentMonth >= 7 ? currentYear : currentYear - 1;

      // Buscar en el array el periodo escolar que corresponde a esa fecha
      const activeTerm = terms.find((t) => {
        if (!t.FechaInicio) return false;
        
        // CORRECCIÓN: Usar Date() en lugar de slice() para extraer el año real y evitar errores de formato (NaN)
        const startYear = new Date(t.FechaInicio).getFullYear();
        return startYear === activeStartYear;
      });

      const el = document.getElementById("schoolTerm");
      if (activeTerm && el) {
        // CORRECCIÓN: Usar Date() también aquí al pintar las fechas en pantalla
        const start = new Date(activeTerm.FechaInicio).getFullYear();
        const end = new Date(activeTerm.FechaFin).getFullYear();
        el.innerHTML = `${start} - ${end}`;
      } else if (el) {
        // En caso de que aún no exista un periodo para este año en curso
        el.innerHTML = "No Activo";
        el.style.color = "#b00020";
        el.style.fontSize = "1.2rem";
      }
    } catch (err) {
      console.error(err);
    }
  })();

  // --- 4. Cargar Inscripciones en Espera (Pendientes) ---
  (async () => {
    try {
      const registrationResponse = await fetch(
        `${window.APP_CONFIG.api_url}/registration/count`, 
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!registrationResponse.ok)
        throw new Error("Error en conteo de inscripciones");

      const data = await registrationResponse.json();
      const el = document.getElementById("activeEnrollments");
      if (el) el.innerHTML = `${data.count}`;
    } catch (err) {
      console.error(err);
      const notification = document.createElement("notification-component");
      notification.setAttribute("type", "error");
      notification.setAttribute(
        "text",
        "Error al cargar estudiantes en espera",
      );
      if (notificationContainer)
        notificationContainer.appendChild(notification);
    }
  })();

  // --- 5. Botón Cerrar Sesión ---
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const logout = confirm("¿Estás seguro de que quieres cerrar sesión?");
      if (logout) {
        localStorage.clear();
        window.location.href = "/";
      }
    });
  }
});

document.querySelectorAll("a").forEach((anchor) =>
  anchor.addEventListener("click", (event) => {
    if (anchor.href.includes("cerrar-sesion")) return;
    event.preventDefault();
    document.body.style.overflow = "hidden";
    document.body.style.animation = "goodByePage 0.8s forwards";
    setTimeout(() => (window.location.href = anchor.href), 1000);
  }),
);