# Servidor local compartido por Wi-Fi

Este modo ejecuta **una sola copia del backend y PostgreSQL en la computadora
servidora**. Los demás integrantes abren la aplicación desde el navegador y usan
la misma base. PostgreSQL no publica su puerto en la red; solo el backend acepta
conexiones de clientes.

```text
Navegadores del equipo ── Wi-Fi/LAN ──> PC servidora:3000 ──> PostgreSQL
                                             │
                                             └── D:\DefCivil\data\postgres
```

La computadora servidora debe permanecer encendida y conectada a la red para
que el sistema esté disponible. Esta guía limita el acceso a la red local: no
configures redirección de puertos del router ni expongas el servidor a Internet.

## Qué queda guardado en D:

- PostgreSQL y sus registros: `D:\DefCivil\data\postgres`.
- Copias de la base creadas con `npm run db:backup`:
  `D:\DefCivil\data\backups`.
- Los documentos adjuntos continúan en Cloudinary, tal como en el código actual;
  no se guardan en D:. Si deben quedar allí también, hace falta planificar e
  implementar almacenamiento local de archivos por separado.

## Preparar el servidor

1. Instala y ejecuta Docker Desktop en la PC servidora. Asegúrate de que Docker
   Desktop pueda acceder al disco D:.
2. Desde la raíz del repositorio, crea `backend/.env` copiando
   `backend/.env.example`. Si ya existe, no lo sobrescribas.
3. Edita `backend/.env` antes del primer arranque:
   - Mantén `APP_DATA_DIR=D:/DefCivil/data` o indica una ruta absoluta válida en
     el disco D:. Usa una carpeta nueva/vacía para `postgres`.
   - Cambia `DB_PASSWORD` por una clave propia de al menos 16 caracteres.
   - Cambia `JWT_SECRET` por un secreto aleatorio propio de al menos 32
     caracteres.
   - Cambia `ADMIN_INITIAL_PASSWORD` por una clave inicial propia de al menos
     12 caracteres.
   - No definas `DATABASE_URL`: fuerza SSL y no se utiliza para la base dentro
     de Docker Compose.

   No compartas ni subas `backend/.env` al repositorio. `npm run db:up` valida
   que las claves de ejemplo se hayan reemplazado.
4. Instala dependencias en la PC servidora: `npm install`.
5. Inicia los servicios: `npm run db:up`. El primer arranque construye la imagen
   y puede demorar unos minutos mientras descarga PostgreSQL y Node.js.
6. Comprueba los servicios con
   `docker compose --env-file backend/.env ps`. PostgreSQL debe quedar
   `healthy` y el backend debe quedar `healthy`.
7. En la PC servidora abre `http://localhost:3000/api/status`; debe responder
   con estado `online`.

No hace falta desinstalar PostgreSQL nativo. Compose **no publica el puerto 5432
del contenedor**, por lo que puede convivir con una instalación nativa que use
ese puerto.

## Dar acceso a otras computadoras de la misma red

1. En la PC servidora ejecuta `ipconfig` y busca la dirección IPv4 de la
   interfaz Wi-Fi conectada a la red compartida.
2. Desde otro equipo conectado a esa misma Wi-Fi, abre
   `http://<IPv4-de-la-PC-servidora>:3000`; por ejemplo,
   `http://10.0.0.25:3000`.
3. Si no conecta, permite el puerto TCP configurado en `APP_HOST_PORT`
   (predeterminado `3000`) en el Firewall de Windows **solo para redes
   privadas** y, si es posible, limita el alcance a la subred local. La regla
   `DefCivil LAN backend (TCP 3000)` creada durante la configuración permite
   únicamente el puerto 3000 desde la subred local y el perfil privado. No
   cambies el perfil de una Wi-Fi pública a privada. En una red doméstica o de
   oficina de confianza, Windows ofrece el cambio del perfil desde
   **Configuración > Red e Internet > Wi-Fi/Ethernet > Propiedades > Tipo de
   perfil de red > Privada**. No crees una regla para redes públicas.
4. Si la IP de la PC cambia, comparte la nueva dirección. Para un uso continuo,
   puedes reservarle una IP en el router.

