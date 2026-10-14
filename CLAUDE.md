# CLAUDE.md - Proyecto general

Sistema de Gestión de Asistencia de Defensa Civil (versión 3.0), orientado a la provincia de Santiago del Estero. Permite registrar relevamientos de emergencias, cargar las familias afectadas con sus necesidades y documentación, solicitar provisiones y cerrar el circuito de entrega.

Este archivo describe el proyecto completo. Hay guías específicas en:

- [backend/CLAUDE.md](backend/CLAUDE.md): API, modelos, autenticación y base de datos.
- [frontend/CLAUDE.md](frontend/CLAUDE.md): interfaz, módulos JS, vistas y estilos.

## Idioma y convenciones generales

- Todo el proyecto está en español: nombres de variables, funciones, rutas, mensajes y comentarios. Mantener ese criterio en el código nuevo.
- Sin emojis en documentación nueva. (El código existente tiene emojis en logs y comentarios; no es necesario limpiarlos salvo que se toque esa línea.)
- No hay linter, formateador ni tests automatizados configurados. Respetar el estilo del archivo que se edita (indentación de 4 espacios, comillas simples, punto y coma).
- El proyecto usa ES Modules (`"type": "module"` en el `package.json` raíz). Usar `import`/`export`, nunca `require` en archivos `.js`.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5, CSS3, Bootstrap 5.3 (CDN), Bootstrap Icons, Font Awesome, Animate.css, JavaScript ES Modules sin build, Chart.js y pdfmake (CDN) |
| Backend | Node.js, Express 4, Sequelize 6 |
| Base de datos | PostgreSQL alojado en Supabase (pooler, puerto 6543, SSL) |
| Autenticación | JWT (`jsonwebtoken`, 8 h) y `bcryptjs` para hashes |
| Archivos adjuntos | Multer + Cloudinary (jpg, jpeg, png, pdf) |

Aviso: el `README.md` menciona MySQL y `backend/package.json`; ambos están desactualizados. La base real es PostgreSQL y existe un único `package.json`, en la raíz.

## Estructura del repositorio

```
DefCiv-3.0-main/
├── backend/                 Servidor Express (ver backend/CLAUDE.md)
│   ├── app.js               Arranque, rutas, estáticos y DDL de arranque
│   ├── config/database.js   Conexión Sequelize a Supabase
│   ├── controllers/         Lógica de cada recurso
│   ├── middleware/          auth.js y authMiddleware.js
│   ├── models/              Modelos Sequelize
│   └── routes/              Routers Express
├── frontend/                Cliente web sin build (ver frontend/CLAUDE.md)
│   ├── assets/              Imágenes, logos y mapas SVG
│   ├── css/  js/  pages/    Estilos, módulos y fragmentos HTML
│   └── data/datos.json      Datos de ejemplo para el balance del portal
├── index.html               Shell de la aplicación interna (se sirve en /sistema)
├── portal.html              Portal público de inicio (se sirve en /)
├── migrations/schema.sql    Solo define la tabla relevadores; no es el esquema completo
├── respaldo.js              Script que exporta tablas de PostgreSQL a JSON
├── backup_completo.json     Resultado de un respaldo (datos de prueba)
├── test-db.cjs              Prueba manual de conexión a la base
├── test-controller.cjs      Prueba manual del controlador (hoy no funciona, ver problemas)
└── package.json             Dependencias y scripts de todo el proyecto
```

## Cómo se ejecuta

```bash
npm install
npm run dev      # nodemon backend/app.js
npm start        # node backend/app.js
```

