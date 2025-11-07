const role = localStorage.getItem("role");
if (!role || role !== "administrador")
  window.location.href = "/app/iniciar-sesion.html";

document.addEventListener("DOMContentLoaded", () => {
  // Botón para cerrar sesión
  document.getElementById("logoutBtn").addEventListener("click", (e) => {
    e.preventDefault();

    const logout = confirm("¿Estás seguro de que quieres cerrar sesión?");
    if (logout) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      window.location.href = "/";
    }
  });
});
