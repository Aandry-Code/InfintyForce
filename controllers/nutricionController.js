const path = require('path');
const fs = require('fs');
const { pool } = require('../database/db');

const nutricionController = {
  renderNutricionView: async (req, res) => {
    const userId = req.session.user.id;
    const userName = req.session.user.nombre;
    const userEmail = req.session.user.email;
    const userRole = req.session.user.rol;

    const volverEntrenadorHtml = userRole === 'entrenador'
      ? '<a href="/entrenador-dashboard" class="bg-yellow-400 text-zinc-950 font-bold px-4 py-2 rounded-lg hover:bg-yellow-300 transition-all text-xs uppercase tracking-wider shadow-md inline-flex items-center">PANEL ENTRENADOR</a>'
      : '';

    try {
      // Consultar datos biometricos actuales del socio directamente de la tabla usuarios
      const bioQuery = 'SELECT peso, altura, edad, genero FROM usuarios WHERE id = ?';
      const [rows] = await pool.query(bioQuery, [userId]);
      const bio = rows[0] || {};

      const userPeso = bio.peso ? String(parseFloat(bio.peso)) : '';
      const userAltura = bio.altura ? String(parseFloat(bio.altura)) : '';
      const userEdad = bio.edad ? String(bio.edad) : '';

      const templatePath = path.join(__dirname, '..', 'views', 'nutricion.html');
      let html = await fs.promises.readFile(templatePath, 'utf8');

      html = html
        .replace(/{{USER_NAME}}/g, userName)
        .replace(/{{USER_EMAIL}}/g, userEmail)
        .replace('{{VOLVER_PANEL_ENTRENADOR_HTML}}', volverEntrenadorHtml)
        .replace(/{{USER_PESO}}/g, userPeso)
        .replace(/{{USER_ALTURA}}/g, userAltura)
        .replace(/{{USER_EDAD}}/g, userEdad);

      return res.status(200).send(html);
    } catch (error) {
      console.error('Error al renderizar vista de nutricion en MySQL:', error.message);
      return res.status(500).send('Error interno al cargar el modulo de nutricion.');
    }
  },

  actualizarBiometria: async (req, res) => {
    const userId = req.session.user.id;
    const { peso, altura, edad, genero } = req.body;

    const pesoNum = parseFloat(peso);
    const alturaNum = parseFloat(altura);
    const edadVal = Number(edad);

    // 1. Validacion de Peso: 30.0 kg a 250.0 kg
    if (isNaN(pesoNum) || pesoNum < 30.0 || pesoNum > 250.0) {
      return res.status(400).json({
        success: false,
        message: 'El peso debe estar en un rango realista entre 30.0 kg y 250.0 kg.'
      });
    }

    // 2. Validacion de Altura: 100.0 cm a 240.0 cm
    if (isNaN(alturaNum) || alturaNum < 100.0 || alturaNum > 240.0) {
      return res.status(400).json({
        success: false,
        message: 'La altura debe estar en un rango realista entre 100.0 cm y 240.0 cm.'
      });
    }

    // 3. Validacion de Edad: 14 a 99 anos
    if (isNaN(edadVal) || !Number.isInteger(edadVal) || edadVal < 14 || edadVal > 99) {
      return res.status(400).json({
        success: false,
        message: 'La edad debe estar en un rango realista entre 14 y 99 años.'
      });
    }
    const edadNum = edadVal;

    // 4. Lista blanca estricta de Genero: 'Masculino' o 'Femenino'
    const generosPermitidos = ['Masculino', 'Femenino'];
    const cleanGenero = typeof genero === 'string' ? genero.trim() : '';
    if (!generosPermitidos.includes(cleanGenero)) {
      return res.status(400).json({
        success: false,
        message: 'El género biológico no es válido. Debe ser "Masculino" o "Femenino".'
      });
    }

    try {
      // Actualizar datos biometricos directamente en la tabla usuarios de MySQL
      const updateQuery = `
        UPDATE usuarios
        SET peso = ?, altura = ?, edad = ?, genero = ?
        WHERE id = ?
      `;
      await pool.query(updateQuery, [pesoNum, alturaNum, edadNum, cleanGenero, userId]);

      const [updatedRows] = await pool.query(
        'SELECT id, nombre, email, peso, altura, edad, genero FROM usuarios WHERE id = ?',
        [userId]
      );
      const record = updatedRows[0];

      return res.status(200).json({
        success: true,
        message: 'Datos biométricos actualizados correctamente en MySQL.',
        biometria: record
      });
    } catch (error) {
      console.error('Error al actualizar datos biometricos del socio en MySQL:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error interno al actualizar datos biométricos.'
      });
    }
  }
};

module.exports = nutricionController;
