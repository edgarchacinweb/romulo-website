import authorize from "./auth.js";

authorize("representante");
const token = localStorage.getItem("auth");

document.addEventListener("DOMContentLoaded", () => {
  // Referencias al DOM
  const selectTrigger = document.querySelector(".select-trigger");
  const selectOptions = document.querySelectorAll(".select-options li");
  const customSelect = document.getElementById("student-select");
  const selectedValueText = document.querySelector(".selected-value");

  const emptyState = document.getElementById("empty-state");
  const studentData = document.getElementById("student-data");
  const btnSalir = document.getElementById("btn-salir");
  const appWrapper = document.getElementById("app-wrapper");

  // 1. Lógica del Selector de Estudiante
  selectTrigger.addEventListener("click", (e) => {
    customSelect.classList.toggle("active");
    e.stopPropagation();
  });

  // Cerrar el selector si se hace clic fuera
  document.addEventListener("click", () => {
    customSelect.classList.remove("active");
  });

  // Manejar la selección de un estudiante
  selectOptions.forEach((option) => {
    option.addEventListener("click", (e) => {
      // Cambiar el texto del selector (simula que escogimos "Juan Carlos")
      selectedValueText.textContent = option.textContent;
      selectedValueText.style.color = "#1e293b"; // Texto más oscuro al seleccionar

      customSelect.classList.remove("active");

      // Magia: Ocultar el estado vacío y mostrar los datos con animación
      emptyState.classList.remove("active");
      studentData.classList.add("active");

      e.stopPropagation();
    });
  });

  // 2. Lógica del botón Salir (Animación y Redirección)
  btnSalir.addEventListener("click", (e) => {
    e.preventDefault();

    // Cambiamos la animación de entrada por la de salida
    appWrapper.classList.remove("fade-in-up");
    appWrapper.classList.add("fade-out-down");

    // Esperamos 400ms (lo que dura la animación CSS) para cambiar de página
    setTimeout(() => {
      window.location.href = "/app/docentes/inicio";
    }, 400);
  });
});
