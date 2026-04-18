import authorize from "./auth.js";
import numberToLetter from "./utils.js";

authorize("docente");

const token = localStorage.getItem("auth");
const emptyState = document.getElementById("empty-state");
const scheduleContainer = document.getElementById("results-container");
const gradeField = document.getElementById("gradeField");
const sectionField = document.getElementById("sectionField");
const scheduleCard = document.createElement("section");
let scheduleBlocks = [];
let subjects = [];
let teachers = [];
let schedule = [];
let courses = [];
let teacherId = undefined;
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

const highlightCurrentClass = () => {
  const now = new Date();
  const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const currentDay = days[now.getDay()];
  const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  if (now.getDay() === 0 || now.getDay() === 6) return; // Fin de semana

  scheduleBlocks.forEach((block) => {
    if (currentTime >= block.HoraInicio && currentTime <= block.HoraFin) {
      const dayIndex = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].indexOf(currentDay);
      if (dayIndex === -1) return;

      const cells = document.querySelectorAll(`[data-row="${block.BloqueHorarioId}"]`);
      if (cells[dayIndex]) {
        cells[dayIndex].classList.add("current-class-highlight");
      }
    }
  });
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

const updateGrades = async (term) => {
  let error = undefined;
  const sectionsResponse = await fetch(
    `${window.APP_CONFIG.api_url}/course/sections${term ? "/".concat(term) : ""}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  const sections = await sectionsResponse.json();
  if (!sectionsResponse.ok) error = new Error(sections.message);

  gradeField.innerHTML = '<option value="">Selecciona el grado</option>';
  sectionField.innerHTML = '<option value="">Selecciona la sección</option>';

  if (sections.length === 0)
    error = new Error(
      "No hay estudiantes registrados en este período escolar.",
    );

  sections.forEach((s) => {
    const newGradeOption = document.createElement("option");
    newGradeOption.setAttribute("value", s["CursoId"]);
    newGradeOption.textContent = s["Grado"];
    gradeField.appendChild(newGradeOption);
  });

  gradeField.onchange = () => {
    const selectedCourseId = gradeField.value;
    const selectedCourseData = sections.find(
      (s) => s["CursoId"] === selectedCourseId,
    );
    if (selectedCourseData) updateSections(selectedCourseData);
  };

  if (error && error.message) {
    const notification = document.createElement("notification-component");
    notification.setAttribute("type", "error");
    notification.setAttribute("text", error.message);
    document.getElementById("notifications").appendChild(notification);
    if (document.getElementById("results-container"))
      document.getElementById("results-container").innerHTML = "";
    document.getElementById("empty-state").style.display = "flex";
    gradeField.setAttribute("disabled", "");
    sectionField.setAttribute("disabled", "");
    throw error;
  }

  if (gradeField.getAttribute("disabled") !== null) {
    gradeField.removeAttribute("disabled");
  }
};

const filter = async (courseId, section) => {
  // Configurando reporte
  const currentCourse = courses.find((c) => c["CursoId"] === courseId);
  const gradeNumber = currentCourse ? currentCourse["Grado"] : "N/A";

  document.querySelector(".print__grade").textContent =
    `${gradeNumber}° Año - Sección ${section}`;

  const scheduleReport = document.querySelector(".print__schedule-data");
  scheduleReport.innerHTML = "";

  const loader = document.createElement("loader-spinner");
  loader.setAttribute("title", "Cargando horario...");
  const notifications = document.getElementById("notifications");

  const numberSection = ["A", "B", "C", "D", "E", "F"].indexOf(section) + 1;

  const selectedSchedule = schedule.filter(
    (s) => s["Seccion"] === numberSection && s["CursoId"] === courseId,
  );

  if (selectedSchedule.length === 0) {
    scheduleCard.innerHTML = "";
    if (document.getElementById("results-container")) {
      document.getElementById("results-container").innerHTML = "";
    }
    emptyState.style.display = "flex";
    emptyState.innerHTML = `
        <div class="warning-banner">
            <div class="warning-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2">
                    <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
                </svg>
            </div>
            <h3>Sin Horas Asignadas</h3>
            <p>Usted no tiene horas académicas asignadas para esta sección en este período.</p>
        </div>
      `;
    return;
  }

  try {
    const scheduleRows = scheduleBlocks.reduce((prev, item, index) => {
      const minutes = calcMinutesDifferences(
        item["HoraInicio"],
        item["HoraFin"],
      );

      const selectedBlock = schedule.filter(
        (s) =>
          s["CursoId"] === courseId &&
          s["Seccion"] === numberSection &&
          s["BloqueHorarioId"] === item["BloqueHorarioId"],
      );

      const blocks = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].map(
        (day) => {
          const thisBlock = selectedBlock.find((s) => s["Dia"] === day);
          const subject = subjects.find(
            (s) => thisBlock?.MateriaId === s?.MateriaId,
          );
          return subject?.Nombre;
        },
      );

      const tr = document.createElement("tr");
      tr.innerHTML = `
      <tr>
        <td class="print__block">
          <p class="print__block-text">Bloque ${index + 1}</p>
          <p class="print__block-time">${item["HoraInicio"]} - ${item["HoraFin"]}</p>
        </td>
      `;

      tr.innerHTML +=
        minutes > 15
          ? `
          <td class="print__subject">${blocks[0] ?? ""}</td>
          <td class="print__subject">${blocks[1] ?? ""}</td>
          <td class="print__subject">${blocks[2] ?? ""}</td>
          <td class="print__subject">${blocks[3] ?? ""}</td>
          <td class="print__subject">${blocks[4] ?? ""}</td>
        </tr>
        `
          : `
          <td class="print__subject">RECESO</td>
          <td class="print__subject">RECESO</td>
          <td class="print__subject">RECESO</td>
          <td class="print__subject">RECESO</td>
          <td class="print__subject">RECESO</td>
        </tr>
        `;

      scheduleReport.appendChild(tr);

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
              <span>
                ${blocks[0] ?? ""}
              </span>
            </div>
            <div class="grid-cell" data-row="${item["BloqueHorarioId"]}">
              <span>
              ${blocks[1] ?? ""}
              </span>
            </div>
            <div class="grid-cell" data-row="${item["BloqueHorarioId"]}">
              <span>
              ${blocks[2] ?? ""}
              </span>
            </div>
            <div class="grid-cell" data-row="${item["BloqueHorarioId"]}">
              <span>
              ${blocks[3] ?? ""}
              </span>
            </div>
            <div class="grid-cell" data-row="${item["BloqueHorarioId"]}">
              <span>
              ${blocks[4] ?? ""}
              </span>
            </div>`
                : `<div class="grid-cell">
              <span>RECESO</span>
            </div>
            <div class="grid-cell">
              <span>RECESO</span>
            </div>
            <div class="grid-cell">
              <span>RECESO</span>
            </div>
            <div class="grid-cell">
              <span>RECESO</span>
            </div>
            <div class="grid-cell">
              <span>RECESO</span>
            </div>`
            }
      `
      );
    }, "");

    emptyState.style.display = "none";
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

        <footer class="action-footer card">
          <div></div>
          <div class="footer-buttons">
            <button class="btn btn-outline" id="btn-pdf">
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
          </div>
        </footer>
    `;
    scheduleContainer.appendChild(scheduleCard);
    highlightCurrentClass();

    document
      .getElementById("btn-pdf")
      .addEventListener("click", () => window.print());
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

document.addEventListener("DOMContentLoaded", async () => {
  // Cargar todas las secciones y períodos académicos
  const loader = document.createElement("loader-spinner");
  const notificationsContainer = document.getElementById("notifications");
  loader.setAttribute("title", "Consultando Datos Escolares...");
  document.body.appendChild(loader);

  try {
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

    // Cargando lista de materias
    const subjectsPromise = await fetch(
      `${window.APP_CONFIG.api_url}/subject/list`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const subjectsResponse = await subjectsPromise.json();
    if (!subjectsPromise.ok) throw new Error(subjectsResponse.message);
    subjects = [...subjectsResponse];

    // Obteniendo último período escolar
    const schoolTermPromise = await fetch(
      `${window.APP_CONFIG.api_url}/school_term/get`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const schoolTermResponse = await schoolTermPromise.json();
    if (!schoolTermPromise.ok) throw new Error(schoolTermResponse.message);

    // Obteniendo ID del docente
    const teacherIdPromise = await fetch(
      `${window.APP_CONFIG.api_url}/teacher/get`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const teacherIdResponse = await teacherIdPromise.json();
    if (!teacherIdPromise.ok) throw new Error(teacherIdResponse.message);
    teacherId = teacherIdResponse.DocenteId;

    // Obteniendo datos de horarios
    const schoolTermId = schoolTermResponse.PeriodoEscolarId || schoolTermResponse.id;
    if (!schoolTermId || schoolTermId === 'undefined') {
        throw new Error("El identificador del período escolar es inválido o no existe un período activo.");
    }

    const schedulePromise = await fetch(
      `${window.APP_CONFIG.api_url}/schedule/list/${schoolTermId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const scheduleResponse = await schedulePromise.json();
    if (!schedulePromise.ok) throw new Error(scheduleResponse.message);
    schedule = [...scheduleResponse].filter(
      (s) => s["DocenteId"] === teacherId,
    );

    updateGrades(schoolTermId);
    sectionField.addEventListener("change", () => {
      filter(
        gradeField.value,
        sectionField.options[sectionField.selectedIndex].textContent,
      );
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

  // Cargando grados
  const gradesPromise = await fetch(
    `${window.APP_CONFIG.api_url}/course/get_all`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  const gradesResponse = await gradesPromise.json();
  if (!gradesPromise.ok) throw new Error(gradesResponse.message);
  courses = [...gradesResponse];
});

const btnBack = document.getElementById("btn-back");
if (btnBack) {
  btnBack.addEventListener("click", (e) => {
    e.preventDefault();
    const url = e.target.closest('a')?.href || e.currentTarget.href;
    document.body.style.animation = "goodByePage 0.8s forwards";
    setTimeout(() => (window.location.href = url), 1000);
  });
}
