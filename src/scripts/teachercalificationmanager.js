import authorize from "./auth.js";
import number_to_letter from "./utils.js";

authorize("docente");
const token = localStorage.getItem("auth");

document.addEventListener("DOMContentLoaded", async () => {
  // Datos globales
  const notifications = document.getElementById("notifications");
  let grades = [];
  let subjects = [];
  let students = [];
  let lapso = undefined;

  // --- 1. Animación de Salida y Redirección ---
  const btnVolver = document.getElementById("btn-volver");
  if (btnVolver) {
    btnVolver.addEventListener("click", () => {
      // Añadimos la clase para desencadenar la animación de salida
      document.getElementById("app-container").classList.add("page-exit");

      // Esperamos 400ms (lo que dura la animación CSS) y redirigimos
      setTimeout(() => {
        window.location.href = "/app/docente/inicio/";
      }, 400);
    });
  }

  // --- 2. Referencias al DOM para la Lógica de Búsqueda ---
  const selectGrado = document.getElementById("gradeField");
  const selectSeccion = document.getElementById("sectionField");
  const selectMateria = document.getElementById("subjectField");
  const dynamicArea = document.getElementById("dynamic-area");

  // --- Asignaciones Reales del Docente ---
  let teacherAssignments = [];

  // Habilitar selects en cascada
  selectGrado.addEventListener("change", () => {
    selectSeccion.disabled = false;
    selectMateria.disabled = true; // Resetear materia select al cambiar de grado
    selectMateria.innerHTML = `
      <option value="" disabled selected>
        Seleccionar materia...
      </option>
    `;

    selectSeccion.innerHTML = `
      <option value="" disabled selected>
        Seleccionar sección...
      </option>
    `;

    // Buscar las secciones únicas en las asignaciones para el grado seleccionado
    const selectedCourseId = selectGrado.value;
    const secciones = [...new Set(teacherAssignments.filter(a => String(a.CursoId) === String(selectedCourseId)).map(a => a.Seccion))];

    secciones.sort((a, b) => a - b).forEach(seccion => {
      const option = document.createElement("option");
      option.setAttribute("value", seccion);
      option.textContent = number_to_letter(seccion);
      selectSeccion.appendChild(option);
    });
  });

  selectSeccion.addEventListener("change", () => {
    selectMateria.disabled = false;
    selectMateria.innerHTML = `
      <option value="" disabled selected>
        Seleccionar materia...
      </option>
    `;

    // Buscar las materias únicas en las asignaciones para el grado y sección seleccionados
    const selectedCourseId = selectGrado.value;
    const selectedSeccion = parseInt(selectSeccion.value);

    const materias = teacherAssignments.filter(a => String(a.CursoId) === String(selectedCourseId) && a.Seccion === selectedSeccion);

    // Evitar materias duplicadas
    const uniqueMaterias = [];
    materias.forEach(m => {
      if (!uniqueMaterias.some(um => um.MateriaId === m.MateriaId)) {
        uniqueMaterias.push(m);
      }
    });

    uniqueMaterias.forEach(m => {
      const option = document.createElement("option");
      option.setAttribute("value", m.MateriaId);
      option.textContent = m.MateriaNombre;
      selectMateria.appendChild(option);
    });
  });

  // Cuando la materia se selecciona, simulamos la carga de datos
  selectMateria.addEventListener("change", () => {
    if (selectGrado.value && selectSeccion.value && selectMateria.value) {
      iniciarCargaEstudiantes();
    }
  });

  // Cargando datos
  const loader = document.createElement("loader-spinner");
  document.body.appendChild(loader);
  try {

    // Verificando estado de carga de calificaciones
    const statusCargaPromise = await fetch(
      `${window.APP_CONFIG.api_url}/lapsos/status_carga`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const statusCarga = await statusCargaPromise.json();
    if (!statusCargaPromise.ok) throw new Error(statusCarga.message || "Error al verificar estado de carga");

    if (statusCarga.status === "CLOSED") {
      loader.remove(); // Removemos loader
      document.querySelector(".params-card").style.display = "none";
      document.getElementById("dynamic-area").innerHTML = `
        <div class="state-container active" style="text-align: center; color: var(--text-color);">
            <div class="icon-circle" style="background-color: #fee2e2; border-radius: 50%; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
            </div>
            <h3>Proceso de carga de calificaciones cerrado</h3>
        </div>
      `;
      return;
    }

    lapso = statusCarga.lapso;

    // Cargando asignaciones reales del docente
    const assignmentsPromise = await fetch(
      `${window.APP_CONFIG.api_url}/teacher/assignments`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const assignmentsResponse = await assignmentsPromise.json();
    if (!assignmentsPromise.ok) throw new Error(assignmentsResponse.message);
    teacherAssignments = [...assignmentsResponse];

    selectGrado.innerHTML = `
      <option value="" disabled selected>
        Seleccionar grado...
      </option>
    `;

    // Extraer grados académicos únicos
    const uniqueGrades = [];
    teacherAssignments.forEach(a => {
      if (!uniqueGrades.some(ug => ug.CursoId === a.CursoId)) {
        uniqueGrades.push(a);
      }
    });

    uniqueGrades.sort((a, b) => a.Grado - b.Grado).forEach((g) => {
      const option = document.createElement("option");
      option.setAttribute("value", g.CursoId);
      option.textContent = `${g.Grado}° Año`;
      selectGrado.appendChild(option);
    });

    // Para mantener consistencia con variables existentes
    grades = uniqueGrades.map(g => ({ CursoId: g.CursoId, Grado: g.Grado }));
    subjects = teacherAssignments.map(a => ({ MateriaId: a.MateriaId, Nombre: a.MateriaNombre }));

    // Cargando estudiantes inscritos
    const studentsPromise = await fetch(
      `${window.APP_CONFIG.api_url}/students/filter`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          Estado: "inscrito",
        }),
      },
    );

    const studentsResponse = await studentsPromise.json();
    if (!studentsPromise.ok) throw new Error(studentsResponse.message);
    students = [...studentsResponse.estudiantes];
  } catch (Error) {
    console.error(Error.stack);
    const notification = document.createElement("notification-component");
    notification.setAttribute("type", "error");
    notification.setAttribute("text", Error.message);
    notifications.appendChild(notification);
  } finally {
    loader.remove();
  }

  // --- 4. Funciones de Renderizado de Estados ---

  function iniciarCargaEstudiantes() {
    // Renderizar estado de "Cargando"
    dynamicArea.innerHTML = `
            <div class="state-container active" style="align-items: flex-start; text-align: left; width: 100%;">
                <p>Cargando estudiantes...</p>
                <div class="alert alert-info">
                    <svg class="spinner" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                    </svg>
                    <span>Cargando lista de estudiantes...</span>
                </div>
            </div>
        `;

    renderizarTablaEstudiantes();
  }

  async function renderizarTablaEstudiantes() {
    // Cargando las calificaciones
    const calificationsPromise = await fetch(
      `${window.APP_CONFIG.api_url}/calification/list`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const calificationsResponse = await calificationsPromise.json();
    if (!calificationsPromise.ok) {
      const notification = document.createElement("notification-component");
      notification.setAttribute("type", "error");
      notification.setAttribute("text", calificationsResponse.message);
      document.getElementById("notifications").appendChild(notification);
      return;
    }

    // Generamos las filas dinámicamente
    const grade = grades.find((g) => String(g["CursoId"]) === String(selectGrado.value));
    const studentsData = students.filter(
      (s) =>
        s["Curso"]["Grado"] === grade["Grado"] &&
        s["Curso"]["Seccion"] === number_to_letter(selectSeccion.value),
    );

    console.log(calificationsResponse);
    const filas = studentsData
      .map((est, index) => {
        const calificationData = lapso ? calificationsResponse.find(
          (c) =>
            c && String(c["LapsoId"]) === String(lapso["LapsoId"]) &&
            c["EstudianteId"] === est["EstudianteId"] &&
            c["MateriaId"] === selectMateria.value,
        ) : undefined;
        const calification = calificationData?.Ponderacion;
        const convalidada = calificationData?.Convalidada;
        let status = "Pendiente";
        let statusClass = "status-pendiente";
        if (calification) {
          status = calification > 9 ? "Aprobado" : "Reprobado";
          statusClass =
            calification > 9 ? "status-aprobado" : "status-reprobado";
        }

        let inputHtml = `
            <input type="number" class="grade-input" min="1" max="20" value="${calification ?? ""}" placeholder="--" data-index="${index}" data-id="${est["EstudianteId"]}" ${convalidada ? "disabled readonly title=\"Nota migrada automáticamente\"" : ""}>
        `;
        if (convalidada) {
            inputHtml += `<span style="display:block; font-size: 0.8rem; color: #10b981; margin-top: 4px;">✔ notas ya cargadas</span>`;
        }

        return `
            <tr>
                <td>${index + 1}</td>
                <td>${est["DatosPersona"]["Nombre"]} ${est["DatosPersona"]["Apellido"]}</td>
                <td>${est["DatosPersona"]["Cedula"]}</td>
                <td>
                    ${inputHtml}
                </td>
                <td id="status-${index}">
                    <span class="status-badge ${statusClass}">${status}</span>
                </td>
            </tr>
        `;
      })
      .join("");

    // Inyectamos el componente Tabla
    dynamicArea.innerHTML = `
            <div class="table-container">
                <div id="success-alert-container"></div>
                <div class="card">
                    <div class="table-header">
                        <div>
                            <h2>Lista de Estudiantes</h2>
                            <p>Calificaciones completadas: <strong id="counter-text" style="color: var(--primary-blue);">0</strong> de ${studentsData.length}</p>
                        </div>
                        <button id="btn-guardar" class="btn-primary" disabled>
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                            Guardar Calificaciones
                        </button>
                    </div>
                    
                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Nombre del Estudiante</th>
                                    <th>Cédula de Identidad</th>
                                    <th>Calificación (1-20)</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filas}
                            </tbody>
                        </table>
                    </div>

                    <div id="warning-alert" class="alert alert-warning">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                        <span>Recuerde: Debe completar las calificaciones de TODOS los estudiantes (<span id="alert-counter">0</span>/${studentsData.length}) para guardar los datos.</span>
                    </div>
                </div>
            </div>
        `;

    configurarEventosTabla(studentsData);
  }

  // --- 5. Lógica de Negocio y Validaciones (La parte jugosa) ---
  function configurarEventosTabla(studentsData) {
    const inputs = document.querySelectorAll(".grade-input");
    const btnGuardar = document.getElementById("btn-guardar");
    const counterText = document.getElementById("counter-text");
    const alertCounter = document.getElementById("alert-counter");
    const warningAlert = document.getElementById("warning-alert");
    const total = studentsData.length;

    inputs.forEach((input) => {
      input.addEventListener("input", (e) => {
        let valor = e.target.value;

        // Limpiamos cualquier carácter no numérico
        valor = valor.replace(/[^0-9]/g, "");

        // Validación estricta del rango 1 al 20
        if (valor !== "") {
          let num = parseInt(valor);
          if (num < 1) valor = "1";
          if (num > 20) valor = "20";
        }

        e.target.value = valor;

        // Actualizar la columna de estado (Aprobado >= 10, Reprobado < 10)
        const index = e.target.getAttribute("data-index");
        const statusCell = document.getElementById(`status-${index}`);

        if (valor === "") {
          statusCell.innerHTML =
            '<span class="status-badge status-pendiente">Pendiente</span>';
        } else {
          const nota = parseInt(valor);
          if (nota >= 10) {
            statusCell.innerHTML = `
                            <span class="status-badge status-aprobado">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                Aprobado
                            </span>`;
          } else {
            statusCell.innerHTML = `
                            <span class="status-badge status-reprobado">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                Reprobado
                            </span>`;
          }
        }

        // Recalcular cuántas notas están llenas
        let completadas = Array.from(inputs).filter(
          (inp) => inp.value !== "",
        ).length;
        counterText.innerText = completadas;
        alertCounter.innerText = completadas;

        // Si están todas listas, habilitar botón de guardar y ocultar advertencia
        if (completadas === total) {
          btnGuardar.disabled = false;
          warningAlert.style.display = "none";
        } else {
          btnGuardar.disabled = true;
          warningAlert.style.display = "flex";
        }
      });
    });

    // Evento del botón final de guardar
    btnGuardar.addEventListener("click", async () => {
      // Cambiar a estado "Guardando..."
      btnGuardar.disabled = true;
      btnGuardar.innerHTML = `
                <svg class="spinner" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                Guardando...
            `;

      let califications = [];

      document.querySelectorAll(".grade-input").forEach((input) => {
        califications.push({
          Ponderacion: input.value,
          MateriaId: selectMateria.value,
          EstudianteId: input.getAttribute("data-id"),
          LapsoId: lapso["LapsoId"],
        });
      });

      const uploadCalificationPromise = await fetch(
        `${window.APP_CONFIG.api_url}/calification/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(califications),
        },
      );

      btnGuardar.innerHTML = `
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                    Guardar Calificaciones
                `;

      if (!uploadCalificationPromise.ok) {
        const uploadCalificationResponse =
          await uploadCalificationPromise.json();
        console.log(uploadCalificationResponse);
        const notification = document.createElement("notification-component");
        notification.setAttribute("type", "error");
        notification.setAttribute("text", uploadCalificationResponse.message);
        document.getElementById("notifications").appendChild(notification);
      } else {
        // Bloquear los inputs de calificación
        inputs.forEach((inp) => (inp.disabled = true));

        // Mostrar mensaje de éxito arriba de la tarjeta
        const successContainer = document.getElementById(
          "success-alert-container",
        );
        successContainer.innerHTML = `
                      <div class="alert alert-success" style="margin-top: 0; margin-bottom: 1rem; animation: fadeInUp 0.3s ease-out;">
                          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                          <span>¡Calificaciones guardadas exitosamente!</span>
                      </div>
                  `;
      }
    });
  }
});
