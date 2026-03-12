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

      // Cargando calificaciones del estudiante
      const calificationsPromise = await fetch(`${window.APP_CONFIG.api_url}/calification/student/${student.EstudianteId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const calificationsResponse = await calificationsPromise.json();
      if (!calificationsPromise.ok) throw new Error(calificationsResponse.message);
      califications = [...calificationsResponse];
      console.log(califications);

      const level = student.Curso.Grado < 4 ? "Secundaria" : "Bachillerato";
      const selectedSubjects = subjects.filter(s => s.Nivel === level);

      const lapsesRecords = lapses.lapsos;
      console.log(lapsesRecords);
      selectedSubjects.forEach(subject => {
        const grade1 = califications.find(c => c.MateriaId === subject.MateriaId && c.LapsoId === lapsesRecords[0].lapso_id)?.Ponderacion;
        const grade2 = califications.find(c => c.MateriaId === subject.MateriaId && c.LapsoId === lapsesRecords[1].lapso_id)?.Ponderacion;
        const grade3 = califications.find(c => c.MateriaId === subject.MateriaId && c.LapsoId === lapsesRecords[2].lapso_id)?.Ponderacion;
        let average = undefined;
        if (grade1 && grade2 && grade3) {
          average = (grade1 + grade2 + grade3) / 3;
        }
        const tr = document.createElement("tr");
        tr.innerHTML = `
                <td>${subject.Nombre}</td>
                <td class="center-text">${grade1 ?? "-"}</td>
                <td class="center-text">${grade2 ?? "-"}</td>
                <td class="center-text">${grade3 ?? "-"}</td>
                <td class="center-text">
                  <span class="pill pill-green">${average ?? "-"}</span>
                </td>
                <td class="center-text">
                  <span class="pill pill-yellow">-</span>
                </td>
        `;
        document.querySelector(".table-container table tbody").appendChild(tr);
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
