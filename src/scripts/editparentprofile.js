import authorize from "./auth.js";

authorize("representante");

document.addEventListener("DOMContentLoaded", () => {
  // --- Funcionalidad: Previsualización de Foto de Perfil ---
  const photoInput = document.getElementById("photoUploadInput");
  const photoPreview = document.getElementById("photoPreview");
  const uploadIcon = photoPreview.querySelector(".upload-icon");

  photoInput.addEventListener("change", function (e) {
    const file = e.target.files[0];

    if (file) {
      // Validar tamaño (Ej: 5MB mencionado en el diseño)
      if (file.size > 5 * 1024 * 1024) {
        alert("El archivo es demasiado grande. El tamaño máximo es 5MB.");
        this.value = ""; // Limpiar el input
        return;
      }

      // Validar tipo de imagen simple
      if (!file.type.startsWith("image/")) {
        alert(
          "Por favor seleccione un archivo de imagen válido (JPG, PNG, GIF).",
        );
        this.value = "";
        return;
      }

      const reader = new FileReader();

      reader.onload = function (event) {
        // Ocultar el icono de subida por defecto
        uploadIcon.style.display = "none";
        // Establecer la imagen como fondo del contenedor de previsualización
        photoPreview.style.backgroundImage = `url('${event.target.result}')`;
      };

      reader.readAsDataURL(file);
    }
  });

  // --- Funcionalidad: Alternar Visibilidad de Contraseña ---
  const togglePasswordButtons = document.querySelectorAll(".toggle-password");

  togglePasswordButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Encontrar el input asociado (el hermano anterior en el DOM dentro del wrapper)
      const input = this.previousElementSibling;

      // Encontrar los iconos dentro de este botón específico
      const eyeOpen = this.querySelector(".eye-open");
      const eyeClosed = this.querySelector(".eye-closed");

      if (input.type === "password") {
        input.type = "text";
        eyeOpen.classList.add("hidden");
        eyeClosed.classList.remove("hidden");
        this.setAttribute("aria-label", "Ocultar contraseña");
      } else {
        input.type = "password";
        eyeOpen.classList.remove("hidden");
        eyeClosed.classList.add("hidden");
        this.setAttribute("aria-label", "Mostrar contraseña");
      }
    });
  });

  // --- Efecto extra: Animación suave al hacer scroll (opcional) ---
  // Se podría implementar IntersectionObserver para animar secciones al entrar en pantalla,
  // pero las animaciones CSS de entrada (fade-in-up) al cargar ya cubren la petición de efectos.
});
