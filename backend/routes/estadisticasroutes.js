import express from 'express';
import { obtenerEstadisticasPublicas, obtenerEstadisticasMapa } from '../controllers/estadisticascontroller.js';

const router = express.Router();

router.get('/publicas', obtenerEstadisticasPublicas);
router.get('/mapa', obtenerEstadisticasMapa);

export default router;
