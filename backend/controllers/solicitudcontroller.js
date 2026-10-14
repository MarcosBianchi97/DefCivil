import { QueryTypes, Op } from 'sequelize';
import sequelize from '../config/database.js';
import Relevamiento from '../models/relevamiento.js';
import Usuario from '../models/usuario.js';

// 1. Obtener relevamientos en espera ('completado')
export const obtenerEnEspera = async (req, res) => {
    try {
        const enEspera = await Relevamiento.findAll({ 
            where: { estado: 'completado' },
            order: [['createdAt', 'DESC']]
        });

        const listaUsuarios = await Usuario.findAll().catch(() => []);
        const mapaNombres = {};

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
                }
            }
        });

        const resultadosFinales = enEspera.map(item => {
            const itemJSON = item.toJSON ? item.toJSON() : item;
            const asignado = String(itemJSON.relevador_asignado || '').trim();
            
            itemJSON.relevador_asignado = mapaNombres[asignado] || (asignado !== '' ? asignado : 'Sin asignar');
            return itemJSON;
        });

        res.json(resultadosFinales);
    } catch (error) {
        console.error("Error al obtener relevamientos en espera:", error);
        res.status(500).json({ error: "Error al obtener relevamientos en espera" });
    }
};

// 2. Enviar solicitud (Cambia estado a 'En Proceso' y crea la provisión automáticamente)
export const enviarSolicitud = async (req, res) => {
    try {
        const { relevamientoId, observaciones } = req.body;
        
        if (!relevamientoId) {
            return res.status(400).json({ success: false, error: "Falta el ID del relevamiento." });
        }

        await Relevamiento.update(
            { 
                estado: 'En Proceso', 
                observaciones: observaciones 
            }, 
            { where: { id_relevamiento: relevamientoId } }
        ).catch(async () => {
            await Relevamiento.update(
                { 
                    estado: 'En Proceso', 
                    observaciones: observaciones 
                }, 
                { where: { id: relevamientoId } }
            );
        });

        const relevamientoInfo = await Relevamiento.findOne({
            where: { [Op.or]: [{ id_relevamiento: relevamientoId }, { id: relevamientoId }] }
        }).catch(() => null);

        const detalleInsumos = observaciones || 'Insumos / Ayuda solicitada según relevamiento';
        const destinoEntrega = relevamientoInfo ? (relevamientoInfo.direccion || 'Dirección no especificada') : 'Destino general';

        await sequelize.query(
            'INSERT INTO provisiones (solicitud_id, detalle, destino, estado) VALUES (?, ?, ?, ?)',
            { 
                replacements: [relevamientoId, detalleInsumos, destinoEntrega, 'Enviado'], 
                type: QueryTypes.INSERT 
            }
        );

        res.status(201).json({ success: true, message: "Solicitud enviada y provisión generada correctamente." });
    } catch (error) {
        console.error("Error al guardar la solicitud y crear la provisión:", error);
        res.status(500).json({ success: false, error: "Error al procesar la solicitud" });
    }
};

// 3. Obtener el historial de solicitudes enviadas (Corregido con Op.or y mapeo de usuarios)
export const obtenerHistorialSolicitudes = async (req, res) => {
    try {
        const historial = await Relevamiento.findAll({
            where: { 
                estado: { 
                    [Op.or]: ['En Proceso', 'en proceso', 'Enviado', 'enviado', 'Finalizado', 'finalizado'] 
                } 
            },
            order: [['updatedAt', 'DESC']]
        });

        const listaUsuarios = await Usuario.findAll().catch(() => []);
        const mapaNombres = {};

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
                }
            }
        });

        const resultadosHistorial = historial.map(item => {
            const itemJSON = item.toJSON ? item.toJSON() : item;
            const asignado = String(itemJSON.relevador_asignado || '').trim();
            
            itemJSON.relevador_asignado = mapaNombres[asignado] || (asignado !== '' ? asignado : 'Sin asignar');
            return itemJSON;
        });

        res.json(resultadosHistorial);
    } catch (error) {
        console.error("Error al obtener el historial:", error);
        res.status(500).json({ error: "Error al obtener el historial de solicitudes" });
    }
};