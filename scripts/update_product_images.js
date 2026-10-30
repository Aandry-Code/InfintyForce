const { pool } = require('../database/db');

async function updateProductImages() {
  try {
    await pool.query("UPDATE productos SET imagen_url = '/img/productos/whey-protein.svg' WHERE id = 1");
    await pool.query("UPDATE productos SET imagen_url = '/img/productos/creatina-creapure.svg' WHERE id = 2");
    await pool.query("UPDATE productos SET imagen_url = '/img/productos/pre-entreno-nitro.svg' WHERE id = 3");
    await pool.query("UPDATE productos SET imagen_url = '/img/productos/shaker-inoxidable.svg' WHERE id = 4");
    await pool.query("UPDATE productos SET imagen_url = '/img/productos/cinturon-powerlifting.svg' WHERE id = 5");
    await pool.query("UPDATE productos SET imagen_url = '/img/productos/glutamina-micronizada.svg' WHERE id = 6");

    const [rows] = await pool.query('SELECT id, nombre, precio, stock, imagen_url FROM productos ORDER BY id ASC');
    console.log('Updated products successfully:');
    console.log(rows);
    process.exit(0);
  } catch (err) {
    console.error('Error updating products:', err);
    process.exit(1);
  }
}

updateProductImages();
