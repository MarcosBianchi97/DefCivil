// frontend/js/solicitudes.js
const CONTENEDOR_APP = 'content-principal';
let solicitandoVista = false;
/**
 /**
 * Muestra la vista principal de Solicitudes inyectando el HTML
 */
export async function verListaSolicitudes() {
    // 🌟 Forzar el cierre del menú hamburguesa móvil si está abierto
    const navbarCollapse = document.querySelector('.navbar-collapse');
    if (navbarCollapse && navbarCollapse.classList.contains('show')) {
        const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
        if (bsCollapse) {
            bsCollapse.hide();
        } else {
            navbarCollapse.classList.remove('show');
        }
    }

    const contenedor = document.querySelector('.content-principal');
    if (!contenedor) return;

    if (document.getElementById('seccion-nueva-solicitud')) return;

    if (solicitandoVista) return;
    solicitandoVista = true;

    try {
        const respuesta = await fetch('/frontend/pages/tabla-solicitudes.html');
        if (!respuesta.ok) throw new Error('No se pudo cargar la página de solicitudes.');
        
        const htmlTexto = await respuesta.text();
        contenedor.innerHTML = htmlTexto;
        
        inicializarSolapasSolicitudes();
        await cargarRelevamientosEnEspera();
        inicializarFormularioSolicitud();
    } catch (error) {
        console.error("Error al cargar la vista de solicitudes:", error);
        contenedor.innerHTML = `<div class="p-4 text-center text-danger fw-bold"><i class="bi bi-exclamation-triangle-fill me-2"></i> Error al cargar el módulo de Solicitudes.</div>`;
    } finally {
        solicitandoVista = false;
    }
}

function inicializarSolapasSolicitudes() {
    const tabHistorial = document.getElementById('tab-ver-historial');
    const secNueva = document.getElementById('seccion-nueva-solicitud');
    const secHistorial = document.getElementById('seccion-historial');
    
    if (!tabHistorial) return;

    // Evitamos duplicación de eventos clonando el nodo
    const nuevoTabHistorial = tabHistorial.cloneNode(true);
    tabHistorial.parentNode.replaceChild(nuevoTabHistorial, tabHistorial);

    let viendoHistorial = false;

    nuevoTabHistorial.addEventListener('click', (e) => {
        e.preventDefault();
        viendoHistorial = !viendoHistorial;

        if (viendoHistorial) {
            // Mostramos historial y ocultamos pendientes
            if (secHistorial) secHistorial.classList.remove('d-none');
            if (secNueva) secNueva.classList.add('d-none');
            
            nuevoTabHistorial.innerHTML = `<i class="bi bi-list-check me-1"></i> Ver Pendientes`;
            nuevoTabHistorial.classList.remove('btn-outline-secondary');
            nuevoTabHistorial.classList.add('btn-warning', 'text-dark', 'fw-bold');
            
            verHistorialSolicitudes();
        } else {
            // Volvemos al listado pendiente
            if (secNueva) secNueva.classList.remove('d-none');
            if (secHistorial) secHistorial.classList.add('d-none');
            
            nuevoTabHistorial.innerHTML = `<i class="bi bi-clock-history me-1"></i> Ver Historial`;
            nuevoTabHistorial.classList.remove('btn-warning', 'text-dark', 'fw-bold');
            nuevoTabHistorial.classList.add('btn-outline-secondary');
        }
    });
}

