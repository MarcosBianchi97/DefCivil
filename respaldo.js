import fs from 'fs';
import pkg from 'pg';
const { Client } = pkg;

// Usamos la misma URL de conexión externa de Render
const connectionString = "postgresql://dfc_db_user:Y9SZGzJN877KNo2q96zeKlErO2BRHoeW@dpg-d9bp3a6q1p3s73bgkrjg-a.oregon-postgres.render.com/dfc_db";

async function exportarBaseDeDatos() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    try {
        await client.connect();
        
        // Obtenemos las tablas principales que vimos en tu captura
        const tablas = ['familias', 'provisiones', 'relevadores', 'relevamientos', 'usuarios'];
        const backupData = {};

        for (const tabla of tablas) {
            const res = await client.query(`SELECT * FROM ${tabla}`);
            backupData[tabla] = res.rows;
        }

        fs.writeFileSync('backup_completo.json', JSON.stringify(backupData, null, 2));
        console.log('¡Éxito! Datos guardados en backup_completo.json');
    } catch (error) {
        console.error('Error al exportar:', error);
    } finally {
        await client.end();
    }
}

exportarBaseDeDatos();