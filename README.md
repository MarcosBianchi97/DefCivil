# Sistema de Gestión de Asistencia - Defensa Civil (V3)

Sistema web integral para el registro, seguimiento y gestión de asistencia a familias afectadas por emergencias, desarrollado para la práctica profesional.

## 🚀 Tecnologías Utilizadas

- **Frontend:** HTML5, CSS3, Bootstrap 5, JavaScript (ES6+ Modulado)
- **Backend:** Node.js, Express.js (Arquitectura REST API)
- **ORM / Base de Datos:** Sequelize, MySQL Workbench
- **Seguridad y Entorno:** Cors, Dotenv (Variables de entorno protegidas)

## 📁 Estructura Actual del Proyecto

```text
DfcV3/
├── frontend/               # Código del lado del cliente
│   ├── css/                # Estilos globales y responsivos (ui.css)
│   ├── js/                 # Lógica interactiva del cliente
│   │   ├── ui.js           # Notificaciones y comportamiento global de interfaz
│   │   ├── relevamientos.js # Gestión de la vista de relevamientos
│   │   └── ...             
│   └── pages/              # Vistas HTML de la aplicación
│
├── backend/                # Servidor API y Lógica de Negocio
│   ├── config/             # Conexión a la base de datos (database.js)
│   ├── models/             # Modelos de Sequelize (usuarios, familias, relevamientos)
│   ├── routes/             # Rutas Express (auth, familias, relevamientos)
│   ├── app.js              # Archivo principal de arranque del servidor Backend
│   ├── package.json        # Dependencias del backend (Express, Sequelize, MySQL2, etc.)
│   └── .env                # Variables de entorno secretas (IGNORADO EN GIT)
└── .gitignore              # Filtro de archivos protegidos para Git

💻 Configuración Local para Desarrollo
1. Requisitos Previos
Tener instalado Node.js (versión v16 o superior).

Tener instalado MySQL Server y MySQL Workbench corriendo localmente.

2. Configuración de la Base de Datos
Crear un esquema en MySQL llamado según corresponda.

Configurar las credenciales de acceso dentro del archivo backend/.env.

3. Levantar el Servidor Backend
Abrir la terminal y navegar hasta la carpeta del backend:

Bash
cd backend
Instalar las dependencias necesarias:

Bash
npm install
Iniciar el servidor con Node:

Bash
node app.js
El servidor sincronizará las tablas mediante Sequelize ({ alter: true }) e iniciará en el puerto 3000.

4. Acceder al Sistema
El backend expone la carpeta del frontend de forma estática en: http://localhost:3000.

**Proyecto Académico - Defensa Civil**  
Versión 3.0.0 | julio 2026
# DefCivil
