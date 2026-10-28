import express from "express";
import { obtener, actualizar } from "../controllers/alertaController.js";
import { verificarToken, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", obtener);
router.put("/", verificarToken, requireRole("superadmin"), actualizar);

export default router;
