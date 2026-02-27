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

// Asignar fecha de hoy por defecto al input de fecha
dateInput.valueAsDate = new Date();

// Estado local
let currentStudents = [];
let currentClassId = ""; 
let lapsosData = []; 
let currentFilter = 'all'; // Pestaña actual: 'all', 'present', 'absent'

// === CARGAR MATERIAS DINÁMICAMENTE DESDE EL BACKEND ===
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const token = localStorage.getItem("auth");
    const apiUrl = window.APP_CONFIG ? window.APP_CONFIG.api_url : 'http://127.0.0.1:5000';

    // --- OBTENER LAPSOS REALES DESDE LA BD ---
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
      if(termDisplay) termDisplay.value = "Error al cargar fechas";
    }

    const response = await fetch(`${apiUrl}/subject/teacher`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error("No se pudieron cargar las materias");

    const subjects = await response.json();

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

dateInput.addEventListener("change", (e) => {
  calcularLapsoPorFecha(e.target.value);
});

// Evento: Cargar Estudiantes y obtener el UUID de la Clase
btnLoad.addEventListener("click", async () => {
  const subjectOption = subjectSelect.options[subjectSelect.selectedIndex];
  const subjectId = subjectOption ? subjectOption.dataset.id : null;
  const subjectName = subjectSelect.value;
  
  const year = yearSelect.value;
  const section = sectionSelect.value;
  const term = termSelect.value;
  const termName = termDisplay.value; 

  if (!subjectId || !year || !section || term === "") {
    alert("Por favor, selecciona la materia, año, sección y verifica que la fecha pertenezca a un lapso válido.");
    return;
  }

  const sectionMap = { "A": 1, "B": 2, "C": 3, "D": 4, "E": 5 };
  const sectionNum = sectionMap[section] || 1;

  try {
    const token = localStorage.getItem("auth");
    const apiUrl = window.APP_CONFIG ? window.APP_CONFIG.api_url : 'http://127.0.0.1:5000';

    const response = await fetch(`${apiUrl}/assistance/students?materiaId=${subjectId}&year=${year}&section=${sectionNum}&term=${term}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      currentClassId = data.ClaseId; 
      
      // Mapeamos los estudiantes. INICIALMENTE NADIE ESTÁ PRESENTE NI AUSENTE (null)
      currentStudents = data.estudiantes.map(e => ({
        id: e.EstudianteId,
        name: `${e.Nombre} ${e.Apellido || ""}`.trim(),
        present: null, // <-- ESTADO "PENDIENTE" POR DEFECTO
        justification: ""
      }));

      if(currentStudents.length === 0) {
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

// Función para cambiar de Pestaña (Lista Completa, Presentes, Ausentes)
window.setFilter = (filter) => {
  currentFilter = filter;
  
  // Actualizar visualmente la pestaña activa
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.tab === filter) {
      btn.classList.add('active');
    }
  });

  renderStudents();
};

// Función para renderizar la lista basada en el filtro
function renderStudents() {
  studentList.innerHTML = ""; 

  // Filtramos los estudiantes pero mantenemos su "índice original" para no romper el array al guardar
  const filteredStudents = currentStudents.map((student, index) => ({...student, originalIndex: index}))
    .filter(student => {
      if (currentFilter === 'present') return student.present === true;
      if (currentFilter === 'absent') return student.present === false;
      return true; // 'all' muestra todos (pendientes, presentes y ausentes)
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
    
    // Etiqueta visual del estado del estudiante
    let statusBadge = `<span class="student-status-badge" style="background:#f1f5f9; color:#64748b;">Pendiente</span>`;
    if (student.present === true) {
        statusBadge = `<span class="student-status-badge" style="background:#dcfce7; color:#166534;">Presente</span>`;
    } else if (student.present === false) {
        statusBadge = `<span class="student-status-badge" style="background:#fee2e2; color:#991b1b;">Ausente</span>`;
    }

    row.innerHTML = `
        <div class="student-header">
            <div class="student-info">
                <span class="student-name">${student.name}</span>
                ${statusBadge}
            </div>
            
            <div class="mark-buttons">
                <button class="btn-mark present ${student.present === true ? 'active' : ''}" onclick="markStudent(${student.originalIndex}, true)">
                    ✔️ Presente
                </button>
                <button class="btn-mark absent ${student.present === false ? 'active' : ''}" onclick="markStudent(${student.originalIndex}, false)">
                    ❌ Ausente
                </button>
            </div>
        </div>
        
        ${student.present === false ? `
        <div style="width: 100%; margin-top: 10px;">
            <input type="text" 
                   class="justification-input" 
                   placeholder="Escribe el motivo de la inasistencia (opcional)" 
                   value="${student.justification || ''}" 
                   onchange="updateJustification(${student.originalIndex}, this.value)">
        </div>` : ''}
    `;

    studentList.appendChild(row);
  });

  updateStats();
}

// Función para marcar Asistencia individual explícita
window.markStudent = (index, status) => {
  currentStudents[index].present = status;
  if(status === true) {
      currentStudents[index].justification = ""; // Limpiar justificación si lo marcamos presente
  }
  renderStudents(); 
};

window.updateJustification = (index, value) => {
  currentStudents[index].justification = value;
};

// Actualizar los contadores de las pestañas
function updateStats() {
  const presentCount = currentStudents.filter((s) => s.present === true).length;
  const absentCount = currentStudents.filter((s) => s.present === false).length;
  
  if(countPresentSpan) countPresentSpan.textContent = presentCount;
  if(countAbsentSpan) countAbsentSpan.textContent = absentCount;
  if(countAllSpan) countAllSpan.textContent = currentStudents.length;
}

// Botones de acción masiva (por si el profesor quiere ahorrar tiempo)
window.markAll = (status) => {
  currentStudents.forEach((s) => {
      s.present = status;
      if(status === true) s.justification = "";
  });
  renderStudents();
};

// Enviar datos al Backend Flask (assistance.py)
if (btnSave) {
  btnSave.addEventListener("click", async () => {
    
    // VALIDACIÓN IMPORTANTE: Asegurarnos de que NADIE se haya quedado en "Pendiente" (null)
    const estudiantesPendientes = currentStudents.filter(s => s.present === null);
    if (estudiantesPendientes.length > 0) {
        alert(`⚠️ Faltan ${estudiantesPendientes.length} estudiantes por evaluar.\n\nPor favor, marca si están Presentes o Ausentes antes de guardar la asistencia.`);
        setFilter('all'); // Devolverlo a la lista completa para que vea quién le falta
        return;
    }

    if(currentClassId === "123e4567-e89b-12d3-a456-426614174000") {
        alert("Advertencia: Se utilizará un ID de clase genérico debido a que la tabla 'Clase' podría no estar completamente configurada en su base de datos, pero la asistencia será procesada.");
    }

    const payload = {
      ClaseId: currentClassId,
      EstudianteId: currentStudents.map(s => s.id),
      Activo: currentStudents.map(s => s.present), // Ahora seguro mandará true o false
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