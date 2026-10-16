const dashboardRepository = require('../repositories/dashboardRepository');

const obtenerEstadisticasGlobales = async () => {
  const [
    kpis, 
    genero, 
    edades, 
    topMinisterios, 
    altasBajas, 
    cumpleanos, 
    proximasActividades
  ] = await Promise.all([
    dashboardRepository.getKpis(),
    dashboardRepository.getDistribucionGenero(),
    dashboardRepository.getDistribucionEdades(),
    dashboardRepository.getTopMinisterios(),
    dashboardRepository.getAltasBajasAnio(),
    dashboardRepository.getCumpleanosMes(),
    dashboardRepository.getProximasActividades()
  ]);

  let tasaInvolucramiento = 0;
  if (kpis.miembrosActivos > 0) {
    tasaInvolucramiento = ((kpis.servidoresActivos / kpis.miembrosActivos) * 100).toFixed(1);
  }
  kpis.tasaInvolucramiento = parseFloat(tasaInvolucramiento);

  return {
    resumen: kpis,
    demografia: {
      genero,
      edades
    },
    ministerios: topMinisterios,
    tendencias: altasBajas,
    alertas: {
      cumpleanosDelMes: cumpleanos,
      proximasActividades: proximasActividades
    }
  };
};

module.exports = {
  obtenerEstadisticasGlobales
};