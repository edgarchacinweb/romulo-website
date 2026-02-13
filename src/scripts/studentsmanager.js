import authorize from "./auth.js";
import numberToLetter from "./utils.js";

authorize("administrador");


document.addEventListener("DOMContentLoaded", async () => {
  // LOG DE CONTROL: Esto aparecerá en tu consola (F12) para confirmar que este es el archivo activo
  console.log("¡SISTEMA CARGADO: Operando en el archivo de 638 líneas! 🚀");

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

  // --- 1. Lógica del Modal de Edición (Estado) ---
  if(cancelEditBtn) {
      cancelEditBtn.addEventListener("click", () => {
          editModal.classList.remove("open");
          currentEditId = null;
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

              if (!response.ok) throw new Error("Error al actualizar");
              editModal.classList.remove("open");
              filterRequests();
          } catch (error) { console.error(error); } finally { loader.remove(); }
      });
  }

  // --- 2. Funciones de Acordeón ---
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
        studentName.textContent = `${student["DatosPersona"]["Nombre"]} ${student["DatosPersona"]["Apellido"]}`;
        parentEmail.textContent = student["Representante"]["Email"];
        modal.setAttribute("data-student", student["EstudianteId"]);
        modal.setAttribute("data-email", student["Representante"]["Email"]);
        modal.classList.add("open");
      });
    }
    if(btnCancel) btnCancel.addEventListener("click", () => modal.classList.remove("open"));
  };

  // --- 3. Filtrado y Carga de Tarjetas ---
  const filterRequests = async () => {
    loader.setAttribute("title", "Buscando registros...");
    document.body.appendChild(loader);

    try {
      const response = await fetch(`${window.APP_CONFIG.api_url}/students/filter`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            Busqueda: searchField.value.trim(),
            CursoId: gradesField.value,
            Seccion: sectionsField.value,
            Estado: stateField.value,
          }),
      });

      const studentsRequest = await response.json();
      studentCounter.textContent = studentsRequest.length || "0";
      cardsContainer.querySelectorAll(".student-card").forEach((elm) => elm.remove());

      studentsRequest.forEach((student) => {
        const studentBirthdate = new Date(student["FechaNacimiento"]);
        const studentCard = document.createElement("article");
        studentCard.classList.add("student-card");
        studentCard.setAttribute("data-id", student["EstudianteId"]);

        // FOOTER CON CLASES CORREGIDAS
        const cardFooter = `
          <div class="card-footer">
            <button class="btn btn-success btn-approve-action">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12" /></svg>
              Aprobar
            </button>
            <button class="btn btn-danger btn-reject-action">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              Rechazar
            </button>
          </div>
        `;

        studentCard.innerHTML = `
          <div class="card-header">
            <div class="student-profile">
              <img src="${window.APP_CONFIG.api_url}/docs/get/carnet-${student["EstudianteId"]}.webp" onerror="this.src='/src/assets/default-avatar.png'" class="avatar" />
              <div>
                <h3>${student["DatosPersona"]["Nombre"]} ${student["DatosPersona"]["Apellido"]}</h3>
                <span class="badge">${student["Curso"]["Grado"]}° Año • Sección ${numberToLetter(student["Curso"]["Seccion"])}</span>
              </div>
            </div>
            <button class="btn-icon edit-trigger" type="button"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
          </div>
          <div class="card-body">
            <div class="info-grid">
              <div class="info-item"><label>GÉNERO</label><p>${student["DatosPersona"]["Sexo"]}</p></div>
              <div class="info-item"><label>CÉDULA</label><p>V${student["DatosPersona"]["Cedula"]}</p></div>
              <div class="info-item"><label>DIRECCIÓN</label><p>${student["DatosPersona"]["Direccion"]}</p></div>
              <div class="info-item" style="grid-column: span 2;"><label>ESTADO ACTUAL</label><span style="font-weight: bold; text-transform: capitalize; color: ${student["Estado"] === 'rechazado' ? 'red' : '#059669'};">${student["Estado"]}</span></div>
            </div>
            <div class="accordion">
               <div class="accordion-header"><span>Ver Documentos</span></div>
               <div class="accordion-content">
                  <button class="btn-download-file" data-file="partida-nacimiento-${student["EstudianteId"]}.pdf">Partida.pdf</button>
                  <button class="btn-download-file" data-file="notas-certificadas-${student["EstudianteId"]}.pdf">Notas.pdf</button>
               </div>
            </div>
          </div>
          ${student["Estado"] === "revision" ? cardFooter : ""}
        `;

        cardsContainer.appendChild(studentCard);
        accordion(studentCard, student);

        // --- CONECTANDO EL BOTÓN DE APROBAR ---
        studentCard.querySelector(".btn-approve-action")?.addEventListener("click", async () => {
             if (!confirm("¿Aprobar inscripción?")) return;
             loader.setAttribute("title", "Inscribiendo...");
             document.body.appendChild(loader);
             try {
               const res = await fetch(`${window.APP_CONFIG.api_url}/students/approve/${student["EstudianteId"]}`, {
                   method: "PUT",
                   headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
               });
               
               // EL CAMBIO MÁGICO: Usamos .ok porque el servidor devuelve 200, no 204
               if (res.ok) {
                   studentCard.remove();
                   alert("¡Inscrito correctamente!");
               } else { throw new Error("No se pudo aprobar"); }
             } catch (e) { alert(e.message); } finally { loader.remove(); }
        });

        // --- CONECTANDO EL BOTÓN DE RECHAZAR ---
        studentCard.querySelector(".btn-reject-action")?.addEventListener("click", () => {
            const modal = document.querySelector(".rejectModal");
            modal.setAttribute("data-student", student["EstudianteId"]);
            modal.classList.add("open");
        });
      });
    } catch (e) { console.error(e); } finally { loader.remove(); }
  };

  // --- 4. Lógica de Rechazo (Modal Final) ---
  const btnConfirmReject = document.querySelector(".confirmReject");
  if(btnConfirmReject) {
      btnConfirmReject.addEventListener("click", async () => {
          const modal = document.querySelector(".rejectModal");
          const id = modal.getAttribute("data-student");
          loader.setAttribute("title", "Rechazando...");
          document.body.appendChild(loader);

          try {
              const res = await fetch(`${window.APP_CONFIG.api_url}/students/reject/${id}`, {
                  method: "PUT",
                  headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                  body: JSON.stringify({ Motivo: selectReason.value, Descripcion: textDesc.value })
              });
              if(res.ok) {
                  modal.classList.remove("open");
                  filterRequests();
              }
          } finally { loader.remove(); }
      });
  }

  filterRequests();
});
// --- Lógica del Botón Volver (Atrás) ---
  const btnBack = document.getElementById("BtnBack");
  
  if (btnBack) {
    btnBack.addEventListener("click", (e) => {
      e.preventDefault(); // Evita que el enlace recargue la página antes de tiempo
      
      // Aplicamos la animación de salida
      document.body.style.overflow = "hidden";
      document.body.style.animation = "goodByePage 0.8s forwards";
      
      // Redirigimos después de que termine la animación (800ms)
      setTimeout(() => {
        window.location.href = "/app/admin/dashboard/";
      }, 800);
    });
  } else {
    console.warn("⚠️ No se encontró el elemento con ID 'BtnBack' en el HTML.");
  }