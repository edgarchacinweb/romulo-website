import authorize from "../scripts/auth.js";

authorize("docente");

document.addEventListener("DOMContentLoaded", async () => {
  // === NUEVO: Cargar los datos del docente ===
  const welcomeNameEl = document.getElementById("welcome-name");
  const sidebarNameEl = document.getElementById("sidebar-user-name");
  const token = localStorage.getItem("auth");

  try {
    // Solicitamos los datos personales al servidor (ruta /people/get detecta quién soy por el token)
    const response = await fetch(`${window.APP_CONFIG.api_url}/people/get`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const userData = await response.json();
      
      // Actualizar el título principal (solo primer nombre por estetica)
      if (welcomeNameEl && userData.Nombre) {
        welcomeNameEl.textContent = `Bienvenido, ${userData.Nombre}`;
      }
      
      // Actualizar la barra lateral (Nombre y Apellido)
      if (sidebarNameEl && userData.Nombre && userData.Apellido) {
        sidebarNameEl.textContent = `${userData.Nombre} ${userData.Apellido}`;
      }
    } else {
      // Fallback si algo falla
      if(welcomeNameEl) welcomeNameEl.textContent = "Bienvenido, Docente";
      if(sidebarNameEl) sidebarNameEl.textContent = "Docente";
    }
  } catch (error) {
    console.error("Error obteniendo datos del usuario:", error);
    // Fallback de conexión
    if(welcomeNameEl) welcomeNameEl.textContent = "Bienvenido, Docente";
    if(sidebarNameEl) sidebarNameEl.textContent = "Docente";
  }
  // ============================================

  // Seleccionamos todas las tarjetas y botones
  const cards = document.querySelectorAll(".card");

  // Efecto Tilt (Inclinación) 3D ligero al mover el mouse
  cards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const cardRect = card.getBoundingClientRect();
      const x = e.clientX - cardRect.left;
      const y = e.clientY - cardRect.top;

      const centerX = cardRect.width / 2;
      const centerY = cardRect.height / 2;

      const rotateX = ((y - centerY) / 20) * -1;
      const rotateY = (x - centerX) / 20;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
    });

    // Resetear la transformación cuando el mouse sale
    card.addEventListener("mouseleave", () => {
      card.style.transform =
        "perspective(1000px) rotateX(0) rotateY(0) scale(1)";
    });
  });
});

// Función centralizada para cerrar sesión
const handleLogout = (e) => {
  if (e) e.preventDefault(); // Evita que el enlace de la sidebar "#" suba la página
  const confirmation = confirm("¿Estás seguro de que quieres cerrar la sesión?");
  if (!confirmation) return;
  localStorage.clear();
  window.location.href = "/app/iniciar-sesion.html";
};

// Evento para el botón "Cerrar Sesión" de la tarjeta
const logoutCardBtn = document.getElementById("logout");
if (logoutCardBtn) {
  logoutCardBtn.addEventListener("click", handleLogout);
}

// Evento para el nuevo enlace "Cerrar Sesión" de la barra lateral
const logoutSidebarBtn = document.getElementById("sidebar-logout");
if (logoutSidebarBtn) {
  logoutSidebarBtn.addEventListener("click", handleLogout);
}

document.getElementById("califications").addEventListener("click", () => {
  document.body.style.overflow = "hidden";
  document.body.style.animation = "goodByePage 0.8s forwards";

  setTimeout(
    () => (window.location.href = "/app/docente/calificaciones/"),
    1000,
  );
});

document.getElementById("schedule").addEventListener("click", () => {
  document.body.style.overflow = "hidden";
  document.body.style.animation = "goodByePage 0.8s forwards";

  setTimeout(() => (window.location.href = "/app/docente/horarios/"), 1000);
});