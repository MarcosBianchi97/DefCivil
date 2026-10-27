import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && !process.env.DB_PASSWORD) {
    console.error('❌ Falta DB_PASSWORD. Configura backend/.env y reinicia el servidor.');
    process.exit(1);
}

const sequelize = databaseUrl
    ? new Sequelize(databaseUrl, {
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        define: {
            timestamps: true,
            underscored: true
        }
    })
    : new Sequelize(
        process.env.DB_NAME || 'defcivil_local',
        process.env.DB_USER || 'defcivil',
        process.env.DB_PASSWORD,
        {
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT || 5432),
            dialect: 'postgres',
            logging: false,
            pool: {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000
            },
            define: {
                timestamps: true,
                underscored: true
            }
        }
    );

export default sequelize;