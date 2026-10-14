// frontend/js/provisiones.js

let solicitandoVistaProvisiones = false;
let provisionesOriginales = [];
let paginaActualProvisiones = 1;

/**
 * Muestra la vista principal de Provisiones inyectando el HTML parcial
 */
export async function verListaProvisiones() {
    const contenedor = document.querySelector('.content-principal');
    if (!contenedor) return;

    if (document.getElementById('tablaProvisiones')) return;

    if (solicitandoVistaProvisiones) return;
    solicitandoVistaProvisiones = true;

    try {
        const respuesta = await fetch('/frontend/pages/provisiones.html');
        if (!respuesta.ok) throw new Error('No se pudo cargar la página de provisiones.');
        
        const htmlTexto = await respuesta.text();
        contenedor.innerHTML = htmlTexto;
        
        await cargarProvisionesData();
    } catch (error) {
        console.error("Error al cargar la vista de provisiones:", error);
        contenedor.innerHTML = `<div class="p-4 text-center text-danger fw-bold"><i class="bi bi-exclamation-triangle-fill me-2"></i> Error al cargar el módulo de Provisiones.</div>`;
    } finally {
        solicitandoVistaProvisiones = false;
    }
}

async function cargarProvisionesData() {
    const tbody = document.querySelector('#tbody-provisiones');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4"><div class="spinner-border spinner-border-sm me-2" role="status"></div>Cargando provisiones...</td></tr>`;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/provisiones', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        
        provisionesOriginales = (json.success && Array.isArray(json.data)) ? json.data : [];
        paginaActualProvisiones = 1;

        manejarFiltrosProvisiones();

    } catch (err) {
        console.error("Error al cargar provisiones:", err);
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">Error al conectar con el servidor.</td></tr>`;
    }
}

// Función central que procesa búsqueda, ordenamiento y paginación local de Provisiones
export function manejarFiltrosProvisiones(resetPagina = true) {
    if (resetPagina) paginaActualProvisiones = 1;

    const textoBusqueda = document.getElementById('inputBusquedaProvisiones')?.value.toLowerCase().trim() || '';
    const selectPaginacion = document.getElementById('selectPaginacionProvisiones')?.value || '10';

    // 1. Filtrado local por ID, Destino, Estado o Detalle
    let resultado = provisionesOriginales.filter(p => {
        const idProv = String(p.id || '').toLowerCase();
        const solicitud = String(p.solicitud_id || '').toLowerCase();
        const detalle = String(p.detalle || '').toLowerCase();
        const destino = String(p.destino || '').toLowerCase();
        const estado = String(p.estado || '').toLowerCase();
        const observaciones = String(p.observaciones || '').toLowerCase();

        return idProv.includes(textoBusqueda) || 
               solicitud.includes(textoBusqueda) || 
               detalle.includes(textoBusqueda) || 
               destino.includes(textoBusqueda) || 
               estado.includes(textoBusqueda) ||
               observaciones.includes(textoBusqueda);
    });

    // Orden por ID descendiente (más recientes primero)
    resultado.sort((a, b) => (b.id || 0) - (a.id || 0));

    // 2. Paginación local
    let provisionesPaginadas = resultado;
    let totalPaginas = 1;

    if (selectPaginacion !== 'todos') {
        const porPagina = parseInt(selectPaginacion, 10);
        totalPaginas = Math.ceil(resultado.length / porPagina) || 1;
        
        if (paginaActualProvisiones > totalPaginas) paginaActualProvisiones = totalPaginas;
        if (paginaActualProvisiones < 1) paginaActualProvisiones = 1;

        const inicio = (paginaActualProvisiones - 1) * porPagina;
        const fin = inicio + porPagina;
        provisionesPaginadas = resultado.slice(inicio, fin);
    }

    renderizarFilasProvisiones(provisionesPaginadas);
    renderizarControlesPaginacionProvisiones(resultado.length, selectPaginacion === 'todos' ? resultado.length : parseInt(selectPaginacion, 10), totalPaginas);
}

window.cambiarPaginaProvisiones = function(nuevaPagina) {
    paginaActualProvisiones = nuevaPagina;
    manejarFiltrosProvisiones(false);
};

