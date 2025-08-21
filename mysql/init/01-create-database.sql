-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS excel_data CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE excel_data;

-- Crear tabla para almacenar los datos del Excel
CREATE TABLE IF NOT EXISTS excel_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    data TEXT NOT NULL,
    processed_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at),
    INDEX idx_file_name (file_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla para almacenar licitaciones
CREATE TABLE IF NOT EXISTS licitaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_licitacion VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(500) NOT NULL,
    fecha_publicacion DATETIME NOT NULL,
    fecha_cierre DATETIME NOT NULL,
    organismo VARCHAR(300) NOT NULL,
    unidad VARCHAR(200) NOT NULL,
    monto_disponible DECIMAL(15,2) NOT NULL,
    moneda VARCHAR(10) NOT NULL,
    estado VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME NOT NULL,
    INDEX idx_id_licitacion (id_licitacion),
    INDEX idx_fecha_publicacion (fecha_publicacion),
    INDEX idx_estado (estado),
    INDEX idx_organismo (organismo),
    INDEX idx_monto_disponible (monto_disponible)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear usuario específico para la aplicación (opcional)
CREATE USER IF NOT EXISTS 'excel_user'@'%' IDENTIFIED BY 'excel_password';
GRANT ALL PRIVILEGES ON excel_data.* TO 'excel_user'@'%';
FLUSH PRIVILEGES;
