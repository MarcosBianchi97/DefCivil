import jwt from "jsonwebtoken";

// A diferencia de DefCiv-3.0, acá no hay un valor por defecto para JWT_SECRET:
// app.js valida que exista antes de arrancar el servidor, así que si este código
// se ejecuta, process.env.JWT_SECRET siempre está definido.
const JWT_SECRET = process.env.JWT_SECRET;

export function verificarToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ mensaje: "Acceso denegado. No se proporcionó token." });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ mensaje: "Token malformado." });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    return res.status(403).json({ mensaje: "Token inválido o expirado." });
  }
}

export function requireRole(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ mensaje: "No tenés permisos para acceder a este recurso." });
    }
    next();
  };
}
