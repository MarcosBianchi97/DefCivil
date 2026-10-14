// frontend/js/relevamientos-familias.js
import { cargarVistaDinamica } from './utils.js';
import { mostrarNotificacion } from './ui.js';
import { guardarDatosFamiliaDefinitivo, inicializarCalculoIntegrantes, mostrarFormularioNuevaFamilia } from './relevamientos-form.js';

// Variable global en memoria para almacenar las familias del relevamiento activo
let familiasOriginalesRelevamiento = [];
let paginaActualFamilias = 1;
let archivosParaSubir = [];

// Función principal para cargar la vista del relevamiento y sus familias desde el Backend
export async function ingresarARelevamiento(idRelevamiento) {
    window.idRelevamientoActivo = idRelevamiento;
    paginaActualFamilias = 1; // Reiniciamos a la primera página

    // Cargamos la estructura HTML de la tabla de familias
    cargarVistaDinamica('./frontend/pages/tabla-familias.html', async () => {
        try {
            // Recuperamos el token almacenado al iniciar sesión
            const token = localStorage.getItem('token');

            // 1. Consultamos los datos generales del relevamiento para el "Contexto Territorial"
            const respuestaRel = await fetch(`/api/relevamientos/${idRelevamiento}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (respuestaRel.ok) {
                const rel = await respuestaRel.json();
                
                // 🌟 Depuración rápida en consola para verificar qué llega exactamente
                console.log("Estado:", rel.estado, "| Observaciones:", rel.observaciones);

                // 🌟 Buscamos el contenedor o lo creamos dinámicamente si falta en el HTML
                let contenedorAlerta = document.getElementById('alerta-devolucion-container');
                
                if (!contenedorAlerta) {
                    // Si por algún motivo el HTML viejo sigue cargado, lo insertamos arriba del contexto
                    const contextoDiv = document.getElementById('contexto-relevamiento-activo');
                    if (contextoDiv && contextoDiv.parentNode) {
                        contenedorAlerta = document.createElement('div');
                        contenedorAlerta.id = 'alerta-devolucion-container';
                        contextoDiv.parentNode.insertBefore(contenedorAlerta, contextoDiv);
                    }
                }

                if (contenedorAlerta) {
                    // Comprobamos si tiene observaciones y estado en_proceso
                    if (rel.observaciones && rel.observaciones.trim() !== '' && rel.estado === 'en_proceso') {
                        contenedorAlerta.innerHTML = `
    <div class="alert border border-warning shadow-sm mb-3 d-flex align-items-center rounded-3 p-3" role="alert" style="background-color: #1e293b; color: #f8fafc;">
        <i class="bi bi-exclamation-triangle-fill fs-3 text-warning me-3"></i>
        <div>
            <h6 class="alert-heading fw-bold mb-1 text-warning">¡Relevamiento Devuelto con Observaciones!</h6>
            <p class="mb-0 small text-light opacity-90">${rel.observaciones}</p>
        </div>
    </div>
`;
                    } else {
                        contenedorAlerta.innerHTML = ''; 
                    }
                }

                // Carga normal del contexto territorial
                const contenedorContexto = document.getElementById('contexto-relevamiento-activo');
                if (contenedorContexto) {
                    contenedorContexto.innerHTML = `
                        <div class="col-md-3"><strong>Código:</strong> ${rel.codigo_relevamiento || 'N/D'}</div>
                        <div class="col-md-3"><strong>Fecha:</strong> ${rel.createdAt ? new Date(rel.createdAt).toLocaleDateString() : 'N/D'}</div>
                        <div class="col-md-3"><strong>Departamento:</strong> ${rel.departamento || 'N/D'}</div>
                        <div class="col-md-3"><strong>Localidad:</strong> ${rel.localidad || 'N/D'}</div>
                        <div class="col-md-3"><strong>Barrio:</strong> ${rel.barrio || 'N/D'}</div>
                        <div class="col-md-3"><strong>Evento:</strong> ${rel.tipo_evento || 'N/D'}</div>
                        <div class="col-md-3"><strong>Solicitante:</strong> ${rel.solicitante || 'N/D'}</div>
                        <div class="col-md-3"><strong>Prioridad:</strong> ${rel.prioridad || 'N/D'}</div>
                    `;
                }
            }

            // 2. Consultamos al backend las familias asociadas a este relevamiento UNA SOLA VEZ
            const respuesta = await fetch(`/api/familias?id_relevamiento=${idRelevamiento}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!respuesta.ok) {
                throw new Error('No se pudo obtener la lista de familias del servidor.');
            }

            const familias = await respuesta.json();
            familiasOriginalesRelevamiento = familias; // Guardamos la base en memoria
            
            if (typeof window.manejarCambioFiltros === 'function') {
                window.manejarCambioFiltros(); 
            }

        } catch (error) {
            console.error("Error al cargar familias:", error);
            mostrarNotificacion("Error al conectar con el servidor para traer las familias.", "error");
            familiasOriginalesRelevamiento = [];
        }
    });
}

