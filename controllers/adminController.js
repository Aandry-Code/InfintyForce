const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const { pool } = require('../database/config');

const adminController = {
  renderAdminDashboard: async (req, res) => {
    const adminName = req.session.user.nombre;
    const adminEmail = req.session.user.email;

    try {
      // 1. Consulta de gestion de socios y estado de membresias
      const sociosQuery = `
        SELECT u.id, u.nombre, u.email,
               COALESCE(m.tipo, 'Sin Membresia') AS membresia_tipo,
               COALESCE(m.estado, 'Inactiva') AS membresia_estado,
               COALESCE(TO_CHAR(m.fecha_vencimiento, 'DD/MM/YYYY'), 'No asignada') AS fecha_vencimiento
        FROM Usuarios u
        LEFT JOIN LATERAL (
          SELECT tipo, estado, fecha_vencimiento
          FROM Membresias
          WHERE usuario_id = u.id
          ORDER BY id DESC
          LIMIT 1
        ) m ON true
        WHERE u.rol = 'socio'
        ORDER BY u.id ASC
      `;
      const sociosResult = await pool.query(sociosQuery);
      const socios = sociosResult.rows;

      // 2. Consulta de inventario de la tienda
      const inventarioQuery = `
        SELECT id, nombre, precio, categoria, stock
        FROM Productos
        ORDER BY id ASC
      `;
      const inventarioResult = await pool.query(inventarioQuery);
      const productos = inventarioResult.rows;

      // Generar filas HTML para la tabla de Gestion de Socios
      let tablaSociosHtml = '';
      if (socios.length === 0) {
        tablaSociosHtml = `
          <tr>
            <td colspan="5" class="px-6 py-10 text-center text-zinc-500 text-sm">
              No hay socios registrados en la base de datos actualmente.
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

          return `
            <tr class="hover:bg-zinc-900/60 transition border-b border-zinc-800/60">
              <td class="px-6 py-4">
                <div class="font-bold text-white text-sm">${socio.nombre}</div>
                <div class="text-xs text-zinc-400 font-mono">ID: #${socio.id}</div>
              </td>
              <td class="px-6 py-4 text-xs text-zinc-300 font-mono">${socio.email}</td>
              <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider border rounded-md ${badgeClass}">
                  <span class="w-1.5 h-1.5 rounded-full ${esActiva ? 'bg-emerald-400' : 'bg-red-400'} mr-1.5"></span>
                  ${socio.membresia_estado} &bull; ${socio.membresia_tipo}
                </span>
              </td>
              <td class="px-6 py-4 text-xs text-zinc-300 font-mono">${socio.fecha_vencimiento}</td>
              <td class="px-6 py-4 text-right">
                <button
                  type="button"
                  onclick="abrirModalRenovacion('${sanitizedNombre}', '${socio.membresia_tipo}', '${socio.fecha_vencimiento}')"
                  class="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 hover:border-brand-yellow rounded-lg transition duration-150 active:scale-95"
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
            stockBadge = '<span class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">Stock Optimo</span>';
          } else if (prod.stock > 0) {
            stockBadge = '<span class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-800 rounded">Bajo Stock</span>';
          } else {
            stockBadge = '<span class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-red-950 text-red-400 border border-red-800 rounded">Agotado</span>';
          }

          const precioFormatted = Number(prod.precio).toFixed(2);

          return `
            <tr class="hover:bg-zinc-900/60 transition border-b border-zinc-800/60">
              <td class="px-6 py-4">
                <div class="font-bold text-white text-sm">${prod.nombre}</div>
                <div class="text-xs text-zinc-500 font-mono">SKU: IFG-PROD-${prod.id}</div>
              </td>
              <td class="px-6 py-4">
                <span class="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-md">
                  ${prod.categoria}
                </span>
              </td>
              <td class="px-6 py-4 text-xs font-mono font-bold text-brand-yellow">
                S/ ${precioFormatted}
              </td>
              <td class="px-6 py-4 text-xs font-mono text-zinc-200">
                ${prod.stock} unidades
              </td>
              <td class="px-6 py-4">
                ${stockBadge}
              </td>
              <td class="px-6 py-4 text-right">
                <button
                  type="button"
                  onclick="mostrarDetalleStock('${prod.nombre.replace(/'/g, "\\'")}', ${prod.stock}, ${precioFormatted})"
                  class="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 hover:border-zinc-500 rounded-lg transition"
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
        .replace('{{TABLA_SOCIOS_HTML}}', tablaSociosHtml)
        .replace('{{TABLA_INVENTARIO_HTML}}', tablaInventarioHtml);

      return res.status(200).send(html);
    } catch (error) {
      console.error('Error al renderizar el dashboard de administrador:', error.message);
      return res.status(500).send('Error interno al cargar el panel de administracion.');
    }
  },

  crearProducto: async (req, res) => {
    const { nombre, categoria, precio, stock } = req.body;

    if (!nombre || !categoria || precio === undefined || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios: Nombre, Categoria, Precio y Stock inicial.'
      });
    }

    const nombreLimpio = String(nombre).trim();
    const categoriaLimpia = String(categoria).trim();
    const precioNum = parseFloat(precio);
    const stockNum = parseInt(stock, 10);

    if (!nombreLimpio || !categoriaLimpia) {
      return res.status(400).json({
        success: false,
        message: 'El nombre y la categoria no pueden estar vacios.'
      });
    }

    if (isNaN(precioNum) || precioNum < 0) {
      return res.status(400).json({
        success: false,
        message: 'El precio debe ser un numero valido mayor o igual a cero.'
      });
    }

    if (isNaN(stockNum) || stockNum < 0) {
      return res.status(400).json({
        success: false,
        message: 'El stock inicial debe ser un numero entero mayor o igual a cero.'
      });
    }

    try {
      const insertQuery = `
        INSERT INTO Productos (nombre, precio, categoria, stock)
        VALUES ($1, $2, $3, $4)
        RETURNING id, nombre, precio, categoria, stock
      `;
      const result = await pool.query(insertQuery, [nombreLimpio, precioNum, categoriaLimpia, stockNum]);
      const nuevoProducto = result.rows[0];

      return res.status(201).json({
        success: true,
        message: 'Producto registrado exitosamente en el inventario.',
        producto: nuevoProducto
      });
    } catch (error) {
      console.error('Error al registrar nuevo producto en PostgreSQL:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error interno en el servidor al registrar el producto.'
      });
    }
  },

  registrarSocio: async (req, res) => {
    const { nombre, email, password, tipoMembresia } = req.body;

    if (!nombre || !email || !password || !tipoMembresia) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios: Nombre, Email, Contraseña Temporal y Tipo de Membresía.'
      });
    }

    const cleanNombre = String(nombre).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password).trim();
    const cleanTipo = String(tipoMembresia).trim();

    if (cleanPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña temporal debe contener al menos 6 caracteres.'
      });
    }

    try {
      // 1. Validar unicidad del correo electronico
      const checkUser = await pool.query('SELECT id FROM Usuarios WHERE email = $1', [cleanEmail]);
      if (checkUser.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'El correo electronico ingresado ya se encuentra registrado en el sistema.'
        });
      }

      // 2. Encriptar contraseña temporal con bcrypt
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(cleanPassword, saltRounds);

      // 3. Insertar nuevo usuario con rol 'socio'
      const insertUserQuery = `
        INSERT INTO Usuarios (nombre, email, password_hash, rol)
        VALUES ($1, $2, $3, 'socio')
        RETURNING id, nombre, email, rol
      `;
      const userResult = await pool.query(insertUserQuery, [cleanNombre, cleanEmail, passwordHash]);
      const nuevoUsuario = userResult.rows[0];

      // 4. Calcular fecha de vencimiento segun tipo de membresia (Mensual / Anual)
      const fechaVencimiento = new Date();
      let nombreTipo = 'Membresia Mensual Standard';
      if (cleanTipo.toLowerCase().includes('anual')) {
        fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 1);
        nombreTipo = 'Membresia Anual VIP';
      } else {
        fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);
        nombreTipo = 'Membresia Mensual Standard';
      }

      const fechaVencimientoStr = fechaVencimiento.toISOString().split('T')[0];

      // 5. Registrar membresia activa en PostgreSQL
      const insertMembresiaQuery = `
        INSERT INTO Membresias (usuario_id, tipo, estado, fecha_vencimiento)
        VALUES ($1, $2, 'Activa', $3)
        RETURNING id, tipo, estado, TO_CHAR(fecha_vencimiento, 'DD/MM/YYYY') AS fecha_vencimiento
      `;
      const memResult = await pool.query(insertMembresiaQuery, [
        nuevoUsuario.id,
        nombreTipo,
        fechaVencimientoStr
      ]);
      const nuevaMembresia = memResult.rows[0];

      // 6. Registrar perfil biometrico inicial para la supervision del entrenador
      await pool.query(
        `INSERT INTO Datos_Biometricos (usuario_id, peso, altura, edad, lesiones)
         VALUES ($1, 70.0, 170.0, 25, 'Sin lesiones registradas')`,
        [nuevoUsuario.id]
      );

      return res.status(201).json({
        success: true,
        message: 'Alta de socio completada exitosamente con membresia activa.',
        socio: {
          id: nuevoUsuario.id,
          nombre: nuevoUsuario.nombre,
          email: nuevoUsuario.email,
          membresia: nuevaMembresia
        }
      });
    } catch (error) {
      console.error('Error al registrar nuevo socio en PostgreSQL:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error interno en el servidor al registrar el nuevo socio.'
      });
    }
  }
};

module.exports = adminController;
