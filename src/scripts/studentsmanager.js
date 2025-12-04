import authorize from "./auth.js";

authorize("administrador");

// Datos simulados (Mock Data) basados en la imagen
const studentsData = [
  {
    id: 1,
    name: "Carlos González",
    cedula: "V-12345678",
    img: null, // Si tuvieras imagen, iría la URL aquí
    type: "Nuevo Ingreso",
    typeClass: "badge-blue",
    status: "Completado",
    statusClass: "badge-green",
    grade: "10°",
    age: 16,
    repName: "María González",
    repRole: "Docente",
  },
  {
    id: 2,
    name: "Ana Rodríguez",
    cedula: "V-87654321",
    img: null,
    type: "Reinscripción",
    typeClass: "badge-purple",
    status: "Pendiente",
    statusClass: "badge-yellow",
    grade: "11°",
    age: 17,
    repName: "Pedro Rodríguez",
    repRole: "Ingeniero",
  },
];

const gridContainer = document.getElementById("students-grid");
const searchInput = document.getElementById("search-input");
const cleanBtn = document.getElementById("btn-clean");

// Función para generar el HTML de una tarjeta
function createCardHTML(student) {
  return `
        <article class="student-card">
            <div class="card-body">
                <div class="card-header-info">
                    <div class="avatar-placeholder">
                        <i class="fa-regular fa-id-card"></i>
                    </div>
                    <div>
                        <h4 class="student-name">${student.name}</h4>
                        <span class="student-id">${student.cedula}</span>
                        <div class="badges">
                            <span class="badge ${student.typeClass}">${student.type}</span>
                            <span class="badge ${student.statusClass}">${student.status}</span>
                        </div>
                    </div>
                </div>

                <div class="info-section">
                    <span class="info-label">INFORMACIÓN</span>
                    <p class="info-data">Grado: ${student.grade}</p>
                    <p class="info-data">Edad: ${student.age}</p>
                </div>

                <div class="divider"></div>

                <div class="info-section">
                    <span class="info-label"><i class="fa-regular fa-user"></i> REPRESENTANTE</span>
                    <p class="info-data">${student.repName}</p>
                    <p class="sub-data">${student.repRole}</p>
                </div>
            </div>

            <div class="card-footer">
                <a href="#" class="btn-details">Ver Detalles</a>
                <div class="card-actions">
                    <i class="fa-solid fa-pen action-icon edit" title="Editar"></i>
                    <i class="fa-regular fa-trash-can action-icon delete" title="Eliminar"></i>
                </div>
            </div>
        </article>
    `;
}

// Función para renderizar tarjetas
function renderStudents(students) {
  gridContainer.innerHTML = "";

  if (students.length === 0) {
    gridContainer.innerHTML =
      '<p style="color:var(--text-secondary); grid-column: 1/-1; text-align:center;">No se encontraron estudiantes.</p>';
    return;
  }

  students.forEach((student) => {
    gridContainer.innerHTML += createCardHTML(student);
  });
}

// Inicializar
renderStudents(studentsData);

// Funcionalidad de Búsqueda (Filtro simple por nombre)
searchInput.addEventListener("input", (e) => {
  const term = e.target.value.toLowerCase();
  const filtered = studentsData.filter(
    (s) =>
      s.name.toLowerCase().includes(term) ||
      s.cedula.toLowerCase().includes(term)
  );
  renderStudents(filtered);
});

// Botón Limpiar
cleanBtn.addEventListener("click", () => {
  searchInput.value = "";
  document
    .querySelectorAll("select")
    .forEach((select) => (select.selectedIndex = 0));
  renderStudents(studentsData);
});
