// backend/app.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { QueryTypes } from 'sequelize';
import sequelize from './config/database.js';

import relevamiento from './models/relevamiento.js';
import familia from './models/familia.js';
import usuario from './models/usuario.js';
import necesidadFamilia from './models/necesidadFamilia.js'; // 🌟 Súbelo aquí junto al resto
import documentacion from './models/Documentacion.js'; // (Si lo usas aquí también)

import relevamientoroutes from './routes/relevamientoroutes.js';
import familiaroutes from './routes/familiaroutes.js';
import authroutes from './routes/authroutes.js';
import usuarioroutes from './routes/usuarioroutes.js';
import solicitudroutes from './routes/solicitudroutes.js';
import provisionesroutes from './routes/provisionesroutes.js';
import estadisticasroutes from './routes/estadisticasroutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '../');

const app = express();

app.use(cors());
app.use(express.json());

// ==========================================
// 📂 ARCHIVOS ESTÁTICOS (Único bloque ordenado al inicio)
// ==========================================
app.use(express.static(path.join(projectRoot, 'frontend')));
app.use('/frontend', express.static(path.join(projectRoot, 'frontend')));
app.use('/js', express.static(path.join(projectRoot, 'frontend', 'js')));
app.use('/css', express.static(path.join(projectRoot, 'frontend', 'css')));
app.use('/img', express.static(path.join(projectRoot, 'frontend', 'img')));

// ==========================================
// 🌐 RUTAS DE VISTAS (FRONTEND)
// ==========================================
app.get('/login', (req, res) => {
    res.sendFile(path.join(projectRoot, 'frontend', 'pages', 'login.html'));
});

app.get('/sistema', (req, res) => {
    res.sendFile(path.join(projectRoot, 'index.html'));
});

app.get('/cambiar-password', (req, res) => {
    res.sendFile(path.join(projectRoot, 'frontend', 'pages', 'cambiar-password.html'));
});

app.get('/cambiar-password.html', (req, res) => {
    res.sendFile(path.join(projectRoot, 'frontend', 'pages', 'cambiar-password.html'));
});

// ==========================================
// 🔌 API ROUTES
// ==========================================
app.get('/api/status', (req, res) => {
    res.json({ status: 'online', message: 'API de Defensa Civil funcionando correctamente.' });
});

app.use('/api/relevamientos', relevamientoroutes);
app.use('/api/familias', familiaroutes);
app.use('/api/auth', authroutes);
app.use('/api/usuarios', usuarioroutes);
app.use('/api/solicitudes', solicitudroutes);
app.use('/api/provisiones', provisionesroutes);
app.use('/api/estadisticas', estadisticasroutes);

// Ruta por defecto (Raíz)
app.get('/', (req, res) => {
    const portalPath = path.join(projectRoot, 'portal.html');
    res.sendFile(portalPath, (err) => {
        if (err) {
            res.sendFile(path.join(projectRoot, 'frontend', 'pages', 'login.html'));
        }
    });
});

const PORT = process.env.PORT || 3000;

// Función para asegurar la tabla de documentación / adjuntos
async function asegurarTablaDocumentacion() {
    try {
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS documentacion_familias (
                id_documento SERIAL PRIMARY KEY,
                id_familia INTEGER REFERENCES familias(id_familia) ON DELETE CASCADE,
                nombre_archivo VARCHAR(255) NOT NULL,
                ruta_archivo VARCHAR(255) NOT NULL,
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `, { type: QueryTypes.RAW });
        console.log('✅ Verificación/Creación de la tabla "documentacion_familias" completada.');
    } catch (error) {
        console.error('⚠️ Aviso al verificar la tabla documentacion_familias:', error.message);
    }
}

// Agrega esta función junto a las demás funciones de inicialización en index.js
async function asegurarTablaProvisiones() {
    try {
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS provisiones (
                id SERIAL PRIMARY KEY,
                solicitud_id INT,
                detalle TEXT NOT NULL,
                destino VARCHAR(250) NOT NULL,
                estado VARCHAR(50) DEFAULT 'Enviado',
                observaciones TEXT,
                fecha_cierre TIMESTAMP,
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `, { type: QueryTypes.RAW });
        console.log('✅ Verificación/Creación de la tabla "provisiones" completada.');
    } catch (error) {
        console.error('⚠️ Aviso al verificar la tabla provisiones:', error.message);
    }
}

// Función para crear un administrador si la tabla está vacía
async function crearAdminPorDefecto() {
    try {
        const adminExistente = await usuario.findOne({ where: { username: 'admin' } });
        
        if (!adminExistente) {
            console.log('⚠️ No existe el usuario admin. Creando administrador por defecto...');
            
            const passwordPlana = '123456';
            const salt = await bcrypt.genSalt(10);
            const passwordEncriptada = await bcrypt.hash(passwordPlana, salt);

            await usuario.create({
                username: 'admin',
                dni: '00000000',
                apellido: 'Sistema',
                nombres: 'Administrador',
                email: 'admin@defensacivil.com',
                celular: '0000000000',
                password: passwordEncriptada,
                rol: 'Administrador'
            });
            
            console.log('✅ ¡Administrador por defecto creado con éxito!');
        } else {
            console.log('ℹ️ El usuario administrador ya existe en la base de datos.');
        }
    } catch (error) {
        console.error('⚠️ Aviso menor al verificar/crear el admin (el servidor continuará):', error.message);
    }
}

