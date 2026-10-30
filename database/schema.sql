-- ====================================================
-- Base de datos: gimnasio_db
-- Infinite Force Gym - Esquema Completo y Datos Iniciales
-- ====================================================

CREATE DATABASE IF NOT EXISTS `gimnasio_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `gimnasio_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- Estructura de tabla: asistencias
DROP TABLE IF EXISTS `asistencias`;
CREATE TABLE `asistencias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `fecha` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_asistencias_usuario` (`usuario_id`),
  CONSTRAINT `fk_asistencias_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Estructura de tabla: ejercicios
DROP TABLE IF EXISTS `ejercicios`;
CREATE TABLE `ejercicios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `grupo_muscular` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos de la tabla: ejercicios
INSERT INTO `ejercicios` (`id`, `nombre`, `grupo_muscular`) VALUES (1, 'Press de Banca Plano con Barra', 'Pectoral');
INSERT INTO `ejercicios` (`id`, `nombre`, `grupo_muscular`) VALUES (2, 'Sentadilla Trasera con Barra', 'Cuadriceps');
INSERT INTO `ejercicios` (`id`, `nombre`, `grupo_muscular`) VALUES (3, 'Peso Muerto Rumano', 'Isquiosurales');
INSERT INTO `ejercicios` (`id`, `nombre`, `grupo_muscular`) VALUES (4, 'Press Militar con Mancuernas', 'Deltoides');
INSERT INTO `ejercicios` (`id`, `nombre`, `grupo_muscular`) VALUES (5, 'Dominadas Pronas con Lastre', 'Dorsal');

-- Estructura de tabla: membresias
DROP TABLE IF EXISTS `membresias`;
CREATE TABLE `membresias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `tipo` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Activa',
  `fecha_vencimiento` date NOT NULL,
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_membresias_usuario` (`usuario_id`),
  CONSTRAINT `fk_membresias_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos de la tabla: membresias
INSERT INTO `membresias` (`id`, `usuario_id`, `tipo`, `estado`, `fecha_vencimiento`, `fecha_registro`) VALUES (4, 3, 'Membresia Mensual Standard', 'Activa', '2026-11-29 05:00:00', '2026-10-30 21:13:57');

-- Estructura de tabla: pedidos
DROP TABLE IF EXISTS `pedidos`;
CREATE TABLE `pedidos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo_ticket` varchar(25) COLLATE utf8mb4_unicode_ci NOT NULL,
  `usuario_id` int NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `metodo_pago` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Efectivo en Recepción',
  `estado` enum('Pendiente de Pago','Pagado','Cancelado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pendiente de Pago',
  `fecha_pedido` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo_ticket` (`codigo_ticket`),
  KEY `fk_pedidos_usuario` (`usuario_id`),
  CONSTRAINT `fk_pedidos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Estructura de tabla: pedidos_detalle
DROP TABLE IF EXISTS `pedidos_detalle`;
CREATE TABLE `pedidos_detalle` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pedido_id` int NOT NULL,
  `producto_id` int NOT NULL,
  `cantidad` int NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_detalle_pedido` (`pedido_id`),
  KEY `fk_detalle_producto` (`producto_id`),
  CONSTRAINT `fk_detalle_pedido` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_detalle_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Estructura de tabla: productos
DROP TABLE IF EXISTS `productos`;
CREATE TABLE `productos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoria` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `stock` int NOT NULL DEFAULT '0',
  `imagen_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos de la tabla: productos
INSERT INTO `productos` (`id`, `nombre`, `categoria`, `precio`, `stock`, `imagen_url`, `fecha_creacion`) VALUES (1, 'Proteina Whey Isolate 2kg - Vainilla Gourmet', 'Suplementos', 229.9, 22, '/img/productos/whey-protein.jpg', '2026-10-30 03:23:23');
INSERT INTO `productos` (`id`, `nombre`, `categoria`, `precio`, `stock`, `imagen_url`, `fecha_creacion`) VALUES (2, 'Creatina Monohidratada Creapure 300g Micronizada', 'Suplementos', 139.5, 20, '/img/productos/creatina.jpg', '2026-10-30 03:23:23');
INSERT INTO `productos` (`id`, `nombre`, `categoria`, `precio`, `stock`, `imagen_url`, `fecha_creacion`) VALUES (3, 'Pre-Entreno Nitro Blast 30 Servicios - Fruit Punch', 'Suplementos', 159, 10, '/img/productos/pre-entreno.jpg', '2026-10-30 03:23:23');
INSERT INTO `productos` (`id`, `nombre`, `categoria`, `precio`, `stock`, `imagen_url`, `fecha_creacion`) VALUES (4, 'Shaker Termico Acero Inoxidable 750ml Infinite Force', 'Accesorios', 49.9, 30, '/img/productos/shaker.jpg', '2026-10-30 03:23:23');
INSERT INTO `productos` (`id`, `nombre`, `categoria`, `precio`, `stock`, `imagen_url`, `fecha_creacion`) VALUES (5, 'Cinturon Lumbar de Cuero Powerlifting 10mm (Agotado)', 'Accesorios', 119, 20, '/img/productos/cinturon-cuero.jpg', '2026-10-30 03:23:23');
INSERT INTO `productos` (`id`, `nombre`, `categoria`, `precio`, `stock`, `imagen_url`, `fecha_creacion`) VALUES (6, 'Glutamina Micronizada 500g', 'Suplementos', 89.9, 12, '/img/productos/glutamina.jpg', '2026-10-30 03:31:25');

