// backend/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'mi_clave_unica_defensa_civil';

// 1. Middleware para verificar que el usuario envió un token JWT válido
export const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return res.status(401).json({ success: false, message: 'Acceso denegado. No se proporcionó token.' });
    }

    const token = authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ success: false, message: 'Token malformado.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; 
        next();
    } catch (error) {
        // 🔎 Agregamos esto para ver el motivo exacto en los logs de Render
        console.error("❌ Error detallado al verificar JWT:", error.message);
        return res.status(403).json({ success: false, message: 'Token inválido o expirado.' });
    }
};

// 2. Middleware para controlar el acceso por roles a secciones/recursos específicos
export const verificarRolPermitido = (seccionRequerida) => {
    return (req, res, next) => {
        // Normalizamos quitando espacios, pero mantenemos la consistencia
        const rolUsuario = req.user && req.user.rol ? String(req.user.rol).trim().toLowerCase() : '';
        
        const permisos = {
            administrador: ['usuarios', 'relevamientos', 'familias', 'relevadores', 'solicitudes', 'provisiones'],
            operador: ['relevamientos', 'familias', 'solicitudes', 'provisiones'],
            relevador: ['relevamientos', 'familias'],
            consulta: ['relevamientos']
        };

        // Verificamos si es administrador (cubriendo 'administrador' y 'admin' por seguridad estructural)
        if (rolUsuario === 'administrador' || rolUsuario === 'admin' || (permisos[rolUsuario] && permisos[rolUsuario].includes(seccionRequerida))) {
            next();
        } else {
            console.warn(`❌ Acceso denegado para el rol: "${rolUsuario}" en la sección: "${seccionRequerida}"`);
            res.status(403).json({ success: false, message: 'Acceso no autorizado para este rol en esta sección.' });
        }
    };
};