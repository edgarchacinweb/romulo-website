class RoleCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        const role = this.getAttribute('role-type');
        const name = this.getAttribute('name');
        const cedula = this.getAttribute('cedula');
        const phone = this.getAttribute('phone');
        const email = this.getAttribute('email');
        const students = this.getAttribute('students');

        // Parsear JSON de arrays
        const years = JSON.parse(this.getAttribute('years') || '[]');
        const subjects = JSON.parse(this.getAttribute('subjects') || '[]');

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    max-width: 400px;
                }
                .card {
                    background: white;
                    border-radius: 12px;
                    padding: 2.5rem 2rem;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
                    position: relative;
                    transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                    cursor: pointer;
                    overflow: hidden;
                    border: 1px solid #f0f0f0;
                    
                    flex: 1;             
                    display: flex;       
                    flex-direction: column; 
                    height: 100%;        
                }
                
                /* Línea azul superior dinámica */
                .card::before {
                    content: '';
                    position: absolute;
                    top: 10px;
                    left: 2rem;
                    height: 4px;
                    width: 40px;
                    background: #2B75F3;
                    border-radius: 4px;
                    transition: all 0.4s ease;
                }

                .card:hover {
                    box-shadow: 0 15px 35px rgba(43, 117, 243, 0.1);
                    transform: translateY(-5px);
                }

                .card:hover::before {
                    width: calc(100% - 4rem);
                }

                .icon-container {
                    background: #2B75F3;
                    width: 50px;
                    height: 50px;
                    padding: 20px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1.5rem;
                    box-shadow: 0 4px 10px rgba(43, 117, 243, 0.3);
                }

                .badge {
                    display: inline-block;
                    background: #2B75F3;
                    color: white;
                    padding: 0.3rem 1rem;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: bold;
                    margin-bottom: 1.5rem;
                    width: auto;
                }

                .name {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #202124;
                    margin-bottom: 1.5rem;
                    border-left: 2px solid #E8EAED;
                    padding-left: 10px;
                }

                .info-grid {
                    display: grid;
                    grid-template-columns: 80px 1fr;
                    gap: 0.8rem;
                    font-size: 0.9rem;
                    color: #5F6368;
                    margin-bottom: 1.5rem;
                    align-items: center;
                }
                
                .info-grid span:nth-child(even) {
                    color: #202124;
                }

                .tags-section {
                    margin-top: auto;
                    border-top: 1px solid #E8EAED;
                    padding-top: 1.5rem;
                }

                .tags-title {
                    font-size: 0.8rem;
                    color: #5F6368;
                    margin-bottom: 0.8rem;
                }

                .tags-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }

                .tag {
                    background: #E8F0FE;
                    color: #2B75F3;
                    padding: 0.3rem 0.8rem;
                    border-radius: 4px;
                    font-size: 0.8rem;
                    font-weight: 500;
                }

                .students-count {
                    font-weight: bold;
                    color: #2B75F3 !important;
                    font-size: 1rem;
                }

                .chevron {
                    position: absolute;
                    bottom: 2rem;
                    right: 2rem;
                    opacity: 0;
                    transform: translateX(-10px);
                    transition: all 0.3s ease;
                    color: #2B75F3;
                }

                .card:hover .chevron {
                    opacity: 1;
                    transform: translateX(0);
                }

            </style>
            <div class="card">
                <div class="icon-container">
                    <slot name="icon"></slot>
                </div>
                <div>
                    <div class="badge">${role}</div>
                </div>
                <div class="name">${name}</div>
                
                <div class="info-grid">
                    <span>Cédula:</span> <span>${cedula}</span>
                    <span>Teléfono:</span> <span>${phone}</span>
                    <span>Email:</span> <span>${email}</span>
                    ${students ? `<span>Estudiantes:</span> <span class="students-count">${students}</span>` : ''}
                </div>

                ${years.length > 0 || subjects.length > 0 ? `
                    <div class="tags-section">
                        ${years.length > 0 ? `
                            <div class="tags-title">Años Académicos:</div>
                            <div class="tags-container">
                                ${years.map(y => `<span class="tag">${y}</span>`).join('')}
                            </div>
                        ` : ''}
                        ${subjects.length > 0 ? `
                            <div class="tags-title">Materias:</div>
                            <div class="tags-container">
                                ${subjects.map(s => `<span class="tag">${s}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                ` : ''}

                <div class="chevron">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </div>
            </div>
        `;
    }
}
customElements.define('role-card', RoleCard);