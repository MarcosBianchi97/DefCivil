import Noticia from "../models/Noticia.js";

const CAMPOS_EDITABLES = ["tag", "titulo", "imagen", "descripcion", "fecha"];
const CAMPOS_ESTADO = ["estado", "motivoRechazo", "bajadaPorAdmin", "motivoBajada"];
// Un poco más que los 8s que dura el botón "Deshacer" en el toast del frontend, para
// tener margen de latencia de red antes de que el servidor lo de por vencido.
const VENTANA_DESHACER_MS = 10000;

function tomarCampos(body) {
  const datos = {};
  CAMPOS_EDITABLES.forEach((campo) => {
    if (body[campo] !== undefined) datos[campo] = body[campo];
  });
  return datos;
}

function faltaAlgunCampo(datos) {
  return CAMPOS_EDITABLES.some((campo) => !datos[campo]);
}

// Todas las cuentas con rol admin/superadmin ven el listado completo; el filtrado por
// estado/año/orden lo sigue haciendo el frontend, igual que cuando vivía en localStorage.
export async function listar(req, res) {
  try {
    const noticias = await Noticia.findAll({ order: [["fecha", "DESC"]] });
    res.json({ noticias });
  } catch (error) {
    console.error("Error al listar noticias:", error);
    res.status(500).json({ mensaje: "Error en el servidor al listar noticias." });
  }
}

// Sin autenticación: la consume el sitio público (js/sync.js) para el carrusel de noticias.
export async function listarPublicas(req, res) {
  try {
    const noticias = await Noticia.findAll({
      where: { estado: "aprobada" },
      attributes: ["id", "tag", "titulo", "imagen", "descripcion", "fecha"],
      order: [["fecha", "DESC"]],
    });
    res.json({ noticias });
  } catch (error) {
    console.error("Error al listar noticias públicas:", error);
    res.status(500).json({ mensaje: "Error en el servidor al listar noticias." });
  }
}

export async function crear(req, res) {
  try {
    const datos = tomarCampos(req.body);
    if (faltaAlgunCampo(datos)) {
      return res.status(400).json({ mensaje: "Faltan campos obligatorios de la noticia." });
    }

    const noticia = await Noticia.create({
      ...datos,
      estado: "pendiente",
      autor: req.user.rol,
    });

    res.status(201).json({ mensaje: "Noticia guardada y enviada a revisión.", noticia });
  } catch (error) {
    console.error("Error al crear noticia:", error);
    res.status(500).json({ mensaje: "Error en el servidor al crear la noticia." });
  }
}

// Editar siempre reenvía a revisión (vuelve a "pendiente"), igual que hacía cambiarEstado
// en el flujo viejo: una noticia aprobada que se edita deja de estar publicada hasta que
// superadmin la vuelva a aprobar.
export async function actualizar(req, res) {
  try {
    const noticia = await Noticia.findByPk(req.params.id);
    if (!noticia) {
      return res.status(404).json({ mensaje: "Noticia no encontrada." });
    }
    if (noticia.autor !== req.user.rol) {
      return res.status(403).json({ mensaje: "No podés editar esta noticia." });
    }

    const datos = tomarCampos(req.body);
    if (faltaAlgunCampo(datos)) {
      return res.status(400).json({ mensaje: "Faltan campos obligatorios de la noticia." });
    }

    Object.assign(noticia, datos, {
      estado: "pendiente",
      motivoRechazo: null,
      bajadaPorAdmin: false,
      motivoBajada: null,
    });
    await noticia.save();

    res.json({ mensaje: "Noticia actualizada y enviada a revisión.", noticia });
  } catch (error) {
    console.error("Error al actualizar noticia:", error);
    res.status(500).json({ mensaje: "Error en el servidor al actualizar la noticia." });
  }
}

