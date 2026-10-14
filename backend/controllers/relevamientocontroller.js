// backend/controllers/relevamientocontroller.js
import relevamiento from '../models/relevamiento.js';
import Usuario from '../models/usuario.js';
import { Op } from 'sequelize';

// Función auxiliar para generar el código de relevamiento (Ej: CAP-SDE-001-26)
const generarCodigoRelevamiento = async (departamento, localidad) => {
    const anioActual = '26'; // Año actual del proyecto
    const dptoPrefix = departamento ? departamento.substring(0, 3).toUpperCase() : 'DEP';
    const locPrefix = localidad ? localidad.substring(0, 3).toUpperCase() : 'LOC';
    
    // Contamos cuántos registros hay para calcular el próximo número correlativo
    const totalRegistros = await relevamiento.count().catch(() => 0);
    const correlativo = String(totalRegistros + 1).padStart(3, '0');
    
    return `${dptoPrefix}${locPrefix}${correlativo}-${anioActual}`;
};

// 1. OBTENER TODOS LOS RELEVAMIENTOS Y LIMPIAR DATOS SUCIOS
export const obtenerrelevamientos = async (req, res) => {
    try {
        const rolUsuario = req.user && (req.user.rol || req.user.tipo_rol || req.user.tipo) ? String(req.user.rol || req.user.tipo_rol || req.user.tipo).trim().toLowerCase() : '';
        const idUsuarioLogueado = req.user ? (req.user.id_usuario || req.user.id) : null;

        let condicionesWhere = {
            // 🌟 EXCLUSIÓN GENERAL: Los relevamientos completados o en espera ya no se muestran en la tabla operativa principal
            estado: { [Op.notIn]: ['completado', 'En Espera', 'en_espera'] }
        };
        const esAdministrador = rolUsuario.includes('admin');

        const listaUsuarios = await Usuario.findAll().catch(() => []);

        const mapaNombres = {};
        let usuarioLogueadoPerfil = null;

        listaUsuarios.forEach(usr => {
            if (usr) {
                const usrJSON = usr.toJSON ? usr.toJSON() : usr;
                const idUsr = usrJSON.id_usuario || usrJSON.id;

                if (idUsr) {
                    const nombreProp = usrJSON.nombres || usrJSON.nombre || '';
                    const apellidoProp = usrJSON.apellido || '';
                    const nombreCompleto = `${apellidoProp}, ${nombreProp}`;
                    
                    mapaNombres[String(idUsr)] = nombreCompleto;
                    mapaNombres[nombreCompleto] = nombreCompleto;

                    if (idUsuarioLogueado && Number(idUsr) === Number(idUsuarioLogueado)) {
                        usuarioLogueadoPerfil = usrJSON;
                    }
                }
            }
        });

        // Si NO es administrador y es relevador, filtramos además por el asignado
        if (!esAdministrador && rolUsuario === 'relevador') {
            if (usuarioLogueadoPerfil) {
                const nombreCompletoLogueado = `${usuarioLogueadoPerfil.apellido || ''}, ${usuarioLogueadoPerfil.nombres || usuarioLogueadoPerfil.nombre || ''}`;
                
                condicionesWhere = {
                    [Op.and]: [
                        {
                            [Op.or]: [
                                { relevador_asignado: String(usuarioLogueadoPerfil.id_usuario || usuarioLogueadoPerfil.id) },
                                { relevador_asignado: nombreCompletoLogueado }
                            ]
                        },
                        { estado: { [Op.notIn]: ['completado', 'En Espera', 'en_espera'] } }
                    ]
                };
            } else {
                condicionesWhere = { id_relevamiento: 0 }; 
            }
        }

        const listaRelevamientos = await relevamiento.findAll({ 
            where: condicionesWhere,
            order: [['createdAt', 'DESC']] 
        }).catch(() => []);

        // Traducimos cualquier ID numérico a su respectivo "Apellido, Nombres" para la vista
        const relevamientosFinales = listaRelevamientos.map(rel => {
            const relJSON = rel.toJSON ? rel.toJSON() : rel;
            const asignado = String(relJSON.relevador_asignado || '').trim();
            
            relJSON.relevador_asignado = mapaNombres[asignado] || (asignado !== '' ? asignado : 'Sin asignar');
            return relJSON;
        });

        return res.status(200).json(relevamientosFinales);
    } catch (error) {
        console.error('🔥 ERROR CRUCIAL EN /api/relevamientos:', error);
        return res.status(200).json([]);
    }
};

