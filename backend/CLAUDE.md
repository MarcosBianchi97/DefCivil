# CLAUDE.md - Backend

API REST en Node.js + Express + Sequelize sobre PostgreSQL (Supabase). Además de la API, sirve el frontend estático. Ver el contexto general en [../CLAUDE.md](../CLAUDE.md).

## Ejecución

Desde la raíz del repositorio (no hay `package.json` dentro de `backend/`):

```bash
npm run dev     # nodemon backend/app.js
npm start       # node backend/app.js
```

Variables de entorno (archivo `.env` en la raíz, cargado con `dotenv`):

- `DB_PASSWORD`: contraseña de la base. El host, usuario, puerto y nombre de base están fijos en `config/database.js`.
- `JWT_SECRET`: secreto de firma de tokens. Definirlo siempre; los valores de respaldo del código son distintos entre archivos.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- `PORT` (opcional, 3000 por defecto).

## Estructura

```
backend/
├── app.js                      Punto de entrada
├── config/database.js          Instancia de Sequelize
├── middleware/
│   ├── auth.js                 verificarToken (variante simple)
│   └── authMiddleware.js       verificarToken + verificarRolPermitido
├── models/                     usuario, relevamiento, familia, necesidadFamilia, Documentacion
├── controllers/                auth, usuario, relevamiento, familia, solicitud, provision
├── routes/                     Un router por recurso (+ relevadorroutes.js sin montar)
└── exportar.js                 Vacío
```

Convención de nombres: archivos en minúscula y sin separador (`relevamientocontroller.js`), excepto `models/Documentacion.js`. Los controladores exportan funciones nombradas (`export const ...`) y los routers hacen `export default router`. Tener cuidado con la mayúscula de `Documentacion.js` al importar: en Linux distingue mayúsculas.

## Arranque (`app.js`)

Orden en `iniciarServidor()`:

1. `sequelize.authenticate()`.
2. Funciones `asegurar*` que ejecutan `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` con SQL crudo para `documentacion_familias`, `relevamientos`, `provisiones`, `familias` y `necesidades_familia`.
3. `crearAdminPorDefecto()` (se invoca dos veces).
4. `sequelize.sync()` sin `alter` ni `force`.
5. `app.listen`.

Al agregar una columna: actualizar el modelo Sequelize y agregar el `ALTER TABLE ... IF NOT EXISTS` en la función `asegurar*` correspondiente, porque `sync()` no modifica tablas existentes. El `README.md` dice que se usa `{ alter: true }`; es incorrecto.

Estáticos y vistas que sirve `app.js`: `frontend/` en `/` y en `/frontend`, `/js`, `/css`, `/img` (esta última carpeta no existe; las imágenes están en `frontend/assets`), `/login`, `/sistema` (envía `index.html` de la raíz), `/cambiar-password`, `/` (envía `portal.html`).

## Endpoints

Base `/api`. Columna Auth indica lo que el código exige hoy.

| Método y ruta | Auth | Función |
|---|---|---|
| GET `/status` | ninguna | Chequeo de vida |
| POST `/auth/register` | ninguna | Alta de usuario (acepta `rol`) |
| POST `/auth/login` | ninguna | Devuelve `token` y `usuario` |
| POST `/auth/cambiar-password` | token (`auth.js`) | Cambia contraseña, apaga `requiereCambioPass` |
| GET `/usuarios`, `/usuarios/filtrados` | token + Administrador | Lista con filtros `rol`, `estado` |
| POST `/usuarios` | token + Administrador | Alta; contraseña inicial = DNI |
| PUT `/usuarios/:id`, `/usuarios/:id/estado` | token + Administrador | Edita datos; alterna Activo/Inactivo |
| GET/POST `/relevamientos`, GET/PUT/DELETE `/relevamientos/:id` | token | CRUD; el listado filtra por rol |
| PATCH `/relevamientos/:id/completar` | token | Estado `completado` |
| PATCH `/relevamientos/:id/devolver` | token | Devuelve al relevador con motivo |
| GET/POST `/familias`, GET `/familias/relevamiento/:id`, GET/PUT/DELETE `/familias/:id` | POST y PUT con token; resto ninguna | CRUD con adjuntos (campo `documentos`, hasta 10) |
| DELETE `/familias/documentos/:idDocumento` | ninguna | Borra el registro del adjunto |
| GET `/solicitudes/en-espera`, `/solicitudes/historial`, POST `/solicitudes` | ninguna | Auditoría y envío de solicitudes |
| GET/POST `/provisiones`, PUT `/provisiones/:id/cerrar` | ninguna | Gestión de provisiones |

Los middlewares se importan desde dos archivos distintos: `authroutes.js` usa `middleware/auth.js`; el resto usa `middleware/authMiddleware.js`. Al agregar rutas protegidas usar `authMiddleware.js`. Convergerlos en un único archivo y un único secreto es una mejora pendiente.