function renderizarFilasProvisiones(provisiones) {
    const tbody = document.querySelector('#tbody-provisiones');
    if (!tbody) return;

    if (!provisiones || provisiones.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No se encontraron provisiones registradas con los criterios de búsqueda.</td></tr>`;
        return;
    }

    tbody.innerHTML = provisiones.map(p => {
        let badgeClass = 'bg-warning text-dark';
        if (p.estado && (p.estado.includes('Entregado') || p.estado.includes('Cerrado'))) {
            badgeClass = 'bg-success text-white';
        } else if (p.estado && p.estado.includes('Rechazado')) {
            badgeClass = 'bg-danger text-white';
        }

        const botonAccion = p.estado === 'Enviado' ? `
            <button class="btn btn-sm btn-success fw-bold px-3 py-2" onclick="window.cerrarCircuitoProvision(${p.id})">
                <i class="fas fa-check-circle me-1"></i> Registrar Retorno
            </button>
        ` : `<span class="text-muted small">Cerrado</span>`;

        // Formateamos fecha y código idéntico al estándar de Relevamientos
        const fechaProv = p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/D';
        const codigoRel = p.codigo_relevamiento ? p.codigo_relevamiento : `Provisión #${p.id}`;
        
        // Estructura de ubicación idéntica (Departamento / Localidad arriba, Barrio abajo con icono)
        const deptoLocalidad = (p.departamento || p.localidad) ? `<strong>${p.departamento || ''}</strong> / ${p.localidad || ''}` : (p.destino || 'Destino general');
        const barrioTexto = p.barrio ? `<small class="text-muted"><i class="bi bi-geo-alt me-1"></i>${p.barrio}</small>` : '';

        return `
            <!-- 1. VISTA DE ESCRITORIO (Espejo de Relevamientos) -->
            <tr class="text-dark d-none d-md-table-row">
                <td class="ps-3">
                    <strong>${codigoRel}</strong><br>
                    <small class="text-muted" style="font-size: 0.8em;">${fechaProv}</small>
                </td>
                <td>
                    ${deptoLocalidad}<br>
                    ${barrioTexto}
                </td>
                <td>${p.detalle || 'Sin detalle de insumos'}</td>
                <td><span class="badge ${badgeClass}">${p.estado}</span></td>
                <td>${p.observaciones || 'Sin observaciones'}</td>
                <td class="text-center pe-3">${botonAccion}</td>
            </tr>

            <!-- 2. VISTA MÓVIL (Tarjeta adaptable) -->
            <tr class="d-block d-md-none mb-3 border rounded shadow-sm p-3 bg-white">
                <td class="text-start border-0 p-0">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <div>
                            <div class="fw-bold text-primary">${codigoRel}</div>
                            <div class="small text-muted">${fechaProv}</div>
                        </div>
                        <div><span class="badge ${badgeClass}">${p.estado}</span></div>
                    </div>
                    <div class="small mb-1 text-dark"><strong>Ubicación:</strong> ${deptoLocalidad} ${p.barrio ? `(B° ${p.barrio})` : ''}</div>
                    <div class="small mb-1 text-dark"><strong>Detalle / Insumos:</strong> ${p.detalle || 'Sin detalle'}</div>
                    <div class="small mb-2 text-muted"><strong>Observaciones:</strong> ${p.observaciones || 'Sin observaciones'}</div>
                    <div class="dropdown-divider"></div>
                    <div class="mt-2 text-center w-100">
                        ${botonAccion}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderizarControlesPaginacionProvisiones(totalRegistros, porPagina, totalPaginas) {
    const contenedor = document.getElementById('contenedor-paginacion-provisiones');
    if (!contenedor) return;

    if (totalRegistros === 0) {
        contenedor.innerHTML = '';
        return;
    }

    const selectPaginacion = document.getElementById('selectPaginacionProvisiones')?.value;
    if (selectPaginacion === 'todos') {
        contenedor.innerHTML = `<span class="text-muted small">Mostrando todas las provisiones (${totalRegistros} en total)</span>`;
        return;
    }

    const inicioRegistro = ((paginaActualProvisiones - 1) * porPagina) + 1;
    const finRegistro = Math.min(paginaActualProvisiones * porPagina, totalRegistros);

    contenedor.innerHTML = `
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-center w-100 py-2 px-1 mt-2 border-top border-secondary">
            <span class="text-muted small mb-2 mb-md-0">
                Mostrando <strong>${inicioRegistro}</strong> a <strong>${finRegistro}</strong> de <strong>${totalRegistros}</strong> provisiones
            </span>
            <nav aria-label="Navegación de páginas">
                <ul class="pagination pagination-sm m-0">
                    <li class="page-item ${paginaActualProvisiones === 1 ? 'disabled' : ''}">
                        <button class="page-link bg-dark text-light border-secondary" onclick="window.cambiarPaginaProvisiones(${paginaActualProvisiones - 1})">Anterior</button>
                    </li>
                    <li class="page-item disabled">
                        <span class="page-link bg-secondary text-white border-secondary fw-semibold">Pág. ${paginaActualProvisiones} de ${totalPaginas}</span>
                    </li>
                    <li class="page-item ${paginaActualProvisiones >= totalPaginas ? 'disabled' : ''}">
                        <button class="page-link bg-dark text-light border-secondary" onclick="window.cambiarPaginaProvisiones(${paginaActualProvisiones + 1})">Siguiente</button>
                    </li>
                </ul>
            </nav>
        </div>
    `;
}

async function cerrarCircuitoProvision(id) {
    const observaciones = prompt("Ingrese el resultado del retorno (Ej: Entregado correctamente, firmó el remito, etc.):");
    if (observaciones === null) return;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/provisiones/${id}/cerrar`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                estado_retorno: 'Cerrado / Entregado', 
                observaciones: observaciones || 'Entregado sin novedades' 
            })
        });
        
        const data = await res.json();
        if (data.success) {
            alert('¡Circuito cerrado correctamente!');
            cargarProvisionesData();
        } else {
            alert('Error al cerrar el circuito.');
        }
    } catch (error) {
        console.error('Error de red al intentar cerrar la provisión:', error);
        alert('Ocurrió un error de red.');
    }
}

// Exposición global
if (typeof window !== 'undefined') {
    window.verListaProvisiones = verListaProvisiones;
    window.cerrarCircuitoProvision = cerrarCircuitoProvision;
    window.manejarFiltrosProvisiones = manejarFiltrosProvisiones;
    window.cambiarPaginaProvisiones = cambiarPaginaProvisiones;
}