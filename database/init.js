const bcrypt = require('bcrypt');
const { pool } = require('./config');

const createTablesSQL = `
  CREATE TABLE IF NOT EXISTS Usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK(rol IN ('admin', 'entrenador', 'socio'))
  );

  CREATE TABLE IF NOT EXISTS Membresias (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES Usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    estado VARCHAR(20) NOT NULL,
    fecha_vencimiento DATE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS Asistencias (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES Usuarios(id) ON DELETE CASCADE,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Datos_Biometricos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES Usuarios(id) ON DELETE CASCADE,
    peso NUMERIC(5,2) NOT NULL,
    altura NUMERIC(5,2) NOT NULL,
    edad INTEGER NOT NULL,
    lesiones TEXT,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Rutinas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    frecuencia VARCHAR(50) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS Ejercicios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    grupo_muscular VARCHAR(50) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS Rutinas_Detalle (
    id SERIAL PRIMARY KEY,
    rutina_id INTEGER NOT NULL REFERENCES Rutinas(id) ON DELETE CASCADE,
    ejercicio_id INTEGER NOT NULL REFERENCES Ejercicios(id) ON DELETE CASCADE,
    series INTEGER NOT NULL,
    repeticiones VARCHAR(20) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS Solicitudes_Rutina (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES Usuarios(id) ON DELETE CASCADE,
    objetivo VARCHAR(50) NOT NULL,
    dias_semana INTEGER NOT NULL,
    observaciones TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
    fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    precio NUMERIC(10, 2) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    stock INTEGER NOT NULL
  );
`;

const initialUsers = [
  {
    nombre: 'Administrador General',
    email: 'admin@infiniteforce.com',
    password: 'AdminPassword123',
    rol: 'admin'
  },
  {
    nombre: 'Profesor Marcos Ruiz',
    email: 'entrenador@infiniteforce.com',
    password: 'EntrenadorPassword123',
    rol: 'entrenador'
  },
  {
    nombre: 'Carlos Mendoza',
    email: 'socio@infiniteforce.com',
    password: 'SocioPassword123',
    rol: 'socio'
  }
];

const initialRoutines = [
  {
    nombre: 'Fuerza e Hipertrofia (PPL)',
    tipo: 'Hipertrofia',
    frecuencia: '4 dias por semana'
  },
  {
    nombre: 'Upper / Lower Frecuencia 2',
    tipo: 'Fuerza',
    frecuencia: '4 dias por semana'
  },
  {
    nombre: 'Full Body Funcional Express',
    tipo: 'Acondicionamiento',
    frecuencia: '3 dias por semana'
  }
];

const initialExercises = [
  { nombre: 'Press de Banca Plano con Barra', grupo_muscular: 'Pectorales' },
  { nombre: 'Sentadilla Trasera con Barra', grupo_muscular: 'Piernas' },
  { nombre: 'Jalon al Pecho en Polea Alta', grupo_muscular: 'Espalda' },
  { nombre: 'Press Militar con Mancuernas', grupo_muscular: 'Hombros' },
  { nombre: 'Curl de Biceps en Banco Scott', grupo_muscular: 'Brazos' }
];

const initialProducts = [
  { nombre: 'Proteina Whey Isolate 100% 2kg', precio: 249.00, categoria: 'Suplementos', stock: 25 },
  { nombre: 'Creatina Monohidratada Creapure 300g', precio: 129.00, categoria: 'Suplementos', stock: 40 },
  { nombre: 'Pre-Entreno Nitro Explosive 300g', precio: 149.00, categoria: 'Suplementos', stock: 18 }
];

