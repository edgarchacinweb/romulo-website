class NotificationComponent extends HTMLElement {
  static observedAttributes = ["text", "type"];

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    const text = this.getAttribute("text") || "";
    const type = this.getAttribute("type").toLowerCase() || "success";

    let color = "";
    if (type === "error") color = "#97051D";
    else if (type === "warning") color = "#E6CC00";
    else color = "#58BB43";

    this.shadowRoot.innerHTML = `
      <style>
        .notification {
          display: flex;
          align-items: center;
          width: 90vw;
          max-width: 440px;
          height: 60px;
          margin: 5px auto;
          border-radius: 16px;
          background-color: ${color}95;
          border: 1px solid ${color};
          padding: 5px 1rem;
          cursor: pointer;
          box-shadow: 0 2px 3px 1px ${color}75;
          animation: appear 600ms ease;
        }

        .notification__text {
          color: var(--light-color);
          font-weight: bold;
        }

        .notification--destroy {
          animation: dissapear 600ms ease;
        }

        @keyframes appear {
          0% {
            opacity: 0%;
            transform: scale(.1);
          }

          100% {
            opacity: 100%;
            transform: scale(1);
          }
        }

        @keyframes dissapear {
          0% {
            opacity: 100%;
            transform: scale(1);
          }

          100% {
            opacity: 0%;
            transform: scale(.1);
          }
        }
      </style>
      <article class="notification">
        <span class="notification__text">${text}</span>
      </article>
    `;

    const notification = this.shadowRoot.querySelector(".notification");

    const removeElement = (element) => {
      if (!element.classList.contains("notification--destroy")) {
        element.classList.add("notification--destroy");

        setTimeout(() => this.remove(), 540);
      }
    };

    notification.addEventListener("click", () => {
      removeElement(notification);
    });

    setTimeout(() => {
      removeElement(notification);
    }, 3500);
  }
}

customElements.define("notification-component", NotificationComponent);
