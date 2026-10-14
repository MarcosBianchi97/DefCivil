/**
 * Función global y centralizada para cargar vistas HTML de forma dinámica
 * en el contenedor principal del index.html
 */
export async function cargarVistaDinamica(rutaHtml, callback) {
    try {
        // Asegurate de que esta clase coincida con tu HTML (en tus capturas dice .main-content-wrapper)
        const contenedor = document.querySelector('.content-principal') || document.querySelector('.main-content-wrapper');
        
        if (!contenedor) {
            console.warn("No se encontró el contenedor principal en el DOM.");
            return;
        }

        // 1. PURGA NUCLEAR PREVIA: Destruye el DOM viejo inmediatamente antes de procesar el nuevo
        contenedor.replaceChildren(); 
        
        // 2. LIMPIEZA DE MEMORIA: Forzamos la destrucción de la variable global de archivos
        window.archivosTemporalesFamiliaGlobal = [];

        const respuesta = await fetch(rutaHtml);
        if (!respuesta.ok) throw new Error(`No se pudo cargar la página: ${rutaHtml}`);
        
        const htmlTexto = await respuesta.text();
        
        // 3. INYECCIÓN DEL NUEVO DOM
        contenedor.innerHTML = htmlTexto;

        // 4. MICRO-PAUSA DE SINCRONIZACIÓN (El secreto anti-fantasmas)
        // Obliga a JavaScript a esperar a que el navegador termine de registrar los nuevos IDs
        if (callback) {
            setTimeout(() => {
                callback();
            }, 50);
        }
        
    } catch (error) {
        console.error("Error crítico en ruteo dinámico:", error);
        if (typeof mostrarNotificacion === 'function') {
            mostrarNotificacion("Error al cargar la interfaz visual.", "error");
        }
    }
}