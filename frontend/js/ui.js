/**ui.js 
 * Muestra una notificación visual en la esquina superior derecha de la pantalla
 * @param {string} mensaje - El texto a mostrar
 * @param {string} tipo - 'success' (verde), 'error'/'danger' (rojo) o 'info'/'warning' (amarillo)
 */
export function mostrarNotificacion(mensaje, tipo = 'success') {
    const alertaVieja = document.getElementById('alerta-flotante-app');
    if (alertaVieja) alertaVieja.remove();

    // Determinar color e ícono según el tipo de notificación
    let colorBg = 'bg-success';
    let icono = 'bi-check-circle-fill';

    if (tipo === 'error' || tipo === 'danger') {
        colorBg = 'bg-danger';
        icono = 'bi-exclamation-triangle-fill';
    } else if (tipo === 'info' || tipo === 'warning') {
        colorBg = 'bg-warning text-dark';
        icono = 'bi-info-circle-fill';
    }

    const alertaHtml = `
        <div id="alerta-flotante-app" class="animate__animated animate__fadeInRight" style="position: fixed; top: 20px; right: 20px; z-index: 9999;">
            <div class="toast show align-items-center text-white ${colorBg} border-0 shadow-lg" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body d-flex align-items-center gap-2">
                        <i class="bi ${icono} fs-5"></i>
                        <span>${mensaje}</span>
                    </div>
                    <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close" onclick="document.getElementById('alerta-flotante-app').remove()"></button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', alertaHtml);

    setTimeout(() => {
        const alerta = document.getElementById('alerta-flotante-app');
        if (alerta) {
            alerta.classList.replace('animate__fadeInRight', 'animate__fadeOutRight');
            setTimeout(() => alerta.remove(), 500);
        }
    }, 4000);
}

// =========================================================================
// 📱 INTERACCIONES GLOBALES DE LA INTERFAZ MÓVIL
// =========================================================================

// Cierra el menú móvil automáticamente al hacer clic en un enlace de navegación
document.addEventListener('click', function (event) {
    const enlaceNav = event.target.closest('#sidebar-mobile .nav-link');
    if (!enlaceNav) return;

    const menuMobile = document.getElementById('sidebar-mobile');
    if (!menuMobile) return;

    const contenidoMenu = menuMobile.querySelector('.navbar-collapse');
    const botonHamburguesa = menuMobile.querySelector('.navbar-toggler');

    if (contenidoMenu && contenidoMenu.classList.contains('show')) {
        if (typeof bootstrap !== 'undefined' && bootstrap.Collapse) {
            const collapseInstance = bootstrap.Collapse.getInstance(contenidoMenu);
            if (collapseInstance) {
                collapseInstance.hide();
                return;
            }
        }
        contenidoMenu.classList.remove('show');
        if (botonHamburguesa) {
            botonHamburguesa.classList.add('collapsed');
            botonHamburguesa.setAttribute('aria-expanded', 'false');
        }
    }
});