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
let schedule = [];
let courses = [];
let termList = [];
let selectedTerm = undefined;
let isEditingMode = true;

const toggleEditMode = (enable) => {
  isEditingMode = enable;
  const selectPills = document.querySelectorAll(".select-subject");
  const teacherSelectors = document.querySelectorAll(".teacher-selector");
  const btnSubmit = document.getElementById("btn-submit");
  const btnEdit = document.getElementById("btn-edit-schedule");

  const btnCancel = document.getElementById("btn-cancel");

  selectPills.forEach((s) => (s.disabled = !enable));
  teacherSelectors.forEach((s) => (s.disabled = !enable));

  if (btnSubmit) btnSubmit.style.display = enable ? "flex" : "none";
  if (btnCancel) btnCancel.style.display = enable ? "flex" : "none";
  if (btnEdit) btnEdit.style.display = enable ? "none" : "flex";
};

const updateHomeroomInfo = () => {
  const gradeField = document.getElementById("gradeField");
  const sectionField = document.getElementById("sectionField");
  const infoCard = document.getElementById("section-info-card");
  const nameDisplay = document.getElementById("homeroom-teacher-name");
  const gradeLabel = document.getElementById("grade-label");
  const sectionLabel = document.getElementById("section-label");

  if (!gradeField.value || !sectionField.value) {
    infoCard.style.display = "none";
    return;
  }

  // Encontrar el grado seleccionado
  const selectedGrade = Array.from(gradeField.options).find(o => o.value === gradeField.value)?.text || "-";
  // Convertir sección numérica a letra
  const sectionLetter = Number(sectionField.value) > 0 ? numberToLetter(Number(sectionField.value)) : "-";

  gradeLabel.textContent = `${selectedGrade}° Año`;
  sectionLabel.textContent = `Sección ${sectionLetter}`;

  // Encontrar el ID de "ORIENTACION Y CONVIVENCIA"
  const orientacionSubject = subjects.find(s =>
    s.Nombre.toUpperCase().includes("ORIENTACION") &&
    s.Nombre.toUpperCase().includes("CONVIVENCIA")
  );

  if (orientacionSubject) {
    const teacherSelector = document.querySelector(`.teacher-selector[data-subject="${orientacionSubject.MateriaId}"]`);
    if (teacherSelector && teacherSelector.value) {
      const selectedOption = teacherSelector.options[teacherSelector.selectedIndex];
      nameDisplay.textContent = selectedOption.text;
    } else {
      nameDisplay.textContent = "No asignado";
    }
    infoCard.style.display = "block";
  } else {
    infoCard.style.display = "none";
  }
};
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

