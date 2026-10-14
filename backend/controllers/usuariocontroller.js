// backend/controllers/usuariocontroller.js
import bcrypt from 'bcryptjs';
import Usuario from '../models/usuario.js'; // 👈 Corregido: Importamos con 'Usuario' en mayúscula
import { Op } from 'sequelize'; 

// 1. Obtener todos los usuarios con soporte robusto de filtros por query params
export const obtenerUsuarios = async (req, res) => {
    try {
        const { rol, estado } = req.query;
        
        // Construimos un objeto de condiciones plano y seguro
        const filtros = {};

        if (rol) {
            filtros.rol = rol;
        }

        if (estado) {
            filtros.estado = estado;
        } else {
            // Si no se pide un estado específico, traemos todos menos los de baja
            filtros.estado = {
                [Op.ne]: 'Baja'
            };
        }

        const usuarios = await Usuario.findAll({
            where: filtros,
            attributes: ['id', 'username', 'dni', 'apellido', 'nombres', 'email', 'celular', 'rol', 'estado']
        });

        return res.json({ success: true, data: usuarios });
    } catch (error) {
        // Esto imprimirá en los logs de tu servidor el motivo exacto del fallo 500
        console.error('ERROR CRITICO EN obtenerUsuarios:', error.message, error.stack);
        return res.status(500).json({ success: false, message: 'Error interno del servidor: ' + error.message });
    }
};

// 2. Crear un nuevo usuario (Alta)
export const crearUsuario = async (req, res) => {
    const { username, dni, apellido, nombres, email, celular, rol } = req.body;

    // Validación de campos obligatorios
    if (!username || !dni || !apellido || !nombres || !celular || !rol) {
        return res.status(400).json({ 
            success: false, 
            message: 'Todos los campos marcados con (*) son obligatorios.' 
        });
    }

    try {
        // Verificar si ya existe un usuario con ese mismo username o DNI
        const existe = await Usuario.findOne({
            where: {
                [Op.or]: [{ username }, { dni }]
            }
        });

        if (existe) {
            return res.status(400).json({ 
                success: false, 
                message: 'El Nombre de Usuario o el DNI ya se encuentran registrados.' 
            });
        }

        // Encriptamos el DNI para usarlo como contraseña inicial
        const salt = await bcrypt.genSalt(10);
        // Nos aseguramos de pasar el DNI como string al encriptar
        const passwordEncriptada = await bcrypt.hash(dni.toString(), salt);

        // Guardamos en la base de datos usando el modelo
        // Sequelize maneja automáticamente: estado='Activo', requiereCambioPass=true (o requiere_cambio_pass=1), y los timestamps
        await Usuario.create({
            username,
            dni,
            apellido,
            nombres,
            email: email || null, 
            celular,
            password: passwordEncriptada, // 👈 Ojo: verificá que en tu modelo se llame 'passwordHash' y no 'password'
            rol
        });

        res.status(201).json({ 
            success: true, 
            message: 'Usuario creado con éxito. Su contraseña inicial provisoria es su número de DNI.' 
        });

    } catch (error) {
        console.error('Error al crear usuario con Sequelize:', error);
        res.status(500).json({ success: false, message: 'Error al procesar el alta en el servidor.' });
    }
};
// Función para actualizar los datos de un usuario
// Asegurate de que arriba de todo en tu controlador esté importado el modelo:
// import Usuario from '../models/usuario.js';

export const actualizarUsuario = async (req, res) => {
    const { id } = req.params;
    const { nombres, apellido, dni, email, celular, rol } = req.body;

    try {
        // Usamos la sintaxis oficial de Sequelize para actualizar
        const [rowsUpdated] = await Usuario.update(
            { nombres, apellido, dni, email, celular, rol },
            { where: { id: id } }
        );

        if (rowsUpdated === 0) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró el usuario o los datos son idénticos.'
            });
        }

        return res.json({
            success: true,
            message: 'Usuario actualizado correctamente.'
        });

    } catch (error) {
        console.error('Error al actualizar usuario en Sequelize:', error);
        return res.status(500).json({
            success: false,
            message: 'Hubo un error interno en el servidor al intentar actualizar.'
        });
    }
};