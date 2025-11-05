class LoaderComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  static get observedAttribute() {
    return ["title"];
  }

  connectedCallback() {
    const title = this.getAttribute("title") || "Cargando...";

    this.shadowRoot.innerHTML = `
      <style>
        .loader {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: #00000095;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
          gap: 7px;
        }

        .loader__spinner {
          width: 128px;
          height: 128px;
          border: 5px solid #fff;
          border-radius: 50%;
          display: inline-block;
          box-sizing: border-box;
          position: relative;
          animation: pulse 1s linear infinite;
        }

        .loader__spinner:after {
          content: "";
          position: absolute;
          width: 128px;
          height: 128px;
          border: 5px solid #fff;
          border-radius: 50%;
          display: inline-block;
          box-sizing: border-box;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          animation: scaleUp 1s linear infinite;
        }

        .loader__title {
            font-size: clamp(12px, 2vw + 1rem, 2rem);
            color: #fff;
            font-family: var(--tipography);
            font-weight: bold;
            text-shadow: 0 0 4px #333333af;
            margin: 0;
        }

        @keyframes scaleUp {
          0% {
            transform: translate(-50%, -50%) scale(0);
          }
          60%,
          100% {
            transform: translate(-50%, -50%) scale(1);
          }
        }
        @keyframes pulse {
          0%,
          60%,
          100% {
            transform: scale(1);
          }
          80% {
            transform: scale(1.2);
          }
        }
      </style>

      <div class="loader">
        <span class="loader__spinner"></span>
        <p class="loader__title">${title}</p>
      </div>
    `;
  }
}

customElements.define("loader-spinner", LoaderComponent);
