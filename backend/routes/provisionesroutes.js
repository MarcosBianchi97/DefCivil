import express from 'express';
import { obtenerProvisiones, cerrarProvision } from '../controllers/provisioncontroller.js';
import { QueryTypes } from 'sequelize';
import sequelize from '../config/database.js';

const router = express.Router();

// GET /api/provisiones - Listar todas las provisiones con LEFT JOIN
router.get('/', obtenerProvisiones);

// POST /api/provisiones - Registrar provisión
router.post('/', async (req, res) => {
    const { solicitud_id, detalle, destino } = req.body;
    try {
        await sequelize.query(
            'INSERT INTO provisiones (solicitud_id, detalle, destino, estado) VALUES (?, ?, ?, "Enviado")',
            { replacements: [solicitud_id, detalle, destino], type: QueryTypes.INSERT }
        );
        res.json({ success: true, message: 'Provisión registrada y enviada para entrega.' });
    } catch (error) {
        console.error('Error al registrar provisión:', error);
        res.status(500).json({ success: false, message: 'Error al registrar la provisión' });
    }
});

// PUT /api/provisiones/:id/cerrar - Cerrar circuito
router.put('/:id/cerrar', cerrarProvision);

export default router;