import express from "express";
import {
  listar,
  listarPublicas,
  crear,
  actualizar,
  cambiarEstado,
  deshacer,
  eliminar,
} from "../controllers/noticiaController.js";
import { verificarToken, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// Sin auth: la usa el sitio público (js/sync.js). Va antes de router.use(verificarToken)
// para no quedar protegida.
router.get("/publicas", listarPublicas);

router.use(verificarToken, requireRole("admin", "superadmin"));

router.get("/", listar);
router.post("/", requireRole("admin"), crear);
router.put("/:id", requireRole("admin"), actualizar);
router.patch("/:id/estado", cambiarEstado);
router.post("/:id/deshacer", deshacer);
// eliminar valida el caso admin (solo propias y ya rechazadas) adentro del controller —
// superadmin no tiene restricción, así que acá alcanza con estar logueado como alguno
// de los dos roles (ya lo exige el router.use de arriba).
router.delete("/:id", eliminar);

export default router;
