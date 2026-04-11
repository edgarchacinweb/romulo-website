import authorize from "./auth.js";
import { numberToLetter, formatCedula } from "./utils.js";

authorize("administrador");

document.addEventListener("DOMContentLoaded", async () => {
  
  const token = localStorage.getItem("auth");
  const notifications = document.getElementById("notifications");
  const loader = document.createElement("loader-spinner");
  const studentCounter = document.getElementById("StudentsCounter");
  const cardsContainer = document.getElementById("CardsContainer");
  
  // Elementos del Modal de Rechazo
  const selectReason = document.querySelector(".rejectReason");
  const textDesc = document.querySelector(".rejectDesc");
  const studentName = document.getElementById("modalStudentName");
  const parentEmail = document.getElementById("modal-email");
  
  // Elementos del Nuevo Modal de Edición de Estado
  const editModal = document.getElementById("editStatusModal");
  const editStudentName = document.getElementById("editStudentName");
  const newStatusSelect = document.getElementById("newStatusSelect");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const confirmEditBtn = document.getElementById("confirmEditBtn");
  let currentEditId = null; 

  const dateFormat = new Intl.DateTimeFormat("es-VE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Campos de Filtro
  const searchField = document.getElementById("SearchField");
  const gradesField = document.getElementById("GradesField");
  const sectionsField = document.getElementById("SectionsField");
  const stateField = document.getElementById("StateField");

  // --- NUEVO: LEER PARÁMETRO DE URL PARA APLICAR FILTRO AUTOMÁTICO ---
  const urlParams = new URLSearchParams(window.location.search);
  const estadoParam = urlParams.get("estado");
  
  if (estadoParam && stateField) {
      stateField.value = estadoParam;
  }
  // -----------------------------------------------------------------

  // --- FUNCIÓN HELPER PARA FORMATEAR CÉDULA ---


  // --- Lógica del Modal de Edición (Estado) ---
  if(cancelEditBtn) {
      cancelEditBtn.addEventListener("click", () => {
          editModal.classList.remove("open");
          currentEditId = null;
      });
  }

  if(editModal) {
      editModal.addEventListener("click", (e) => {
          if (e.target === editModal) {
              editModal.classList.remove("open");
              currentEditId = null;
          }
      });
  }

  if(confirmEditBtn) {
      confirmEditBtn.addEventListener("click", async () => {
          if (!currentEditId) return;

          const newStatus = newStatusSelect.value;
          loader.setAttribute("title", "Actualizando estado...");
          document.body.appendChild(loader);

          try {
              const response = await fetch(`${window.APP_CONFIG.api_url}/students/change_status/${currentEditId}`, {
                  method: "PUT",
                  headers: {
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${token}`
                  },
                  body: JSON.stringify({ "Estado": newStatus })
              });

              if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.message || "Error al actualizar");
              }

              editModal.classList.remove("open");
              
              const notification = document.createElement("notification-component");
              notification.setAttribute("type", "success");
              notification.setAttribute("text", "Estado actualizado correctamente");
              notifications.appendChild(notification);
              
              filterRequests();

          } catch (error) {
              console.error(error);
              const notification = document.createElement("notification-component");
              notification.setAttribute("type", "error");
              notification.setAttribute("text", error.message);
              notifications.appendChild(notification);
          } finally {
              loader.remove();
          }
      });
  }

  const accordion = (acc, student) => {
    const headers = acc.querySelectorAll(".accordion-header");
    const containers = acc.querySelectorAll(".accordion");
    headers.forEach((header, index) => {
      header.addEventListener("click", () => {
        containers[index].classList.toggle("active");
      });
    });

    const modal = document.querySelector(".rejectModal");
    const btnRejectList = acc.querySelector(".btn-reject");
    const btnCancel = document.querySelector(".cancelReject");

    if (btnRejectList) {
      btnRejectList.addEventListener("click", () => {
        selectReason.selectedIndex = 0;
        textDesc.value = "";
        studentName.textContent = `${student["DatosPersona"]["Nombre"]} ${student["DatosPersona"]["Apellido"]}`;
        parentEmail.textContent = student["Representante"]["Email"];

        modal.setAttribute("data-student", student["EstudianteId"]);
        modal.setAttribute("data-email", student["Representante"]["Email"]);
        modal.classList.add("open");
      });
    }

    const closeModal = () => modal.classList.remove("open");
    if(btnCancel) btnCancel.addEventListener("click", closeModal);
    if(modal) {
        modal.addEventListener("click", (e) => {
          if (e.target === modal) closeModal();
        });
    }
  };

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
        
        // --- CORRECCIÓN DE CÉDULA ESCOLAR VS REGULAR ---
        const cedulaRaw = String(student["DatosPersona"]["Cedula"]);
        const cedulaLimpia = cedulaRaw.replace(/-/g, "").trim();
        // Las cédulas regulares (incluso extrangeras) no superan los 9 dígitos puros
        const isSchoolId = cedulaLimpia.length > 9; 
        
        // Elemento Opcional de Autorización
        const requiereAutorizacion = student["Parentesco"] !== "Padre" && student["Parentesco"] !== "Madre";
        
        let docCount = isSchoolId ? 2 : 3;
        if (requiereAutorizacion) docCount++;

        const autorizacionElement = requiereAutorizacion ? `
          <div class="file-item">
            <div class="file-info">
              <div class="icon-file green">PDF</div>
              <div>
                <p class="file-name">Autorización Legal / Motivo</p>
                <p class="file-type">Archivo PDF</p>
              </div>
            </div>
            <div class="file-actions">
              <a href="${window.APP_CONFIG.api_url}/docs/get/autorizacion-${student["EstudianteId"]}.pdf?preview=1" target="_blank" class="btn-icon-small" title="Ver documento" style="display: inline-flex; align-items: center; justify-content: center; text-decoration: none;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </a>
              <button class="btn-icon-small btn-download-file" data-file="autorizacion-${student["EstudianteId"]}.pdf" title="Descargar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
            </div>
          </div>
        ` : "";

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
              <a href="${window.APP_CONFIG.api_url}/docs/get/dni-${student["EstudianteId"]}.pdf?preview=1" target="_blank" class="btn-icon-small" title="Ver documento" style="display: inline-flex; align-items: center; justify-content: center; text-decoration: none;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </a>
              <button class="btn-icon-small btn-download-file" data-file="dni-${student["EstudianteId"]}.pdf" title="Descargar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
            </div>
          </div>
        `;

        const studentCard = document.createElement("article");
        studentCard.classList.add("student-card");
        studentCard.setAttribute("data-id", student["EstudianteId"]);
        if (!student["Activo"]) studentCard.classList.add("student-reject");

        const cardFooter = `
          <div class="card-footer">
            <button class="btn btn-success">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Aprobar
            </button>
            <button class="btn btn-danger btn-reject" data-student="${student["DatosPersona"]["Nombre"]}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Rechazar
            </button>
          </div>
        `;

        studentCard.innerHTML = `
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
            <div class="student-profile">
              <img
                src="${window.APP_CONFIG.api_url}/docs/get/carnet-${student["EstudianteId"]}.webp"
                alt="Avatar"
                class="avatar"
                onerror="this.src='/src/assets/default-avatar.png'"
              />
              <div>
                <h3>${student["DatosPersona"]["Nombre"]} ${student["DatosPersona"]["Apellido"]}</h3>
                <span class="badge">
                    ${student["Curso"]["Grado"]}° Año • 
                    ${student["Curso"]["Seccion"] === "Por asignar" || student["Curso"]["Seccion"] == 0 
                        ? "Por asignar" 
                        : `Sección ${typeof student["Curso"]["Seccion"] === "string" ? student["Curso"]["Seccion"] : numberToLetter(student["Curso"]["Seccion"])}`
                    }
                </span>
              </div>
            </div>
            
            <button class="btn-icon edit-trigger" 
                    type="button"
                    title="Editar Estado"
                    style="background: #eff6ff; border: none; cursor: pointer; color: #3b82f6; padding: 8px; border-radius: 50%;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
            </button>
          </div>

          <div class="card-body">
            <div class="info-grid">
              <div class="info-item">
                <label>GÉNERO</label>
                <p>${student["DatosPersona"]["Sexo"]}</p>
              </div>
              <div class="info-item">
                <label>CÉDULA</label>
                <p>${formatCedula(student["DatosPersona"]["Cedula"])}</p>
              </div>
              <div class="info-item">
                <label>FECHA DE NACIMIENTO</label>
                <p>${dateFormat.format(studentBirthdate)}</p>
              </div>
              <div class="info-item">
                <label>DIRECCIÓN</label>
                <p>${student["DatosPersona"]["Direccion"]}</p>
              </div>
              <div class="info-item" style="grid-column: span 2;">
                 <label>ESTADO ACTUAL</label>
                 <span style="font-weight: bold; text-transform: capitalize; color: ${student["Estado"] === 'rechazado' ? 'red' : '#059669'};">
                    ${student["Estado"]}
                 </span>
              </div>
            </div>

            <div class="accordion">
              <div class="accordion-header">
                <div class="acc-title">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <path d="M14 2v6h6" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <line x1="10" y1="9" x2="8" y2="9" />
                  </svg>
                  <span>Documentos del Estudiante</span>
                  <span class="counter-badge">${docCount}</span>
                </div>
                <svg class="chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6" /></svg>
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
                      <a href="${window.APP_CONFIG.api_url}/docs/get/partida-${student["EstudianteId"]}.pdf?preview=1" target="_blank" class="btn-icon-small" title="Ver documento" style="display: inline-flex; align-items: center; justify-content: center; text-decoration: none;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </a>
                      <button class="btn-icon-small btn-download-file" data-file="partida-${student["EstudianteId"]}.pdf" title="Descargar">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
                      <a href="${window.APP_CONFIG.api_url}/docs/get/notas-${student["EstudianteId"]}.pdf?preview=1" target="_blank" class="btn-icon-small" title="Ver documento" style="display: inline-flex; align-items: center; justify-content: center; text-decoration: none;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </a>
                      <button class="btn-icon-small btn-download-file" data-file="notas-${student["EstudianteId"]}.pdf" title="Descargar">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  ${isSchoolId ? "" : cedulaElement}
                  ${autorizacionElement}
                </div>
              </div>
            </div>

            <div class="accordion">
              <div class="accordion-header">
                <div class="acc-title">
                  <img src="${window.APP_CONFIG.api_url}/docs/get/carnet-${student["Representante"]["UsuarioId"]}.webp" class="avatar-small" />
                  <div>
                    <span class="d-block font-bold">Representante</span>
                    <span class="d-block text-small">${student["Representante"]["Nombre"]} ${student["Representante"]["Apellido"]}</span>
                  </div>
                </div>
                <svg class="chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6" /></svg>
              </div>
              <div class="accordion-content">
                <div class="info-grid mt-2">
                  <div class="info-item"><label>PARENTESCO</label><p>${student["Parentesco"]}</p></div>
                  <div class="info-item"><label>CÉDULA</label>
                  <p>${formatCedula(student["Representante"]["Cedula"])}</p></div>
                  <div class="info-item"><label>TELÉFONO</label><p class="link">${student["Representante"]["Telefono"]}</p></div>
                  <div class="info-item"><label>EMAIL</label><p class="link">${student["Representante"]["Email"]}</p></div>
                  <div class="info-item"><label>OCUPACIÓN</label><p>${student["Representante"]["Ocupacion"]}</p></div>
                  <div class="info-item"><label>DIRECCIÓN</label><p>${student["Representante"]["Direccion"]}</p></div>
                </div>
              </div>
            </div>

            <div class="accordion">
              <div class="accordion-header">
                <div class="acc-title">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <path d="M14 2v6h6" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <line x1="10" y1="9" x2="8" y2="9" />
                  </svg>
                  <span>Documento del Representante</span>
                </div>
                <svg class="chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6" /></svg>
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
                      <a href="${window.APP_CONFIG.api_url}/docs/get/dni-${student["Representante"]["UsuarioId"]}.pdf?preview=1" target="_blank" class="btn-icon-small" title="Ver documento" style="display: inline-flex; align-items: center; justify-content: center; text-decoration: none;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </a>
                      <button class="btn-icon-small btn-download-file" data-file="dni-${student["Representante"]["UsuarioId"]}.pdf" title="Descargar">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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

          ${student["Estado"] === "revision" ? cardFooter : ""}
      `;
        cardsContainer.appendChild(studentCard);
        accordion(studentCard, student);

        // --- Event Listener para el Lápiz (Abrir Modal) ---
        const editBtn = studentCard.querySelector(".edit-trigger");
        if (editBtn) {
            editBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                currentEditId = student["EstudianteId"];
                editStudentName.textContent = `${student["DatosPersona"]["Nombre"]} ${student["DatosPersona"]["Apellido"]}`;
                newStatusSelect.value = student["Estado"]; 
                editModal.classList.add("open");
            });
        }

        // Descargar Documentos
        studentCard.querySelectorAll(".btn-download-file").forEach((btn) =>
          btn.addEventListener("click", async () => {
             loader.setAttribute("title", "Descargando documento...");
             document.body.appendChild(loader);
             let objectUrl = undefined;
             try {
               const downloadDocumentResponse = await fetch(
                 `${window.APP_CONFIG.api_url}/docs/get/${btn.getAttribute("data-file")}`,
                 { method: "GET" },
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
               const notification = document.createElement("notification-component");
               notification.setAttribute("type", "error");
               notification.setAttribute("text", Error.message);
               notifications.appendChild(notification);
             } finally {
               if (objectUrl) URL.revokeObjectURL(objectUrl);
               loader.remove();
             }
          }),
        );

        studentCard.querySelectorAll(".btn-success").forEach((btn) =>
          btn.addEventListener("click", async () => {
             loader.setAttribute("title", "Aprobando solicitud...");
             document.body.appendChild(loader);
             try {
               const confirmation = confirm("¿Seguro que quieres aprobar la solicitud de ingreso de este estudiante?");
               if (!confirmation) return;
               const approveResponse = await fetch(
                 `${window.APP_CONFIG.api_url}/students/approve/${student["EstudianteId"]}`,
                 {
                   method: "PUT",
                   headers: {
                     "Content-Type": "application/json",
                     Authorization: `Bearer ${token}`,
                   },
                 },
               );
               
               if (approveResponse.status !== 200 && approveResponse.status !== 204) {
                 const approveError = await approveResponse.json();
                 throw new Error(approveError.message);
               }
               
               studentCard.remove();
               const notification = document.createElement("notification-component");
               notification.setAttribute("type", "success");
               notification.setAttribute("text", `${student["DatosPersona"]["Nombre"]} inscrito correctamente`);
               notifications.appendChild(notification);
             } catch (Error) {
               console.error(Error.stack);
               const notification = document.createElement("notification-component");
               notification.setAttribute("type", "error");
               notification.setAttribute("text", Error.message);
               notifications.appendChild(notification);
             } finally {
               loader.remove();
             }
          }),
        );
      });

      const btnConfirm = document.querySelector(".confirmReject");
      const newBtnConfirm = btnConfirm.cloneNode(true); 
      btnConfirm.parentNode.replaceChild(newBtnConfirm, btnConfirm);

      newBtnConfirm.addEventListener("click", async () => {
        const confirmation = confirm("¿Seguro que quieres rechazar la solicitud de inscripción?");
        if (!confirmation) return;
        
        loader.setAttribute("title", "Rechazando solicitud de inscripción...");
        document.body.appendChild(loader);
        const modal = document.querySelector(".rejectModal");

        try {
          if (selectReason.value.length === 0) {
            selectReason.focus();
            throw new Error("Debes seleccionar un motivo para el rechazo.");
          } else if (textDesc.value.trim().length < 10) {
            textDesc.focus();
            throw new Error("La descripción debe tener al menos 10 caracteres.");
          }

          modal.classList.remove("open");

          const rejectRegistrationResponse = await fetch(
            `${window.APP_CONFIG.api_url}/students/reject/${modal.getAttribute("data-student")}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                Email: modal.getAttribute("data-email"),
                Motivo: selectReason.value,
                Descripcion: textDesc.value.trim(),
              }),
            },
          );

          if (rejectRegistrationResponse.status !== 200 && rejectRegistrationResponse.status !== 204) {
            const rejectMessage = await rejectRegistrationResponse.json();
            throw new Error(rejectMessage.message);
          }

          const notification = document.createElement("notification-component");
          notification.setAttribute("type", "error"); 
          notification.setAttribute("text", "Solicitud rechazada correctamente");
          notifications.appendChild(notification);
          
          filterRequests();

        } catch (Error) {
          console.error(Error);
          const notification = document.createElement("notification-component");
          notification.setAttribute("type", "error");
          notification.setAttribute("text", Error.message);
          notifications.appendChild(notification);
        } finally {
          loader.remove();
        }
      });

    } catch (Error) {
      console.error(Error);
      const notification = document.createElement("notification-component");
      notification.setAttribute("type", "error");
      notification.setAttribute("text", Error.message);
      notifications.appendChild(notification);
    } finally {
      loader.remove();
    }
  };

  await filterRequests();
  
  // Event Listeners de Filtros
  searchField.addEventListener("change", filterRequests);
  sectionsField.addEventListener("change", filterRequests);
  stateField.addEventListener("change", filterRequests);

  // Cargando grados y secciones para filtros
  document.body.appendChild(loader);
  let sections = [];
  let maxSection = 1;

  try {
    const sectionsResponse = await fetch(
      `${window.APP_CONFIG.api_url}/course/sections`,
      { method: "GET", headers: { "Content-Type": "application/json" } },
    );

    const sectionsMessage = await sectionsResponse.json();
    if (!sectionsResponse.ok) throw new Error(sectionsMessage.message);

    sections = [...sectionsMessage];
    maxSection = sections.reduce(
      (accum, section) => (section["Seccion"] > accum ? section["Seccion"] : accum),
      0,
    );

    const uniqueGrades = [];
    const seenGrades = new Set();
    sections.forEach(s => {
        if(!seenGrades.has(s["CursoId"])) {
            seenGrades.add(s["CursoId"]);
            uniqueGrades.push(s);
        }
    });

    uniqueGrades.forEach((section) => {
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
  } finally {
    loader.remove();
  }

  gradesField.addEventListener("change", () => {
    const selectedSections =
      sections.find((element) => element["CursoId"] === gradesField.value)?.Seccion ?? maxSection;

    sectionsField.innerHTML = '<option value="">Todas las secciones</option>';
    for (let i = 1; i <= selectedSections; i++) {
      const option = document.createElement("option");
      option.setAttribute("value", i);
      option.textContent = numberToLetter(i);
      sectionsField.appendChild(option);
    }

    filterRequests();
  });

  document.getElementById("BtnBack").addEventListener("click", () => {
    document.body.style.overflow = "hidden";
    document.body.style.animation = "goodByePage 0.8s forwards";
    setTimeout(() => (window.location.href = "/app/admin/dashboard/"), 1000);
  });
});