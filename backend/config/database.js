import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Conexión limpia y directa usando las variables de entorno independientes de Render
const sequelize = new Sequelize(
    'postgres', 
    'postgres.mmlrvjdukspztwabghnu', 
    process.env.DB_PASSWORD, 
    {
        host: 'aws-0-us-west-2.pooler.supabase.com',
        port: 6543,
        dialect: 'postgres',
        protocol: 'postgres',
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
    }
);

export default sequelize;