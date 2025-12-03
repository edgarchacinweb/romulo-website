import authorize from "./auth.js";

authorize("administrador");

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("auth");
  const notificationContainer = document.getElementById("notifications");

  const loader = document.createElement("loader-spinner");
  loader.setAttribute("title", "Cargando docentes...");
  document.body.appendChild(loader);

  const teachersResponse = await fetch(
    `${window.APP_CONFIG.api_url}/teacher/list`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const notification = document.createElement("notification-component");

  if (teachersResponse.status !== 200) {
    notification.setAttribute("type", "error");
    notification.setAttribute(
      "text",
      "Error al cargar la plantilla del personal docente"
    );
  } else {
    const teachers = await teachersResponse.json();

    const teachersData = Object.values(
      teachers.reduce((acum, item) => {
        const { DocenteId, DatosPersona, Materia } = item;
        if (!acum[DatosPersona.DatosPersonaId]) {
          acum[DatosPersona.DatosPersonaId] = {
            DocenteId,
            DatosPersona,
            Materias: [],
          };
        }

        acum[DatosPersona.DatosPersonaId].Materias.push(Materia.name);

        return acum;
      }, {})
    );

    if (teachers.length === 0) {
      notification.setAttribute("type", "warning");
      notification.setAttribute(
        "text",
        "No hay docentes registrados en este momento."
      );
    } else {
      const teacherList = document.getElementById("teacher-list");
      const activeTeachers = document.getElementById("active-teachers");
      activeTeachers.innerHTML = teachersData.length;

      teachersData.forEach((teacherElement) => {
        const teacherCard = document.createElement("teacher-card");
        teacherCard.setAttribute("teacherData", JSON.stringify(teacherElement));
        teacherList.appendChild(teacherCard);
      });
      notification.setAttribute("type", "success");
      notification.setAttribute(
        "text",
        "Plantilla de personal docente cargada."
      );
    }
  }

  loader.remove();
  notificationContainer.appendChild(notification);
});