export async function eliminarFamiliar(idFamilia) {
    if (!confirm("¿Está seguro de que desea eliminar esta familia del registro?")) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const respuesta = await fetch(`/api/familias/${idFamilia}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.mensaje || 'Error al eliminar la familia.');
        }

        mostrarNotificacion(resultado.mensaje || "Registro familiar eliminado correctamente.");
        
        if (window.idRelevamientoActivo) {
            ingresarARelevamiento(window.idRelevamientoActivo);
        }

    } catch (error) {
        console.error("Error al eliminar familia:", error);
        mostrarNotificacion(error.message, "error");
    }
}

export async function verFichaNecesidades(idFamilia) {
    try {
        const respuesta = await fetch(`/api/familias/${idFamilia}`);
        if (!respuesta.ok) throw new Error("No se pudo obtener la información de la familia.");
        
        const fam = await respuesta.json();
        const idReal = fam.id_familia || idFamilia;
        const nombreTitular = fam.jefe_familia || 'Sin especificar';

        const listaMateriales = fam.necesidades || [];
        let htmlMateriales = '';
        
        if (listaMateriales.length > 0) {
            htmlMateriales = `
                <ul class="list-group list-group-flush small" style="max-height: 140px; overflow-y: auto;">
                    ${listaMateriales.map(m => `
                        <li class="list-group-item d-flex justify-content-between align-items-center bg-white px-0 py-1">
                            <span><i class="bi bi-box-seam me-1 text-secondary"></i> ${m.tipo_material || 'Material'}</span>
                            <span class="badge bg-primary rounded-pill">Cant: ${m.cantidad || 1}</span>
                        </li>
                    `).join('')}
                </ul>
            `;
        } else {
            htmlMateriales = `<p class="text-muted small m-0 fst-italic">No se registraron materiales solicitados.</p>`;
        }

        // 🌟 PROCESAMIENTO DE DOCUMENTOS ADJUNTOS PARA LA FICHA
        let documentos = fam.documentacion || fam.Documentacion || fam.documentacions || fam.data?.documentacion || [];
        let htmlDocumentos = '';

        if (documentos.length > 0) {
            htmlDocumentos = `
                <ul class="list-group list-group-flush small" style="max-height: 140px; overflow-y: auto;">
                    ${documentos.map(doc => {
                        const nombreArchivo = doc.nombre_archivo || doc.nombre || 'Documento adjunto';
                        const rutaArchivo = doc.ruta_archivo || doc.url || '#';
                        return `
                            <li class="list-group-item d-flex justify-content-between align-items-center bg-white px-0 py-1">
                                <a href="${rutaArchivo}" target="_blank" class="text-decoration-none text-truncate me-2" style="max-width: 75%;" title="${nombreArchivo}">
                                    <i class="bi bi-file-earmark-pdf-fill text-danger me-1"></i> ${nombreArchivo}
                                </a>
                                <span class="badge bg-success bg-opacity-75" style="font-size: 0.65em;">Adjunto</span>
                            </li>
                        `;
                    }).join('')}
                </ul>
            `;
        } else {
            htmlDocumentos = `<p class="text-muted small m-0 fst-italic">No hay documentación adjunta.</p>`;
        }

        const asistencia = [
            { label: 'Unidades Alimentarias', val: fam.unidades_alimentarias },
            { label: 'Abrigos', val: fam.abrigos },
            { label: 'Frazadas', val: fam.frazadas },
            { label: 'Bidones de Agua', val: fam.bidones_agua },
            { label: 'Kits de Higiene', val: fam.kits_higiene },
            { label: 'Ropa', val: fam.ropa },
            { label: 'Colchones', val: fam.colchones }
        ].filter(item => item.val > 0);

        let htmlAsistencia = '';
        if (asistencia.length > 0) {
            htmlAsistencia = `
                <div class="d-flex flex-wrap gap-2 mt-2">
                    ${asistencia.map(a => `<span class="badge bg-success bg-opacity-75 text-white">${a.label}:${a.val}</span>`).join('')}
                </div>
            `;
        } else {
            htmlAsistencia = `<p class="text-muted small m-0 fst-italic">No se registraron artículos de asistencia inmediata.</p>`;
        }

        const danosRegistrados = [
            { label: 'Techo', activo: fam.dano_techo, clase: 'bg-danger' },
            { label: 'Paredes', activo: fam.dano_paredes, clase: 'bg-danger' },
            { label: 'Pisos', activo: fam.dano_pisos, clase: 'bg-danger' },
            { label: 'Instalaciones', activo: fam.dano_instalaciones, clase: 'bg-danger' },
            { label: 'Estructurales', activo: fam.danos_estructurales, clase: 'bg-dark text-danger fw-bold' },
            { label: 'Requiere Evacuación', activo: fam.requiere_evacuacion, clase: 'bg-warning text-dark fw-bold' }
        ].filter(d => d.activo);

        let htmlDanos = '';
        if (danosRegistrados.length > 0) {
            htmlDanos = `
                <div class="d-flex flex-wrap gap-1 mt-1">
                    ${danosRegistrados.map(d => `<span class="badge ${d.clase}">${d.label}</span>`).join('')}
                </div>
            `;
        } else {
            htmlDanos = `<p class="text-muted small m-0 fst-italic">No se registraron daños en la vivienda.</p>`;
        }

        const contenidoModal = `
            <div class="modal fade" id="modalFichaFamilia" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content shadow-lg border-0">
                        <div class="modal-header bg-dark text-white">
                            <h5 class="modal-title"><i class="bi bi-file-earmark-text-fill text-warning me-2"></i> Ficha: ${nombreTitular}</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body p-4 bg-light">
                            <div class="row g-3 mb-3">
                                <div class="col-md-6">
                                    <div class="p-3 bg-white rounded border shadow-sm h-100">
                                        <h6 class="text-primary fw-bold border-bottom pb-2 mb-2"><i class="bi bi-people-fill me-1"></i> Datos Demográficos</h6>
                                        <p class="mb-1 small"><strong>Jefe de Familia:</strong> ${nombreTitular}</p>
                                        <p class="mb-1 small"><strong>DNI:</strong> ${fam.dni_jefe || 'No especificado'}</p>
                                        <p class="mb-1 small"><strong>Teléfono:</strong> ${fam.telefono || 'No especificado'}</p>
                                        <p class="mb-1 small"><strong>Dirección:</strong> ${fam.direccion || 'No especificado'}</p>
                                        <p class="mb-0 small"><strong>Integrantes (Total):</strong> <span class="badge bg-secondary">${fam.cantidad_integrantes || 1}</span> (Mayores: ${fam.mayores || 0}, Menores: ${fam.menores || 0})</p>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="p-3 bg-white rounded border shadow-sm h-100">
                                        <h6 class="text-danger fw-bold border-bottom pb-2 mb-2"><i class="bi bi-house-exclamation-fill me-1"></i> Estado de Vivienda</h6>
                                        <p class="mb-1 small"><strong>Urgencia Familiar:</strong> ${fam.urgencia_familiar || 'Normal'}</p>
                                        <div class="mb-2 small">
                                            <strong>Daños Registrados:</strong>
                                            ${htmlDanos}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="row g-3 mb-3">
                                <div class="col-md-12">
                                    <div class="p-3 bg-white rounded border shadow-sm">
                                        <h6 class="text-success fw-bold border-bottom pb-2 mb-2"><i class="bi bi-box-seam me-1"></i> Asistencia Inmediata (Insumos)</h6>
                                        ${htmlAsistencia}
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 🌟 DISTRIBUCIÓN PARTIDA A LA MITAD: Materiales a la izquierda y Documentación a la derecha -->
                            <div class="row g-3 mb-3">
                                <div class="col-md-6">
                                    <div class="p-3 bg-white rounded border shadow-sm h-100">
                                        <h6 class="text-primary fw-bold border-bottom pb-2 mb-2"><i class="bi bi-tools me-1"></i> Materiales de Construcción</h6>
                                        ${htmlMateriales}
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="p-3 bg-white rounded border shadow-sm h-100">
                                        <h6 class="text-secondary fw-bold border-bottom pb-2 mb-2"><i class="bi bi-paperclip me-1"></i> Documentación Adjunta</h6>
                                        ${htmlDocumentos}
                                    </div>
                                </div>
                            </div>

                            <div class="p-3 bg-warning bg-opacity-10 rounded border border-warning-subtle">
                                <h6 class="fw-bold text-dark mb-1"><i class="bi bi-chat-left-text-fill me-1"></i> Observaciones</h6>
                                <p class="m-0 small text-dark">${fam.observaciones || 'Sin observaciones registradas.'}</p>
                            </div>
                        </div>
                        <div class="modal-footer bg-light d-flex justify-content-between">
                            <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cerrar Ficha</button>
                            <button type="button" class="btn btn-warning btn-sm fw-bold" id="btn-editar-desde-ficha" data-id="${idReal}">
                                <i class="bi bi-pencil-square me-1"></i> Editar Ficha
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const modalViejo = document.getElementById('contenedor-modal-dinamico');
        if (modalViejo) modalViejo.remove();

        const divTemporal = document.createElement('div');
        divTemporal.id = 'contenedor-modal-dinamico';
        divTemporal.innerHTML = contenidoModal;
        document.body.appendChild(divTemporal);

        const elementoModal = document.getElementById('modalFichaFamilia');
        const bModal = new bootstrap.Modal(elementoModal);
        bModal.show();

        const btnEditar = document.getElementById('btn-editar-desde-ficha');
        if (btnEditar) {
            btnEditar.addEventListener('click', () => {
                bModal.hide();
                divTemporal.remove();
                if (typeof window.editarDatosFamilia === 'function') {
                    window.editarDatosFamilia(idReal);
                }
            });
        }

        elementoModal.addEventListener('hidden.bs.modal', () => {
            divTemporal.remove();
        });

    } catch (error) {
        console.error("Error al abrir ficha:", error);
        mostrarNotificacion(error.message, "error");
    }
}

