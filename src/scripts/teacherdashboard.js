import authorize from "../scripts/auth.js";

authorize("docente");

document.addEventListener("DOMContentLoaded", () => {
  // Seleccionamos todas las tarjetas y botones
  const cards = document.querySelectorAll(".card");

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

document.getElementById("logout").addEventListener("click", () => {
  const confirmation = confirm(
    "¿Estás seguro de que quieres cerrar la sesión?",
  );
  if (!confirmation) return;
  localStorage.clear();
  window.location.href = "/app/iniciar-sesion.html";
});

document.getElementById("califications").addEventListener("click", () => {
  document.body.style.overflow = "hidden";
  document.body.style.animation = "goodByePage 0.8s forwards";

  setTimeout(
    () => (window.location.href = "/app/docente/calificaciones/"),
    1000,
  );
});
