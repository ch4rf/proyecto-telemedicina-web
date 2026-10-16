// ==========================================
// MENÚ LATERAL GLOBAL
// ==========================================
export const renderizarMenu = () => {
    const currentPath = window.location.pathname;
    
    // Rutas relativas por defecto (asumiendo que estamos dentro de modulos/algo/)
    let basePath = '..';
    let dashPath = '../../dashboard.html';

    // Si estamos en la raíz (dashboard.html) ajustamos las rutas
    if (currentPath.includes('dashboard.html')) {
        basePath = './modulos';
        dashPath = './dashboard.html';
    }

    const isActive = (pathSnippet) => currentPath.includes(pathSnippet) ? ' activo' : '';

    const menuItems = [
        { id: 'dashboard', icon: 'fa-home', text: 'Inicio', link: dashPath, snippet: 'dashboard.html' },
        { id: 'miembros', icon: 'fa-users', text: 'Miembros', link: `${basePath}/miembros/miembros.html`, snippet: '/miembros/' },
        { id: 'familias', icon: 'fa-home-user', text: 'Familias', link: `${basePath}/familias/familias.html`, snippet: '/familias/' },
        { id: 'ministerios', icon: 'fa-hands-praying', text: 'Ministerios', link: `${basePath}/ministerios/ministerios.html`, snippet: '/ministerios/' },
        { id: 'actividades', icon: 'fa-calendar-alt', text: 'Actividades', link: `${basePath}/actividades/actividades.html`, snippet: '/actividades/' },
        { id: 'catalogos', icon: 'fa-cogs', text: 'Catálogos', link: `${basePath}/catalogos/catalogos.html`, snippet: '/catalogos/' }
    ];

    let navHTML = '';
    menuItems.forEach(item => {
        navHTML += `<a href="${item.link}" class="menu-item${isActive(item.snippet)}"><i class="fas ${item.icon}"></i> ${item.text}</a>`;
    });

    const menuHTML = `<aside class="sidebar" id="sidebar">
        <div class="sidebar-header"><h2><i class="fas fa-church"></i> Nazareno</h2></div>
        <nav class="sidebar-menu">
            ${navHTML}
        </nav>
    </aside>`;
    
    const contenedorMenu = document.getElementById('menu-lateral-dinamico');
    if (contenedorMenu) {
        contenedorMenu.outerHTML = menuHTML;
    }
};

export const initSidebarEvents = () => {
    const btnToggleMenu = document.getElementById('btnToggleMenu');
    if (btnToggleMenu) {
        btnToggleMenu.addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                sidebar.classList.toggle('colapsado');
            }
        });
    }
};
