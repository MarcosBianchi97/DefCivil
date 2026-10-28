# Defensa Civil Santiago del Estero — sitio institucional y panel admin

Sitio público (`index.html`) y panel interno (`admin.html`) con una API Node/Express/Sequelize
(`backend/`) que guarda todo en **PostgreSQL**. Noticias, nivel de alerta, balance y mapa salen
de la base; el sitio no tiene datos fijos. El mismo backend sirve el sitio y la API en el puerto 4000.

## Requisitos
- Docker con Compose v2 (`docker compose version`).
- Para correr sin Docker: Node 22+ y un PostgreSQL.

## 1. Configuración (una sola vez)

```bash
cp backend/.env.example backend/.env
```

Completar en `backend/.env`:
- `JWT_SECRET` — generarlo, no inventarlo:
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- `DB_NAME`, `DB_USER`, `DB_PASSWORD` — ver las dos opciones de abajo.

`backend/.env` nunca se sube al repositorio.

## 2. Elegir la base de datos

### Opción A — Base propia (la más simple para probar)
Levanta su propio PostgreSQL, vacío, en un volumen local. Elegí cualquier `DB_PASSWORD`.

```bash
docker compose --env-file backend/.env -f docker-compose.standalone.yml up -d --build
```

### Opción B — Compartir la base del proyecto DefCiv
Usa el mismo PostgreSQL que DefCiv (tablas propias: `usuarios_web`, `noticias`, `alerta_vigente`;
lee `relevamientos`, `familias` y `provisiones` para las estadísticas).

1. Tener corriendo el compose de DefCiv (contenedor `defciv-postgres`).
2. Poner en `backend/.env` el `DB_NAME`, `DB_USER` y `DB_PASSWORD` de esa base.
3. Ver el nombre de su red con `docker network ls` y, si no es `defciv-30-main_default`,
   crear un archivo `.env` en la raíz con `DEFCIVIL_NETWORK=<nombre>`.
4. ```bash
   docker compose up -d --build
   ```

## 3. Usar

- Sitio: <http://localhost:4000> — Panel: <http://localhost:4000/admin.html>
- Otros equipos de la red: `http://IP-DE-LA-PC:4000` (abrir el puerto en el firewall).
- **Contraseñas iniciales:** la primera vez, el servidor crea `superadmin` y `admin` con
  contraseñas aleatorias y las imprime **una sola vez**: `docker compose logs civil-vero`
  (o definí `SEED_SUPERADMIN_PASSWORD` / `SEED_ADMIN_PASSWORD` en `backend/.env` antes de arrancar).
- Logs: `docker compose logs -f civil-vero`. Apagar: `docker compose down`
  (con la opción A agregar `-f docker-compose.standalone.yml --env-file backend/.env`).

## Sin Docker

```bash
cd backend && npm install && npm start     # con DB_HOST=localhost y un Postgres corriendo
```

También sirve el sitio en <http://localhost:4000>.

## Estructura
- `index.html`, `admin.html`, `css/`, `js/`, `img/` — frontend sin build (`js/config.js` define la URL de la API).
- `backend/` — API: auth, usuarios admin, noticias, nivel de alerta, estadísticas.
- `Dockerfile`, `docker-compose.yml` (base compartida con DefCiv), `docker-compose.standalone.yml` (base propia).

## Nota
Los números del Balance y del mapa salen de las tablas de DefCiv. Si la base no tiene relevamientos
finalizados todavía (por ejemplo, con la opción A), se muestran en cero.
