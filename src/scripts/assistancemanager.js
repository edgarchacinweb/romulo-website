import authorize from "./auth.js";

authorize("docente");

// Elementos del DOM
const btnLoad = document.getElementById("btnLoad");
const emptyState = document.getElementById("emptyState");
const studentsSection = document.getElementById("studentsSection");
const studentList = document.getElementById("studentList");
const displayClassName = document.getElementById("displayClassName");
const displayDate = document.getElementById("displayDate");
const btnSave = document.getElementById("btnSave");

// Contadores en las pestañas
const countAllSpan = document.getElementById("countAll");
const countPresentSpan = document.getElementById("countPresent");
const countAbsentSpan = document.getElementById("countAbsent");

// Selectores
const subjectSelect = document.getElementById("subjectSelect");
const yearSelect = document.getElementById("yearSelect");
const sectionSelect = document.getElementById("sectionSelect");
const termSelect = document.getElementById("termSelect");
const termDisplay = document.getElementById("termDisplay");
const dateInput = document.getElementById("dateInput");

// Asignar fecha de hoy por defecto al input de fecha (evitando fines de semana)
const today = new Date();
if (today.getDay() === 6) today.setDate(today.getDate() - 1); // Si es sábado, retrocede al viernes
if (today.getDay() === 0) today.setDate(today.getDate() - 2); // Si es domingo, retrocede al viernes

// Convertimos a string en formato YYYY-MM-DD ajustando por la zona horaria local
const localDateStr = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
dateInput.value = localDateStr;

// Estado local
let currentStudents = [];
let currentClassId = "";
let lapsosData = [];
let currentFilter = 'all';
let isAttendanceSaved = false;

// === PREVENCIÓN DE PÉRDIDA DE DATOS ===
window.addEventListener('beforeunload', (event) => {
  if (currentStudents.length > 0 && !isAttendanceSaved) {
    event.preventDefault();
    event.returnValue = 'Tienes cambios sin guardar en la lista de asistencia. ¿Estás seguro de que deseas salir?';
  }
});

// === CARGAR MATERIAS DINÁMICAMENTE DESDE EL BACKEND ===
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const token = localStorage.getItem("auth");
    const apiUrl = window.APP_CONFIG ? window.APP_CONFIG.api_url : 'http://127.0.0.1:5000';

    try {
      const lapsosResponse = await fetch(`${apiUrl}/lapsos/current`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      if (lapsosResponse.ok) {
        const data = await lapsosResponse.json();
        lapsosData = data.lapsos;
        calcularLapsoPorFecha(dateInput.value);
      }
    } catch (error) {
      console.error("Error cargando lapsos:", error);
      if (termDisplay) termDisplay.value = "Error al cargar fechas";
    }

    const response = await fetch(`${apiUrl}/subject/teacher`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error("No se pudieron cargar las materias");

    let subjects = await response.json();

    // Blindaje: Garantizar opciones únicas eliminando duplicados por MateriaId
    const seenSubjectIds = new Set();
    subjects = subjects.filter(subject => {
      if (seenSubjectIds.has(subject.MateriaId)) {
        return false;
      }
      seenSubjectIds.add(subject.MateriaId);
      return true;
    });

    subjectSelect.innerHTML = '<option value="" disabled selected>Elige materia</option>';

    subjects.forEach(subject => {
      const option = document.createElement("option");
      option.dataset.id = subject.MateriaId;
      option.value = subject.Nombre;
      option.textContent = subject.Nombre;
      subjectSelect.appendChild(option);
    });

  } catch (error) {
    console.error("Error cargando materias:", error);
    subjectSelect.innerHTML = '<option value="" disabled selected>Error al cargar materias</option>';
  }
});

