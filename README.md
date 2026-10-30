# Infinite Force Gym - Plataforma Web Corporativa

Sistema integral de gestion, entrenamiento y control de acceso para **Infinite Force Gym** desarrollado con Node.js, Express, MySQL (mysql2/promise), express-session, bcrypt y Tailwind CSS (via CDN).

---

## 1. Modulos del Sistema y Roles

La plataforma implementa una arquitectura basada en control de acceso por roles (RBAC) con tres perfiles diferenciados:

- **Panel de Administracion (`/admin-dashboard`)**:
  - **Gestion de Socios**: Supervision de padron de usuarios, estado de membresias (Activa/Inactiva), fechas de vencimiento y modulo de renovacion.
  - **Alta de Clientes**: Registro rapido de nuevos socios con membresia inicial asignada (Mensual o Anual) y hash criptografico con bcrypt.
  - **Gestion de Inventario**: Registro de nuevos articulos (nombre, categoria, precio y stock inicial) y catalogo de existencias.

- **Panel del Entrenador (`/entrenador-dashboard`)**:
  - **Evaluacion de Solicitudes de Rutina**: Visualizacion en tiempo real de peticiones de entrenamiento ingresadas por socios.
  - **JOIN Biometrico Antropometrico**: Evaluacion integral de peso corporal (kg), estatura (cm), edad y reporte de lesiones o restricciones medicas.
  - **Armado y Prescripcion de Planes**: Modal de asignacion y seleccion de programas de entrenamiento con pautas tecnicas personalizadas.
  - **Acceso a Perfil Personal**: Permisos extendidos para acceder a su propio dashboard, nutricion, rutinas y tienda.

- **Portal del Socio (`/socio-dashboard`)**:
  - **Control de Asistencias**: Marcacion de asistencia diaria validada por fecha en base de datos MySQL y contador mensual.
  - **Estado de Membresia**: Consulta en vivo de vigencia y plan contratado.
  - **Programa de Entrenamiento (`/rutinas`)**: Visualizacion de ejercicios asignados (series y repeticiones) y formulario para solicitar nuevas rutinas con objetivo deportivo.
  - **Calculadora Nutricional (`/nutricion`)**: Calculo de tasa metabolica basal y macronutrientes mediante la formula de Harris-Benedict, con sincronizacion automatica de peso y altura a la base de datos para la revision del entrenador.
  - **Tienda Oficial (`/tienda`)**: Catalogo de suplementos y productos que oculta dinamicamente los articulos sin stock (`stock > 0`) y gestion de carrito en localStorage.

---

## 2. Requisitos Previos

- **Node.js** (version 18 o superior)
- **MySQL** (version 8.0 o MariaDB equivalente)

---

## 3. Configuracion de Variables de Entorno

Crear o verificar el archivo `.env` en la raiz del proyecto:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=2347396607
DB_NAME=gimnasio_db
PORT=3000
SESSION_SECRET=infinite_force_gym_secure_session_key_2026
```

---

## 4. Inicializacion de la Base de Datos

La aplicacion incluye automatizacion total: al arrancar el servidor (`npm start`), se conecta a MySQL, genera la base de datos `gimnasio_db` si no existe, crea todas las tablas relacionales con sus claves foraneas y siembra los datos iniciales de prueba necesarios.

---

## 5. Credenciales de Evaluacion

| Rol | Correo Electronico | Contrasena | Dashboard de Acceso |
| :--- | :--- | :--- | :--- |
| **Administrador** | admin@infiniteforce.com | admin123 | `/admin-dashboard` |
| **Entrenador** | entrenador@infiniteforce.com | entrenador123 | `/entrenador-dashboard` |
| **Socio** | socio@infiniteforce.com | socio123 | `/socio-dashboard` |

---

## 6. Ejecucion del Proyecto

```bash
npm start
```

El servicio web iniciara en: `http://localhost:3000`
