document.addEventListener('DOMContentLoaded', () => {
    const formulario = document.getElementById('formulario-login');
    const mensajeError = document.getElementById('mensaje-error');

    formulario.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evita que la página recargue al enviar el formulario

        // Capturamos los valores de los inputs
        const nombre_usuario = document.getElementById('nombre_usuario').value;
        const password = document.getElementById('password').value;

        // Limpiamos errores previos
        mensajeError.style.display = 'none';
        mensajeError.textContent = '';

        try {
            // Hacemos la petición POST a tu backend (asegúrate de que el puerto sea el correcto)
            const respuesta = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nombre_usuario, password })
            });

            const datos = await respuesta.json();

            if (respuesta.ok) {
                // ¡Login exitoso! 
                // Guardamos el token en el navegador para usarlo en otras pantallas
                localStorage.setItem('token', datos.token);
                
                // Opcional: guardar datos básicos del usuario
                localStorage.setItem('usuario', JSON.stringify(datos.usuario));

                // Redirigimos al dashboard
                window.location.href = 'dashboard.html';
            } else {
                // Mostramos el error que viene del backend (ej. "Usuario incorrecto")
                mensajeError.textContent = datos.mensaje;
                mensajeError.style.display = 'block';
            }

        } catch (error) {
            console.error('Error de conexión:', error);
            mensajeError.textContent = 'No se pudo conectar con el servidor. Revisa tu conexión.';
            mensajeError.style.display = 'block';
        }
    });
});