// --- FUNCION PARA CALCULAR LAPSO SEGÚN LA FECHA ---
function calcularLapsoPorFecha(fechaStr) {
  if (!fechaStr || lapsosData.length === 0) return;

  const fechaSeleccionada = new Date(fechaStr + "T12:00:00");

  let lapsoEncontrado = null;

  for (const lapso of lapsosData) {
    const inicio = new Date(lapso.fecha_inicio + "T00:00:00");
    const fin = new Date(lapso.fecha_fin + "T23:59:59");

    if (fechaSeleccionada >= inicio && fechaSeleccionada <= fin) {
      lapsoEncontrado = lapso;
      break;
    }
  }

  if (lapsoEncontrado) {
    const nombresLapso = { 1: "1er Lapso", 2: "2do Lapso", 3: "3er Lapso" };
    termDisplay.value = nombresLapso[lapsoEncontrado.lapso] || `${lapsoEncontrado.lapso}° Lapso`;
    termSelect.value = lapsoEncontrado.lapso;
  } else {
    termDisplay.value = "Fecha fuera de periodo";
    termSelect.value = "";
  }
}

// VALIDACIÓN AL CAMBIAR LA FECHA MANUALMENTE
dateInput.addEventListener("change", (e) => {
  if (!e.target.value) {
    termDisplay.value = "";
    termSelect.value = "";
    return;
  }

  // Se añade T12:00:00 para asegurar que el día evaluado corresponde correctamente a la zona local
  const selectedDate = new Date(e.target.value + "T12:00:00");
  const day = selectedDate.getDay();

  // 0 = Domingo, 6 = Sábado
  if (day === 0 || day === 6) {
    alert("🗓️ No se pueden registrar asistencias los fines de semana (Sábado y Domingo). Por favor, selecciona un día de Lunes a Viernes.");
    e.target.value = ""; // Limpia la fecha seleccionada
    termDisplay.value = "";
    termSelect.value = "";
    return;
  }

  calcularLapsoPorFecha(e.target.value);
});

