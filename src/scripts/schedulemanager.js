import authorize from "./auth.js";

authorize("administrador");

document.addEventListener("DOMContentLoaded", () => {
  // Referencias a los elementos del DOM
  const emptyState = document.getElementById("empty-state");
  const notifications = document.getElementById("notifications");
  const resultsContainer = document.getElementById("results-container");
  const schedule = [];
  const blocks = [];
  const teachers = [];

  // Función para simular la carga
});
