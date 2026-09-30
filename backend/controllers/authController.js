import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

function datosPublicos(usuario) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    usuario: usuario.usuario,
    rol: usuario.rol,
  };
}

export async function login(req, res) {
  try {
    const { usuario, password } = req.body;
    if (!usuario || !password) {
      return res.status(400).json({ mensaje: "Usuario y contraseña son obligatorios." });
    }

    const encontrado = await Usuario.findOne({ where: { usuario } });
    if (!encontrado || !encontrado.activo) {
      return res.status(401).json({ mensaje: "Usuario o contraseña incorrectos." });
    }

    const passwordValida = await bcrypt.compare(password, encontrado.password);
    if (!passwordValida) {
      return res.status(401).json({ mensaje: "Usuario o contraseña incorrectos." });
    }

    const token = jwt.sign(
      { id: encontrado.id, usuario: encontrado.usuario, rol: encontrado.rol },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({ mensaje: "Login exitoso.", token, usuario: datosPublicos(encontrado) });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ mensaje: "Error en el servidor al iniciar sesión." });
  }
}

export async function me(req, res) {
  try {
    const encontrado = await Usuario.findByPk(req.user.id);
    if (!encontrado || !encontrado.activo) {
      return res.status(404).json({ mensaje: "Usuario no encontrado." });
    }
    res.json({ usuario: datosPublicos(encontrado) });
  } catch (error) {
    console.error("Error en me:", error);
    res.status(500).json({ mensaje: "Error en el servidor." });
  }
}

export async function cambiarPassword(req, res) {
  try {
    const { passwordActual, passwordNueva } = req.body;
    if (!passwordActual || !passwordNueva) {
      return res.status(400).json({ mensaje: "Todos los campos son obligatorios." });
    }
    if (passwordNueva.length < 6) {
      return res.status(400).json({ mensaje: "La nueva contraseña debe tener al menos 6 caracteres." });
    }

    const encontrado = await Usuario.findByPk(req.user.id);
    if (!encontrado) {
      return res.status(404).json({ mensaje: "Usuario no encontrado." });
    }

    const passwordValida = await bcrypt.compare(passwordActual, encontrado.password);
    if (!passwordValida) {
      return res.status(400).json({ mensaje: "La contraseña actual es incorrecta." });
    }

    encontrado.password = await bcrypt.hash(passwordNueva, 10);
    await encontrado.save();

    res.json({ mensaje: "Contraseña actualizada con éxito." });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    res.status(500).json({ mensaje: "Error en el servidor al cambiar la contraseña." });
  }
}