// Evento: Cargar Estudiantes
btnLoad.addEventListener("click", async () => {
  const subjectOption = subjectSelect.options[subjectSelect.selectedIndex];
  const subjectId = subjectOption ? subjectOption.dataset.id : null;
  const subjectName = subjectSelect.value;

  const year = yearSelect.value;
  const section = sectionSelect.value;
  const term = termSelect.value;
  const termName = termDisplay.value;
  const selectedDate = dateInput.value;

  if (!subjectId || !year || !section || term === "" || !selectedDate) {
    alert("Por favor, selecciona la materia, año, sección y verifica que la fecha elegida sea un día laborable y pertenezca a un lapso válido.");
    return;
  }

  const sectionMap = { "A": 1, "B": 2, "C": 3, "D": 4, "E": 5 };
  const sectionNum = sectionMap[section] || 1;

  try {
    const token = localStorage.getItem("auth");
    const apiUrl = window.APP_CONFIG ? window.APP_CONFIG.api_url : 'http://127.0.0.1:5000';

    // --- AQUÍ ESTÁ LA CLAVE: ENVIAMOS LA FECHA EN LA URL ---
    const response = await fetch(`${apiUrl}/assistance/students?materiaId=${subjectId}&year=${year}&section=${sectionNum}&term=${term}&fecha=${selectedDate}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      currentClassId = data.ClaseId;

      // --- CAPTURAMOS SI LA ASISTENCIA ESTÁ GUARDADA ---
      isAttendanceSaved = data.AsistenciaCargada || false;

      currentStudents = data.estudiantes.map(e => ({
        id: e.EstudianteId,
        name: `${e.Nombre} ${e.Apellido || ""}`.trim(),
        present: e.Presente !== undefined ? e.Presente : null, // Mapea desde la BD o queda en null
        justification: e.Justificacion || ""
      }));

      if (currentStudents.length === 0) {
        alert("Al parecer no hay estudiantes inscritos en esta sección todavía.");
      }

    } else {
      const errorData = await response.json();
      alert(`⚠️ Acción denegada:\n${errorData.message}`);

      emptyState.classList.remove("hidden");
      studentsSection.classList.add("hidden");
      return;
    }
  } catch (error) {
    console.error("Error de red al obtener clase:", error);
    alert("Hubo un error de conexión intentando verificar tus clases asignadas.");
    return;
  }

  // --- CONFIGURAR UI SEGÚN EL ESTADO RECUPERADO DE LA BD ---
  if (isAttendanceSaved) {
    if (btnSave) {
      btnSave.disabled = true;
      btnSave.innerHTML = `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
              </svg> 
              Asistencia Cargada
          `;
      btnSave.style.backgroundColor = "#10b981";
      btnSave.style.borderColor = "#10b981";
      btnSave.style.color = "white";
      btnSave.style.cursor = "not-allowed";
    }
    const bulkActions = document.querySelector('.bulk-actions-small');
    if (bulkActions) bulkActions.style.display = 'none';
  } else {
    if (btnSave) {
      btnSave.disabled = false;
      btnSave.style = "";
      btnSave.innerHTML = `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Guardar Asistencia
          `;
    }
    const bulkActions = document.querySelector('.bulk-actions-small');
    if (bulkActions) bulkActions.style.display = 'flex';
  }

  // Actualizar Títulos de la Interfaz
  displayClassName.textContent = `${subjectName} - ${year} "${section}"`;

  const dateObj = new Date(dateInput.value);
  dateObj.setMinutes(dateObj.getMinutes() + dateObj.getTimezoneOffset());
  const formattedDate = dateObj.toLocaleDateString("es-ES", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  displayDate.textContent = `${termName} | ${formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}`;

  emptyState.classList.add("hidden");
  studentsSection.classList.remove("hidden");

  // Resetear la pestaña a "Todos" por defecto al cargar
  setFilter('all');
});

// Función para cambiar de Pestaña
window.setFilter = (filter) => {
  currentFilter = filter;

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.tab === filter) {
      btn.classList.add('active');
    }
  });

  renderStudents();
};

function renderStudents() {
  studentList.innerHTML = "";

  const filteredStudents = currentStudents.map((student, index) => ({ ...student, originalIndex: index }))
    .filter(student => {
      if (currentFilter === 'present') return student.present === true;
      if (currentFilter === 'absent') return student.present === false;
      return true;
    });

  if (filteredStudents.length === 0) {
    studentList.innerHTML = `
      <div style="text-align:center; padding: 40px 20px; color:#64748b; background:#f8fafc; border-radius:8px; border: 1px dashed #cbd5e1;">
        No hay estudiantes en esta categoría actualmente.
      </div>
    `;
    updateStats();
    return;
  }

  filteredStudents.forEach((student) => {
    const row = document.createElement("div");
    row.className = "student-row";

    let statusBadge = `<span class="student-status-badge" style="background:#f1f5f9; color:#64748b;">Pendiente</span>`;
    if (student.present === true) {
      statusBadge = `<span class="student-status-badge" style="background:#dcfce7; color:#166534;">Presente</span>`;
    } else if (student.present === false) {
      if (student.justification && student.justification.trim() !== "") {
        statusBadge = `<span class="student-status-badge" style="background:#fef3c7; color:#92400e;">Justificado</span>`;
      } else {
        statusBadge = `<span class="student-status-badge" style="background:#fee2e2; color:#991b1b;">Ausente</span>`;
      }
    }

    const disabledStyle = isAttendanceSaved ? 'opacity: 0.6; cursor: not-allowed;' : '';

    row.innerHTML = `
        <div class="student-header">
            <div class="student-info">
                <span class="student-name">${student.name}</span>
                ${statusBadge}
            </div>
            
            <div class="mark-buttons">
                <button class="btn-mark present ${student.present === true ? 'active' : ''}" 
                        onclick="markStudent(${student.originalIndex}, true)" 
                        ${isAttendanceSaved ? 'disabled' : ''} 
                        style="${disabledStyle}">
                    ✔️ Presente
                </button>
                <button class="btn-mark absent ${student.present === false && (!student.justification) ? 'active' : ''}" 
                        onclick="markStudent(${student.originalIndex}, false)" 
                        ${isAttendanceSaved ? 'disabled' : ''} 
                        style="${disabledStyle}">
                    ❌ Ausente
                </button>
                <button class="btn-mark" 
                        onclick="markJustified(${student.originalIndex})"
                        ${isAttendanceSaved ? 'disabled' : ''} 
                        style="${disabledStyle}; ${student.present === false && student.justification ? 'background: #fef3c7; border-color: #f59e0b; color: #92400e;' : ''}">
                    📄 Justificar
                </button>
            </div>
        </div>
        
        ${student.present === false ? `
        <div style="width: 100%; margin-top: 10px;">
            <input type="text" 
                   class="justification-input" 
                   placeholder="Escribe el motivo de la inasistencia (opcional)" 
                   value="${student.justification || ''}" 
                   onchange="updateJustification(${student.originalIndex}, this.value)"
                   ${isAttendanceSaved ? 'readonly' : ''}
                   style="${isAttendanceSaved ? 'background-color: #f1f5f9; cursor: not-allowed;' : ''}">
        </div>` : ''}
    `;

    studentList.appendChild(row);
  });

  updateStats();
}

window.markStudent = (index, status) => {
  if (isAttendanceSaved) return;

  currentStudents[index].present = status;
  if (status === true) {
    currentStudents[index].justification = "";
  } else {
    // Si marcamos ausente a secas, limpiamos justificación previa si la hubiera
    currentStudents[index].justification = "";
  }
  renderStudents();
};

window.markJustified = (index) => {
  if (isAttendanceSaved) return;

  currentStudents[index].present = false;
  // Pedimos justificación rápida o dejamos texto por defecto
  const reason = prompt("Ingrese el motivo del justificativo:", currentStudents[index].justification || "");
  if (reason !== null) {
    currentStudents[index].justification = reason.trim() || "Justificado por Docente";
    renderStudents();
  }
};

window.updateJustification = (index, value) => {
  if (isAttendanceSaved) return;
  currentStudents[index].justification = value;
};

function updateStats() {
  const presentCount = currentStudents.filter((s) => s.present === true).length;
  const absentCount = currentStudents.filter((s) => s.present === false).length;

  if (countPresentSpan) countPresentSpan.textContent = presentCount;
  if (countAbsentSpan) countAbsentSpan.textContent = absentCount;
  if (countAllSpan) countAllSpan.textContent = currentStudents.length;
}

window.markAll = (status) => {
  if (isAttendanceSaved) return;

  currentStudents.forEach((s) => {
    s.present = status;
    if (status === true) s.justification = "";
  });
  renderStudents();
};

if (btnSave) {
  btnSave.addEventListener("click", async () => {
    if (isAttendanceSaved) return;

    const estudiantesPendientes = currentStudents.filter(s => s.present === null);
    if (estudiantesPendientes.length > 0) {
      alert(`⚠️ Faltan ${estudiantesPendientes.length} estudiantes por evaluar.\n\nPor favor, marca si están Presentes o Ausentes antes de guardar la asistencia.`);
      setFilter('all');
      return;
    }

    if (currentClassId === "123e4567-e89b-12d3-a456-426614174000") {
      alert("Advertencia: Se utilizará un ID de clase genérico debido a que la tabla 'Clase' podría no estar completamente configurada en su base de datos, pero la asistencia será procesada.");
    }

    // --- ENVIAMOS LA FECHA TAMBIÉN AL GUARDAR ---
    const payload = {
      ClaseId: currentClassId,
      Fecha: dateInput.value,
      EstudianteId: currentStudents.map(s => s.id),
      Activo: currentStudents.map(s => s.present),
      Justificacion: currentStudents.map(s => s.present ? "" : (s.justification || "Sin justificar"))
    };

    try {
      const token = localStorage.getItem("auth") || "TU_TOKEN_AQUI";
      const apiUrl = window.APP_CONFIG ? window.APP_CONFIG.api_url : 'http://127.0.0.1:5000';

      const response = await fetch(`${apiUrl}/assistance/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 201) {
        alert("¡Asistencia guardada exitosamente!");

        isAttendanceSaved = true;

        btnSave.disabled = true;
        btnSave.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg> 
            Asistencia Cargada
        `;
        btnSave.style.backgroundColor = "#10b981";
        btnSave.style.borderColor = "#10b981";
        btnSave.style.color = "white";
        btnSave.style.cursor = "not-allowed";

        const bulkActions = document.querySelector('.bulk-actions-small');
        if (bulkActions) bulkActions.style.display = 'none';

        renderStudents();

      } else {
        const errorData = await response.json();
        alert(`Error al guardar: ${errorData.message || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error("Error en la petición:", error);
      alert("Error de conexión al guardar la asistencia.");
    }
  });
}