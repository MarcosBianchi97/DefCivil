import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// Mismo modelo de estados que tenía js/admin.js en localStorage["dc_noticias"]:
// pendiente -> aprobada (visible en el sitio público) -> eliminada (rechazada u ocultada).
// "autor" guarda el ROL de quien la creó/edita (siempre "admin", ya que solo ese rol
// puede escribir noticias), no el usuario puntual — así se preserva la regla original de
// que cualquier cuenta con rol admin puede editar noticias creadas por cualquier otra.
const Noticia = sequelize.define(
  "Noticia",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tag: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    titulo: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    imagen: {
      // Puede ser un nombre de archivo en img/ o un data: URL (imagen subida en base64).
      type: DataTypes.TEXT,
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM("pendiente", "aprobada", "eliminada"),
      allowNull: false,
      defaultValue: "pendiente",
    },
    autor: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    motivoRechazo: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    bajadaPorAdmin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    motivoBajada: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Snapshot del estado justo antes del último cambiarEstado(), para el botón
    // "Deshacer" del toast (ver noticiaController.js). snapshotExpira marca hasta cuándo
    // es válido deshacer — vencido eso, se ignora aunque el snapshot siga en la fila.
    snapshotPrevio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    snapshotExpira: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "noticias",
    timestamps: true,
  }
);

export default Noticia;
