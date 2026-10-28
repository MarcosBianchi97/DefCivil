import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
dotenv.config({ path: path.join(projectRoot, 'backend', '.env') });

const database = process.env.DB_NAME || 'defcivil_local';
const user = process.env.DB_USER || 'defcivil';

if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(database) || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(user)) {
    throw new Error('DB_NAME y DB_USER deben ser identificadores simples de PostgreSQL.');
}

if (database === 'postgres' || database === 'template0' || database === 'template1') {
    throw new Error(`Se rechaza reiniciar la base protegida "${database}".`);
}

const compose = (...args) => execFileSync('docker', [
    'compose',
    '--env-file',
    'backend/.env',
    ...args
], { cwd: projectRoot, stdio: 'inherit' });

console.warn(`Esto borrará todos los registros de "${database}". Las copias de seguridad en D: no se borran.`);
compose('up', '-d', 'postgres');
try {
    compose('stop', 'backend');
    compose('exec', '-T', 'postgres', 'dropdb', '--if-exists', '--force', '--username', user, '--maintenance-db', 'postgres', database);
    compose('exec', '-T', 'postgres', 'createdb', '--username', user, '--owner', user, database);
} finally {
    compose('up', '-d', 'backend');
}

console.log(`Base "${database}" recreada. Los archivos de respaldo se conservaron.`);
