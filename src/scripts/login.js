// Redireccionando si ya se inició sesión
const role = localStorage.getItem("role");

if (role) {
  if (role === "administrador") {
    window.location.href = "/app/admin/dashboard/";
  } else if (role === "representante") {
    window.location.href = "/app/representante/inicio/";
  } else if (role === "docente") {
    window.location.href = "/app/docente/inicio/";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const loginBtn = document.getElementById("loginBtn");
  const notificationContainer = document.getElementById("notifications");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");

  loginBtn.addEventListener("click", (e) => {
    e.preventDefault();

    const username = usernameInput.value;
    const password = passwordInput.value;

    (async () => {
      // Iniciando sesión, obteniendo ID del usuario
      if (username.trim().length > 0 && password.trim().length > 0) {
        await customElements.whenDefined("loader-spinner");
        const loader = document.createElement("loader-spinner");
        loader.title = "Iniciando sesión...";
        document.body.appendChild(loader);
        const response = await fetch(
          `${window.APP_CONFIG.api_url}/user/login`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              Email: username,
              Clave: password,
            }),
          },
        );

        const data = await response.json();

        passwordInput.value = "";
        loader.remove();

        const notification = document.createElement("notification-component");
        notification.setAttribute(
          "text",
          response.status == 200 ? "Credenciales correctas" : data.message,
        );
        notification.setAttribute(
          "type",
          response.status >= 400 ? "error" : "success",
        );
        notificationContainer.appendChild(notification);

        if (response.status >= 400) return;

        // Obteniendo el token de autenticación
        const responseToken = await fetch(
          `${window.APP_CONFIG.api_url}/user/token/${data.id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (responseToken.status != 200) {
          const tokenErrorNotification = document.createElement(
            "notification-component",
          );
          tokenErrorNotification.setAttribute(
            "text",
            "Error al obtener los datos del usuario",
          );
          tokenErrorNotification.setAttribute("type", "error");
          notificationContainer.appendChild(tokenErrorNotification);
        } else {
          const { token, role } = await responseToken.json();

          // Guardando el token de autenticación y el rol del usuario
          localStorage.setItem("auth", token);
          localStorage.setItem("role", role);

          // Redirigiendo a la ventana correspondiente
          let url = "";
          if (role === "administrador") url = "/app/admin/dashboard/";
          else if (role === "representante") url = "/app/representante/inicio/";
          else if (role === "docente") url = "/app/docente/inicio/";
          else url = "/";

          setTimeout(() => {
            window.location.href = url;
          }, 1500);
        }
      } else {
        let warningText = "";

        if (username.trim().length === 0)
          warningText = "Rellena el campo del nombre de usuario";
        else if (password.trim().length === 0)
          warningText = "Rellena el campo de la contraseña";

        await customElements.whenDefined("notification-component");
        const warningNotification = document.createElement(
          "notification-component",
        );
        warningNotification.setAttribute("type", "warning");
        warningNotification.setAttribute("text", warningText);

        notificationContainer.appendChild(warningNotification);
      }
    })();
  });
});
