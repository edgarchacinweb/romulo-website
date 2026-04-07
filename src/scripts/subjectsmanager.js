import authorize from "./auth.js";

authorize("administrador");
const token = localStorage.getItem("auth");

document.addEventListener("DOMContentLoaded", async () => {
  // Referencias al DOM
  const nameInput = document.getElementById("subjectName");
  const levelSelect = document.getElementById("educationLevel");
  const emptyState = document.getElementById("emptyState");
  const subjectsContainer = document.getElementById("subjectsContainer");
  const dynamicList = document.getElementById("dynamicList");
  const successAlert = document.getElementById("successAlert");
  const alertMessage = document.getElementById("alertMessage");
  const loader = document.createElement("loader-spinner");
  const notifications = document.getElementById("notifications");
  const addSubjectBtn = document.getElementById("AddSubjectBtn");
  const hoursInput = Array.from(document.querySelectorAll(".hours-input"));

  // Estado de la aplicación (Lista de materias)
  let subjects = [];

  // Función para obtener la fecha actual formateada (ej: 15 de febrero de 2026)
  const getCurrentDate = (strdate = "") => {
    let date = new Date();
    if (strdate.length > 0) {
      date = new Date(strdate);
    }
    const options = { day: "numeric", month: "long", year: "numeric" };
    return `Agregado el ${date.toLocaleDateString("es-VE", options)}`;
  };

  // Función principal para renderizar la lista
  const renderSubjects = () => {
    if (subjects.length > 0) {
      subjectsContainer.classList.remove("hidden");
      emptyState.classList.add("hidden");
    } else {
      emptyState.classList.remove("hidden");
    }
    dynamicList.innerHTML = "";

    const groupSection = document.createElement("div");
    groupSection.classList.add("level-group");
    groupSection.innerHTML = `
                <div class="subjects-grid">
                  ${subjects.reduce((accum, subject) => {
      return (
        accum +
        `
                        <div class="subject-card">
                          <div class="card-info">
                            <h4>${subject["Nombre"].toUpperCase()}</h4>
                            <span>${getCurrentDate(subject["Fecha"])}</span>
                            <div style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 6px;">
                              ${subject["HorasPorCurso"] ? subject["HorasPorCurso"].map(h => `<span style="background-color: #e0f2fe; color: #0284c7; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600;">${h.Grado}º Año: ${h.HorasAcademicas}h</span>`).join('') : ''}
                            </div>
                          </div>
                          <button class="btn-delete" title="Eliminar materia" data-id=${subject["MateriaId"]}>
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            >
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path
                                d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                              ></path>
                            </svg>
                          </button>
                        </div>
                      `
      );
    }, "")}
                </div>
            `;

    dynamicList.appendChild(groupSection);

    document.querySelectorAll(".btn-delete").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const confirmation = confirm(
          "¿Estás seguro de inhabilitar esta materia?",
        );
        if (!confirmation) return;

        const notification = document.createElement("notification-component");
        loader.setAttribute("title", "Deshabilitando Materia...");
        document.body.appendChild(loader);

        try {
          const id = btn.getAttribute("data-id");
          const removeSubjectResponse = await fetch(
            `${window.APP_CONFIG.api_url}/subject/delete/${id}`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (!removeSubjectResponse.ok) {
            const removeSubjectAnswer = await removeSubjectResponse.json();
            throw new Error(removeSubjectAnswer.message);
          }

          subjects = subjects.filter((s) => s["MateriaId"] !== id);
          renderSubjects();
          notification.setAttribute("type", "success");
          notification.setAttribute(
            "text",
            "Materia deshabilitada correctamente",
          );
        } catch (Error) {
          console.error(Error.stack);
          notification.setAttribute("type", "error");
          notification.setAttribute("text", Error.message);
        } finally {
          loader.remove();
          notifications.appendChild(notification);
        }
      }),
    );
  };

  const enableBtn = () => {
    addSubjectBtn.setAttribute("disabled", "");
    const name = nameInput.value.trim();
    if (
      !name.length > 3 ||
      name.length > 25 ||
      !new RegExp(
        /^(?! )(?!.* $)(?!.* {2})(?!.*[.,]{2})(?=.*[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ])[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ., ]+$/,
      ).test(name)
    )
      return;
    else if (hoursInput.filter(h => h.value === "" || h.value === "0").length === 5) return;
    else if (hoursInput.some(h => parseInt(h.value ?? "0") > 4 || parseInt(h.value ?? "0") < 0)) return;

    addSubjectBtn.removeAttribute("disabled");
  };

  // Cargar materias ya insertadas
  loader.setAttribute("title", "Cargando Materias...");
  document.body.appendChild(loader);

  try {
    const subjectsResponse = await fetch(
      `${window.APP_CONFIG.api_url}/subject/list`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const subjectsAnswer = await subjectsResponse.json();
    if (!subjectsResponse.ok) throw new Error(subjectsAnswer.message);

    subjects = [...subjectsAnswer];
    renderSubjects();
  } catch (Error) {
    console.error(Error.stack);
    const notification = document.createElement("notification-component");
    notification.setAttribute("type", "error");
    notification.setAttribute("text", Error.message);
    notifications.appendChild(notification);
  } finally {
    loader.remove();
  }

  nameInput.addEventListener("change", enableBtn);
  nameInput.addEventListener("keyup", enableBtn);
  hoursInput.forEach((h) => {
    h.addEventListener("input", (e) => {
      let val = parseInt(e.target.value);
      if (val > 4) {
        e.target.value = 4;
        const notification = document.createElement("notification-component");
        notification.setAttribute("type", "warning");
        notification.setAttribute("text", "El máximo permitido es 4 horas semanales por año");
        notifications.appendChild(notification);
      } else if (val < 0) {
        e.target.value = 0;
      }
    });
    h.addEventListener("change", enableBtn);
    h.addEventListener("keyup", enableBtn);
  });

  // Manejador del envío del formulario
  addSubjectBtn.addEventListener("click", async () => {
    loader.setAttribute("title", "Registrando Materia...");

    try {
      const name = nameInput.value.trim();

      if (name.length === 0) {
        const notification = document.createElement("notification-component");
        notification.setAttribute("type", "warning");
        notification.setAttribute(
          "text",
          "Debes indicar el nombre de la materia",
        );
        notifications.appendChild(notification);
        nameInput.focus();
        return;
      } else if (
        !new RegExp(
          /^(?! )(?!.* $)(?!.* {2})(?!.*[.,]{2})(?=.*[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ])[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ., ]+$/,
        ).test(name)
      ) {
        nameInput.focus();
        throw new Error("El nombre de la materia tiene un formato inválido");
      } else if (name.length > 40) {
        nameInput.focus();
        throw new Error(
          "El nombre de la materia es demasiado largo. Límite máximo: 40 caracteres",
        );
      } else if (
        subjects.findIndex(
          (s) =>
            s["Nombre"].toLowerCase() === name.toLowerCase()
        ) !== -1
      ) {
        nameInput.focus();
        throw new Error("Esa materia ya se encuentra registrada");
      } else if (hoursInput.filter(h => h.value === "" || h.value === "0").length === 5) {
        throw new Error("La materia se debe impartir en al menos un año");
      }

      hoursInput.forEach((h) => {
        if (h.value > 4) {
          h.focus();
          throw new Error("La materia no se puede impartir más de 4 horas semanales");
        }
      });

      const newSubject = {
        Nombre: name.toUpperCase(),
        HorasAcademicas: hoursInput.reduce((accum, h) => [...accum, parseInt(h.value ?? "0")], []),
        Fecha: "",
      };

      // Crear nueva materia
      const registerSubjectResponse = await fetch(
        `${window.APP_CONFIG.api_url}/subject/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newSubject),
        },
      );

      const registerSubjectAnswer = await registerSubjectResponse.json();
      if (registerSubjectResponse.status !== 201)
        throw new Error(registerSubjectAnswer.message);

      newSubject["MateriaId"] = registerSubjectAnswer["MateriaId"];
      subjects.push(newSubject);

      // Mostrar notificación
      alertMessage.textContent = `Agregada la materia ${name.toUpperCase()}`;
      successAlert.classList.remove("hidden");

      // Ocultar notificación después de 3 segundos
      setTimeout(() => {
        successAlert.classList.add("hidden");
      }, 3000);

      // Limpiar input y renderizar
      nameInput.value = "";
      nameInput.focus();
      renderSubjects();
    } catch (Error) {
      console.error(Error.stack);
      const notification = document.createElement("notification-component");
      notification.setAttribute("type", "error");
      notification.setAttribute("text", Error.message);
      notifications.appendChild(notification);
    } finally {
      loader.remove();
    }
  });
});

document.getElementById("BtnBack").addEventListener("click", () => {
  document.body.style.overflow = "hidden";
  document.body.style.animation = "goodByePage 0.8s forwards";
  setTimeout(() => (window.location.href = "/app/admin/dashboard/"), 1000);
});
