import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js'; // Apunta a tu archivo de conexión

const Usuario = sequelize.define('Usuario', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'id_usuario' // Mapea al id_usuario real de tu base
    },
    username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    dni: {
        type: DataTypes.STRING(15),
        allowNull: false,
        unique: true
    },
    apellido: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    nombres: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true
    },
    celular: {
        type: DataTypes.STRING(30),
        allowNull: false
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'password_hash' 
    },
    rol: {
        type: DataTypes.ENUM('Administrador', 'Operador', 'Relevador', 'Consulta'),
        allowNull: false,
        defaultValue: 'Consulta'
    },
    estado: {
        type: DataTypes.ENUM('Activo', 'Inactivo', 'Baja'),
        allowNull: false,
        defaultValue: 'Activo'
    },
    requiereCambioPass: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'requiere_cambio_pass'
    },
    fechaUltimoCambioPass: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'fecha_ultimo_cambio_pass'
    },
    ultimoAcceso: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'ultimo_acceso'
    }
}, {
    tableName: 'usuarios',
    timestamps: true,
    createdAt: 'created_at', // Mapea exactamente a tu columna created_at
    updatedAt: 'updated_at'  // Mapea exactamente a tu columna updated_at
});

export default Usuario;