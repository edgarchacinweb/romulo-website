import authorize from "./auth.js";

authorize("administrador");

document.addEventListener("DOMContentLoaded", () => {
  const notificationContainer = document.getElementById(
    "notificationContainer"
  );

  // Cargar datos de cantidad de estudiantes inscritos
  (async () => {
    const studentsResponse = await fetch(
      `${window.APP_CONFIG.api_url}/students/count`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (studentsResponse.status !== 200) {
      const notification = document.createElement("notification-component");
      notification.setAttribute("type", "error");
      notification.setAttribute("text", "Error al cargar la matrícula");
      notificationContainer.appendChild(notification);
    } else {
      const data = await studentsResponse.json();
      document.getElementById("totalStudents").innerHTML = `${data.count}`;
    }
  })();

  // Cargar datos de la plantilla de personal docente
  (async () => {
    const teacherResponse = await fetch(
      `${window.APP_CONFIG.api_url}/teacher/count`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (teacherResponse.status !== 200) {
      const notification = document.createElement("notification-component");
      notification.setAttribute("type", "error");
      notification.setAttribute(
        "text",
        "Error al cargar la plantilla del personal docente"
      );
      notificationContainer.appendChild(notification);
    } else {
      const data = await teacherResponse.json();
      document.getElementById("totalTeachers").innerHTML = `${data.count}`;
    }
  })();

  const token = localStorage.getItem("auth");

  // Cargar datos del período escolar actual
  (async () => {
    const schoolTermResponse = await fetch(
      `${window.APP_CONFIG.api_url}/school_term/get`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (schoolTermResponse.status !== 200) {
      const notification = document.createElement("notification-component");
      notification.setAttribute("type", "error");
      notification.setAttribute("text", "Error al cargar el período escolar");
      notificationContainer.appendChild(notification);
    } else {
      const data = await schoolTermResponse.json();
      const term = `${data.FechaInicio.slice(0, 4)} - ${data.FechaFin.slice(
        0,
        4
      )}`;
      document.getElementById("schoolTerm").innerHTML = term;
    }
  })();

  // Cargar datos de las inscripciones activas
  (async () => {
    const registrationResponse = await fetch(
      `${window.APP_CONFIG.api_url}/registration/count`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (registrationResponse.status !== 200) {
      const notification = document.createElement("notification-component");
      notification.setAttribute("type", "error");
      notification.setAttribute(
        "text",
        "Error al cargar la cantidad de estudiantes en espera de inscripción"
      );
      notificationContainer.appendChild(notification);
    } else {
      const data = await registrationResponse.json();
      document.getElementById("activeEnrollments").innerHTML = `${data.count}`;
    }
  })();

  // Botón para cerrar sesión
  document.getElementById("logoutBtn").addEventListener("click", (e) => {
    e.preventDefault();

    const logout = confirm("¿Estás seguro de que quieres cerrar sesión?");
    if (logout) {
      localStorage.removeItem("auth");
      localStorage.removeItem("role");
      window.location.href = "/";
    }
  });
});
