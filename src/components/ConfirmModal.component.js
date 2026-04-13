class ConfirmModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            <style>
                .overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                    z-index: 1000;
                }

                .overlay.active {
                    opacity: 1;
                    visibility: visible;
                }

                .modal {
                    background: rgba(255, 255, 255, 0.85);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
                    border-radius: 16px;
                    padding: 2rem;
                    text-align: center;
                    max-width: 400px;
                    width: 90%;
                    transform: scale(0.9);
                    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }

                .overlay.active .modal {
                    transform: scale(1);
                }

                h3 {
                    color: #202124;
                    margin-bottom: 1rem;
                    font-size: 1.5rem;
                }

                p {
                    color: #5F6368;
                    margin-bottom: 2rem;
                    font-size: 1rem;
                    line-height: 1.5;
                }

                .actions {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                }

                button {
                    padding: 0.7rem 1.5rem;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                }

                .btn-cancel {
                    background: transparent;
                    color: #5F6368;
                    border: 1px solid #E8EAED;
                }

                .btn-cancel:hover {
                    background: #f1f3f4;
                }

                .btn-confirm {
                    background: #2B75F3;
                    color: white;
                    box-shadow: 0 4px 10px rgba(43, 117, 243, 0.3);
                }

                .btn-confirm:hover {
                    background: #1a5bca;
                    transform: translateY(-2px);
                }
            </style>
            
            <div class="overlay" id="overlay">
                <div class="modal">
                    <h3>¿Cerrar Sesión?</h3>
                    <p>¿Estás seguro de que deseas regresar a la pantalla de inicio de sesión?</p>
                    <div class="actions">
                        <button class="btn-cancel" id="btn-cancel">Cancelar</button>
                        <button class="btn-confirm" id="btn-confirm">Sí, salir</button>
                    </div>
                </div>
            </div>
        `;

        // Event Listeners internos del Shadow DOM
        const overlay = this.shadowRoot.getElementById('overlay');
        this.shadowRoot.getElementById('btn-cancel').addEventListener('click', () => this.close());
        this.shadowRoot.getElementById('btn-confirm').addEventListener('click', () => {
            // Disparamos un evento personalizado para que main.js ejecute la animación de salida
            this.dispatchEvent(new CustomEvent('confirm-logout', { bubbles: true, composed: true }));
        });

        window.addEventListener("scroll", (e) => {
            overlay.style.top = `${window.scrollY}px`;
        });
    }

    open() {
        this.shadowRoot.getElementById('overlay').classList.add('active');
        document.body.style.overflow = "hidden";
    }

    close() {
        this.shadowRoot.getElementById('overlay').classList.remove('active');
        document.body.style.overflowY = "auto";
    }
}
customElements.define('confirm-modal', ConfirmModal);