require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '2347396607',
  database: process.env.DB_NAME || 'gimnasio_db',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true
};

const pool = mysql.createPool(dbConfig);

async function initDatabase() {
  const rootConn = await mysql.createConnection({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
    port: dbConfig.port
  });

  try {
    await rootConn.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` 
       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
  } finally {
    await rootConn.end();
  }

  const conn = await pool.getConnection();
  try {
    // 1. Tabla: usuarios
    await conn.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        rol ENUM('admin', 'entrenador', 'socio') NOT NULL DEFAULT 'socio',
        peso DECIMAL(5,2) DEFAULT NULL,
        altura DECIMAL(5,2) DEFAULT NULL,
        edad INT DEFAULT NULL,
        genero VARCHAR(20) DEFAULT NULL,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Tabla: membresias
    await conn.query(`
      CREATE TABLE IF NOT EXISTS membresias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        tipo VARCHAR(100) NOT NULL,
        estado VARCHAR(50) NOT NULL DEFAULT 'Activa',
        fecha_vencimiento DATE NOT NULL,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_membresias_usuario
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Tabla: asistencias
    await conn.query(`
      CREATE TABLE IF NOT EXISTS asistencias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_asistencias_usuario
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Tabla: productos
    await conn.query(`
      CREATE TABLE IF NOT EXISTS productos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        categoria VARCHAR(100) NOT NULL,
        precio DECIMAL(10,2) NOT NULL,
        stock INT NOT NULL DEFAULT 0,
        imagen_url VARCHAR(255) DEFAULT NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. Tabla: solicitudes_rutina
    await conn.query(`
      CREATE TABLE IF NOT EXISTS solicitudes_rutina (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        objetivo VARCHAR(50) NOT NULL,
        dias_semana INT NOT NULL,
        observaciones TEXT DEFAULT NULL,
        estado VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
        fecha_solicitud TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_solicitudes_usuario
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. Tabla: rutinas
    await conn.query(`
      CREATE TABLE IF NOT EXISTS rutinas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        tipo VARCHAR(100) NOT NULL,
        frecuencia VARCHAR(100) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 7. Tabla: ejercicios
    await conn.query(`
      CREATE TABLE IF NOT EXISTS ejercicios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        grupo_muscular VARCHAR(100) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 8. Tabla: rutinas_detalle
    await conn.query(`
      CREATE TABLE IF NOT EXISTS rutinas_detalle (
        id INT AUTO_INCREMENT PRIMARY KEY,
        rutina_id INT NOT NULL,
        ejercicio_id INT NOT NULL,
        series INT NOT NULL,
        repeticiones VARCHAR(50) NOT NULL,
        CONSTRAINT fk_detalle_rutina
          FOREIGN KEY (rutina_id) REFERENCES rutinas(id)
          ON DELETE CASCADE,
        CONSTRAINT fk_detalle_ejercicio
          FOREIGN KEY (ejercicio_id) REFERENCES ejercicios(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Sembrado automatico de datos iniciales si no existen
    await seedInitialData(conn);

  } finally {
    conn.release();
  }
}

async function seedInitialData(conn) {
  // 1. Usuarios iniciales
  const [usersCount] = await conn.query('SELECT COUNT(*) AS total FROM usuarios');
  if (usersCount[0].total === 0) {
    const saltRounds = 10;
    const adminHash = await bcrypt.hash('admin123', saltRounds);
    const entrenadorHash = await bcrypt.hash('entrenador123', saltRounds);
    const socioHash = await bcrypt.hash('socio123', saltRounds);

    const [adminRes] = await conn.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol, peso, altura, edad, genero)
       VALUES (?, ?, ?, 'admin', 80.0, 180.0, 32, 'Masculino')`,
      ['Administrador General', 'admin@infiniteforce.com', adminHash]
    );

    const [coachRes] = await conn.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol, peso, altura, edad, genero)
       VALUES (?, ?, ?, 'entrenador', 85.5, 182.0, 29, 'Masculino')`,
      ['Carlos Entrenador', 'entrenador@infiniteforce.com', entrenadorHash]
    );

    const [socioRes] = await conn.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol, peso, altura, edad, genero)
       VALUES (?, ?, ?, 'socio', 76.5, 175.0, 26, 'Masculino')`,
      ['Alex Rivera', 'socio@infiniteforce.com', socioHash]
    );

    const socioId = socioRes.insertId;

    // Membresia activa para el socio inicial (30 dias de vigencia)
    const fechaVigencia = new Date();
    fechaVigencia.setDate(fechaVigencia.getDate() + 30);
    const fechaVigenciaStr = fechaVigencia.toISOString().split('T')[0];

    await conn.query(
      `INSERT INTO membresias (usuario_id, tipo, estado, fecha_vencimiento)
       VALUES (?, 'Membresia Black VIP Anual', 'Activa', ?)`,
      [socioId, fechaVigenciaStr]
    );

    // Asistencias de prueba del mes actual para el socio
    await conn.query(
      `INSERT INTO asistencias (usuario_id, fecha) VALUES (?, NOW())`,
      [socioId]
    );

    // Solicitud inicial de rutina para evaluacion del entrenador
    await conn.query(
      `INSERT INTO solicitudes_rutina (usuario_id, objetivo, dias_semana, observaciones, estado)
       VALUES (?, 'Hipertrofia', 4, 'Molestia leve en manguito rotador derecho al hacer press banca plano.', 'Pendiente')`,
      [socioId]
    );
  }

  // 2. Catalogo inicial de productos de la tienda
  const [prodCount] = await conn.query('SELECT COUNT(*) AS total FROM productos');
  if (prodCount[0].total === 0) {
    await conn.query(`
      INSERT INTO productos (nombre, categoria, precio, stock, imagen_url) VALUES
      ('Proteina Whey Isolate 2kg - Vainilla Gourmet', 'Suplementos', 229.90, 18, '/images/products/whey.png'),
      ('Creatina Monohidratada Creapure 300g Micronizada', 'Suplementos', 139.50, 24, '/images/products/creatina.png'),
      ('Pre-Entreno Nitro Blast 30 Servicios - Fruit Punch', 'Suplementos', 159.00, 10, '/images/products/preworkout.png'),
      ('Shaker Termico Acero Inoxidable 750ml Infinite Force', 'Accesorios', 49.90, 30, '/images/products/shaker.png'),
      ('Cinturon Lumbar de Cuero Powerlifting 10mm (Agotado)', 'Accesorios', 119.00, 0, '/images/products/belt.png')
    `);
  }

  // 3. Catalogo de rutinas y ejercicios
  const [rutinasCount] = await conn.query('SELECT COUNT(*) AS total FROM rutinas');
  if (rutinasCount[0].total === 0) {
    const [rutinaRes] = await conn.query(`
      INSERT INTO rutinas (nombre, tipo, frecuencia)
      VALUES ('Fuerza e Hipertrofia (PPL)', 'Hipertrofia', '4 dias por semana')
    `);
    const rutinaId = rutinaRes.insertId;

    const [ej1] = await conn.query(`INSERT INTO ejercicios (nombre, grupo_muscular) VALUES ('Press de Banca Plano con Barra', 'Pectoral')`);
    const [ej2] = await conn.query(`INSERT INTO ejercicios (nombre, grupo_muscular) VALUES ('Sentadilla Trasera con Barra', 'Cuadriceps')`);
    const [ej3] = await conn.query(`INSERT INTO ejercicios (nombre, grupo_muscular) VALUES ('Peso Muerto Rumano', 'Isquiosurales')`);
    const [ej4] = await conn.query(`INSERT INTO ejercicios (nombre, grupo_muscular) VALUES ('Press Militar con Mancuernas', 'Deltoides')`);
    const [ej5] = await conn.query(`INSERT INTO ejercicios (nombre, grupo_muscular) VALUES ('Dominadas Pronas con Lastre', 'Dorsal')`);

    await conn.query(`
      INSERT INTO rutinas_detalle (rutina_id, ejercicio_id, series, repeticiones) VALUES
      (?, ?, 4, '8 - 10 reps'),
      (?, ?, 4, '6 - 8 reps'),
      (?, ?, 3, '10 - 12 reps'),
      (?, ?, 4, '10 - 12 reps'),
      (?, ?, 3, 'Al fallo')
    `, [
      rutinaId, ej1.insertId,
      rutinaId, ej2.insertId,
      rutinaId, ej3.insertId,
      rutinaId, ej4.insertId,
      rutinaId, ej5.insertId
    ]);
  }
}

module.exports = {
  pool,
  initDatabase
};
