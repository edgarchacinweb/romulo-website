import authorize from "./auth.js";
import numberToLetter from "./utils.js";

authorize("representante");
const token = localStorage.getItem("auth");

document.addEventListener("DOMContentLoaded", async () => {
  // Referencias al DOM
  const selectTrigger = document.querySelector(".select-trigger");
  const customSelect = document.getElementById("student-select");
  const selectedValueText = document.querySelector(".selected-value");
  const notifications = document.getElementById("notifications");
  const fullnameField = document.getElementById("fullnameField");
  const cedulaField = document.getElementById("cedulaField");
  const gradeField = document.getElementById("gradeField");
  const sectionField = document.getElementById("sectionField");
  let selectOptions = document.querySelectorAll(".select-options li");
  let user = {};
  let students = {};
  let subjects = [];
  let califications = {};
  let lapses = {};

  const emptyState = document.getElementById("empty-state");
  const studentData = document.getElementById("student-data");
  const btnSalir = document.getElementById("btn-salir");
  const appWrapper = document.getElementById("app-wrapper");
  const exportPdfBtn = document.querySelector(".btn-primary");
  const tableBody = document.querySelector(".table-container table tbody");

  const loader = document.createElement("loader-spinner");
  loader.setAttribute("title", "Cargando datos de estudiantes...");
  try {
    // Cargando datos del usuario
    const userPromise = await fetch(`${window.APP_CONFIG.api_url}/user/get`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    const userResponse = await userPromise.json();
    if (!userPromise.ok) throw new Error(userResponse.message);
    user = { ...userResponse };

    // Cargando materias
    const subjectsPromise = await fetch(`${window.APP_CONFIG.api_url}/subject/list`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    const subjectsResponse = await subjectsPromise.json();
    if (!subjectsPromise.ok) throw new Error(subjectsResponse.message);
    subjects = [...subjectsResponse];

    // Cargando lapsos
    const lapsesPromise = await fetch(`${window.APP_CONFIG.api_url}/lapsos/current`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    const lapsesResponse = await lapsesPromise.json();
    if (!lapsesPromise.ok) throw new Error(lapsesResponse.message);
    lapses = { ...lapsesResponse };
    console.log(lapses);

    // Cargando datos de los estudiantes del representante
    const studentsPromise = await fetch(`${window.APP_CONFIG.api_url}/students/by_parent/${user.DatosPersonaId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    const studentsResponse = await studentsPromise.json();
    if (!studentsPromise.ok) throw new Error(studentsResponse.message);
    students = [...studentsResponse];

    const selectOptionsContainer = document.querySelector(".select-options");
    selectOptionsContainer.innerHTML = "";
    students.forEach((student) => {
      const option = document.createElement("li");
      option.textContent = `${student.DatosPersona.Nombre} ${student.DatosPersona.Apellido} ${student.DatosPersona.Cedula}`;
      option.setAttribute("data-value", student.EstudianteId);
      selectOptionsContainer.appendChild(option);
    });

    selectOptions = document.querySelectorAll(".select-options li");
  } catch (error) {
    console.log(error.stack);
    const notification = document.createElement("notification-component");
    notification.setAttribute("type", "error");
    notification.setAttribute("text", error.message);
    notifications.appendChild(notification);
  } finally {
    loader.remove();
  }

  // 1. Lógica del Selector de Estudiante
  selectTrigger.addEventListener("click", (e) => {
    customSelect.classList.toggle("active");
    e.stopPropagation();
  });

  // Cerrar el selector si se hace clic fuera
  document.addEventListener("click", () => {
    customSelect.classList.remove("active");
  });

  // Manejar la selección de un estudiante
  selectOptions.forEach((option) => {
    option.addEventListener("click", async (e) => {

      // Cambiar el texto del selector (simula que escogimos "Juan Carlos")
      selectedValueText.textContent = option.textContent;
      selectedValueText.style.color = "#1e293b"; // Texto más oscuro al seleccionar

      customSelect.classList.remove("active");

      // Magia: Ocultar el estado vacío y mostrar los datos con animación
      const student = students.find((student) => student.EstudianteId === option.getAttribute("data-value"));
      console.log(student);
      fullnameField.textContent = `${student.DatosPersona.Nombre} ${student.DatosPersona.Apellido}`;
      cedulaField.textContent = student.DatosPersona.Cedula;
      gradeField.textContent = `${student.Curso.Grado}° Año`;
      sectionField.textContent = `Sección ${numberToLetter(student.Curso.Seccion)}`;
      emptyState.classList.remove("active");
      studentData.classList.add("active");

      // Cargando boleta consolidada del estudiante (Nueva lógica unificada)
      const reportPromise = await fetch(`${window.APP_CONFIG.api_url}/report-card/student/${student.EstudianteId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const reportResponse = await reportPromise.json();
      if (!reportPromise.ok) throw new Error(reportResponse.message);
      
      const { reporte, habilitar_pdf } = reportResponse;

      // Limpiar tabla antes de poblar
      tableBody.innerHTML = "";

      // Habilitar/Deshabilitar botón de PDF
      exportPdfBtn.disabled = !habilitar_pdf;
      exportPdfBtn.style.opacity = habilitar_pdf ? "1" : "0.5";
      exportPdfBtn.style.cursor = habilitar_pdf ? "pointer" : "not-allowed";

      exportPdfBtn.onclick = null;
      if (habilitar_pdf) {
        exportPdfBtn.onclick = () => {
          const { jsPDF } = window.jspdf;
          const doc = new jsPDF('portrait');
          
          doc.setFontSize(16);
          doc.text(`Boleta de Calificaciones`, 14, 20);
          doc.setFontSize(12);
          doc.text(`Estudiante: ${student.DatosPersona.Nombre} ${student.DatosPersona.Apellido}`, 14, 28);
          doc.text(`Cédula: ${student.DatosPersona.Cedula}`, 14, 34);
          doc.text(`Grado: ${student.Curso.Grado}° Año, Sección ${numberToLetter(student.Curso.Seccion)}`, 14, 40);
          
          doc.autoTable({
            html: '.table-container table',
            startY: 48,
            theme: 'striped',
            headStyles: { fillColor: [30, 41, 59] },
            styles: { fontSize: 10, cellPadding: 4, halign: 'center' },
            columnStyles: { 0: { halign: 'left' } }
          });
          
          doc.save(`boleta_${student.DatosPersona.Cedula}.pdf`);
        };
      }

      reporte.forEach(row => {
        const tr = document.createElement("tr");
        
        // Helper para las notas y sus colores (pills)
        const getNotaHTML = (nota) => {
          if (nota === null || nota === undefined) return "-";
          let colorClass = "pill-yellow-text";
          if (nota >= 10) colorClass = "pill-green";
          if (nota < 10) colorClass = "pill-red";
          return `<span class="pill ${colorClass}">${nota}</span>`;
        };

        let avgColorClass = "pill-green";
        const avgValue = parseFloat(row.promedio_final);
        if (!isNaN(avgValue) && avgValue <= 9) {
          avgColorClass = "pill-red";
        }
        const averageHTML = (row.promedio_final !== null) 
          ? `<span class="pill ${avgColorClass}">${row.promedio_final}</span>` 
          : "-";

        tr.innerHTML = `
          <td>${row.materia}</td>
          <td class="center-text">${getNotaHTML(row.lapsos[0]?.nota)}</td>
          <td class="center-text">${getNotaHTML(row.lapsos[1]?.nota)}</td>
          <td class="center-text">${getNotaHTML(row.lapsos[2]?.nota)}</td>
          <td class="center-text">${averageHTML}</td>
          <td class="center-text">
            <span class="pill ${row.total_inasistencias > 0 ? 'pill-yellow' : 'pill-green-light'}">${row.total_inasistencias}</span>
          </td>
        `;
        tableBody.appendChild(tr);
      });

      e.stopPropagation();
    });
  });

  // 2. Lógica del botón Salir (Animación y Redirección)
  btnSalir.addEventListener("click", (e) => {
    e.preventDefault();

    // Cambiamos la animación de entrada por la de salida
    appWrapper.classList.remove("fade-in-up");
    appWrapper.classList.add("fade-out-down");

    // Esperamos 400ms (lo que dura la animación CSS) para cambiar de página
    setTimeout(() => {
      window.location.href = "/app/representante/inicio/";
    }, 400);
  });
});
