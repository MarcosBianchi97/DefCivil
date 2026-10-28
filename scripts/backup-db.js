import { spawn } from 'child_process';
import { createWriteStream } from 'fs';
import { mkdir, rm } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { pipeline } from 'stream/promises';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
dotenv.config({ path: path.join(projectRoot, 'backend', '.env') });

const dataDirectory = process.env.APP_DATA_DIR || 'D:/DefCivil/data';
const backupDirectory = path.join(dataDirectory, 'backups');
const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const backupPath = path.join(backupDirectory, `defcivil-${timestamp}.dump`);

await mkdir(backupDirectory, { recursive: true });

const docker = spawn('docker', [
    'compose',
    '--env-file',
    'backend/.env',
    'exec',
    '-T',
    'postgres',
    'pg_dump',
    '--format=custom',
    '--no-owner',
    '--no-acl',
    '--username',
    process.env.DB_USER || 'defcivil',
    '--dbname',
    process.env.DB_NAME || 'defcivil_local'
], {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'inherit']
});

const completed = new Promise((resolve, reject) => {
    docker.once('error', reject);
    docker.once('close', (code) => {
        if (code === 0) {
            resolve();
        } else {
            reject(new Error(`pg_dump terminó con código ${code ?? 'desconocido'}.`));
        }
    });
});

try {
    await Promise.all([
        pipeline(docker.stdout, createWriteStream(backupPath, { flags: 'wx' })),
        completed
    ]);
    console.log(`Copia de PostgreSQL creada: ${backupPath}`);
} catch (error) {
    docker.kill();
    await rm(backupPath, { force: true });
    throw error;
}