async function iniciarServidor() {
    try {
        console.log('🔄 Intentando conectar a la base de datos...');
        await sequelize.authenticate();
        console.log('✅ Conexión a la base de datos establecida.');
        
        
        await asegurarTablaDocumentacion();
        await asegurarColumnasRelevamientos();
        await crearAdminPorDefecto();
        await asegurarTablaProvisiones();
        await asegurarTablaFamilias();
        await asegurarTablaNecesidadesFamilia();

        await sequelize.sync();
        console.log('✅ Sincronización de modelos completada.');

        await crearAdminPorDefecto();

        app.listen(PORT, () => {
            console.log(`📡 Servidor corriendo en el puerto ${PORT}`);
        });
        
    } catch (error) {
        console.error('❌ ERROR CRÍTICO DE CONEXIÓN O ARRANQUE:', error);
    }
}
// Función para asegurar las columnas y campos de fecha en la tabla relevamientos
async function asegurarColumnasRelevamientos() {
    try {
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS relevamientos (
                id SERIAL PRIMARY KEY,
                codigo_relevamiento VARCHAR(255),
                departamento VARCHAR(255),
                localidad VARCHAR(255),
                barrio VARCHAR(255),
                tipo_evento VARCHAR(255),
                solicitante VARCHAR(255),
                relevador_asignado VARCHAR(255),
                prioridad VARCHAR(255) DEFAULT 'Baja',
                estado VARCHAR(50) DEFAULT 'nuevo',
                observaciones TEXT,
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            ALTER TABLE relevamientos ADD COLUMN IF NOT EXISTS codigo_relevamiento VARCHAR(255);
            ALTER TABLE relevamientos ADD COLUMN IF NOT EXISTS prioridad VARCHAR(255) DEFAULT 'Baja';
            ALTER TABLE relevamientos ADD COLUMN IF NOT EXISTS barrio VARCHAR(255);
            ALTER TABLE relevamientos ADD COLUMN IF NOT EXISTS solicitante VARCHAR(255);
            ALTER TABLE relevamientos ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
            ALTER TABLE relevamientos ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        `, { type: QueryTypes.RAW });
        console.log('✅ Verificación/Actualización completa de la tabla "relevamientos" y sus columnas.');
    } catch (error) {
        console.error('⚠️ Aviso al verificar columnas de relevamientos:', error.message);
    }
}
// Función para verificar y crear/actualizar la tabla familias y sus columnas en PostgreSQL
async function asegurarTablaFamilias() {
    try {
        // 1. Creamos la tabla base con los campos mínimos si no existe
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS familias (
                id_familia SERIAL PRIMARY KEY,
                jefe_familia VARCHAR(255),
                dni_jefe VARCHAR(50),
                telefono VARCHAR(50),
                direccion VARCHAR(255),
                cantidad_integrantes INTEGER DEFAULT 1,
                danos_estructurales BOOLEAN DEFAULT FALSE,
                requiere_evacuacion BOOLEAN DEFAULT FALSE,
                observaciones TEXT,
                id_relevamiento INTEGER,
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `, { type: QueryTypes.RAW });

        // 2. Agregamos de forma segura todas las columnas nuevas del formulario que faltaban
        await sequelize.query(`
            ALTER TABLE familias ADD COLUMN IF NOT EXISTS mayores INTEGER DEFAULT 1;
            ALTER TABLE familias ADD COLUMN IF NOT EXISTS menores INTEGER DEFAULT 0;
            ALTER TABLE familias ADD COLUMN IF NOT EXISTS urgencia_familiar VARCHAR(50);
            ALTER TABLE familias ADD COLUMN IF NOT EXISTS dano_techo BOOLEAN DEFAULT FALSE;
            ALTER TABLE familias ADD COLUMN IF NOT EXISTS dano_paredes BOOLEAN DEFAULT FALSE;
            ALTER TABLE familias ADD COLUMN IF NOT EXISTS dano_pisos BOOLEAN DEFAULT FALSE;
            ALTER TABLE familias ADD COLUMN IF NOT EXISTS dano_instalaciones BOOLEAN DEFAULT FALSE;
            ALTER TABLE familias ADD COLUMN IF NOT EXISTS unidades_alimentarias INTEGER DEFAULT 0;
            ALTER TABLE familias ADD COLUMN IF NOT EXISTS abrigos INTEGER DEFAULT 0;
            ALTER TABLE familias ADD COLUMN IF NOT EXISTS frazadas INTEGER DEFAULT 0;
            ALTER TABLE familias ADD COLUMN IF NOT EXISTS bidones_agua INTEGER DEFAULT 0;
            ALTER TABLE familias ADD COLUMN IF NOT EXISTS kits_higiene INTEGER DEFAULT 0;
            ALTER TABLE familias ADD COLUMN IF NOT EXISTS ropa INTEGER DEFAULT 0;
            ALTER TABLE familias ADD COLUMN IF NOT EXISTS colchones INTEGER DEFAULT 0;
        `, { type: QueryTypes.RAW });

        console.log('✅ Verificación y actualización de la tabla "familias" y sus columnas completada.');
    } catch (error) {
        console.error('⚠️ Aviso al verificar la tabla familias:', error.message);
    }
}
// Función para verificar y crear la tabla necesidades_familia si no existe
async function asegurarTablaNecesidadesFamilia() {
    try {
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS necesidades_familia (
                id_necesidad SERIAL PRIMARY KEY,
                id_familia INTEGER REFERENCES familias(id_familia) ON DELETE CASCADE,
                tipo_material VARCHAR(100) NOT NULL,
                cantidad INTEGER NOT NULL DEFAULT 1,
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `, { type: QueryTypes.RAW });
        console.log('✅ Verificación/Creación de la tabla "necesidades_familia" completada.');
    } catch (error) {
        console.error('⚠️ Aviso al verificar la tabla necesidades_familia:', error.message);
    }
}
iniciarServidor();