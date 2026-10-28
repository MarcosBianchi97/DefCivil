import express from 'express';
import { obtenerEstadisticasPublicas, obtenerEstadisticasMapa } from '../controllers/estadisticasController.js';

const router = express.Router();

router.get('/publicas', obtenerEstadisticasPublicas);
router.get('/mapa', obtenerEstadisticasMapa);

export default router;
