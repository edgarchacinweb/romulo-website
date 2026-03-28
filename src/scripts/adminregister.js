import authorize from "./auth.js";

authorize("administrador");

document.addEventListener("DOMContentLoaded", async () => {
  function translateError(techMsg) {
    if (!techMsg) return "Ocurrió un error inesperado. Intente nuevamente.";
    const msg = techMsg.toLowerCase();
    if (msg.includes("llave duplicada") || msg.includes("unique constraint")) {
      return "El estudiante con esta cédula ya se encuentra registrado en el sistema.";
    }
    return techMsg;
  }

  const firstNameField = document.getElementById("nombre");
  const lastNameField = document.getElementById("apellido");
  const genderField = document.getElementById("genero");
  
  const ciField = document.getElementById("cedula");
  const nacionalidadSelect = document.getElementById("nacionalidad");
  const nacionalidadWrapper = document.getElementById("nacionalidadWrapper");
  
  const dateField = document.getElementById("fechaNac");
  const relationshipField = document.getElementById("parentesco");
  const gradeField = document.getElementById("grado");
  const addressField = document.getElementById("direccion");

  const useSchoolIdCheckbox = document.getElementById("useSchoolId");
  const schoolIdOptions = document.getElementById("schoolIdOptions");
  const schoolIdSettings = document.getElementById("schoolIdSettings");
  const birthOrderSelect = document.getElementById("birthOrder");
  const hasIdCheckbox = document.getElementById("hasId");
  const idFormDoc = document.getElementById("IdDoc");
  
  const authDocZone = document.getElementById("AutorizacionDoc");
  const authDocInput = document.getElementById("docAutorizacion");
  const sameAddressCheckbox = document.getElementById("sameAddress");

  const btnSubmit = document.getElementById("BtnSubmit");
  const btnCancel = document.getElementById("BtnCancel");
  const notificationsContainer = document.getElementById("notifications");
  const loader = document.createElement("loader-spinner");
  const token = localStorage.getItem("auth") || "";

  // Dropdown elements
  const buscarRepresentanteInput = document.getElementById("buscarRepresentante");
  const listaRepresentantes = document.getElementById("listaRepresentantes");
  const idRepresentanteInput = document.getElementById("IdRepresentanteSeleccionado");
  const representanteSeleccionadoTexto = document.getElementById("representanteSeleccionadoTexto");
  let representantesCargados = [];

  let parentData = null;

  function filterLetters(e) {
    e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
  }
  if (firstNameField) firstNameField.addEventListener("input", filterLetters);
  if (lastNameField) lastNameField.addEventListener("input", filterLetters);

  function generarCedulaEscolar() {
    if (!useSchoolIdCheckbox.checked) return;
    if (!parentData || !parentData.Cedula || !dateField.value) {
        ciField.value = "";
        ciField.placeholder = "Seleccione fecha nac. y asegúrese de haber seleccionado un representante.";
        return;
    }
    const parentIdStr = parentData.Cedula.toString().toUpperCase();
    let prefix = parentIdStr.startsWith("E") ? "E" : ""; 
    const orden = birthOrderSelect.value; 
    const anio = dateField.value.split("-")[0].slice(-2);
    let cedulaMadre = parentIdStr.replace(/\D/g, "").padStart(8, "0");
    ciField.value = `${prefix}${orden}${anio}${cedulaMadre}`;
    ciField.readOnly = true;
    if (idFormDoc) idFormDoc.style.display = "none";
  }

  try {
    document.body.appendChild(loader);

    // Cargar grados
    const gradesResponse = await fetch(`${window.APP_CONFIG.api_url}/course/get_all`, { headers: { Authorization: `Bearer ${token}` } });
    if(gradesResponse.ok) {
        const grades = await gradesResponse.json();
        document.querySelectorAll(".grade-option").forEach((opt, index) => {
          if (grades[index]) opt.value = grades[index].CursoId; 
        });
    }

    // Cargar lista de todos los representantes para el dropdown
    const repsResponse = await fetch(`${window.APP_CONFIG.api_url}/user/filter`, {
        method: 'POST',
        headers: { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ Rol: "representante" })
    });
    
    if (repsResponse.ok) {
        representantesCargados = await repsResponse.json();
    }
  } catch (err) {
    console.error(err);
  } finally {
    if (document.body.contains(loader)) loader.remove();
  }

  // Lógica Searchable Dropdown
  buscarRepresentanteInput.addEventListener("input", (e) => {
      const val = e.target.value.toLowerCase().trim();
      listaRepresentantes.innerHTML = "";
      if (val === "") {
          listaRepresentantes.style.display = "none";
          return;
      }
      
      const filtrados = representantesCargados.filter(r => 
          (r.DatosPersona?.Nombre && r.DatosPersona.Nombre.toLowerCase().includes(val)) ||
          (r.DatosPersona?.Apellido && r.DatosPersona.Apellido.toLowerCase().includes(val)) ||
          (r.DatosPersona?.Cedula && r.DatosPersona.Cedula.toString().includes(val))
      ).slice(0, 10);

      if (filtrados.length > 0) {
          listaRepresentantes.style.display = "block";
          filtrados.forEach(r => {
              const li = document.createElement("li");
              const nombreCompleto = `${r.DatosPersona.Nombre} ${r.DatosPersona.Apellido} (C.I: ${r.DatosPersona.Cedula})`;
              li.textContent = nombreCompleto;
              li.addEventListener("click", () => {
                  buscarRepresentanteInput.value = nombreCompleto;
                  idRepresentanteInput.value = r.DatosPersona.DatosPersonaId;
                  parentData = r.DatosPersona;
                  parentData["DatosPersonaId"] = r.DatosPersona.DatosPersonaId;
                  
                  representanteSeleccionadoTexto.textContent = "✔ Representante Asignado: " + nombreCompleto;
                  representanteSeleccionadoTexto.style.display = "block";
                  listaRepresentantes.style.display = "none";
                  generarCedulaEscolar();
                  
                  if (sameAddressCheckbox.checked) {
                      addressField.value = parentData["Direccion"] || "";
                  }
              });
              listaRepresentantes.appendChild(li);
          });
      } else {
          listaRepresentantes.style.display = "none";
      }
  });

  document.addEventListener("click", (e) => {
      if (!e.target.closest("#searchContainer")) listaRepresentantes.style.display = "none";
  });

  relationshipField.addEventListener("change", (e) => {
      const val = e.target.value;
      if (val && val !== "Padre" && val !== "Madre") {
          authDocZone.style.display = "block";
      } else {
          authDocZone.style.display = "none";
          authDocInput.value = ""; 
          const zone = authDocInput.closest(".upload-zone");
          if (zone) zone.querySelector("span").textContent = "Haga clic para cargar";
      }
  });

  if (sameAddressCheckbox) {
      sameAddressCheckbox.addEventListener("change", (e) => {
        if (e.target.checked) {
          if (parentData && parentData["Direccion"]) {
              addressField.value = parentData["Direccion"];
              addressField.readOnly = true;
          } else {
              alert("Seleccione un representante primero o el representante no tiene dirección.");
              e.target.checked = false;
          }
        } else {
          addressField.value = "";
          addressField.readOnly = false;
          addressField.focus();
        }
      });
  }

  if (schoolIdSettings) schoolIdSettings.style.display = "block";

  gradeField.addEventListener("change", (e) => {
      const selectedOption = e.target.options[e.target.selectedIndex];
      if (useSchoolIdCheckbox.checked && selectedOption && !selectedOption.text.includes("1er Año")) {
          alert("Ha cambiado a un grado distinto a 1er Año. Cédula Escolar desactivada.");
          useSchoolIdCheckbox.checked = false;
          schoolIdOptions.style.display = "none";
          nacionalidadWrapper.style.display = "block";
          ciField.readOnly = false;
          ciField.value = "";
          if (idFormDoc) idFormDoc.style.display = "block";
      }
  });

  useSchoolIdCheckbox.addEventListener("change", (e) => {
      if (e.target.checked) {
          if (!gradeField.value) {
              alert("Por favor seleccione primero el Grado a Cursar.");
              e.target.checked = false;
              return;
          }
          const selectedOption = gradeField.options[gradeField.selectedIndex];
          if (selectedOption && !selectedOption.text.includes("1er Año")) {
              alert("Cédula escolar solo para 1er Año.");
              e.target.checked = false;
              return;
          }
          schoolIdOptions.style.display = "block";
          nacionalidadWrapper.style.display = "none"; 
          hasIdCheckbox.checked = true; 
          generarCedulaEscolar();
      } else {
          schoolIdOptions.style.display = "none";
          nacionalidadWrapper.style.display = "block"; 
          ciField.readOnly = false;
          ciField.value = "";
          if (idFormDoc) idFormDoc.style.display = "block";
      }
  });

  birthOrderSelect.addEventListener("change", generarCedulaEscolar);
  dateField.addEventListener("change", generarCedulaEscolar);
  if (ciField) {
    ciField.addEventListener("input", function() {
      if (useSchoolIdCheckbox.checked) return; 
      this.value = this.value.replace(/[^0-9]/g, ""); 
      if (this.value.length > 8) this.value = this.value.slice(0, 8);
    });
  }

  if (btnCancel) {
      btnCancel.addEventListener("click", () => {
          window.location.href = "/app/admin/estudiantes/";
      });
  }

  btnSubmit.addEventListener("click", async () => {
    try {
      const idRep = idRepresentanteInput.value;
      if (!idRep) throw new Error("Debe buscar y seleccionar un Representante primero.");

      const nombreVal = firstNameField.value.trim();
      const apellidoVal = lastNameField.value.trim();
      if (!nombreVal || !apellidoVal) throw new Error("Faltan nombres o apellidos.");
      if (!gradeField.value) throw new Error("Debe seleccionar el Grado a cursar.");
      if (!relationshipField.value) throw new Error("Debe seleccionar el Parentesco.");
      if (!dateField.value) throw new Error("Falta la fecha de nacimiento.");

      const cedulaValStr = ciField.value.trim();
      let finalCedulaToSubmit = cedulaValStr;
      
      if (!useSchoolIdCheckbox.checked) {
          if (!cedulaValStr) throw new Error("Debe ingresar la Cédula de Identidad.");
          finalCedulaToSubmit = `${nacionalidadSelect.value}-${cedulaValStr}`;
      }

      document.body.appendChild(loader);
      const formData = new FormData();
      formData.append("Nombre", nombreVal);
      formData.append("Apellido", apellidoVal);
      formData.append("Genero", genderField.value);
      formData.append("Cedula", finalCedulaToSubmit);

      const dateParts = dateField.value.split("-");
      formData.append("FechaNacimiento", `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`);
      formData.append("Parentesco", relationshipField.value);
      formData.append("IdCurso", gradeField.value);
      formData.append("Direccion", addressField.value.trim());
      formData.append("IdRepresentante", idRep); // ENLACE IMPORTANTE PARA EL BACKEND

      const filesMap = {
        FotoCarnet: "studentPhoto", DocDni: "docDni", 
        DocPartidaNacimiento: "docPartidaNacimiento", 
        DocNotasCertificadas: "docNotasCertificadas",
        DocAutorizacion: "docAutorizacion"
      };

      for (const [key, id] of Object.entries(filesMap)) {
        const fileInput = document.getElementById(id);
        if (key === "DocDni" && useSchoolIdCheckbox.checked) continue;
        if (key === "DocAutorizacion" && (relationshipField.value === "Padre" || relationshipField.value === "Madre" || !relationshipField.value)) continue;

        if (fileInput && fileInput.files[0]) {
          formData.append(key, fileInput.files[0]);
        }
      }

      const response = await fetch(`${window.APP_CONFIG.api_url}/students/create`, {
        method: "POST",
        body: formData,
        headers: { Authorization: `Bearer ${token}` }
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.message || "Error al registrar.");

      const notification = document.createElement("notification-component");
      notification.setAttribute("type", "success");
      notification.setAttribute("text", resData.message || "Estudiante registrado con éxito.");
      notificationsContainer.appendChild(notification);

      setTimeout(() => {
        window.location.href = "/app/admin/estudiantes/";
      }, 2000);
    } catch (err) {
      const notification = document.createElement("notification-component");
      notification.setAttribute("type", "error");
      notification.setAttribute("text", translateError(err.message));
      notificationsContainer.appendChild(notification);
    } finally {
      if (document.body.contains(loader)) loader.remove();
    }
  });

  // UI para cargar archivos
  document.querySelectorAll('input[type="file"]').forEach((input) => {
    input.addEventListener("change", (e) => {
      const file = e.target.files[0];
      const zone = input.closest(".upload-zone");
      if (file && zone) {
        if (input.id === "studentPhoto") {
             const reader = new FileReader();
             reader.onload = (ev) => {
                 zone.style.backgroundImage = `url('${ev.target.result}')`;
                 zone.classList.add("has-image");
             };
             reader.readAsDataURL(file);
        } else {
             const span = zone.querySelector("span");
             if (span) {
                 span.textContent = file.name;
                 span.style.color = "#28a745";
             }
        }
      }
    });
    input.closest(".upload-zone")?.addEventListener("click", () => input.click());
  });
});
