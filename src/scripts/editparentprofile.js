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
  const identityUploadField = document.getElementById("IdentityUploadInput");
  const genderField = document.getElementById("genderField");
  const emailField = document.getElementById("emailField");
  const phoneField = document.getElementById("phoneField");
  const phonePrefixField = document.getElementById("phonePrefixField");
  const occupationField = document.getElementById("occupationField");
  const addressField = document.getElementById("addressField");
  const currentPasswordField = document.getElementById("current-password");
  const newPasswordField = document.getElementById("new-password");
  const confirmPasswordField = document.getElementById("confirm-password");
  const btnSubmit = document.getElementById("BtnSubmit");

  // Icono de la previsualización de la foto de perfil
  // Verificamos que photoPreview exista para evitar errores si el DOM cambia
  const uploadIcon = photoPreview ? photoPreview.querySelector(".upload-icon") : null;

  // Contenedor de notificaciones
  const notificationsContainer = document.getElementById("notifications");

  const loadedUserData = {
    Telefono: "",
    Ocupacion: "",
    Direccion: "",
    Clave: "",
  };

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
    loadedUserData["Telefono"] = parentData["Telefono"] ?? "";
    loadedUserData["Ocupacion"] = parentData["Ocupacion"] ?? "";
    loadedUserData["Direccion"] = parentData["Direccion"] ?? "";

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
    try {
        const profilePhotoResponse = await fetch(
        `${window.APP_CONFIG.api_url}/docs/get/carnet-${parentUserData.UsuarioId}.webp`,
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
        if (photoPreview) {
            photoPreview.style.backgroundImage = `url(${parentProfilePhoto})`;
            if (uploadIcon) uploadIcon.style.display = "none";
        }
        }
    } catch (e) {
        console.warn("No se pudo cargar la foto o no existe", e);
    }

    // Cargando datos en los campos del formulario
    firstNameField.value = parentData["Nombre"] ?? "";
    lastNameField.value = parentData["Apellido"] ?? "";
    identityField.value = `V-${parentData["Cedula"]}` ?? "";
    
    // --- CORRECCIÓN DEL GÉNERO ---
    const sexoRecibido = parentData["Sexo"] ?? "";
    genderField.value = sexoRecibido;

    // Verificación de seguridad: Si el valor no se puso (porque el HTML está mal), lo forzamos
    if (genderField.value !== sexoRecibido && sexoRecibido) {
        console.warn("Corrigiendo error de HTML en selector de género...");
        // Buscamos la opción que tenga el TEXTO igual al género (ej: "Femenino")
        Array.from(genderField.options).forEach(option => {
            if (option.text === sexoRecibido || option.label === sexoRecibido) {
                genderField.value = option.value;
            }
        });
    }
    // -----------------------------

    emailField.value = parentUserData["Email"] ?? "";
    occupationField.value = parentData["Ocupacion"] ?? "";
    addressField.value = parentData["Direccion"] ?? "";

    const phone = parentData["Telefono"] ?? "";
    const [prefix, phoneNumber] = phone.split("-");
    phonePrefixField.value = prefix || "0412";
    phoneField.value = phoneNumber ?? "";

    loader.remove();
  } catch (error) {
    console.error(error);
    alert("Ocurrió un error al cargar los datos del representante...");
    window.location.href = "/app/representante/inicio/";
    return;
  }

  // -- Guardando datos del representante
  btnSubmit.addEventListener("click", async (event) => {
    event.preventDefault();
    loader.setAttribute("title", "Actualizando perfil...");
    document.body.appendChild(loader);

    try {
      const newUserData = {
        Telefono: `${phonePrefixField.value}-${phoneField.value}`,
        Ocupacion: occupationField.value.trim(),
        Direccion: addressField.value.trim(),
        Clave: newPasswordField.value.trim(),
      };

      const filteredData = Object.fromEntries(
        Object.entries(newUserData).filter(
          ([key, value]) => value !== loadedUserData[key],
        ),
      );

      if (
        Object.keys(filteredData).length === 0 &&
        !photoField.files[0] &&
        !identityUploadField.files[0]
      ) {
        throw new Error("No hay campos que actualizar");
      } else if (
        filteredData.Clave &&
        currentPasswordField.value.trim().length === 0
      ) {
        throw new Error("Debes indicar la clave actual");
      } else if (
        filteredData.Telefono &&
        !new RegExp(/^(0412|0414|0416|0422|0424|0426)-\d{7}$/).test(
          filteredData["Telefono"],
        )
      ) {
        phoneField.focus();
        throw new Error("El número de teléfono presenta un formato inválido.");
      } else if (
        filteredData.Ocupacion &&
        (filteredData.Ocupacion.length < 3 ||
          !new RegExp(
            /^[a-zA-ZÀ-ÿ\u00f1\u00d1]+(\s?[a-zA-ZÀ-ÿ\u00f1\u00d1\.\-]+)*$/,
          ).test(filteredData.Ocupacion))
      ) {
        occupationField.focus();
        throw new Error("La ocupación presenta un formato inválido.");
      } else if (
        filteredData.Direccion &&
        (filteredData.Direccion.length < 5 ||
          !new RegExp(
            /^[a-zA-Z0-9À-ÿ\u00f1\u00d1][a-zA-Z0-9À-ÿ\u00f1\u00d1\s\.,#\-\/°\(\)]{4,254}$/,
          ).test(filteredData.Direccion))
      ) {
        addressField.focus();
        throw new Error(
          "La dirección de habitación presenta un formato incorrecto.",
        );
      } else if (
        filteredData.Clave &&
        confirmPasswordField.value.trim().length === 0
      ) {
        throw new Error(
          "Debes escribir otra vez la contraseña a modo de confirmación",
        );
      } else if (
        filteredData.Clave &&
        !new RegExp(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&._-])[A-Za-z\d$@$!%*?&._-]{8,}$/,
        ).test(filteredData.Clave)
      ) {
        newPasswordField.focus();
        throw new Error(
          "Formato de contraseña inválido. Debe contener al menos 1 letra minúscula, 1 letrea mayúscula y 1 símbolo",
        );
      }

      // Agrupando datos en un objeto FormData
      const formData = new FormData();
      if (photoField.files[0]) formData.append("Foto", photoField.files[0]);
      if (identityUploadField.files[0])
        formData.append("DNI", identityUploadField.files[0]);
      if (currentPasswordField.value.trim().length > 0)
        formData.append("VClave", currentPasswordField.value.trim());
      if (confirmPasswordField.value.trim().length > 0)
        formData.append("RClave", confirmPasswordField.value.trim());
      Object.entries(newUserData).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      // Envíando datos al servidor
      const uploadDataResponse = await fetch(
        `${window.APP_CONFIG.api_url}/user/parent/update`,
        {
          method: "PATCH",
          body: formData,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!uploadDataResponse.ok) {
        const error = await uploadDataResponse.json();
        throw new Error(
          error.message ?? "Error al actualizar los datos del representante",
        );
      }

      const notification = document.createElement("notification-component");
      notification.setAttribute(
        "text",
        "Datos del representante actualizados correctamente",
      );
      notification.setAttribute("type", "success");
      notificationsContainer.appendChild(notification);

      setTimeout(
        () => (window.location.href = "/app/representante/editar-perfil/"),
        2000,
      );
    } catch (Error) {
      console.error(Error.stack);
      const notification = document.createElement("notification-component");
      notification.setAttribute("text", Error.message);
      notification.setAttribute("type", "error");
      notificationsContainer.appendChild(notification);
    } finally {
      loader.remove();
    }
  });

  // --- Funcionalidad: Previsualización de Foto de Perfil ---
  const photoInput = document.getElementById("photoUploadInput");

  if (photoInput) {
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
            if (uploadIcon) uploadIcon.style.display = "none";
            // Establecer la imagen como fondo del contenedor de previsualización
            if (photoPreview) photoPreview.style.backgroundImage = `url('${event.target.result}')`;
          };

          reader.readAsDataURL(file);
        }
      });
  }

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
        if (eyeOpen) eyeOpen.classList.add("hidden");
        if (eyeClosed) eyeClosed.classList.remove("hidden");
        this.setAttribute("aria-label", "Ocultar contraseña");
      } else {
        input.type = "password";
        if (eyeOpen) eyeOpen.classList.remove("hidden");
        if (eyeClosed) eyeClosed.classList.add("hidden");
        this.setAttribute("aria-label", "Mostrar contraseña");
      }
    });
  });
});