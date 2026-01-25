import authorize from "./auth.js";

authorize("representante");

const loader = document.createElement("loader-spinner");
document.body.appendChild(loader);

const token = localStorage.getItem("auth") ?? "";

document.addEventListener("DOMContentLoaded", async () => {
  // Campos del formulario
  const photoPreview = document.getElementById("photoPreview");
  const photoField = document.getElementById("photoUploadInput");
  const firstNameField = document.getElementById("firstNameField");
  const lastNameField = document.getElementById("lastNameField");
  const identityField = document.getElementById("identityField");
  const genderField = document.getElementById("genderField");
  const emailField = document.getElementById("emailField");
  const phoneField = document.getElementById("phoneField");
  const occupationField = document.getElementById("occupationField");
  const addressField = document.getElementById("addressField");

  // Icono de la previsualización de la foto de perfil
  const uploadIcon = photoPreview.querySelector(".upload-icon");

  // Cargando datos del representante
  try {
    // Obteniendo datos
    const parentDataResponse = await fetch(
      `${window.APP_CONFIG.api_url}/people/get`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!parentDataResponse.ok) throw Error();
    const parentData = await parentDataResponse.json();

    // Cargando datos del usuario
    const parentUserDataResponse = await fetch(
      `${window.APP_CONFIG.api_url}/user/get`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!parentUserDataResponse.ok) throw Error();
    const parentUserData = await parentUserDataResponse.json();

    // Cargando foto de perfil
    const profilePhotoResponse = await fetch(
      `${window.APP_CONFIG.api_url}/docs/get/carnet-${parentData.DatosPersonaId}.webp`,
      {
        method: "GET",
        headers: {
          "Content-Type": "image/webp",
        },
      },
    );

    if (profilePhotoResponse.ok) {
      const profilePhoto = await profilePhotoResponse.blob();
      const parentProfilePhoto = URL.createObjectURL(profilePhoto);
      photoPreview.style.backgroundImage = `url(${parentProfilePhoto})`;
      uploadIcon.style.display = "none";
    }

    // Cargando datos en los campos del formulario
    firstNameField.value = parentData["Nombre"] ?? "";
    lastNameField.value = parentData["Apellido"] ?? "";
    identityField.value = `V-${parentData["Cedula"]}` ?? "";
    genderField.value = parentData["Sexo"] ?? "";
    emailField.value = parentUserData["Email"] ?? "";
    phoneField.value = parentData["Telefono"] ?? "";
    occupationField.value = parentData["Ocupacion"] ?? "";
    addressField.value = parentData["Direccion"] ?? "";

    loader.remove();
  } catch (error) {
    alert("Ocurrió un error al cargar los datos del representante...");
    window.location.href = "/app/representante/inicio/";
    return;
  }

  // --- Funcionalidad: Previsualización de Foto de Perfil ---
  const photoInput = document.getElementById("photoUploadInput");

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
