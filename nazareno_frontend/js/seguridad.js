// seguridad.js
document.addEventListener('DOMContentLoaded', () => {
    // 1. Verificar si hay un token
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../../index.html'; // Ojo con la ruta, ajústala si es necesario
        return; 
    }

    // 2. Mostrar los datos del usuario en la Topbar
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
        const usuario = JSON.parse(usuarioGuardado);
        
        const spanNombre = document.getElementById('nombre-usuario-pantalla');
        if (spanNombre) spanNombre.textContent = usuario.nombre_usuario;

        const spanRol = document.getElementById('badge-rol-usuario');
        if (spanRol) {
            spanRol.textContent = usuario.nombre_rol;
        }
    }

    // 3. Funcionalidad del botón Cerrar Sesión
    const btnCerrarSesion = document.getElementById('btnCerrarSesion');
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            window.location.href = '../../index.html';
        });
    }
});