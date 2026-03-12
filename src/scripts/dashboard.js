import authorize from "./auth.js";

authorize("administrador");

document.addEventListener("DOMContentLoaded", () => {
  const notificationContainer = document.getElementById("notificationContainer");
  const token = localStorage.getItem("auth");

  // --- 0. INICIALIZAR GRÁFICA (CHART.JS) ---
  const ctx = document.getElementById('resumenChart');
  let resumenChart = null;
  
  if (ctx) {
      resumenChart = new Chart(ctx.getContext('2d'), {
          type: 'bar',
          data: {
              labels: ['Estudiantes Registrados', 'Docentes Activos', 'Inscripciones Activas', 'Inscripciones Rechazadas'],
              datasets: [{
                  label: 'Cantidad',
                  data: [0, 0, 0, 0], 
                  backgroundColor: [
                      'rgba(59, 130, 246, 0.7)', // Azul
                      'rgba(245, 158, 11, 0.7)', // Naranja
                      'rgba(16, 185, 129, 0.7)', // Verde
                      'rgba(239, 68, 68, 0.7)'   // Rojo
                  ],
                  borderColor: [
                      'rgba(59, 130, 246, 1)',
                      'rgba(245, 158, 11, 1)',
                      'rgba(16, 185, 129, 1)',
                      'rgba(239, 68, 68, 1)'
                  ],
                  borderWidth: 1,
                  borderRadius: 6 
              }]
          },
          options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
          }
      });
  }

  // --- 1. Cargar Total de Estudiantes ---
  (async () => {
    try {
      const res = await fetch(`${window.APP_CONFIG.api_url}/registration/count/students`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Error API");
      const data = await res.json();
      const el = document.getElementById("totalStudents");
      if (el) el.innerHTML = `${data.count}`;
      if (resumenChart) { resumenChart.data.datasets[0].data[0] = data.count; resumenChart.update(); }
    } catch (err) { console.error(err); }
  })();

  // --- 2. Cargar Total de Personal Docente ---
  (async () => {
    try {
      const res = await fetch(`${window.APP_CONFIG.api_url}/registration/count/teachers`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Error API");
      const data = await res.json();
      const el = document.getElementById("totalTeachers");
      if (el) el.innerHTML = `${data.count}`;
      if (resumenChart) { resumenChart.data.datasets[0].data[1] = data.count; resumenChart.update(); }
    } catch (err) { console.error(err); }
  })();

  // --- 3. Cargar Período Escolar Actual ---
  (async () => {
    try {
      const res = await fetch(`${window.APP_CONFIG.api_url}/school_term/list`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Error API");
      const terms = await res.json();
      const today = new Date();
      const activeStartYear = today.getMonth() >= 7 ? today.getFullYear() : today.getFullYear() - 1;
      const activeTerm = terms.find((t) => t.FechaInicio && new Date(t.FechaInicio).getFullYear() === activeStartYear);
      
      const el = document.getElementById("schoolTerm");
      if (activeTerm && el) {
        el.innerHTML = `${new Date(activeTerm.FechaInicio).getFullYear()} - ${new Date(activeTerm.FechaFin).getFullYear()}`;
      } else if (el) {
        el.innerHTML = "No Activo"; el.style.color = "#b00020";
      }
    } catch (err) { console.error(err); }
  })();

  // --- 4. Cargar Inscripciones en Espera (Activas) ---
  (async () => {
    try {
      const res = await fetch(`${window.APP_CONFIG.api_url}/registration/count`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Error API");
      const data = await res.json();
      const el = document.getElementById("activeEnrollments");
      if (el) el.innerHTML = `${data.count}`;
      if (resumenChart) { resumenChart.data.datasets[0].data[2] = data.count; resumenChart.update(); }
    } catch (err) { console.error(err); }
  })();

  // --- 5. CARGAR ESTADÍSTICA DE RECHAZADOS (Usando la ruta de /students/filter) ---
  (async () => {
    const rejectedCardValue = document.getElementById("rejectedEnrollments");
    try {
      // Usamos el endpoint de filtrado de estudiantes buscando los que tienen estado "rechazado"
      const res = await fetch(`${window.APP_CONFIG.api_url}/students/filter`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json", 
            Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
            Estado: "rechazado",
            Busqueda: "",
            CursoId: "",
            Seccion: ""
        })
      });
      
      if (!res.ok) throw new Error("Error al consultar estudiantes rechazados");
      
      const data = await res.json();
      // data es un arreglo con los estudiantes rechazados. La cantidad es la longitud del arreglo.
      const totalRechazados = Array.isArray(data) ? data.length : 0;
      
      // Actualizar tarjeta
      if (rejectedCardValue) rejectedCardValue.innerHTML = `${totalRechazados}`;

      // Actualizar gráfica
      if (resumenChart) {
          resumenChart.data.datasets[0].data[3] = totalRechazados;
          resumenChart.update();
      }
      
      // Encender alerta si es mayor a 0
      const rejectedAlert = document.getElementById("rejectedAlert");
      const rejectedCountSpan = document.getElementById("rejectedCount");
      if (totalRechazados > 0 && rejectedAlert && rejectedCountSpan) {
        rejectedCountSpan.textContent = totalRechazados;
        rejectedAlert.classList.add("active");

        // --- NUEVO: Inyectar parámetro en el enlace ---
        const actionLink = rejectedAlert.querySelector(".alert-action");
        if (actionLink) {
            actionLink.href = "/app/admin/estudiantes/?estado=rechazado";
        }
      }
    } catch (err) {
      console.error("Error al cargar rechazados:", err.message);
      if (rejectedCardValue) rejectedCardValue.innerHTML = "0";
    }
  })();

  // --- 6. Botón Cerrar Sesión ---
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (confirm("¿Estás seguro de que quieres cerrar sesión?")) {
        localStorage.clear();
        window.location.href = "/";
      }
    });
  }
});

document.querySelectorAll("a").forEach((anchor) =>
  anchor.addEventListener("click", (event) => {
    if (anchor.href.includes("cerrar-sesion")) return;
    event.preventDefault();
    document.body.style.overflow = "hidden";
    document.body.style.animation = "goodByePage 0.8s forwards";
    setTimeout(() => (window.location.href = anchor.href), 1000);
  })
);