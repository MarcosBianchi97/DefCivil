// backend/controllers/authController.js
import usuario from '../models/usuario.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// 1. REGISTRAR UN NUEVO USUARIO
export const registrar = async (req, res) => {
    try {
        const { username, dni, apellido, nombres, email, celular, password, rol } = req.body;

        if (!username || !dni || !apellido || !nombres || !celular || !password) {
            return res.status(400).json({ mensaje: 'Todos los campos obligatorios deben completarse.' });
        }

        const usuarioExiste = await usuario.findOne({ where: { username } });
        if (usuarioExiste) {
            return res.status(400).json({ mensaje: 'El nombre de usuario ya está registrado.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordEncriptada = await bcrypt.hash(password, salt);

        const nuevoUsuario = await usuario.create({
            username,
            dni,
            apellido,
            nombres,
            email,
            celular,
            password: passwordEncriptada,
            rol
        });

        res.status(201).json({
            mensaje: 'Usuario registrado con éxito.',
            usuario: { id: nuevoUsuario.id, username: nuevoUsuario.username, email: nuevoUsuario.email }
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ mensaje: 'Error en el servidor al registrar el usuario.' });
    }
};

// 2. INICIAR SESIÓN (LOGIN) - Totalmente alineado a tu tabla 'usuarios'
export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ mensaje: 'Nombre de usuario y contraseña requeridos.' });
        }

        const usuarioEncontrado = await usuario.findOne({ where: { username } });
        
        if (!usuarioEncontrado) {
            return res.status(400).json({ mensaje: 'Credenciales inválidas (Usuario no encontrado).' });
        }
        // Validar si el usuario está inactivo (cubre texto en mayúsculas/minúsculas o booleanos)
        const estadoUsuario = String(usuarioEncontrado.estado || '').trim().toLowerCase();
        if (estadoUsuario === 'inactivo' || usuarioEncontrado.estado === false || usuarioEncontrado.estado === 0) {
            return res.status(403).json({ mensaje: 'Su cuenta se encuentra inactiva. Contacte al administrador.' });
        }

        const passwordCorrecta = await bcrypt.compare(password, usuarioEncontrado.password);
        if (!passwordCorrecta) {
            return res.status(400).json({ mensaje: 'Credenciales inválidas (Contraseña incorrecta).' });
        }

        const JWT_SECRET = process.env.JWT_SECRET || 'mi_clave_unica_defensa_civil';
        
        // Usamos usuarioEncontrado.id (que Sequelize mapea a id_usuario)
        const token = jwt.sign(
            { id_usuario: usuarioEncontrado.id, rol: usuarioEncontrado.rol },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            mensaje: 'Login exitoso.',
            token,
            usuario: {
                id: usuarioEncontrado.id,
                nombres: usuarioEncontrado.nombres,   
                apellido: usuarioEncontrado.apellido, 
                rol: usuarioEncontrado.rol,
                requiereCambioPass: usuarioEncontrado.requiereCambioPass 
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ mensaje: 'Error en el servidor al intentar iniciar sesión.' });
    }
};

// 3. CAMBIAR CONTRASEÑA (PRIMERA VEZ O MANUAL)
export const cambiarPassword = async (req, res) => {
    try {
        const { id_usuario, passwordActual, passwordNueva } = req.body;

        if (!id_usuario || !passwordActual || !passwordNueva) {
            return res.status(400).json({ mensaje: 'Todos los campos son obligatorios.' });
        }

        const usuarioEncontrado = await usuario.findByPk(id_usuario);
        if (!usuarioEncontrado) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }

        const passwordCorrecta = await bcrypt.compare(passwordActual, usuarioEncontrado.password);
        if (!passwordCorrecta) {
            return res.status(400).json({ mensaje: 'La contraseña actual es incorrecta.' });
        }

        const salt = await bcrypt.genSalt(10);
        const nuevaPasswordEncriptada = await bcrypt.hash(passwordNueva, salt);

        usuarioEncontrado.password = nuevaPasswordEncriptada;
        usuarioEncontrado.requiereCambioPass = false; 
        usuarioEncontrado.fechaUltimoCambioPass = new Date(); 
        
        await usuarioEncontrado.save();

        res.json({ mensaje: 'Contraseña actualizada con éxito.' });

    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({ mensaje: 'Error en el servidor al cambiar la contraseña.' });
    }
};