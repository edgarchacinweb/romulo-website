import authorize from "./auth.js";

authorize("administrador");
const token = localStorage.getItem("auth");

const listBackups = async () => {
  const backupTable = document.getElementById("historialBody");

  const loader = document.createElement("loader-spinner");
  const notification = document.createElement("notification-component");
  const notificationsContainer = document.getElementById("notifications");
  loader.setAttribute("title", "Cargando lista de respaldos de BBDD...");
  document.body.appendChild(loader);

  const response = await fetch(`${window.APP_CONFIG.api_url}/backup/list`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 404) {
    notification.setAttribute("type", "warning");
    notification.setAttribute(
      "text",
      "No hay respaldos de la base de datos que cargar"
    );
  } else if (response.status !== 200) {
    notification.setAttribute("type", "error");
    notification.setAttribute(
      "text",
      "Hubo un error al intentar descargar la lista de respaldos"
    );
  } else {
    const data = await response.json();
    data.forEach((backupFile) => {
      console.log(backupFile);
      const card = document.createElement("tr");
      card.innerHTML = `
        <td>${backupFile["Fecha"]} ${backupFile["Hora"]}</td>
        <td>Manual</td>
        <td>${(backupFile["Peso"] / 1000 / 100).toFixed(2)} MB</td>
        <td>
          <a
            href="${window.APP_CONFIG.api_url}/backup/download/${
        backupFile["Archivo"]
      }"
            target="_blank"
            class="action-link"
            download="${backupFile["Archivo"]}"
            >Descargar</a
          >
        </td>
        <td>
          <button
            class="delete-btn delete-row-btn"
            data-id="${backupFile["Archivo"]}"
          >
            Eliminar
          </button>
        </td>
      `;

      backupTable.appendChild(card);

      // Eliminar respaldo
      card.querySelector("button").addEventListener("click", () => {
        const loader = document.createElement("loader-spinner");
        loader.setAttribute("title", "Eliminando respaldo");
        document.body.appendChild(loader);
        const removeBbddBackup = document.createElement(
          "notification-component"
        );
        fetch(
          `${window.APP_CONFIG.api_url}/backup/delete/${backupFile["Archivo"]}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
          .then((response) => {
            if (response.status !== 200) {
              throw "Error al eliminar el respaldo de la BBDD";
            }

            removeBbddBackup.setAttribute("type", "success");
            removeBbddBackup.setAttribute(
              "text",
              "Respaldo de la BBDD eliminado correctamente"
            );
            backupTable.innerHTML = "";
            listBackups().then();
          })
          .catch((err) => {
            removeBbddBackup.setAttribute("type", "error");
            removeBbddBackup.setAttribute("text", err);
          })
          .finally(() => {
            loader.remove();
            notificationsContainer.appendChild(removeBbddBackup);
          });
      });
    });
    loader.remove();
    return;
  }

  notificationsContainer.appendChild(notification);
};

document.addEventListener("DOMContentLoaded", () => {
  const notificationsContainer = document.getElementById("notifications");
  const loader = document.createElement("loader-spinner");
  listBackups().then();

  // Generar respaldo
  document.getElementById("generarRespaldo").addEventListener("click", () => {
    loader.setAttribute("title", "Realizando respaldo de la BBDD");
    document.body.appendChild(loader);
    const generateBackupNotification = document.createElement(
      "notification-component"
    );

    fetch(`${window.APP_CONFIG.api_url}/backup/database`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (response.status !== 200) {
          throw "Hubo un error al intentar generar el respaldo de la BBDD";
        }

        generateBackupNotification.setAttribute("type", "success");
        generateBackupNotification.setAttribute(
          "text",
          "Respaldo de BBDD creado correctamente"
        );
        document.getElementById("historialBody").innerHTML = "";
        listBackups().then();
      })
      .catch((error) => {
        generateBackupNotification.setAttribute("type", "error");
        generateBackupNotification.setAttribute("text", error);
      })
      .finally(() => {
        notificationsContainer.appendChild(generateBackupNotification);
        loader.remove();
      });
  });
});
