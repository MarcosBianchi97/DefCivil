// test-controller.cjs
const { crearrelevamiento, obtenerrelevamientos } = require('./backend/controllers/relevamientocontroller.js');

async function probarModulo() {
    try {
        console.log('Simulando la creación de un relevamiento...');
        
        const reqFalso = {
            body: {
                departamento: 'Capital',
                localidad: 'Santiago del Estero',
                barrio: 'Centro',
                tipo_evento: 'Otro',
                otro_evento: 'Corte de suministro eléctrico masivo',
                solicitante: 'Vecino autoconvocado',
                relevador_asignado: 'Omar Cavalieri',
                prioridad: 'Media'
            }
        };

        const resFalso = {
            status: function(codigo) {
                this.statusCode = codigo;
                return this;
            },
            json: function(datos) {
                console.log(`\nRespuesta del Controlador (Status ${this.statusCode || 200}):`, JSON.stringify(datos, null, 2));
            }
        };

        await crearrelevamiento(reqFalso, resFalso);
        console.log('\nPrueba del controlador finalizada con éxito.');

    } catch (error) {
        console.error('Error durante la prueba del controlador:', error);
    }
}

probarModulo();