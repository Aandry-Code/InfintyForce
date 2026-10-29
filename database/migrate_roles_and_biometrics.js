const bcrypt = require('bcrypt');
const { pool } = require('./config');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('1. Modificando columna rol y constraint en tabla Usuarios...');
    // Aumentar longitud de columna rol a VARCHAR(20)
    await client.query('ALTER TABLE Usuarios ALTER COLUMN rol TYPE VARCHAR(20)');
    // Eliminar constraint anterior si existe
    await client.query('ALTER TABLE Usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check');
    // Agregar nuevo constraint con rol entrenador permitido
    await client.query("ALTER TABLE Usuarios ADD CONSTRAINT usuarios_rol_check CHECK(rol IN ('admin', 'entrenador', 'socio'))");
    console.log('Constraint de rol actualizado con exito: admin, entrenador, socio.');

    console.log('2. Creando tabla Datos_Biometricos si no existe...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS Datos_Biometricos (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES Usuarios(id) ON DELETE CASCADE,
        peso NUMERIC(5,2) NOT NULL,
        altura NUMERIC(5,2) NOT NULL,
        edad INTEGER NOT NULL,
        lesiones TEXT,
        fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Tabla Datos_Biometricos verificada/creada con exito.');

    console.log('3. Verificando o registrando usuario de prueba con rol entrenador...');
    const entrenadorEmail = 'entrenador@infiniteforce.com';
    const checkEntrenador = await client.query('SELECT id FROM Usuarios WHERE email = $1', [entrenadorEmail]);

    if (checkEntrenador.rows.length === 0) {
      const passwordHash = await bcrypt.hash('EntrenadorPassword123', 10);
      const insertEntrenador = await client.query(
        `INSERT INTO Usuarios (nombre, email, password_hash, rol)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        ['Profesor Marcos Ruiz', entrenadorEmail, passwordHash, 'entrenador']
      );
      console.log(`Usuario entrenador creado exitosamente con ID ${insertEntrenador.rows[0].id}.`);
    } else {
      console.log('El usuario entrenador ya existe en la base de datos.');
    }

    console.log('4. Verificando datos biometricos para el socio de prueba...');
    const checkSocio = await client.query("SELECT id FROM Usuarios WHERE email = 'socio@infiniteforce.com'");
    if (checkSocio.rows.length > 0) {
      const socioId = checkSocio.rows[0].id;
      const checkBio = await client.query('SELECT id FROM Datos_Biometricos WHERE usuario_id = $1', [socioId]);
      if (checkBio.rows.length === 0) {
        await client.query(
          `INSERT INTO Datos_Biometricos (usuario_id, peso, altura, edad, lesiones)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            socioId,
            78.50,
            178.00,
            28,
            'Molestia leve en menisco de rodilla izquierda al realizar flexiones profundas de sentadilla.'
          ]
        );
        console.log(`Datos biometricos de prueba insertados para el socio ID ${socioId}.`);
      }
    }

    await client.query('COMMIT');
    console.log('Migracion de roles y biometria completada satisfactoriamente.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error durante la migracion:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

migrate()
  .then(() => {
    console.log('Fin de script de migracion.');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
