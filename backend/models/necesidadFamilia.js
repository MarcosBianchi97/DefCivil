// backend/models/necesidadFamilia.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import familia from './familia.js';

const necesidadFamilia = sequelize.define('necesidad_familia', {
    id_necesidad: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_familia: { // <--- ESTO ES LO QUE FALTABA DECLARAR AQUÍ
        type: DataTypes.INTEGER,
        allowNull: false
    },
    tipo_material: {
        type: DataTypes.STRING(100),
        allowNull: false // Lo que viene del menú desplegable (ej: "Chapas de zinc", "Tirantes de madera", etc.)
    },
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    }
}, {
    tableName: 'necesidades_familia',
    timestamps: true,
    createdAt: 'createdAt', // <-- FUERZA ESTO
  updatedAt: 'updatedAt', // <-- FUERZA ESTO
  underscored: false      // <-- Y ESTO ES LO MÁS IMPORTANTE
});

// 🌟 Relación: Una familia tiene muchas necesidades, una necesidad pertenece a una familia
familia.hasMany(necesidadFamilia, { foreignKey: 'id_familia', onDelete: 'CASCADE', as: 'necesidades' });
necesidadFamilia.belongsTo(familia, { foreignKey: 'id_familia' });

export default necesidadFamilia;