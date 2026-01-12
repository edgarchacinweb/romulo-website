import authorize from "./auth.js";

authorize("representante");

document.querySelector(".logout").addEventListener("click", (e) => {
  e.preventDefault();
  const confirmation = confirm("¿Estás seguro de que quieres cerrar sesión?");
  if (!confirmation) return;

  localStorage.removeItem("auth");
  localStorage.removeItem("role");
  window.location.href = "/app/iniciar-sesion.html";
});

// Datos simulados (Mock Data)
const studentsData = [
  {
    name: "Carlos Rodriguez",
    cedula: "12345678",
    dob: "15/03/2007",
    age: 17,
    grade: "3º Año",
    section: "A",
    average: 8.5,
    imageColor: "linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)", // Azulado
  },
];

// Función para obtener la clase de color basada en el promedio
function getAverageColorClass(score) {
  if (score >= 9.0) return "grade-green";
  if (score >= 8.0) return "grade-blue";
  return "grade-yellow";
}

// Iconos SVG como strings para reutilizar
const icons = {
  book: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
  badge: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15l-2 5l9-9l-9 9l-2-5"></path></svg>`, // Icono simplificado
};

function renderStudents() {
  const gridContainer = document.getElementById("students-grid");
  gridContainer.innerHTML = ""; // Limpiar contenedor

  studentsData.forEach((student) => {
    // Determinar estilo del promedio
    const avgClass = getAverageColorClass(student.average);

    // Crear elemento Card
    const card = document.createElement("article");
    card.className = "card";

    // Construir HTML interno
    card.innerHTML = `
            <div class="card-image-placeholder" style="background: ${student.imageColor}"></div>
            
            <h3>${student.name}</h3>
            <span class="cedula">Cédula: ${student.cedula}</span>
            
            <div class="info-block">
                <div class="info-item">
                    <label>Fecha de Nacimiento</label>
                    <span>${student.dob}</span>
                </div>
                <div class="info-item" style="margin-top:5px">
                    <label>Edad</label>
                    <span>${student.age} años</span>
                </div>
            </div>

            <div class="academic-details">
                <div class="detail-box">
                    ${icons.book}
                    <div class="detail-text">
                        <span>Grado</span>
                        <strong>${student.grade}</strong>
                    </div>
                </div>
                <div class="detail-box">
                    <div class="detail-text">
                        <span>Sección</span>
                        <strong>${student.section}</strong>
                    </div>
                </div>
            </div>

            <div class="grade-badge ${avgClass}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                </svg>
                Promedio General: ${student.average}
            </div>
        `;

    // Efecto visual extra al hacer click (Feedback)
    card.addEventListener("mousedown", () => {
      card.style.transform = "scale(0.98)";
    });
    card.addEventListener("mouseup", () => {
      card.style.transform = "translateY(-5px)";
    });

    gridContainer.appendChild(card);
  });
}

// Inicializar al cargar la página
document.addEventListener("DOMContentLoaded", renderStudents);
