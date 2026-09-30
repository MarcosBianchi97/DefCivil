import bcrypt from "bcryptjs";
import Usuario from "../models/Usuario.js";

// Gestiona únicamente cuentas con rol "admin": es el reemplazo directo de
// localStorage["usuarios_app"] en js/admin.js. Los superadmin no se administran
// desde acá (no hay pantalla para eso en el panel actual).
const ATRIBUTOS_PUBLICOS = ["id", "nombre", "usuario", "rol", "activo", "createdAt"];

export async function listar(req, res) {
  try {
    const usuarios = await Usuario.findAll({
      where: { rol: "admin" },
      attributes: ATRIBUTOS_PUBLICOS,
      order: [["createdAt", "ASC"]],
    });
    res.json({ usuarios });
  } catch (error) {
    console.error("Error al listar usuarios:", error);
    res.status(500).json({ mensaje: "Error en el servidor al listar usuarios." });
  }
}

export async function crear(req, res) {
  try {
    const { nombre, usuario, password } = req.body;
    if (!nombre || !usuario || !password) {
      return res.status(400).json({ mensaje: "Nombre, usuario y contraseña son obligatorios." });
    }
    if (password.length < 6) {
      return res.status(400).json({ mensaje: "La contraseña debe tener al menos 6 caracteres." });
    }

    const existente = await Usuario.findOne({ where: { usuario } });
    if (existente) {
      return res.status(409).json({ mensaje: "Ese nombre de usuario ya existe." });
    }

    const nuevo = await Usuario.create({
      nombre,
      usuario,
      password: await bcrypt.hash(password, 10),
      rol: "admin",
      activo: true,
    });

    res.status(201).json({
      mensaje: "Administrador agregado correctamente.",
      usuario: { id: nuevo.id, nombre: nuevo.nombre, usuario: nuevo.usuario, rol: nuevo.rol, activo: nuevo.activo },
    });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(500).json({ mensaje: "Error en el servidor al crear el usuario." });
  }
}

export async function actualizar(req, res) {
  try {
    const { id } = req.params;
    const { nombre, usuario, password } = req.body;

    const encontrado = await Usuario.findOne({ where: { id, rol: "admin" } });
    if (!encontrado) {
      return res.status(404).json({ mensaje: "Administrador no encontrado." });
    }

    if (usuario && usuario !== encontrado.usuario) {
      const existente = await Usuario.findOne({ where: { usuario } });
      if (existente) {
        return res.status(409).json({ mensaje: "Ese nombre de usuario ya existe." });
      }
      encontrado.usuario = usuario;
    }

    if (nombre) encontrado.nombre = nombre;

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ mensaje: "La contraseña debe tener al menos 6 caracteres." });
      }
      encontrado.password = await bcrypt.hash(password, 10);
    }

    await encontrado.save();
    res.json({
      mensaje: "Administrador actualizado correctamente.",
      usuario: { id: encontrado.id, nombre: encontrado.nombre, usuario: encontrado.usuario, rol: encontrado.rol, activo: encontrado.activo },
    });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({ mensaje: "Error en el servidor al actualizar el usuario." });
  }
}

export async function eliminar(req, res) {
  try {
    const { id } = req.params;
    const encontrado = await Usuario.findOne({ where: { id, rol: "admin" } });
    if (!encontrado) {
      return res.status(404).json({ mensaje: "Administrador no encontrado." });
    }

    await encontrado.destroy();
    res.json({ mensaje: "Administrador dado de baja." });
  } catch (error) {
    console.error("Error al dar de baja usuario:", error);
    res.status(500).json({ mensaje: "Error en el servidor al dar de baja el usuario." });
  }
}