- El servidor escucha en `PORT` (3000 por defecto) y sirve tanto la API como el frontend estático. No hace falta un servidor aparte para el frontend.
- Variables de entorno necesarias en un `.env` en la raíz (está en `.gitignore`): `DB_PASSWORD`, `JWT_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, y opcionalmente `PORT`.
- Rutas de páginas: `/` (portal público), `/login`, `/sistema` (aplicación interna, requiere token en `localStorage`), `/cambiar-password`.
- Rutas de API: todas bajo `/api/...` (`status`, `auth`, `usuarios`, `relevamientos`, `familias`, `solicitudes`, `provisiones`).
- Los scripts `frontend` y `db:create` del `package.json` están obsoletos (apuntan a `live-server` y a un SQL que no existe).

## Flujo de negocio

1. El Administrador crea un **relevamiento** (departamento, localidad, evento, solicitante, prioridad) y lo asigna a un Relevador. Estado inicial: `nuevo`.
2. El Relevador carga las **familias** afectadas: datos del jefe, integrantes, daños, urgencia, necesidades de materiales y documentación adjunta. Al cargar la primera familia el relevamiento pasa a `en proceso`.
3. El Relevador marca el relevamiento como `completado`. Queda bloqueado para agregar, editar o borrar familias y sale de la tabla operativa.
4. En **Solicitudes**, el Administrador u Operador audita los relevamientos `completado`. Puede devolverlos al relevador (`devolver`) o enviarlos, lo que pasa el estado a `En Proceso` y genera una **provisión** con estado `Enviado`.
5. En **Provisiones** se registra el retorno de la entrega y se cierra el circuito (`fecha_cierre`).

Estados del modelo `Relevamiento`: `nuevo`, `en-espera`, `en-proceso`, `completado`, `derivado`, `finalizado`, `cancelado`.

## Roles

Cuatro roles: `Administrador`, `Operador`, `Relevador`, `Consulta`.

| Rol | Alcance |
|-----|---------|
| Administrador | Todo, incluida la gestión de usuarios |
| Operador | Inicio, solicitudes, provisiones (no ve Relevamientos ni Configuración) |
| Relevador | Inicio y relevamientos propios (ve solo los asignados a él) |
| Consulta | Solo el inicio, lectura |

El control se aplica en dos lugares que deben mantenerse sincronizados: el menú en `index.html` (frontend, solo visual) y los middlewares de `backend/middleware/authMiddleware.js` (autoridad real).

## Seguridad y problemas conocidos

Antes de ampliar el sistema conviene tener presente lo siguiente. No arreglar de forma oportunista sin avisar al usuario, pero sí no empeorarlo y señalarlo cuando se toque cada zona.

1. **Credenciales en el repositorio.** `respaldo.js`, `test-db.cjs` y `.vscode/sftp.json` contienen una cadena de conexión a PostgreSQL y una contraseña SFTP en texto plano, y no están cubiertos por `.gitignore`. Hay que rotarlas y moverlas a variables de entorno. Nunca copiar esos valores a otros archivos ni a la documentación.
2. **Contraseñas por defecto.** Al iniciar, `backend/app.js` crea el usuario `admin` con contraseña `123456` si no existe. Los usuarios nuevos reciben su DNI como contraseña inicial y se les fuerza el cambio.
3. **Secreto JWT inconsistente.** `middleware/auth.js` y `middleware/authMiddleware.js` tienen secretos de respaldo distintos, y `authcontroller.js` usa un tercero igual al segundo. Si `JWT_SECRET` no está definido, `/api/auth/cambiar-password` rechaza los tokens que el propio login emite.
4. **Endpoints sin autenticación.** `/api/solicitudes`, `/api/provisiones`, y los GET y DELETE de `/api/familias` no exigen token. `POST /api/auth/register` es público y acepta el campo `rol`. `cambiarPassword` toma `id_usuario` del cuerpo en lugar del token.
5. **Estados inconsistentes.** El ENUM de PostgreSQL acepta `en-proceso`, pero el código escribe `en proceso`, `en_proceso` y `En Proceso`, y filtra por variantes de mayúsculas. Esos `update` pueden fallar o dejar datos fuera de los filtros.
6. **Esquema y DDL en el arranque.** `app.js` ejecuta `CREATE TABLE IF NOT EXISTS` y `ALTER TABLE` a mano y luego `sequelize.sync()` sin `alter`. No hay migraciones reales; `migrations/schema.sql` no refleja la base.
7. **Código muerto o roto:** `backend/routes/relevadorroutes.js` no está montado en `app.js` y consulta una tabla `relevadores` con columnas distintas a las de `schema.sql`; `backend/exportar.js` está vacío; `test-controller.cjs` usa `require` sobre módulos ESM; `frontend/js/admin.js` y `frontend/js/sync.js` no se referencian desde ningún HTML.
8. **Código de relevamiento.** `generarCodigoRelevamiento` usa el conteo total de filas y el año fijo `26`, por lo que puede repetirse el código (columna `unique`) al borrar registros.

## Reglas para trabajar en este proyecto

- Leer el archivo completo antes de modificarlo; muchos módulos tienen funciones duplicadas o sobrescritas (por ejemplo `window.cambiarPaginaFamilias` y `window.eliminarArchivoAdjunto` se definen dos veces).
- Un cambio de campo de datos suele tocar tres lugares: el modelo (y el `ALTER TABLE` de `app.js`), el controlador y el formulario/tabla del frontend. Revisar los tres.
- No introducir secretos en el código ni en documentación. Usar `process.env`.
- No agregar dependencias nuevas sin necesidad. Hoy `bcrypt` y `bcryptjs` están ambos instalados pero solo se usa `bcryptjs`; `mysql2` está instalado pero la base es PostgreSQL.
- Probar manualmente el flujo completo (login, crear relevamiento, cargar familia, completar, enviar solicitud, cerrar provisión) con cada rol cuando se cambie algo transversal.
- No hacer commit ni push salvo pedido explícito del usuario.
