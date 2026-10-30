const path = require('path');
const fs = require('fs');
const { pool } = require('../database/db');

const tiendaController = {
  renderTiendaView: async (req, res) => {
    try {
      // Consulta SQL que filtra estrictamente los productos disponibles con stock > 0
      const query = 'SELECT * FROM productos WHERE stock > 0 ORDER BY id ASC';
      const [productos] = await pool.query(query);

      let cardsHtml = '';
      if (productos.length === 0) {
        cardsHtml = `
          <div class="col-span-full py-20 text-center">
            <p class="text-zinc-400 text-base font-medium tracking-wide">El catalogo se actualizara pronto</p>
          </div>
        `;
      } else {
        cardsHtml = productos.map(prod => `
          <div class="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between hover:border-zinc-700 transition duration-150">
            <div>
              <div class="flex items-center justify-between gap-2 mb-3">
                <span class="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-zinc-800 text-brand-yellow border border-zinc-700 rounded-md">
                  ${prod.categoria}
                </span>
                <span class="text-xs font-mono text-zinc-400">
                  Stock: <strong class="text-zinc-200">${prod.stock}</strong> u.
                </span>
              </div>
              <h3 class="text-lg font-bold text-white uppercase tracking-wide my-2 leading-snug">
                ${prod.nombre}
              </h3>
            </div>

            <div class="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-4">
              <div>
                <span class="text-[10px] uppercase font-bold text-zinc-500 block">Precio Unitario</span>
                <span class="text-2xl font-extrabold text-brand-yellow font-mono">
                  S/. ${Number(prod.precio).toFixed(2)}
                </span>
              </div>
              <button
                type="button"
                data-id="${prod.id}"
                data-name="${prod.nombre.replace(/"/g, '&quot;')}"
                class="btn-add-cart px-4 py-2.5 bg-zinc-800 hover:bg-brand-yellow hover:text-zinc-950 text-white font-bold uppercase tracking-wider text-xs rounded-xl border border-zinc-700 hover:border-brand-yellow transition duration-150 active:scale-95"
              >
                Anadir al carrito
              </button>
            </div>
          </div>
        `).join('');
      }

      const templatePath = path.join(__dirname, '..', 'views', 'tienda.html');
      let html = await fs.promises.readFile(templatePath, 'utf8');

      html = html.replace('{{PRODUCT_CARDS_GRID}}', cardsHtml);

      return res.status(200).send(html);
    } catch (error) {
      console.error('Error al consultar productos de MySQL para la tienda:', error.message);
      return res.status(500).send('Error interno al cargar la tienda oficial.');
    }
  },

  getProductosAPI: async (req, res) => {
    try {
      const query = 'SELECT * FROM productos WHERE stock > 0 ORDER BY id ASC';
      const [productos] = await pool.query(query);
      return res.status(200).json({
        success: true,
        productos: productos
      });
    } catch (error) {
      console.error('Error al obtener lista de productos API en MySQL:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error al consultar productos.'
      });
    }
  }
};

module.exports = tiendaController;
