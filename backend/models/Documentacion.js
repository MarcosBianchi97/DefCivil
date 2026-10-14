import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const documentacion = sequelize.define('documentacion', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'id' // Mapea exactamente con la columna 'id' real de Supabase
    },
    id_familia: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'familias',
            key: 'id_familia'
        },
        onDelete: 'CASCADE'
    },
    nombre_archivo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    ruta_archivo: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'documentacion_familias',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    underscored: false
});

export default documentacion;