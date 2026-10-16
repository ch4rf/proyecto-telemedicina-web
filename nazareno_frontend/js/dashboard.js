// ==========================================
// CONTROLADOR DEL DASHBOARD (GRÁFICOS)
// ==========================================

import { renderizarMenu, initSidebarEvents } from '../core/sidebar.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Renderizar menú e inicializar eventos
    renderizarMenu();
    initSidebarEvents();
    // 1. Mostrar información del usuario en el topbar (Depende de cómo guardas la sesión)
    const usuarioStr = localStorage.getItem('usuario_nazareno');
    if (usuarioStr) {
        const usuario = JSON.parse(usuarioStr);
        document.getElementById('nombre-usuario-pantalla').textContent = usuario.nombre || 'Usuario';
        document.getElementById('badge-rol-usuario').textContent = usuario.rol || 'Admin';
    }

    // Evento Cerrar Sesión
    document.getElementById('btnCerrarSesion').addEventListener('click', () => {
        localStorage.removeItem('token_nazareno');
        localStorage.removeItem('usuario_nazareno');
        window.location.href = 'index.html'; // Ajusta la ruta a tu login
    });

    // 2. Cargar Estadísticas
    try {
        // Hacemos fetch al backend (ajusta si le pones token)
        const res = await fetch('/api/dashboard/stats');
        
        if (!res.ok) throw new Error('No se pudieron obtener las estadísticas');
        
        const data = await res.json();
        
        // Mostrar contenedor
        document.getElementById('contenedor-estadisticas').style.display = 'block';

        // --- PINTAR KPIs ---
        document.getElementById('kpi-miembros').textContent = data.resumen.miembrosActivos;
        document.getElementById('kpi-familias').textContent = data.resumen.familiasRegistradas;
        document.getElementById('kpi-servidores').textContent = data.resumen.servidoresActivos;
        document.getElementById('kpi-involucramiento').textContent = data.resumen.tasaInvolucramiento + '%';

        // --- PINTAR GRÁFICAS (Chart.js) ---
        dibujarGraficoGenero(data.demografia.genero);
        dibujarGraficoEdades(data.demografia.edades);
        dibujarGraficoMinisterios(data.ministerios);
        dibujarGraficoTendencias(data.tendencias);

        // --- PINTAR LISTAS (ALERTAS) ---
        pintarCumpleanos(data.alertas.cumpleanosDelMes);
        pintarActividades(data.alertas.proximasActividades);

    } catch (error) {
        console.error('Error cargando el dashboard:', error);
        // Silencioso o puedes poner un alert/Swal si prefieres
    }
});

// --- FUNCIONES PARA DIBUJAR GRÁFICOS ---

function dibujarGraficoGenero(datosGenero) {
    const ctx = document.getElementById('graficoGenero').getContext('2d');
    const labels = datosGenero.map(g => g.genero);
    const valores = datosGenero.map(g => g.total);

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: valores,
                backgroundColor: ['#0ea5e9', '#ec4899', '#94a3b8'], // Azul, Rosa, Gris
                borderWidth: 0
            }]
        },
        options: { plugins: { legend: { position: 'bottom' } } }
    });
}

function dibujarGraficoEdades(datosEdades) {
    const ctx = document.getElementById('graficoEdades').getContext('2d');
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Niños (0-12)', 'Jóvenes (13-25)', 'Adultos (26-59)', 'Tercera Edad (60+)'],
            datasets: [{
                data: [datosEdades.ninos, datosEdades.jovenes, datosEdades.adultos, datosEdades.adultos_mayores],
                backgroundColor: ['#f59e0b', '#10b981', '#6366f1', '#64748b'],
                borderWidth: 0
            }]
        },
        options: { plugins: { legend: { position: 'bottom' } }, cutout: '60%' }
    });
}

function dibujarGraficoMinisterios(datosMinisterios) {
    const ctx = document.getElementById('graficoMinisterios').getContext('2d');
    const labels = datosMinisterios.map(m => m.nombre);
    const valores = datosMinisterios.map(m => m.total_servidores);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Servidores Activos',
                data: valores,
                backgroundColor: '#8b5cf6',
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y', // Lo hace horizontal
            plugins: { legend: { display: false } },
            scales: { x: { beginAtZero: true, ticks: { precision: 0 } } }
        }
    });
}

function dibujarGraficoTendencias(tendencias) {
    const ctx = document.getElementById('graficoTendencias').getContext('2d');
    const mesesLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    // Arrays llenos de ceros para los 12 meses
    let altasArray = new Array(12).fill(0);
    let bajasArray = new Array(12).fill(0);

    // Llenar arrays con los datos de la DB (mes 1 = índice 0)
    tendencias.altas.forEach(a => altasArray[a.mes - 1] = parseInt(a.total));
    tendencias.bajas.forEach(b => bajasArray[b.mes - 1] = parseInt(b.total));

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: mesesLabels,
            datasets: [
                {
                    label: 'Altas (Entradas)',
                    data: altasArray,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Bajas (Retiros)',
                    data: bajasArray,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.3,
                    fill: true
                }
            ]
        },
        options: {
            plugins: { legend: { position: 'top' } },
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
    });
}

// --- FUNCIONES PARA LISTAS (HTML) ---

function pintarCumpleanos(cumpleanos) {
    const ul = document.getElementById('lista-cumpleanos');
    ul.innerHTML = '';
    
    if (cumpleanos.length === 0) {
        ul.innerHTML = '<li>No hay cumpleaños registrados este mes.</li>';
        return;
    }

    cumpleanos.forEach(c => {
        ul.innerHTML += `<li style="padding: 6px 0; border-bottom: 1px dashed #e2e8f0;">
            <i class="fas fa-gift" style="color: #f59e0b; margin-right: 5px;"></i> 
            <strong>Día ${c.dia}:</strong> ${c.nombres} ${c.apellidos}
        </li>`;
    });
}

function pintarActividades(actividades) {
    const ul = document.getElementById('lista-actividades');
    ul.innerHTML = '';
    
    if (actividades.length === 0) {
        ul.innerHTML = '<li>No hay actividades programadas.</li>';
        return;
    }

    actividades.forEach(a => {
        // Formatear fecha (asumiendo que viene en ISO string)
        const fechaStr = new Date(a.fecha_inicio).toLocaleDateString('es-GT');
        ul.innerHTML += `<li style="padding: 6px 0; border-bottom: 1px dashed #e2e8f0;">
            <i class="fas fa-calendar" style="color: #8b5cf6; margin-right: 5px;"></i> 
            <strong>${fechaStr}:</strong> ${a.titulo}
        </li>`;
    });
}
