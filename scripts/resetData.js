require('dotenv').config();
const { pool } = require('../database/db');
const bcrypt = require('bcrypt');

async function resetearDatosPrueba() {
  const conn = await pool.getConnection();
  try {
    console.log('🔄 Iniciando reseteo de datos para pruebas limpias...');

    // 1. Limpiar tablas transaccionales (sin borrar catálogo ni usuarios base)
    await conn.query('DELETE FROM pedidos_detalle');
    await conn.query('DELETE FROM pedidos');
    await conn.query('DELETE FROM solicitudes_rutina');
    await conn.query('DELETE FROM asistencias');
    await conn.query('DELETE FROM membresias');

    // 2. Restaurar o garantizar usuarios base con contraseñas encriptadas
    const saltRounds = 10;
    const adminHash = await bcrypt.hash('admin123', saltRounds);
    const entrenadorHash = await bcrypt.hash('entrenador123', saltRounds);
    const socioHash = await bcrypt.hash('socio123', saltRounds);

    // Limpiar usuarios que no sean los 3 principales
    await conn.query("DELETE FROM usuarios WHERE email NOT IN ('admin@infiniteforce.com', 'entrenador@infiniteforce.com', 'socio@infiniteforce.com')");

    // Asegurar usuario Admin
    await conn.query(`
      INSERT INTO usuarios (id, nombre, email, password_hash, rol, peso, altura, edad, genero)
      VALUES (1, 'Administrador General', 'admin@infiniteforce.com', ?, 'admin', 80.0, 180.0, 32, 'Masculino')
      ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), rol = 'admin'
    `, [adminHash]);

    // Asegurar usuario Entrenador
    await conn.query(`
      INSERT INTO usuarios (id, nombre, email, password_hash, rol, peso, altura, edad, genero)
      VALUES (2, 'Carlos Entrenador', 'entrenador@infiniteforce.com', ?, 'entrenador', 85.5, 182.0, 29, 'Masculino')
      ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), rol = 'entrenador'
    `, [entrenadorHash]);

    // Asegurar usuario Socio (sin rutina activa aún para que pueda pedir una)
    await conn.query(`
      INSERT INTO usuarios (id, nombre, email, password_hash, rol, peso, altura, edad, genero, rutina_activa_id)
      VALUES (3, 'Alex Rivera', 'socio@infiniteforce.com', ?, 'socio', 76.5, 175.0, 26, 'Masculino', NULL)
      ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), rol = 'socio', rutina_activa_id = NULL
    `, [socioHash]);

    // 3. Crear membresía activa fresca para el socio (+30 días a partir de hoy)
    const fechaVenc = new Date();
    fechaVenc.setDate(fechaVenc.getDate() + 30);
    const fechaVencStr = fechaVenc.toISOString().split('T')[0];

    await conn.query(`
      INSERT INTO membresias (usuario_id, tipo, estado, fecha_vencimiento)
      VALUES (3, 'Membresia Mensual Standard', 'Activa', ?)
    `, [fechaVencStr]);

    // 4. Restaurar existencias de productos de la tienda para poder comprar
    await conn.query(`
      UPDATE productos
      SET stock = CASE 
        WHEN stock <= 5 THEN 20 
        ELSE stock 
      END
    `);

    console.log('✅ Base de datos reseteada exitosamente con estado 100% limpio:');
    console.log('   - 0 Asistencias registradas hoy (Cronómetro listo para iniciar)');
    console.log('   - 0 Solicitudes de rutina pendientes (Formulario de socio listo)');
    console.log('   - 0 Tickets en caja (Tienda lista para comprar y despachar)');
    console.log('   - Socio con Membresía Activa (30 días de vigencia)');
    console.log('   - Catálogo de productos con stock renovado');
  } catch (error) {
    console.error('❌ Error al resetear datos:', error);
  } finally {
    conn.release();
    process.exit(0);
  }
}

resetearDatosPrueba();