const loadAdminStatus = async () => {
  const alertPanel = document.getElementById("alert-panel");
  if (!alertPanel) return;

  try {
    const response = await fetch(`${window.APP_CONFIG.api_url}/schedule/admin/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const statusData = await response.json();
    if (!response.ok) throw new Error(statusData.message);

    // Filtrar secciones que necesitan atención (15+ alumnos e Incompleto/Vacio)
    const pendingSections = statusData.filter(
      (s) => s.Alumnos >= 15 && (s.Estatus === "Vacio" || s.Estatus === "Incompleto")
    );

    if (pendingSections.length === 0) {
      alertPanel.style.display = "none";
      return;
    }

    alertPanel.style.display = "flex";
    alertPanel.innerHTML = `
      <div class="alert-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <div class="alert-content">
        <p><strong>Atención Administrativa:</strong> Las siguientes secciones ya cumplen el mínimo de alumnos pero tienen horarios pendientes:</p>
        <div class="alert-chips">
          ${pendingSections
        .map(
          (s) => `
            <div class="alert-chip ${s.Estatus.toLowerCase()}" onclick="document.getElementById('gradeField').value='${s.CursoId}'; document.getElementById('gradeField').dispatchEvent(new Event('change')); setTimeout(()=>{document.getElementById('sectionField').value='${s.Seccion}'; document.getElementById('sectionField').dispatchEvent(new Event('change'))}, 500)">
              ${s.Grado}° Año "${s.SeccionLetra}" - ${s.Estatus} (${s.Alumnos} alumnos)
            </div>
          `
        )
        .join("")}
        </div>
      </div>
    `;
  } catch (err) {
    console.error("Error al cargar estatus administrativo:", err);
  }
};

const renderTeacherSelector = (assignedSubjects) => {
  const termId = termList[0] ? (termList[0]["PeriodoEscolarId"] || termList[0]["id"]) : undefined;
  const canEdit = selectedTerm === termId;
  const disabledValue = (canEdit && isEditingMode) ? "" : " disabled";

  const tableList = document.getElementById("table-list");
  tableList.querySelectorAll(".table-row").forEach((r) => r.remove());

  assignedSubjects.forEach((subject) => {
    const foundSubject = subjects.find((s) => s["MateriaId"] === subject);
    const subjectName = foundSubject ? foundSubject["Nombre"] : "Materia Desactivada";
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
        <select class="select-gray teacher-selector" data-subject="${subject}"${disabledValue}>
          ${teachersList.reduce((prev, current) => prev + `<option value="${current["DocenteId"]}">${current["DatosPersona"]["Nombre"]} ${current["DatosPersona"]["Apellido"]}</option>`, "")}
        </select>
      </div>
      `;

    tableList.appendChild(tableItem);
  });

  // Listener para actualización dinámica del Profesor Guía
  const orientacionSubject = subjects.find(s =>
    s.Nombre.toUpperCase().includes("ORIENTACION") &&
    s.Nombre.toUpperCase().includes("CONVIVENCIA")
  );

  if (orientacionSubject) {
    const selector = document.querySelector(`.teacher-selector[data-subject="${orientacionSubject.MateriaId}"]`);
    if (selector) {
      selector.addEventListener("change", updateHomeroomInfo);
    }
  }
  updateHomeroomInfo();
};

