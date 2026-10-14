# CLAUDE.md - Frontend

Cliente web sin proceso de build: HTML, CSS y JavaScript ES Modules servidos como archivos estáticos por el backend Express. Ver el contexto general en [../CLAUDE.md](../CLAUDE.md) y la API en [../backend/CLAUDE.md](../backend/CLAUDE.md).

## Dos aplicaciones en una carpeta

1. **Portal público** (`../portal.html`, ruta `/`): sitio informativo de Defensa Civil con noticias, niveles de alerta, balance anual con Chart.js (datos de `data/datos.json`) y mapa de asistencia por departamento. Usa `css/style.css` y los scripts `posiciones-pines.js`, `scripts.js`, `balance.js`, `mapa-asistencia.js`, cargados como scripts clásicos (no módulos).
2. **Sistema interno** (`../index.html`, ruta `/sistema`): aplicación de gestión tipo SPA para el personal. Usa `css/index.css` y módulos ES. Es la parte con lógica de negocio.

Además: `pages/login.html` (`/login`, con `css/login.css` y `js/login.js`) y `pages/cambiar-password.html` (`/cambiar-password`, con `js/cambiar-password.js`).

Los HTML de `index.html` y `portal.html` están en la raíz del repositorio, no dentro de `frontend/`. Las rutas a recursos son absolutas desde la raíz web (`/frontend/pages/...`, `/api/...`) o relativas a la raíz (`frontend/css/index.css`).

## Cómo funciona el sistema interno

- `index.html` contiene el menú lateral (escritorio) y el menú superior colapsable (móvil), con IDs duplicados por pantalla: `btn-menu-*` y `btn-mobile-*`. Todo cambio de menú debe hacerse en ambos.
- El script de módulo al final de `index.html` hace el arranque: exige `token` y `usuario` en `localStorage` (si no, redirige a `/login`), redirige a `/cambiar-password` si `requiereCambioPass`, oculta opciones del menú según el rol y llama a `verPanelPrincipal()`.
- La navegación no usa un router. Cada opción del menú invoca una función `ver...` que inyecta HTML en el contenedor `.content-principal` (`#app-container`). Las vistas HTML parciales viven en `pages/` y se cargan con `cargarVistaDinamica(ruta, callback)` de `js/utils.js`, que vacía el contenedor, hace `fetch`, inserta el HTML y ejecuta el callback a los 50 ms.
- Algunos módulos (por ejemplo `usuarios.js`) generan el HTML con plantillas de texto en JavaScript en lugar de usar un archivo de `pages/`.
- El token JWT y el objeto `usuario` se guardan en `localStorage` (`token`, `usuario`). Cada `fetch` a la API protegida envía `Authorization: Bearer <token>`. Cerrar sesión hace `localStorage.clear()`.

## Módulos JavaScript (`js/`)

| Archivo | Responsabilidad |
|---|---|
| `relevamientos.js` | Fachada: reexporta y publica en `window` las funciones de los tres módulos de relevamientos |
| `relevamientos-general.js` | Tabla, alta, edición y borrado de relevamientos; panel principal; completar |
| `relevamientos-familias.js` | Lista de familias de un relevamiento, ficha de necesidades, filtros y paginación |
| `relevamientos-form.js` | Formulario de familia en pasos (wizard), necesidades, adjuntos, alta y edición |
| `solicitudes.js` | Auditoría de relevamientos completados, envío de solicitud, historial, devolución |
| `provisiones.js` | Listado con filtros y paginación, cierre del circuito |
| `usuarios.js` | Gestión de usuarios (solo Administrador) |
| `ubicaciones.js` | Datos estáticos: departamentos y localidades |
| `ui.js` | `mostrarNotificacion(mensaje, tipo)` (toast de Bootstrap) y cierre del menú móvil |
| `utils.js` | `cargarVistaDinamica` |
| `permisos.js` | `tienePermiso(rol, seccion)` con una matriz de roles (no se usa en `index.html`, que oculta menús a mano) |
| `storage.js` | Envoltorio de `localStorage` para una estructura local de relevamientos y solicitudes |
| `login.js`, `cambiar-password.js` | Páginas de acceso |
| `balance.js`, `mapa-asistencia.js`, `posiciones-pines.js`, `scripts.js` | Solo portal público |
| `admin.js`, `sync.js` | Panel de noticias y alerta del portal basado en `localStorage`; ningún HTML los carga actualmente |

