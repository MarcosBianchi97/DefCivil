// frontend/js/relevamientos.js
// 1. Importamos todas las funciones desde los tres módulos separados (incluyendo mostrarFormularioNuevoRelevamiento)
import { cargarTablaRelevamientos, editarRelevamientoGeneral, verPanelPrincipal, mostrarFormularioNuevoRelevamiento } from './relevamientos-general.js';
import { eliminarFamiliar, verFichaNecesidades, verListaRelevamientos, ingresarARelevamiento } from './relevamientos-familias.js';
import { agregarItemLista, eliminarItemLista, guardarDatosFamiliaDefinitivo, editarDatosFamilia } from './relevamientos-form.js';

// Re-exportamos todas para que el index o el sistema principal las pueda importar
export { 
    cargarTablaRelevamientos,
    editarRelevamientoGeneral, 
    verPanelPrincipal, 
    mostrarFormularioNuevoRelevamiento,
    eliminarFamiliar, 
    verFichaNecesidades, 
    verListaRelevamientos, 
    agregarItemLista, 
    eliminarItemLista, 
    guardarDatosFamiliaDefinitivo, 
    editarDatosFamilia 
};

// 2. Las exponemos al objeto global window para los onclick inline del HTML
if (typeof window !== 'undefined') {
    window.cargarTablaRelevamientos = cargarTablaRelevamientos;
    window.editarRelevamientoGeneral = editarRelevamientoGeneral;
    window.verPanelPrincipal = verPanelPrincipal;
    window.mostrarFormularioNuevoRelevamiento = mostrarFormularioNuevoRelevamiento;
    
    window.eliminarFamiliar = eliminarFamiliar;
    window.verFichaNecesidades = verFichaNecesidades;
    window.verListaRelevamientos = verListaRelevamientos;
    
    window.agregarItemLista = agregarItemLista;
    window.eliminarItemLista = eliminarItemLista;
    window.guardarDatosFamiliaDefinitivo = guardarDatosFamiliaDefinitivo;
    window.editarDatosFamilia = editarDatosFamilia;
    window.ingresarARelevamiento = ingresarARelevamiento;

    // Redirecciones y alias útiles
    window.regresarAListaFamilias = () => { if (window.idRelevamientoActivo && typeof ingresarARelevamiento === 'function') ingresarARelevamiento(window.idRelevamientoActivo); };
}