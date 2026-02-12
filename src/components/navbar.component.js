import styles from "./navbar.styles.js";

class NavbarComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.shadowRoot.adoptedStyleSheets = [styles];
    this.shadowRoot.innerHTML = `
    <nav class="navigation">
        <section class="navigation__logo">
            <img src="./src/assets/images/romulo.png" />
        </section>
        <div class="navigation__container">
            <section class="navigation__account">
                <a href="./app/inscripcion-selector.html" class="navigation__link">
                    
                </a>
                <a href="./app/iniciar-sesion.html" class="navigation__link">
                    <img src="./src/assets/icons/login.svg" class="navigation__icon" />
                    <span class="navigation__text">Iniciar Sesión</span>
                </a>
            </section>
        </div>
        </nav>
    `;

    
  }
}

customElements.define("navbar-component", NavbarComponent);