export function verListaRelevamientos() {
    cargarVistaDinamica('./frontend/pages/tabla-relevamientos.html', () => {
        if (typeof cargarTablaRelevamientos === 'function') {
            cargarTablaRelevamientos();
        } else {
            console.error("No se encontró la función cargarTablaRelevamientos");
        }
    });
}
// Función central que procesa búsqueda, ordenamiento y paginación local de Familias
export function manejarCambioFiltros(resetPagina = true) {
    if (resetPagina) paginaActualFamilias = 1;

    const textoBusqueda = document.getElementById('inputBusquedaFamilias')?.value.toLowerCase().trim() || '';
    const criterioOrden = document.getElementById('selectOrdenarFamilias')?.value || '';
    const selectPaginacion = document.getElementById('selectPaginacionFamilias')?.value || '10';

    // 1. Filtrado local por Jefe de Familia o DNI
    let resultado = familiasOriginalesRelevamiento.filter(f => {
        const jefe = (f.jefe_familia || '').toLowerCase();
        const dni = (f.dni_jefe || '').toLowerCase();
        return jefe.includes(textoBusqueda) || dni.includes(textoBusqueda);
    });

    // 2. Ordenamiento local
    if (criterioOrden === 'jefe') {
        resultado.sort((a, b) => (a.jefe_familia || '').localeCompare(b.jefe_familia || ''));
    } else if (criterioOrden === 'integrantes') {
        resultado.sort((a, b) => (b.cantidad_integrantes || 0) - (a.cantidad_integrantes || 0));
    } else {
        // Por defecto: Más recientes primero
        resultado.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    // 3. Paginación local
    let familiasPaginadas = resultado;
    let totalPaginas = 1;

    if (selectPaginacion !== 'todos') {
        const porPagina = parseInt(selectPaginacion, 10);
        totalPaginas = Math.ceil(resultado.length / porPagina) || 1;
        
        if (paginaActualFamilias > totalPaginas) paginaActualFamilias = totalPaginas;
        if (paginaActualFamilias < 1) paginaActualFamilias = 1;

        const inicio = (paginaActualFamilias - 1) * porPagina;
        const fin = inicio + porPagina;
        familiasPaginadas = resultado.slice(inicio, fin);
    }

    renderizarFilasFamilias(familiasPaginadas);
    renderizarControlesPaginacionFamilias(resultado.length, selectPaginacion === 'todos' ? resultado.length : parseInt(selectPaginacion, 10), totalPaginas);
}

// Renderizado de filas en la tabla de familias (Permite visualización aun estando bloqueado/completado)
function renderizarFilasFamilias(familias) {
    const tbody = document.getElementById('tabla-familias-body');
    if (!tbody) return;

    if (!familias || familias.length === 0) {
        tbody.innerHTML = `<tr class="fila-sin-datos"><td colspan="7" class="text-center text-muted py-4">No se encontraron familias registradas.</td></tr>`;
        return;
    }

    tbody.innerHTML = familias.map((f, index) => {
        const idFamilia = f.id_familia || f.id;
        const orden = index + 1;
        const dni = f.dni_jefe || 'N/D';
        const apellidoNombre = f.jefe_familia || 'Sin especificar';
        const integrantes = f.cantidad_integrantes || 1;
        const urgencia = f.urgencia_familiar || 'Normal';
        const estado = f.estado_asistencia || 'Pendiente';

        // Lógica visual para la urgencia
        let claseUrgencia = 'bg-secondary';
        if (urgencia.toLowerCase().includes('alta')) claseUrgencia = 'bg-danger';
        else if (urgencia.toLowerCase().includes('media')) claseUrgencia = 'bg-warning text-dark';
        
        // Lógica visual para el estado
        let claseEstado = 'badge bg-secondary'; 
        if (estado.toLowerCase().includes('entregado') || estado.toLowerCase().includes('completado')) claseEstado = 'badge bg-success';
        else if (estado.toLowerCase().includes('proceso')) claseEstado = 'badge bg-warning text-dark';

        // Botones de acción reutilizables
        const botonesAccion = `
            <button class="btn btn-sm btn-outline-primary" onclick="window.verFichaNecesidades('${idFamilia}')" title="Ver Ficha">
                <i class="bi bi-eye"></i>
            </button>
            <button class="btn btn-sm btn-outline-warning" onclick="window.editarDatosFamilia('${idFamilia}')" title="Editar Ficha">
                <i class="bi bi-pencil-square"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="window.eliminarFamiliar('${idFamilia}')" title="Eliminar">
                <i class="bi bi-trash"></i>
            </button>
        `;

        return `
            <!-- 1. VISTA DE ESCRITORIO (Fila clásica) -->
            <tr class="d-none d-md-table-row">
                <td class="text-center">${orden}</td> 
                <td>${dni}</td>              
                <td><strong>${apellidoNombre}</strong></td> 
                <td class="text-center"><span class="badge bg-secondary">${integrantes}</span></td> 
                <td><span class="badge ${claseUrgencia}">${urgencia}</span></td> 
                <td class="text-center"><span class="${claseEstado}">${estado}</span></td> 
                <td class="text-center">
                    <div class="d-flex justify-content-center gap-1">
                        ${botonesAccion}
                    </div>
                </td>
            </tr>

            <!-- 2. VISTA MÓVIL (Tarjeta compacta adaptable) -->
            <tr class="d-block d-md-none mb-3 border rounded shadow-sm p-3" style="background-color: #212b38 !important; border-color: #334155 !important;">
                <td class="d-block border-0 p-0 text-start w-100">
                    <div class="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2" style="border-color: #334155 !important;">
                        <strong class="text-primary">Orden N° ${orden}</strong>
                        <span class="badge ${claseUrgencia}">${urgencia}</span>
                    </div>
                    <div class="small mb-1"><strong>DNI Jefe/a:</strong> ${dni}</div>
                    <div class="small mb-1"><strong>Familia:</strong> ${apellidoNombre}</div>
                    <div class="small mb-2"><strong>Integrantes:</strong> <span class="badge bg-secondary">${integrantes}</span> | <strong>Estado:</strong> <span class="${claseEstado}">${estado}</span></div>
                    
                    <div class="mt-2 text-center w-100 border-top pt-3 d-flex justify-content-center gap-2" style="border-color: rgba(255,255,255,0.05) !important;">
                        ${botonesAccion}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Renderiza los controles de paginación estilizados para Familias
function renderizarControlesPaginacionFamilias(totalRegistros, porPagina, totalPaginas) {
    const contenedor = document.getElementById('contenedor-paginacion');
    
    if (!contenedor) return;

    if (totalRegistros === 0) {
        contenedor.innerHTML = '';
        return;
    }

    const selectPaginacion = document.getElementById('selectPaginacion')?.value || '10';
    if (selectPaginacion === 'todos') {
        contenedor.innerHTML = `<span class="text-white-50 small">Mostrando todas las familias (${totalRegistros} en total)</span>`;
        return;
    }

    const inicioRegistro = ((paginaActualFamilias - 1) * porPagina) + 1;
    const finRegistro = Math.min(paginaActualFamilias * porPagina, totalRegistros);

    contenedor.innerHTML = `
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-center w-100 py-2 px-1 mt-2 border-top border-secondary">
            <span class="text-light small mb-2 mb-md-0 opacity-75">
                Mostrando <strong class="text-white">${inicioRegistro}</strong> a <strong class="text-white">${finRegistro}</strong> de <strong class="text-white">${totalRegistros}</strong> familias
            </span>
            <nav aria-label="Navegación de páginas">
                <ul class="pagination pagination-sm m-0">
                    <li class="page-item ${paginaActualFamilias === 1 ? 'disabled' : ''}">
                        <button class="page-link bg-dark text-light border-secondary" onclick="window.cambiarPaginaFamilias(${paginaActualFamilias - 1})">Anterior</button>
                    </li>
                    <li class="page-item disabled">
                        <span class="page-link bg-secondary text-white border-secondary fw-semibold">Pág. ${paginaActualFamilias} de ${totalPaginas}</span>
                    </li>
                    <li class="page-item ${paginaActualFamilias >= totalPaginas ? 'disabled' : ''}">
                        <button class="page-link bg-dark text-light border-secondary" onclick="window.cambiarPaginaFamilias(${paginaActualFamilias + 1})">Siguiente</button>
                    </li>
                </ul>
            </nav>
        </div>
    `;
}

// Función auxiliar para que los botones de paginación funcionen
window.cambiarPaginaFamilias = function(nuevaPagina) {
    paginaActualFamilias = nuevaPagina;
    manejarCambioFiltros(false); // false para no resetear a página 1
};

// Función auxiliar para que los botones de paginación funcionen
window.cambiarPaginaFamilias = function(nuevaPagina) {
    paginaActualFamilias = nuevaPagina;
    manejarCambioFiltros(false); // false para no resetear a página 1
};

window.agregarArchivoALista = () => {
    const input = document.getElementById('inputArchivo');
    if (input.files.length === 0) return alert("Selecciona un archivo.");

    const archivo = input.files[0];
    archivosParaSubir.push(archivo);

    const lista = document.getElementById('lista-archivos-pendientes');
    const li = document.createElement('li');
    li.className = "list-group-item p-1 d-flex justify-content-between";
    li.innerHTML = `
        <span class="text-truncate">${archivo.name}</span>
        <button type="button" class="btn btn-link btn-sm text-danger p-0" onclick="this.parentElement.remove()">
            <i class="bi bi-trash"></i>
        </button>
    `;
    lista.appendChild(li);
    input.value = ''; // Reset
};

// Exposiciones globales exclusivas para las funciones que realmente existen aquí
window.ingresarARelevamiento = ingresarARelevamiento;
window.verListaRelevamientos = verListaRelevamientos;
window.eliminarFamiliar = eliminarFamiliar;
window.verFichaNecesidades = verFichaNecesidades;
window.mostrarFormularioNuevaFamilia = mostrarFormularioNuevaFamilia;
window.manejarCambioFiltros = manejarCambioFiltros;