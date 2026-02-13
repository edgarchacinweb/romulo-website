import authorize from "./auth.js";
import numberToLetter from "./utils.js";

authorize("administrador");

const token = localStorage.getItem("auth");

const filter = async (grade, section, term) => {
  console.log("trabajando...");
};

const updateSections = (sectionData) => {
  const sectionField = document.getElementById("sectionField");
  sectionField.innerHTML = '<option value="">Selecciona la sección</option>';
  if (sectionField.getAttribute("disabled") !== null)
    sectionField.removeAttribute("disabled");

  for (let i = 1; i <= sectionData["Seccion"]; i++) {
    const newSectionOption = document.createElement("option");
    newSectionOption.setAttribute("value", sectionData["Seccion"]);
    newSectionOption.textContent = numberToLetter(i);
    sectionField.appendChild(newSectionOption);
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  // Referencias a los elementos del DOM
  const emptyState = document.getElementById("empty-state");
  const notifications = document.getElementById("notifications");
  const resultsContainer = document.getElementById("results-container");
  const schedule = [];
  const blocks = [];
  const teachers = [];

  // Cargar todas las secciones y períodos académicos
  const gradeField = document.getElementById("gradeField");
  const sectionField = document.getElementById("sectionField");
  const termField = document.getElementById("termField");

  const loader = document.createElement("loader-spinner");
  const notificationsContainer = document.getElementById("notifications");
  loader.setAttribute("title", "Consultado Datos Escolares...");
  document.body.appendChild(loader);

  try {
    const sectionsResponse = await fetch(
      `${window.APP_CONFIG.api_url}/course/sections`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const sections = await sectionsResponse.json();
    if (!sectionsResponse.ok) throw new Error(sections.message);

    gradeField.innerHTML = '<option value="">Selecciona el grado</option>';
    sectionField.innerHTML = '<option value="">Selecciona la sección</option>';
    sections.forEach((s) => {
      const newGradeOption = document.createElement("option");
      newGradeOption.setAttribute("value", s["CursoId"]);
      newGradeOption.textContent = s["Grado"];
      gradeField.appendChild(newGradeOption);

      gradeField.addEventListener("change", () => updateSections(s));
    });

    const termResponse = await fetch(
      `${window.APP_CONFIG.api_url}/school_term/list`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const terms = await termResponse.json();
    if (!termResponse.ok) throw new Error(terms.message);

    termField.querySelectorAll("option").forEach((o) => o.remove());
    terms.forEach((t) => {
      const newOption = document.createElement("option");
      newOption.setAttribute("value", t["PeriodoEscolarId"]);
      newOption.textContent = `${new Date(t["FechaInicio"]).getFullYear()} - ${new Date(t["FechaFin"]).getFullYear()}`;
      termField.appendChild(newOption);
    });
  } catch (Error) {
    console.error(Error.stack);
    const notification = document.createElement("notification-component");
    notification.setAttribute("type", "error");
    notification.setAttribute("text", Error.message);
    notificationsContainer.appendChild(notification);
  } finally {
    loader.remove();
  }
});
