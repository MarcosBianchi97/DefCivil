// frontend/js/storage.js

// Nombre de la clave que usaremos en el localStorage del navegador
const STORAGE_KEY = 'sistema_defensa_civil_data';

export const Storage = {
    /**
     * Recupera el objeto JSON completo con toda la estructura de la app.
     * Si no existe nada guardado, inicializa la estructura vacía de forma segura.
     */
    getData: () => {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) {
            // Estructura inicial por defecto para que nunca tire "undefined"
            const estructuraInicial = { 
                relevamientos: [], 
                solicitudes: [] 
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(estructuraInicial));
            return estructuraInicial;
        }
        return JSON.parse(data);
    },

    /**
     * Guarda el objeto JSON completo actualizado en el almacenamiento local.
     * @param {Object} data - El objeto con los relevamientos y solicitudes actualizados
     */
    setData: (data) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
};