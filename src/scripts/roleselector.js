document.addEventListener('DOMContentLoaded', () => {
    const btnLogout = document.getElementById('btn-logout');
    const modal = document.getElementById('logout-modal');

    // Abrir Modal
    btnLogout.addEventListener('click', () => {
        modal.open();
    });

    // Escuchar el evento personalizado de confirmación desde el Web Component
    modal.addEventListener('confirm-logout', () => {
        modal.close();

        // Agregar la clase de animación de salida al body
        document.body.classList.remove('page-enter');
        document.body.classList.add('page-exit');

        // Esperar a que termine la animación para redirigir
        setTimeout(() => {
            window.location.href = '/iniciar-sesion';
        }, 500); // 500ms coincide con la duración de la animación css
    });
});