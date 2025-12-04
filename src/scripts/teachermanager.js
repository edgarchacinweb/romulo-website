import authorize from "./auth.js";

authorize("administrador");

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("auth");
  const notificationContainer = document.getElementById("notifications");

  const loader = document.createElement("loader-spinner");
  loader.setAttribute("title", "Cargando docentes...");
  document.body.appendChild(loader);

  // Cargando cantidad de docentes activos
  const teacherList = document.getElementById("teacher-list");

  const teachersResponse = await fetch(
    `${window.APP_CONFIG.api_url}/teacher/list`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const notification = document.createElement("notification-component");

  if (teachersResponse.status !== 200) {
    notification.setAttribute("type", "error");
    notification.setAttribute(
      "text",
      "Error al cargar la plantilla del personal docente"
    );
  } else {
    const teachers = await teachersResponse.json();

    const teachersData = Object.values(
      teachers.reduce((acum, item) => {
        const { DocenteId, DatosPersona, Materia, FechaCreacion } = item;
        if (!acum[DatosPersona.DatosPersonaId]) {
          const date = new Date(FechaCreacion);
          const dateFormatted = new Intl.DateTimeFormat("es-VE", {
            year: "numeric",
            day: "2-digit",
            month: "2-digit",
          });
          acum[DatosPersona.DatosPersonaId] = {
            DocenteId,
            DatosPersona,
            Materias: [],
            FechaCreacion: dateFormatted.format(date),
          };
        }

        acum[DatosPersona.DatosPersonaId].Materias.push(Materia.name);

        return acum;
      }, {})
    );

    if (teachers.length === 0) {
      notification.setAttribute("type", "warning");
      notification.setAttribute(
        "text",
        "No hay docentes registrados en este momento."
      );
    } else {
      const activeTeachers = document.getElementById("active-teachers");
      activeTeachers.innerHTML = teachersData.length;

      teachersData.forEach((teacherElement) => {
        const teacherCard = document.createElement("teacher-card");
        teacherCard.setAttribute("teacherData", JSON.stringify(teacherElement));
        teacherList.appendChild(teacherCard);
      });
      notification.setAttribute("type", "success");
      notification.setAttribute(
        "text",
        "Plantilla de personal docente cargada."
      );
    }
  }

  // Cargando materias disponibles
  const subjectsResponse = await fetch(
    `${window.APP_CONFIG.api_url}/subject/list`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (subjectsResponse.status !== 200) {
    const subjectErrorNotification = document.createElement(
      "notification-component"
    );
    subjectErrorNotification.setAttribute("type", "error");
    subjectErrorNotification.setAttribute(
      "text",
      "Error al cargar las materias..."
    );
    notificationContainer.appendChild(subjectErrorNotification);
  } else {
    const subjects = await subjectsResponse.json();
    const subjectList = document.getElementById("materia");
    subjectList.firstElementChild.remove();

    subjects.forEach((s) => {
      const subject = document.createElement("option");
      subject.setAttribute("value", s.id);
      subject.textContent = s.name;
      subjectList.appendChild(subject);
    });
  }

  loader.remove();
  notificationContainer.appendChild(notification);

  // Guardando docente
  const teacherForm = document.getElementById("teacher-form");
  const firstNameField = document.getElementById("nombre");
  const lastNameField = document.getElementById("apellido");
  const genderField = document.getElementById("sexo");
  const identityField = document.getElementById("cedula");
  const phoneField = document.getElementById("telefono");
  const ocupationField = document.getElementById("ocupacion");
  const subjectField = document.getElementById("materia");
  const locationField = document.getElementById("direccion");

  document.getElementById("submit-btn").addEventListener("click", async () => {
    const loader = document.createElement("loader-spinner");
    loader.setAttribute("text", "Guardando datos del docente...");
    document.body.appendChild(loader);

    if (
      firstNameField.value.length === 0 ||
      lastNameField.value.length === 0 ||
      identityField.value.length === 0 ||
      phoneField.value.length === 0 ||
      ocupationField.value.length === 0 ||
      locationField.value.length === 0
    ) {
      const validationNotification = document.createElement(
        "notification-component"
      );
      validationNotification.setAttribute("type", "warning");
      validationNotification.setAttribute(
        "text",
        "Rellena todos los campos del formulario"
      );
      notificationContainer.appendChild(validationNotification);
    } else {
      const newTeacherData = {
        DatosPersona: {
          DatosPersonaId: "",
          Nombre: firstNameField.value,
          Apellido: lastNameField.value,
          Cedula: identityField.value,
          Sexo: genderField.value,
          Telefono: phoneField.value,
          Ocupacion: ocupationField.value,
          Direccion: locationField.value,
        },
        Materia: {
          MateriaId: subjectField.value,
        },
      };

      const createTeacherNotification = document.createElement(
        "notification-component"
      );
      const createTeacherQuery = await fetch(
        `${window.APP_CONFIG.api_url}/people/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newTeacherData.DatosPersona),
        }
      );

      if (createTeacherQuery.status !== 201) {
        createTeacherNotification.setAttribute("type", "error");
        createTeacherNotification.setAttribute(
          "text",
          "Error al guardar datos del docente"
        );
        notificationContainer.appendChild(createTeacherNotification);
      } else {
        const createTeacherResponse = await createTeacherQuery.json();
        newTeacherData["DatosPersona"]["DatosPersonaId"] =
          createTeacherResponse.id;

        const registerTeacherQuery = fetch(
          `${window.APP_CONFIG.api_url}/teacher/create`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              DatosPersonaId: newTeacherData.DatosPersona.DatosPersonaId,
              MateriaId: newTeacherData.Materia.MateriaId,
            }),
          }
        )
          .then((response) => {
            if (response.status !== 201) {
              throw "Error al registrar datos del docente";
            }

            return response.json();
          })
          .then((data) => {
            createTeacherNotification.setAttribute("type", "success");
            createTeacherNotification.setAttribute(
              "text",
              "Docente guardado correctamente"
            );
            notificationContainer.appendChild(createTeacherNotification);
            const newTeacherCard = document.createElement("teacher-card");
            const selectedSubject = subjectField.querySelector(
              `[value="${subjectField.value}"]`
            ).textContent;
            const date = new Intl.DateTimeFormat("es-VE", {
              year: "numeric",
              day: "2-digit",
              month: "2-digit",
            }).format(new Date());
            newTeacherCard.setAttribute(
              "teacherData",
              JSON.stringify({
                DatosPersona: newTeacherData.DatosPersona,
                Materias: [selectedSubject],
                FechaCreacion: date,
              })
            );
            teacherList.appendChild(newTeacherCard);
          })
          .catch((error) => {
            createTeacherNotification.setAttribute("type", "error");
            createTeacherNotification.setAttribute("text", error);
            notificationContainer.appendChild(createTeacherNotification);
            console.log(error);
          })
          .finally(() => {
            loader.remove();
            teacherForm.reset();
          });
      }
    }
  });
});
