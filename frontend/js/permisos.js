// frontend/js/permisos.js

const MATRIZ_PERMISOS = {
    administrador: ['dashboard', 'relevadores', 'usuarios', 'configuracion', 'reportes'],
    operador: ['dashboard', 'relevadores', 'reportes'],
    relevador: ['dashboard', 'relevadores'],
    consulta: ['dashboard'] // Solo lectura
};

/**
 * Verifica si un rol tiene permiso para acceder a una sección o acción específica
 * @param {string} rolUsuario - Rol actual obtenido de localStorage
 * @param {string} seccion - Módulo o acción a validar
 * @returns {boolean}
 */
export function tienePermiso(rolUsuario, seccion) {
    const rolNormalizado = rolUsuario ? rolUsuario.trim().toLowerCase() : '';
    const permisosRol = MATRIZ_PERMISOS[rolNormalizado] || [];
    return permisosRol.includes(seccion);
}