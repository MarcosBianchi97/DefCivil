// URL base de la API. Cuando el sitio lo sirve el propio backend (Docker o `npm start`),
// la API está en el mismo origen: /api. Si se abre index.html directo del disco o con un
// servidor estático aparte (python3 -m http.server), apunta al backend local en el puerto 4000.
// Para otro host, definir window.DC_API_BASE_URL antes de cargar este script.
window.DC_API_BASE_URL = window.DC_API_BASE_URL ||
  (location.protocol === "file:" || location.port === "8000" ? "http://localhost:4000/api" : "/api");
