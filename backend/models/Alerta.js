import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// Nivel de alerta vigente del sitio público. Es una tabla de una sola fila (id = 1):
// reemplaza a localStorage["dc_alerta"], que nadie escribía. Los 4 niveles coinciden con
// las clases .alert-level (verde/amarillo/naranja/rojo) de index.html.
const Alerta = sequelize.define(
  "Alerta",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    nivel: {
      type: DataTypes.ENUM("verde", "amarillo", "naranja", "rojo"),
      allowNull: false,
      defaultValue: "verde",
    },
    // Texto opcional que reemplaza la descripción del nivel vigente en el sitio público.
    mensaje: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Usuario (login) del superadmin que hizo el último cambio.
    actualizadoPor: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    // La base es compartida con DefCivil: prefijo para no chocar con sus tablas.
    tableName: "alerta_vigente",
    timestamps: true,
  }
);

export default Alerta;
