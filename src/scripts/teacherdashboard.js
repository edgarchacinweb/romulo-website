import authorize from "../scripts/auth.js";

// Verificación de rol
authorize("docente");

document.addEventListener("DOMContentLoaded", async () => {
  const welcomeNameEl = document.getElementById("welcome-name");
  const sidebarNameEl = document.getElementById("sidebar-user-name");
  const token = localStorage.getItem("auth");

  // 1. Obtener y mostrar datos del docente
  try {
    const response = await fetch(`${window.APP_CONFIG.api_url}/people/get`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const userData = await response.json();
      
      // Actualizamos el saludo principal
      if (welcomeNameEl && userData.Nombre) {
        welcomeNameEl.textContent = `Bienvenido, ${userData.Nombre}`;
      }
      
      // Actualizamos el nombre en la parte inferior de la sidebar
      if (sidebarNameEl && userData.Nombre && userData.Apellido) {
        sidebarNameEl.textContent = `${userData.Nombre} ${userData.Apellido}`;
      }
    } else {
      // Valores por defecto si la sesión es válida pero falla la carga de datos
      if(welcomeNameEl) welcomeNameEl.textContent = "Bienvenido, Docente";
      if(sidebarNameEl) sidebarNameEl.textContent = "Docente";
    }
  } catch (error) {
    console.error("Error al cargar datos del perfil:", error);
    if(welcomeNameEl) welcomeNameEl.textContent = "Bienvenido, Docente";
    if(sidebarNameEl) sidebarNameEl.textContent = "Docente";
  }

  // 2. Control de Cierre de Sesión (Sidebar)
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