export async function cargarRelevamientosEnEspera() {
    const tbody = document.querySelector('#tabla-relevamientos-espera tbody');
    if (!tbody) return;
    
    try {
        const respuesta = await fetch('/api/solicitudes/en-espera');
        const data = await respuesta.json();
        
        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-3">No hay relevamientos completados en espera de solicitud</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(item => {
            const idRel = item.id || item.id_relevamiento;
            const codigo = item.codigo_relevamiento || `#${idRel}`;
            const fecha = item.createdAt || item.created_at ? new Date(item.createdAt || item.created_at).toLocaleDateString() : 'Sin fecha';
            const ubicacion = `<strong>${item.departamento || ''}</strong> / ${item.localidad || ''}`;
            const barrio = item.barrio ? `<br><small class="text-muted"><i class="bi bi-geo-alt me-1"></i>${item.barrio}</small>` : '';
            const evento = item.tipo_evento || 'N/D';
            const relevador = item.relevador_apellido ? `${item.relevador_apellido}, ${item.relevador_nombre}` : (item.relevador_asignado || 'Sin asignar');
            const prioridad = item.prioridad || item.urgencia_general || 'Baja';
            
            const badgePrioridad = `<span class="badge ${prioridad === 'Alta' ? 'bg-danger' : prioridad === 'Media' ? 'bg-warning text-dark' : 'bg-success'}">${prioridad}</span>`;
            const badgeEstado = `<span class="badge bg-success">${item.estado || 'completado'}</span>`;

            return `
                <tr>
                    <td class="text-center align-middle">
                        <input class="form-check-input radio-relevamiento" type="radio" name="relevamientoSeleccionado" value="${idRel}">
                    </td>
                    <td class="align-middle"><strong>${codigo}</strong></td>
                    <td class="align-middle d-none d-md-table-cell"><small class="text-muted">${fecha}</small></td>
                    <td class="align-middle">${ubicacion} ${barrio}</td>
                    <td class="align-middle">${badgeEstado}</td>
                    <td class="align-middle d-none d-md-table-cell">${evento}</td>
                    <td class="align-middle"><small>${relevador}</small></td>
                    <td class="align-middle">${badgePrioridad}</td>
                    <td class="text-center align-middle">
                        <div class="d-flex justify-content-center align-items-center gap-1">
                            <button class="btn btn-sm btn-outline-info" onclick="window.abrirAuditoriaSolicitud('${idRel}', '${codigo}', '${item.departamento || ''}', '${item.localidad || ''}', '${evento}', '${relevador}', '${prioridad}')" title="Auditar Familias e Insumos">
    <i class="bi bi-eye"></i>
</button>
                            <button class="btn btn-sm btn-outline-secondary" onclick="window.abrirModalDevolucion('${idRel}')" title="Devolver al relevador con observaciones">
                                <i class="bi bi-arrow-counterclockwise"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error("Error al cargar relevamientos en espera:", error);
        tbody.innerHTML = `<tr><td colspan="9" class="text-center text-danger py-3">Error al cargar relevamientos en espera</td></tr>`;
    }
}

/**
 * Abre el modal de auditoría y carga las familias asociadas al relevamiento
 */
export async function abrirAuditoriaSolicitud(idRelevamiento, codigo, departamento, localidad, evento, relevador, urgencia) {
    try {
        // 1. Rellenamos la cabecera de forma segura verificando que el elemento exista
        const setSafeText = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.innerText = text;
        };

        setSafeText('audit-codigo', codigo || `#${idRelevamiento}`);
        setSafeText('audit-ubicacion', `${departamento || ''} / ${localidad || ''}`);
        setSafeText('audit-evento', evento || 'N/D');
        setSafeText('audit-relevador', relevador || 'N/D');
        setSafeText('audit-urgencia', urgencia || 'Media');

        // 2. Consultamos las familias asociadas a este relevamiento
        let familiasData = [];
        try {
            let respFam = await fetch(`/api/familias/relevamiento/${idRelevamiento}`);
            if (!respFam.ok) {
                respFam = await fetch(`/api/familias?relevamiento_id=${idRelevamiento}`);
            }
            if (respFam.ok) {
                familiasData = await respFam.json();
            }
        } catch (err) {
            console.warn('Error al obtener familias para auditoría:', err);
        }

        setSafeText('audit-total-familias', Array.isArray(familiasData) ? familiasData.length : 0);

        const tbodyAudit = document.querySelector('#tabla-audit-familias tbody');
        if (tbodyAudit) {
            if (!Array.isArray(familiasData) || familiasData.length === 0) {
                tbodyAudit.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-3">No hay registros de familias para este relevamiento.</td></tr>`;
            } else {
                tbodyAudit.innerHTML = familiasData.map((fam, idx) => {
                    const collapseId = `detalle-familia-${idx}`;

                    let listadoMateriales = '<span class="text-muted small">Sin materiales</span>';
                    if (fam.necesidades && Array.isArray(fam.necesidades) && fam.necesidades.length > 0) {
                        listadoMateriales = fam.necesidades.map(n => 
                            `<span class="badge bg-secondary text-light me-1 mb-1">${n.tipo_material}: <strong>${n.cantidad}</strong></span>`
                        ).join('');
                    }

                    let listadoDocs = '<span class="text-muted small">Sin adjuntos</span>';
                    if (fam.documentacion && Array.isArray(fam.documentacion) && fam.documentacion.length > 0) {
                        listadoDocs = fam.documentacion.map((doc, docIdx) => 
                            `<a href="${doc.ruta_archivo}" target="_blank" class="btn btn-sm btn-outline-info py-0 px-2 me-1 mb-1" title="${doc.nombre_archivo || 'Ver archivo'}">
                                <i class="bi bi-file-earmark-arrow-up"></i> ${doc.nombre_archivo || `Archivo #${docIdx + 1}`}
                            </a>`
                        ).join('');
                    }

                    const totalInsumosRapido = (Number(fam.unidades_alimentarias) || 0) + 
                                             (Number(fam.abrigos) || 0) + 
                                             (Number(fam.frazadas) || 0) + 
                                             (Number(fam.colchones) || 0) + 
                                             (Number(fam.bidones_agua) || 0) + 
                                             (Number(fam.kits_higiene) || 0) + 
                                             (Number(fam.ropa) || 0);

                    return `
                        <tr class="cursor-pointer" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}" title="Haga clic para ver detalle e insumos" style="cursor: pointer;">
                            <td class="text-center fw-bold text-warning"><i class="bi bi-chevron-down small me-1"></i> #${idx + 1}</td>
                            <td class="small">${fam.dni_jefe || fam.dni || 'N/D'}</td>
                            <td class="small fw-bold text-white">${fam.jefe_familia || fam.nombre || 'N/D'}</td>
                            <td class="text-center small">${fam.cantidad_integrantes || '1'}</td>
                            <td class="text-center"><span class="badge bg-primary">${totalInsumosRapido} ítems</span></td>
                            <td class="text-center">
                                ${fam.documentacion && fam.documentacion.length > 0 ? '<i class="bi bi-paperclip text-info" title="Tiene archivos adjuntos"></i>' : '<span class="text-muted">-</span>'}
                            </td>
                        </tr>
                        <tr>
                            <td colspan="6" class="p-0 border-0">
                                <div class="collapse bg-dark p-3 border-bottom border-secondary" id="${collapseId}">
                                    <div class="small text-light">
                                        <h6 class="text-warning fw-bold border-bottom pb-1 mb-2">
                                            <i class="bi bi-box-seam me-1"></i> Desglose de Insumos Solicitados
                                        </h6>
                                        <div class="row row-cols-2 row-cols-md-4 g-2 mb-3">
                                            <div class="col"><strong>Alimentos:</strong> <span class="text-info">${fam.unidades_alimentarias || '0'}</span></div>
                                            <div class="col"><strong>Abrigos:</strong> <span class="text-info">${fam.abrigos || '0'}</span></div>
                                            <div class="col"><strong>Frazadas:</strong> <span class="text-info">${fam.frazadas || '0'}</span></div>
                                            <div class="col"><strong>Colchones:</strong> <span class="text-info">${fam.colchones || '0'}</span></div>
                                            <div class="col"><strong>Bidones Agua:</strong> <span class="text-info">${fam.bidones_agua || '0'}</span></div>
                                            <div class="col"><strong>Kits Higiene:</strong> <span class="text-info">${fam.kits_higiene || '0'}</span></div>
                                            <div class="col"><strong>Ropa:</strong> <span class="text-info">${fam.ropa || '0'}</span></div>
                                        </div>
                                        <div class="mb-3 pt-2 border-top border-secondary">
                                            <strong class="text-muted d-block mb-1"><i class="bi bi-bricks me-1"></i> Materiales de Construcción:</strong>
                                            <div>${listadoMateriales}</div>
                                        </div>
                                        <div class="pt-2 border-top border-secondary">
                                            <strong class="text-muted d-block mb-1"><i class="bi bi-paperclip me-1"></i> Documentación / Evidencia (Cloudinary):</strong>
                                            <div class="d-flex flex-wrap gap-1 mt-1">${listadoDocs}</div>
                                        </div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('');

                const tot = calcularTotales(familiasData);
                const totalGeneralInsumos = tot.unidades_alimentarias + tot.abrigos + tot.frazadas + tot.colchones + tot.bidones_agua + tot.kits_higiene + tot.ropa;
                
                tbodyAudit.innerHTML += `
                    <tr class="table-secondary fw-bold">
                        <td colspan="3" class="text-end">TOTALES ACUMULADOS:</td>
                        <td class="text-center">${tot.integrantes} pers.</td>
                        <td class="text-center">${totalGeneralInsumos} ítems</td>
                        <td class="text-center">-</td>
                    </tr>
                `;
            }
        }

        const modalEl = document.getElementById('modalAuditoriaSolicitud');
        if (modalEl && window.bootstrap) {
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        }
    } catch (error) {
        console.error('Error al abrir la auditoría:', error);
        alert('No se pudo cargar el detalle de auditoría del relevamiento.');
    }
}

export async function verHistorialSolicitudes() {
    const tbody = document.querySelector('#tabla-historial-solicitudes tbody');
    if (!tbody) return;
    
    try {
        const respuesta = await fetch('/api/solicitudes/historial');
        const data = await respuesta.json();
        
        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-3">No hay solicitudes enviadas registradas</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(item => {
            const idRel = item.id_relevamiento || item.id;
            const codigo = item.codigo_relevamiento || `#${idRel}`;
            const fecha = item.updated_at ? new Date(item.updated_at).toLocaleDateString() : 'Sin fecha';
            const ubicacion = `<strong>${item.departamento || ''}</strong> / ${item.localidad || ''}`;
            const barrio = item.barrio ? `<br><small class="text-muted"><i class="bi bi-geo-alt me-1"></i>${item.barrio}</small>` : '';
            const evento = item.tipo_evento || 'N/D';
            const relevador = item.relevador_asignado || 'Sin asignar';
            const prioridad = item.prioridad || item.urgencia_general || 'Media';
            
            const badgePrioridad = `<span class="badge ${prioridad === 'Alta' ? 'bg-danger' : prioridad === 'Media' ? 'bg-warning text-dark' : 'bg-success'}">${prioridad}</span>`;
            
            let badgeEstado = 'bg-info text-dark';
            const est = (item.estado || '').toLowerCase();
            if (est.includes('aprobado') || est.includes('enviado') || est.includes('en proceso')) badgeEstado = 'bg-success text-white';
            else if (est.includes('rechazado')) badgeEstado = 'bg-danger text-white';

            return `
                <tr>
                    <td class="align-middle"><strong>${codigo}</strong></td>
                    <td class="align-middle d-none d-md-table-cell"><small class="text-muted">${fecha}</small></td>
                    <td class="align-middle">${ubicacion} ${barrio}</td>
                    <td class="align-middle"><span class="badge ${badgeEstado}">${item.estado || 'Emitida'}</span></td>
                    <td class="align-middle d-none d-md-table-cell">${evento}</td>
                    <td class="align-middle"><small>${relevador}</small></td>
                    <td class="align-middle">${badgePrioridad}</td>
                    <td class="text-center align-middle">
                        <button class="btn btn-sm btn-outline-info" onclick="window.abrirAuditoriaSolicitud('${idRel}', '${codigo}', '${item.departamento || ''}', '${item.localidad || ''}', '${evento}', '${relevador}', '${prioridad}')" title="Ver detalle en profundidad">
                            <i class="bi bi-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error("Error al cargar historial:", error);
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger py-3">Error al cargar el historial de solicitudes</td></tr>`;
    }
}
/**
 * Calcula la sumatoria de personas e insumos
 */
function calcularTotales(familias) {
    return familias.reduce((acc, f) => {
        acc.integrantes += (Number(f.cantidad_integrantes) || 0);
        acc.unidades_alimentarias += (Number(f.unidades_alimentarias) || 0);
        acc.abrigos += (Number(f.abrigos) || 0);
        acc.frazadas += (Number(f.frazadas) || 0);
        acc.bidones_agua += (Number(f.bidones_agua) || 0);
        acc.kits_higiene += (Number(f.kits_higiene) || 0);
        acc.ropa += (Number(f.ropa) || 0);
        acc.colchones += (Number(f.colchones) || 0);
        return acc;
    }, { integrantes: 0, unidades_alimentarias: 0, abrigos: 0, frazadas: 0, bidones_agua: 0, kits_higiene: 0, ropa: 0, colchones: 0 });
}

/**
 * Procesa la solicitud y genera el PDF oficial
 */
export function inicializarFormularioSolicitud() {
    const botonOriginal = document.getElementById('btn-enviar-solicitud');
    if (!botonOriginal) return;

    const nuevoBoton = botonOriginal.cloneNode(true);
    botonOriginal.parentNode.replaceChild(nuevoBoton, botonOriginal);

    nuevoBoton.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const seleccionado = document.querySelector('input[name="relevamientoSeleccionado"]:checked');
        if (!seleccionado) {
            alert('Por favor, seleccione un relevamiento de la lista.');
            return;
        }

        const idRelevamiento = seleccionado.value;
        const observaciones = document.querySelector('#seccion-nueva-solicitud textarea')?.value || '';

        const fila = seleccionado.closest('tr');
        const idTexto = fila.cells[1]?.innerText || `#${idRelevamiento}`;
        const fecha = fila.cells[2]?.innerText || 'Sin fecha';
        const ubicacion = fila.cells[3]?.innerText || 'Sin ubicación';
        const evento = fila.cells[5]?.innerText || 'Sin evento';
        const relevador = fila.cells[6]?.innerText || 'Sin relevador';
        const urgencia = fila.cells[7]?.innerText || 'Media';

        try {
            // 1. Petición al endpoint de familias
            let familiasData = [];
            try {
                let respFamilias = await fetch(`/api/familias/relevamiento/${idRelevamiento}`);
                if (!respFamilias.ok) {
                    respFamilias = await fetch(`/api/familias?relevamiento_id=${idRelevamiento}`);
                }
                if (respFamilias.ok) {
                    familiasData = await respFamilias.json();
                }
            } catch (err) {
                console.warn('Advertencia al consultar familias en la API:', err);
            }

            // 2. Enviar solicitud al servidor
            const respuesta = await fetch('/api/solicitudes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    relevamientoId: idRelevamiento,
                    observaciones: observaciones
                })
            });

            const resultado = await respuesta.json();

            if (respuesta.ok && resultado.success) {
                alert('¡Solicitud enviada correctamente a Desarrollo Social!');
                
                const campoObs = document.querySelector('#seccion-nueva-solicitud textarea');
                if (campoObs) campoObs.value = '';

                // 3. Estructuración de la tabla de familias para el PDF
                let cuerpoTablaFamilias = [
                    [
                        { text: 'DNI Jefe', bold: true, fillColor: '#e9ecef', fontSize: 8 },
                        { text: 'Jefe de Familia', bold: true, fillColor: '#e9ecef', fontSize: 8 },
                        { text: 'Int.', bold: true, fillColor: '#e9ecef', fontSize: 8, alignment: 'center' },
                        { text: 'Alim.', bold: true, fillColor: '#e9ecef', fontSize: 8, alignment: 'center' },
                        { text: 'Abrigos', bold: true, fillColor: '#e9ecef', fontSize: 8, alignment: 'center' },
                        { text: 'Frazadas', bold: true, fillColor: '#e9ecef', fontSize: 8, alignment: 'center' },
                        { text: 'Colchones', bold: true, fillColor: '#e9ecef', fontSize: 8, alignment: 'center' },
                        { text: 'Agua', bold: true, fillColor: '#e9ecef', fontSize: 8, alignment: 'center' },
                        { text: 'Kits Hig.', bold: true, fillColor: '#e9ecef', fontSize: 8, alignment: 'center' },
                        { text: 'Ropa', bold: true, fillColor: '#e9ecef', fontSize: 8, alignment: 'center' }
                    ]
                ];

                if (Array.isArray(familiasData) && familiasData.length > 0) {
                    familiasData.forEach(fam => {
                        cuerpoTablaFamilias.push([
                            { text: String(fam.dni_jefe || fam.dni || 'N/D'), fontSize: 8 },
                            { text: String(fam.jefe_familia || fam.nombre || 'N/D'), fontSize: 8 },
                            { text: String(fam.cantidad_integrantes || '1'), fontSize: 8, alignment: 'center' },
                            { text: String(fam.unidades_alimentarias || '0'), fontSize: 8, alignment: 'center' },
                            { text: String(fam.abrigos || '0'), fontSize: 8, alignment: 'center' },
                            { text: String(fam.frazadas || '0'), fontSize: 8, alignment: 'center' },
                            { text: String(fam.colchones || '0'), fontSize: 8, alignment: 'center' },
                            { text: String(fam.bidones_agua || '0'), fontSize: 8, alignment: 'center' },
                            { text: String(fam.kits_higiene || '0'), fontSize: 8, alignment: 'center' },
                            { text: String(fam.ropa || '0'), fontSize: 8, alignment: 'center' }
                        ]);
                    });

                    // Fila de sumatorias/totales
                    const tot = calcularTotales(familiasData);
                    cuerpoTablaFamilias.push([
                        { text: 'TOTALES ACUMULADOS', bold: true, colSpan: 2, fillColor: '#dee2e6', fontSize: 8 },
                        {},
                        { text: String(tot.integrantes), bold: true, fillColor: '#dee2e6', fontSize: 8, alignment: 'center' },
                        { text: String(tot.unidades_alimentarias), bold: true, fillColor: '#dee2e6', fontSize: 8, alignment: 'center' },
                        { text: String(tot.abrigos), bold: true, fillColor: '#dee2e6', fontSize: 8, alignment: 'center' },
                        { text: String(tot.frazadas), bold: true, fillColor: '#dee2e6', fontSize: 8, alignment: 'center' },
                        { text: String(tot.colchones), bold: true, fillColor: '#dee2e6', fontSize: 8, alignment: 'center' },
                        { text: String(tot.bidones_agua), bold: true, fillColor: '#dee2e6', fontSize: 8, alignment: 'center' },
                        { text: String(tot.kits_higiene), bold: true, fillColor: '#dee2e6', fontSize: 8, alignment: 'center' },
                        { text: String(tot.ropa), bold: true, fillColor: '#dee2e6', fontSize: 8, alignment: 'center' }
                    ]);
                } else {
                    cuerpoTablaFamilias.push([
                        { text: 'No se encontraron registros individuales de familias para este relevamiento.', colSpan: 10, alignment: 'center', fontSize: 9, italics: true },
                        {}, {}, {}, {}, {}, {}, {}, {}, {}
                    ]);
                }

                // Documento PDF con Orientación Horizontal (landscape) para máximo espacio disponible
                const docDefinition = {
                    pageSize: 'A4',
                    pageOrientation: 'landscape',
                    pageMargins: [30, 30, 30, 30],
                    content: [
                        { text: 'DEFENSA CIVIL - PROVINCIA DE SANTIAGO DEL ESTERO', style: 'header', alignment: 'center' },
                        { text: 'INFORME OFICIAL DE SOLICITUD DE PROVISIÓN', style: 'subheader', alignment: 'center', margin: [0, 0, 0, 12] },
                        
                        {
                            table: {
                                widths: ['15%', '35%', '15%', '35%'],
                                body: [
                                    [
                                        { text: 'ID Relevamiento:', bold: true, fontSize: 9 }, { text: idTexto, fontSize: 9 },
                                        { text: 'Fecha Emisión:', bold: true, fontSize: 9 }, { text: fecha, fontSize: 9 }
                                    ],
                                    [
                                        { text: 'Ubicación:', bold: true, fontSize: 9 }, { text: ubicacion, fontSize: 9 },
                                        { text: 'Tipo de Evento:', bold: true, fontSize: 9 }, { text: evento, fontSize: 9 }
                                    ],
                                    [
                                        { text: 'Relevador:', bold: true, fontSize: 9 }, { text: relevador, fontSize: 9 },
                                        { text: 'Nivel Urgencia:', bold: true, fontSize: 9 }, { text: urgencia, fontSize: 9 }
                                    ]
                                ]
                            },
                            layout: 'lightHorizontalLines',
                            margin: [0, 0, 0, 12]
                        },

                        { text: 'Detalle de Familias Damnificadas y Requerimientos de Insumos:', bold: true, fontSize: 10, margin: [0, 0, 0, 5] },
                        {
                            table: {
                                headerRows: 1,
                                widths: ['12%', '26%', '7%', '7%', '8%', '8%', '8%', '8%', '8%', '8%'],
                                body: cuerpoTablaFamilias
                            },
                            margin: [0, 0, 0, 15]
                        },
                        
                        { text: 'Observaciones / Justificación:', bold: true, fontSize: 10 },
                        { text: observaciones || 'Sin observaciones adicionales.', fontSize: 9, margin: [0, 0, 0, 25] },
                        
                        {
                            columns: [
                                { text: '___________________________\nFirma Operativo / Defensa Civil', alignment: 'center', fontSize: 9 },
                                { text: '___________________________\nRecibe Desarrollo Social', alignment: 'center', fontSize: 9 }
                            ],
                            margin: [0, 15, 0, 0]
                        }
                    ],
                    styles: {
                        header: { fontSize: 13, bold: true, color: '#0d6efd' },
                        subheader: { fontSize: 9, italics: true, color: '#6c757d' }
                    }
                };

                pdfMake.createPdf(docDefinition).download(`Solicitud-Relevamiento-${idRelevamiento}.pdf`);

                const textoWhatsApp = `*SOLICITUD DE PROVISIÓN - DEF. CIVIL*\n` +
                    `----------------------------------\n` +
                    `*ID Relevamiento:* ${idTexto}\n` +
                    `*Ubicación:* ${ubicacion}\n` +
                    `*Evento:* ${evento}\n` +
                    `*Urgencia:* ${urgencia}\n` +
                    `*Observaciones:* ${observaciones || 'Ninguna'}\n` +
                    `----------------------------------\n` +
                    `_Se adjunta documento PDF de solicitud._`;

                window.open(`https://wa.me/?text=${encodeURIComponent(textoWhatsApp)}`, '_blank');

                await cargarRelevamientosEnEspera();
            } else {
                alert(resultado.error || 'Error al enviar la solicitud.');
            }
        } catch (error) {
            console.error('Error de red al enviar la solicitud:', error);
            alert('Error de conexión con el servidor.');
        }
    });
}

