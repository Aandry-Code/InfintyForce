const https = require('https');
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'public', 'img', 'productos');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const items = [
  {
    name: 'whey-protein.jpg',
    url: 'https://images.unsplash.com/photo-1693996045300-521e9d08cabc?w=600&auto=format&fit=crop&q=85',
    productId: 1
  },
  {
    name: 'creatina.jpg',
    url: 'https://images.unsplash.com/photo-1704650311190-7eeb9c4f6e11?w=600&auto=format&fit=crop&q=85',
    productId: 2
  },
  {
    name: 'pre-entreno.jpg',
    url: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=600&auto=format&fit=crop&q=85',
    productId: 3
  },
  {
    name: 'shaker.jpg',
    url: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=600&auto=format&fit=crop&q=85',
    productId: 4
  },
  {
    name: 'cinturon-cuero.jpg',
    url: 'https://images.unsplash.com/photo-1532382708467-d720b918f0da?w=600&auto=format&fit=crop&q=85',
    productId: 5
  },
  {
    name: 'glutamina.jpg',
    url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=85',
    productId: 6
  }
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error('HTTP Status ' + res.statusCode + ' for ' + url));
      }
      const fileStream = fs.createWriteStream(dest);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close(resolve);
      });
      fileStream.on('error', err => {
        fs.unlink(dest, () => reject(err));
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('Downloading real photos to public/img/productos/...');
  for (const item of items) {
    const dest = path.join(targetDir, item.name);
    try {
      await downloadFile(item.url, dest);
      const stats = fs.statSync(dest);
      console.log(`Downloaded ${item.name} (${stats.size} bytes)`);
    } catch (err) {
      console.error(`Error downloading ${item.name}:`, err.message);
    }
  }

  // Update MySQL database
  const { pool } = require('../database/db');
  console.log('Updating MySQL database...');
  for (const item of items) {
    const dbPath = `/img/productos/${item.name}`;
    await pool.query('UPDATE productos SET imagen_url = ? WHERE id = ?', [dbPath, item.productId]);
    console.log(`Updated product ID ${item.productId} -> ${dbPath}`);
  }

  const [products] = await pool.query('SELECT id, nombre, imagen_url FROM productos ORDER BY id ASC');
  console.log('Final database state:');
  console.log(products);

  process.exit(0);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
