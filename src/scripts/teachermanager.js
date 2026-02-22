import authorize from "./auth.js";

authorize("administrador");

const addTeacherCard = (teacher) => {
  const teachersCardContainer = document.getElementById("teacher-list");
  const card = document.createElement("article");
  card.classList.add("teachers__card");
  card.innerHTML = `
                  <section class="card__info">
                    <h3 class="card__name">${teacher["DatosPersona"]["Nombre"]} ${teacher["DatosPersona"]["Apellido"]}</h3>
                    <h4 class="card__identity">Cédula: V${teacher["DatosPersona"]["Cedula"]}</h4>
                  </section>
                  <section class="card__data">
                    <div class="card__field">
                      <svg
                        width="24"
                        height="24"
                        stroke="currentColor"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                      >
                        <path d="M2.59 1.322l2.844-1.322 4.041 7.889-2.724 1.342c-.538 1.259 2.159 6.289 3.297 6.372.09-.058 2.671-1.328 2.671-1.328l4.11 7.932s-2.764 1.354-2.854 1.396c-.598.273-1.215.399-1.842.397-5.649-.019-12.086-10.43-12.133-17.33-.016-2.407.745-4.387 2.59-5.348zm1.93 1.274l-1.023.504c-5.294 2.762 4.177 21.185 9.648 18.686l.972-.474-2.271-4.383-1.026.501c-3.163 1.547-8.262-8.219-5.055-9.938l1.007-.498-2.252-4.398zm15.48 14.404h-1v-13h1v13zm-2-2h-1v-9h1v9zm4-1h-1v-7h1v7zm-6-1h-1v-5h1v5zm-2-1h-1v-3h1v3zm10 0h-1v-3h1v3zm-12-1h-1v-1h1v1z"/>
                      </svg>
                      <p class="card__text">${teacher["DatosPersona"]["Telefono"]}</p>
                    </div>
                    <div class="card__field">
                      <svg
                        width="24"
                        height="24"
                        stroke="currentColor"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                      >
                        <path d="M24 23h-24v-13.275l2-1.455v-7.27h20v7.272l2 1.453v13.275zm-20-10.472v-9.528h16v9.527l-8 5.473-8-5.472zm14-.528h-12v-1h12v1zm0-3v1h-12v-1h12zm-7-1h-5v-3h5v3zm7 0h-6v-1h6v1zm0-2h-6v-1h6v1z"/>
                      </svg>
                      <p class="card__text">${teacher["Usuario"]["Email"]}</p>
                    </div>
                    <div class="card__field">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        stroke="currentColor"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M23 5v13.883l-1 .117v-16c-3.895.119-7.505.762-10.002 2.316-2.496-1.554-6.102-2.197-9.998-2.316v16l-1-.117v-13.883h-1v15h9.057c1.479 0 1.641 1 2.941 1 1.304 0 1.461-1 2.942-1h9.06v-15h-1zm-12 13.645c-1.946-.772-4.137-1.269-7-1.484v-12.051c2.352.197 4.996.675 7 1.922v11.613zm9-1.484c-2.863.215-5.054.712-7 1.484v-11.613c2.004-1.247 4.648-1.725 7-1.922v12.051z"/>
                      </svg>
                      <p class="card__text">${teacher["Materias"].map((m) => m["Nombre"]).join(", ")}</p>
                    </div>
                    <div class="card__field">
                      <svg
                        width="24"
                        height="24" stroke="currentColor" fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                      >
                        <path d="M24 19h-1v-2.2c-1.853 4.237-6.083 7.2-11 7.2-6.623 0-12-5.377-12-12h1c0 6.071 4.929 11 11 11 4.66 0 8.647-2.904 10.249-7h-2.249v-1h4v4zm-11.036 0h-1.886c-.34-.957-.437-1.571-1.177-1.878h-.001c-.743-.308-1.251.061-2.162.494l-1.333-1.333c.427-.899.804-1.415.494-2.163-.308-.74-.926-.839-1.878-1.177v-1.886c.954-.339 1.57-.437 1.878-1.178.308-.743-.06-1.248-.494-2.162l1.333-1.333c.918.436 1.421.801 2.162.494l.001-.001c.74-.307.838-.924 1.177-1.877h1.886c.34.958.437 1.57 1.177 1.877l.001.001c.743.308 1.252-.062 2.162-.494l1.333 1.333c-.435.917-.801 1.421-.494 2.161v.001c.307.739.915.835 1.878 1.178v1.886c-.953.338-1.571.437-1.878 1.178-.308.743.06 1.249.494 2.162l-1.333 1.333c-.92-.438-1.42-.802-2.157-.496-.746.31-.844.926-1.183 1.88zm-.943-4.667c-1.289 0-2.333-1.044-2.333-2.333 0-1.289 1.044-2.334 2.333-2.334 1.289 0 2.333 1.045 2.333 2.334 0 1.289-1.044 2.333-2.333 2.333zm-8.021-5.333h-4v-4h1v2.2c1.853-4.237 6.083-7.2 11-7.2 6.623 0 12 5.377 12 12h-1c0-6.071-4.929-11-11-11-4.66 0-8.647 2.904-10.249 7h2.249v1z"/>
                      </svg>
                      <p class="card__text">${teacher["DatosPersona"]["Ocupacion"]}</p>
                    </div>
                    <div class="card__field">
                      <svg
                        stroke="currentColor"
                        fill="currentColor"
                        width="24"
                        height="24"
                        xmlns="http://www.w3.org/2000/svg"
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                      >
                        <path d="M19.004 1c-.947 0-1.895.268-2.719.803 3.17 1.218 5.694 3.739 6.914 6.909.534-.823.801-1.77.801-2.717 0-2.761-2.236-4.995-4.996-4.995m-7.004 20c-4.411 0-8.001-3.59-8.001-8 0-4.413 3.59-8.001 8.001-8.001 4.412 0 8.002 3.588 8.002 8.001 0 4.41-3.59 8-8.002 8m10.002-8c0-5.522-4.475-10.001-10.002-10.001-5.523 0-10.001 4.479-10.001 10.001 0 4.316 3.087 10 10.001 10 6.93 0 10.002-5.693 10.002-10m-21.199-4.285c-.535-.824-.802-1.772-.802-2.718 0-2.757 2.233-4.995 4.991-4.995.948 0 1.896.268 2.721.803-3.172 1.217-5.692 3.739-6.91 6.91m12.196 4.285v-5h-1.999v6.998h5.999v-1.998h-4z"/>
                      </svg>
                      <p class="card__text">${teacher["HorasAcademicas"]} horas/semana</p>
                    </div>
                    <div class="card__field">
                      <svg
                        stroke="currentColor"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 0c-3.313 0-6 2.687-6 6 0 2.972 2.164 5.433 5 5.91v8.09h2v-8.089c2.836-.477 5-2.938 5-5.91 0-3.314-2.687-6.001-6-6.001zm-.707 4.508c-.549.65-1.423.8-1.953.333s-.516-1.372.034-2.022c.548-.65 1.422-.799 1.952-.333.53.467.515 1.372-.033 2.022zm8.707 11.492h-5v2h3.764l.5 1h-4.264v1.175l.783 1.825h-7.488l.705-1.643v-1.357h-2.042l-1.011-1h3.053v-2h-5l-4 8h24l-4-8zm-12.794 6h-3.97l1.764-3.528 1.516 1.528h1.549l-.859 2zm8.808-2h3.75l1 2h-3.892l-.858-2z"/>
                      </svg>
                      <p class="card__text">${teacher["DatosPersona"]["Direccion"]}</p>
                    </div>
                  </section>
                  <section class="card__button">
                    <button class="card__delete">
                      <svg
                        width="24"
                        height="24"
                        stroke="currentColor"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                      >
                        <path d="M19 24h-14c-1.104 0-2-.896-2-2v-16h18v16c0 1.104-.896 2-2 2m-9-14c0-.552-.448-1-1-1s-1 .448-1 1v9c0 .552.448 1 1 1s1-.448 1-1v-9zm6 0c0-.552-.448-1-1-1s-1 .448-1 1v9c0 .552.448 1 1 1s1-.448 1-1v-9zm6-5h-20v-2h6v-1.5c0-.827.673-1.5 1.5-1.5h5c.825 0 1.5.671 1.5 1.5v1.5h6v2zm-12-2h4v-1h-4v1z"/>
                      </svg>
                      <span>Eliminar</span>
                    </button>
                  </section>
      `;
  teachersCardContainer.appendChild(card);

  card.querySelector(".card__delete").addEventListener("click", async () => {
    const notification = document.createElement("notification-component");
    const notifications = document.getElementById("notifications");
    const loader = document.createElement("loader-spinner");
    loader.setAttribute("title", "Borrando docente...");
    const token = localStorage.getItem("auth");
    const confirmation = confirm(
      "¿Estás seguro de que quieres deshabilitar al docente?",
    );
    if (!confirmation) return;
    document.body.appendChild(loader);

    try {
      const removeTeacherResponse = await fetch(
        `${window.APP_CONFIG.api_url}/teacher/remove/${teacher["DocenteId"]}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (removeTeacherResponse.status !== 204) {
        const removeTeacherAnswer = await removeTeacherResponse.json();
        throw new Error(removeTeacherAnswer.message);
      }

      card.remove();
      const teachersCounter = document.getElementById("active-teachers");
      teachersCounter.textContent = parseInt(teachersCounter.textContent) - 1;
      notification.setAttribute("type", "success");
      notification.setAttribute("text", "Docente eliminado correctamente.");
    } catch (Error) {
      console.error(Error.message);
      notification.setAttribute("type", "error");
      notification.setAttribute("text", Error.message);
    } finally {
      loader.remove();
      notifications.appendChild(notification);
    }
  });
};

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("auth");
  let teachers = [];

  const teacherForm = document.getElementById("teacher-form");
  const firstNameField = document.getElementById("nombre");
  const lastNameField = document.getElementById("apellido");
  const genderField = document.getElementById("sexo");
  const identityField = document.getElementById("cedula");
  const phoneField = document.getElementById("telefono");
  const phonePrefixField = document.getElementById("prefijo");
  const ocupationField = document.getElementById("ocupacion");
  const subjectField = document.getElementById("materia");
  const subjectsContainer = document.querySelector(".materias-seleccionadas");
  const hoursField = document.getElementById("horas");
  const emailField = document.getElementById("correo");
  const locationField = document.getElementById("direccion");

  const notificationContainer = document.getElementById("notifications");
  const addSubjectBtn = document.getElementById("agregar-materia");
  let selectedSubjects = [];

  const loader = document.createElement("loader-spinner");
  loader.setAttribute("title", "Cargando docentes...");
  document.body.appendChild(loader);

  addSubjectBtn.addEventListener("click", () => {
    if (subjectField.options.length === 1)
      addSubjectBtn.classList.add("disabled");
    const selectedElement = subjectField.options[subjectField.selectedIndex];
    const id = subjectField.value;
    const subject = selectedElement.textContent;
    selectedElement.remove();
    selectedSubjects.push({ MateriaId: id, Nombre: subject });
    const newSubject = document.createElement("p");
    newSubject.textContent = subject;
    newSubject.classList.add("materia");
    subjectsContainer.appendChild(newSubject);
    console.log(selectedSubjects);

    newSubject.addEventListener("click", () => {
      const newOption = document.createElement("option");
      newOption.setAttribute("value", id);
      newOption.textContent = subject;
      subjectField.appendChild(newOption);
      newSubject.remove();
      selectedSubjects = selectedSubjects.filter(
        (subject) => subject["MateriaId"] !== id,
      );
      console.log(selectedSubjects);
      if (addSubjectBtn.classList.contains("disabled"))
        addSubjectBtn.classList.remove("disabled");
    });
  });

  // Cargando cantidad de docentes activos
  loader.setAttribute("title", "Cargando docentes...");
  document.body.appendChild(loader);
  try {
    const teachersResponse = await fetch(
      `${window.APP_CONFIG.api_url}/teacher/list`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const teachersData = await teachersResponse.json();
    if (!teachersResponse.ok) throw new Error(teachersData.message);
    teachers = [...teachersData];
    const activeTeachers = document.getElementById("active-teachers");
    activeTeachers.textContent = teachers.length;
    teachers.forEach((teacher) => {
      addTeacherCard(teacher);
    });
  } catch (Error) {
    console.log(Error);
    const notification = document.createElement("notification-component");
    notification.setAttribute("type", "error");
    notification.setAttribute("text", Error.message);
    notificationContainer.appendChild(notification);
  } finally {
    loader.remove();
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
    },
  );

  if (subjectsResponse.status !== 200) {
    const subjectErrorNotification = document.createElement(
      "notification-component",
    );
    subjectErrorNotification.setAttribute("type", "error");
    subjectErrorNotification.setAttribute(
      "text",
      "Error al cargar las materias...",
    );
    notificationContainer.appendChild(subjectErrorNotification);
  } else {
    const subjects = await subjectsResponse.json();
    const subjectList = document.getElementById("materia");
    subjectList.firstElementChild.remove();

    subjects.forEach((s) => {
      const subject = document.createElement("option");
      subject.setAttribute("value", s["MateriaId"]);
      subject.textContent = s["Nombre"];
      subjectList.appendChild(subject);
    });
  }

  loader.remove();

  // Guardando docente
  document.getElementById("submit-btn").addEventListener("click", async () => {
    const firstName = firstNameField.value?.trim();
    const lastName = lastNameField.value?.trim();
    const gender = genderField.value;
    const identity = identityField.value?.trim();
    const phone = phoneField.value;
    const phonePrefix = phonePrefixField.value;
    const occupation = ocupationField.value?.trim();
    const hours = hoursField.value;
    const email = emailField.value?.trim();
    const location = locationField.value?.trim();

    loader.setAttribute("title", "Registrando docente...");
    document.body.appendChild(loader);

    try {
      if (!firstName || firstName.length === 0) {
        firstNameField.focus();
        throw new Error("Debes indicar el nombre del docente");
      } else if (!new RegExp(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+$/).test(firstName)) {
        firstNameField.focus();
        throw new Error("El nombre del docente presenta un formato inválido.");
      } else if (!lastName || lastName.length === 0) {
        lastNameField.focus();
        throw new Error("Debes indicar el apellido del docente");
      } else if (!new RegExp(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+$/).test(lastName)) {
        lastName.focus();
        throw new Error(
          "El apellido del docente presenta un formato inválido.",
        );
      } else if (!gender) {
        genderField.focus();
        throw new Error("Debes especificar el género del docente");
      } else if (!identity) {
        identityField.focus();
        throw new Error("Debes especificar la cédula de identidad del docente");
      } else if (
        !new RegExp(/\d{7}|\d{8}/).test(identity) ||
        identity < 100000
      ) {
        identityField.focus();
        throw new Error("Formato de cédula de identidad inválido.");
      } else if (!phonePrefix) {
        phonePrefixField.focus();
        throw new Error("Debes indicar el prefijo telefónico del docente.");
      } else if (!phone) {
        phoneField.focus();
        throw new Error("Debes indicar el teléfono del docente.");
      } else if (
        !new RegExp(/^(0412|0414|0416|0422|0424|0426)-\d{7}$/).test(
          `${phonePrefix}-${phone}`,
        )
      ) {
        phoneField.focus();
        throw new Error("El número de teléfono presenta un formato inválido");
      } else if (!occupation) {
        ocupationField.focus();
        throw new Error("Debes indicar la especialidad del docente");
      } else if (
        !new RegExp(
          /^[a-zA-ZÀ-ÿ\u00f1\u00d1]+(\s?[a-zA-ZÀ-ÿ\u00f1\u00d1\.\-]+)*$/,
        ).test(occupation)
      ) {
        ocupationField.focus();
        throw new Error(
          "La especialidad del docente presenta un formato inválido.",
        );
      } else if (!hours) {
        hoursField.focus();
        throw new Error(
          "Debes indicar las horas académicas semanales que impartirá el docente",
        );
      } else if (!new RegExp(/\d[20-40]/).test(hours)) {
        hoursField.focus();
        throw new Error("Formato de horas académicas semanales inválido.");
      } else if (!email) {
        emailField.focus();
        throw new Error("Debes indicar el correo electrónico del docente.");
      } else if (!new RegExp(/^[^\s@]+@[^\s@]+\.[^\s@]+$/).test(email)) {
        emailField.focus();
        throw new Error("Formato de correo electrónico inválido");
      } else if (!location) {
        locationField.focus();
        throw new Error("Debes indicar la dirección de habitación del docente");
      } else if (
        !new RegExp(
          /^[a-zA-Z0-9À-ÿ\u00f1\u00d1][a-zA-Z0-9À-ÿ\u00f1\u00d1\s\.,#\-\/°\(\)]{4,254}$/,
        ).test(location)
      ) {
        locationField.focus();
        throw new Error("Formato de dirección de habitación inválido.");
      } else if (selectedSubjects.length === 0) {
        subjectField.focus();
        throw new Error(
          "Debes seleccionar al menos una materia que impartirá el docente.",
        );
      }

      const peopleData = {
        Nombre: firstName,
        Apellido: lastName,
        Sexo: gender,
        Cedula: identity,
        Telefono: `${phonePrefix}-${phone}`,
        Ocupacion: occupation,
        Direccion: location,
      };

      console.log(selectedSubjects);

      const registerTeacherResponse = await fetch(
        `${window.APP_CONFIG.api_url}/teacher/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...peopleData,
            Materias: selectedSubjects.map((s) => s["MateriaId"]),
            Email: email,
            Horas: hours,
          }),
        },
      );

      const registerTeacherAnswer = await registerTeacherResponse.json();

      if (!registerTeacherResponse.ok) {
        throw new Error(registerTeacherAnswer.message);
      }

      addTeacherCard({
        DatosPersona: { ...peopleData },
        HorasAcademicas: hours,
        Materias: selectedSubjects,
        DocenteId: registerTeacherAnswer["DocenteId"],
        Usuario: {
          Email: email,
        },
      });

      const teachersCounter = document.getElementById("active-teachers");
      teachersCounter.textContent = parseInt(teachersCounter.textContent) + 1;

      teacherForm.reset();
      subjectsContainer.querySelectorAll("p").forEach((p) => p.remove());
      selectedSubjects.forEach((s) => {
        const subjectOption = document.createElement("option");
        subjectOption.setAttribute("value", s["MateriaId"]);
        subjectOption.textContent = s["Nombre"];
        subjectField.appendChild(subjectOption);
      });

      selectedSubjects = [];

      const notification = document.createElement("notification-component");
      notification.setAttribute("type", "success");
      notification.setAttribute("text", "Docente registrado correctamente");
      notificationContainer.appendChild(notification);
    } catch (Error) {
      console.error(Error);
      const notification = document.createElement("notification-component");
      notification.setAttribute("type", "error");
      notification.setAttribute("text", Error.message);
      notificationContainer.appendChild(notification);
    } finally {
      loader.remove();
    }
  });
});

document.getElementById("BtnBack").addEventListener("click", (event) => {
  event.preventDefault();
  document.body.style.animation = "goodByePage 0.8s forwards";
  console.log(event);

  setTimeout(() => (window.location.href = event.target.href), 1000);
});
