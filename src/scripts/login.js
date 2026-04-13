// Redireccionando si ya se inició sesión
const email = localStorage.getItem("user-email");

if (email) window.location.href = "/app/iniciar-sesion/usuario.html";

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

        localStorage.setItem("user-email", username);

        setTimeout(() => {
          window.location.href = "/app/iniciar-sesion/usuario.html";
        }, 1200);
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

document.getElementById("togglePassword").addEventListener("click", () => {
  const passwordInput = document.getElementById("password");
  passwordInput.setAttribute(
    "type",
    passwordInput.getAttribute("type") === "text" ? "password" : "text",
  );
});
