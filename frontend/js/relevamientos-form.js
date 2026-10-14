import { mostrarNotificacion } from './ui.js';
import { cargarVistaDinamica } from './utils.js';

let listaTemporalMateriales = [];

// Portapapeles auxiliar exclusivo para la interfaz visual de archivos pendientes
let dtArchivosUI = new DataTransfer();

function renderizarListaVisual(tipo, arreglo) {
    const ul = document.getElementById(`lista-dinamica-${tipo}`);
    if (!ul) return;

    if (arreglo.length === 0) {
        ul.innerHTML = `<li class="list-group-item text-muted text-center py-3 bg-light opacity-75 small">Ninguno agregado</li>`;
        return;
    }

    ul.innerHTML = arreglo.map((item, index) => `
        <li class="list-group-item d-flex justify-content-between align-items-center p-1 ps-2 bg-light border-secondary-subtle mb-1 rounded">
            <span><strong>${item.cantidad}</strong> x ${item.nombre}</span>
            <button type="button" class="btn btn-sm btn-link text-danger p-0 me-1" onclick="eliminarItemLista('${tipo}', ${index})">
                <i class="bi bi-trash-fill"></i>
            </button>
        </li>
    `).join('');
}

function renderizarDocumentosGuardados(documentos, idFamiliaActual) {
    const contenedor = document.getElementById('lista-archivos-guardados');
    if (!contenedor) return;

    if (!documentos || documentos.length === 0) {
        contenedor.innerHTML = ''; 
        return;
    }

    contenedor.innerHTML = `
        <div class="mb-2 p-2 border border-success rounded bg-light">
            <span class="text-success small fw-bold d-block mb-1"><i class="bi bi-cloud-check-fill"></i> Archivos ya guardados en la nube:</span>
            ${documentos.map(doc => {
                const idDocReal = doc.id || doc.id_documento || doc.id_documentacion || doc.id_archivo || '';
                const nombreArchivo = doc.nombre_archivo || doc.nombre || 'Archivo adjunto';
                const rutaArchivo = doc.ruta_archivo || doc.url || '#';

                return `
                    <div class="d-flex justify-content-between align-items-center p-2 mt-1 bg-dark border border-secondary rounded shadow-sm text-light small">
                        <a href="${rutaArchivo}" target="_blank" class="text-decoration-none text-info text-truncate fw-medium me-2" style="max-width: 65%;" title="${nombreArchivo}">
                            <i class="bi bi-file-earmark-pdf-fill text-danger me-2"></i> ${nombreArchivo}
                        </a>
                        <div class="d-flex align-items-center gap-2">
                            <span class="badge text-bg-success" style="font-size: 0.7em;">En Nube</span>
                            <button type="button" class="btn btn-sm btn-outline-danger py-0 px-2" onclick="eliminarArchivoAdjunto('${idDocReal}', '${nombreArchivo}', '${idFamiliaActual}')" title="Eliminar archivo permanentemente">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// ==================== GESTIÓN VISUAL DE ARCHIVOS PENDIENTES ====================

export function agregarArchivoAListaVisual() {
    const inputVisual = document.getElementById('inputArchivo');
    if (!inputVisual || inputVisual.files.length === 0) {
        mostrarNotificacion("Por favor, seleccione un archivo o capture una foto.", "error");
        return;
    }

    const archivo = inputVisual.files[0];

    let yaExiste = false;
    for (let i = 0; i < dtArchivosUI.files.length; i++) {
        if (dtArchivosUI.files[i].name === archivo.name) {
            yaExiste = true;
            break;
        }
    }

    if (!yaExiste) {
        dtArchivosUI.items.add(archivo);
        sincronizarInputRealYVisual();
        mostrarNotificacion(`Archivo "${archivo.name}" agregado a la lista.`, "success");
        inputVisual.value = ""; 
    } else {
        mostrarNotificacion("Este archivo ya se encuentra en la lista.", "error");
    }
}

export function eliminarArchivoDeListaVisual(index) {
    const nuevoDt = new DataTransfer();
    Array.from(dtArchivosUI.files).forEach((file, i) => {
        if (i !== index) nuevoDt.items.add(file);
    });
    dtArchivosUI = nuevoDt;
    sincronizarInputRealYVisual();
}

function sincronizarInputRealYVisual() {
    const inputEnvioReal = document.getElementById('inputEnvioReal');
    if (inputEnvioReal) {
        inputEnvioReal.files = dtArchivosUI.files;
    }

    const ul = document.getElementById('lista-archivos-pendientes');
    if (!ul) return;

    ul.innerHTML = '';

    if (dtArchivosUI.files.length === 0) {
        ul.innerHTML = `<li class="list-group-item text-muted text-center py-2 bg-transparent border-0 small">Ningún archivo adjuntado</li>`;
        return;
    }

    Array.from(dtArchivosUI.files).forEach((file, index) => {
        const li = document.createElement('li');
        li.className = "list-group-item p-1 d-flex justify-content-between align-items-center bg-dark border border-secondary rounded mb-1 text-light small";
        li.innerHTML = `
            <span class="text-truncate" style="max-width: 80%;">📎 ${file.name}</span>
            <button type="button" class="btn btn-sm btn-link text-danger p-0 me-1" onclick="window.eliminarArchivoDeListaVisual(${index})">
                <i class="bi bi-trash-fill"></i>
            </button>
        `;
        ul.appendChild(li);
    });
}

// ==================== MATERIALES E INTEGRANTES ====================

export function agregarItemLista(tipo) {
    const inputItem = document.getElementById(`input-item-${tipo}`);
    const inputCant = document.getElementById(`input-cant-${tipo}`);
    
    if (!inputItem || !inputCant) return;

    const nombre = inputItem.value.trim();
    const cantidad = parseInt(inputCant.value) || 1;

    if (nombre === "") {
        mostrarNotificacion("Por favor, ingrese una descripción válida.", "error");
        return;
    }

    const nuevoItem = { tipo_material: nombre, nombre: nombre, cantidad };

    listaTemporalMateriales.push(nuevoItem);
    renderizarListaVisual('mat', listaTemporalMateriales);

    inputItem.value = "";
    inputCant.value = "";
    inputItem.focus();
}

export function eliminarItemLista(tipo, index) {
    listaTemporalMateriales.splice(index, 1);
    renderizarListaVisual('mat', listaTemporalMateriales);
}

export function inicializarCalculoIntegrantes() {
    const inputMayores = document.getElementById('f_mayores');
    const inputMenores = document.getElementById('f_menores');
    const inputTotal = document.getElementById('f_total');

    if (!inputMayores || !inputMenores || !inputTotal) return;

    const calcular = () => {
        const mayores = parseInt(inputMayores.value) || 0;
        const menores = parseInt(inputMenores.value) || 0;
        inputTotal.value = mayores + menores;
    };

    inputMayores.oninput = calcular;
    inputMenores.oninput = calcular;
    
    calcular();
}

// ==================== GUARDADO DEFINITIVO ====================

export async function guardarDatosFamiliaDefinitivo(e) {
    if (e) e.preventDefault();

    const form = e.target;

    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        
        const primerInvalido = form.querySelector(':invalid');
        if (primerInvalido) {
            const pasoContenedor = primerInvalido.closest('.wizard-step');
            if (pasoContenedor) {
                const idPaso = pasoContenedor.id.replace('step-', '');
                if (typeof cambiarPasoWizard === 'function') {
                    cambiarPasoWizard(parseInt(idPaso));
                }
            }
            primerInvalido.focus();
        }

        mostrarNotificacion("Faltan campos obligatorios para registrar la familia.", "error");
        return;
    }

    try {
        const idFamiliaEdicion = document.getElementById('f_id_edicion')?.value;
        const formData = new FormData(form);

        // Mapeo blindado y completo de todos los campos hacia el servidor
        formData.set('id_relevamiento', window.idRelevamientoActivo);
        formData.set('jefe_familia', `${document.getElementById('f_apellido').value.trim()}, ${document.getElementById('f_nombre').value.trim()}`);
        formData.set('dni_jefe', document.getElementById('f_dni')?.value.trim() || '');
        formData.set('telefono', document.getElementById('f_telefono')?.value.trim() || '');
        formData.set('direccion', document.getElementById('f_direccion')?.value.trim() || '');
        formData.set('mayores', document.getElementById('f_mayores')?.value || '1');
        formData.set('menores', document.getElementById('f_menores')?.value || '0');
        formData.set('cantidad_integrantes', document.getElementById('f_total')?.value || '1');
        formData.set('urgencia_familiar', document.getElementById('f_urgencia_familiar')?.value || '');
        formData.set('observaciones', document.getElementById('f_observaciones')?.value || '');
        formData.set('necesidades', JSON.stringify(listaTemporalMateriales));

        // Asistencia inmediata vinculada a los IDs reales del HTML
        formData.set('unidades_alimentarias', document.getElementById('f_need_alimentos')?.value || '0');
        formData.set('abrigos', document.getElementById('f_need_abrigos')?.value || '0');
        formData.set('frazadas', document.getElementById('f_need_frazadas')?.value || '0');
        formData.set('bidones_agua', document.getElementById('f_need_agua')?.value || '0');
        formData.set('kits_higiene', document.getElementById('f_need_higiene')?.value || '0');
        formData.set('ropa', document.getElementById('f_need_ropa')?.value || '0');
        formData.set('colchones', document.getElementById('f_need_colchones')?.value || '0');

        // Daños en la vivienda
        ['f_dano_techo', 'f_dano_paredes', 'f_dano_pisos', 'f_dano_instalaciones', 'f_dano_perdida_completa'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (id === 'f_dano_perdida_completa') {
                    formData.set('danos_estructurales', el.checked);
                    formData.set('requiere_evacuacion', el.checked);
                } else {
                    formData.set(id.replace('f_', ''), el.checked);
                }
            }
        });

        const url = idFamiliaEdicion ? `/api/familias/${idFamiliaEdicion}` : '/api/familias';
        const metodo = idFamiliaEdicion ? 'PUT' : 'POST';
        const token = localStorage.getItem('token');

        const respuesta = await fetch(url, {
            method: metodo,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const resultado = await respuesta.json();
        if (!respuesta.ok) throw new Error(resultado.mensaje || 'Error al guardar la familia.');

        mostrarNotificacion(resultado.mensaje || "Familia guardada exitosamente.");

        if (typeof verListaFamilias === 'function') {
            verListaFamilias(window.idRelevamientoActivo);
        } else if (typeof ingresarARelevamiento === 'function') {
            ingresarARelevamiento(window.idRelevamientoActivo);
        }

    } catch (error) {
        console.error("Error al guardar familia:", error);
        mostrarNotificacion(error.message, "error");
    }
}

