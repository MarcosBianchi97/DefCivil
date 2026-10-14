//backend/routes/relevamientoroutes.js
import express from 'express';
import { 
    obtenerrelevamientos, 
    crearrelevamiento, 
    obtenerRelevamientoPorId, 
    actualizarRelevamiento,
    eliminarRelevamiento,
    devolverRelevamiento,
    completarRelevamiento,
} from '../controllers/relevamientocontroller.js';
import { verificarToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Rutas protegidas y ordenadas del circuito
router.patch('/:id/devolver', verificarToken, devolverRelevamiento);
router.get('/', verificarToken, obtenerrelevamientos);
router.post('/', verificarToken, crearrelevamiento);
router.get('/:id', verificarToken, obtenerRelevamientoPorId);
router.put('/:id', verificarToken, actualizarRelevamiento);
router.delete('/:id', verificarToken, eliminarRelevamiento);
router.patch('/:id/completar', verificarToken, completarRelevamiento);

export default router;