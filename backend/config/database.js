import { Sequelize } from "sequelize";

const {
  DB_DIALECT = "postgres",
  DB_STORAGE = "./dev.sqlite",
  DATABASE_URL,
  DB_HOST = "localhost",
  DB_PORT = 5432,
  DB_NAME = "defensa_civil",
  DB_USER = "postgres",
  DB_PASSWORD = "",
} = process.env;

// DB_DIALECT=sqlite es solo para arrancar rápido en desarrollo local sin instalar/configurar
// Postgres (no requiere servidor ni credenciales). Para producción o para compartir datos
// entre desarrolladores, usar DB_DIALECT=postgres (default) con una base real.
let sequelize;

if (DB_DIALECT === "sqlite") {
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: DB_STORAGE,
    logging: false,
  });
} else if (DATABASE_URL) {
  // DATABASE_URL tiene prioridad sobre las variables sueltas (util para plataformas de
  // hosting tipo Render/Railway que la proveen ya armada).
  sequelize = new Sequelize(DATABASE_URL, {
    dialect: "postgres",
    logging: false,
    dialectOptions: DATABASE_URL.includes("localhost")
      ? {}
      : { ssl: { require: true, rejectUnauthorized: false } },
  });
} else {
  sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: "postgres",
    logging: false,
  });
}

export default sequelize;
