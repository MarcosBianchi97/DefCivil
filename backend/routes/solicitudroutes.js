import express from 'express';
import { 
    obtenerEnEspera, 
    enviarSolicitud, 
    obtenerHistorialSolicitudes 
} from '../controllers/solicitudcontroller.js';

const router = express.Router();

// 1. Obtener relevamientos en espera (deriva al controlador corregido)
router.get('/en-espera', obtenerEnEspera);

// 2. Enviar solicitud y generar provisión (deriva al controlador)
router.post('/', enviarSolicitud);

// 3. Obtener el historial de solicitudes enviadas (deriva al controlador)
router.get('/historial', obtenerHistorialSolicitudes);

export default router;