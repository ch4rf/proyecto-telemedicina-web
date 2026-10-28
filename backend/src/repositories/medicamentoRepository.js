const pool = require('../config/db');

const SEMILLA_MEDICAMENTOS = [
    {
        nombre_comercial: 'Paracetamol 500mg',
        principio_activo: 'Acetaminophen',
        presentacion: 'Tabletas 500mg',
        dosis_recomendada: '1 tableta (500mg)',
        frecuencia_recomendada: 'Cada 8 horas',
        duracion_recomendada: '3 a 5 días',
        fuente: 'Dataset Clínico / OpenFDA'
    },
    {
        nombre_comercial: 'Ibuprofeno 400mg',
        principio_activo: 'Ibuprofen',
        presentacion: 'Cápsulas blandas 400mg',
        dosis_recomendada: '1 cápsula (400mg)',
        frecuencia_recomendada: 'Cada 8 horas',
        duracion_recomendada: '3 a 5 días',
        fuente: 'Dataset Clínico / OpenFDA'
    },
    {
        nombre_comercial: 'Amoxicilina 500mg',
        principio_activo: 'Amoxicillin',
        presentacion: 'Cápsulas 500mg',
        dosis_recomendada: '1 cápsula (500mg)',
        frecuencia_recomendada: 'Cada 8 horas',
        duracion_recomendada: '7 días',
        fuente: 'Dataset Clínico / OpenFDA'
    },
    {
        nombre_comercial: 'Loratadina 10mg',
        principio_activo: 'Loratadine',
        presentacion: 'Tabletas 10mg',
        dosis_recomendada: '1 tableta (10mg)',
        frecuencia_recomendada: 'Cada 24 horas',
        duracion_recomendada: '5 días',
        fuente: 'Dataset Clínico / OpenFDA'
    },
    {
        nombre_comercial: 'Omeprazol 20mg',
        principio_activo: 'Omeprazole',
        presentacion: 'Cápsulas de liberación retardada 20mg',
        dosis_recomendada: '1 cápsula (20mg) en ayunas',
        frecuencia_recomendada: 'Cada 24 horas',
        duracion_recomendada: '14 días',
        fuente: 'Dataset Clínico / OpenFDA'
    },
    {
        nombre_comercial: 'Azitromicina 500mg',
        principio_activo: 'Azithromycin',
        presentacion: 'Tabletas recubiertas 500mg',
        dosis_recomendada: '1 tableta (500mg)',
        frecuencia_recomendada: 'Cada 24 horas',
        duracion_recomendada: '3 días',
        fuente: 'Dataset Clínico / OpenFDA'
    },
    {
        nombre_comercial: 'Losartán Potásico 50mg',
        principio_activo: 'Losartan Potassium',
        presentacion: 'Tabletas recubiertas 50mg',
        dosis_recomendada: '1 tableta (50mg)',
        frecuencia_recomendada: 'Cada 24 horas',
        duracion_recomendada: '30 días (tratamiento continuo)',
        fuente: 'Dataset Clínico / OpenFDA'
    },
    {
        nombre_comercial: 'Metformina 850mg',
        principio_activo: 'Metformin Hydrochloride',
        presentacion: 'Tabletas 850mg',
        dosis_recomendada: '1 tableta (850mg) con alimentos',
        frecuencia_recomendada: 'Cada 12 horas',
        duracion_recomendada: '30 días (tratamiento continuo)',
        fuente: 'Dataset Clínico / OpenFDA'
    },
    {
        nombre_comercial: 'Salbutamol Inhalador 100mcg',
        principio_activo: 'Albuterol Sulfate',
        presentacion: 'Aerosol para inhalación 100mcg/dosis',
        dosis_recomendada: '2 inhalaciones (puffs)',
        frecuencia_recomendada: 'Cada 6 a 8 horas según necesidad',
        duracion_recomendada: '5 a 7 días',
        fuente: 'Dataset Clínico / OpenFDA'
    },
    {
        nombre_comercial: 'Diclofenaco Sódico 50mg',
        principio_activo: 'Diclofenac Sodium',
        presentacion: 'Tabletas recubiertas 50mg',
        dosis_recomendada: '1 tableta (50mg)',
        frecuencia_recomendada: 'Cada 12 horas',
        duracion_recomendada: '3 días',
        fuente: 'Dataset Clínico / OpenFDA'
    }
];

