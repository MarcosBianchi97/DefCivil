import Alerta from "../models/Alerta.js";

const NIVELES = ["verde", "amarillo", "naranja", "rojo"];
const MAX_MENSAJE = 300;

// GET /api/alerta (sin auth): la consume js/sync.js del sitio público.
// Si todavía nadie fijó un nivel, devuelve alerta: null y el sitio no marca ninguno como vigente.
export async function obtener(req, res) {
  try {
    const fila = await Alerta.findByPk(1);
    res.json({
      alerta: fila
        ? { nivel: fila.nivel, mensaje: fila.mensaje, actualizadaEl: fila.updatedAt }
        : null,
    });
  } catch (error) {
    console.error("Error al obtener el nivel de alerta:", error);
    res.status(500).json({ mensaje: "Error en el servidor al obtener el nivel de alerta." });
  }
}

// PUT /api/alerta (superadmin): { nivel, mensaje? }
export async function actualizar(req, res) {
  try {
    const { nivel } = req.body || {};
    const mensaje = typeof req.body?.mensaje === "string" ? req.body.mensaje.trim() : "";

    if (!NIVELES.includes(nivel)) {
      return res.status(400).json({ mensaje: "El nivel de alerta debe ser verde, amarillo, naranja o rojo." });
    }
    if (mensaje.length > MAX_MENSAJE) {
      return res.status(400).json({ mensaje: `El mensaje no puede superar los ${MAX_MENSAJE} caracteres.` });
    }

    const [fila] = await Alerta.findOrCreate({ where: { id: 1 }, defaults: { nivel } });
    await fila.update({ nivel, mensaje: mensaje || null, actualizadoPor: req.user.usuario || null });

    res.json({
      mensaje: "Nivel de alerta actualizado.",
      alerta: { nivel: fila.nivel, mensaje: fila.mensaje, actualizadaEl: fila.updatedAt },
    });
  } catch (error) {
    console.error("Error al actualizar el nivel de alerta:", error);
    res.status(500).json({ mensaje: "Error en el servidor al actualizar el nivel de alerta." });
  }
}
