class NotificationContainerComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        div {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          min-height: 100vw;
          display: flex;
          flex-direction: column;
          align-items: center;
          pointer-events: none;
        }

        .notifications {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
        }
      </style>
      <div>
        <section class="notifications" id="notificationContainer">
          <slot></slot>
        </section>
      </div>
    `;
  }
}

customElements.define(
  "notifications-container",
  NotificationContainerComponent
);
