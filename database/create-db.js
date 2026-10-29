require('dotenv').config();
const { Client } = require('pg');

async function createDatabaseIfNotExists() {
  const adminClient = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'postgres', // Conexion a la base por defecto de postgres
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT, 10) || 5432
  });

  try {
    console.log('Intentando conectar con el servidor PostgreSQL en ' + (process.env.DB_HOST || 'localhost') + ':' + (process.env.DB_PORT || 5432) + '...');
    await adminClient.connect();
    console.log('Autenticacion con PostgreSQL completada con exito.');

    const targetDb = process.env.DB_NAME || 'infinite_force_db';
    const checkDbQuery = 'SELECT 1 FROM pg_database WHERE datname = $1';
    const result = await adminClient.query(checkDbQuery, [targetDb]);

    if (result.rows.length === 0) {
      console.log(`La base de datos "${targetDb}" no existe. Procediendo a crearla...`);
      await adminClient.query(`CREATE DATABASE "${targetDb}"`);
      console.log(`Base de datos "${targetDb}" creada satisfactoriamente.`);
    } else {
      console.log(`La base de datos "${targetDb}" ya existe en el servidor PostgreSQL.`);
    }
  } catch (error) {
    console.error('Fallo en la conexion o creacion de base de datos:', error.message);
    throw error;
  } finally {
    await adminClient.end();
  }
}

if (require.main === module) {
  createDatabaseIfNotExists()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = createDatabaseIfNotExists;
