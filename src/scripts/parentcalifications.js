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
      
      const { reporte, habilitar_pdf, promedio_general, promedio_seccion, posicion_curso, docente_guia } = reportResponse;

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
          
          // Membrete
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          const membrete = [
            "REPÚBLICA BOLIVARIANA DE VENEZUELA",
            "MINISTERIO DEL PODER POPULAR PARA LA EDUCACIÓN",
            "L.N. 'DON RÓMULO GALLEGOS'",
            "C/SAN MATEO, BARRIO ALAYON, P. ANDRES ELOY BLANCO MARACAY"
          ];
          let startYX = 15;
          membrete.forEach((line) => {
             const textWidth = doc.getStringUnitWidth(line) * doc.internal.getFontSize() / doc.internal.scaleFactor;
             const textOffset = (doc.internal.pageSize.width - textWidth) / 2;
             doc.text(line, textOffset, startYX);
             startYX += 5;
          });

          // Título
          startYX += 5;
          doc.setFontSize(14);
          doc.text(`BOLETA DE CALIFICACIONES`, doc.internal.pageSize.width / 2, startYX, { align: 'center' });
          
          // Datos del alumno
          startYX += 10;
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          doc.text(`Estudiante: ${student.DatosPersona.Nombre} ${student.DatosPersona.Apellido}`, 14, startYX);
          doc.text(`Cédula: ${student.DatosPersona.Cedula}`, 14, startYX + 6);
          doc.text(`Grado: ${student.Curso.Grado}° Año, Sección "${numberToLetter(student.Curso.Seccion)}"`, 14, startYX + 12);
          
          doc.autoTable({
            html: '.table-container table',
            startY: startYX + 18,
            theme: 'striped',
            headStyles: { fillColor: [30, 41, 59] },
            styles: { fontSize: 9, cellPadding: 3, halign: 'center' },
            columnStyles: { 0: { halign: 'left' } }
          });
          
          let finalY = doc.lastAutoTable.finalY + 10;
          
          // Cuadro de promedios
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.text("Promedios:", 14, finalY);
          
          finalY += 2;
          doc.autoTable({
            head: [['Promedio General', 'Promedio de la Sección', 'Posición en el Curso']],
            body: [[
              promedio_general !== null ? promedio_general : '-', 
              promedio_seccion !== null ? promedio_seccion : '-', 
              posicion_curso
            ]],
            startY: finalY,
            theme: 'grid',
            headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
            styles: { fontSize: 10, halign: 'center', cellPadding: 3 }
          });

          // Firmas
          let signatureY = doc.lastAutoTable.finalY + 30;
          
          // Chequear si hay espacio en la pagina, en boletas largas podria estar al limite
          if (signatureY + 20 > doc.internal.pageSize.height) {
              doc.addPage();
              signatureY = 30;
          }

          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          
          const centerX = doc.internal.pageSize.width / 2;
          
          // Firma Directora
          doc.line(centerX - 70, signatureY, centerX - 20, signatureY); // linea
          doc.text("Directora: Emily Alvarez", centerX - 45, signatureY + 5, { align: "center" });

          // Firma Docente
          doc.line(centerX + 20, signatureY, centerX + 70, signatureY); // linea
          doc.text(`Docente Guía: ${docente_guia}`, centerX + 45, signatureY + 5, { align: "center" });
          
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
