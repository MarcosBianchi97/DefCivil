// frontend/js/relevamientos-general.js
import { cargarVistaDinamica } from './utils.js';
import { mostrarNotificacion } from './ui.js';
import { departamentosYLocalidades } from './ubicaciones.js';
import { Storage } from './storage.js'; 
import { verFichaNecesidades } from './relevamientos-familias.js';
import { editarDatosFamilia } from './relevamientos-form.js';
import { verListaRelevamientos } from './relevamientos-familias.js';

// Variables globales en memoria para almacenar los relevamientos y la paginación local
let relevamientosOriginales = [];
let paginaActualRelevamientos = 1;

function getBadgePrioridad(prioridad) {
    if (prioridad === 'Alta') return 'bg-danger';
    if (prioridad === 'Media') return 'bg-warning text-dark';
    return 'bg-success';
}
function getBadgeEstado(estado) {
    const est = (estado || 'Nuevo').toLowerCase();
    if (est === 'completado' || est === 'finalizado') return 'bg-success';
    if (est === 'en proceso' || est === 'en curso') return 'bg-warning text-dark';
    return 'bg-info text-dark'; // Por defecto para 'Nuevo' u otros
}

function cargarDesplegablesUbicacion() {
    const selectDep = document.getElementById('r_departamento');
    const selectLoc = document.getElementById('r_localidad');
    if (!selectDep || !selectLoc) return;

    selectDep.innerHTML = '<option value="" selected disabled>Seleccione Departamento...</option>';
    const departamentos = Object.keys(departamentosYLocalidades);
    departamentos.forEach(depto => {
        const option = document.createElement('option');
        option.value = depto;
        option.textContent = depto;
        selectDep.appendChild(option);
    });

    selectLoc.innerHTML = '<option value="" selected disabled>Seleccione Localidad...</option>';

    selectDep.onchange = (e) => {
        const deptoElegido = e.target.value;
        const localidades = departamentosYLocalidades[deptoElegido] || [];

        selectLoc.innerHTML = '<option value="" selected disabled>Seleccione Localidad...</option>';
        localidades.forEach(loc => {
            const option = document.createElement('option');
            option.value = loc;
            option.textContent = loc;
            selectLoc.appendChild(option);
        });
    };
}

