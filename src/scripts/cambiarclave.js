let code = 123456;
let emailVal = "";

const sendEmail = async () => {
  const notificationsContainer = document.getElementById("notifications");
  const loader = document.createElement("loader-spinner");
  try {
    loader.setAttribute("title", "Procesando...");
    document.body.appendChild(loader);
    const otpSendResponse = await fetch(
      `${window.APP_CONFIG.api_url}/otp/send/${emailVal}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const otpCode = await otpSendResponse.json();

    if (!otpSendResponse.ok) throw Error(otpCode.message);

    code = otpCode.otp;

    const notification = document.createElement("notification-component");
    notification.setAttribute("type", "success");
    notification.setAttribute(
      "text",
      "Código de verificación enviado al correo electrónico",
    );
    notificationsContainer.appendChild(notification);
  } catch (Error) {
    console.error(Error.stack);
    const notification = document.createElement("notification-component");
    notification.setAttribute("type", "error");
    notification.setAttribute("text", Error.message);
    notificationsContainer.appendChild(notification);
  } finally {
    loader.remove();
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const otpCodeField = document.getElementById("otp-code");

  // -- Envio de clave otp al correo electrónico
  const loader = document.createElement("loader-spinner");
  const notificationsContainer = document.getElementById("notifications");
  const sendEmailBtn = document.getElementById("SendEmailBtn");
  const verifyCodeBtn = document.getElementById("VerifyCodeBtn");
  const emailField = document.getElementById("email");

  // --- Referencias al DOM ---
  const steps = {
    email: document.getElementById("step-email"),
    code: document.getElementById("step-code"),
    password: document.getElementById("step-password"),
    success: document.getElementById("step-success"),
  };

  const forms = {
    email: document.getElementById("form-email"),
    code: document.getElementById("form-code"),
    password: document.getElementById("form-password"),
  };

  const inputs = {
    email: document.getElementById("email"),
    displayEmail: document.getElementById("user-email-display"),
    newPass: document.getElementById("new-pass"),
    confirmPass: document.getElementById("confirm-pass"),
  };

  const togglePassIcons = document.querySelectorAll(".toggle-pass");

  // Historial de navegación simple para el botón "Volver"
  let historyStack = ["email"];

  // --- Funciones de Navegación ---

  function showStep(stepName) {
    // Ocultar todos los pasos
    Object.values(steps).forEach((step) => step.classList.add("hidden"));

    // Mostrar el paso actual
    steps[stepName].classList.remove("hidden");

    // Reiniciar la animación forzando reflow (hack común en CSS animations)
    void steps[stepName].offsetWidth;
  }

  function nextStep(current, next) {
    historyStack.push(next);
    showStep(next);
  }

  function prevStep() {
    if (historyStack.length > 1) {
      historyStack.pop(); // Sacar el actual
      const previous = historyStack[historyStack.length - 1]; // Ver el anterior
      showStep(previous);
    }
  }

  // --- Event Listeners ---

  // 1. Enviar Email
  forms.email.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      emailVal = inputs.email.value.trim();
      if (emailVal.length === 0)
        throw new Error("Debes escribir tu correo electrónico");
      else if (
        !new RegExp(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/).test(
          emailVal,
        )
      )
        throw new Error(
          "¡Debes introducir una dirección de correo electrónico válida!",
        );

      // Enviando código al correo electrónico
      await sendEmail();

      inputs.displayEmail.textContent = emailVal;
      inputs.email.value = "";
      nextStep("email", "code");
      otpCodeField.focus();
    } catch (Error) {
      console.error(Error.stack);
      const notification = document.createElement("notification-component");
      notification.setAttribute("type", "error");
      notification.setAttribute("text", Error.message);
      notificationsContainer.appendChild(notification);
    } finally {
      loader.remove();
    }
  });

  document.getElementById("NewOtpCode").addEventListener("click", async (e) => {
    e.preventDefault();
    await sendEmail();
  });

  // 2. Verificar Código
  forms.code.addEventListener("submit", (e) => {
    e.preventDefault();
    try {
      const codeVal = otpCodeField.value;

      if (codeVal.length === 0)
        throw new Error(
          "Debes introducir el código de verificación enviado a tu correo electrónico",
        );
      else if (!new RegExp(/^\d{6}$/).test(codeVal))
        throw new Error("Debes introducir un código numérico de 6 dígitos");
      else if (codeVal !== code) {
        forms.code.value = "";
        throw new Error("Código de verificación inválido");
      }
      nextStep("code", "password");
    } catch (Error) {
      forms.code.focus();
      const notification = document.createElement("notification-component");
      notification.setAttribute("type", "error");
      notification.setAttribute("text", Error.message);
      notificationsContainer.appendChild(notification);
    }
  });

  // 3. Cambiar Contraseña
  forms.password.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const p1 = inputs.newPass.value.trim();
      const p2 = inputs.confirmPass.value.trim();

      if (p1.length === 0)
        throw new Error('Debes rellenar el campo "contraseña"');
      else if (p2.length === 0)
        throw new Error(
          "Debes volver a introducir la misma contraseña a modo de confirmación",
        );
      else if (p1 !== p2)
        throw new Error("Las contraseñas introducidas no coinciden");
      else if (
        !new RegExp(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&._-])[A-Za-z\d$@$!%*?&._-]{8,}$/,
        ).test(p1)
      )
        throw new Error(
          "La contraseña introducida presenta un formato inválido. Debe contener al menos 1 letra minúscula, 1 letrea mayúscula y 1 símbolo",
        );

      document.body.appendChild(loader);
      const changePasswordResponse = await fetch(
        `${window.APP_CONFIG.api_url}/user/modify/password`,
        {
          method: "PATCH",
          body: JSON.stringify({
            Password: p1,
            RPassword: p2,
            Email: emailVal,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!changePasswordResponse.ok) {
        const changePasswordMessage = await changePasswordResponse.json();
        throw new Error(changePasswordMessage.message);
      }

      nextStep("password", "success");
    } catch (Error) {
      inputs.newPass.focus();
      console.error(Error.stack);
      const notification = document.createElement("notification-component");
      notification.setAttribute("type", "error");
      notification.setAttribute("text", Error.message);
      notificationsContainer.appendChild(notification);
    } finally {
      loader?.remove();
    }
  });

  // Toggle Visibilidad Password
  togglePassIcons.forEach((iconWrapper) => {
    iconWrapper.addEventListener("click", () => {
      const input = iconWrapper.previousElementSibling; // El input está justo antes del icono
      const type =
        input.getAttribute("type") === "password" ? "text" : "password";
      input.setAttribute("type", type);

      // Opcional: Cambiar la opacidad o el icono para indicar estado
      iconWrapper.style.opacity = type === "text" ? "1" : "0.6";
    });
  });

  // Botón Final (Login)
  document.getElementById("btn-login").addEventListener("click", () => {
    window.location.href = "/app/iniciar-sesion.html";
  });

  const nodes = document.querySelectorAll(".dot");

  otpCodeField.addEventListener("keyup", (e) => {
    const otpCode = otpCodeField.value;
    if (e.key === "Backspace" && otpCode.length >= 0) {
      const node = Array.from(nodes).findLast((n) =>
        n.classList.contains("active"),
      );
      if (node) node.classList.remove("active");
    } else if (otpCode.length <= 6) {
      nodes[otpCode.length - 1].classList.add("active");
    }
  });
});
