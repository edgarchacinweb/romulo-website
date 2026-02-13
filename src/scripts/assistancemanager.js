import authorize from "./auth.js";

authorize("docente");

// Datos simulados (Mock Data)
const studentsData = [
  {
    id: "A001",
    name: "Juan Carlos Pérez",
    present: true,
  },
  {
    id: "A002",
    name: "María García López",
    present: true,
  },
  {
    id: "A003",
    name: "Carlos Rodríguez Sánchez",
    present: true,
  },
  {
    id: "A004",
    name: "Ana Martínez Ruiz",
    present: false,
  },
  {
    id: "A005",
    name: "Felipe Díaz Morales",
    present: false,
  },
  {
    id: "A006",
    name: "Lucia Fernández Castro",
    present: true,
  },
];

// Elementos del DOM
const btnLoad = document.getElementById("btnLoad");
const emptyState = document.getElementById("emptyState");
const studentsSection = document.getElementById("studentsSection");
const studentList = document.getElementById("studentList");
const classSelect = document.getElementById("classSelect");
const displayClassName = document.getElementById("displayClassName");
const presentCountSpan = document.getElementById("presentCount");
const totalCountSpan = document.getElementById("totalCount");

// Estado local
let currentStudents = [];

// Evento: Cargar Estudiantes
btnLoad.addEventListener("click", () => {
  const selectedClass = classSelect.options[classSelect.selectedIndex].text;

  // Validación simple
  if (classSelect.value === "") {
    alert("Por favor, selecciona una clase primero.");
    return;
  }

  // Copiamos los datos para no mutar el original en este ejemplo simple
  // JSON.parse/stringify crea una copia profunda
  currentStudents = JSON.parse(JSON.stringify(studentsData));

  // UI Updates
  displayClassName.textContent = selectedClass;
  emptyState.classList.add("hidden"); // Ocultar estado vacío
  studentsSection.classList.remove("hidden"); // Mostrar lista

  renderStudents();
  updateStats();
});

// Función para renderizar la lista
function renderStudents() {
  studentList.innerHTML = ""; // Limpiar lista

  currentStudents.forEach((student, index) => {
    const row = document.createElement("div");
    row.className = "student-row";

    // Iconos SVG como strings
    const checkIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    const statusIcon = student.present
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

    row.innerHTML = `
            <div class="check-container">
                <div class="custom-checkbox ${student.present ? "checked" : ""}" onclick="toggleAttendance(${index})">
                    ${student.present ? checkIcon : ""}
                </div>
            </div>
            <div class="student-info">
                <span class="student-name">${student.name}</span>
            </div>
            <div class="status-badge ${student.present ? "present" : "absent"}">
                ${statusIcon}
            </div>
        `;

    studentList.appendChild(row);
  });
}

// Función para alternar asistencia individual
window.toggleAttendance = (index) => {
  currentStudents[index].present = !currentStudents[index].present;
  renderStudents(); // Re-renderizar para actualizar iconos y estilos
  updateStats();
};

// Función para actualizar contadores
function updateStats() {
  const presentCount = currentStudents.filter((s) => s.present).length;
  presentCountSpan.textContent = presentCount;
  totalCountSpan.textContent = currentStudents.length;
}

// Funciones de Lote (Bulk Actions)
window.markAll = (status) => {
  currentStudents.forEach((s) => (s.present = status));
  renderStudents();
  updateStats();
};

window.resetAll = () => {
  // Reinicia al estado por defecto (asumimos true para el ejemplo o recargamos)
  // En este caso, pondré a todos como ausentes para que el profesor empiece de cero,
  // o podrías volver a copiar studentsData original.
  currentStudents = JSON.parse(JSON.stringify(studentsData));
  renderStudents();
  updateStats();
};
