import styles from "./navbar.styles.js";

class NavbarComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: "open"});
    }

    connectedCallback() {
        this.shadowRoot.adoptedStyleSheets = [styles];
        this.shadowRoot.innerHTML = `
            <nav>
            </nav>
        `;
    }
}

customElements.define("navbar-component", NavbarComponent);
