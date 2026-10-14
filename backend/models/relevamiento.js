// backend/models/Relevamiento.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Relevamiento = sequelize.define('Relevamiento', {
    // 1. ID Técnico interno para la BD (Relaciones y claves primarias)
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'id'
    },
    // 2. Código visible amigable (Ej: CAP-SDE-001-26)
    codigo_relevamiento: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    departamento: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    localidad: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    barrio: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    tipo_evento: {
        type: DataTypes.STRING(100),
        allowNull: false // Ej: Inundación, Incendio, Temporal
    },
    solicitante: {
        type: DataTypes.STRING(150),
        allowNull: false // Quién realiza el pedido/reclamo
    },
    relevador_asignado: {
        type: DataTypes.STRING(150),
        allowNull: false // Para filtrar rápidamente por operador
    },
    prioridad: {
        type: DataTypes.ENUM('Baja', 'Media', 'Alta', 'Urgente'),
        allowNull: false,
        defaultValue: 'Media'
    },
    estado: {
        type: DataTypes.ENUM(
            'nuevo',          // Inicio
            'en-espera',      // Solicitud enviada, esperando aprobación
            'en-proceso',     // Cargando familias
            'completado',     // El relevador terminó su trabajo (Bloquea edición)
            'derivado',       // Se envía a otra entidad (Bomberos, Muni, etc.)
            'finalizado',     // Entrega de provisiones y archivo total
            'cancelado'       // Baja por cambio de entidad o decisión administrativa
        ),
        allowNull: false,
        defaultValue: 'nuevo'
    },
    observaciones: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'relevamientos', // Nombre explícito de la tabla en PostgreSQL
    timestamps: true,            // Mantiene createdAt y updatedAt
    createdAt: 'createdAt', // Coincide con la columna exacta en Render
    updatedAt: 'updatedAt', // Coincide con la columna exacta en Render
    underscored: false
});

export default Relevamiento;