import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// Roles del panel admin de este sitio (admin / superadmin), tal como los usa hoy
// js/admin.js vía sessionStorage["dc_rol"]. No coinciden con los roles de DefCiv-3.0
// (Administrador/Operador/Relevador/Consulta) — al integrar ambos backends hace falta
// un mapeo explícito de roles, no asumir que son el mismo enum.
const Usuario = sequelize.define(
  "Usuario",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    usuario: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    rol: {
      type: DataTypes.ENUM("admin", "superadmin"),
      allowNull: false,
      defaultValue: "admin",
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "usuarios",
    timestamps: true,
  }
);

export default Usuario;
