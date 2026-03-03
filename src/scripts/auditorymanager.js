import authorize from "./auth";

authorize("administrador");

document.addEventListener("DOMContentLoaded", () => {
  // 1. Lógica para los Dropdowns Personalizados
  const customSelects = document.querySelectorAll(".custom-select");

  customSelects.forEach((select) => {
    const trigger = select.querySelector(".select-trigger");
    const options = select.querySelectorAll(".select-options li");
    const selectedValueDisplay = select.querySelector(".selected-value");

    // Alternar menú al hacer clic
    trigger.addEventListener("click", (e) => {
      // Cerramos otros selectores abiertos antes de abrir este
      closeAllSelects(select);
      select.classList.toggle("active");
      e.stopPropagation(); // Evita que el click cierre inmediatamente el menú
    });

    // Manejar selección de opciones
    options.forEach((option) => {
      option.addEventListener("click", (e) => {
        // Actualizar texto mostrado
        selectedValueDisplay.textContent = option.textContent;

        // Actualizar clases de selección
        options.forEach((opt) => opt.classList.remove("selected"));
        option.classList.add("selected");

        // Cerrar menú
        select.classList.remove("active");
        e.stopPropagation();
      });
    });
  });

  // Cerrar selectores si se hace clic fuera de ellos
  document.addEventListener("click", () => {
    closeAllSelects();
  });

  function closeAllSelects(exceptSelect = null) {
    customSelects.forEach((select) => {
      if (select !== exceptSelect) {
        select.classList.remove("active");
      }
    });
  }

  // 2. Lógica para la Animación de Salida y Redirección
  const btnSalir = document.getElementById("btn-salir");
  const appWrapper = document.getElementById("app-wrapper");

  btnSalir.addEventListener("click", (e) => {
    e.preventDefault(); // Prevenir comportamiento por defecto

    // Reemplazar clase de entrada por clase de salida
    appWrapper.classList.remove("fade-in-up");
    appWrapper.classList.add("fade-out-down");

    // Esperar a que termine la animación (500ms definidos en CSS) para redirigir
    setTimeout(() => {
      window.location.href = "/app/docentes/inicio";
    }, 500);
  });
});
