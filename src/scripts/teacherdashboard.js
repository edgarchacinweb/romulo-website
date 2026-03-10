import authorize from "../scripts/auth.js";

// Verificación de rol
authorize("docente");

// Función de utilidad para convertir sección numérica a letra (1->A, 2->B)
const numberToLetter = (num) => {
  return String.fromCharCode(64 + parseInt(num)); 
};

document.addEventListener("DOMContentLoaded", async () => {
  const welcomeNameEl = document.getElementById("welcome-name");
  const sidebarNameEl = document.getElementById("sidebar-user-name");
  const kpiSubjects = document.getElementById("kpi-subjects");
  const kpiClasses = document.getElementById("kpi-classes");
  const kpiAttendance = document.getElementById("kpi-attendance"); // Elemento para la estadística
  const scheduleContainer = document.getElementById("today-schedule-container");
  
  const token = localStorage.getItem("auth");

  // A. Mostrar fecha actual dinámicamente
  const dateEl = document.getElementById("current-date");
  if (dateEl) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    let dateString = today.toLocaleDateString('es-ES', options);
    dateString = dateString.charAt(0).toUpperCase() + dateString.slice(1);
    dateEl.textContent = dateString;
  }

  try {
    // 1. Cargar Datos Personales del Docente (Nombre para el saludo)
    const profileRes = await fetch(`${window.APP_CONFIG.api_url}/people/get`, {
      method: "GET",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    });

    if (profileRes.ok) {
      const userData = await profileRes.json();
      if (welcomeNameEl && userData.Nombre) welcomeNameEl.textContent = `Bienvenido, ${userData.Nombre}`;
      if (sidebarNameEl && userData.Nombre && userData.Apellido) sidebarNameEl.textContent = `${userData.Nombre} ${userData.Apellido}`;
    }

    // 2. Obtener el ID interno del Docente
    const teacherIdRes = await fetch(`${window.APP_CONFIG.api_url}/teacher/get`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    });
    if (!teacherIdRes.ok) throw new Error("No se pudo obtener el ID del docente.");
    const teacherData = await teacherIdRes.json();
    const docenteId = teacherData.DocenteId;

    // 3. Obtener materias asignadas (KPI)
    let mySubjects = [];
    const subjectsRes = await fetch(`${window.APP_CONFIG.api_url}/teacher/subjects`, {
      method: "GET",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    });
    if (subjectsRes.ok) {
        mySubjects = await subjectsRes.json();
        if(kpiSubjects) kpiSubjects.textContent = mySubjects.length || "0";
    }

    // 4. Obtener estadísticas de Asistencia Mensual (KPI)
    if (kpiAttendance) {
        const attRes = await fetch(`${window.APP_CONFIG.api_url}/assistance/teacher/monthly_stats`, {
            method: "GET",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
        });
        if (attRes.ok) {
            const attData = await attRes.json();
            // Si el total de listas pasadas es 0, no hay porcentaje aún
            if (attData.total === 0) {
                kpiAttendance.textContent = "N/A";
            } else {
                kpiAttendance.textContent = `${attData.porcentaje}%`;
            }
        } else {
            kpiAttendance.textContent = "-";
        }
    }

    // 5. Determinar el Período Escolar Activo
    const termsRes = await fetch(`${window.APP_CONFIG.api_url}/school_term/list`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    });
    const terms = await termsRes.json();
    if(terms.length === 0) throw new Error("No hay periodos escolares registrados.");
    
    // Tomamos el primer período que devuelva la API
    const activeTermId = terms[0].PeriodoEscolarId; 

    // 6. Descargar todo el horario de este período
    const allScheduleRes = await fetch(`${window.APP_CONFIG.api_url}/schedule/list/${activeTermId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    });
    const allSchedule = await allScheduleRes.json();

    // 7. Filtrar el horario para ESTE DOCENTE y para HOY
    const daysMap = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const todayName = daysMap[new Date().getDay()]; 
    
    // Si estás programando y quieres probar qué pasa un día de semana, descomenta la siguiente línea y pon un día en el que el docente tenga clase:
    // const todayName = "Lunes"; 

    const myTodaySchedule = allSchedule.filter(s => s.DocenteId === docenteId && s.Dia === todayName);

    // Actualizamos el KPI de Clases de Hoy
    if(kpiClasses) kpiClasses.textContent = myTodaySchedule.length;

    // 8. Renderizar el horario
    if (myTodaySchedule.length === 0) {
        scheduleContainer.innerHTML = `
        <div style="padding: 3rem 2rem; text-align: center; color: #64748b;">
            <i class="fa-solid fa-mug-hot" style="font-size: 2.5rem; margin-bottom: 1rem; color: #cbd5e1;"></i>
            <h3 style="color: #334155; font-size: 1.1rem; margin-bottom: 0.5rem;">Día Libre</h3>
            <p style="font-size: 0.9rem;">No tienes clases asignadas para hoy (${todayName}).</p>
        </div>`;
    } else {
        // Consultar bloques de hora y lista de cursos
        const [blocksRes, coursesRes] = await Promise.all([
            fetch(`${window.APP_CONFIG.api_url}/schedule/blocks`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${window.APP_CONFIG.api_url}/course/get_all`, { headers: { "Content-Type": "application/json" } })
        ]);
        
        const blocks = await blocksRes.json();
        const courses = await coursesRes.json();

        // Ordenamos las clases del día por hora de inicio
        myTodaySchedule.sort((a, b) => {
            const blockA = blocks.find(bl => bl.BloqueHorarioId === a.BloqueHorarioId);
            const blockB = blocks.find(bl => bl.BloqueHorarioId === b.BloqueHorarioId);
            if (!blockA || !blockB) return 0;
            return blockA.HoraInicio.localeCompare(blockB.HoraInicio);
        });

        scheduleContainer.innerHTML = ""; // Limpiamos el loader

        myTodaySchedule.forEach((cls, index) => {
            const timeBlock = blocks.find(b => b.BloqueHorarioId === cls.BloqueHorarioId) || { HoraInicio: "--:--", HoraFin: "--:--" };
            const courseInfo = courses.find(c => c.CursoId === cls.CursoId);
            const subjectInfo = mySubjects.find(s => s.MateriaId === cls.MateriaId) || { Nombre: "Materia Desconocida" };
            
            const gradeName = courseInfo ? courseInfo.Grado : "Grado N/A";
            const sectionLetter = numberToLetter(cls.Seccion); 

            // La primera clase del día la marcamos visualmente con el botón principal verde
            const activeClass = index === 0 ? " active" : "";
            const btnHtml = index === 0 
                ? `<a href="../asistencia/index.html"><button class="btn-action btn-primary">Tomar Asistencia</button></a>`
                : `<button class="btn-action btn-outline">Ver Detalles</button>`;

            const itemHTML = `
            <div class="schedule-item${activeClass}">
                <div class="s-time">${timeBlock.HoraInicio}<span>${timeBlock.HoraFin}</span></div>
                <div class="s-details">
                <h4>${subjectInfo.Nombre}</h4>
                <p>${gradeName} Año "${sectionLetter}" • ${todayName}</p>
                </div>
                <div>
                ${btnHtml}
                </div>
            </div>`;
            
            scheduleContainer.insertAdjacentHTML('beforeend', itemHTML);
        });
    }

  } catch (error) {
    console.error("Error al construir el dashboard:", error);
    if(kpiSubjects) kpiSubjects.textContent = "0";
    if(kpiClasses) kpiClasses.textContent = "0";
    
    if (scheduleContainer) {
        scheduleContainer.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: #ef4444;">
            <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; margin-bottom: 1rem;"></i>
            <p>Ocurrió un error al cargar tu horario. Intenta recargar la página.</p>
        </div>`;
    }
  }

  // Control de Cierre de Sesión (Sidebar)
  const logoutSidebarBtn = document.getElementById("sidebar-logout");
  if (logoutSidebarBtn) {
    logoutSidebarBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const confirmation = confirm("¿Estás seguro de que quieres cerrar la sesión?");
      if (confirmation) {
        localStorage.clear();
        window.location.href = "/app/iniciar-sesion.html";
      }
    });
  }
});