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
        `${window.APP_CONFIG.api_url}/registration/count/students`, // Ruta corregida
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Token añadido
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
        `${window.APP_CONFIG.api_url}/registration/count/teachers`, // Ruta corregida para usar tu nuevo endpoint
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

  // --- 3. Cargar Período Escolar Actual ---
  (async () => {
    try {
      const schoolTermResponse = await fetch(
        `${window.APP_CONFIG.api_url}/school_term/get`,
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

      const data = await schoolTermResponse.json();
      // Verificamos que existan las fechas antes de intentar cortarlas con slice
      if (data.FechaInicio && data.FechaFin) {
        const term = `${data.FechaInicio.slice(0, 4)} - ${data.FechaFin.slice(0, 4)}`;
        const el = document.getElementById("schoolTerm");
        if (el) el.innerHTML = term;
      }
    } catch (err) {
      console.error(err);
    }
  })();

  // --- 4. Cargar Inscripciones en Espera (Pendientes) ---
  (async () => {
    try {
      const registrationResponse = await fetch(
        `${window.APP_CONFIG.api_url}/registration/count`, // Esta ruta cuenta los 'revision'
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
        localStorage.removeItem("auth");
        localStorage.removeItem("role");
        window.location.href = "/";
      }
    });
  }
});

document.querySelectorAll("a").forEach((anchor) =>
  anchor.addEventListener("click", (event) => {
    event.preventDefault();
    document.body.style.overflow = "hidden";
    document.body.style.animation = "goodByePage 0.8s forwards";
    setTimeout(() => (window.location.href = anchor.href), 1000);
  }),
);
