import authorize from "./auth.js";
import numberToLetter from "./utils.js";

authorize("representante");

const token = localStorage.getItem("auth");
const emptyState = document.getElementById("empty-state");
const scheduleContainer = document.getElementById("results-container");
const studentField = document.getElementById("studentField");
const scheduleCard = document.createElement("section");
let scheduleBlocks = [];
let subjects = [];
let teachers = [];
let students = [];
let schedule = [];
let courses = [];
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

const loadSchedules = async (term, period) => {
  const loader = document.createElement("loader-spinner");
  const notification = document.createElement("notification-component");
  const notifications = document.getElementById("notifications");
  document.body.appendChild(loader);

  try {
    const scheduleResponse = await fetch(
      `${window.APP_CONFIG.api_url}/schedule/list/${term}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const scheduleAnswer = await scheduleResponse.json();
    if (!scheduleResponse.ok) throw new Error(scheduleAnswer.message);

    schedule = [...scheduleAnswer];
    notification.setAttribute("type", "success");
    notification.setAttribute(
      "text",
      `Horarios Cargados del Período Escolar ${period}.`,
    );
  } catch (Error) {
    console.error(Error.stack);
    notification.setAttribute("type", "error");
    notification.setAttribute("text", Error.message);
  } finally {
    notifications.appendChild(notification);
    loader.remove();
  }
};

const renderTeacherSelector = (assignedSubjects) => {
  const tableList = document.getElementById("table-list");
  tableList.querySelectorAll(".table-row").forEach((r) => r.remove());

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
        <select class="select-gray teacher-selector" data-subject="${subject}">
          ${teachersList.reduce((prev, current) => prev + `<option value="${current["DocenteId"]}">${current["DatosPersona"]["Nombre"]} ${current["DatosPersona"]["Apellido"]}</option>`, "")}
        </select>
      </div>
      `;

    tableList.appendChild(tableItem);
  });
};

const filter = async (grade, section) => {
  const loader = document.createElement("loader-spinner");
  loader.setAttribute("title", "Cargando horario...");
  const notifications = document.getElementById("notifications");

  try {
    const courseId = courses.find((c) => c["Grado"] === grade)["CursoId"];
    const scheduleRows = scheduleBlocks.reduce((prev, item, index) => {
      const minutes = calcMinutesDifferences(
        item["HoraInicio"],
        item["HoraFin"],
      );
      console.log(subjects);

      const scheduleSubjects = schedule.filter(
        (s) =>
          s["CursoId"] === courseId &&
          s["Seccion"] ===
            ["A", "B", "C", "D", "E", "F"].indexOf(section) + 1 &&
          s["BloqueHorarioId"] === item["BloqueHorarioId"],
      );
      // console.log(scheduleSubjects);
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
              <span>${subjects.find((s) => s["MateriaId"] === scheduleSubjects.find((s) => s["Dia"] === "Lunes")["MateriaId"])["Nombre"]}</span>
            </div>
            <div class="grid-cell" data-row="${item["BloqueHorarioId"]}">
              <span></span>
            </div>
            <div class="grid-cell" data-row="${item["BloqueHorarioId"]}">
              <span></span>
            </div>
            <div class="grid-cell" data-row="${item["BloqueHorarioId"]}">
              <span></span>
            </div>
            <div class="grid-cell" data-row="${item["BloqueHorarioId"]}">
              <span></span>
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
            <button class="btn btn-primary" id="btn-submit">
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

    const selectedSchedule = schedule.filter(
      (s) => s["Seccion"] === parseInt(section) && s["CursoId"] === grade,
    );

    scheduleBlocks.forEach((sb) => {
      const id = sb["BloqueHorarioId"];
      const row = document.querySelectorAll(`[data-row="${id}"]`);
      row.forEach((r, index) => {
        const data = selectedSchedule.find(
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

    let assignedSubjects = Array.from(
      new Set(
        schedule
          .filter((s) => s["Seccion"] == section && s["CursoId"] === grade)
          .map((s) => s["MateriaId"]),
      ),
    );

    renderTeacherSelector(assignedSubjects);
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
  // Referencias a los elementos del DOM
  const emptyState = document.getElementById("empty-state");
  const notifications = document.getElementById("notifications");
  const resultsContainer = document.getElementById("results-container");
  const blocks = [];
  const teachers = [];

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

    const parentPromise = await fetch(
      `${window.APP_CONFIG.api_url}/people/get`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const parentResponse = await parentPromise.json();
    if (!parentPromise.ok) throw new Error(parentResponse.message);

    const studentsPromise = await fetch(
      `${window.APP_CONFIG.api_url}/students/by_parent/${parentResponse["DatosPersonaId"]}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const studentsResponse = await studentsPromise.json();
    if (!studentsPromise.ok) throw new Error(studentsResponse.message);

    students = [...studentsResponse];
    studentField.innerHTML = `<option value="">Selecciona un Estudiante</option>`;
    students.forEach((student) => {
      const option = document.createElement("option");
      option.setAttribute("value", student["EstudianteId"]);
      option.textContent = `${student["DatosPersona"]["Nombre"]} ${student["DatosPersona"]["Apellido"]} - ${student["DatosPersona"]["Cedula"]}`;
      studentField.appendChild(option);
    });

    // Obteniendo datos de horarios
    const schedulePromise = await fetch(
      `${window.APP_CONFIG.api_url}/schedule/list/${students[0]["Curso"]["PeriodoEscolarId"]}`,
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
    schedule = [...scheduleResponse];
  } catch (Error) {
    console.error(Error.stack);
    const notification = document.createElement("notification-component");
    notification.setAttribute("type", "error");
    notification.setAttribute("text", Error.message);
    notificationsContainer.appendChild(notification);
  } finally {
    loader.remove();
  }

  studentField.addEventListener("change", () => {
    const studentId = studentField.value;
    const student = students.find((s) => s["EstudianteId"] === studentId);

    console.log(student["Curso"]["Grado"], student["Curso"]["Seccion"]);
    filter(student["Curso"]["Grado"], student["Curso"]["Seccion"]);
  });

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

document.getElementById("btn-back").addEventListener("click", (e) => {
  e.preventDefault();
  const url = e.target.href;
  document.body.style.animation = "goodByePage 0.8s forwards";
  setTimeout(() => (window.location.href = url), 1000);
});
