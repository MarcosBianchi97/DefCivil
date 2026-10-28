import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
dotenv.config({ path: path.join(projectRoot, 'backend', '.env') });

const dataDirectory = process.env.APP_DATA_DIR || 'D:/DefCivil/data';

for (const name of ['postgres', 'backups']) {
    const directory = path.join(dataDirectory, name);
    await mkdir(directory, { recursive: true });
    console.log(`Directorio de datos listo: ${directory}`);
}
