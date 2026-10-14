// 🛠️ MÓDULO DE GESTIÓN DE USUARIOS

export async function cargarModuloUsuarios() {
    const contenedor = document.querySelector('.content-principal');
    if (!contenedor) return;

    contenedor.innerHTML = `
        <div class="animate__animated animate__fadeIn">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 class="mb-1 text-white"><i class="bi bi-people-fill text-warning me-2"></i> Gestión de Usuarios</h2>
                    <p class="text-muted mb-0">Administración de accesos y roles del sistema.</p>
                </div>
                <button class="btn btn-warning fw-bold d-flex align-items-center gap-2 shadow-sm" id="btn-nuevo-usuario" onclick="abrirModalNuevoUsuario()">
                    <i class="bi bi-person-plus-fill fs-5"></i> Nuevo Usuario
                </button>
            </div>

            <div class="card shadow-sm border-0" style="background-color: transparent !important;">
                <div class="card-body p-0" style="background-color: transparent !important;">
                    <div class="table-responsive" style="background-color: transparent !important;">
                        <table class="table align-middle mb-0" id="tabla-usuarios" style="background-color: transparent !important;">
                            <thead class="table-dark text-white fw-bold">
                                <tr>
                                    <th class="ps-3 text-center" style="width: 80px;">ID</th>
                                    <th>Usuario / DNI</th>
                                    <th>Nombre Completo</th>
                                    <th>Rol</th>
                                    <th>Estado</th>
                                    <th class="text-end pe-3" style="width: 120px;">Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="tbody-usuarios"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- MODAL DE USUARIO OSCURO Y ELEGANTE -->
        <div class="modal fade" id="modalUsuario" data-bs-backdrop="static" tabindex="-1" aria-labelledby="modalUsuarioLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered text-light">
                <div class="modal-content bg-dark text-light border border-secondary shadow-lg">
                    <!-- ENCABEZADO CORREGIDO: Fondo oscuro real, texto blanco y acento visible -->
                    <div class="modal-header py-3 border-bottom border-secondary" style="background-color: #111822;">
    <h5 class="modal-title fw-bold text-white d-flex align-items-center m-0" id="modalUsuarioLabel">
        <i class="bi bi-person-plus-fill text-warning me-2 fs-4"></i> Registrar Nuevo Usuario
    </h5>
    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close" onclick="resetearModalUsuario()"></button>
</div>
                    <div class="modal-body bg-dark p-4">
                        <form id="form-usuario" novalidate>
                            <div class="alert alert-danger d-none small text-center mb-3" id="alert-modal-usuario"></div>
                            
                            <div class="row g-3">
                                <div class="col-md-6 mb-2">
                                    <label for="u-nombres" class="form-label fw-bold small text-light">Nombres *</label>
                                    <input type="text" class="form-control bg-dark text-light border-secondary" id="u-nombres" placeholder="Ej: Juan Pedro" required>
                                </div>
                                <div class="col-md-6 mb-2">
                                    <label for="u-apellido" class="form-label fw-bold small text-light">Apellido *</label>
                                    <input type="text" class="form-control bg-dark text-light border-secondary" id="u-apellido" placeholder="Ej: Pérez" required>
                                </div>
                                <div class="col-md-6 mb-2">
                                    <label for="u-dni" class="form-label fw-bold small text-light">D.N.I. (Clave inicial) *</label>
                                    <input type="text" class="form-control bg-dark text-light border-secondary" id="u-dni" placeholder="Ej: 38444222" required>
                                </div>
                                <div class="col-md-6 mb-2">
                                    <label for="u-rol" class="form-label fw-bold small text-light">Rol del Usuario *</label>
                                    <select class="form-select bg-dark text-light border-secondary" id="u-rol" required>
                                        <option value="" disabled selected>Seleccione un rol...</option>
                                        <option value="Administrador">Administrador</option>
                                        <option value="Operador">Operador</option>
                                        <option value="Relevador">Relevador</option>
                                        <option value="Consulta">Consulta</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-2">
                                    <!-- CAMBIADO A type="text" PARA EVITAR EL FILTRO GRIS NATIVO DEL NAVEGADOR -->
                                    <label for="u-email" class="form-label fw-bold small text-light">Email *</label>
                                    <input type="text" class="form-control bg-dark text-light border-secondary" id="u-email" placeholder="Ej: juan@defensacivil.com" required>
                                </div>
                                <div class="col-md-6 mb-2">
                                    <label for="u-celular" class="form-label fw-bold small text-light">Celular *</label>
                                    <input type="text" class="form-control bg-dark text-light border-secondary" id="u-celular" placeholder="Ej: 3851234567" required>
                                </div>
                            </div>

                            <div class="d-flex justify-content-end gap-2 mt-4 pt-3 border-top border-secondary">
                                <button type="button" class="btn btn-outline-light btn-sm px-3" data-bs-dismiss="modal" onclick="resetearModalUsuario()">Cancelar</button>
                                <button type="submit" class="btn btn-success btn-sm fw-bold px-4 shadow-sm" id="btn-guardar-usuario">
                                    <i class="bi bi-check-circle-fill me-1"></i> Guardar Usuario
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('form-usuario')?.addEventListener('submit', (e) => {
        e.preventDefault();
        registrarUsuarioBackend();
    });

    try {
        const token = localStorage.getItem('token');
        if (!token || token === "undefined" || token === "null") {
            throw new Error("No se encontró un token de sesión válido. Por favor, vuelva a iniciar sesión.");
        }

        const respuesta = await fetch('https://defciv-app.onrender.com/api/usuarios', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const resultado = await respuesta.json();

        const tbody = document.getElementById('tbody-usuarios');
        if (!tbody) return;

        if (!respuesta.ok || !resultado.success) {
            throw new Error(resultado.message || 'No se pudieron cargar los usuarios.');
        }

        if (resultado.data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-3 text-muted">No hay usuarios registrados.</td></tr>`;
            return;
        }

        tbody.innerHTML = '';

        resultado.data.forEach(u => {
            const rolCrudo = String(u.rol || '').trim().toLowerCase();
            let nombreRolMostrar = 'No Asignado';
            let badgeColor = 'bg-secondary text-white'; 

            if (rolCrudo === 'administrador') {
                nombreRolMostrar = 'Administrador';
                badgeColor = 'bg-primary text-white';
            } else if (rolCrudo === 'operador') {
                nombreRolMostrar = 'Operador';
                badgeColor = 'bg-info text-dark';
            } else if (rolCrudo === 'relevador') {
                nombreRolMostrar = 'Relevador';
                badgeColor = 'bg-success text-white';
            } else if (rolCrudo === 'consulta') {
                nombreRolMostrar = 'Consulta';
                badgeColor = 'bg-secondary text-white';
            } else if (u.rol) {
                nombreRolMostrar = u.rol;
            }

            const badgeEstado = String(u.estado).trim().toLowerCase() === 'activo' 
                ? '<span class="badge bg-success text-white">Activo</span>' 
                : '<span class="badge bg-danger text-white">Inactivo</span>';

            const botonesAccion = `
            <div class="d-flex justify-content-center align-items-center gap-2 flex-wrap w-100">
                <button class="btn btn-sm btn-outline-warning" title="Editar" onclick='abrirModalEditar(${JSON.stringify(u)})'>
                    <i class="bi bi-pencil-square"></i> Editar
                </button>
                <button class="btn btn-sm ${u.estado === 'Activo' ? 'btn-outline-danger' : 'btn-outline-success'}" 
                        onclick="cambiarEstadoUsuario(${u.id}, '${u.estado}')">
                    <i class="bi ${u.estado === 'Activo' ? 'bi-person-x-fill' : 'bi-person-check-fill'}"></i> ${u.estado === 'Activo' ? 'Baja' : 'Activar'}
                </button>
            </div>
        `;

        tbody.innerHTML += `
            <!-- 1. VISTA DE ESCRITORIO -->
            <tr class="text-dark d-none d-md-table-row">
                <td class="ps-3 fw-bold text-center text-muted" style="background-color: #f1f3f5;">${u.id}</td>
                <td>
                    <div class="fw-bold text-primary">@${u.username}</div>
                    <div class="small text-muted">DNI: ${u.dni || 'S/D'}</div>
                </td>
                <td class="fw-bold">${u.apellido || ''}, ${u.nombres || ''}</td>
                <td><span class="badge ${badgeColor}">${nombreRolMostrar}</span></td>
                <td>${badgeEstado}</td>
                <td class="text-end pe-3">
                     <button class="btn btn-sm btn-outline-secondary me-1" title="Editar" onclick='abrirModalEditar(${JSON.stringify(u)})'>
                        <i class="bi bi-pencil-square text-dark"></i>
                     </button>
                     <button class="btn btn-sm ${u.estado === 'Activo' ? 'btn-outline-danger' : 'btn-outline-success'}" 
                           onclick="cambiarEstadoUsuario(${u.id}, '${u.estado}')">
                          <i class="bi ${u.estado === 'Activo' ? 'bi-person-x-fill' : 'bi-person-check-fill'}"></i>
                     </button>
                </td>
            </tr>

            <!-- 2. VISTA MÓVIL -->
                <tr class="d-block d-md-none mb-3 border rounded shadow-sm p-3" style="background-color: #1a222c !important; border-color: #2d3748 !important; color: #e2e8f0; margin-bottom: 1rem !important;">
                    <td class="text-start border-0 p-0" style="background-color: transparent !important; color: inherit;">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <div>
                                <div class="fw-bold text-info">@${u.username}</div>
                                <div class="small text-muted">ID: ${u.id} | DNI: ${u.dni || 'S/D'}</div>
                            </div>
                            <div>${badgeEstado}</div>
                        </div>
                        <div class="small mb-1 text-light"><strong>Nombre:</strong> ${u.apellido || ''}, ${u.nombres || ''}</div>
                        <div class="small mb-2 text-light"><strong>Rol:</strong> <span class="badge ${badgeColor}">${nombreRolMostrar}</span></div>
                        <div class="dropdown-divider" style="border-color: #2d3748 !important;"></div>
                        <div class="mt-2 text-center w-100">
                            ${botonesAccion}
                        </div>
                    </td>
                </tr>
        `;
        });

    } catch (error) {
        console.error(error);
        const tbody = document.getElementById('tbody-usuarios');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-3 text-danger fw-bold"><i class="bi bi-exclamation-triangle-fill me-2"></i> Error al conectar con el servidor.</td></tr>`;
        }
    }
}

