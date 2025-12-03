class NotificationContainerComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        .notifications {
          position: absolute;
          top: 0;
          left: 0;
          width: 100vw;
          display: flex;
          flex-direction: column;
          gap: 5px;
          align-items: center;
        }
      </style>
      <section class="notifications" id="notificationContainer">
        <slot></slot>
      </section>
    `;
  }
}

customElements.define(
  "notifications-container",
  NotificationContainerComponent
);