async function cargarDesplegableRelevadores() {
    const select = document.getElementById('r_relevador');
    if (!select) return;
    
    select.innerHTML = '<option value="" disabled selected>Asignar a...</option>';

    try {
        const token = localStorage.getItem('token');
        // Apuntamos a /api/usuarios pasando los filtros por URL
        const respuesta = await fetch('/api/usuarios?rol=Relevador&estado=Activo', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const resultado = await respuesta.json();

        if (resultado.success && resultado.data) {
            resultado.data.forEach(rev => {
                const option = document.createElement('option');
                option.value = rev.id; 
                option.textContent = `${rev.apellido}, ${rev.nombres}`;
                select.appendChild(option);
            });
        } else {
            console.error('No se pudieron cargar los relevadores activos');
        }
    } catch (error) {
        console.error('Error de red al obtener relevadores:', error);
    }
}

export function editarRelevamientoGeneral(idRelevamiento) {
    cargarVistaDinamica('/frontend/pages/form-relevamiento.html', async () => {
        try {
            const token = localStorage.getItem('token');
            const respuesta = await fetch(`/api/relevamientos/${idRelevamiento}`, {
                headers: { 'Authorization': `Bearer ${token}` } // <-- Enviar token
            });
            const rel = await respuesta.json();

            if (!respuesta.ok || !rel) {
                mostrarNotificacion("No se encontró el relevamiento a editar.", "error");
                verListaRelevamientos(); 
                return;
            }

            const titulo = document.getElementById('titulo-form-relevamiento');
            if (titulo) {
                titulo.innerHTML = `<i class="bi bi-pencil-square text-warning me-2"></i> Editar Configuración de Relevamiento`;
            }

            document.getElementById('r_id_edicion').value = rel.id_relevamiento || rel.id;

            cargarDesplegablesUbicacion();
            await cargarDesplegableRelevadores();

            const selectDep = document.getElementById('r_departamento');
            if (selectDep) {
                selectDep.value = rel.departamento || '';
                if (selectDep.onchange) selectDep.onchange({ target: selectDep });
            }

            document.getElementById('r_localidad').value = rel.localidad || '';
            document.getElementById('r_barrio').value = rel.barrio || '';
            document.getElementById('r_tipo_evento').value = rel.tipo_evento || '';
            document.getElementById('r_solicitante').value = rel.solicitante || '';
            document.getElementById('r_prioridad').value = rel.prioridad || 'Baja';
            document.getElementById('r_relevador').value = rel.relevador_asignado || '';

            const form = document.getElementById('form-nuevo-relevamiento');
            if (form) {
                form.removeEventListener('submit', guardarRelevamientoGeneral);
                form.addEventListener('submit', guardarRelevamientoGeneral);
            }
        } catch (error) {
            console.error("Error al obtener los datos para la edición:", error);
            mostrarNotificacion("Error al cargar los datos del relevamiento.", "error");
        }
    });
}
export async function eliminarRelevamientoGeneral(idRelevamiento) {
    if (!confirm('¿Estás seguro de que deseas eliminar este relevamiento y todas sus familias asociadas?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const respuesta = await fetch(`/api/relevamientos/${idRelevamiento}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` } // <-- Enviar token
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            mostrarNotificacion(resultado.mensaje || 'Relevamiento eliminado con éxito.', 'success');
            // Recargamos la tabla local para reflejar los cambios al instante
            cargarTablaRelevamientos();
        } else {
            mostrarNotificacion(resultado.mensaje || 'Error al intentar eliminar el relevamiento.', 'error');
        }
    } catch (error) {
        console.error('Error de red al eliminar relevamiento:', error);
        mostrarNotificacion('No se pudo conectar con el servidor.', 'error');
    }
}

export async function verPanelPrincipal() {
    cargarVistaDinamica('./frontend/pages/panel-principal.html', async () => {
        try {
            const token = localStorage.getItem('token'); // <-- Recuperar token
            const respuesta = await fetch('/api/relevamientos', {
                headers: { 'Authorization': `Bearer ${token}` } // <-- Enviar token
            });

            // Validamos primero si la respuesta es correcta antes de parsear a JSON
            if (!respuesta.ok) {
                const errorData = await respuesta.json().catch(() => ({}));
                throw new Error(errorData.mensaje || `Error en el servidor: ${respuesta.status}`);
            }

            const relevamientos = await respuesta.json();
            const listaRelevamientos = Array.isArray(relevamientos) ? relevamientos : [];

            if (listaRelevamientos.length === 0) {
                // Si no hay datos, muestra un mensaje amigable o sal de la función de forma segura
                tbodyDash.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No hay registros cargados</td></tr>`;
                return;
            }

            // Contadores reales basados en el estado del relevamiento
            const nuevos = listaRelevamientos.filter(r => (r.estado || 'nuevo').toLowerCase() === 'nuevo').length;
            const enProceso = listaRelevamientos.filter(r => {
                const est = (r.estado || '').toLowerCase();
                return est === 'en proceso' || est === 'en_proceso' || est === 'en-proceso';
            }).length;
            const completados = listaRelevamientos.filter(r => (r.estado || '').toLowerCase() === 'completado').length;
            
            let totalFamilias = 0;
            listaRelevamientos.forEach(r => {
                if (r.familias) totalFamilias += r.familias.length;
            });

            if (document.getElementById('dash-relevamientos-nuevos')) {
                animarContador('dash-relevamientos-nuevos', nuevos, 1000); 
                animarContador('dash-solicitudes-pendientes', enProceso, 1000); 
                animarContador('dash-familias-asistidas', completados, 1200);
                animarContador('dash-ordenes-aprobadas', totalFamilias, 1300); 
                animarContador('dash-entregas-reportes', listaRelevamientos.length, 1100);
            }

            const tbodyDash = document.getElementById('dash-tabla-emergencias');
            if (tbodyDash) {
                if (listaRelevamientos.length === 0) {
                    tbodyDash.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No hay emergencias asignadas</td></tr>`;
                    const contenedorMobile = document.getElementById('dash-tarjetas-emergencias-mobile');
                    if (contenedorMobile) contenedorMobile.innerHTML = `<div class="text-center text-muted small">No hay emergencias asignadas</div>`;
                    return;
                }
                
                const ultimos = listaRelevamientos.slice(0, 5);
                
                // 1. Llenamos la tabla de ESCRITORIO
                tbodyDash.innerHTML = ultimos.map(r => {
                    const deptoLoc = `<strong>${r.departamento || 'N/D'}</strong> (${r.localidad || 'N/D'})`;
                    const evento = r.tipo_evento || 'N/D';
                    const relevador = r.relevador_apellido ? `${r.relevador_apellido}, ${r.relevador_nombre}` : (r.relevador_asignado || 'Sin asignar');
                    const badgePrioridad = `<span class="badge ${r.prioridad === 'Alta' ? 'bg-danger' : r.prioridad === 'Media' ? 'bg-warning text-dark' : 'bg-secondary'}">${r.prioridad || 'Normal'}</span>`;

                    return `
                        <tr>
                            <td>${deptoLoc}</td>
                            <td>${evento}</td>
                            <td><small>${relevador}</small></td>
                            <td>${badgePrioridad}</td>
                        </tr>
                    `;
                }).join('');

                // 2. Llenamos las tarjetas descriptivas de CELULAR
                const contenedorMobile = document.getElementById('dash-tarjetas-emergencias-mobile');
                if (contenedorMobile) {
                    contenedorMobile.innerHTML = ultimos.map(r => {
                        const codigo = r.codigo_relevamiento || 'N/D';
                        const barrio = r.barrio ? ` - Barrio: ${r.barrio}` : '';
                        const evento = r.tipo_evento || 'N/D';
                        const relevador = r.relevador_apellido ? `${r.relevador_apellido}, ${r.relevador_nombre}` : (r.relevador_asignado || 'Sin asignar');
                        const badgePrioridad = `<span class="badge ${r.prioridad === 'Alta' ? 'bg-danger' : r.prioridad === 'Media' ? 'bg-warning text-dark' : 'bg-secondary'}">${r.prioridad || 'Normal'}</span>`;

                        return `
                            <div class="card bg-dark text-light border border-secondary shadow-sm p-3 mb-2 rounded-3">
                                <div class="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom border-secondary">
                                    <span class="fw-bold text-primary small">${codigo}</span>
                                    ${badgePrioridad}
                                </div>
                                <div class="small mb-1 text-light"><i class="bi bi-geo-alt text-primary me-1"></i><strong>Ubicación:</strong> ${r.departamento || ''} / ${r.localidad || ''} ${barrio}</div>
                                <div class="small mb-1 text-light"><i class="bi bi-exclamation-triangle text-warning me-1"></i><strong>Incidente:</strong> ${evento}</div>
                                <div class="small mb-0 text-light"><i class="bi bi-person-badge text-success me-1"></i><strong>Relevador:</strong> ${relevador}</div>
                            </div>
                        `;
                    }).join('');
                }
            }
        } catch (error) {
            console.error("Error al cargar los datos del panel principal:", error);
            const tbodyDash = document.getElementById('dash-tabla-emergencias');
            if (tbodyDash) {
                // Cambiamos el mensaje de error rojo por un aviso limpio de que no hay registros
                tbodyDash.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No hay emergencias asignadas</td></tr>`;
            }
        }
    });
}

// Función para animar números de contadores (efecto cuenta kilómetros)
function animarContador(elementoId, valorFinal, duracion = 1500) {
    const elemento = document.getElementById(elementoId);
    if (!elemento) return;

    // Asegurarse de que sea un número válido
    const objetivo = parseInt(valorFinal, 10);
    if (isNaN(objetivo) || objetivo === 0) {
        elemento.innerText = objetivo || '0';
        return; 
    }

    let tiempoInicio = null;

    const animar = (tiempoActual) => {
        if (!tiempoInicio) tiempoInicio = tiempoActual;
        const progreso = tiempoActual - tiempoInicio;
        
        // Easing (aceleración y desaceleración suave)
        const avancePorcentaje = Math.min(progreso / duracion, 1);
        const valorActual = Math.floor(avancePorcentaje * objetivo);

        elemento.innerText = valorActual;

        if (progreso < duracion) {
            window.requestAnimationFrame(animar);
        } else {
            elemento.innerText = objetivo; // Asegurar que termine exacto
        }
    };

    window.requestAnimationFrame(animar);
}

// Función principal que hace el fetch UNA VEZ y almacena en memoria
export async function cargarTablaRelevamientos() {
    const tbody = document.getElementById('tabla-relevamientos-body');
    if (!tbody) return;

    // Ocultar botón si es relevador
    const usuarioRaw = localStorage.getItem('usuario');
    if (usuarioRaw) {
        try {
            const usuario = JSON.parse(usuarioRaw);
            const rol = usuario.rol ? String(usuario.rol).trim().toLowerCase() : '';
            if (rol === 'relevador') {
                const btnNuevo = document.getElementById('btn-nuevo-relevamiento');
                if (btnNuevo) btnNuevo.style.display = 'none';
            }
        } catch (e) {}
    }

    tbody.innerHTML = `<tr><td colspan="10" class="text-center text-muted py-4">...`;
    // ... resto del código ...

    try {
        const token = localStorage.getItem('token'); // <-- Recuperar token
        const respuesta = await fetch('/api/relevamientos', {
            headers: { 'Authorization': `Bearer ${token}` } // <-- Enviar token
        });
        const relevamientos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(relevamientos.mensaje || 'Error al obtener los datos.');
        }

        relevamientosOriginales = relevamientos || [];
        paginaActualRelevamientos = 1;

        // --- Atrapamos el filtro si venimos del Dashboard ---
        const filtroPendiente = sessionStorage.getItem('filtroRapido');
        if (filtroPendiente) {
            const inputBusqueda = document.getElementById('inputBusquedaRelevamiento');
            if (inputBusqueda) {
                inputBusqueda.value = filtroPendiente;
            }
            sessionStorage.removeItem('filtroRapido');
        }
        // ----------------------------------------------------

        manejarCambioFiltrosRelevamientos();
    
    // Disparamos la actualización en segundo plano sin bloquear nada
    actualizarConteoFamiliasEnSegundoPlano(relevamientosOriginales);

    } catch (error) {
        console.error("Error al cargar la tabla de relevamientos:", error);
        tbody.innerHTML = `<tr><td colspan="10" class="text-center text-danger py-4">Error al conectar con el servidor.</td></tr>`;
    }
}

// Función central que procesa búsqueda, ordenamiento y paginación local de Relevamientos
export function manejarCambioFiltrosRelevamientos(resetPagina = true) {
    if (resetPagina) paginaActualRelevamientos = 1;

    const textoBusqueda = document.getElementById('inputBusquedaRelevamiento')?.value.toLowerCase().trim() || '';
    const criterioOrden = document.getElementById('selectOrdenarRelevamientos')?.value || '';
    const selectPaginacion = document.getElementById('selectPaginacionRelevamientos')?.value || '10';

    // Normalizamos el texto de búsqueda (reemplazando guiones bajos por espacios para que "en_proceso" y "en proceso" sean lo mismo)
    const textoBusquedaNormalizado = textoBusqueda.replace(/_/g, ' ');

    // 1. Filtrado local por Código, Localidad, Barrio, Solicitante o Estado
    let resultado = relevamientosOriginales.filter(r => {
        const codigo = (r.codigo_relevamiento || '').toLowerCase();
        const localidad = (r.localidad || '').toLowerCase();
        const departamento = (r.departamento || '').toLowerCase();
        const barrio = (r.barrio || '').toLowerCase();
        const solicitante = (r.solicitante || '').toLowerCase();
        const estadoOriginal = (r.estado || '').toLowerCase();
        const estadoNormalizado = estadoOriginal.replace(/_/g, ' '); // Normaliza el estado de la BD

        return codigo.includes(textoBusquedaNormalizado) || 
               localidad.includes(textoBusquedaNormalizado) || 
               departamento.includes(textoBusquedaNormalizado) || 
               barrio.includes(textoBusquedaNormalizado) || 
               solicitante.includes(textoBusquedaNormalizado) ||
               estadoOriginal.includes(textoBusquedaNormalizado) ||
               estadoNormalizado.includes(textoBusquedaNormalizado);
    });

    // 2. Ordenamiento local
    if (criterioOrden === 'localidad') {
        resultado.sort((a, b) => (a.localidad || '').localeCompare(b.localidad || ''));
    } else if (criterioOrden === 'solicitante') {
        resultado.sort((a, b) => (a.solicitante || '').localeCompare(b.solicitante || ''));
    } else if (criterioOrden === 'prioridad') {
        const pesoPrioridad = { 'alta': 1, 'media': 2, 'baja': 3 };
        resultado.sort((a, b) => {
            const pA = pesoPrioridad[(a.prioridad || '').toLowerCase()] || 4;
            const pB = pesoPrioridad[(b.prioridad || '').toLowerCase()] || 4;
            return pA - pB;
        });
    } else if (criterioOrden === 'relevador') {
        resultado.sort((a, b) => {
            const revA = (a.relevador_apellido ? `${a.relevador_apellido}, ${a.relevador_nombre}` : (a.relevador_asignado || '')).toLowerCase();
            const revB = (b.relevador_apellido ? `${b.relevador_apellido}, ${b.relevador_nombre}` : (b.relevador_asignado || '')).toLowerCase();
            return revA.localeCompare(revB);
        });
    } else {
        // Por defecto: Más recientes primero (por fecha de creación descendente)
        resultado.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    // 3. Paginación local
    let relevamientosPaginados = resultado;
    let totalPaginas = 1;

    if (selectPaginacion !== 'todos') {
        const porPagina = parseInt(selectPaginacion, 10);
        totalPaginas = Math.ceil(resultado.length / porPagina) || 1;
        
        if (paginaActualRelevamientos > totalPaginas) paginaActualRelevamientos = totalPaginas;
        if (paginaActualRelevamientos < 1) paginaActualRelevamientos = 1;

        const inicio = (paginaActualRelevamientos - 1) * porPagina;
        const fin = inicio + porPagina;
        relevamientosPaginados = resultado.slice(inicio, fin);
    }

    renderizarFilasRelevamientos(relevamientosPaginados);
    renderizarControlesPaginacionRelevamientos(resultado.length, selectPaginacion === 'todos' ? resultado.length : parseInt(selectPaginacion, 10), totalPaginas);
}

// Función auxiliar para cambiar de página desde los botones de Relevamientos
window.cambiarPaginaRelevamientos = function(nuevaPagina) {
    paginaActualRelevamientos = nuevaPagina;
    manejarCambioFiltrosRelevamientos(false);
}

// Renderizado de filas en la tabla y tarjetas para móviles
function renderizarFilasRelevamientos(relevamientos) {
    const tbody = document.getElementById('tabla-relevamientos-body');
    if (!tbody) return;

    if (!relevamientos || relevamientos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="text-center text-muted py-4">No se encontraron relevamientos con los criterios de búsqueda.</td></tr>`;
        return;
    }

    // Verificamos si el usuario actual es administrador u operador (o si NO es relevador)
    let esAdminOOperador = true;
    const usuarioRaw = localStorage.getItem('usuario');
    if (usuarioRaw) {
        try {
            const usr = JSON.parse(usuarioRaw);
            const rol = usr.rol ? String(usr.rol).trim().toLowerCase() : '';
            if (rol === 'relevador') {
                esAdminOOperador = false;
            }
        } catch (e) {}
    }

    tbody.innerHTML = relevamientos.map(r => {
        const estadoRaw = (r.estado || '').toLowerCase().trim();
        const esNuevo = estadoRaw === 'nuevo';
        const esEnProceso = estadoRaw === 'en_proceso' || estadoRaw === 'en-proceso' || estadoRaw === 'en proceso';
        const esCompletado = estadoRaw === 'completado';

        const idRel = r.id_relevamiento || r.id;
        const codigo = r.codigo_relevamiento || 'N/D';
        const fecha = r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'N/D';
        const ubicacion = `<strong>${r.departamento || ''}</strong> / ${r.localidad || ''}`;
        const barrio = r.barrio || 'Sin barrio';
        const evento = r.tipo_evento || 'N/D';
        const solicitante = r.solicitante || 'N/D';
        const relevador = r.relevador_apellido ? `${r.relevador_apellido}, ${r.relevador_nombre}` : (r.relevador_asignado || 'Sin asignar');
        const cantFamilias = r.total_familias !== undefined ? r.total_familias : 0;

        // Bloque de botones condicionado según el rol (oculta editar y eliminar para relevadores)
        const botonesAccion = `
            <div class="d-flex justify-content-center align-items-center gap-2">
                ${esCompletado ? `
                    <button class="btn btn-sm btn-outline-secondary" onclick="window.abrirModalDevolucion('${idRel}')" title="Devolver al relevador">
                        <i class="bi bi-arrow-counterclockwise"></i>
                    </button>
                ` : `
                    ${esAdminOOperador ? `
                    <button class="btn btn-sm btn-outline-warning" onclick="window.editarRelevamiento('${idRel}')" title="Editar Configuración">
                        <i class="bi bi-pencil-square"></i>
                    </button>
                    ` : ''}
                    ${esEnProceso ? `
                    <button class="btn btn-sm btn-outline-success" onclick="window.completarRelevamientoGeneral('${idRel}')" title="Marcar como Completado">
                        <i class="bi bi-check-circle"></i>
                    </button>
                    ` : ''}
                `}
                <button class="btn btn-sm btn-outline-primary" onclick="window.ingresarARelevamiento('${idRel}')" title="Ver Familias">
                    <i class="bi bi-eye"></i>
                </button>
                ${esAdminOOperador ? `
                <button class="btn btn-sm btn-outline-danger" onclick="window.eliminarRelevamiento('${idRel}')" title="Eliminar Relevamiento">
                    <i class="bi bi-trash"></i>
                </button>
                ` : ''}
            </div>
        `;

        return `
        <!-- 1. VISTA DE ESCRITORIO (Columnas Agrupadas) -->
        <tr class="d-none d-md-table-row">
            <!-- Código / Fecha -->
            <td>
                <strong>${codigo}</strong><br>
                <small class="text-muted" style="font-size: 0.8em;">${fecha}</small>
            </td>
            <!-- Estado -->
            <td><span class="badge ${getBadgeEstado(r.estado)}">${r.estado || 'Nuevo'}</span></td>
            <!-- Ubicación / Barrio -->
            <td>
                ${ubicacion}<br>
                <small class="text-muted"><i class="bi bi-geo-alt me-1"></i>${barrio}</small>
            </td>
            <!-- Evento / Prioridad -->
            <td>
                ${evento}<br>
                <span class="badge ${getBadgePrioridad(r.prioridad)} mt-1" style="font-size: 0.75em;">${r.prioridad || 'Baja'}</span>
            </td>
            <!-- Solicitante Truncado -->
            <td class="col-truncada" title="${solicitante}">${solicitante}</td>
            <!-- Relevador -->
            <td>${relevador}</td>
            <!-- Familias -->
            <td class="text-center" id="contador-familias-${idRel}">0</td>
            <!-- Acciones ancladas -->
            <td class="text-center col-acciones">${botonesAccion}</td>
        </tr>

        <!-- 2. VISTA MÓVIL (Tarjeta adaptable para celulares) -->
        <tr class="d-block d-md-none mb-3 border rounded shadow-sm bg-white p-3">
            <td class="text-start">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <strong>${codigo}</strong>
                    <span class="badge ${getBadgeEstado(r.estado)}">${r.estado || 'Nuevo'}</span>
                </div>
                <div class="small text-muted mb-1"><i class="bi bi-geo-alt me-1"></i>${ubicacion} (${barrio})</div>
                <div class="small mb-1"><strong>Evento:</strong> ${evento} | <strong>Solicitante:</strong> ${solicitante}</div>
                <div class="small mb-1"><strong>Prioridad:</strong> <span class="badge ${getBadgePrioridad(r.prioridad)}">${r.prioridad || 'Baja'}</span></div>
                <div class="small mb-1"><strong>Relevador:</strong> ${relevador}</div>
                <div class="small mb-2"><strong>Familias cargadas:</strong> <span id="contador-familias-mobile-${idRel}">0</span></div>
                <div class="dropdown-divider"></div>
                <div class="mt-2 text-center w-100">
                    ${botonesAccion}
                </div>
            </td>
        </tr>
    `;
    }).join('');
}

// Renderiza los controles de paginación estilizados y con contraste correcto
function renderizarControlesPaginacionRelevamientos(totalRegistros, porPagina, totalPaginas) {
    const contenedor = document.getElementById('contenedor-paginacion-relevamientos');
    if (!contenedor) return;

    if (totalRegistros === 0) {
        contenedor.innerHTML = '';
        return;
    }

    const selectPaginacion = document.getElementById('selectPaginacionRelevamientos')?.value;
    if (selectPaginacion === 'todos') {
        contenedor.innerHTML = `<span class="text-white-50 small">Mostrando todos los registros (${totalRegistros} en total)</span>`;
        return;
    }

    const inicioRegistro = ((paginaActualRelevamientos - 1) * porPagina) + 1;
    const finRegistro = Math.min(paginaActualRelevamientos * porPagina, totalRegistros);

    contenedor.innerHTML = `
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-center w-100 py-2 px-1 mt-2 border-top border-secondary">
            <span class="text-light small mb-2 mb-md-0 opacity-75">
                Mostrando <strong class="text-white">${inicioRegistro}</strong> a <strong class="text-white">${finRegistro}</strong> de <strong class="text-white">${totalRegistros}</strong> relevamientos
            </span>
            <nav aria-label="Navegación de páginas">
                <ul class="pagination pagination-sm m-0">
                    <li class="page-item ${paginaActualRelevamientos === 1 ? 'disabled' : ''}">
                        <button class="page-link bg-dark text-light border-secondary" onclick="window.cambiarPaginaRelevamientos(${paginaActualRelevamientos - 1})">Anterior</button>
                    </li>
                    <li class="page-item disabled">
                        <span class="page-link bg-secondary text-white border-secondary fw-semibold">Pág. ${paginaActualRelevamientos} de ${totalPaginas}</span>
                    </li>
                    <li class="page-item ${paginaActualRelevamientos >= totalPaginas ? 'disabled' : ''}">
                        <button class="page-link bg-dark text-light border-secondary" onclick="window.cambiarPaginaRelevamientos(${paginaActualRelevamientos + 1})">Siguiente</button>
                    </li>
                </ul>
            </nav>
        </div>
    `;
}

export function mostrarFormularioNuevoRelevamiento() {
    cargarVistaDinamica('./frontend/pages/form-relevamiento.html', () => {
        const titulo = document.getElementById('titulo-form-relevamiento');
        if (titulo) {
            titulo.innerHTML = `<i class="bi bi-plus-circle-fill text-primary me-2"></i> Nuevo Relevamiento`;
        }

        const idEdicion = document.getElementById('r_id_edicion');
        if (idEdicion) idEdicion.value = '';

        const form = document.getElementById('form-nuevo-relevamiento');
        if (form) {
            form.reset();
            form.removeEventListener('submit', guardarRelevamientoGeneral);
            form.addEventListener('submit', guardarRelevamientoGeneral);
        }

        cargarDesplegablesUbicacion();
        cargarDesplegableRelevadores();
    });
}

async function guardarRelevamientoGeneral(event) {
    event.preventDefault();

    const idEdicion = document.getElementById('r_id_edicion').value;
    
    const datosFormulario = {
        departamento: document.getElementById('r_departamento').value,
        localidad: document.getElementById('r_localidad').value,
        barrio: document.getElementById('r_barrio')?.value || '',
        tipo_evento: document.getElementById('r_tipo_evento').value,
        solicitante: document.getElementById('r_solicitante')?.value || '',
        prioridad: document.getElementById('r_prioridad')?.value || 'Baja',
        relevador_asignado: document.getElementById('r_relevador').value
    };

    const url = idEdicion ? `/api/relevamientos/${idEdicion}` : '/api/relevamientos';
    const metodo = idEdicion ? 'PUT' : 'POST';

    try {
        const token = localStorage.getItem('token'); // <-- Recuperar token
        const respuesta = await fetch(url, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // <-- Enviar token
            },
            body: JSON.stringify(datosFormulario)
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            mostrarNotificacion(resultado.mensaje || 'Operación realizada con éxito.', 'success');
            
            document.getElementById('form-nuevo-relevamiento').reset();
            document.getElementById('r_id_edicion').value = '';

            if (typeof verListaRelevamientos === 'function') {
                verListaRelevamientos();
            } else {
                cargarTablaRelevamientos(); 
            }
        } else {
            console.warn("Detalle del error del backend:", resultado);
            mostrarNotificacion(resultado.mensaje || resultado.error || 'Error al procesar la solicitud.', 'error');
        }
    } catch (error) {
        console.error('Error de red al intentar guardar:', error);
        mostrarNotificacion('No se pudo conectar con el servidor.', 'error');
    }
}

export async function completarRelevamientoGeneral(idRelevamiento) {
    // Si ya existe un modal de confirmación previo, lo removemos para evitar duplicados
    const modalAntiguo = document.getElementById('modalConfirmacionDinamico');
    if (modalAntiguo) modalAntiguo.remove();

    // Creamos el HTML del modal con la estética oscura/Bootstrap de la app
    const htmlModal = `
        <div class="modal fade" id="modalConfirmacionDinamico" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content bg-dark text-light border border-secondary shadow-lg">
                    <div class="modal-header border-bottom border-secondary bg-success text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-check-circle-fill me-2"></i> Confirmar Finalización
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body py-4">
                        <p class="mb-0">¿Estás seguro de marcar este relevamiento como completado?</p>
                        <small class="text-white-50">Esta acción finalizará la carga de familias y bloqueará futuras modificaciones.</small>
                    </div>
                    <div class="modal-footer border-top border-secondary">
                        <button type="button" class="btn btn-outline-light btn-sm" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-success btn-sm fw-bold px-3" id="btnConfirmarAccionRel">Sí, Completar</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Inyectamos el modal al final del body
    document.body.insertAdjacentHTML('beforeend', htmlModal);
    const modalElement = document.getElementById('modalConfirmacionDinamico');
    const modalInstance = new bootstrap.Modal(modalElement);
    modalInstance.show();

    // Manejamos la respuesta al hacer clic en "Sí, Completar"
    document.getElementById('btnConfirmarAccionRel').onclick = async () => {
        modalInstance.hide();
        modalElement.remove();

        try {
            const token = localStorage.getItem('token');
            const respuesta = await fetch(`/api/relevamientos/${idRelevamiento}/completar`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const resultado = await respuesta.json();

            if (respuesta.ok) {
                mostrarNotificacion(resultado.mensaje || 'Relevamiento completado con éxito.', 'success');
                cargarTablaRelevamientos();
            } else {
                mostrarNotificacion(resultado.mensaje || 'Error al intentar completar el relevamiento.', 'error');
            }
        } catch (error) {
            console.error('Error de red al completar relevamiento:', error);
            mostrarNotificacion('No se pudo conectar con el servidor.', 'error');
        }
    };

    // Limpieza si el usuario cierra el modal con la X o fuera de él
    modalElement.addEventListener('hidden.bs.modal', () => {
        modalElement.remove();
    });
}

// 1. Función para abrir el modal y guardar temporalmente el ID del relevamiento
window.abrirModalDevolucion = function(idRelevamiento) {
    const inputId = document.getElementById('devolucion_id_relevamiento');
    const inputMotivo = document.getElementById('devolucion_motivo');
    
    if (inputId) inputId.value = idRelevamiento;
    if (inputMotivo) inputMotivo.value = ''; // Limpiar campo anterior

    // Mostrar el modal usando Bootstrap
    const modalElement = document.getElementById('modalDevolucionRelevamiento');
    if (modalElement && typeof bootstrap !== 'undefined') {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }
};

// 2. Función para confirmar la devolución y enviarla al servidor
window.confirmarDevolucionRelevamiento = async function() {
    const idRelevamiento = document.getElementById('devolucion_id_relevamiento')?.value;
    const motivo = document.getElementById('devolucion_motivo')?.value.trim();

    if (!motivo) {
        mostrarNotificacion('Por favor, ingrese el motivo de la devolución.', 'error');
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
            mostrarNotificacion(resultado.mensaje || 'Relevamiento devuelto con éxito.', 'success');
            
            // Cerrar el modal
            const modalElement = document.getElementById('modalDevolucionRelevamiento');
            if (modalElement && typeof bootstrap !== 'undefined') {
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) modal.hide();
            }

            // Recargar la tabla para ver reflejado el cambio de estado
            cargarTablaRelevamientos();
        } else {
            mostrarNotificacion(resultado.mensaje || 'Error al intentar devolver el relevamiento.', 'error');
        }
    } catch (error) {
        console.error('Error de red al devolver relevamiento:', error);
        mostrarNotificacion('No se pudo conectar con el servidor.', 'error');
    }
};

// Función para navegar desde los KPIs del dashboard a la tabla filtrada
window.navegarYFiltrar = function(criterio, valor) {
    sessionStorage.setItem('filtroRapido', valor);
    
    // Busca el enlace de "Relevamientos" en el menú y lo clickea
    const enlacesMenu = document.querySelectorAll('a, .nav-link');
    for (let enlace of enlacesMenu) {
        if (enlace.innerText.trim() === 'Relevamientos') {
            enlace.click();
            return; 
        }
    }
};

async function actualizarConteoFamiliasEnSegundoPlano(relevamientos) {
    const token = localStorage.getItem('token');
    if (!token || !Array.isArray(relevamientos)) return;

    // Recorremos cada relevamiento y consultamos su endpoint individual en paralelo
    relevamientos.forEach(async (r) => {
        const idRel = r.id_relevamiento || r.id;
        if (!idRel) return;

        try {
            const respuesta = await fetch(`/api/familias?id_relevamiento=${idRel}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (respuesta.ok) {
                const familiasAsociadas = await respuesta.json();
                const total = Array.isArray(familiasAsociadas) ? familiasAsociadas.length : 0;

                // Actualizamos el texto en la tabla de escritorio si existe
                const celdaEscritorio = document.getElementById(`contador-familias-${idRel}`);
                if (celdaEscritorio) {
                    celdaEscritorio.textContent = total;
                }

                // Actualizamos el texto en la tarjeta móvil si existe
                const celdaMobile = document.getElementById(`contador-familias-mobile-${idRel}`);
                if (celdaMobile) {
                    celdaMobile.textContent = total;
                }
            }
        } catch (e) {
            // Silencioso para que no afecte en nada si falla alguna petición puntual
        }
    });
}




// No olvides exponerla en el objeto window al final del archivo:
window.completarRelevamientoGeneral = completarRelevamientoGeneral;

// Exposiciones globales necesarias
window.verPanelPrincipal = verPanelPrincipal;
window.editarRelevamiento = editarRelevamientoGeneral;
window.eliminarRelevamiento = eliminarRelevamientoGeneral;
window.mostrarFormularioNuevoRelevamiento = mostrarFormularioNuevoRelevamiento;
window.cargarTablaRelevamientos = cargarTablaRelevamientos;
window.manejarCambioFiltrosRelevamientos = manejarCambioFiltrosRelevamientos;
window.verFichaNecesidades = verFichaNecesidades;
window.editarDatosFamilia = editarDatosFamilia;