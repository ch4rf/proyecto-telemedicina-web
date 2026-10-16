export const llenarSelects = (configuracionFormulario) => {
    document.getElementById('selectTipo').innerHTML = 
        '<option value="" disabled selected>-- Seleccionar Tipo --</option>' + 
        configuracionFormulario.tipos.map(t => '<option value="' + t.id_tipo + '">' + t.descripcion + '</option>').join('');

    document.getElementById('selectMinisterio').innerHTML = 
        '<option value="" disabled selected>-- Seleccionar Ministerio --</option>' +
        configuracionFormulario.ministerios.map(m => '<option value="' + m.id_ministerio + '">' + m.nombre + '</option>').join('');

    document.getElementById('selectLugar').innerHTML = 
        '<option value="" disabled selected>-- Seleccionar Lugar --</option>' + 
        configuracionFormulario.lugares.map(l => '<option value="' + l.id_lugar + '">' + l.nombre + '</option>').join('');
    
    document.getElementById('selectDuracion').innerHTML = 
        '<option value="" disabled selected>-- Seleccione --</option>' + 
        configuracionFormulario.duraciones.map(d => '<option value="' + d.id_tipo_duracion + '" data-requiere-hora="' + d.requiere_hora + '">' + d.descripcion + '</option>').join('');
};

export const abrirModalParaEdicion = (actividad, configuracionFormulario) => {
    llenarSelects(configuracionFormulario);

    document.getElementById('inputFecha').value = actividad.fecha.split('T')[0]; 
    document.getElementById('selectTipo').value = actividad.id_tipo;
    document.getElementById('selectDuracion').value = actividad.id_tipo_duracion;
    document.getElementById('selectMinisterio').value = actividad.id_ministerio;
    document.getElementById('selectLugar').value = actividad.id_lugar;

    document.getElementById('selectDuracion').dispatchEvent(new Event('change'));
    document.getElementById('selectLugar').dispatchEvent(new Event('change'));

    if (actividad.hora_inicio) document.getElementById('inputInicio').value = actividad.hora_inicio.substring(0,5);
    if (actividad.hora_fin) document.getElementById('inputFin').value = actividad.hora_fin.substring(0,5);

    if (actividad.id_miembro_anfitrion) {
        document.getElementById('busquedaAnfitrion').value = actividad.nombres || 'Anfitrión seleccionado';
    }

    document.getElementById('modalActividad').classList.add('modal-activo');
};

export const cerrarModalActividad = () => {
    document.getElementById('modalActividad').classList.remove('modal-activo');
    document.getElementById('formActividad').reset();
    document.getElementById('camposHorario').classList.add('oculto');
    document.getElementById('campoAnfitrion').classList.add('oculto');
    document.getElementById('resultadosBusqueda').innerHTML = '';
};

export const initFormModalEvents = (callbacks, stateProvider) => {
    const btnNuevaActividad = document.getElementById('btnNuevaActividad');
    const btnCancelarAct = document.getElementById('btnCancelarAct');
    const selectDuracion = document.getElementById('selectDuracion');
    const selectLugar = document.getElementById('selectLugar');
    const busquedaAnfitrion = document.getElementById('busquedaAnfitrion');
    const formActividad = document.getElementById('formActividad');

    btnNuevaActividad.addEventListener('click', () => {
        callbacks.onNuevaActividad();
        document.getElementById('formActividad').reset();
        document.getElementById('camposHorario').classList.add('oculto');
        document.getElementById('campoAnfitrion').classList.add('oculto');
        document.getElementById('resultadosBusqueda').innerHTML = '';
        document.getElementById('modalActividad').classList.add('modal-activo');
        
        llenarSelects(stateProvider().configuracionFormulario);
    });

    btnCancelarAct.addEventListener('click', () => {
        cerrarModalActividad();
        callbacks.onCancel();
    });

    selectDuracion.addEventListener('change', (e) => {
        const option = e.target.options[e.target.selectedIndex];
        const requiereHora = option.getAttribute('data-requiere-hora') === 'true' || option.getAttribute('data-requiere-hora') == '1';

        if (requiereHora) {
            document.getElementById('camposHorario').classList.remove('oculto');
        } else {
            document.getElementById('camposHorario').classList.add('oculto');
            document.getElementById('inputInicio').value = '';
            document.getElementById('inputFin').value = '';
        }
    });

    selectLugar.addEventListener('change', (e) => {
        const state = stateProvider();
        const lugarSeleccionado = state.configuracionFormulario.lugares.find(l => l.id_lugar == e.target.value);
        
        if (lugarSeleccionado && lugarSeleccionado.requiere_anfitrion) {
            document.getElementById('campoAnfitrion').classList.remove('oculto');
        } else {
            document.getElementById('campoAnfitrion').classList.add('oculto');
            document.getElementById('busquedaAnfitrion').value = '';
        }
    });

    busquedaAnfitrion.addEventListener('input', (e) => {
        const state = stateProvider();
        const texto = e.target.value.toLowerCase();
        const contenedor = document.getElementById('resultadosBusqueda');
        contenedor.innerHTML = ''; 

        if (texto.length < 2) return;
        
        const filtrados = state.listaMiembros.filter(m => 
            (m.nombres + ' ' + m.apellidos).toLowerCase().includes(texto)
        );
        
        filtrados.forEach(m => {
            const li = document.createElement('li');
            li.textContent = m.nombres + ' ' + m.apellidos;
            li.style.padding = "8px";
            li.style.cursor = "pointer";
            li.onclick = () => {
                document.getElementById('busquedaAnfitrion').value = m.nombres + ' ' + m.apellidos;
                callbacks.onAnfitrionSelect(m.id_miembro);
                contenedor.innerHTML = ''; 
            };
            contenedor.appendChild(li);
        });
    });

    formActividad.addEventListener('submit', (e) => {
        e.preventDefault();
        const state = stateProvider();
        const datos = {
            fecha: document.getElementById('inputFecha').value,
            id_tipo: document.getElementById('selectTipo').value,
            id_ministerio: document.getElementById('selectMinisterio').value,
            id_lugar: document.getElementById('selectLugar').value,
            id_tipo_duracion: document.getElementById('selectDuracion').value,
            hora_inicio: document.getElementById('inputInicio').value || null,
            hora_fin: document.getElementById('inputFin').value || null,
            id_miembro_anfitrion: state.idMiembroSeleccionado
        };

        callbacks.onSubmit(datos);
    });
};