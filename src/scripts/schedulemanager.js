import authorize from "./auth.js";

authorize("administrador");

document.addEventListener("DOMContentLoaded", () => {
  // Referencias a los elementos del DOM
  const btnCargar = document.getElementById("btn-cargar");
  const emptyState = document.getElementById("empty-state");
  const resultsContainer = document.getElementById("results-container");

  // Función para simular la carga
  btnCargar.addEventListener("click", () => {
    // Validación visual simple (opcional)
    // Podrías chequear si los selects tienen valor, pero por ahora solo haremos la transición.

    // Ocultar el estado vacío
    emptyState.style.display = "none";

    // Mostrar el contenedor de resultados
    resultsContainer.classList.remove("hidden");

    // Scroll suave hacia los resultados
    resultsContainer.scrollIntoView({ behavior: "smooth", block: "start" });

    // Cambiar texto del botón para feedback (opcional)
    const originalText = btnCargar.innerHTML;
    btnCargar.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Actualizar
        `;
  });
});
