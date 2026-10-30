const path = require('path');
const fs = require('fs');
const { pool } = require('../database/db');

const tiendaController = {
  renderTiendaView: async (req, res) => {
    const userName = req.session?.user?.nombre || 'Socio Oficial';
    const userEmail = req.session?.user?.email || '';
    const userRole = req.session?.user?.rol || 'socio';

    const volverEntrenadorHtml = userRole === 'entrenador'
      ? '<a href="/entrenador-dashboard" class="bg-yellow-400 text-zinc-950 font-bold px-4 py-2 rounded-lg hover:bg-yellow-300 transition-all text-xs uppercase tracking-wider shadow-md inline-flex items-center">PANEL ENTRENADOR</a>'
      : '';

    try {
      // Consulta SQL que filtra estrictamente los productos disponibles con stock > 0
      const query = 'SELECT id, nombre, categoria, precio, stock, imagen_url FROM productos WHERE stock > 0 ORDER BY id ASC';
      const [productos] = await pool.query(query);

      let cardsHtml = '';
      if (productos.length === 0) {
        cardsHtml = `
          <div class="col-span-full py-20 text-center bg-zinc-800/30 border border-zinc-800 rounded-xl p-8">
            <p class="text-zinc-400 text-base font-semibold tracking-wide">El catalogo se actualizara pronto</p>
            <p class="text-xs text-zinc-500 mt-2">Nuevos suplementos y articulos deportivos ingresaran proximamente.</p>
          </div>
        `;
      } else {
        cardsHtml = productos.map(prod => `
          <div class="group bg-zinc-800/50 hover:bg-zinc-800/70 border border-zinc-800 hover:border-yellow-400/50 rounded-xl p-5 shadow-lg flex flex-col justify-between transition-all duration-200">
            <div>
              <div class="relative w-full h-48 mb-4 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center overflow-hidden">
                ${prod.imagen_url ? `
                  <img
                    src="${prod.imagen_url}"
                    alt="${prod.nombre}"
                    onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div style="display:none;" class="flex-col items-center justify-center text-zinc-500 p-4 w-full h-full">
                    <svg class="w-12 h-12 text-zinc-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Sin Imagen</span>
                  </div>
                ` : `
                  <div class="flex flex-col items-center justify-center text-zinc-500 p-4">
                    <svg class="w-12 h-12 text-zinc-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Sin Imagen</span>
                  </div>
                `}
                <span class="absolute top-2.5 right-2.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-zinc-950/90 text-yellow-400 border border-yellow-400/40 rounded-lg backdrop-blur shadow-sm">
                  ${prod.categoria}
                </span>
              </div>

              <div class="flex items-center justify-between text-xs text-zinc-400 mb-2 font-mono">
                <span>Stock disponible:</span>
                <span class="font-bold text-zinc-200">${prod.stock} unidades</span>
              </div>

              <h3 class="text-base font-bold text-white uppercase tracking-wide leading-snug group-hover:text-yellow-400 transition-colors">
                ${prod.nombre}
              </h3>
            </div>

            <div class="mt-6 pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <span class="text-[10px] uppercase font-bold text-zinc-400 block">Precio Unitario</span>
                <span class="text-xl font-extrabold text-yellow-400 font-mono">
                  S/ ${Number(prod.precio).toFixed(2)}
                </span>
              </div>
              <button
                type="button"
                data-id="${prod.id}"
                data-name="${prod.nombre.replace(/"/g, '&quot;')}"
                data-price="${Number(prod.precio).toFixed(2)}"
                data-image="${prod.imagen_url || ''}"
                class="btn-add-cart px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-zinc-950 font-bold uppercase tracking-wider text-xs rounded-xl shadow-md transition-all active:scale-95 text-center"
              >
                Añadir al carrito
              </button>
            </div>
          </div>
        `).join('');
      }

      const templatePath = path.join(__dirname, '..', 'views', 'tienda.html');
      let html = await fs.promises.readFile(templatePath, 'utf8');

      html = html
        .replace(/{{USER_NAME}}/g, userName)
        .replace(/{{USER_EMAIL}}/g, userEmail)
        .replace('{{VOLVER_PANEL_ENTRENADOR_HTML}}', volverEntrenadorHtml)
        .replace('{{PRODUCT_CARDS_GRID}}', cardsHtml);

      return res.status(200).send(html);
    } catch (error) {
      console.error('Error al consultar productos de MySQL para la tienda:', error.message);
      return res.status(500).send('Error interno al cargar la tienda oficial.');
    }
  },

  getProductosAPI: async (req, res) => {
    try {
      const query = 'SELECT id, nombre, categoria, precio, stock, imagen_url FROM productos WHERE stock > 0 ORDER BY id ASC';
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
  },

  checkout: async (req, res) => {
    const { items, metodoPago } = req.body;
    const userId = req.session.user.id;
    const userName = req.session.user.nombre;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El carrito de compras se encuentra vacío.'
      });
    }

    const metodosPermitidos = [
      'Efectivo en Recepción',
      'Yape / Plin en Mostrador',
      'Tarjeta en POS Recepción'
    ];
    const metodoPagoFinal = metodosPermitidos.includes(metodoPago)
      ? metodoPago
      : 'Efectivo en Recepción';

    let conn;
    try {
      conn = await pool.getConnection();
      await conn.beginTransaction();

      // Generar codigo unico de ticket con prefijo IFG- y 4 digitos
      let codigoTicket = '';
      let isUnique = false;
      while (!isUnique) {
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        codigoTicket = `IFG-${randomDigits}`;
        const [existing] = await conn.query('SELECT id FROM pedidos WHERE codigo_ticket = ?', [codigoTicket]);
        if (existing.length === 0) {
          isUnique = true;
        }
      }

      let totalGeneral = 0;
      const processedItems = [];

      // Validar cada producto con bloqueo pesimista FOR UPDATE
      for (const item of items) {
        const prodId = parseInt(item.id, 10);
        const cant = parseInt(item.cantidad, 10);

        if (isNaN(prodId) || isNaN(cant) || cant <= 0) {
          await conn.rollback();
          conn.release();
          return res.status(400).json({
            success: false,
            message: 'La lista de productos o cantidades no es válida.'
          });
        }

        const [prodRows] = await conn.query(
          'SELECT id, nombre, precio, stock FROM productos WHERE id = ? FOR UPDATE',
          [prodId]
        );

        if (prodRows.length === 0) {
          await conn.rollback();
          conn.release();
          return res.status(404).json({
            success: false,
            message: `El producto solicitado (ID: ${prodId}) no existe en el catálogo.`
          });
        }

        const prod = prodRows[0];
        if (prod.stock < cant) {
          await conn.rollback();
          conn.release();
          return res.status(400).json({
            success: false,
            message: `Stock insuficiente para "${prod.nombre}". Existencias disponibles: ${prod.stock}.`
          });
        }

        const precioUnitario = Number(prod.precio);
        const subtotal = Number((precioUnitario * cant).toFixed(2));
        totalGeneral += subtotal;

        processedItems.push({
          productoId: prod.id,
          nombre: prod.nombre,
          precioUnitario,
          cantidad: cant,
          subtotal
        });
      }

      totalGeneral = Number(totalGeneral.toFixed(2));

      // Insertar pedido en estado Pendiente de Pago
      const insertPedidoQuery = `
        INSERT INTO pedidos (codigo_ticket, usuario_id, total, metodo_pago, estado)
        VALUES (?, ?, ?, ?, 'Pendiente de Pago')
      `;
      const [pedidoResult] = await conn.query(insertPedidoQuery, [
        codigoTicket,
        userId,
        totalGeneral,
        metodoPagoFinal
      ]);
      const pedidoId = pedidoResult.insertId;

      // Insertar pedidos_detalle y descontar stock de inmediato
      for (const item of processedItems) {
        await conn.query(
          `INSERT INTO pedidos_detalle (pedido_id, producto_id, cantidad, precio_unitario, subtotal)
           VALUES (?, ?, ?, ?, ?)`,
          [pedidoId, item.productoId, item.cantidad, item.precioUnitario, item.subtotal]
        );

        await conn.query(
          'UPDATE productos SET stock = stock - ? WHERE id = ?',
          [item.cantidad, item.productoId]
        );
      }

      await conn.commit();
      conn.release();

      const now = new Date();
      const fechaStr = now.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      return res.status(201).json({
        success: true,
        codigoTicket,
        total: totalGeneral.toFixed(2),
        metodoPago: metodoPagoFinal,
        fecha: fechaStr,
        socioNombre: userName,
        items: processedItems,
        message: 'Ticket de compra generado con éxito.'
      });
    } catch (error) {
      if (conn) {
        await conn.rollback();
        conn.release();
      }
      console.error('Error al procesar checkout de compra en MySQL:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error interno en el servidor al procesar la compra.'
      });
    }
  },

  getMisPedidos: async (req, res) => {
    const userId = req.session.user.id;

    try {
      const query = `
        SELECT p.id, p.codigo_ticket, p.total, p.metodo_pago, p.estado,
               DATE_FORMAT(p.fecha_pedido, '%d/%m/%Y %H:%i') AS fecha
        FROM pedidos p
        WHERE p.usuario_id = ?
        ORDER BY p.id DESC
      `;
      const [pedidos] = await pool.query(query, [userId]);

      return res.status(200).json({
        success: true,
        pedidos
      });
    } catch (error) {
      console.error('Error al consultar pedidos del socio en MySQL:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error al consultar historial de pedidos.'
      });
    }
  }
};

module.exports = tiendaController;
