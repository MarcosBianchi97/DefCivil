import { QueryTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ENTREGADA = `(p.estado ILIKE '%entregado%' OR p.estado ILIKE '%cerrado%') AND p.fecha_cierre IS NOT NULL`;

// Una fila por relevamiento con la fecha en que se entregó su provisión (proceso terminado)
const CIERRES = `
    SELECT p.solicitud_id AS relevamiento_id, MAX(p.fecha_cierre) AS fecha
    FROM provisiones p
    WHERE ${ENTREGADA} AND p.solicitud_id IS NOT NULL
    GROUP BY p.solicitud_id`;

const mesesVacios = () => Array.from({ length: 12 }, (_, i) => ({
    mes: i + 1,
    relevamientos: 0,
    familias_asistidas: 0,
    reportes: 0
}));

// GET /api/estadisticas/publicas: solo totales agregados por año y mes, sin datos personales
export const obtenerEstadisticasPublicas = async (req, res) => {
    try {
        const [relevamientos, familias, provisiones] = await Promise.all([
            sequelize.query(`
                WITH cierres AS (${CIERRES})
                SELECT EXTRACT(YEAR FROM fecha)::int AS anio, EXTRACT(MONTH FROM fecha)::int AS mes, COUNT(*)::int AS total
                FROM (
                    SELECT COALESCE(c.fecha, r."updatedAt") AS fecha
                    FROM relevamientos r
                    LEFT JOIN cierres c ON c.relevamiento_id = r.id
                    WHERE LOWER(r.estado::text) = 'finalizado' OR c.relevamiento_id IS NOT NULL
                ) t
                WHERE fecha IS NOT NULL
                GROUP BY 1, 2`, { type: QueryTypes.SELECT }),
            sequelize.query(`
                WITH cierres AS (${CIERRES})
                SELECT EXTRACT(YEAR FROM c.fecha)::int AS anio, EXTRACT(MONTH FROM c.fecha)::int AS mes, COUNT(f.id_familia)::int AS total
                FROM cierres c
                JOIN familias f ON f.id_relevamiento = c.relevamiento_id
                GROUP BY 1, 2`, { type: QueryTypes.SELECT }),
            sequelize.query(`
                SELECT EXTRACT(YEAR FROM p.fecha_cierre)::int AS anio, EXTRACT(MONTH FROM p.fecha_cierre)::int AS mes, COUNT(*)::int AS total
                FROM provisiones p
                WHERE ${ENTREGADA}
                GROUP BY 1, 2`, { type: QueryTypes.SELECT })
        ]);

        const porAnio = { [new Date().getFullYear()]: mesesVacios() };
        const volcar = (filas, campo) => {
            filas.forEach(({ anio, mes, total }) => {
                if (!porAnio[anio]) porAnio[anio] = mesesVacios();
                porAnio[anio][mes - 1][campo] = total;
            });
        };
        volcar(relevamientos, 'relevamientos');
        volcar(familias, 'familias_asistidas');
        volcar(provisiones, 'reportes');

        res.json({ success: true, data: porAnio });
    } catch (error) {
        console.error('Error al obtener estadísticas públicas:', error);
        res.status(500).json({ success: false, message: 'Error al obtener las estadísticas.' });
    }
};

// GET /api/estadisticas/mapa: familias asistidas por departamento (solo relevamientos con provisión entregada)
export const obtenerEstadisticasMapa = async (req, res) => {
    try {
        const filas = await sequelize.query(`
            WITH cierres AS (${CIERRES})
            SELECT r.departamento, COUNT(f.id_familia)::int AS familias_asistidas
            FROM cierres c
            JOIN relevamientos r ON r.id = c.relevamiento_id
            JOIN familias f ON f.id_relevamiento = c.relevamiento_id
            GROUP BY r.departamento`, { type: QueryTypes.SELECT });

        res.json({ success: true, data: filas });
    } catch (error) {
        console.error('Error al obtener estadísticas del mapa:', error);
        res.status(500).json({ success: false, message: 'Error al obtener las estadísticas del mapa.' });
    }
};
