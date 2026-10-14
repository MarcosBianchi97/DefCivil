import express from 'express';
import { QueryTypes } from 'sequelize'; 
import sequelize from '../config/database.js';

const router = express.Router();

// Autoejecución al cargar el módulo para asegurar que las columnas existan en Render (PostgreSQL)
(async () => {
    try {
        await sequelize.query('ALTER TABLE relevadores ADD COLUMN IF NOT EXISTS codigo_relevador VARCHAR(20);');
        await sequelize.query('ALTER TABLE relevadores ADD COLUMN IF NOT EXISTS apellido VARCHAR(100);');
        await sequelize.query('ALTER TABLE relevadores ADD COLUMN IF NOT EXISTS nombre VARCHAR(100);');
        console.log('✅ Verificación de esquema: columnas de relevadores aseguradas.');
    } catch (e) {
        // Ignora si ya existen
    }
})();

// Función auxiliar para generar el código del relevador (Ej: PM3654)
function generarCodigoRelevador(apellido, nombre, dni) {
    const inicialApellido = apellido ? apellido.trim().charAt(0).toUpperCase() : 'X';
    const inicialNombre = nombre ? nombre.trim().charAt(0).toUpperCase() : 'X';
    const ultimosDni = dni ? dni.slice(-4) : '0000';

    return `${inicialApellido}${inicialNombre}${ultimosDni}`;
}

// GET /api/relevadores - Listar relevadores activos (Para selectores/desplegables)
router.get('/', async (req, res) => {
    try {
        const relevadores = await sequelize.query(
            'SELECT id, codigo_relevador, apellido, nombre, dni, email, telefono FROM relevadores WHERE activo = 1 ORDER BY apellido ASC, nombre ASC',
            { type: QueryTypes.SELECT }
        );
        
        // Mapeamos para que el frontend reciba también la propiedad "nombre" unificada si la necesita
        const formateados = relevadores.map(r => ({
            ...r,
            nombreCompleto: `${r.apellido}, ${r.nombre}`
        }));

        res.json({
            success: true,
            data: formateados
        });
    } catch (error) {
        console.warn('⚠️ Aviso: La tabla relevadores aún no existe o está vacía:', error.message);
        res.json({
            success: true,
            data: []
        });
    }
});

// GET /api/relevadores/admin - Listar TODOS los relevadores (Activos e inactivos para Configuración)
router.get('/admin', async (req, res) => {
    try {
        const relevadores = await sequelize.query(
            'SELECT id, codigo_relevador, apellido, nombre, dni, email, telefono, activo FROM relevadores ORDER BY apellido ASC, nombre ASC',
            { type: QueryTypes.SELECT }
        );
        
        res.json({
            success: true,
            data: relevadores
        });
    } catch (error) {
        console.warn('⚠️ Aviso: La tabla relevadores admin aún no existe o está vacía:', error.message);
        res.json({
            success: true,
            data: []
        });
    }
});

// POST /api/relevadores - Registrar un nuevo relevador
router.post('/', async (req, res) => {
    const { apellido, nombre, dni, email, telefono } = req.body;

    if (!apellido || !nombre || !dni) {
        return res.status(400).json({ 
            success: false, 
            message: 'El Apellido, el Nombre y el DNI son obligatorios' 
        });
    }

    try {
        const existente = await sequelize.query(
            'SELECT id FROM relevadores WHERE dni = ?',
            { replacements: [dni], type: QueryTypes.SELECT }
        );

        if (existente.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Ya existe un relevador registrado con ese DNI' 
            });
        }

        // CORREGIDO: Se pasan los tres parámetros correctos
        const codigo_relevador = generarCodigoRelevador(apellido, nombre, dni);

        const resultado = await sequelize.query(
            'INSERT INTO relevadores (codigo_relevador, apellido, nombre, dni, email, telefono, activo) VALUES (?, ?, ?, ?, ?, ?, 1)',
            { 
                replacements: [codigo_relevador, apellido, nombre, dni, email || null, telefono || null],
                type: QueryTypes.INSERT 
            }
        );

        res.json({
            success: true,
            message: 'Relevador registrado con éxito',
            id: resultado[0] 
        });
    } catch (error) {
        console.error('❌ ERROR AL INSERTAR RELEVADOR:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al registrar el relevador en la base de datos',
            detalle: error.message
        });
    }
});

// PUT /api/relevadores/:id/estado - Cambiar estado Activo/Inactivo (Toggle)
router.put('/:id/estado', async (req, res) => {
    const { id } = req.params;
    const { activo } = req.body; 

    try {
        await sequelize.query(
            'UPDATE relevadores SET activo = ? WHERE id = ?',
            { 
                replacements: [activo, id],
                type: QueryTypes.UPDATE 
            }
        );

        res.json({
            success: true,
            message: 'Estado del relevador actualizado con éxito'
        });
    } catch (error) {
        console.error('❌ ERROR AL ACTUALIZAR ESTADO:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al actualizar el estado del relevador',
            detalle: error.message 
        });
    }
});

// PUT /api/relevadores/:id - Actualizar datos de un relevador
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { apellido, nombre, dni, email, telefono } = req.body;

    if (!apellido || !nombre || !dni) {
        return res.status(400).json({ 
            success: false, 
            message: 'El Apellido, el Nombre y el DNI son obligatorios' 
        });
    }

    try {
        const actual = await sequelize.query(
            'SELECT codigo_relevador FROM relevadores WHERE id = ?',
            { replacements: [id], type: QueryTypes.SELECT }
        );

        let codigo_relevador = actual[0]?.codigo_relevador;

        if (!codigo_relevador) {
            codigo_relevador = generarCodigoRelevador(apellido, nombre, dni);
        }

        // CORREGIDO: Sintaxis SQL limpia con comas separando cada columna
        await sequelize.query(
            'UPDATE relevadores SET codigo_relevador = ?, apellido = ?, nombre = ?, dni = ?, email = ?, telefono = ? WHERE id = ?',
            { 
                replacements: [codigo_relevador, apellido, nombre, dni, email || null, telefono || null, id],
                type: QueryTypes.UPDATE 
            }
        );

        res.json({
            success: true,
            message: 'Relevador actualizado con éxito'
        });
    } catch (error) {
        console.error('❌ ERROR AL ACTUALIZAR RELEVADOR:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al actualizar el relevador',
            detalle: error.message 
        });
    }
});

export default router;