## Convenciones del código existente

- Módulos con `import`/`export`. Los módulos que se usan desde atributos `onclick="..."` en HTML generado también se asignan a `window` (por ejemplo `window.ingresarARelevamiento = ingresarARelevamiento`). Si se agrega una función invocada desde HTML inline, exponerla en `window` en el mismo módulo y, si corresponde, en `relevamientos.js`.
- Estado compartido entre módulos mediante globales de `window`: `window.idRelevamientoActivo`, `window.archivosTemporalesFamiliaGlobal`. `cargarVistaDinamica` reinicia la segunda en cada cambio de vista.
- Notificaciones siempre con `mostrarNotificacion` de `ui.js`, no con `alert`.
- Nombres en español y en camelCase (`verListaSolicitudes`, `guardarDatosFamiliaDefinitivo`). Los IDs de HTML usan kebab-case en español (`btn-menu-solicitudes`, `tbody-usuarios`).
- Interfaz oscura basada en Bootstrap 5 con acentos amarillos (`btn-warning`, `text-warning`). Reutilizar las clases de `css/index.css` antes de escribir estilos en línea.
- Íconos con Bootstrap Icons (`bi bi-...`); Font Awesome también está cargado.
- Los formularios con archivos se envían como `FormData` (campo `documentos`, y `necesidades` como cadena JSON), no como JSON.

## Roles y visibilidad

El frontend oculta menús según `usuario.rol` normalizado a minúsculas, pero eso es solo una comodidad visual. La autorización real está en el backend. Resumen de lo que ve cada rol en el menú:

- `administrador`: todo.
- `operador`: Inicio, Solicitudes, Provisiones.
- `relevador`: Inicio y Relevamientos (el `body` recibe la clase `rol-relevador`).
- `consulta`: solo Inicio.

Si se agrega una sección, actualizar tres cosas: el HTML del menú (versión escritorio y móvil), el bloque de ocultamiento por rol en `index.html` y la protección de la ruta en el backend.

## Cómo hacer cambios

- Para probar, ejecutar el backend desde la raíz (`npm run dev`) y abrir `http://localhost:3000`. No usar `live-server`: las llamadas a `/api` necesitan el mismo origen.
- Iniciar sesión con un usuario real de la base y revisar el flujo con cada rol afectado. No hay pruebas automatizadas, así que verificar en el navegador la ruta feliz y los casos de error (token vencido, sin permisos, relevamiento bloqueado).
- Al cambiar un campo de formulario o de tabla, revisar el modelo y el controlador del backend correspondiente.
- Evitar `innerHTML` con datos que vengan del usuario o de la API sin escapar; varios módulos ya lo hacen y es un riesgo de XSS. En código nuevo usar `textContent` o escapar los valores.

## Problemas conocidos del frontend

- Hay definiciones duplicadas de funciones globales (`window.cambiarPaginaFamilias` dos veces en `relevamientos-familias.js`, `window.eliminarArchivoAdjunto` repetida en `relevamientos-form.js`); la última definición gana.
- `admin.js` contiene credenciales de administrador del portal escritas en el cliente. Es código sin uso, pero no debe reactivarse ni copiarse; cualquier autenticación debe pasar por la API.
- Varias llamadas `fetch` a `/api/familias` y `/api/solicitudes` no envían el token porque el backend hoy no lo exige; si se protegen esas rutas, agregar el encabezado `Authorization` en estos módulos.
- Los datos del balance (`data/datos.json`) y las posiciones de los pines del mapa son estáticos y de ejemplo; no provienen de la base.
- `ui.js` y otros módulos construyen HTML con interpolación de texto; ver el aviso sobre XSS.
- `sync.js` antepone `img/` a las imágenes, pero las imágenes reales están en `frontend/assets/`.