export async function editarDatosFamilia(idFamilia) {
    cargarVistaDinamica('./frontend/pages/form-familia.html', async () => {
        dtArchivosUI = new DataTransfer();
        sincronizarInputRealYVisual();

        const titulo = document.getElementById('titulo-form-familia');
        if (titulo) titulo.innerHTML = `<i class="bi bi-pencil-square text-warning me-2"></i> Editar Datos de la Familia`;

        const inputIdEdicion = document.getElementById('f_id_edicion');
        if (inputIdEdicion) inputIdEdicion.value = idFamilia;

        inicializarCalculoIntegrantes();

        try {
            const respuesta = await fetch(`/api/familias/${idFamilia}`);
            if (!respuesta.ok) throw new Error("No se pudo obtener la información de la familia.");
            
            const fam = await respuesta.json();
            
            if (fam.relevamiento_id || fam.id_relevamiento) {
                window.idRelevamientoActivo = fam.relevamiento_id || fam.id_relevamiento;
            }
            
            if (document.getElementById('f_dni')) document.getElementById('f_dni').value = fam.dni_jefe || fam.dni || '';
            if (fam.jefe_familia) {
                const partes = fam.jefe_familia.split(',');
                if (document.getElementById('f_apellido')) document.getElementById('f_apellido').value = partes[0]?.trim() || '';
                if (document.getElementById('f_nombre')) document.getElementById('f_nombre').value = partes[1]?.trim() || '';
            }
            if (document.getElementById('f_telefono')) document.getElementById('f_telefono').value = fam.telefono || '';
            if (document.getElementById('f_direccion')) document.getElementById('f_direccion').value = fam.direccion || '';
            
            if (document.getElementById('f_mayores')) document.getElementById('f_mayores').value = fam.mayores ?? 1;
            if (document.getElementById('f_menores')) document.getElementById('f_menores').value = fam.menores ?? 0;
            if (document.getElementById('f_total')) document.getElementById('f_total').value = fam.cantidad_integrantes || fam.total_personas || 1;
            
            const selectPrioridad = document.getElementById('f_urgencia_familiar');
            if (selectPrioridad) selectPrioridad.value = fam.urgencia_familiar || fam.prioridad || '';

            if (document.getElementById('f_dano_techo')) document.getElementById('f_dano_techo').checked = Boolean(fam.dano_techo);
            if (document.getElementById('f_dano_paredes')) document.getElementById('f_dano_paredes').checked = Boolean(fam.dano_paredes);
            if (document.getElementById('f_dano_pisos')) document.getElementById('f_dano_pisos').checked = Boolean(fam.dano_pisos);
            if (document.getElementById('f_dano_instalaciones')) document.getElementById('f_dano_instalaciones').checked = Boolean(fam.dano_instalaciones || fam.instalaciones_afectadas);
            if (document.getElementById('f_dano_perdida_completa')) document.getElementById('f_dano_perdida_completa').checked = Boolean(fam.danos_estructurales || fam.requiere_evacuacion);

            // Carga correcta de asistencia inmediata al editar
            if (document.getElementById('f_need_alimentos')) document.getElementById('f_need_alimentos').value = fam.unidades_alimentarias || fam.alimentos || 0;
            if (document.getElementById('f_need_abrigos')) document.getElementById('f_need_abrigos').value = fam.abrigos || 0;
            if (document.getElementById('f_need_frazadas')) document.getElementById('f_need_frazadas').value = fam.frazadas || 0;
            if (document.getElementById('f_need_agua')) document.getElementById('f_need_agua').value = fam.bidones_agua || fam.agua || 0;
            if (document.getElementById('f_need_higiene')) document.getElementById('f_need_higiene').value = fam.kits_higiene || 0;
            if (document.getElementById('f_need_ropa')) document.getElementById('f_need_ropa').value = fam.ropa || 0;
            if (document.getElementById('f_need_colchones')) document.getElementById('f_need_colchones').value = fam.colchones || 0;

            let rawNecesidades = [];
            if (fam.necesidades && Array.isArray(fam.necesidades)) {
                rawNecesidades = fam.necesidades;
            } else if (fam.data && fam.data.necesidades && Array.isArray(fam.data.necesidades)) {
                rawNecesidades = fam.data.necesidades;
            }

            listaTemporalMateriales = rawNecesidades.map(m => ({
                tipo_material: m.tipo_material || m.nombre,
                nombre: m.tipo_material || m.nombre,
                cantidad: m.cantidad || 1
            }));

            renderizarListaVisual('mat', listaTemporalMateriales);

            if (document.getElementById('f_observaciones')) document.getElementById('f_observaciones').value = fam.observaciones || '';

            const contenedorDocs = document.getElementById('lista-archivos-guardados');
            if (contenedorDocs) {
                let docs = fam.documentacion || fam.Documentacion || fam.documentacions || fam.data?.documentacion || [];
                
                if (docs.length === 0) {
                    try {
                        const resDocs = await fetch(`/api/familias/${idFamilia}`);
                        const dataFamFull = await resDocs.json();
                        docs = dataFamFull.documentacion || dataFamFull.Documentacion || dataFamFull.documentacions || [];
                    } catch (err) {
                        console.error("No se pudieron re-consultar los documentos:", err);
                    }
                }

                renderizarDocumentosGuardados(docs, idFamilia);
            }
        } catch (error) {
            console.error("Error al cargar datos para editar:", error);
            mostrarNotificacion("Error al recuperar los datos de la ficha.", "error");
        }

        const form = document.getElementById('form-nueva-familia');
        if (form) {
            form.removeEventListener('submit', guardarDatosFamiliaDefinitivo);
            form.addEventListener('submit', guardarDatosFamiliaDefinitivo);
        }
    });
}

