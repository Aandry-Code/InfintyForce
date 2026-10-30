const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const { pool } = require('../database/db');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const adminController = {
  renderAdminDashboard: async (req, res) => {
    const adminName = req.session.user.nombre;
    const adminEmail = req.session.user.email;

    try {
      // Actualizar automaticamente a estado = 'Vencida' las membresias cuya fecha_vencimiento < CURDATE() antes de listarlas
      await pool.query(`
        UPDATE membresias
        SET estado = 'Vencida'
        WHERE fecha_vencimiento < CURDATE()
          AND estado = 'Activa'
      `);

      // 1. Consulta de gestion de socios y estado de membresias
      const sociosQuery = `
        SELECT u.id, u.nombre, u.email, u.rol,
               COALESCE(m.tipo, 'Sin Membresia') AS membresia_tipo,
               COALESCE(m.estado, 'Inactiva') AS membresia_estado,
               COALESCE(DATE_FORMAT(m.fecha_vencimiento, '%d/%m/%Y'), 'No asignada') AS fecha_vencimiento
        FROM usuarios u
        LEFT JOIN (
          SELECT m1.*
          FROM membresias m1
          INNER JOIN (
            SELECT usuario_id, MAX(id) AS max_id
            FROM membresias
            GROUP BY usuario_id
          ) m2 ON m1.id = m2.max_id
        ) m ON u.id = m.usuario_id
        WHERE u.rol IN ('socio', 'entrenador')
        ORDER BY u.id ASC
      `;
      const [socios] = await pool.query(sociosQuery);

      // 2. Consulta de inventario de la tienda
      const inventarioQuery = `
        SELECT id, nombre, precio, categoria, stock, imagen_url
        FROM productos
        ORDER BY id ASC
      `;
      const [productos] = await pool.query(inventarioQuery);

      // Generar filas HTML para la tabla de Gestion de Socios
      let tablaSociosHtml = '';
      if (socios.length === 0) {
        tablaSociosHtml = `
          <tr>
            <td colspan="5" class="px-6 py-10 text-center text-zinc-500 text-sm">
              No hay socios ni entrenadores registrados en la base de datos actualmente.
            </td>
          </tr>
        `;
      } else {
        tablaSociosHtml = socios.map(socio => {
          const esActiva = socio.membresia_estado.toLowerCase() === 'activa';
          const badgeClass = esActiva
            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
            : 'bg-red-950 text-red-400 border-red-800';

          const sanitizedNombre = socio.nombre.replace(/'/g, "\\'");
          const esEntrenador = socio.rol === 'entrenador';
          const badgeRol = esEntrenador
            ? '<span class="ml-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-yellow-400 text-zinc-950 rounded-lg">Entrenador</span>'
            : '<span class="ml-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-lg">Socio</span>';

          return `
            <tr class="hover:bg-zinc-800/40 transition border-b border-zinc-800">
              <td class="px-6 py-4">
                <div class="font-bold text-white text-sm flex items-center">${socio.nombre} ${badgeRol}</div>
                <div class="text-xs text-zinc-400 font-mono">ID: #${socio.id}</div>
              </td>
              <td class="px-6 py-4 text-xs text-zinc-300 font-mono">${socio.email}</td>
              <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider border rounded-xl ${badgeClass}">
                  <span class="w-1.5 h-1.5 rounded-full ${esActiva ? 'bg-emerald-400' : 'bg-red-400'} mr-1.5"></span>
                  ${socio.membresia_estado} &bull; ${socio.membresia_tipo}
                </span>
              </td>
              <td class="px-6 py-4 text-xs text-zinc-300 font-mono">${socio.fecha_vencimiento}</td>
              <td class="px-6 py-4 text-right">
                <button
                  type="button"
                  onclick="abrirModalRenovacion(${socio.id}, '${sanitizedNombre}', '${socio.membresia_tipo}', '${socio.fecha_vencimiento}')"
                  class="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 hover:border-yellow-400 rounded-xl transition duration-150 active:scale-95"
                >
                  Renovar Membresia
                </button>
              </td>
            </tr>
          `;
        }).join('');
      }

      // Generar filas HTML para la tabla de Resumen de Inventario de la Tienda
      let tablaInventarioHtml = '';
      if (productos.length === 0) {
        tablaInventarioHtml = `
          <tr>
            <td colspan="6" class="px-6 py-10 text-center text-zinc-500 text-sm">
              No hay productos registrados en el inventario.
            </td>
          </tr>
        `;
      } else {
        tablaInventarioHtml = productos.map(prod => {
          let stockBadge = '';
          if (prod.stock > 20) {
            stockBadge = '<span class="inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-xl whitespace-nowrap">Stock Óptimo</span>';
          } else if (prod.stock > 0) {
            stockBadge = '<span class="inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-800 rounded-xl whitespace-nowrap">Bajo Stock</span>';
          } else {
            stockBadge = '<span class="inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-red-950 text-red-400 border border-red-800 rounded-xl whitespace-nowrap">Agotado</span>';
          }

          const precioFormatted = Number(prod.precio).toFixed(2);
          const imagenHtml = prod.imagen_url
            ? `<img src="${prod.imagen_url}" alt="${prod.nombre}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" class="w-10 h-10 object-cover rounded-lg border border-zinc-700 shrink-0 bg-zinc-950"><div style="display:none;" class="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 items-center justify-center text-zinc-500 shrink-0"><svg class="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>`
            : `<div class="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 shrink-0">
                <svg class="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>`;

          return `
            <tr class="hover:bg-zinc-800/40 transition border-b border-zinc-800">
              <td class="px-6 py-4">
                <div class="flex items-center space-x-3">
                  ${imagenHtml}
                  <div>
                    <div class="font-bold text-white text-sm">${prod.nombre}</div>
                    <div class="text-xs text-zinc-500 font-mono">SKU: IFG-PROD-${prod.id}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-xl whitespace-nowrap">
                  ${prod.categoria}
                </span>
              </td>
              <td class="px-6 py-4 text-xs font-mono font-bold text-yellow-400 whitespace-nowrap">
                S/ ${precioFormatted}
              </td>
              <td class="px-6 py-4 text-xs font-mono text-zinc-200 whitespace-nowrap">
                ${prod.stock} unidades
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                ${stockBadge}
              </td>
              <td class="px-6 py-4 text-right whitespace-nowrap">
                <button
                  type="button"
                  onclick="mostrarDetalleStock(${prod.id}, '${prod.nombre.replace(/'/g, "\\'")}', ${prod.stock}, '${precioFormatted}')"
                  class="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 hover:border-zinc-500 rounded-xl transition whitespace-nowrap"
                >
                  Gestionar Stock
                </button>
              </td>
            </tr>
          `;
        }).join('');
      }

      // Calculo de metricas generales para el dashboard
      const totalSocios = socios.length;
      const membresiasActivas = socios.filter(s => s.membresia_estado.toLowerCase() === 'activa').length;
      const totalProductos = productos.length;
      const totalUnidadesStock = productos.reduce((acc, p) => acc + Number(p.stock), 0);

      // Consultar pedidos pendientes de cobro
      const [pedidosPendientesRows] = await pool.query(
        "SELECT COUNT(*) AS total FROM pedidos WHERE estado = 'Pendiente' OR estado = 'Pendiente de Pago'"
      );
      const pedidosPendientes = pedidosPendientesRows[0]?.total || 0;

      // 3. Consulta de pedidos y tickets para recepcion y caja
      const pedidosQuery = `
        SELECT p.id, p.codigo_ticket, p.total, p.metodo_pago, p.estado,
               DATE_FORMAT(p.fecha_pedido, '%d/%m/%Y %H:%i') AS fecha,
               u.nombre AS socio_nombre
        FROM pedidos p
        JOIN usuarios u ON p.usuario_id = u.id
        ORDER BY p.id DESC
        LIMIT 15
      `;
      const [pedidos] = await pool.query(pedidosQuery);

      let tablaPedidosHtml = '';
      if (pedidos.length === 0) {
        tablaPedidosHtml = `
          <tr>
            <td colspan="7" class="px-6 py-10 text-center text-zinc-500 text-sm">
              No hay tickets de compra registrados en recepción actualmente.
            </td>
          </tr>
        `;
      } else {
        tablaPedidosHtml = pedidos.map(ped => {
          const esPagado = ped.estado === 'Pagado';
          const badgeClass = esPagado
            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
            : 'bg-amber-950 text-amber-300 border-amber-800';

          return `
            <tr id="fila-pedido-${ped.id}" class="fila-pedido-ticket hover:bg-zinc-800/40 transition border-b border-zinc-800" data-codigo="${ped.codigo_ticket.toLowerCase()}">
              <td class="px-6 py-4 font-mono font-extrabold text-yellow-400 text-sm whitespace-nowrap">
                ${ped.codigo_ticket}
                <button
                  type="button"
                  onclick="verDetalleProductos(${ped.id}, '${ped.codigo_ticket}', '${ped.socio_nombre.replace(/'/g, "\\'")}', '${Number(ped.total).toFixed(2)}', '${ped.estado}')"
                  class="text-xs font-mono text-zinc-300 hover:text-yellow-400 underline decoration-zinc-600 block mt-0.5"
                >
                  Ver artículos
                </button>
              </td>
              <td class="px-6 py-4 text-sm font-bold text-white whitespace-nowrap">
                ${ped.socio_nombre}
              </td>
              <td class="px-6 py-4 text-xs text-zinc-400 font-mono whitespace-nowrap">
                ${ped.fecha}
              </td>
              <td class="px-6 py-4 text-xs text-zinc-300 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-xl whitespace-nowrap">
                  ${ped.metodo_pago}
                </span>
              </td>
              <td class="px-6 py-4 font-mono font-bold text-white text-sm whitespace-nowrap">
                S/ ${Number(ped.total).toFixed(2)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span id="badge-pedido-${ped.id}" class="inline-flex items-center px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider border rounded-xl whitespace-nowrap ${badgeClass}">
                  <span class="w-1.5 h-1.5 rounded-full ${esPagado ? 'bg-emerald-400' : 'bg-amber-400'} mr-1.5 shrink-0"></span>
                  ${ped.estado}
                </span>
              </td>
              <td class="px-6 py-4 text-right whitespace-nowrap">
                <div id="accion-pedido-${ped.id}">
                  ${esPagado ? `
                    <span class="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono whitespace-nowrap">
                      Completado
                    </span>
                  ` : `
                    <button
                      type="button"
                      onclick="cobrarPedido(${ped.id})"
                      class="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider bg-yellow-400 hover:bg-yellow-300 text-zinc-950 rounded-xl transition duration-150 active:scale-95 shadow-md whitespace-nowrap"
                    >
                      Cobrar y Entregar
                    </button>
                  `}
                </div>
              </td>
            </tr>
          `;
        }).join('');
      }

      // Cargar plantilla HTML del panel de administracion
      const templatePath = path.join(__dirname, '..', 'views', 'admin-dashboard.html');
      let html = await fs.promises.readFile(templatePath, 'utf8');

      html = html
        .replace(/{{ADMIN_NAME}}/g, adminName)
        .replace(/{{ADMIN_EMAIL}}/g, adminEmail)
        .replace(/{{TOTAL_SOCIOS}}/g, String(totalSocios))
        .replace(/{{MEMBRESIAS_ACTIVAS}}/g, String(membresiasActivas))
        .replace(/{{TOTAL_PRODUCTOS}}/g, String(totalProductos))
        .replace(/{{TOTAL_UNIDADES_STOCK}}/g, String(totalUnidadesStock))
        .replace(/{{PEDIDOS_PENDIENTES}}/g, String(pedidosPendientes))
        .replace('{{TABLA_SOCIOS_HTML}}', tablaSociosHtml)
        .replace('{{TABLA_INVENTARIO_HTML}}', tablaInventarioHtml)
        .replace('{{TABLA_PEDIDOS_HTML}}', tablaPedidosHtml);

      return res.status(200).send(html);
    } catch (error) {
      console.error('Error al renderizar el dashboard de administrador en MySQL:', error.message);
      return res.status(500).send('Error interno al cargar el panel de administracion.');
    }
  },

  crearProducto: async (req, res) => {
    const { nombre, categoria, precio, stock } = req.body;

    const nombreLimpio = typeof nombre === 'string' ? nombre.trim() : '';
    const categoriaLimpia = typeof categoria === 'string' ? categoria.trim() : '';
    const precioNum = parseFloat(precio);
    const stockVal = Number(stock);

    // 1. Validacion de nombre: Minimo 3 caracteres, maximo 150
    if (!nombreLimpio || nombreLimpio.length < 3 || nombreLimpio.length > 150) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del producto debe contener entre 3 y 150 caracteres.'
      });
    }

    // 2. Lista blanca estricta de categorias
    const categoriasPermitidas = ['Suplementos', 'Accesorios', 'Bebidas', 'Equipamiento', 'Ropa Deportiva'];
    if (!categoriasPermitidas.includes(categoriaLimpia)) {
      return res.status(400).json({
        success: false,
        message: 'La categoría no es válida. Debe seleccionar una categoría oficial del gimnasio.'
      });
    }

    // 3. Validacion de precio: Estrictamente > 0 y < 10000, redondeado a 2 decimales
    if (isNaN(precioNum) || precioNum <= 0 || precioNum >= 10000) {
      return res.status(400).json({
        success: false,
        message: 'El precio debe ser un número estrictamente mayor a 0 y menor a S/ 10,000.'
      });
    }
    const precioRedondeado = Math.round(precioNum * 100) / 100;

    // 4. Validacion de stock: Entero >= 0 y < 50000
    if (isNaN(stockVal) || !Number.isInteger(stockVal) || stockVal < 0 || stockVal >= 50000) {
      return res.status(400).json({
        success: false,
        message: 'El stock inicial debe ser un número entero entre 0 y 49,999 unidades.'
      });
    }
    const stockNum = stockVal;

    try {
      // 5. Control estricto de duplicados en inventario
      const [dupRows] = await pool.query(
        'SELECT id FROM productos WHERE LOWER(TRIM(nombre)) = LOWER(?)',
        [nombreLimpio]
      );
      if (dupRows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un producto registrado con este nombre en el inventario.'
        });
      }

      const imagenUrl = req.file ? `/img/productos/${req.file.filename}` : null;

      const insertQuery = `
        INSERT INTO productos (nombre, precio, categoria, stock, imagen_url)
        VALUES (?, ?, ?, ?, ?)
      `;
      const [result] = await pool.query(insertQuery, [nombreLimpio, precioRedondeado, categoriaLimpia, stockNum, imagenUrl]);

      const nuevoProducto = {
        id: result.insertId,
        nombre: nombreLimpio,
        precio: precioRedondeado,
        categoria: categoriaLimpia,
        stock: stockNum,
        imagen_url: imagenUrl
      };

      return res.status(201).json({
        success: true,
        message: 'Producto registrado exitosamente en el inventario.',
        producto: nuevoProducto
      });
    } catch (error) {
      console.error('Error al registrar nuevo producto en MySQL:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error interno en el servidor al registrar el producto.'
      });
    }
  },

  registrarSocio: async (req, res) => {
    const { nombre, email, password, tipoMembresia, rol } = req.body;

    const cleanNombre = typeof nombre === 'string' ? nombre.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanPassword = typeof password === 'string' ? password : '';
    const cleanTipo = typeof tipoMembresia === 'string' ? tipoMembresia.trim() : '';
    const rawRol = typeof rol === 'string' ? rol.trim().toLowerCase() : '';

    // 1. Validacion de Nombre: Minimo 3 caracteres, maximo 100, no vacio ni solo espacios
    if (!cleanNombre || cleanNombre.length < 3 || cleanNombre.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'El nombre debe contener entre 3 y 100 caracteres.'
      });
    }

    // 2. Validacion de Correo Electronico con regex estricta
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico no tiene un formato válido.'
      });
    }

    // 3. Validacion de Contrasena: Minimo 6 caracteres, maximo 72 (limite de seguridad bcrypt)
    if (!cleanPassword || cleanPassword.length < 6 || cleanPassword.length > 72) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe contener entre 6 y 72 caracteres.'
      });
    }

    // 4. Lista blanca estricta de Roles: 'socio' o 'entrenador'
    const rolesPermitidos = ['socio', 'entrenador'];
    if (!rolesPermitidos.includes(rawRol)) {
      return res.status(400).json({
        success: false,
        message: 'Rol no válido. Debe seleccionar "socio" o "entrenador".'
      });
    }
    const targetRol = rawRol;

    // 5. Lista blanca estricta de Tipo de Membresia: 'Mensual' o 'Anual'
    const tiposPermitidos = ['Mensual', 'Anual'];
    if (targetRol === 'socio') {
      if (!tiposPermitidos.includes(cleanTipo)) {
        return res.status(400).json({
          success: false,
          message: 'El tipo de membresía debe ser "Mensual" o "Anual".'
        });
      }
    }

    try {
      // 6. Comprobacion estricta de duplicados
      const [checkUser] = await pool.query(
        'SELECT id FROM usuarios WHERE LOWER(email) = LOWER(?)',
        [cleanEmail]
      );
      if (checkUser.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'El correo electrónico ya se encuentra registrado por otro usuario.'
        });
      }

      // 7. Encriptar contraseña temporal con bcrypt
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(cleanPassword, saltRounds);

      // 8. Insertar nuevo usuario con el rol especificado
      const insertUserQuery = `
        INSERT INTO usuarios (nombre, email, password_hash, rol, peso, altura, edad, genero)
        VALUES (?, ?, ?, ?, 70.0, 170.0, 25, 'No especificado')
      `;
      const [userResult] = await pool.query(insertUserQuery, [cleanNombre, cleanEmail, passwordHash, targetRol]);
      const nuevoUsuarioId = userResult.insertId;

      // 9. Calcular fecha de vencimiento segun tipo de membresia (Mensual / Anual)
      const fechaVencimiento = new Date();
      let nombreTipo = 'Membresia Mensual Standard';
      if (targetRol === 'entrenador') {
        fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 2);
        nombreTipo = 'Staff / Entrenador Oficial';
      } else if (cleanTipo === 'Anual') {
        fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 1);
        nombreTipo = 'Membresia Anual VIP';
      } else {
        fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);
        nombreTipo = 'Membresia Mensual Standard';
      }

      const fechaVencimientoStr = fechaVencimiento.toISOString().split('T')[0];

      // 10. Registrar membresia activa en MySQL
      const insertMembresiaQuery = `
        INSERT INTO membresias (usuario_id, tipo, estado, fecha_vencimiento)
        VALUES (?, ?, 'Activa', ?)
      `;
      const [memResult] = await pool.query(insertMembresiaQuery, [
        nuevoUsuarioId,
        nombreTipo,
        fechaVencimientoStr
      ]);

      const [memRows] = await pool.query(
        'SELECT id, tipo, estado, DATE_FORMAT(fecha_vencimiento, "%d/%m/%Y") AS fecha_vencimiento FROM membresias WHERE id = ?',
        [memResult.insertId]
      );
      const nuevaMembresia = memRows[0];

      const mensaje = targetRol === 'entrenador'
        ? 'Alta de entrenador completada exitosamente con credenciales y acceso habilitado.'
        : 'Alta de socio completada exitosamente con membresia activa.';

      return res.status(201).json({
        success: true,
        message: mensaje,
        usuario: {
          id: nuevoUsuarioId,
          nombre: cleanNombre,
          email: cleanEmail,
          rol: targetRol,
          membresia: nuevaMembresia
        }
      });
    } catch (error) {
      console.error('Error al registrar nuevo usuario en MySQL:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error interno en el servidor al registrar el usuario.'
      });
    }
  },

  renovarMembresia: async (req, res) => {
    const { usuarioId, tipoMembresia } = req.body;

    if (!usuarioId) {
      return res.status(400).json({
        success: false,
        message: 'Debe especificar el identificador del usuario para la renovación.'
      });
    }

    const uid = parseInt(usuarioId, 10);
    const tipo = String(tipoMembresia || 'Mensual').trim();
    const esAnual = tipo.toLowerCase().includes('anual');
    const diasASumar = esAnual ? 365 : 30;
    const nombreTipo = esAnual ? 'Membresia Anual VIP' : 'Membresia Mensual Standard';

    try {
      // 1. Consultar la membresia mas reciente del usuario
      const [memRows] = await pool.query(
        'SELECT id, tipo, estado, fecha_vencimiento FROM membresias WHERE usuario_id = ? ORDER BY id DESC LIMIT 1',
        [uid]
      );

      let baseDate = new Date();
      if (memRows.length > 0 && memRows[0].fecha_vencimiento) {
        const fechaVenc = new Date(memRows[0].fecha_vencimiento);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        // Si la membresia seguia vigente a partir de hoy, sumamos a partir de ese vencimiento previo
        if (fechaVenc >= hoy) {
          baseDate = fechaVenc;
        }
      }

      baseDate.setDate(baseDate.getDate() + diasASumar);
      const nuevaFechaStr = baseDate.toISOString().split('T')[0];

      if (memRows.length > 0) {
        await pool.query(
          "UPDATE membresias SET tipo = ?, estado = 'Activa', fecha_vencimiento = ? WHERE id = ?",
          [nombreTipo, nuevaFechaStr, memRows[0].id]
        );
      } else {
        await pool.query(
          "INSERT INTO membresias (usuario_id, tipo, estado, fecha_vencimiento) VALUES (?, ?, 'Activa', ?)",
          [uid, nombreTipo, nuevaFechaStr]
        );
      }

      const [updatedRows] = await pool.query(
        'SELECT id, tipo, estado, DATE_FORMAT(fecha_vencimiento, "%d/%m/%Y") AS fecha_vencimiento FROM membresias WHERE usuario_id = ? ORDER BY id DESC LIMIT 1',
        [uid]
      );

      return res.status(200).json({
        success: true,
        message: `Membresía renovada exitosamente hasta el ${updatedRows[0].fecha_vencimiento}.`,
        membresia: updatedRows[0]
      });
    } catch (error) {
      console.error('Error al renovar membresia en MySQL:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error interno en el servidor al renovar la membresia.'
      });
    }
  },

  actualizarStock: async (req, res) => {
    const { productoId, nuevoStock } = req.body;

    if (!productoId) {
      return res.status(400).json({
        success: false,
        message: 'Debe especificar el identificador del producto.'
      });
    }

    const prodIdNum = parseInt(productoId, 10);
    if (isNaN(prodIdNum)) {
      return res.status(400).json({
        success: false,
        message: 'Identificador de producto no válido.'
      });
    }

    if (nuevoStock === undefined || nuevoStock === null || String(nuevoStock).trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Debe ingresar un valor numérico para el nuevo stock.'
      });
    }

    const stockVal = Number(nuevoStock);
    if (!Number.isInteger(stockVal) || stockVal < 0 || stockVal >= 50000) {
      return res.status(400).json({
        success: false,
        message: 'El nuevo stock debe ser un número entero mayor o igual a cero y menor a 50,000.'
      });
    }
    const stockNum = stockVal;

    try {
      const [result] = await pool.query(
        'UPDATE productos SET stock = ? WHERE id = ?',
        [stockNum, prodIdNum]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado en el catalogo.'
        });
      }

      const [prodRows] = await pool.query(
        'SELECT id, nombre, categoria, precio, stock FROM productos WHERE id = ?',
        [prodIdNum]
      );

      return res.status(200).json({
        success: true,
        message: `Stock de "${prodRows[0].nombre}" actualizado exitosamente a ${prodRows[0].stock} unidades.`,
        producto: prodRows[0]
      });
    } catch (error) {
      console.error('Error al actualizar stock en MySQL:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error interno en el servidor al actualizar el stock.'
      });
    }
  },

  cobrarPedido: async (req, res) => {
    const { pedidoId } = req.body;

    if (!pedidoId) {
      return res.status(400).json({
        success: false,
        message: 'Debe especificar el identificador del pedido.'
      });
    }

    const idNum = parseInt(pedidoId, 10);

    try {
      const [result] = await pool.query(
        "UPDATE pedidos SET estado = 'Pagado' WHERE id = ?",
        [idNum]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Ticket de pedido no encontrado en la base de datos.'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Pago registrado y pedido despachado correctamente.'
      });
    } catch (error) {
      console.error('Error al cobrar pedido en MySQL:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error interno en el servidor al registrar el cobro del pedido.'
      });
    }
  },

  obtenerDetallePedido: async (req, res) => {
    const pedidoId = parseInt(req.params.id, 10);
    if (!pedidoId || isNaN(pedidoId)) {
      return res.status(400).json({ success: false, message: 'Identificador de pedido inválido.' });
    }
    try {
      const [items] = await pool.query(`
        SELECT pd.cantidad, pd.precio_unitario, pd.subtotal,
               pr.nombre, pr.categoria, pr.imagen_url
        FROM pedidos_detalle pd
        JOIN productos pr ON pd.producto_id = pr.id
        WHERE pd.pedido_id = ?
      `, [pedidoId]);
      return res.status(200).json({ success: true, items });
    } catch (error) {
      console.error('Error al consultar productos del pedido en MySQL:', error.message);
      return res.status(500).json({ success: false, message: 'Error al consultar productos del pedido.' });
    }
  }
};

module.exports = adminController;
