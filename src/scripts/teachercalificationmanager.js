import authorize from "./auth.js";

authorize("docente");
const token = localStorage.getItem("auth");

document.addEventListener("DOMContentLoaded", () => {
  // --- 1. Animación de Salida y Redirección ---
  const btnVolver = document.getElementById("btn-volver");
  btnVolver.addEventListener("click", () => {
    // Añadimos la clase para desencadenar la animación de salida
    document.getElementById("app-container").classList.add("page-exit");

    // Esperamos 400ms (lo que dura la animación CSS) y redirigimos
    setTimeout(() => {
      window.location.href = "/app/docente/inicio/";
    }, 400);
  });

  // --- 2. Referencias al DOM para la Lógica de Búsqueda ---
  const selectGrado = document.getElementById("select-grado");
  const selectSeccion = document.getElementById("select-seccion");
  const selectMateria = document.getElementById("select-materia");
  const dynamicArea = document.getElementById("dynamic-area");

  // Habilitar selects en cascada
  selectGrado.addEventListener(
    "change",
    () => (selectSeccion.disabled = false),
  );
  selectSeccion.addEventListener(
    "change",
    () => (selectMateria.disabled = false),
  );

  // Cuando la materia se selecciona, simulamos la carga de datos
  selectMateria.addEventListener("change", () => {
    if (selectGrado.value && selectSeccion.value && selectMateria.value) {
      iniciarCargaEstudiantes();
    }
  });

  // --- 3. Mock Data (Simulando la base de datos de estudiantes) ---
  const estudiantesData = [
    { id: "EST-013", nombre: "Javier Antonio Romero" },
    { id: "EST-014", nombre: "Katarina Luisa Vargas" },
    { id: "EST-015", nombre: "Luis Miguel Herrera" },
    { id: "EST-016", nombre: "Mariana Francisca Medina" },
  ];

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

    // Simular latencia de red de 1.5 segundos
    setTimeout(() => {
      renderizarTablaEstudiantes();
    }, 1500);
  }

  function renderizarTablaEstudiantes() {
    // Generamos las filas dinámicamente
    const filas = estudiantesData
      .map(
        (est, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${est.nombre}</td>
                <td>${est.id}</td>
                <td>
                    <input type="number" class="grade-input" min="1" max="20" placeholder="--" data-index="${index}">
                </td>
                <td id="status-${index}">
                    <span class="status-badge status-pendiente">Pendiente</span>
                </td>
            </tr>
        `,
      )
      .join("");

    // Inyectamos el componente Tabla
    dynamicArea.innerHTML = `
            <div class="table-container">
                <div id="success-alert-container"></div>
                <div class="card">
                    <div class="table-header">
                        <div>
                            <h2>Lista de Estudiantes</h2>
                            <p>Calificaciones completadas: <strong id="counter-text" style="color: var(--primary-blue);">0</strong> de ${estudiantesData.length}</p>
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
                        <span>Recuerde: Debe completar las calificaciones de TODOS los estudiantes (<span id="alert-counter">0</span>/${estudiantesData.length}) para guardar los datos.</span>
                    </div>
                </div>
            </div>
        `;

    configurarEventosTabla();
  }

  // --- 5. Lógica de Negocio y Validaciones (La parte jugosa) ---
  function configurarEventosTabla() {
    const inputs = document.querySelectorAll(".grade-input");
    const btnGuardar = document.getElementById("btn-guardar");
    const counterText = document.getElementById("counter-text");
    const alertCounter = document.getElementById("alert-counter");
    const warningAlert = document.getElementById("warning-alert");
    const total = estudiantesData.length;

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
    btnGuardar.addEventListener("click", () => {
      // Cambiar a estado "Guardando..."
      btnGuardar.disabled = true;
      btnGuardar.innerHTML = `
                <svg class="spinner" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                Guardando...
            `;

      // Simulamos la latencia de enviar los datos al servidor
      setTimeout(() => {
        // Volver botón a estado normal y deshabilitarlo
        btnGuardar.innerHTML = `
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                    Guardar Calificaciones
                `;

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
      }, 1200);
    });
  }
});
