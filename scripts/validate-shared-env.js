import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const envPath = path.join(projectRoot, 'backend', '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
    throw new Error('Falta backend/.env. Copia backend/.env.example y configura sus valores para el servidor LAN.');
}

const checks = [
    ['DB_PASSWORD', 16],
    ['JWT_SECRET', 32],
    ['ADMIN_INITIAL_PASSWORD', 12]
];

for (const [name, minimumLength] of checks) {
    const value = process.env[name];
    if (!value || value.length < minimumLength || /CAMBIAR/i.test(value) || value === 'defcivil_local' || value === '123456') {
        throw new Error(`${name} debe reemplazarse por un valor propio de al menos ${minimumLength} caracteres antes de iniciar el servidor compartido.`);
    }
}

if (process.env.DATABASE_URL?.trim()) {
    throw new Error('Comenta o elimina DATABASE_URL en backend/.env para usar la base PostgreSQL del Compose local.');
}

const dataDirectory = process.env.APP_DATA_DIR || 'D:/DefCivil/data';
if (!path.win32.isAbsolute(dataDirectory)) {
    throw new Error('APP_DATA_DIR debe ser una ruta absoluta de Windows, por ejemplo D:/DefCivil/data.');
}

const port = Number(process.env.APP_HOST_PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('APP_HOST_PORT debe ser un puerto entre 1 y 65535.');
}

console.log(`Configuración LAN validada. Los datos se guardarán en ${dataDirectory}.`);
