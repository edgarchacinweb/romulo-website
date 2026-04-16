import authorize from "./auth.js";
import { formatCedula } from "./utils.js";

// Verificamos que el usuario tenga el rol de representante
authorize("representante");

/**
 * Función para procesar fechas de nacimiento y evitar errores de formato (NaN)
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  let d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;

  // Soporte para formato latino DD/MM/YYYY si el backend lo envía así
  if (typeof dateStr === 'string' && dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
          const isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
          d = new Date(isoDate);
          if (!isNaN(d.getTime())) return d;
      }
  }
  return null;
}

/**
 * Calcula la edad del estudiante basándose en su fecha de nacimiento
 */
function calcularEdadExacta(fechaNacimientoObj) {
  if (!fechaNacimientoObj) return "??";
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimientoObj);
  if (isNaN(nacimiento.getTime())) return "??";

  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const diferenciaMeses = hoy.getMonth() - nacimiento.getMonth();
  if (diferenciaMeses < 0 || (diferenciaMeses === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
}

/**
 * Formatea la cédula para mostrar el prefijo V- o E- correctamente
 */


document.addEventListener("DOMContentLoaded", async () => {
  const cardContainer = document.getElementById("card-container");
  const notificationsContainer = document.getElementById("notifications");
  const sidebarNameEl = document.getElementById("sidebar-user-name");
  const welcomeNameEl = document.getElementById("welcome-name"); 
  const token = localStorage.getItem("auth");

  try {
    // 1. Verificar si hay un periodo de inscripción activo
    let activeEnrollmentPeriod = null;
    try {
        const periodResponse = await fetch(`${window.APP_CONFIG.api_url}/students/check_period`);
        if (periodResponse.ok) {
            activeEnrollmentPeriod = await periodResponse.json();
        }
    } catch (e) { console.log("Nota: No se pudo verificar periodo activo"); }

    // 2. Obtener datos del Representante conectado
    const parentDataResponse = await fetch(`${window.APP_CONFIG.api_url}/people/get`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
    });

    if (parentDataResponse.ok) {
        const parentData = await parentDataResponse.json();
        
        // Inyectar el nombre del usuario en la interfaz
        if (parentData.Nombre && parentData.Apellido) {
            if (sidebarNameEl) {
                sidebarNameEl.textContent = `${parentData.Nombre} ${parentData.Apellido}`;
            }
            if (welcomeNameEl) {
                welcomeNameEl.textContent = `Bienvenido, ${parentData.Nombre}`;
            }
        }

        // 3. Obtener la lista de estudiantes asociados a este representante
        const studentsDataResponse = await fetch(
          `${window.APP_CONFIG.api_url}/students/by_parent/${parentData.DatosPersonaId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
          }
        );

        if (studentsDataResponse.ok) {
            const rawData = await studentsDataResponse.json();
            
            // Compatibilidad hacia atrás: si rawData es array u objeto
            const studentsData = rawData.estudiantes ? rawData.estudiantes : rawData;
            const periodoAbierto = rawData.hasOwnProperty("periodo_abierto") ? rawData.periodo_abierto : (activeEnrollmentPeriod?.open || false);

            // 4. Renderizar tarjetas
            if (!studentsData || studentsData.length === 0) {
                if (cardContainer) cardContainer.innerHTML = '<p style="color: #666; width: 100%; text-align: center; margin-top: 2rem;">No tienes estudiantes registrados.</p>';
                return;
            }

            // Limpiar contenedor antes de renderizar
            if (cardContainer) cardContainer.innerHTML = "";

            studentsData.forEach((student) => {
              const rawDate = student.FechaNacimiento || student.fechaNacimiento;
              const gender = student.DatosPersona.Sexo === "Femenino" ? "female" : "male";
              const estado = student.EstadoEstudiante.Estado; 
              const currentGrade = parseInt(student.Curso.Grado);
              const currentPeriodId = student.Curso.PeriodoEscolarId;
              
              const birthdateObj = parseDate(rawDate);
              let dateDisplay = birthdateObj ? `${String(birthdateObj.getDate()).padStart(2, '0')}/${String(birthdateObj.getMonth() + 1).padStart(2, '0')}/${birthdateObj.getFullYear()}` : "No registrada";
              let ageDisplay = calcularEdadExacta(birthdateObj);

              const card = document.createElement("div");
              card.classList.add("card");

              let actionButtonsHTML = "";
              if (estado === "rechazado") {
                let corrText = "Corregir Solicitud";
                let corrStyle = "display: block; width: 100%; padding: 10px; background-color: #dc3545; color: white; text-align: center; border-radius: 8px; text-decoration: none; font-weight: bold;";
                let href = `/app/representante/inscripcion/?edit_id=${student.EstudianteId}`;
                
                if (!periodoAbierto) {
                    corrText = "Inscripciones Cerradas";
                    corrStyle += " opacity: 0.5; pointer-events: none; cursor: not-allowed; background-color: #6c757d;";
                    href = "#";
                }

                actionButtonsHTML = `
                  <div class="card__section" style="margin-top: 1rem; border-top: 1px solid #eee; padding-top: 1rem;">
                     <a href="${href}" class="btn-edit" style="${corrStyle}" ${!periodoAbierto ? 'disabled="true"' : ''}>${corrText}</a>
                  </div>`;
              } else if (estado === "inscrito") {
                  actionButtonsHTML = `
                  <div class="card__section" style="margin-top: 1rem; border-top: 1px solid #eee; padding-top: 1rem; display: flex; flex-direction: column; gap: 10px;">
                     <button class="btn-download-form" data-id="${student.EstudianteId}" style="width: 100%; padding: 10px; background-color: #10b981; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Descargar Planilla</button>`;

                  if (currentGrade < 6 && activeEnrollmentPeriod?.open && activeEnrollmentPeriod.periodoEscolarId !== currentPeriodId) {
                     actionButtonsHTML += `<button class="btn-reinscribe" data-id="${student.EstudianteId}" data-next="${currentGrade + 1}" style="width: 100%; padding: 10px; background-color: #6366f1; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Reinscribir a ${currentGrade + 1}° Año</button>`;
                  }
                  actionButtonsHTML += `</div>`;
              }

              card.innerHTML = `
                    <section class="card__student">
                      <div class="card__image card__image--${gender}">
                        <img class="card__photo" src="${window.APP_CONFIG.api_url}/docs/get/carnet-${student.EstudianteId}.webp" onerror="this.src='/src/assets/default-avatar.png'"/>
                      </div>
                      <h3 class="card__name">${student.DatosPersona.Nombre} ${student.DatosPersona.Apellido}</h3>
                      <span class="card__identity">${formatCedula(student.DatosPersona.Cedula)}</span>
                    </section>
                    <section class="card__data card__data--${gender}">
                      <div class="card__section">
                        <div class="card__field"><div class="field__title"><h4 class="field__legend">Nacimiento</h4></div><span class="field__content">${dateDisplay}</span></div>
                        <div class="card__field"><div class="field__title"><h4 class="field__legend">Edad</h4></div><span class="field__content">${ageDisplay} años</span></div>
                      </div>
                      <div class="card__section">
                        <div class="card__field"><div class="field__title"><h4 class="field__legend">Grado</h4></div><span class="field__content">${student.Curso.Grado}° Año</span></div>
                        <div class="card__field"><div class="field__title"><h4 class="field__legend">Sección</h4></div><span class="field__content">${student.Curso.Seccion}</span></div>
                      </div>
                      <div class="card__section">
                        <div class="card__field card__field--${estado} field__state">
                          <div class="field__title"><h4 class="field__legend">Estado: <span style="text-transform: capitalize;">${estado}</span></h4></div>
                        </div>
                      </div>
                    </section>
                    ${actionButtonsHTML}`;

              if (cardContainer) cardContainer.appendChild(card);

              // Eventos de botones
              card.querySelector(".btn-download-form")?.addEventListener("click", async (e) => {
                 const studentId = e.target.getAttribute("data-id");
                 const loader = document.createElement("loader-spinner");
                 document.body.appendChild(loader);
                 try {
                    const response = await fetch(`${window.APP_CONFIG.api_url}/students/enrollment_form/${studentId}`, {
                        method: "GET", headers: { "Authorization": `Bearer ${token}` }
                    });
                    if (!response.ok) throw new Error("Error al generar la planilla");
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `Planilla_${student.DatosPersona.Nombre}.pdf`;
                    a.click();
                    URL.revokeObjectURL(url);
                 } catch (error) {
                    console.error(error);
                 } finally { loader.remove(); }
              });

              card.querySelector(".btn-reinscribe")?.addEventListener("click", (e) => {
                  const next = e.target.getAttribute("data-next");
                  const sid = e.target.getAttribute("data-id");
                  if (confirm(`¿Desea iniciar la reinscripción para ${next}° Año?`)) {
                      window.location.href = `/app/representante/inscripcion/?reinscribe_id=${sid}&next=${next}`;
                  }
              });
            });
        }
    }

  } catch (err) {
    console.error("Error en el Dashboard:", err);
  }

  // Manejo de cierre de sesión
  document.getElementById("logout")?.addEventListener("click", (e) => {
    e.preventDefault();
    if (confirm("¿Segur@ que quieres cerrar sesión?")) {
      localStorage.clear();
      window.location.href = "/app/iniciar-sesion.html";
    }
  });
});