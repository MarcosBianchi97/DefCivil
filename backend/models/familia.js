import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import relevamiento from './relevamiento.js';
import documentacion from './Documentacion.js';

const familia = sequelize.define('familia', {
    id_familia: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'id_familia'
    },
    id_relevamiento: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'id_relevamiento' // Mapeo explícito por si la columna existe en la BD
    },
    jefe_familia: {
        type: DataTypes.STRING(150),
        allowNull: false,
        field: 'jefe_familia'
    },
    dni_jefe: {
        type: DataTypes.STRING(20),
        allowNull: false,
        field: 'dni_jefe'
    },
    telefono: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'telefono'
    },
    direccion: {
        type: DataTypes.STRING(200),
        allowNull: false,
        field: 'direccion'
    },
    mayores: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        field: 'mayores'
    },
    menores: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'menores'
    },
    cantidad_integrantes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        field: 'cantidad_integrantes'
    },
    urgencia_familiar: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'urgencia_familiar'
    },
    dano_techo: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'dano_techo'
    },
    dano_paredes: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'dano_paredes'
    },
    dano_pisos: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'dano_pisos'
    },
    dano_instalaciones: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'dano_instalaciones'
    },
    danos_estructurales: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'danos_estructurales'
    },
    requiere_evacuacion: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'requiere_evacuacion'
    },
    unidades_alimentarias: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'unidades_alimentarias'
    },
    abrigos: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'abrigos'
    },
    frazadas: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'frazadas'
    },
    bidones_agua: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'bidones_agua'
    },
    kits_higiene: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'kits_higiene'
    },
    ropa: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'ropa'
    },
    colchones: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'colchones'
    },
    observaciones: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'observaciones'
    }
}, {
    tableName: 'familias',
    timestamps: true,
    createdAt: 'createdAt', // Debe coincidir con cómo se creó en la BD
    updatedAt: 'updatedAt'  // Debe coincidir con cómo se creó en la BD
});

// Relaciones
relevamiento.hasMany(familia, { foreignKey: 'id_relevamiento', onDelete: 'CASCADE' });
familia.belongsTo(relevamiento, { foreignKey: 'id_relevamiento' });

familia.hasMany(documentacion, { foreignKey: 'id_familia', as: 'documentacion', onDelete: 'CASCADE' });
documentacion.belongsTo(familia, { foreignKey: 'id_familia' });

export default familia;