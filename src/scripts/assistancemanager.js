import authorize from "./auth.js";

authorize("docente");

// Datos simulados (Mock Data) de Estudiantes - Luego haremos esto dinámico también
const studentsData = [
  { id: "A001", name: "Juan Carlos Pérez", present: true, justification: "" },
  { id: "A002", name: "María García López", present: true, justification: "" },
  { id: "A003", name: "Carlos Rodríguez Sánchez", present: true, justification: "" },
  { id: "A004", name: "Ana Martínez Ruiz", present: false, justification: "Cita médica" },
  { id: "A005", name: "Felipe Díaz Morales", present: false, justification: "" },
  { id: "A006", name: "Lucia Fernández Castro", present: true, justification: "" },
];

// Elementos del DOM
const btnLoad = document.getElementById("btnLoad");
const emptyState = document.getElementById("emptyState");
const studentsSection = document.getElementById("studentsSection");
const studentList = document.getElementById("studentList");
const displayClassName = document.getElementById("displayClassName");
const displayDate = document.getElementById("displayDate");
const presentCountSpan = document.getElementById("presentCount");
const totalCountSpan = document.getElementById("totalCount");
const btnSave = document.getElementById("btnSave"); 

// Selectores
const subjectSelect = document.getElementById("subjectSelect");
const yearSelect = document.getElementById("yearSelect");
const sectionSelect = document.getElementById("sectionSelect");
const termSelect = document.getElementById("termSelect");
const dateInput = document.getElementById("dateInput");

// Asignar fecha de hoy por defecto al input de fecha
dateInput.valueAsDate = new Date();

// Estado local
let currentStudents = [];
let currentClassId = ""; 

// === NUEVO: CARGAR MATERIAS DINÁMICAMENTE DESDE EL BACKEND ===
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const token = localStorage.getItem("auth");
    const apiUrl = window.APP_CONFIG ? window.APP_CONFIG.api_url : 'http://127.0.0.1:5000';

    // Hacemos petición al endpoint que ya tienes en subject.py
    const response = await fetch(`${apiUrl}/subject/list`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error("No se pudieron cargar las materias");

    const subjects = await response.json();

    // Limpiamos el selector
    subjectSelect.innerHTML = '<option value="" disabled selected>Elige materia</option>';

    // Llenamos con las materias reales de la base de datos
    subjects.forEach(subject => {
      const option = document.createElement("option");
      // Guardamos el ID de la materia como data attribute por si lo necesitamos luego
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

// Evento: Cargar Estudiantes
btnLoad.addEventListener("click", () => {
  const subject = subjectSelect.value;
  const year = yearSelect.value;
  const section = sectionSelect.value;
  const term = termSelect.options[termSelect.selectedIndex]?.text;

  // Validación: Exigir que todos los campos estén seleccionados
  if (!subject || !year || !section || termSelect.value === "") {
    alert("Por favor, selecciona la materia, año, sección y lapso.");
    return;
  }

  // --- EL PRÓXIMO RETO ---
  // AHORA MISMO: usamos el mock de alumnos fijos (studentsData) y un UUID falso
  // FUTURO: Aquí deberás hacer OTRO fetch() a tu backend (ej: /class/students) enviando subject, year y section,
  // para que el backend te devuelva el "ClaseId" real y los alumnos reales de esa sección.
  currentClassId = "123e4567-e89b-12d3-a456-426614174000"; 
  currentStudents = JSON.parse(JSON.stringify(studentsData));

  // Actualizar Títulos de la Interfaz
  displayClassName.textContent = `${subject} - ${year} "${section}"`;
  
  // Formatear la fecha
  const dateObj = new Date(dateInput.value);
  // Ajuste para evitar problema de zona horaria (que atrase un día)
  dateObj.setMinutes(dateObj.getMinutes() + dateObj.getTimezoneOffset());
  const formattedDate = dateObj.toLocaleDateString("es-ES", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  displayDate.textContent = `${term} | ${formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}`;

  emptyState.classList.add("hidden"); 
  studentsSection.classList.remove("hidden"); 

  renderStudents();
  updateStats();
});

// Función para renderizar la lista
function renderStudents() {
  studentList.innerHTML = ""; 

  currentStudents.forEach((student, index) => {
    const row = document.createElement("div");
    row.className = "student-row";
    row.style.display = "flex";
    row.style.flexDirection = "column";

    const checkIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    const statusIcon = student.present
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

    row.innerHTML = `
        <div style="display: flex; align-items: center; width: 100%; justify-content: space-between;">
            <div class="check-container">
                <div class="custom-checkbox ${student.present ? "checked" : ""}" onclick="toggleAttendance(${index})">
                    ${student.present ? checkIcon : ""}
                </div>
            </div>
            <div class="student-info" style="flex-grow: 1; margin-left: 15px;">
                <span class="student-name">${student.name}</span>
            </div>
            <div class="status-badge ${student.present ? "present" : "absent"}">
                ${statusIcon}
            </div>
        </div>
        
        ${!student.present ? `
        <div style="width: 100%; margin-top: 10px; padding-left: 45px;">
            <input type="text" 
                   class="justification-input" 
                   placeholder="Escribe el motivo de la inasistencia (opcional)" 
                   value="${student.justification || ''}" 
                   onchange="updateJustification(${index}, this.value)">
        </div>` : ''}
    `;

    studentList.appendChild(row);
  });
}

// Función para alternar asistencia individual
window.toggleAttendance = (index) => {
  currentStudents[index].present = !currentStudents[index].present;
  if(currentStudents[index].present) {
      currentStudents[index].justification = "";
  }
  renderStudents(); 
  updateStats();
};

window.updateJustification = (index, value) => {
  currentStudents[index].justification = value;
};

function updateStats() {
  const presentCount = currentStudents.filter((s) => s.present).length;
  presentCountSpan.textContent = presentCount;
  totalCountSpan.textContent = currentStudents.length;
}

window.markAll = (status) => {
  currentStudents.forEach((s) => {
      s.present = status;
      if(status) s.justification = "";
  });
  renderStudents();
  updateStats();
};

window.resetAll = () => {
  currentStudents = JSON.parse(JSON.stringify(studentsData));
  renderStudents();
  updateStats();
};

// Enviar datos al Backend Flask (assistance.py)
if (btnSave) {
  btnSave.addEventListener("click", async () => {
    
    const payload = {
      ClaseId: currentClassId,
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