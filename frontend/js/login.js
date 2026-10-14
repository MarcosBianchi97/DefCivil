document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const btnLogin = document.getElementById('btn-login');

    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        errorMessage.textContent = '';
        errorMessage.style.color = '#dc3545'; 

        if (!username || !password) {
            errorMessage.textContent = 'Por favor, complete todos los campos.';
            return;
        }

        try {
            btnLogin.disabled = true;
btnLogin.querySelector('i').className = 'bi bi-arrow-repeat spin';
btnLogin.querySelector('span').textContent = 'Conectando...';

            const respuesta = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const resultado = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(resultado.mensaje || 'Error al intentar iniciar sesión.');
            }

            localStorage.setItem('token', resultado.token);
            localStorage.setItem('usuario', JSON.stringify(resultado.usuario));

            errorMessage.style.color = '#198754';
            errorMessage.textContent = '¡Acceso concedido! Redirigiendo...';

            setTimeout(() => {
                if (resultado.usuario.requiereCambioPass) {
                    window.location.replace('/cambiar-password');
                } else {
                    window.location.replace('/sistema');
                }
            }, 800);

        } catch (error) {
            btnLogin.disabled = false;
btnLogin.querySelector('i').className = 'bi bi-box-arrow-in-right';
btnLogin.querySelector('span').textContent = 'Ingresar';
        }
    });
});