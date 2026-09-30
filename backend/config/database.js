import { Sequelize } from "sequelize";

const {
  DATABASE_URL,
  DB_HOST = "localhost",
  DB_PORT = 5432,
  DB_NAME = "defensa_civil",
  DB_USER = "postgres",
  DB_PASSWORD = "",
} = process.env;

// DATABASE_URL tiene prioridad (util para plataformas de hosting tipo Render/Railway
// que la proveen ya armada); si no esta seteada, se arma la conexion con las variables sueltas.
const sequelize = DATABASE_URL
  ? new Sequelize(DATABASE_URL, {
      dialect: "postgres",
      logging: false,
      dialectOptions: DATABASE_URL.includes("localhost")
        ? {}
        : { ssl: { require: true, rejectUnauthorized: false } },
    })
  : new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
      host: DB_HOST,
      port: DB_PORT,
      dialect: "postgres",
      logging: false,
    });

export default sequelize;