class MedicamentoRepository {
    constructor() {
        this.inicializado = false;
        this.asegurarTablaYSemilla().catch((err) => {
            console.warn('[MedicamentoRepository] Aviso al inicializar catálogo:', err.message);
        });
    }

    async asegurarTablaYSemilla() {
        if (this.inicializado) return;

        await pool.query(`
            CREATE TABLE IF NOT EXISTS catalogo_medicamentos (
                id_medicamento UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                nombre_comercial VARCHAR(200) UNIQUE NOT NULL,
                principio_activo VARCHAR(200) NOT NULL,
                presentacion VARCHAR(150),
                dosis_recomendada VARCHAR(150),
                frecuencia_recomendada VARCHAR(150),
                duracion_recomendada VARCHAR(100),
                fuente VARCHAR(50) DEFAULT 'OpenFDA',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        for (const med of SEMILLA_MEDICAMENTOS) {
            await pool.query(
                `INSERT INTO catalogo_medicamentos (
                    nombre_comercial, principio_activo, presentacion,
                    dosis_recomendada, frecuencia_recomendada, duracion_recomendada, fuente
                 )
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 ON CONFLICT (nombre_comercial) DO NOTHING;`,
                [
                    med.nombre_comercial,
                    med.principio_activo,
                    med.presentacion,
                    med.dosis_recomendada,
                    med.frecuencia_recomendada,
                    med.duracion_recomendada,
                    med.fuente
                ]
            );
        }

        this.inicializado = true;
        console.log('[MedicamentoRepository] Tabla catalogo_medicamentos verificada y semilla cargada en PostgreSQL');
    }

    async buscarPorTermino(termino = '') {
        await this.asegurarTablaYSemilla();
        const filtro = `%${termino.trim()}%`;
        const query = `
            SELECT id_medicamento, nombre_comercial, principio_activo, presentacion,
                   dosis_recomendada, frecuencia_recomendada, duracion_recomendada, fuente
            FROM catalogo_medicamentos
            WHERE nombre_comercial ILIKE $1 OR principio_activo ILIKE $1
            ORDER BY nombre_comercial ASC
            LIMIT 50;
        `;
        const { rows } = await pool.query(query, [filtro]);
        return rows;
    }

    async guardarMedicamentoExterno(med) {
        await this.asegurarTablaYSemilla();
        const query = `
            INSERT INTO catalogo_medicamentos (
                nombre_comercial, principio_activo, presentacion,
                dosis_recomendada, frecuencia_recomendada, duracion_recomendada, fuente
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (nombre_comercial) DO UPDATE SET
                principio_activo = EXCLUDED.principio_activo,
                presentacion = EXCLUDED.presentacion,
                dosis_recomendada = EXCLUDED.dosis_recomendada,
                frecuencia_recomendada = EXCLUDED.frecuencia_recomendada,
                duracion_recomendada = EXCLUDED.duracion_recomendada,
                fuente = EXCLUDED.fuente
            RETURNING id_medicamento, nombre_comercial, principio_activo, presentacion,
                      dosis_recomendada, frecuencia_recomendada, duracion_recomendada, fuente;
        `;
        const { rows } = await pool.query(query, [
            med.nombre_comercial,
            med.principio_activo,
            med.presentacion || 'Tabletas / Cápsulas',
            med.dosis_recomendada || '1 unidad',
            med.frecuencia_recomendada || 'Cada 8 horas',
            med.duracion_recomendada || '5 días',
            med.fuente || 'OpenFDA API'
        ]);
        return rows[0];
    }

    async eliminarPorId(id_medicamento) {
        const query = `
            DELETE FROM catalogo_medicamentos
            WHERE id_medicamento = $1
            RETURNING id_medicamento, nombre_comercial;
        `;
        const { rows } = await pool.query(query, [id_medicamento]);
        return rows[0] || null;
    }
}

module.exports = new MedicamentoRepository();