// Reproduce la máquina de estados que tenía cambiarEstado() en js/admin.js, pero validada
// server-side según el rol de quien pide el cambio:
// - admin: solo puede bajar su propia noticia aprobada (vuelve a "pendiente", queda marcada
//   bajadaPorAdmin) o descartar una propia que todavía está pendiente ("eliminada").
// - superadmin: aprueba una pendiente, la rechaza (pendiente -> eliminada, con motivo
//   obligatorio) u oculta una ya publicada (aprobada -> eliminada, sin motivo obligatorio).
export async function cambiarEstado(req, res) {
  try {
    const noticia = await Noticia.findByPk(req.params.id);
    if (!noticia) {
      return res.status(404).json({ mensaje: "Noticia no encontrada." });
    }

    const { estado, motivo } = req.body;
    const rol = req.user.rol;
    const estadoAnterior = noticia.estado;

    const transicionValida =
      (rol === "admin" &&
        noticia.autor === "admin" &&
        ((estadoAnterior === "aprobada" && estado === "pendiente") ||
          (estadoAnterior === "pendiente" && estado === "eliminada"))) ||
      (rol === "superadmin" &&
        ((estadoAnterior === "pendiente" && estado === "aprobada") ||
          (estadoAnterior === "pendiente" && estado === "eliminada") ||
          (estadoAnterior === "aprobada" && estado === "eliminada")));

    if (!transicionValida) {
      return res.status(403).json({ mensaje: "No se puede aplicar ese cambio de estado desde acá." });
    }

    if (rol === "superadmin" && estadoAnterior === "pendiente" && estado === "eliminada" && !motivo) {
      return res.status(400).json({ mensaje: "El superadmin debe indicar un motivo de rechazo." });
    }

    // Guarda una foto del estado previo antes de pisarlo, para poder deshacer este
    // cambio puntual (no una pila de cambios — un deshacer nuevo pisa al anterior).
    const snapshotPrevio = {};
    CAMPOS_ESTADO.forEach((campo) => { snapshotPrevio[campo] = noticia[campo]; });
    noticia.snapshotPrevio = JSON.stringify(snapshotPrevio);
    noticia.snapshotExpira = new Date(Date.now() + VENTANA_DESHACER_MS);

    noticia.estado = estado;
    if (rol === "admin" && estadoAnterior === "aprobada" && estado === "pendiente") {
      noticia.bajadaPorAdmin = true;
      noticia.motivoBajada = motivo || "";
    } else if (estado === "eliminada" && motivo) {
      noticia.motivoRechazo = motivo;
    } else if (estado === "aprobada") {
      noticia.motivoRechazo = null;
      noticia.bajadaPorAdmin = false;
      noticia.motivoBajada = null;
    }
    await noticia.save();

    const mensajes = {
      aprobada: "Noticia aprobada y publicada.",
      eliminada: rol === "superadmin" ? "Noticia rechazada y ocultada." : "Noticia ocultada.",
    };
    res.json({ mensaje: mensajes[estado] || "Estado de la noticia actualizado.", noticia });
  } catch (error) {
    console.error("Error al cambiar estado de noticia:", error);
    res.status(500).json({ mensaje: "Error en el servidor al cambiar el estado de la noticia." });
  }
}

// Revierte el último cambiarEstado() de esta noticia, si todavía está dentro de la
// ventana de tiempo (ver VENTANA_DESHACER_MS). No valida rol contra la transición porque
// no es una transición manual — vuelve exactamente a como estaba, la haya dejado quien la
// haya dejado.
export async function deshacer(req, res) {
  try {
    const noticia = await Noticia.findByPk(req.params.id);
    if (!noticia) {
      return res.status(404).json({ mensaje: "Noticia no encontrada." });
    }

    const vencido = !noticia.snapshotExpira || new Date(noticia.snapshotExpira).getTime() < Date.now();
    if (!noticia.snapshotPrevio || vencido) {
      return res.status(400).json({ mensaje: "Ya pasó el tiempo para deshacer este cambio." });
    }

    const snapshotPrevio = JSON.parse(noticia.snapshotPrevio);
    CAMPOS_ESTADO.forEach((campo) => { noticia[campo] = snapshotPrevio[campo]; });
    noticia.snapshotPrevio = null;
    noticia.snapshotExpira = null;
    await noticia.save();

    res.json({ mensaje: "Cambio deshecho.", noticia });
  } catch (error) {
    console.error("Error al deshacer cambio de noticia:", error);
    res.status(500).json({ mensaje: "Error en el servidor al deshacer el cambio." });
  }
}

// Borrado definitivo (a diferencia de "eliminada", que es un estado reversible vía
// cambiarEstado/deshacer). superadmin puede borrar cualquier noticia; admin solo puede
// borrar las suyas propias y únicamente si ya están rechazadas/ocultas (estado
// "eliminada") — no puede tocar una que sigue pendiente o ya está publicada.
// El "deshacer" de esta acción NO pasa por acá: el frontend espera 8s antes de llamar a
// este endpoint, y si el usuario deshace antes, nunca se llega a pedir el borrado (ver
// deshacerCambioEstado/eliminarNoticiaDefinitivamente en js/admin.js) — no hay nada que
// revertir en la base porque todavía no se tocó.
export async function eliminar(req, res) {
  try {
    const noticia = await Noticia.findByPk(req.params.id);
    if (!noticia) {
      return res.status(404).json({ mensaje: "Noticia no encontrada." });
    }

    if (req.user.rol === "admin" && (noticia.autor !== "admin" || noticia.estado !== "eliminada")) {
      return res.status(403).json({
        mensaje: "Solo podés eliminar definitivamente tus propias noticias ya rechazadas.",
      });
    }

    await noticia.destroy();
    res.json({ mensaje: "Noticia eliminada definitivamente." });
  } catch (error) {
    console.error("Error al eliminar noticia:", error);
    res.status(500).json({ mensaje: "Error en el servidor al eliminar la noticia." });
  }
}
