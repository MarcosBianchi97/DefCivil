# Desarrollo local

El backend usa PostgreSQL y Sequelize. La base local se crea automáticamente al
arrancar el servidor: `sequelize.sync()` y las funciones `asegurarTabla*` preparan
las tablas, y se crea un administrador local por defecto.

Con el estado actual del código, las tablas que se esperan son `usuarios`,
`relevamientos`, `familias`, `necesidades_familia`, `documentacion_familias` y
`provisiones`. No hay tablas independientes `solicitudes` ni `relevadores`: las
solicitudes se representan con relevamientos/provisiones y las cuentas de
relevadores están en `usuarios`.

## Opción 1: Docker Compose

Requisitos: Node.js/npm y Docker Desktop en Windows o Docker Engine + Compose en
Linux.

1. Desde la raíz del repositorio, copia `backend/.env.example` como
   `backend/.env`.
2. Instala las dependencias con `npm install`. El proyecto requiere una versión
   de Node.js compatible con las dependencias indicadas en `package.json`.
3. Inicia PostgreSQL: `npm run db:up`. Espera a que el healthcheck quede en estado
   `healthy` con `docker compose --env-file backend/.env ps`.
4. Arranca el backend: `npm run dev`.
5. Comprueba `http://localhost:3000/api/status`; debe responder con estado
   `online`. También puedes iniciar sesión como se describe más abajo.
6. Para inspeccionar las tablas, ejecuta:

   ```sh
   docker compose --env-file backend/.env exec postgres psql -U defcivil -d defcivil_local -c '\dt'
   ```

La configuración local usa `DB_HOST=localhost`, `DB_PORT=5432`,
`DB_NAME=defcivil_local`, `DB_USER=defcivil` y `DB_PASSWORD=defcivil_local`.
Si cambias el puerto publicado, actualiza tanto `DB_PORT` como
`POSTGRES_HOST_PORT` en `backend/.env`.
No definas `DATABASE_URL` en local: cuando está definida, el backend activa SSL.

### Puerto 5432 ocupado

Si ya tienes PostgreSQL instalado, cambia `DB_PORT` y `POSTGRES_HOST_PORT` en
`backend/.env` al mismo puerto libre, por ejemplo `5433`, y vuelve a ejecutar
`npm run db:up`. Docker publicará el puerto `5433` del equipo hacia el `5432` del
contenedor.

## Opción 2: PostgreSQL nativo, sin Docker

Instala PostgreSQL 16 o posterior y crea una base y un usuario con las credenciales
del archivo `backend/.env.example`.

### Linux

En Debian/Ubuntu, instala y arranca PostgreSQL:

```sh
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl enable --now postgresql
```

En una instalación que use el usuario administrativo `postgres`, abre `psql`:

```sh
sudo -u postgres psql
```

En la consola de `psql`:

```sql
CREATE USER defcivil WITH PASSWORD 'defcivil_local';
CREATE DATABASE defcivil_local OWNER defcivil;
\q
```

### Windows

Descarga e instala PostgreSQL 16 desde el instalador oficial de
[PostgreSQL para Windows](https://www.postgresql.org/download/windows/), incluyendo
las herramientas de línea de comandos.

Abre SQL Shell (psql) o una consola y ejecuta `psql -U postgres`. Ingresa la
contraseña administrativa configurada durante la instalación. Luego ejecuta:

```sql
CREATE USER defcivil WITH PASSWORD 'defcivil_local';
CREATE DATABASE defcivil_local OWNER defcivil;
```

En ambos sistemas, configura `backend/.env` con `DB_HOST=localhost`,
`DB_PORT=5432`, `DB_NAME=defcivil_local`, `DB_USER=defcivil` y
`DB_PASSWORD=defcivil_local`. No hace falta iniciar el servicio de Docker.

## Usuario administrador local

Al iniciar por primera vez, el backend crea el usuario:

- Usuario: `admin`
- Contraseña: `123456`

Estas credenciales son únicamente para la base local de desarrollo. No las uses
en producción ni expongas el servidor local en una red compartida.

## Reiniciar la base

- `npm run db:down` detiene PostgreSQL y conserva los datos.
- `npm run db:reset` detiene PostgreSQL y borra el volumen nombrado; al volver a
  ejecutar `npm run db:up` se crea una base vacía.

El comando `db:reset` elimina de forma permanente los datos locales guardados en
ese volumen. En PostgreSQL nativo, borra la base `defcivil_local` y créala otra
vez con los comandos anteriores.

## Solución de problemas

- **`SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string`**:
  comprueba que copiaste `backend/.env.example` a `backend/.env` y que
  `DB_PASSWORD` tiene un valor. Este proyecto usa `DB_PASSWORD` (no `DB_PASS`).
- **El puerto 5432 está ocupado**: cambia `DB_PORT` y `POSTGRES_HOST_PORT` en
  `backend/.env` al mismo puerto libre, por ejemplo `5433`, y vuelve a levantar
  el servicio.
- **`DATABASE_URL` definida por error**: comenta o elimina esa línea en
  `backend/.env` para desarrollo local. La conexión por URL habilita SSL.
- **El servidor no encuentra la base o no conecta**: confirma que PostgreSQL
  está saludable con Docker (`docker compose ps`) y que host, puerto, base,
  usuario y contraseña coinciden con la configuración del contenedor.

## Seguridad al trabajar localmente

El archivo `.vscode/sftp.json` puede tener `uploadOnSave` habilitado. Desactiva
la extensión SFTP mientras trabajas localmente: guardar archivos podría subirlos
a un servidor remoto.

## Cambio a otra base

Para una base remota que requiera SSL, comenta las variables locales y define
`DATABASE_URL` en `backend/.env` con la URL entregada por el proveedor. No
compartas ni versionas credenciales reales.