// Función global para abrir el modal de devolución dinámicamente desde Solicitudes
window.abrirModalDevolucion = function(idRelevamiento) {
    // Si ya existía un modal anterior, lo removemos
    const modalAntiguo = document.getElementById('modalDevolucionRelevamiento');
    if (modalAntiguo) modalAntiguo.remove();

    // Inyectamos el HTML del modal de devolución con diseño oscuro/Bootstrap
    const htmlModal = `
        <div class="modal fade" id="modalDevolucionRelevamiento" tabindex="-1" aria-labelledby="modalDevolucionLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content bg-dark text-light border border-secondary shadow-lg">
                    <div class="modal-header border-bottom border-secondary bg-warning text-dark">
                        <h5 class="modal-title" id="modalDevolucionLabel">
                            <i class="bi bi-arrow-counterclockwise me-2"></i> Devolver Relevamiento
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body py-4">
                        <input type="hidden" id="devolucion_id_relevamiento" value="${idRelevamiento}">
                        <div class="mb-3">
                            <label for="devolucion_motivo" class="form-label fw-semibold">Motivo de la devolución / Observaciones:</label>
                            <textarea class="form-control bg-dark text-light border-secondary" id="devolucion_motivo" rows="4" placeholder="Indique qué correcciones o ajustes debe realizar el relevador..."></textarea>
                        </div>
                    </div>
                    <div class="modal-footer border-top border-secondary">
                        <button type="button" class="btn btn-outline-light btn-sm" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-warning btn-sm text-dark fw-bold px-3" onclick="window.confirmarDevolucionRelevamientoDesdeSolicitudes()">
                            <i class="bi bi-send me-1"></i> Confirmar Devolución
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', htmlModal);
    const modalElement = document.getElementById('modalDevolucionRelevamiento');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();

    modalElement.addEventListener('hidden.bs.modal', () => {
        modalElement.remove();
    });
};

// Función para procesar el envío de la devolución al backend
window.confirmarDevolucionRelevamientoDesdeSolicitudes = async function() {
    const idRelevamiento = document.getElementById('devolucion_id_relevamiento')?.value;
    const motivo = document.getElementById('devolucion_motivo')?.value.trim();

    if (!motivo) {
        alert('Por favor, ingrese el motivo de la devolución.');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const respuesta = await fetch(`/api/relevamientos/${idRelevamiento}/devolver`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ motivo })
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            // 1. Cerramos y eliminamos el modal inmediatamente para que no quede fantasma atrás
            const modalElement = document.getElementById('modalDevolucionRelevamiento');
            if (modalElement && typeof bootstrap !== 'undefined') {
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) modal.hide();
                modalElement.remove();
            }

            // 2. Eliminamos los fondos oscuros residuales (backdrop) que a veces deja Bootstrap
            document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';

            // 3. Mostramos la notificación con el diseño de la app en lugar del alert feo
            if (typeof mostrarNotificacion === 'function') {
                mostrarNotificacion(resultado.mensaje || 'Relevamiento devuelto al relevador con éxito.', 'success');
            } else {
                alert(resultado.mensaje || 'Relevamiento devuelto al relevador con éxito.');
            }

            // 4. Recargamos la tabla de solicitudes en espera
            cargarRelevamientosEnEspera();
        } else {
            alert(resultado.mensaje || 'Error al intentar devolver el relevamiento.');
        }
    } catch (error) {
        console.error('Error de red al devolver relevamiento:', error);
        alert('No se pudo conectar con el servidor.');
    }
};

if (typeof window !== 'undefined') {
    window.verListaSolicitudes = verListaSolicitudes;
    window.cargarRelevamientosEnEspera = cargarRelevamientosEnEspera;
    window.verHistorialSolicitudes = verHistorialSolicitudes;
    window.abrirAuditoriaSolicitud = abrirAuditoriaSolicitud;
    window.abrirModalDevolucion = abrirModalDevolucion;
}

// Delegador global de eventos para el botón del "ojito"
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-auditar');
    if (btn) {
        e.preventDefault();
        abrirAuditoriaSolicitud(
            btn.dataset.id,
            btn.dataset.codigo,
            btn.dataset.depto,
            btn.dataset.localidad,
            btn.dataset.evento,
            btn.dataset.relevador,
            btn.dataset.urgencia
        );
    }
});