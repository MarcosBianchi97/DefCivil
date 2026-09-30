import express from "express";
import { login, me, cambiarPassword } from "../controllers/authController.js";
import { verificarToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", login); // POST /api/auth/login
router.get("/me", verificarToken, me); // GET /api/auth/me
router.post("/cambiar-password", verificarToken, cambiarPassword); // POST /api/auth/cambiar-password

export default router;
