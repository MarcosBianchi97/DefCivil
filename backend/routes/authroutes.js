// backend/routes/authRoutes.js
import express from 'express';
import { registrar, login, cambiarPassword } from '../controllers/authcontroller.js';
import { verificarToken } from '../middleware/auth.js'; // 👈 Asegúrate de importar el middleware que valida el token

const router = express.Router();

router.post('/register', registrar);      // POST http://localhost:3000/api/auth/register
router.post('/login', login);             // POST http://localhost:3000/api/auth/login

// 🟢 Añadimos verificarToken para que la ruta esté protegida y procese el usuario autenticado
router.post('/cambiar-password', verificarToken, cambiarPassword); 

export default router;