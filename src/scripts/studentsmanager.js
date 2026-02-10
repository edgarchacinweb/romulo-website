import authorize from "./auth.js";
import numberToLetter from "./utils.js";

authorize("administrador");

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("auth");
  const notifications = document.getElementById("notifications");
  const loader = document.createElement("loader-spinner");
  const studentCounter = document.getElementById("StudentsCounter");
  const cardsContainer = document.getElementById("CardsContainer");
  const dateFormat = new Intl.DateTimeFormat("es-VE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const studentsId = [];

  // Campos
  const searchField = document.getElementById("SearchField");
  const gradesField = document.getElementById("GradesField");
  const sectionsField = document.getElementById("SectionsField");
  const stateField = document.getElementById("StateField");

  // Funciones
  const filterRequests = async () => {
    const searchValue = searchField.value;
    const gradesValue = gradesField.value;
    const sectionsValue = sectionsField.value;
    const stateValue = stateField.value;

    loader.setAttribute("title", "Buscando registros...");
    document.body.appendChild(loader);

    try {
      const studentsRequestResponse = await fetch(
        `${window.APP_CONFIG.api_url}/students/filter`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            Busqueda: searchValue.trim(),
            CursoId: gradesValue,
            Seccion: `${sectionsValue}`,
            Estado: stateValue,
          }),
        },
      );

      const studentsRequest = await studentsRequestResponse.json();
      if (!studentsRequestResponse.ok) throw new Error(studentsRequest.message);
      studentCounter.textContent = Array.isArray(studentsRequest)
        ? `${studentsRequest.length}`
        : "0";

      cardsContainer
        .querySelectorAll(".student-card")
        .forEach((elm) => elm.remove());

      studentsRequest.forEach((student) => {
        const studentBirthdate = new Date(student["FechaNacimiento"]);
        const studentCard = document.createElement("article");
        const cedula = new String(student["DatosPersona"]["Cedula"]);
        const cedulaElement = `
          <div class="file-item">
            <div class="file-info">
              <div class="icon-file green">PDF</div>
              <div>
                <p class="file-name">Cédula de Identidad Escaneada</p>
                <p class="file-type">Archivo PDF</p>
              </div>
            </div>
            <div class="file-actions">
              <button class="btn-icon-small btn-download-file" data-file="dni-${student["EstudianteId"]}.pdf">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
            </div>
          </div>
        `;
        studentCard.classList.add("student-card");
        studentCard.innerHTML = `
          <div class="card-header">
            <div class="student-profile">
              <img
                src="${window.APP_CONFIG.api_url}/docs/get/carnet-${student["EstudianteId"]}.webp"
                alt="Avatar"
                class="avatar"
              />
              <div>
                <h3>${student["DatosPersona"]["Nombre"]} ${student["DatosPersona"]["Apellido"]}</h3>
                <span class="badge">${student["Curso"]["Grado"]}° Año • Sección ${numberToLetter(student["Curso"]["Seccion"])}</span>
              </div>
            </div>
          </div>

          <div class="card-body">
            <div class="info-grid">
              <div class="info-item">
                <label>GÉNERO</label>
                <p>${student["DatosPersona"]["Sexo"]}</p>
              </div>
              <div class="info-item">
                <label>CÉDULA</label>
                <p>V${student["DatosPersona"]["Cedula"]}</p>
              </div>
              <div class="info-item">
                <label>FECHA DE NACIMIENTO</label>
                <p>${dateFormat.format(studentBirthdate)}</p>
              </div>
              <div class="info-item">
                <label>DIRECCIÓN</label>
                <p>${student["DatosPersona"]["Direccion"]}</p>
              </div>
            </div>

            <div class="accordion">
              <div class="accordion-header">
                <div class="acc-title">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#10b981"
                    stroke-width="2"
                  >
                    <path
                      d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
                    />
                    <path d="M14 2v6h6" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <line x1="10" y1="9" x2="8" y2="9" />
                  </svg>
                  <span>Documentos del Estudiante</span>
                  <span class="counter-badge">${cedula.length > 8 ? "2" : "3"}</span>
                </div>
                <svg
                  class="chevron"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
              <div class="accordion-content">
                <div class="file-list">
                  <div class="file-item">
                    <div class="file-info">
                      <div class="icon-file green">PDF</div>
                      <div>
                        <p class="file-name">Partida de Nacimiento</p>
                        <p class="file-type">Archivo PDF</p>
                      </div>
                    </div>
                    <div class="file-actions">
                      <button class="btn-icon-small btn-download-file" data-file="partida-nacimiento-${student["EstudianteId"]}.pdf">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div class="file-item">
                    <div class="file-info">
                      <div class="icon-file green">PDF</div>
                      <div>
                        <p class="file-name">Notas Certificadas</p>
                        <p class="file-type">Archivo PDF</p>
                      </div>
                    </div>
                    <div class="file-actions">
                      <button class="btn-icon-small btn-download-file" data-file="notas-certificadas-${student["EstudianteId"]}.pdf">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  ${cedula.length > 8 ? "" : cedulaElement}
                </div>
              </div>
            </div>

            <div class="accordion">
              <div class="accordion-header">
                <div class="acc-title">
                  <img
                    src="${window.APP_CONFIG.api_url}/docs/get/carnet-${student["Representante"]["UsuarioId"]}.webp"
                    class="avatar-small"
                  />
                  <div>
                    <span class="d-block font-bold">Representante</span>
                    <span class="d-block text-small">${student["Representante"]["Nombre"]} ${student["Representante"]["Apellido"]}</span>
                  </div>
                </div>
                <svg
                  class="chevron"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
              <div class="accordion-content">
                <div class="info-grid mt-2">
                  <div class="info-item">
                    <label>PARENTESCO</label>
                    <p>${student["Parentesco"]}</p>
                  </div>
                  <div class="info-item">
                    <label>CÉDULA</label>
                    <p>V${student["Representante"]["Cedula"]}</p>
                  </div>
                  <div class="info-item">
                    <label>TELÉFONO</label>
                    <p class="link">${student["Representante"]["Telefono"]}</p>
                  </div>
                  <div class="info-item">
                    <label>EMAIL</label>
                    <p class="link">${student["Representante"]["Email"]}</p>
                  </div>
                  <div class="info-item">
                    <label>OCUPACIÓN</label>
                    <p>${student["Representante"]["Ocupacion"]}</p>
                  </div>
                  <div class="info-item">
                    <label>DIRECCIÓN</label>
                    <p>${student["Representante"]["Direccion"]}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="accordion">
              <div class="accordion-header">
                <div class="acc-title">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#10b981"
                    stroke-width="2"
                  >
                    <path
                      d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
                    />
                    <path d="M14 2v6h6" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <line x1="10" y1="9" x2="8" y2="9" />
                  </svg>
                  <span>Documento del Representante</span>
                </div>
                <svg
                  class="chevron"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
              <div class="accordion-content">
                <div class="file-list">
                  <div class="file-item">
                    <div class="file-info">
                      <div class="icon-file green">PDF</div>
                      <div>
                        <p class="file-name">Cédula de Identidad Escaneada</p>
                        <p class="file-type">Archivo PDF</p>
                      </div>
                    </div>
                    <div class="file-actions">
                      <button class="btn-icon-small btn-download-file" data-file="dni-${student["Representante"]["UsuarioId"]}.pdf">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <button class="btn btn-success">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Aprobar
            </button>
            <button
              class="btn btn-danger btn-reject"
              data-student="Carlos González"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Rechazar
            </button>
          </div>
      `;
        cardsContainer.appendChild(studentCard);

        studentCard.querySelectorAll(".btn-download-file").forEach((btn) =>
          btn.addEventListener("click", async () => {
            loader.setAttribute("title", "Descargando documento...");
            document.body.appendChild(loader);
            let objectUrl = undefined;
            try {
              const downloadDocumentResponse = await fetch(
                `${window.APP_CONFIG.api_url}/docs/get/${btn.getAttribute("data-file")}`,
                {
                  method: "GET",
                },
              );

              if (!downloadDocumentResponse.ok) {
                const documentError = await downloadDocumentResponse.json();
                throw new Error(documentError.message);
              }

              const downloadDocument = await downloadDocumentResponse.blob();
              const anchor = document.createElement("a");
              objectUrl = URL.createObjectURL(downloadDocument);
              anchor.href = objectUrl;
              anchor.download = btn.getAttribute("data-file");
              anchor.click();
            } catch (Error) {
              console.error(Error.stack);
              const notification = document.createElement(
                "notification-component",
              );
              notification.setAttribute("type", "error");
              notification.setAttribute("text", Error.message);
              notifications.appendChild(notification);
            } finally {
              if (objectUrl) URL.revokeObjectURL(objectUrl);
              loader.remove();
            }
          }),
        );
      });
    } catch (Error) {
      console.error(Error.message);
      const notification = document.createElement("notification-component");
      notification.setAttribute("type", "error");
      notification.setAttribute("text", Error.message);
      notifications.appendChild(notification);
    } finally {
      loader.remove();
    }
  };

  await filterRequests();
  searchField.addEventListener("change", filterRequests);
  gradesField.addEventListener("change", filterRequests);
  sectionsField.addEventListener("change", filterRequests);
  stateField.addEventListener("change", filterRequests);

  // Cargando grados y secciones
  document.body.appendChild(loader);
  let sections = [];
  let maxSection = 1;

  //#region Carga de grados y secciones con estudiantes
  try {
    const sectionsResponse = await fetch(
      `${window.APP_CONFIG.api_url}/course/sections`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const sectionsMessage = await sectionsResponse.json();
    if (!sectionsResponse.ok) throw new Error(sectionsMessage.message);

    sections = [...sectionsMessage];
    maxSection = sections.reduce(
      (accum, section) =>
        section["Seccion"] > accum ? section["Seccion"] : accum,
      0,
    );

    sections.forEach((section) => {
      const option = document.createElement("option");
      option.setAttribute("value", section["CursoId"]);
      option.textContent = `${section["Grado"]}° Año`;
      gradesField.appendChild(option);
    });

    for (let i = 0; i < maxSection; i++) {
      const option = document.createElement("option");
      option.setAttribute("value", i + 1);
      option.textContent = numberToLetter(i + 1);
      sectionsField.appendChild(option);
    }
  } catch (Error) {
    console.error(Error.stack);
    const notification = document.createElement("notification-component");
    notification.setAttribute("type", "error");
    notification.setAttribute("text", Error.message);
    notifications.appendChild(notification);
  } finally {
    loader.remove();
  }
  //#endregion

  // #region Carga las cantidad de secciones disponibles al seleccionar el grado
  gradesField.addEventListener("change", () => {
    const selectedSections =
      sections.find((element) => element["CursoId"] === gradesField.value)
        ?.Seccion ?? maxSection;

    sectionsField.innerHTML = '<option value="">Todas las secciones</option>';

    for (let i = 1; i <= selectedSections; i++) {
      const option = document.createElement("option");
      option.setAttribute("value", i);
      option.textContent = numberToLetter(i);
      sectionsField.appendChild(option);
    }
  });
  // #endregion

  // --- Lógica de Acordeones ---
  const accordions = document.querySelectorAll(".accordion");

  accordions.forEach((acc) => {
    const header = acc.querySelector(".accordion-header");
    header.addEventListener("click", () => {
      // Toggle de la clase active
      acc.classList.toggle("active");
    });
  });

  // --- Lógica del Modal de Rechazo ---
  const modal = document.getElementById("rejectModal");
  const btnRejectList = document.querySelectorAll(".btn-reject");
  const btnCancel = document.getElementById("cancelReject");
  const btnConfirm = document.getElementById("confirmReject");

  // Elementos del formulario y preview
  const selectReason = document.getElementById("rejectReason");
  const textDesc = document.getElementById("rejectDesc");
  const previewReasonBox = document.getElementById("previewReasonBox");
  const previewReasonText = document.getElementById("previewReasonText");
  const previewDescText = document.getElementById("previewDescText");
  const modalStudentName = document.getElementById("modalStudentName");
  const previewStudent = document.getElementById("previewStudent");

  // Abrir Modal
  btnRejectList.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const studentName = e.currentTarget.getAttribute("data-student");

      // Setear datos
      modalStudentName.textContent = studentName;
      previewStudent.textContent = studentName;

      // Limpiar form
      selectReason.selectedIndex = 0;
      textDesc.value = "";
      updatePreview();

      // Mostrar modal
      modal.classList.add("open");
    });
  });

  // Cerrar Modal
  const closeModal = () => modal.classList.remove("open");
  btnCancel.addEventListener("click", closeModal);

  // Cerrar al hacer click fuera del contenido
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // --- Actualización en Vivo del Preview ---

  function updatePreview() {
    // Actualizar Motivo
    const reason = selectReason.value;
    if (reason) {
      previewReasonBox.style.display = "block";
      previewReasonText.textContent = reason;
    } else {
      previewReasonBox.style.display = "none";
    }

    // Actualizar Descripción
    const desc = textDesc.value;
    if (desc) {
      previewDescText.textContent = `"${desc}"`;
      previewDescText.style.display = "block";
    } else {
      previewDescText.style.display = "none";
    }
  }

  selectReason.addEventListener("change", updatePreview);
  textDesc.addEventListener("input", updatePreview);

  // Acción de Confirmar (Simulada)
  btnConfirm.addEventListener("click", () => {
    if (textDesc.value.length < 10) {
      alert(
        "Por favor ingresa una descripción detallada (mínimo 10 caracteres).",
      );
      return;
    }

    // Simulación de envío
    const originalText = btnConfirm.textContent;
    btnConfirm.textContent = "Enviando...";
    btnConfirm.disabled = true;

    setTimeout(() => {
      alert("Correo de rechazo enviado exitosamente.");
      closeModal();
      btnConfirm.textContent = originalText;
      btnConfirm.disabled = false;
    }, 1000);
  });

  document.getElementById("BtnBack").addEventListener("click", () => {
    document.body.style.overflow = "hidden";
    document.body.style.animation = "goodByePage 0.8s forwards";
    setTimeout(() => (window.location.href = "/app/admin/dashboard/"), 1000);
  });
});