-- Estructura de tabla: rutinas
DROP TABLE IF EXISTS `rutinas`;
CREATE TABLE `rutinas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `frecuencia` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos de la tabla: rutinas
INSERT INTO `rutinas` (`id`, `nombre`, `tipo`, `frecuencia`) VALUES (1, 'Fuerza e Hipertrofia (PPL)', 'Hipertrofia', '4 dias por semana');

-- Estructura de tabla: rutinas_detalle
DROP TABLE IF EXISTS `rutinas_detalle`;
CREATE TABLE `rutinas_detalle` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rutina_id` int NOT NULL,
  `ejercicio_id` int NOT NULL,
  `series` int NOT NULL,
  `repeticiones` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_detalle_rutina` (`rutina_id`),
  KEY `fk_detalle_ejercicio` (`ejercicio_id`),
  CONSTRAINT `fk_detalle_ejercicio` FOREIGN KEY (`ejercicio_id`) REFERENCES `ejercicios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_detalle_rutina` FOREIGN KEY (`rutina_id`) REFERENCES `rutinas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos de la tabla: rutinas_detalle
INSERT INTO `rutinas_detalle` (`id`, `rutina_id`, `ejercicio_id`, `series`, `repeticiones`) VALUES (1, 1, 1, 4, '8 - 10 reps');
INSERT INTO `rutinas_detalle` (`id`, `rutina_id`, `ejercicio_id`, `series`, `repeticiones`) VALUES (2, 1, 2, 4, '6 - 8 reps');
INSERT INTO `rutinas_detalle` (`id`, `rutina_id`, `ejercicio_id`, `series`, `repeticiones`) VALUES (3, 1, 3, 3, '10 - 12 reps');
INSERT INTO `rutinas_detalle` (`id`, `rutina_id`, `ejercicio_id`, `series`, `repeticiones`) VALUES (4, 1, 4, 4, '10 - 12 reps');
INSERT INTO `rutinas_detalle` (`id`, `rutina_id`, `ejercicio_id`, `series`, `repeticiones`) VALUES (5, 1, 5, 3, 'Al fallo');

-- Estructura de tabla: solicitudes_rutina
DROP TABLE IF EXISTS `solicitudes_rutina`;
CREATE TABLE `solicitudes_rutina` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `objetivo` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dias_semana` int NOT NULL,
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `estado` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pendiente',
  `fecha_solicitud` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `rutina_id` int DEFAULT NULL,
  `observaciones_entrenador` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `fk_solicitudes_usuario` (`usuario_id`),
  KEY `fk_solicitudes_rutina_fk` (`rutina_id`),
  CONSTRAINT `fk_solicitudes_rutina_fk` FOREIGN KEY (`rutina_id`) REFERENCES `rutinas` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_solicitudes_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Estructura de tabla: usuarios
DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rol` enum('admin','entrenador','socio') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'socio',
  `peso` decimal(5,2) DEFAULT NULL,
  `altura` decimal(5,2) DEFAULT NULL,
  `edad` int DEFAULT NULL,
  `genero` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `rutina_activa_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_usuarios_rutina` (`rutina_activa_id`),
  CONSTRAINT `fk_usuarios_rutina` FOREIGN KEY (`rutina_activa_id`) REFERENCES `rutinas` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos de la tabla: usuarios
INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password_hash`, `rol`, `peso`, `altura`, `edad`, `genero`, `fecha_registro`, `rutina_activa_id`) VALUES (1, 'Administrador General', 'admin@infiniteforce.com', '$2b$10$Dvp3euzTnDV/TbFSdtTZIOHlsYGoKn1zbnqLgtCFtcazDkX1E0afG', 'admin', 80, 180, 32, 'Masculino', '2026-10-30 03:23:23', NULL);
INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password_hash`, `rol`, `peso`, `altura`, `edad`, `genero`, `fecha_registro`, `rutina_activa_id`) VALUES (2, 'Carlos Entrenador', 'entrenador@infiniteforce.com', '$2b$10$PIcqmNo5cwEJmZohCQ3aD.q3HAW8fyIr7wjj9nUDYZLD9pHNGIqGW', 'entrenador', 85.5, 182, 29, 'Masculino', '2026-10-30 03:23:23', NULL);
INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password_hash`, `rol`, `peso`, `altura`, `edad`, `genero`, `fecha_registro`, `rutina_activa_id`) VALUES (3, 'Alex Rivera', 'socio@infiniteforce.com', '$2b$10$j3F9OB23ac09cWradtxo.OSnLoZgfaMG9Lau42vy3Xj7P3I5zEpWu', 'socio', 74.5, 176, 26, 'Masculino', '2026-10-30 03:23:23', NULL);

SET FOREIGN_KEY_CHECKS = 1;
