import authorize from "./auth.js";
import numberToLetter from "./utils.js";

authorize("administrador");

const token = localStorage.getItem("auth");
const emptyState = document.getElementById("empty-state");
const scheduleContainer = document.getElementById("results-container");
const scheduleCard = document.createElement("section");
let scheduleBlocks = [];
let subjects = [];
let teachers = [];
scheduleCard.classList.add("card");

const calcMinutesDifferences = (time1, time2) => {
  const [hours1, minutes1] = time1.split(":");
  const [hours2, minutes2] = time2.split(":");
  const completeDate1 = new Date();
  const completeDate2 = new Date();
  completeDate1.setHours(parseInt(hours1), parseInt(minutes1));
  completeDate2.setHours(parseInt(hours2), parseInt(minutes2));

  return Math.floor(Math.abs(completeDate2 - completeDate1) / (1000 * 60));
};

const filter = async (grade, section, term) => {
  const loader = document.createElement("loader-spinner");
  loader.setAttribute("title", "Cargando horario...");
  const notifications = document.getElementById("notifications");

  try {
    const scheduleResponse = await fetch(
      `${window.APP_CONFIG.api_url}/schedule/filter`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          CursoId: grade,
          Seccion: `${section}`,
          PeriodoEscolarId: term,
        }),
      },
    );

    const schedule = await scheduleResponse.json();
    if (!scheduleResponse.ok) throw new Error(schedule.message);

    const subjectsResponse = await fetch(
      `${window.APP_CONFIG.api_url}/subject/list`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const subjectsAnswer = await subjectsResponse.json();
    if (!subjectsResponse.ok) throw new Error("Error al cargar las materias");

    subjects = [...subjectsAnswer];

    const options = subjects.reduce((prev, element) => {
      return (
        prev +
        `
        <option value="${element["MateriaId"]}">${element["Nombre"]}</option>"
      `
      );
    }, '<option value="">Sin asignar</option>');

    const scheduleBlocksResponse = await fetch(
      `${window.APP_CONFIG.api_url}/schedule/blocks`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const scheduleBlocksAnswer = await scheduleBlocksResponse.json();
    if (!scheduleBlocksResponse.ok)
      throw new Error("Error al cargar los bloques de horario");

    scheduleBlocks = [...scheduleBlocksAnswer];

    const scheduleRows = scheduleBlocks.reduce((prev, item, index) => {
      const minutes = calcMinutesDifferences(
        item["HoraInicio"],
        item["HoraFin"],
      );
      return (
        prev +
        `
      <div class="grid-row-label">
              <strong>Bloque ${index + 1}</strong>
              <span>${item["HoraInicio"]} - ${item["HoraFin"]}</span>
            </div>
            ${
              minutes > 15
                ? `<div class="grid-cell" data-row="${item["BloqueHorarioId"]}">
              <select class="select-pill Lunes">
                ${options}
              </select>
            </div>
            <div class="grid-cell" data-row="${item["BloqueHorarioId"]}">
              <select class="select-pill Martes">
                ${options}
              </select>
            </div>
            <div class="grid-cell" data-row="${item["BloqueHorarioId"]}">
              <select class="select-pill Miércoles">
                ${options}
              </select>
            </div>
            <div class="grid-cell" data-row="${item["BloqueHorarioId"]}">
              <select class="select-pill Jueves">
                ${options}
              </select>
            </div>
            <div class="grid-cell" data-row="${item["BloqueHorarioId"]}">
              <select class="select-pill Viernes">
                ${options}
              </select>
            </div>`
                : `<div class="grid-cell">
              <select class="select-pill" disabled>
                <option value="">Receso</option>
              </select>
            </div>
            <div class="grid-cell">
              <select class="select-pill" disabled>
                <option value="">Receso</option>
              </select>
            </div>
            <div class="grid-cell">
              <select class="select-pill" disabled>
                <option value="">Receso</option>
              </select>
            </div>
            <div class="grid-cell">
              <select class="select-pill" disabled>
                <option value="">Receso</option>
              </select>
            </div>
            <div class="grid-cell">
              <select class="select-pill" disabled>
                <option value="">Receso</option>
              </select>
            </div>`
            }
      `
      );
    }, "");

    emptyState.remove();
    scheduleCard.innerHTML = `
    <div class="card-header border-bottom">
            <div class="icon-title">
              <svg
                class="text-blue"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path
                  d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
                />
              </svg>
              <h2>Asignación de Materias</h2>
            </div>
            <p class="card-subtitle">
              Selecciona la materia para cada bloque de horario por día
            </p>
          </div>

          <div class="schedule-grid">
            <div class="grid-head">Bloque</div>
            <div class="grid-head">Lunes</div>
            <div class="grid-head">Martes</div>
            <div class="grid-head">Miércoles</div>
            <div class="grid-head">Jueves</div>
            <div class="grid-head">Viernes</div>

            ${scheduleRows}
          </div>
        </section>

        <section class="card">
          <div class="card-header border-bottom">
            <div class="icon-title">
              <svg
                class="text-blue"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <h2>Asignación de Docentes por Materia</h2>
            </div>
            <p class="card-subtitle">
              Selecciona el docente que impartirá cada materia para esta sección
            </p>
          </div>

          <div class="table-list" id="table-list">
            <div class="table-header">
              <span>Materia</span>
              <span>Docente Asignado</span>
            </div>
          </div>
        </section>

        <footer class="action-footer card">
          <div></div>
          <div class="footer-buttons">
            <button class="btn btn-outline">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Exportar PDF
            </button>
            <button class="btn btn-primary">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
                />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Guardar Cambios
            </button>
          </div>
        </footer>
    `;
    scheduleContainer.appendChild(scheduleCard);

    const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
    scheduleBlocks.forEach((sb) => {
      const id = sb["BloqueHorarioId"];
      const row = document.querySelectorAll(`[data-row="${id}"]`);
      row.forEach((r, index) => {
        const data = schedule.find(
          (s) => s["BloqueHorarioId"] === id && s["Dia"] == days[index],
        );

        if (data) {
          const select = r.querySelector(`.${days[index]}`);
          select
            .querySelector(`[value="${data["MateriaId"]}"`)
            .setAttribute("selected", "");
        }
      });
    });

    const assignedSubjects = Array.from(
      new Set(schedule.map((s) => s["MateriaId"])),
    );

    const teachersResponse = await fetch(
      `${window.APP_CONFIG.api_url}/teacher/list`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const teachersAnswer = await teachersResponse.json();
    if (!teachersResponse.ok) throw new Error(teachersAnswer.message);

    teachers = [...teachersAnswer];

    const tableList = document.getElementById("table-list");

    assignedSubjects.forEach((subject) => {
      const subjectName = subjects.find((s) => s["MateriaId"] === subject)[
        "Nombre"
      ];
      const tableItem = document.createElement("div");
      tableItem.classList.add("table-row");
      const teachersList = teachers.filter((t) =>
        t["Materias"].find((m) => m["MateriaId"] === subject),
      );

      tableItem.innerHTML = `
      <div class="materia-cell">
        ${subjectName}
      </div>
        <div class="select-wrapper full-width">
        <select class="select-gray">
          ${teachersList.reduce((prev, current) => prev + `<option value="${current["DocenteId"]}">${current["DatosPersona"]["Nombre"]} ${current["DatosPersona"]["Apellido"]}</option>`, "")}
        </select>
      </div>
      `;

      tableList.appendChild(tableItem);
    });
  } catch (Error) {
    console.error(Error.stack);
    const notification = document.createElement("notifications");
    notification.setAttribute("type", "error");
    notification.setAttribute("text", Error.message);
    notifications.appendChild(notification);
  } finally {
    loader.remove();
  }
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

  sectionField.addEventListener(
    "change",
    async () =>
      await filter(gradeField.value, sectionField.value, termField.value),
  );
});