// 2. CREAR UN NUEVO RELEVAMIENTO
export const crearrelevamiento = async (req, res) => {
    try {
        const { 
            departamento, 
            localidad, 
            barrio, 
            tipo_evento, 
            otro_evento, 
            solicitante, 
            relevador_asignado, 
            prioridad 
        } = req.body;

        // Validamos campos obligatorios básicos
        if (!departamento || !localidad || !tipo_evento || !solicitante || !relevador_asignado) {
            return res.status(400).json({ mensaje: 'Todos los campos obligatorios deben ser completados.' });
        }

        // Si seleccionó "Otro" en el evento, usamos el valor del input adicional
        const eventoFinal = tipo_evento === 'Otro' && otro_evento ? otro_evento : tipo_evento;

        // Generamos el código visible automático
        const codigo_relevamiento = await generarCodigoRelevamiento(departamento, localidad);

        const nuevorelevamiento = await relevamiento.create({
            codigo_relevamiento,
            departamento,
            localidad,
            barrio: barrio || null,
            tipo_evento: eventoFinal,
            solicitante,
            relevador_asignado,
            prioridad: prioridad || 'Baja',
            estado: 'nuevo'
        });

        res.status(201).json({
            mensaje: 'Relevamiento creado con éxito.',
            data: nuevorelevamiento
        });
    } catch (error) {
        console.error('Error al crear relevamiento:', error);
        res.status(500).json({ mensaje: 'Error en el servidor al guardar el relevamiento.' });
    }
};

// 3. OBTENER UN RELEVAMIENTO POR SU ID
export const obtenerRelevamientoPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const rel = await relevamiento.findByPk(id);

        if (!rel) {
            return res.status(404).json({ mensaje: 'No se encontró el relevamiento.' });
        }

        res.json(rel);
    } catch (error) {
        console.error('Error al obtener el relevamiento por ID:', error);
        res.status(500).json({ mensaje: 'Error en el servidor al buscar el relevamiento.' });
    }
};

// 4. ACTUALIZAR UN RELEVAMIENTO EXISTENTE
export const actualizarRelevamiento = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            departamento, 
            localidad, 
            barrio, 
            tipo_evento, 
            otro_evento, 
            solicitante, 
            relevador_asignado, 
            prioridad, 
            estado,
            observaciones 
        } = req.body;

        const rel = await relevamiento.findByPk(id);
        if (!rel) {
            return res.status(404).json({ mensaje: 'No se encontró el relevamiento a actualizar.' });
        }

        const eventoFinal = tipo_evento === 'Otro' && otro_evento ? otro_evento : tipo_evento;

        await rel.update({
            departamento: departamento || rel.departamento,
            localidad: localidad || rel.localidad,
            barrio: barrio !== undefined ? barrio : rel.barrio,
            tipo_evento: eventoFinal || rel.tipo_evento,
            solicitante: solicitante || rel.solicitante,
            relevador_asignado: relevador_asignado || rel.relevador_asignado,
            prioridad: prioridad || rel.prioridad,
            estado: estado || rel.estado,
            observaciones: observaciones !== undefined ? observaciones : rel.observaciones
        });

        res.json({
            mensaje: 'Relevamiento actualizado con éxito.',
            data: rel
        });
    } catch (error) {
        console.error('Error al actualizar relevamiento:', error);
        res.status(500).json({ mensaje: 'Error en el servidor al actualizar el relevamiento.' });
    }
};

// 5. ELIMINAR UN RELEVAMIENTO
export const eliminarRelevamiento = async (req, res) => {
    try {
        const { id } = req.params;
        
        const rel = await relevamiento.findByPk(id);
        if (!rel) {
            return res.status(404).json({ mensaje: 'No se encontró el relevamiento a eliminar.' });
        }

        await rel.destroy();

        return res.status(200).json({ 
            mensaje: 'Relevamiento eliminado con éxito.' 
        });
    } catch (error) {
        console.error('Error al eliminar relevamiento:', error);
        return res.status(500).json({ mensaje: 'Error en el servidor al eliminar el relevamiento.' });
    }
};
// 5. COMPLETAR UN RELEVAMIENTO
export const completarRelevamiento = async (req, res) => {
    try {
        const { id } = req.params;
        const rel = await relevamiento.findByPk(id);

        if (!rel) return res.status(404).json({ mensaje: 'No se encontró el relevamiento.' });

        // Verificamos que no esté ya finalizado o cancelado
        if (rel.estado === 'finalizado' || rel.estado === 'cancelado') {
            return res.status(400).json({ mensaje: 'Este relevamiento ya no puede ser modificado.' });
        }

        await rel.update({ estado: 'completado' });
        res.json({ mensaje: 'Relevamiento marcado como completado.', data: rel });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al procesar el cambio de estado.' });
    }
};
// 6. DEVOLVER UN RELEVAMIENTO (Solo para Admin)
export const devolverRelevamiento = async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body; // Recibimos el motivo de devolución desde el frontend

        const rel = await relevamiento.findByPk(id);
        if (!rel) return res.status(404).json({ mensaje: 'No se encontró el relevamiento.' });

        // Preparamos el texto de observación (puedes concatenarlo con las observaciones anteriores si ya existían)
        const observacionesActuales = rel.observaciones ? rel.observaciones + "\n" : "";
        const nuevaObservacion = `${observacionesActuales}[DEVUELTO POR ADMIN]: ${motivo || 'Sin especificar motivo'}`;

        // Lo devolvemos a 'en_proceso' y guardamos la justificación
        await rel.update({ 
            estado: 'en_proceso',
            observaciones: motivo // Guardamos el motivo directo del admin aquí
        });
        
        res.json({ mensaje: 'Relevamiento devuelto al relevador con éxito.', data: rel });
    } catch (error) {
        console.error('Error al devolver relevamiento:', error);
        res.status(500).json({ mensaje: 'Error en el servidor al devolver el relevamiento.' });
    }
};