Los integrantes que usan la aplicación solo necesitan un navegador en la misma
red; no instalan Node.js, Docker ni PostgreSQL. Las cuentas y registros se
guardan en la base central de la PC servidora. El usuario administrador inicial
es `admin` y su contraseña es el valor local configurado en
`ADMIN_INITIAL_PASSWORD` dentro de `backend/.env`; no se sube ni se comparte por
el repositorio.

Antes de compartir el enlace, configura secretos propios y una contraseña
administrativa no predeterminada. Si el usuario `admin` ya existe, cambiar
`ADMIN_INITIAL_PASSWORD` no cambia su contraseña almacenada. `npm run db:reset`
borra la base completa y vuelve a crearla, incluido el administrador inicial.

## Verificar tablas y API

Para listar las tablas creadas por Sequelize y las funciones `asegurarTabla*`:

```sh
docker compose --env-file backend/.env exec postgres psql -U defcivil -d defcivil_local -c '\dt'
```

Se esperan `usuarios`, `relevamientos`, `familias`, `necesidades_familia`,
`documentacion_familias` y `provisiones`. No hay tablas independientes
`solicitudes` ni `relevadores`: las solicitudes se representan mediante
relevamientos/provisiones y las cuentas de relevadores están en `usuarios`.

El endpoint de estado es `http://localhost:3000/api/status`. La pantalla de
ingreso está en `http://localhost:3000/login`.

## Copias de seguridad

- `npm run db:backup` genera un dump PostgreSQL en
  `D:\DefCivil\data\backups`.
- `npm run db:down` detiene los servicios sin borrar datos.
- `npm run db:up` los vuelve a iniciar conservando la base.
- `npm run db:reset` **borra todos los registros de la base** y la crea limpia;
  las copias guardadas en `backups` se conservan. Los documentos de Cloudinary
  no se borran con este comando.

Una copia guardada en el mismo disco D: no protege contra una falla o pérdida de
ese disco. Copia periódicamente los dumps a otro disco o almacenamiento
respaldado. No compartas dumps que contengan datos personales sin protegerlos.

## Desarrollo individual sin Docker

Para ejecutar el backend de forma individual contra PostgreSQL nativo, configura
en `backend/.env` `DB_HOST=localhost`, `DB_PORT=5432`,
`DB_NAME=defcivil_local`, `DB_USER=defcivil` y `DB_PASSWORD` con las credenciales
de esa instancia; después ejecuta `npm run dev`. Ese PostgreSQL nativo es
independiente del servidor Compose: sus registros **no** se guardan en
`D:\DefCivil\data` ni se comparten con otros equipos.

## Solución de problemas

- **La validación de `db:up` pide cambiar una clave**: edita las tres variables
  secretas indicadas arriba en `backend/.env`. No uses los marcadores del
  ejemplo.
- **Docker no puede montar la ruta de D:** confirma que la unidad existe, que
  Docker Desktop puede acceder a ella y que `APP_DATA_DIR` tiene formato
  `D:/DefCivil/data`. La subcarpeta `postgres` debe estar vacía al inicializar
  una base nueva.
- **El puerto 3000 está ocupado**: cambia `APP_HOST_PORT` en `backend/.env` a
  otro puerto libre y comparte esa dirección, por ejemplo
  `http://<IPv4-de-la-PC>:3001`.
- **El puerto 5432 está ocupado**: eso normalmente es PostgreSQL nativo. No es
  necesario cambiarlo porque Compose no publica el puerto de su contenedor.
- **Los demás equipos no abren la página**: confirma que estén en la misma
  Wi-Fi, que la PC servidora siga encendida, que el backend esté ejecutándose y
  que el Firewall permita el puerto de la aplicación en la red privada.
- **La página abre pero las operaciones fallan**: revisa los logs con
  `docker compose --env-file backend/.env logs --tail=100 backend postgres` y
  confirma que PostgreSQL aparezca `healthy`.
- **Falla una carga de documentos**: las cargas siguen usando Cloudinary; revisa
  `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET`.

El archivo `.vscode/sftp.json` podría tener `uploadOnSave` habilitado. Desactiva
la extensión SFTP al trabajar localmente para evitar subir cambios a un servidor
remoto al guardar.
