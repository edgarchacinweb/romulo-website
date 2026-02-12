import authorize from "./auth.js";

authorize("representante");

document.addEventListener("DOMContentLoaded", async () => {
  // Entradas de formulario
  const firstNameField = document.getElementById("nombre");
  const lastNameField = document.getElementById("apellido");
  const genderField = document.getElementById("genero");
  const ciField = document.getElementById("cedula");
  const dateField = document.getElementById("fechaNac");
  const relationshipField = document.getElementById("parentesco");
  const gradeField = document.getElementById("grado");
  const addressField = document.getElementById("direccion");
  const studentPhotoField = document.getElementById("studentPhoto");
  const docDniField = document.getElementById("docDni");
  const docPartidaNacimientoField = document.getElementById(
    "docPartidaNacimiento",
  );
  const docNotasCertificadasField = document.getElementById(
    "docNotasCertificadas",
  );

  // Contenedor de notificaciones
  const notificationsContainer = document.getElementById("notifications");

  // Loader
  const loader = document.createElement("loader-spinner");

  // Token de autenticación
  const token = localStorage.getItem("auth") || "";

  // Cargando grados académicos dentro del cuadro de selección
  try {
    document.body.appendChild(loader);
    const gradesResponse = await fetch(
      `${window.APP_CONFIG.api_url}/course/get_all`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const grades = await gradesResponse.json();

    if (!gradesResponse.ok) throw new Error(grades.message);

    gradeField
      .querySelectorAll(".grade-option")
      .forEach((opt, index) => (opt.value = grades[index].CursoId));
  } catch (Error) {
    console.error(Error.stack);
    const notification = document.createElement("notification-component");
    notification.setAttribute("type", "error");
    notification.setAttribute("text", Error.message);
    notificationsContainer.appendChild(notification);
  } finally {
    loader.remove();
  }

  let parentData = {};

  try {
    document.body.appendChild(loader);
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

    parentData = { ...(await parentDataResponse.json()) };

    if (!parentDataResponse.ok) {
      throw new Error(
        parentData.message ?? "Error al cargar datos del representante",
      );
    }

    const countStudentsResponse = await fetch(
      `${window.APP_CONFIG.api_url}/students/count/by_parent`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (
      !parentData["Telefono"] ||
      !parentData["Ocupacion"] ||
      !parentData["Direccion"]
    ) {
      alert(
        'Primero termina de llenar los datos de tu perfil en la opción "Editar Perfil"',
      );
      window.location.href = "/app/representante/editar-perfil";
      return;
    }

    const countStudents = await countStudentsResponse.json();

    if (!countStudentsResponse.ok) throw new Error(countStudents.message);

    parentData["students"] = countStudents;
  } catch (Error) {
    console.error(Error.stack);
    alert(
      Error.message === "Failed to fetch"
        ? "Error al cargar los datos del representante"
        : Error.message,
    );
    window.location.href = "/app/representante/inicio/";
  } finally {
    loader.remove();
  }

  // --- Lógica de Checkbox: Cédula de Identidad ---
  const hasIdCheckbox = document.getElementById("hasId");
  const idInput = document.getElementById("cedula");
  const idFormDoc = document.getElementById("IdDoc");
  const btnSubmit = document.getElementById("BtnSubmit");
  const btnCancel = document.getElementById("BtnCancel");
  const inscriptionForm = document.getElementById("inscriptionForm");

  // Estado inicial
  toggleInputState(idInput, !hasIdCheckbox.checked);

  // Event listener
  hasIdCheckbox.addEventListener("change", (e) => {
    toggleInputState(idInput, !e.target.checked);
    if (e.target.checked) {
      idInput.value = "";
      idInput.focus();
      idFormDoc.style.display = "block";
    } else {
      idInput.value = `${parentData["Cedula"]}${parentData["students"]["count"] + 1}`; // Limpiar si se desactiva
      idFormDoc.style.display = "none";
    }
  });

  // Registrar nuevo estudiante
  btnSubmit.addEventListener("click", async () => {
    try {
      const firstName = firstNameField.value.trim();
      const lastName = lastNameField.value.trim();
      const gender = genderField.value;
      const ci = ciField.value.trim();
      const date = new Date(dateField.value);
      const relationship = relationshipField.value;
      const grade = gradeField.value;
      const address = addressField.value.trim();
      const docDni = docDniField.files[0];
      const docPartidaNacimiento = docPartidaNacimientoField.files[0];
      const docNotasCertificadas = docNotasCertificadasField.files[0];
      const studentPhoto = studentPhotoField.files[0];

      // Validaciones de campos
      if (firstName.length === 0) {
        firstNameField.focus();
        throw new Error("Debes introducir el nombre del estudiante.");
      } else if (!new RegExp(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+$/).test(firstName)) {
        firstNameField.focus();
        throw new Error("¡Formato de nombre inválido!");
      } else if (lastName.length === 0) {
        lastNameField.focus();
        throw new Error("Debes introducir el apellido del estudiante.");
      } else if (!new RegExp(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+$/).test(lastName)) {
        lastNameField.focus();
        throw new Error("¡Formato de apellido inválido!");
      } else if (gender.length === 0) {
        genderField.focus();
        throw new Error("Debes seleccionar el sexo del estudiante.");
      } else if (ci.length === 0) {
        ciField.focus();
        throw new Error(
          "Debes introducir la cédula de identidad del estudiante.",
        );
      } else if (!new RegExp(/^([3-9]\d{7}|\d{9})$/).test(ci)) {
        ciField.focus();
        throw new Error("¡Formato de cédula de identidad inválido!");
      } else if (date == "Invalid Date") {
        dateField.focus();
        throw new Error(
          "¡Debes introducir la fecha de nacimiento del estudiante!",
        );
      } else if (relationship.length === 0) {
        relationshipField.focus();
        throw new Error("Debes seleccionar un parentesco.");
      } else if (grade.length === 0) {
        gradeField.focus();
        throw new Error("¡Debes seleccionar un grado académico a cursar!");
      } else if (address.length === 0) {
        addressField.focus();
        throw new Error(
          "¡Debes indicar la dirección de habitación del estudiante!",
        );
      } else if (
        !new RegExp(
          /^[a-zA-Z0-9À-ÿ\u00f1\u00d1][a-zA-Z0-9À-ÿ\u00f1\u00d1\s\.,#\-\/°\(\)]{4,254}$/,
        ).test(address)
      ) {
        addressField.focus();
        throw new Error("Formato de dirección de habitación inválido");
      }
      if (hasIdCheckbox.checked && !docDni) {
        docDniField.focus();
        throw new Error(
          "Debes cargar una foto legible de la cédula de identidad del estudiante.",
        );
      } else if (!docPartidaNacimiento) {
        docPartidaNacimientoField.focus();
        throw new Error("Debes cargar la partida de nacimiento del estudiante");
      } else if (!docNotasCertificadas) {
        docNotasCertificadasField.focus();
        throw new Error("Debes cargar las notas certificadas del estudiante");
      } else if (!studentPhoto) {
        studentPhotoField.focus();
        throw new Error("Debes cargar una foto de tipo carnet del estudiante");
      }

      // Creando FormData para enviar datos
      document.body.appendChild(loader);
      const formData = new FormData();
      formData.append("Nombre", firstName);
      formData.append("Apellido", lastName);
      formData.append("Genero", gender);
      formData.append("Cedula", ci);
      formData.append(
        "FechaNacimiento",
        `${date.getDay()}/${date.getMonth() < 10 ? "0" : ""}${date.getMonth() + 1}/${date.getFullYear()}`,
      );
      formData.append("Parentesco", relationship);
      formData.append("IdCurso", grade);
      formData.append("IdRepresentante", parentData["DatosPersonaId"]);
      formData.append("Direccion", address);
      formData.append("FotoCarnet", studentPhoto);
      formData.append("DocPartidaNacimiento", docPartidaNacimiento);
      formData.append("DocNotasCertificadas", docNotasCertificadas);
      formData.append("DocDni", docDni);

      // Enviando datos al servidor
      const createStudentResponse = await fetch(
        `${window.APP_CONFIG.api_url}/students/create`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const createStudent = await createStudentResponse.json();
      if (!createStudentResponse.ok) throw new Error(createStudent.message);

      document.getElementById("inscriptionForm").reset();
      document
        .querySelectorAll(".upload-zone, span, .upload-icon")
        .forEach((elm) => {
          elm.removeAttribute("style");
          if (elm.tagName === "SPAN") elm.textContent = "Haga clic para cargar";
          else if (elm.tagName === "svg")
            elm.innerHTML = `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line>`;
        });

      const notification = document.createElement("notification-component");
      notification.setAttribute("type", "success");
      notification.setAttribute("text", createStudent.message);
      notificationsContainer.appendChild(notification);
    } catch (Error) {
      console.error(Error.stack);
      const notification = document.createElement("notification-component");
      notification.setAttribute("type", "error");
      notification.setAttribute("text", Error.message);
      notificationsContainer.appendChild(notification);
    } finally {
      loader.remove();
    }
  });

  btnCancel.addEventListener("click", () => {
    inscriptionForm.reset();
  });

  // --- Lógica de Checkbox: Misma Dirección ---
  const sameAddressCheckbox = document.getElementById("sameAddress");
  const addressInput = document.getElementById("direccion");

  // Event listener
  sameAddressCheckbox.addEventListener("change", (e) => {
    // Según la imagen, el checkbox habilita/deshabilita
    // Si "es la misma", deshabilitamos la escritura manual (simulación de copiado)
    // O si la lógica es inversa (permitir escribir), ajustamos aquí.
    // Asumiremos: Si checked -> Deshabilitado (copiado automático hipotético).

    toggleInputState(addressInput, e.target.checked);

    if (e.target.checked) {
      addressInput.value = parentData["Direccion"]; // Texto simulado
      addressInput.style.opacity = "0.7";
    } else {
      addressInput.value = "";
      addressInput.style.opacity = "1";
      addressInput.focus();
    }
  });

  // --- Función Auxiliar para habilitar/deshabilitar ---
  function toggleInputState(inputElement, isDisabled) {
    inputElement.disabled = isDisabled;
    // Animación suave de opacidad
    inputElement.style.opacity = isDisabled ? "0.6" : "1";
  }

  // --- Mejora Visual: Upload Zones ---
  // Hace que las zonas de carga muestren el nombre del archivo seleccionado
  const uploadInputs = document.querySelectorAll('input[type="file"]');

  uploadInputs.forEach((input) => {
    input.addEventListener("change", function (e) {
      const fileName = e.target.files[0]?.name;
      const zone = input.closest(".upload-zone");
      const span = zone.querySelector("span");
      const icon = zone.querySelector(".upload-icon");

      if (fileName) {
        // Cambiar estilo a "cargado"
        zone.style.borderColor = "#28a745";
        zone.style.backgroundColor = "#e8f5e9";
        span.textContent = fileName;
        span.style.fontWeight = "bold";

        // Cambiar icono a check
        icon.innerHTML =
          '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>';
        icon.style.color = "#28a745";
      }
    });

    // Click en la zona activa el input
    const zone = input.closest(".upload-zone");
    zone.addEventListener("click", () => {
      input.click();
    });
  });
});