export function cambiarPasoWizard(paso) {
    if (paso === 2) {
        const apellido = document.getElementById('f_apellido').value.trim();
        const nombre = document.getElementById('f_nombre').value.trim();
        const dni = document.getElementById('f_dni').value.trim();
        const direccion = document.getElementById('f_direccion').value.trim();

        if (!apellido || !nombre || !dni || !direccion) {
            mostrarNotificacion("Por favor, complete los campos obligatorios del Grupo Familiar.", "error");
            return;
        }
    }

    document.querySelectorAll('.wizard-step').forEach(el => el.classList.add('d-none'));
    
    const pasoActivo = document.getElementById(`step-${paso}`);
    if (pasoActivo) pasoActivo.classList.remove('d-none');

    const barra = document.getElementById('wizard-progress-bar');
    if (barra) {
        const porcentajes = { 1: '33%', 2: '66%', 3: '100%' };
        barra.style.width = porcentajes[paso];
        barra.setAttribute('aria-valuenow', parseInt(porcentajes[paso]));
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function mostrarFormularioNuevaFamilia() {
    listaTemporalMateriales = [];
    dtArchivosUI = new DataTransfer();
    
    cargarVistaDinamica('./frontend/pages/form-familia.html', () => {
        const titulo = document.getElementById('titulo-form-familia');
        if (titulo) {
            titulo.innerHTML = `<i class="bi bi-plus-circle text-primary me-2"></i> Registrar Nueva Familia`;
        }
        
        const inputIdEdicion = document.getElementById('f_id_edicion');
        if (inputIdEdicion) inputIdEdicion.value = '';

        inicializarCalculoIntegrantes();
        renderizarListaVisual('mat', listaTemporalMateriales);
        sincronizarInputRealYVisual();
        renderizarDocumentosGuardados([]);

        const form = document.getElementById('form-nueva-familia');
        if (form) {
            form.reset();
            form.classList.remove('was-validated');
            form.removeEventListener('submit', guardarDatosFamiliaDefinitivo);
            form.addEventListener('submit', guardarDatosFamiliaDefinitivo);
        }
    });
}

window.eliminarArchivoAdjunto = function(idDocumento, nombreArchivo, idFamilia) {
    const modalAntiguo = document.getElementById('modalConfirmarBorradoDoc');
    if (modalAntiguo) modalAntiguo.remove();

    const htmlModal = `
        <div class="modal fade" id="modalConfirmarBorradoDoc" tabindex="-1" aria-labelledby="modalBorradoLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content bg-dark text-light border border-secondary shadow-lg">
                    <div class="modal-header border-bottom border-secondary bg-danger text-white">
                        <h5 class="modal-title" id="modalBorradoLabel">
                            <i class="bi bi-exclamation-triangle-fill me-2"></i> Advertencia de Seguridad
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body py-4">
                        <p class="mb-2">Está a punto de eliminar permanentemente el archivo:</p>
                        <p class="fw-bold text-warning text-truncate">"${nombreArchivo}"</p>
                        <p class="small text-muted mb-0">Esta acción no se puede deshacer y el documento dejará de estar disponible en el sistema.</p>
                    </div>
                    <div class="modal-footer border-top border-secondary">
                        <button type="button" class="btn btn-outline-light btn-sm" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-danger btn-sm fw-bold px-3" id="btn-ejecutar-borrado-doc" data-id-doc="${idDocumento}" data-id-fam="${idFamilia}">
                            <i class="bi bi-trash me-1"></i> Sí, Eliminar Permanentemente
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', htmlModal);
    const modalElement = document.getElementById('modalConfirmarBorradoDoc');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();

    document.getElementById('btn-ejecutar-borrado-doc').onclick = async function() {
        const idDocReal = this.getAttribute('data-id-doc');
        const idFamReal = this.getAttribute('data-id-fam');

        try {
            const token = localStorage.getItem('token');
            const respuesta = await fetch(`/api/familias/documentos/${idDocReal}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            modal.hide();
            modalElement.remove();
            document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';

            const resultado = await respuesta.json();

            if (respuesta.ok) {
                if (typeof mostrarNotificacion === 'function') {
                    mostrarNotificacion('El archivo ha sido eliminado correctamente.', 'success');
                } else {
                    alert('El archivo ha sido eliminado correctamente.');
                }

                if (typeof editarDatosFamilia === 'function' && idFamReal && idFamReal !== 'undefined') {
                    editarDatosFamilia(idFamReal);
                } else {
                    location.reload();
                }
            } else {
                alert(resultado.mensaje || 'No se pudo eliminar el archivo.');
            }
        } catch (error) {
            console.error('Error de red al eliminar el documento:', error);
            modal.hide();
            modalElement.remove();
            document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
            alert('Error de conexión con el servidor al intentar borrar el archivo.');
        }
    };

    modalElement.addEventListener('hidden.bs.modal', () => {
        modalElement.remove();
    });
};

window.eliminarArchivoAdjunto = window.eliminarArchivoAdjunto;
window.cambiarPasoWizard = cambiarPasoWizard;
window.agregarItemLista = agregarItemLista;
window.eliminarItemLista = eliminarItemLista;
window.mostrarFormularioNuevaFamilia = mostrarFormularioNuevaFamilia;
window.agregarArchivoAListaVisual = agregarArchivoAListaVisual;
window.eliminarArchivoDeListaVisual = eliminarArchivoDeListaVisual;