const exportToPdf = async (grade, section) => {
  const course = courses.find((c) => c["CursoId"] === grade)["Grado"];
  document.querySelector(".print__grade").textContent =
    `${course}° Año - Sección ${section}`;
  const scheduleReport = document.querySelectorAll(".print__schedule-data");
  scheduleReport[0].innerHTML = "";

  scheduleBlocks.forEach((item, index) => {
    const minutes = calcMinutesDifferences(item["HoraInicio"], item["HoraFin"]);
    const selectedBlock = schedule.filter(
      (s) =>
        s["CursoId"] === grade &&
        s["Seccion"] === parseInt(section) &&
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
          <td class="print__subject">${blocks[0] ?? "LIBRE"}</td>
          <td class="print__subject">${blocks[1] ?? "LIBRE"}</td>
          <td class="print__subject">${blocks[2] ?? "LIBRE"}</td>
          <td class="print__subject">${blocks[3] ?? "LIBRE"}</td>
          <td class="print__subject">${blocks[4] ?? "LIBRE"}</td>
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

    scheduleReport[0].appendChild(tr);
  });

  // agregando docentes
  const selectedSchedule = schedule.filter(
    (s) => s["CursoId"] === grade && s["Seccion"] === parseInt(section),
  );
  scheduleReport[1].innerHTML = "";
  const selectedTeachers = [];
  selectedSchedule.forEach((s) => {
    if (
      !selectedTeachers.find(
        (t) =>
          t["DocenteId"] === s["DocenteId"] &&
          t["MateriaId"] === s["MateriaId"],
      )
    )
      selectedTeachers.push(s);
  });

  selectedTeachers.forEach((t) => {
    const subjectName = subjects.find((s) => s["MateriaId"] === t["MateriaId"])[
      "Nombre"
    ];

    const selectedTeacher = teachers.find(
      (teacher) => teacher["DocenteId"] === t["DocenteId"],
    );

    const tableItem = document.createElement("tr");

    tableItem.innerHTML = `
    <tr>
      <td class="print__subject-teacher">${subjectName}</td>
      <td class="print__teacher">${selectedTeacher["DatosPersona"]["Nombre"]} ${selectedTeacher["DatosPersona"]["Apellido"]}</td>
      <td class="print__subject">V-${selectedTeacher["DatosPersona"]["Cedula"]}</td>
    </tr>
    `;

    scheduleReport[1].appendChild(tableItem);
  });

  window.print();
};

const filter = async (grade, section) => {
  const loader = document.createElement("loader-spinner");
  loader.setAttribute("title", "Cargando horario...");
  const notifications = document.getElementById("notifications");

  // Verificar cantidad de estudiantes antes de cargar la grilla
  try {
    const statusResponse = await fetch(`${window.APP_CONFIG.api_url}/schedule/admin/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const statusData = await statusResponse.json();
    const currentSection = statusData.find(s => s.CursoId === grade && s.Seccion == section);

    if (currentSection && currentSection.Alumnos < (window.APP_CONFIG.min_students || 15)) {
      emptyState.style.display = "flex";
      emptyState.innerHTML = `
        <div class="warning-banner">
          <div class="warning-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            </svg>
          </div>
          <h3>Sección con cupos insuficientes</h3>
          <p>Esta sección cuenta actualmente con <strong>${currentSection.Alumnos}</strong> estudiantes inscritos. Se requiere un mínimo de <strong>15</strong> para proceder con la asignación de horarios.</p>
          <p class="small"></p>
        </div>
      `;
      if (document.getElementById("results-container")) {
        document.getElementById("results-container").innerHTML = "";
      }
      return;
    }
  } catch (err) {
    console.error("Error validando estudiantes:", err);
  }

  try {
    const termId = termList[0] ? (termList[0]["PeriodoEscolarId"] || termList[0]["id"]) : undefined;
    const canEdit = selectedTerm === termId;
    const disabledValue = (canEdit && isEditingMode) ? "" : " disabled";
    const courseGrade = courses.find((c) => c["CursoId"] === grade)?.["Grado"];

    const options = subjects
      .filter((s) => {
        const hsInfo = s.HorasPorCurso?.find(hc => hc.Grado === courseGrade);
        return hsInfo && parseInt(hsInfo.HorasAcademicas || 0) > 0;
      })
      .reduce((prev, element) => {
        return (
          prev +
          `
        <option value="${element["MateriaId"]}">${element["Nombre"]}</option>
      `
        );
      }, '<option value="">Sin asignar</option>');

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
            ${minutes > 15
          ? `<div class="grid-cell" data-row="${item["BloqueHorarioId"]}">
              <select class="select-pill select-subject Lunes"${disabledValue}>
                ${options}
              </select>
            </div>
            <div class="grid-cell" data-row="${item["BloqueHorarioId"]}">
              <select class="select-pill select-subject Martes"${disabledValue}>
                ${options}
              </select>
            </div>
            <div class="grid-cell" data-row="${item["BloqueHorarioId"]}">
              <select class="select-pill select-subject Miércoles"${disabledValue}>
                ${options}
              </select>
            </div>
            <div class="grid-cell" data-row="${item["BloqueHorarioId"]}">
              <select class="select-pill select-subject Jueves"${disabledValue}>
                ${options}
              </select>
            </div>
            <div class="grid-cell" data-row="${item["BloqueHorarioId"]}">
              <select class="select-pill select-subject Viernes"${disabledValue}>
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
            ${canEdit
        ? `
              <button class="btn btn-primary" id="btn-submit" style="display: ${isEditingMode ? 'flex' : 'none'};">
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
              Guardar Horario
            </button>
            <button class="btn btn-secondary" id="btn-cancel" style="display: ${isEditingMode ? 'flex' : 'none'};">
              Cancelar
            </button>
            <button class="btn btn-secondary" id="btn-edit-schedule" style="display: ${isEditingMode ? 'none' : 'flex'};">
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
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Editar Horario
            </button>
              `
        : ""
      }
          </div>
        </footer>
    `;
    if (!document.getElementById("results-container"))
      document.querySelector(".container").appendChild(scheduleContainer);
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
          if (select) {
            const option = select.querySelector(`[value="${data["MateriaId"]}"]`);
            if (option) {
              option.setAttribute("selected", "selected");
            }
          }
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

    teachers = [...teachersAnswer].filter((t) => t["Activo"]);

    let assignedSubjects = Array.from(
      new Set(
        schedule
          .filter((s) => s["Seccion"] == section && s["CursoId"] === grade)
          .map((s) => s["MateriaId"]),
      ),
    );

    renderTeacherSelector(assignedSubjects);

    const selectPills = document.querySelectorAll(".select-subject");
    selectPills.forEach((select) =>
      select.addEventListener("change", () => {
        assignedSubjects = Array.from(
          new Set(Array.from(selectPills).map((sp) => sp.value)),
        ).filter((a) => a !== "");
        renderTeacherSelector(assignedSubjects);
      }),
    );

    // -- Guardando Horario
    if (document.getElementById("btn-submit")) {
      document
        .getElementById("btn-submit")
        .addEventListener("click", async () => {
          loader.setAttribute("title", "Guardando horario...");
          document.body.appendChild(loader);

          const updatedSchedule = [];
          document.querySelectorAll(".select-subject").forEach((s) => {
            const scheduleBlockId = s.parentElement.getAttribute("data-row");

            if (s.value === "") {
              updatedSchedule.push({
                CursoId: grade,
                BloqueHorarioId: scheduleBlockId,
                DocenteId: "sin_asignar",
                MateriaId: "sin_asignar",
                Seccion: section,
                Dia: s.classList[2],
              });
              return;
            }

            const teacherNode = document.querySelector(`[data-subject="${s.value}"]`);
            const teacher = teacherNode ? teacherNode.value : null;

            updatedSchedule.push({
              CursoId: grade,
              BloqueHorarioId: scheduleBlockId,
              DocenteId: teacher,
              MateriaId: s.value,
              Seccion: section,
              Dia: s.classList[2],
            });
          });

          const notification = document.createElement("notification-component");

          try {
            if (updatedSchedule.length === 0) {
              throw new Error("No puedes guardar un horario completamente vacío.");
            }

            const currentSectionSchedule = updatedSchedule;
            const otherSectionsSchedule = schedule.filter(s => s["CursoId"] !== grade || s["Seccion"] !== parseInt(section));
            console.log(subjects);

            updatedSchedule.forEach((us) => {
              if (us["MateriaId"] === "sin_asignar") return;

              if (!us["DocenteId"] || us["DocenteId"] === "") {
                const subjectName = subjects.find(s => s["MateriaId"] === us["MateriaId"])?.Nombre || "Materia desconocida";
                throw new Error(`Debe asignar un docente para la materia ${subjectName}`);
              }
              const repeatedElement = schedule.find(
                (s) =>
                  s["BloqueHorarioId"] === us["BloqueHorarioId"] &&
                  s["Dia"] === us["Dia"] &&
                  s["DocenteId"] === us["DocenteId"] &&
                  s["CursoId"] !== us["CursoId"] &&
                  s["Seccion"] !== us["Seccion"],
              );

              const teacher = teachers.find(
                (t) => t["DocenteId"] === us["DocenteId"],
              );

              if (repeatedElement) {
                const block = scheduleBlocks.find(
                  (sb) =>
                    sb["BloqueHorarioId"] ===
                    repeatedElement["BloqueHorarioId"],
                );
                throw new Error(
                  `El docente ${teacher["DatosPersona"]["Nombre"]} ${teacher["DatosPersona"]["Apellido"]} ya imparte clases el ${repeatedElement["Dia"]} a las ${block["HoraInicio"]} en otro horario.`,
                );

                // Comprobar horas semanales de la materia
              }

              const academicHours = teachers.find(
                (t) => t["DocenteId"] === us["DocenteId"],
              )["HorasAcademicas"];

              const teacherHours = [...otherSectionsSchedule, ...currentSectionSchedule].filter(
                (t) => t["DocenteId"] === us["DocenteId"],
              ).length;

              if (teacherHours > academicHours) {
                throw new Error(
                  `El docente ${teacher["DatosPersona"]["Nombre"]} ${teacher["DatosPersona"]["Apellido"]} superó su límite de horas académicas semanales`,
                );
              }

              const subjectHoursInThisSection = currentSectionSchedule.filter(
                (s) => s["MateriaId"] === us["MateriaId"]
              ).length;

              if (subjectHoursInThisSection > 4) {
                const subjectName = subjects.find(s => s["MateriaId"] === us["MateriaId"])?.Nombre || "Materia";
                throw new Error(
                  `La materia ${subjectName} no puede exceder los 4 bloques semanales.`,
                );
              }
            });

            const updateSchedulePromise = await fetch(
              `${window.APP_CONFIG.api_url}/schedule/create`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(updatedSchedule),
              },
            );

            if (!updateSchedulePromise.ok) {
              const updateScheduleResponse = await updateSchedulePromise.json();
              throw new Error(updateScheduleResponse.message);
            }

            const responseData = await updateSchedulePromise.json();
            schedule = [...responseData];

            const notification = document.createElement(
              "notification-component",
            );
            notification.setAttribute("type", "success");
            notification.setAttribute(
              "text",
              "¡Horario Guardado Correctamente!",
            );
            notifications.appendChild(notification);
            toggleEditMode(false);
          } catch (Error) {
            console.error(Error.stack);
            notification.setAttribute("type", "error");
            notification.setAttribute("text", Error.message);
          } finally {
            notifications.appendChild(notification);
            loader.remove();
          }
        });
    }

    if (document.getElementById("btn-cancel")) {
      document.getElementById("btn-cancel").addEventListener("click", () => {
        isEditingMode = false;
        filter(grade, section);
      });
    }

    document
      .getElementById("btn-pdf")
      .addEventListener("click", () => exportToPdf(grade, section));

    if (selectedSchedule.length > 0) {
      toggleEditMode(false);
    } else {
      toggleEditMode(true);
    }

    if (document.getElementById("btn-edit-schedule")) {
      document.getElementById("btn-edit-schedule").addEventListener("click", () => {
        toggleEditMode(true);
      });
    }
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
    newSectionOption.setAttribute("value", i);
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

  const seenGrades = new Set();
  sections.forEach((s) => {
    if (!seenGrades.has(s["CursoId"])) {
      seenGrades.add(s["CursoId"]);
      const newGradeOption = document.createElement("option");
      newGradeOption.setAttribute("value", s["CursoId"]);
      newGradeOption.textContent = s["Grado"];
      gradeField.appendChild(newGradeOption);
    }
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
      document.getElementById("results-container").remove();
    document.getElementById("empty-state").style.display = "flex";
    gradeField.setAttribute("disabled", "");
    sectionField.setAttribute("disabled", "");
    throw error;
  } else {
  }

  if (gradeField.getAttribute("disabled") !== null) {
    gradeField.removeAttribute("disabled");
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
  const termNameDisplay = document.getElementById("termNameDisplay");

  const loader = document.createElement("loader-spinner");
  const notificationsContainer = document.getElementById("notifications");
  loader.setAttribute("title", "Consultado Datos Escolares...");
  document.body.appendChild(loader);

  try {
    await updateGrades();

    const termResponse = await fetch(
      `${window.APP_CONFIG.api_url}/school_term/get`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const term = await termResponse.json();
    if (!termResponse.ok) throw new Error(term.message);

    // El sistema ahora solo maneja el período activo
    termList = [term];
    const termId = term["PeriodoEscolarId"] || term["id"];
    const termName = `${new Date(term["FechaInicio"]).getFullYear()} - ${new Date(term["FechaFin"]).getFullYear()}`;

    termField.value = termId;
    if (termNameDisplay) {
      termNameDisplay.value = termName;
    }

    selectedTerm = termId;
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

    // Cargar estatus administrativo
    await loadAdminStatus();
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
    async () => {
      await filter(gradeField.value, sectionField.value);
      updateHomeroomInfo();
    },
  );

  gradeField.addEventListener("change", updateHomeroomInfo);

  await loadSchedules(
    termField.value,
    termNameDisplay ? termNameDisplay.value : "Actual",
  );
});

const btnBack = document.getElementById("btn-back");
if (btnBack) {
  btnBack.addEventListener("click", (e) => {
    e.preventDefault();
    const url = e.target.href;
    document.body.style.animation = "goodByePage 0.8s forwards";
    setTimeout(() => (window.location.href = url), 1000);
  });
}
