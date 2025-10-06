import sheet from "./adminPanel.styles.js";

class AdminPanelLayout extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: "open"});
    }

    connectedCallback() {
        this.shadowRoot.adoptedStyleSheets = [sheet];
        this.shadowRoot.innerHTML = html`

        `;
    }
}

customElements.define("admin-panel-layout", AdminPanelLayout);