`verificarRolPermitido(seccion)` recibe el nombre de una sección (`'relevamientos'`, `'familias'`, `'solicitudes'`, `'provisiones'`, `'usuarios'`). Hoy las rutas de usuarios le pasan `'Administrador'`, que no es una sección; funciona solo porque el rol Administrador pasa siempre. Al proteger rutas para otros roles, pasar el nombre de la sección.

## Modelos y base de datos

- `usuario` -> tabla `usuarios`, PK `id_usuario` (atributo `id`), contraseña en `password_hash`, timestamps `created_at`/`updated_at`. Roles y estados son ENUM.
- `relevamiento` -> tabla `relevamientos`, PK `id`, `codigo_relevamiento` único, `relevador_asignado` es texto libre (puede guardar el id del usuario o "Apellido, Nombres"). Timestamps `createdAt`/`updatedAt`.
- `familia` -> `familias`, PK `id_familia`, FK `id_relevamiento`. Contiene daños y cantidades de ayuda como columnas.
- `necesidadFamilia` -> `necesidades_familia`, PK `id_necesidad`, FK `id_familia`; alias `necesidades`.
- `Documentacion` -> `documentacion_familias`; alias `documentacion`; guarda la URL de Cloudinary en `ruta_archivo`.
- `provisiones` y `relevadores` no tienen modelo; se acceden con SQL crudo.

Atención a los nombres de columnas:

- `config/database.js` define `underscored: true` globalmente, pero varios modelos fijan `underscored: false` o nombres de campo explícitos. Siempre mapear con `field:` y verificar contra la tabla real.
- Hay código que busca `id_relevamiento` o `id_usuario` en objetos cuya PK real es `id`. Existen varios "fallbacks" con `catch` y `Op.or` para tolerar esto. No copiar ese patrón; consultar por la PK real.
- Las consultas con SQL crudo usan `?` como marcador (`replacements`). En PostgreSQL las cadenas literales van entre comillas simples; en `provisionesroutes.js` el POST usa `"Enviado"` con comillas dobles, lo que PostgreSQL interpreta como identificador y falla.

## Reglas de negocio implementadas

- Una familia solo puede crearse, editarse o borrarse si el relevamiento no está en `completado`, `finalizado` o `cancelado`.
- Crear la primera familia cambia el relevamiento de `nuevo` a `en proceso` (el valor escrito no coincide con el ENUM; ver abajo).
- `GET /relevamientos` excluye `completado`, `En Espera` y `en_espera`. Para el rol Relevador, además filtra por `relevador_asignado` igual a su id o a su nombre completo. Ante cualquier error responde `200` con `[]`.
- `POST /solicitudes` pone el relevamiento en `En Proceso` y crea una fila en `provisiones` con estado `Enviado`.
- `devolverRelevamiento` deja el estado en `en_proceso` y reemplaza `observaciones` por el motivo. La variable `nuevaObservacion` que arma no se usa.
- Valores de estado dispares entre controladores (`en-proceso`, `en proceso`, `en_proceso`, `En Proceso`): antes de agregar lógica con estados, normalizar o contrastar con el ENUM del modelo.

## Lineamientos al modificar el backend

- Seguir el patrón controlador + router por recurso; un router nuevo debe montarse en `app.js` bajo `/api/<recurso>`.
- Mantener las respuestas en español. Hoy conviven dos formatos: `{ mensaje, data }` (auth, relevamientos, familias) y `{ success, message, data }` (usuarios, solicitudes, provisiones). Para endpoints nuevos usar `{ success, message, data }` y no mezclar dentro del mismo recurso.
- Validar la entrada en el controlador y devolver `400` con mensaje claro; nunca confiar en `id_usuario` ni `rol` del cuerpo, tomarlos de `req.user`.
- Usar `replacements` o los métodos del modelo; no concatenar valores en SQL.
- No registrar en logs contraseñas, tokens ni cuerpos completos de peticiones con datos personales (hoy `crearFamilia` y `actualizarFamilia` imprimen `req.body` y `req.files`; no extender ese patrón).
- Los adjuntos van a Cloudinary vía `uploadDocumentos` (campo `documentos`). `eliminarDocumento` borra solo la fila en la base, no el archivo en Cloudinary.
- No hay tests. `test-db.cjs` y `test-controller.cjs` son pruebas manuales; el segundo está roto por mezclar CommonJS con un proyecto ESM. Verificar cambios levantando el servidor y probando los endpoints con el token de un usuario real.
- Nunca incluir credenciales reales en el código. `config/database.js` ya expone host y usuario de Supabase; la contraseña debe permanecer en `DB_PASSWORD`.
