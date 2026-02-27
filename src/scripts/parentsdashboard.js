import authorize from "./auth.js";

authorize("representante");

/**
 * Función robusta para leer fechas en varios formatos
 * Corrige el problema de NaN en fechas
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  // Intento 1: Parseo directo (ISO format YYYY-MM-DD)
  let d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d; // Si es válida, la devolvemos

  // Intento 2: Formato latino DD/MM/YYYY (por si acaso el backend lo manda formateado)
  if (typeof dateStr === 'string' && dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
          // Reordenamos a YYYY-MM-DD para que JS lo entienda
          const isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
          d = new Date(isoDate);
          if (!isNaN(d.getTime())) return d;
      }
  }
  
  return null;
}

function calcularEdadExacta(fechaNacimientoObj) {
  if (!fechaNacimientoObj) return "??";
  
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimientoObj);
  
  if (isNaN(nacimiento.getTime())) return "??";

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

// --- FUNCIÓN HELPER PARA FORMATEAR CÉDULA (ACTUALIZADA) ---
const formatCedula = (cedula) => {
    let str = String(cedula).toUpperCase().trim();
    
    // 1. DETECCIÓN DE CÉDULA ESCOLAR (> 9 dígitos)
    if (str.length > 9) {
        if (str.startsWith("E")) return str;
        if (str.startsWith("V")) return str;
        return "V-" + str;
    }

    // 2. LÓGICA PARA CÉDULA REGULAR (<= 9 dígitos)
    if (str.startsWith("V-") || str.startsWith("E-")) return str;
    if (str.startsWith("V")) return "V-" + str.substring(1);
    if (str.startsWith("E")) return "E-" + str.substring(1);
    return `V-${str}`;
};

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
    } catch (e) { console.log("Nota: No se pudo verificar periodo activo"); }

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

    // 4. Generar Tarjetas
    if (studentsData.length === 0) {
        cardContainer.innerHTML = '<p style="color: #666; width: 100%; text-align: center; margin-top: 2rem;">No tienes estudiantes registrados.</p>';
    }

    studentsData.forEach((student) => {
      const rawDate = student.FechaNacimiento || student.fechaNacimiento || student.fechanacimiento;
      const card = document.createElement("div");
      const gender = student.DatosPersona.Sexo === "Femenino" ? "female" : "male";
      const estado = student.EstadoEstudiante.Estado; 
      const currentGrade = parseInt(student.Curso.Grado);
      const currentPeriodId = student.Curso.PeriodoEscolarId;
      
      const birthdateObj = parseDate(rawDate);
      let dateDisplay = "No registrada";
      let ageDisplay = "??";

      if (birthdateObj) {
          const day = String(birthdateObj.getDate()).padStart(2, '0');
          const month = String(birthdateObj.getMonth() + 1).padStart(2, '0');
          const year = birthdateObj.getFullYear();
          dateDisplay = `${day}/${month}/${year}`;
          ageDisplay = calcularEdadExacta(birthdateObj);
      }

      card.classList.add("card");

      // --- LÓGICA DE BOTONES ---
      let actionButtonsHTML = "";

      if (estado === "rechazado") {
        actionButtonsHTML = `
          <div class="card__section" style="margin-top: 1rem; border-top: 1px solid #eee; padding-top: 1rem;">
             <a href="/app/representante/inscripcion/?edit_id=${student.EstudianteId}" 
                class="btn-edit"
                style="display: block; width: 100%; padding: 10px; background-color: #dc3545; color: white; text-align: center; border-radius: 8px; text-decoration: none; font-weight: bold; cursor: pointer;">
                <i class="fas fa-edit"></i> Corregir Solicitud
             </a>
             <small style="display:block; text-align:center; color: #666; margin-top:5px;">Revise su correo para ver el motivo.</small>
          </div>
        `;
      } 
      else if (estado === "inscrito") {
          actionButtonsHTML = `
          <div class="card__section" style="margin-top: 1rem; border-top: 1px solid #eee; padding-top: 1rem; display: flex; flex-direction: column; gap: 10px;">
             <button class="btn-download-form" data-id="${student.EstudianteId}"
                style="display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 10px; background-color: #10b981; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Descargar Planilla
             </button>
         `;

          // Botón opcional de reinscripción si cumple las reglas de periodo
          if (
              currentGrade < 6 && 
              activeEnrollmentPeriod && 
              activeEnrollmentPeriod.open === true &&
              activeEnrollmentPeriod.periodoEscolarId !== currentPeriodId 
          ) {
             const nextGrade = currentGrade + 1;
             actionButtonsHTML += `
               <button class="btn-reinscribe" 
                  data-id="${student.EstudianteId}" 
                  data-next="${nextGrade}"
                  style="display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 10px; background-color: #6366f1; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
                  Reinscribir a ${nextGrade}° Año
               </button>
             `;
          }
          actionButtonsHTML += `</div>`;
      }

      // CORRECCIÓN APLICADA AQUÍ:
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
              <span class="card__identity">${formatCedula(student.DatosPersona.Cedula)}</span>
            </section>

            <section class="card__data card__data--${gender}">
              <div class="card__section">
                <div class="card__field">
                  <div class="field__title">
                    <svg class="field__icon" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <h4 class="field__legend">Nacimiento</h4>
                  </div>
                  <span class="field__content">${dateDisplay}</span>
                </div>
                <div class="card__field">
                  <div class="field__title">
                    <svg class="field__icon" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <h4 class="field__legend">Edad</h4>
                  </div>
                  <span class="field__content">${ageDisplay} años</span>
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

      // --- EVENTO: Descargar Planilla ---
      const downloadBtn = card.querySelector(".btn-download-form");
      if(downloadBtn) {
          downloadBtn.addEventListener("click", async () => {
             const studentId = downloadBtn.getAttribute("data-id");
             const studentName = student.DatosPersona.Nombre;
             
             // Mostramos loader
             const loader = document.createElement("loader-spinner");
             loader.setAttribute("title", "Generando planilla PDF...");
             document.body.appendChild(loader);

             try {
                const response = await fetch(`${window.APP_CONFIG.api_url}/students/enrollment_form/${studentId}`, {
                    method: "GET",
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || "Error al generar la planilla");
                }

                // Descarga
                const blob = await response.blob();
                const objectUrl = URL.createObjectURL(blob);
                
                const anchor = document.createElement("a");
                anchor.href = objectUrl;
                anchor.download = `Planilla_Inscripcion_${studentName}.pdf`;
                document.body.appendChild(anchor);
                anchor.click();
                anchor.remove();
                URL.revokeObjectURL(objectUrl);
                
             } catch (error) {
                console.error(error);
                const notification = document.createElement("notification-component");
                notification.setAttribute("type", "error");
                notification.setAttribute("text", error.message);
                notificationsContainer.appendChild(notification);
             } finally {
                loader.remove();
             }
          });
      }

      const reinscribeBtn = card.querySelector(".btn-reinscribe");
      if(reinscribeBtn) {
          reinscribeBtn.addEventListener("click", () => {
             const nextGrade = reinscribeBtn.getAttribute("data-next");
             const studentId = reinscribeBtn.getAttribute("data-id");

             const confirmAction = confirm(`¿Desea iniciar el proceso de reinscripción para ${nextGrade}° Año?`);
             if (!confirmAction) return;

             window.location.href = `/app/representante/inscripcion/?reinscribe_id=${studentId}&next=${nextGrade}`;
          });
      }
    });

  } catch (Error) {
    console.error(Error.stack);
  }

  document.getElementById("logout")?.addEventListener("click", (event) => {
    event.preventDefault();
    const confirmation = confirm("¿Segur@ que quieres cerrar sesión?");
    if (confirmation) {
      localStorage.clear();
      window.location.href = "/app/iniciar-sesion.html";
    }
  });
});