async function initDatabase() {
  const client = await pool.connect();
  try {
    console.log('Iniciando ejecucion de sentencias DDL en PostgreSQL...');
    await client.query('BEGIN');

    await client.query(createTablesSQL);
    console.log('Tablas del sistema verificadas o creadas exitosamente.');

    // Inicializacion de usuarios
    for (const userData of initialUsers) {
      const userCheck = await client.query('SELECT id FROM Usuarios WHERE email = $1', [userData.email]);

      let userId;
      if (userCheck.rows.length === 0) {
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(userData.password, saltRounds);

        const insertUserResult = await client.query(
          `INSERT INTO Usuarios (nombre, email, password_hash, rol)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [userData.nombre, userData.email, passwordHash, userData.rol]
        );
        userId = insertUserResult.rows[0].id;
        console.log(`Usuario ${userData.nombre} (${userData.rol}) registrado con ID ${userId}.`);
      } else {
        userId = userCheck.rows[0].id;
      }

      if (userData.rol === 'socio') {
        const membershipCheck = await client.query(
          'SELECT id FROM Membresias WHERE usuario_id = $1',
          [userId]
        );

        if (membershipCheck.rows.length === 0) {
          const expirationDate = new Date();
          expirationDate.setFullYear(expirationDate.getFullYear() + 1);

          await client.query(
            `INSERT INTO Membresias (usuario_id, tipo, estado, fecha_vencimiento)
             VALUES ($1, $2, $3, $4)`,
            [userId, 'Black VIP Anual', 'Activa', expirationDate.toISOString().split('T')[0]]
          );
          console.log(`Membresia inicial creada para el socio ID ${userId}.`);
        }

        const attendanceCheck = await client.query(
          'SELECT id FROM Asistencias WHERE usuario_id = $1 LIMIT 1',
          [userId]
        );

        if (attendanceCheck.rows.length === 0) {
          const now = new Date();
          const currentYear = now.getFullYear();
          const currentMonth = now.getMonth();

          const seedDates = [
            new Date(currentYear, currentMonth, 2, 7, 30),
            new Date(currentYear, currentMonth, 4, 8, 15),
            new Date(currentYear, currentMonth, 6, 19, 0),
            new Date(currentYear, currentMonth, 9, 7, 45),
            new Date(currentYear, currentMonth, 11, 18, 30),
            new Date(currentYear, currentMonth, 13, 8, 0),
            new Date(currentYear, currentMonth, 16, 7, 15),
            new Date(currentYear, currentMonth, 18, 19, 40),
            new Date(currentYear, currentMonth, 20, 8, 10),
            new Date(currentYear, currentMonth, 23, 18, 0),
            new Date(currentYear, currentMonth, 25, 7, 30),
            new Date(currentYear, currentMonth, 27, 8, 45)
          ];

          for (const d of seedDates) {
            await client.query(
              `INSERT INTO Asistencias (usuario_id, fecha)
               VALUES ($1, $2)`,
              [userId, d.toISOString()]
            );
          }
          console.log(`Asistencias iniciales insertadas para el socio ID ${userId}.`);
        }
      }
    }

    // Inicializacion de rutinas base
    for (const routine of initialRoutines) {
      const routineCheck = await client.query('SELECT id FROM Rutinas WHERE nombre = $1', [routine.nombre]);
      if (routineCheck.rows.length === 0) {
        await client.query(
          `INSERT INTO Rutinas (nombre, tipo, frecuencia)
           VALUES ($1, $2, $3)`,
          [routine.nombre, routine.tipo, routine.frecuencia]
        );
        console.log(`Rutina "${routine.nombre}" registrada.`);
      }
    }

    // Inicializacion de los 5 ejercicios basicos de prueba
    const exerciseIds = [];
    for (const ex of initialExercises) {
      const exCheck = await client.query('SELECT id FROM Ejercicios WHERE nombre = $1', [ex.nombre]);
      if (exCheck.rows.length === 0) {
        const insertEx = await client.query(
          `INSERT INTO Ejercicios (nombre, grupo_muscular)
           VALUES ($1, $2)
           RETURNING id`,
          [ex.nombre, ex.grupo_muscular]
        );
        exerciseIds.push(insertEx.rows[0].id);
        console.log(`Ejercicio "${ex.nombre}" (${ex.grupo_muscular}) creado con ID ${insertEx.rows[0].id}.`);
      } else {
        exerciseIds.push(exCheck.rows[0].id);
      }
    }

    // Vincular ejercicios a la rutina principal (id: 1) en Rutinas_Detalle
    const routineId = 1;
    const detailCheck = await client.query('SELECT id FROM Rutinas_Detalle WHERE rutina_id = $1 LIMIT 1', [routineId]);

    if (detailCheck.rows.length === 0 && exerciseIds.length >= 5) {
      const defaultConfigs = [
        { series: 4, repeticiones: '8 - 10' },
        { series: 4, repeticiones: '6 - 8' },
        { series: 4, repeticiones: '10 - 12' },
        { series: 3, repeticiones: '10 - 12' },
        { series: 3, repeticiones: '12 - 15' }
      ];

      for (let i = 0; i < 5; i++) {
        await client.query(
          `INSERT INTO Rutinas_Detalle (rutina_id, ejercicio_id, series, repeticiones)
           VALUES ($1, $2, $3, $4)`,
          [routineId, exerciseIds[i], defaultConfigs[i].series, defaultConfigs[i].repeticiones]
        );
      }
      console.log('Detalle de ejercicios asignados a la rutina principal.');
    }

    // Inicializacion de productos de la tienda
    for (const prod of initialProducts) {
      const prodCheck = await client.query('SELECT id FROM Productos WHERE nombre = $1', [prod.nombre]);
      if (prodCheck.rows.length === 0) {
        await client.query(
          `INSERT INTO Productos (nombre, precio, categoria, stock)
           VALUES ($1, $2, $3, $4)`,
          [prod.nombre, prod.precio, prod.categoria, prod.stock]
        );
        console.log(`Producto "${prod.nombre}" registrado en inventario.`);
      }
    }

    await client.query('COMMIT');
    console.log('Transaccion de inicializacion de PostgreSQL completada con exito.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error durante la inicializacion de la base de datos PostgreSQL:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('Script de inicializacion finalizado.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fallo de ejecucion:', err.message);
      process.exit(1);
    });
}

module.exports = initDatabase;
