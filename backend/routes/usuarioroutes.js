// backend/routes/usuarioroutes.js
import express from 'express';
import { obtenerUsuarios, crearUsuario } from '../controllers/usuariocontroller.js';
import Usuario from '../models/usuario.js'; 
import { verificarToken, verificarRolPermitido } from '../middleware/authMiddleware.js';

const router = express.Router();

// Ruta exclusiva para administradores: Obtener usuarios filtrados (ej: para selects de asignación)
// Ej: /api/usuarios/filtrados?rol=relevador&estado=Activo
router.get('/filtrados', verificarToken, verificarRolPermitido('Administrador'), obtenerUsuarios);

// Definimos los verbos HTTP para la gestión de usuarios
router.get('/', verificarToken, verificarRolPermitido('Administrador'), obtenerUsuarios);   // Ruta para listar usuarios
router.post('/', verificarToken, verificarRolPermitido('Administrador'), crearUsuario);    // Ruta para registrar el nuevo usuario (Alta)

// 🔄 Cambiar estado del usuario (Borrado Lógico)
router.put('/:id/estado', verificarToken, verificarRolPermitido('Administrador'), async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = await Usuario.findByPk(id);

        if (!usuario) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        }

        const nuevoEstado = usuario.estado === 'Activo' ? 'Inactivo' : 'Activo';
        usuario.estado = nuevoEstado;
        await usuario.save();

        res.json({
            success: true,
            message: `Usuario ${usuario.apellido} pasado a estado: ${nuevoEstado} con éxito.`
        });

    } catch (error) {
        console.error('Error al cambiar estado del usuario:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});

// 🌟 Actualizar datos y rol del usuario
router.put('/:id', verificarToken, verificarRolPermitido('Administrador'), async (req, res) => {
    try {
        const { id } = req.params;
        const { nombres, apellido, dni, email, celular, rol } = req.body;

        // Validamos que existan los datos esenciales antes de actualizar
        if (!nombres || !apellido || !dni || !rol) {
            return res.status(400).json({ success: false, message: 'Faltan campos obligatorios para la actualización.' });
        }

        // Usamos el modelo directamente de forma limpia y atómica
        const [updated] = await Usuario.update(
            { nombres, apellido, dni, email, celular, rol },
            { where: { id } }
        );

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        res.json({ success: true, message: 'Actualizado correctamente' });
    } catch (error) {
        console.error('Error en ruta PUT /:id:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;