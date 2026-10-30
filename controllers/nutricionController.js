const path = require('path');
const fs = require('fs');
const { pool } = require('../database/db');

const nutricionController = {
  renderNutricionView: async (req, res) => {
    const userId = req.session.user.id;
    const userName = req.session.user.nombre;
    const userEmail = req.session.user.email;

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
    const { peso, altura, edad } = req.body;

    const pesoNum = parseFloat(peso);
    const alturaNum = parseFloat(altura);
    const edadNum = edad ? parseInt(edad, 10) : 25;

    if (isNaN(pesoNum) || pesoNum <= 0 || isNaN(alturaNum) || alturaNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe ingresar valores numericos validos para peso y altura.'
      });
    }

    try {
      // Actualizar datos biometricos directamente en la tabla usuarios de MySQL
      const updateQuery = `
        UPDATE usuarios
        SET peso = ?, altura = ?, edad = ?
        WHERE id = ?
      `;
      await pool.query(updateQuery, [pesoNum, alturaNum, edadNum, userId]);

      const [updatedRows] = await pool.query(
        'SELECT id, nombre, email, peso, altura, edad, genero FROM usuarios WHERE id = ?',
        [userId]
      );
      const record = updatedRows[0];

      return res.status(200).json({
        success: true,
        message: 'Datos biometricos actualizados correctamente en MySQL.',
        biometria: record
      });
    } catch (error) {
      console.error('Error al actualizar datos biometricos del socio en MySQL:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error interno al actualizar datos biometricos.'
      });
    }
  }
};

module.exports = nutricionController;
