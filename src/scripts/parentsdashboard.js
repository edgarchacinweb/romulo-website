import authorize from "./auth.js";

authorize("representante");

function calcularEdadExacta(fechaNacimiento) {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const diferenciaMeses = hoy.getMonth() - nacimiento.getMonth();
  if (
    diferenciaMeses < 0 ||
    (diferenciaMeses === 0 && hoy.getDate() < nacimiento.getDate())
  ) {
    edad--;
  }
  return edad;
}

document.addEventListener("DOMContentLoaded", async () => {
  const cardContainer = document.getElementById("card-container");
  const notificationsContainer = document.getElementById("notifications");
  const token = localStorage.getItem("auth");

  try {
    // 1. Verificar si hay periodo de inscripción abierto
    let activeEnrollmentPeriod = null;
    try {
        const periodResponse = await fetch(`${window.APP_CONFIG.api_url}/students/check_period`);
        if (periodResponse.ok) {
            activeEnrollmentPeriod = await periodResponse.json();
        }
    } catch (e) { console.log("No hay periodo activo"); }

    // 2. Cargando datos del representante
    const parentDataResponse = await fetch(
      `${window.APP_CONFIG.api_url}/people/get`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const parentData = await parentDataResponse.json();
    if (!parentDataResponse.ok) throw new Error(parentData.message);

    // 3. Cargando datos de los hijos
    const studentsDataResponse = await fetch(
      `${window.APP_CONFIG.api_url}/students/by_parent/${parentData.DatosPersonaId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const studentsData = await studentsDataResponse.json();
    if (!studentsDataResponse.ok) throw new Error(studentsData.message);

    console.log(studentsData);
    studentsData.forEach((student) => {
      const card = document.createElement("div");
      const gender = student.DatosPersona.Sexo === "Femenino" ? "female" : "male";
      const birthdate = new Date(student.FechaNacimiento);
      const estado = student.EstadoEstudiante.Estado; 
      const currentGrade = parseInt(student.Curso.Grado);
      const currentPeriodId = student.Curso.PeriodoEscolarId; 
      
      card.classList.add("card");

      let actionButtonsHTML = "";

      // --- LÓGICA DE BOTÓN DE CORRECCIÓN (RECHAZADO) ---
      if (estado === "rechazado") {
        actionButtonsHTML = `
          <div class="card__section" style="margin-top: 1rem; border-top: 1px solid #eee; padding-top: 1rem;">
             <a href="/app/representante/inscripcion/" 
                class="btn-edit"
                data-id="${student.EstudianteId}"
                style="display: block; width: 100%; padding: 10px; background-color: #dc3545; color: white; text-align: center; border-radius: 8px; text-decoration: none; font-weight: bold; cursor: pointer;">
                <i class="fas fa-edit"></i> Corregir Solicitud
             </a>
             <small style="display:block; text-align:center; color: #666; margin-top:5px;">Revise su correo para ver el motivo.</small>
          </div>
        `;
      } 
      // --- LÓGICA DE REINSCRIPCIÓN ---
      else if (
          estado === "inscrito" && 
          currentGrade < 6 && 
          activeEnrollmentPeriod && 
          activeEnrollmentPeriod.open === true &&
          activeEnrollmentPeriod.periodoEscolarId !== currentPeriodId 
      ) {
          const nextGrade = currentGrade + 1;
          actionButtonsHTML = `
          <div class="card__section" style="margin-top: 1rem; border-top: 1px solid #eee; padding-top: 1rem;">
             <button class="btn-reinscribe" 
                data-id="${student.EstudianteId}" 
                data-next="${nextGrade}"
                style="display: block; width: 100%; padding: 10px; background-color: #6366f1; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
                <i class="fas fa-graduation-cap"></i> Reinscribir a ${nextGrade}° Año
             </button>
          </div>
        `;
      }

      card.innerHTML = `
            <section class="card__student">
              <div class="card__image card__image--${gender}">
                <img
                  class="card__photo"
                  src="${window.APP_CONFIG.api_url}/docs/get/carnet-${student.EstudianteId}.webp"
                  alt="Foto de estudiante"
                  onerror="this.src='/src/assets/default-avatar.png'"
                />
              </div>
              <h3 class="card__name">${student.DatosPersona.Nombre} ${student.DatosPersona.Apellido}</h3>
              <span class="card__identity">V-${student.DatosPersona.Cedula}</span>
            </section>
            <section class="card__data card__data--${gender}">
              <div class="card__section">
                <div class="card__field">
                  <div class="field__title">
                    <svg class="field__icon" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <h4 class="field__legend">Nacimiento</h4>
                  </div>
                  <span class="field__content">${birthdate.getDate()}/${birthdate.getMonth() + 1}/${birthdate.getFullYear()}</span>
                </div>
                <div class="card__field">
                  <div class="field__title">
                    <svg class="field__icon" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <h4 class="field__legend">Edad</h4>
                  </div>
                  <span class="field__content">${calcularEdadExacta(birthdate)} años</span>
                </div>
              </div>
              <div class="card__section">
                <div class="card__field">
                  <div class="field__title">
                    <svg class="field__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 14l9-5-9-5-9 5 9 5z"></path><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path></svg>
                    <h4 class="field__legend">Grado</h4>
                  </div>
                  <span class="field__content">${student.Curso.Grado}° Año</span>
                </div>
                <div class="card__field">
                  <div class="field__title">
                    <svg class="field__icon" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    <h4 class="field__legend">Sección</h4>
                  </div>
                  <span class="field__content">${student.Curso.Seccion}</span>
                </div>
              </div>
              <div class="card__section">
                <div class="card__field card__field--${estado} field__state">
                  <div class="field__title">
                    <svg class="field__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    <h4 class="field__legend">
                      Estado: <span id="state" style="text-transform: capitalize;">${estado}</span>
                    </h4>
                  </div>
                </div>
              </div>
            </section>
            ${actionButtonsHTML}
      `;

      cardContainer.appendChild(card);

      // --- LISTENER PARA CORREGIR (LocalStorage) ---
      const editBtn = card.querySelector(".btn-edit");
      if (editBtn) {
        editBtn.addEventListener("click", (e) => {
          e.preventDefault(); // Evitamos navegación inmediata
          const studentId = editBtn.getAttribute("data-id");
          // Guardamos el ID para que el formulario lo lea
          localStorage.setItem("id_estudiante_rechazado", studentId);
          window.location.href = editBtn.getAttribute("href");
        });
      }

      // --- LISTENER PARA REINSCRIBIR ---
      const reinscribeBtn = card.querySelector(".btn-reinscribe");
      if(reinscribeBtn) {
          reinscribeBtn.addEventListener("click", async () => {
             const nextGrade = reinscribeBtn.getAttribute("data-next");
             const studentId = reinscribeBtn.getAttribute("data-id");

             const confirmAction = confirm(`¿Confirma que desea solicitar la reinscripción para ${nextGrade}° Año?`);
             if (!confirmAction) return;

             try {
                const courseRes = await fetch(`${window.APP_CONFIG.api_url}/course/get_by_grade/${nextGrade}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if(!courseRes.ok) throw new Error("No se encontró el curso para el siguiente año.");
                const courseData = await courseRes.json();
                
                const response = await fetch(`${window.APP_CONFIG.api_url}/students/reinscribe`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        EstudianteId: studentId,
                        NuevoCursoId: courseData.CursoId 
                    })
                });

                const result = await response.json();
                if (response.ok) {
                    alert(result.message);
                    window.location.reload(); 
                } else {
                    alert("Error: " + result.message);
                }
             } catch (error) {
                 alert("No se pudo procesar: " + error.message);
             }
          });
      }
    });

  } catch (Error) {
    console.error(Error.stack);
  }

  // Cerrar sesión
  document.getElementById("logout")?.addEventListener("click", (event) => {
    event.preventDefault();
    if (confirm("¿Segur@ que quieres cerrar sesión?")) {
      localStorage.clear();
      window.location.href = "/app/iniciar-sesion.html";
    }
  });
});