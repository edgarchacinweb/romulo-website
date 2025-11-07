import authorize from "./auth.js";

authorize("administrador");

document.addEventListener("DOMContentLoaded", async () => {
  let courses = [];
  const notificationContainer = document.getElementById(
    "notificationContainer"
  );
  const coursesSelect = document.getElementById("admin_year");
  const coursesResponse = await fetch(
    `${window.APP_CONFIG.api_url}/course/get_all`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (coursesResponse.status !== 200) {
    const notification = document.createElement("notification-component");
    notification.setAttribute("text", "Error al cargar los años académicos");
    notification.setAttribute("type", "error");
    notificationContainer.appendChild(notification);
  } else {
    const data = await coursesResponse.json();
    courses = data;
    coursesSelect.querySelector("option").remove();
    courses.forEach((c) => {
      const option = document.createElement("option");
      option.setAttribute("value", c.CursoId);
      option.innerHTML = `${c.Grado}° Año`;
      coursesSelect.appendChild(option);
    });
  }
});
