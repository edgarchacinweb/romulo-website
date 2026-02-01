import authorize from "./auth.js";

authorize("representante");

document.addEventListener("DOMContentLoaded", async () => {
  const loader = document.createElement("loader-spinner");
  let parentData = {};
  const token = localStorage.getItem("auth") || "";

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
    console.log(parentData);

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
  btnSubmit.addEventListener("click", () => {});

  btnCancel.addEventListener("click", () => {
    alert("adaas");
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

  // --- Manejo del Formulario (Submit) ---
  const form = document.getElementById("inscriptionForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const submitBtn = document.querySelector(".btn-submit");
    const originalText = submitBtn.textContent;

    // Simular proceso de carga
    submitBtn.disabled = true;
    submitBtn.textContent = "Procesando...";
    submitBtn.style.opacity = "0.7";

    setTimeout(() => {
      alert("Estudiante registrado con éxito");
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      submitBtn.style.opacity = "1";
      form.reset();
      // Reset visual de uploads
      document
        .querySelectorAll(".upload-zone span")
        .forEach((s) => (s.textContent = "Haga clic para cargar"));
      document.querySelectorAll(".upload-zone").forEach((z) => {
        z.style.borderColor = "";
        z.style.backgroundColor = "";
      });
    }, 1500);
  });
});