window.abrirModalNuevoUsuario = function() {
    resetearModalUsuario();
    const modalElement = document.getElementById('modalUsuario');
    if (modalElement && typeof bootstrap !== 'undefined') {
        const modalInstance = new bootstrap.Modal(modalElement);
        modalInstance.show();
    }
}

window.abrirModalEditar = function(u) {
    const tituloModal = document.getElementById('modalUsuarioLabel');
    if (tituloModal) {
        tituloModal.innerHTML = `<i class="bi bi-pencil-square text-warning me-2"></i> Editar Usuario (ID: ${u.id})`;
    }

    document.getElementById('u-nombres').value = u.nombres || '';
    document.getElementById('u-apellido').value = u.apellido || '';
    document.getElementById('u-dni').value = u.dni || '';
    document.getElementById('u-email').value = u.email || '';
    document.getElementById('u-celular').value = u.celular || '';
    document.getElementById('u-rol').value = u.rol || '';

    const form = document.getElementById('form-usuario');
    if (form) {
        form.dataset.editId = u.id;
    }

    const modalElement = document.getElementById('modalUsuario');
    if (modalElement && typeof bootstrap !== 'undefined') {
        const modalInstance = new bootstrap.Modal(modalElement);
        modalInstance.show();
    }
}

window.resetearModalUsuario = function() {
    const form = document.getElementById('form-usuario');
    if (form) {
        form.removeAttribute('data-edit-id');
        form.reset();
    }
    const tituloModal = document.getElementById('modalUsuarioLabel');
    if (tituloModal) {
        tituloModal.innerHTML = `<i class="bi bi-person-plus-fill text-warning me-2"></i> Registrar Nuevo Usuario`;
    }
    const alertModal = document.getElementById('alert-modal-usuario');
    if (alertModal) {
        alertModal.className = 'alert alert-danger d-none small text-center';
        alertModal.textContent = '';
    }
}

