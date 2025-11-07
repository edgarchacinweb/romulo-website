const token = localStorage.getItem("auth");
if (!token) window.location.href = "/app/iniciar-sesion.html";

(async () => {
  const response = await fetch(`${window.APP_CONFIG.api_url}/user/get`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (data.Rol !== "administrador") {
    localStorage.removeItem("auth");
    localStorage.removeItem("role");
    window.location.href = "/app/iniciar-sesion.html";
  }
})();

document.addEventListener("DOMContentLoaded", () => {
  // Botón para cerrar sesión
  document.getElementById("logoutBtn").addEventListener("click", (e) => {
    e.preventDefault();

    const logout = confirm("¿Estás seguro de que quieres cerrar sesión?");
    if (logout) {
      localStorage.removeItem("auth");
      localStorage.removeItem("role");
      window.location.href = "/";
    }
  });
});
