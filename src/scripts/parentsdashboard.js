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
  {
    name: "María González",
    cedula: "23456789",
    dob: "22/06/2008",
    age: 16,
    grade: "2º Año",
    section: "B",
    average: 9.2,
    imageColor: "linear-gradient(120deg, #fbc2eb 0%, #a6c1ee 100%)", // Rosado/Azul
  },
  {
    name: "Juan Martínez",
    cedula: "34567890",
    dob: "08/11/2008",
    age: 16,
    grade: "1º Año",
    section: "C",
    average: 7.8,
    imageColor: "linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)", // Verdoso
  },
  {
    name: "Ana López",
    cedula: "45678901",
    dob: "19/01/2007",
    age: 18,
    grade: "3º Año",
    section: "A",
    average: 9.5,
    imageColor: "linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%)", // Violeta
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
