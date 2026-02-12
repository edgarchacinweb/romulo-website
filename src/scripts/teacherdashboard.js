import authorize from "../scripts/auth.js";

authorize("docente");

document.addEventListener("DOMContentLoaded", () => {
  // Seleccionamos todas las tarjetas y botones
  const cards = document.querySelectorAll(".card");
  const buttons = document.querySelectorAll(".btn-access");

  // Función para manejar clicks en los botones
  buttons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      // Evitamos que el click se propague al padre (la tarjeta)
      e.stopPropagation();

      const cardTitle = e.target.closest(".card").querySelector("h3").innerText;

      // Simulación de navegación con feedback visual
      e.target.innerText = "Cargando...";
      e.target.style.background = "rgba(255,255,255,0.6)";

      setTimeout(() => {
        alert(`Navegando al módulo: ${cardTitle}`);
        // Resetear botón
        e.target.innerText = "Acceder →";
        e.target.style.background = "";
      }, 500);
    });
  });

  // Efecto Tilt (Inclinación) 3D ligero al mover el mouse
  // Esto es un extra "friki" para que se sienta más dinámico
  cards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const cardRect = card.getBoundingClientRect();
      // Calculamos la posición del mouse relativa a la tarjeta
      const x = e.clientX - cardRect.left;
      const y = e.clientY - cardRect.top;

      // Calculamos el centro
      const centerX = cardRect.width / 2;
      const centerY = cardRect.height / 2;

      // Rotación sutil basada en la posición del mouse
      // Dividimos por 20 para que el ángulo sea pequeño (máx +/- 10 grados aprox)
      const rotateX = ((y - centerY) / 20) * -1; // Invertimos eje Y
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
