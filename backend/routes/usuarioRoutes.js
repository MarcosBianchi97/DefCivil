import express from "express";
import { listar, crear, actualizar, eliminar } from "../controllers/usuarioController.js";
import { verificarToken, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// Toda la gestión de usuarios admin es exclusiva de superadmin,
// igual que hoy el botón "Gestionar usuarios" solo aparece para ese rol.
router.use(verificarToken, requireRole("superadmin"));

router.get("/", listar);
router.post("/", crear);
router.put("/:id", actualizar);
router.delete("/:id", eliminar);

export default router;
