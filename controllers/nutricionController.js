const path = require('path');
const fs = require('fs');
const { pool } = require('../database/config');

const nutricionController = {
  renderNutricionView: async (req, res) => {
    const userId = req.session.user.id;
    const userName = req.session.user.nombre;
    const userEmail = req.session.user.email;

    try {
      // Consultar datos biometricos actuales del socio para pre-llenar el formulario
      const bioQuery = `
        SELECT peso, altura, edad
        FROM Datos_Biometricos
        WHERE usuario_id = $1
        ORDER BY id DESC
        LIMIT 1
      `;
      const bioResult = await pool.query(bioQuery, [userId]);
      const bio = bioResult.rows[0] || {};
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
      console.error('Error al renderizar vista de nutricion:', error.message);
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
      // Verificar si ya existe registro biometrico del socio
      const checkQuery = 'SELECT id FROM Datos_Biometricos WHERE usuario_id = $1 ORDER BY id DESC LIMIT 1';
      const checkResult = await pool.query(checkQuery, [userId]);

      let record;
      if (checkResult.rows.length > 0) {
        const updateQuery = `
          UPDATE Datos_Biometricos
          SET peso = $1, altura = $2, edad = $3, fecha_registro = CURRENT_TIMESTAMP
          WHERE usuario_id = $4
          RETURNING id, usuario_id, peso, altura, edad, fecha_registro
        `;
        const updateResult = await pool.query(updateQuery, [pesoNum, alturaNum, edadNum, userId]);
        record = updateResult.rows[0];
      } else {
        const insertQuery = `
          INSERT INTO Datos_Biometricos (usuario_id, peso, altura, edad, lesiones)
          VALUES ($1, $2, $3, $4, 'Sin lesiones registradas')
          RETURNING id, usuario_id, peso, altura, edad, fecha_registro
        `;
        const insertResult = await pool.query(insertQuery, [userId, pesoNum, alturaNum, edadNum]);
        record = insertResult.rows[0];
      }

      return res.status(200).json({
        success: true,
        message: 'Datos biometricos actualizados correctamente en PostgreSQL.',
        biometria: record
      });
    } catch (error) {
      console.error('Error al actualizar datos biometricos del socio:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error interno al actualizar datos biometricos.'
      });
    }
  }
};

module.exports = nutricionController;
