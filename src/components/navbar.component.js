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
                <section class="navigation__options">
                </section>
                <section class="navigation__account">
                    <a href="./app/iniciar-sesion.html" class="navigation__link">
                        <img src="./src/assets/icons/login.svg" class="navigation__icon" />
                        <span class="navigation__text">Iniciar Sesión</span>
                    </a>
                </section>
            </div>
            <img src="/src/assets/icons/menu.svg" class="navigation__menu" />
        </nav>
        `;

    const menuBtn = this.shadowRoot.querySelector(".navigation__menu");
    const navigation = this.shadowRoot.querySelector(".navigation");

    menuBtn.addEventListener("click", () =>
      navigation.classList.toggle("navigation--active"),
    );
    window.addEventListener("resize", () =>
      window.innerWidth > 790
        ? navigation.classList.remove("navigation--active")
        : "",
    );
  }
}

customElements.define("navbar-component", NavbarComponent);
