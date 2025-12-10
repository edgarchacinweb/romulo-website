import authorize from "./auth.js";

authorize("administrador");

document.addEventListener("DOMContentLoaded", async () => {
  // Token
  const token = localStorage.getItem("auth");

  // Elementos
  const notificationsContainer = document.getElementById("notifications");
  const firstNameEntry = document.getElementById("nombre");
  const lastNameEntry = document.getElementById("apellido");
  const identityEntry = document.getElementById("cedula");
  const genderEntry = document.getElementById("sexo");
  const emailEntry = document.getElementById("email");
  const submitBtn = document.getElementById("btn-submit");
  const repForm = document.getElementById("repForm");
  const repsList = document.getElementById("repsList");
  const loader = document.createElement("loader-spinner");
  const totalCount = document.getElementById("totalCount");

  // Cache
  let parents = [];

  // Iconos
  const icons = {
    trash: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
    mail: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`,
    phone: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`,
    map: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
    briefcase: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`,
  };

  // Cargar todos los usuarios con el rol "representante" creados
  document.body.appendChild(loader);
  try {
    const parentsResponse = await fetch(
      `${window.APP_CONFIG.api_url}/user/filter`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          Rol: "representante",
        }),
      }
    );

    const parentsData = await parentsResponse.json();
    if (parentsResponse.status !== 200) throw new Error(parentsData.message);
    parents = parentsData;

    parentsData.forEach((parent) => {
      const { DatosPersona } = parent;
      const card = document.createElement("article");
      card.className = "rep-card";
      card.innerHTML = `
                <div class="rep-top">
                    <h3>${DatosPersona.Nombre} ${DatosPersona.Apellido}</h3>
                    <button class="btn-delete" onclick="deleteRep(${
                      parent.UsuarioId
                    })" title="Eliminar">
                        ${icons.trash}
                    </button>
                </div>
                <span class="cedula-text">Cédula: V-${
                  DatosPersona.Cedula
                }</span>

                <div class="rep-details">
                    <div class="detail-item">
                        <span class="icon-blue">${icons.mail}</span>
                        ${parent.Email}
                    </div>
                    <div class="detail-item">
                        <span class="icon-green">${icons.phone}</span>
                        ${
                          !DatosPersona.Telefono
                            ? "No asignado"
                            : DatosPersona.Telefono
                        }
                    </div>
                    <div class="detail-item">
                        <span class="icon-orange">${icons.map}</span>
                        ${
                          !DatosPersona.Direccion
                            ? "No asignado"
                            : DatosPersona.Direccion
                        }
                    </div>
                    <div class="detail-item">
                        <span class="icon-purple">${icons.briefcase}</span>
                        ${
                          !DatosPersona.Ocupacion
                            ? "No asignado"
                            : DatosPersona.Ocupacion
                        }
                    </div>
                </div>

                <div class="rep-footer">
                    Registrado: ${new Date(
                      parent.FechaCreacion
                    ).toLocaleDateString("es-VE")}
                </div>
            `;

      repsList.appendChild(card);
    });
    totalCount.textContent = parentsData.length;
  } catch (error) {
    console.log(error);
    const loadNotification = document.createElement("notification-component");
    loadNotification.setAttribute("type", "error");
    loadNotification.setAttribute("text", error);
  } finally {
    loader.remove();
  }

  submitBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const firstName = firstNameEntry.value;
    const lastName = lastNameEntry.value;
    const identity = identityEntry.value;
    const gender = genderEntry.value;
    const email = emailEntry.value;
    const notification = document.createElement("notification-component");

    try {
      // Registro de datos
      document.body.appendChild(loader);
      //   console.log("asadadaea");
      if (!firstName || !lastName || !identity || !email)
        throw new Error("Debes rellenar todos los campos del formulario");

      const dataResponse = await fetch(
        `${window.APP_CONFIG.api_url}/people/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            Nombre: firstName,
            Apellido: lastName,
            Sexo: gender,
            Cedula: identity,
          }),
        }
      );

      const peopleData = await dataResponse.json();
      console.log(peopleData);

      if (dataResponse.status !== 201) throw new Error(peopleData.message);

      const peopleId = peopleData.id;

      const userResponse = await fetch(
        `${window.APP_CONFIG.api_url}/user/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            Email: email,
            Rol: "representante",
            Clave: `V#${identity}`,
            DatosPersonaId: peopleId,
          }),
        }
      );

      const userData = await userResponse.json();

      if (userResponse.status !== 201) throw new Error(userData);

      const card = document.createElement("article");
      card.className = "rep-card";

      // Construcción del HTML de la tarjeta
      card.innerHTML = `
                <div class="rep-top">
                    <h3>${firstName} ${lastName}</h3>
                    <button class="btn-delete" onclick="deleteRep(${
                      userData.id
                    })" title="Eliminar">
                        ${icons.trash}
                    </button>
                </div>
                <span class="cedula-text">Cédula: V-${identity}</span>

                <div class="rep-details">
                    <div class="detail-item">
                        <span class="icon-blue">${icons.mail}</span>
                        ${email}
                    </div>
                    <div class="detail-item">
                        <span class="icon-green">${icons.phone}</span>
                        No asignado
                    </div>
                    <div class="detail-item">
                        <span class="icon-orange">${icons.map}</span>
                        No asignado
                    </div>
                    <div class="detail-item">
                        <span class="icon-purple">${icons.briefcase}</span>
                        No asignado
                    </div>
                </div>

                <div class="rep-footer">
                    Registrado: ${new Date().toLocaleDateString("es-VE")}
                </div>
            `;

      repsList.insertBefore(card, document.querySelector(".rep-card"));
      notification.setAttribute("type", "success");
      notification.setAttribute(
        "text",
        "Representante registrado correctamente"
      );
      parents.push({
        DatosPersona: {
          Apellido: lastName,
          Cedula: identity,
          Nombre: firstName,
          Sexo: gender,
        },
        Email: email,
        Rol: "representante",
      });
      totalCount.textContent = parents.length;
    } catch (error) {
      console.error(error);
      notification.setAttribute("type", "error");
      notification.setAttribute("text", error);
    } finally {
      loader.remove();
      notificationsContainer.appendChild(notification);
      repForm.reset();
    }
  });
});