async function registrarUsuarioBackend() {
    const btnGuardar = document.getElementById('btn-guardar-usuario');
    const alertModal = document.getElementById('alert-modal-usuario');
    const form = document.getElementById('form-usuario');
    
    const editId = form ? form.dataset.editId : null;

    const nombres = document.getElementById('u-nombres').value.trim();
    const apellido = document.getElementById('u-apellido').value.trim();
    const dni = document.getElementById('u-dni').value.trim();
    const rol = document.getElementById('u-rol').value;
    const email = document.getElementById('u-email').value.trim();
    const celular = document.getElementById('u-celular').value.trim();

    const primerNombre = nombres.split(' ')[0]; 
    const primerApellido = apellido.split(' ')[0];
    const username = (primerNombre.charAt(0) + primerApellido).toLowerCase().replace(/[^a-z0-9]/g, '');

    alertModal.className = 'alert alert-danger d-none small text-center';
    alertModal.textContent = '';

    try {
        btnGuardar.disabled = true;
        btnGuardar.innerHTML = `<i class="bi bi-arrow-repeat spin"></i> Guardando...`;

        const url = editId ? `https://defciv-app.onrender.com/api/usuarios/${editId}` : 'https://defciv-app.onrender.com/api/usuarios';
        const method = editId ? 'PUT' : 'POST';
        const token = localStorage.getItem('token');

        const respuesta = await fetch(url, {
            method: method,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ username, dni, apellido, nombres, email, celular, rol })
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok || !resultado.success) {
            throw new Error(resultado.message || 'Error al intentar procesar la operación del usuario.');
        }

        alertModal.classList.remove('alert-danger', 'd-none');
        alertModal.classList.add('alert-success');
        alertModal.textContent = resultado.message;

        setTimeout(() => {
            const modalElement = document.getElementById('modalUsuario');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) modalInstance.hide();
            
            resetearModalUsuario();
            cargarModuloUsuarios();
        }, 1500);

    } catch (error) {
        alertModal.classList.remove('d-none');
        alertModal.textContent = error.message;
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = `<i class="bi bi-check-circle-fill me-1"></i> Guardar Usuario`;
    }
}

window.cambiarEstadoUsuario = async function(id, estadoActual) {
    const accion = estadoActual === 'Activo' ? 'dar de BAJA' : 'ACTIVAR';
    
    if (!confirm(`¿Está seguro de que desea ${accion} al usuario con ID ${id}?`)) {
        return; 
    }

    try {
        const token = localStorage.getItem('token');
        const respuesta = await fetch(`https://defciv-app.onrender.com/api/usuarios/${id}/estado`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok || !resultado.success) {
            throw new Error(resultado.message || 'No se pudo cambiar el estado.');
        }

        alert(resultado.message);
        cargarModuloUsuarios();

    } catch (error) {
        console.error(error);
        alert(`Error: ${error.message}`);
    }
}

window.cargarModuloUsuarios = cargarModuloUsuarios;