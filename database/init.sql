-- Sistema de Transporte de Ambulâncias
-- Script de inicialização do banco MariaDB

-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS `ambulancia_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `ambulancia_db`;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL UNIQUE,
  `phone` varchar(20),
  `password` varchar(255) NOT NULL,
  `role` enum('admin','supervisor','operator','driver') NOT NULL DEFAULT 'operator',
  `status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',
  `position` varchar(255),
  `license_number` varchar(50),
  `license_category` varchar(10),
  `license_expiry` date,
  `total_rides` int(11) DEFAULT 0,
  `avg_rating` decimal(3,2) DEFAULT 0.00,
  `last_login` timestamp NULL DEFAULT NULL,
  `password_changed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_email` (`email`),
  KEY `idx_role` (`role`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de veículos
CREATE TABLE IF NOT EXISTS `vehicles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `plate` varchar(20) NOT NULL UNIQUE,
  `model` varchar(255) NOT NULL,
  `year` int(4) NOT NULL,
  `type` enum('ambulancia_basica','ambulancia_utx','ambulancia_resgate') NOT NULL,
  `status` enum('available','in_use','maintenance','unavailable') NOT NULL DEFAULT 'available',
  `fuel_level` int(3) DEFAULT 100,
  `mileage` int(11) DEFAULT 0,
  `last_maintenance` date,
  `next_maintenance` date,
  `current_driver_id` int(11) DEFAULT NULL,
  `gps_latitude` decimal(10,8),
  `gps_longitude` decimal(11,8),
  `gps_updated_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_plate` (`plate`),
  KEY `idx_status` (`status`),
  KEY `idx_type` (`type`),
  KEY `fk_vehicle_driver` (`current_driver_id`),
  CONSTRAINT `fk_vehicle_driver` FOREIGN KEY (`current_driver_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de corridas
CREATE TABLE IF NOT EXISTS `rides` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ride_number` varchar(50) NOT NULL UNIQUE,
  `patient_name` varchar(255) NOT NULL,
  `patient_phone` varchar(20),
  `origin_address` text NOT NULL,
  `origin_lat` decimal(10,8),
  `origin_lng` decimal(11,8),
  `destination_address` text NOT NULL,
  `destination_lat` decimal(10,8),
  `destination_lng` decimal(11,8),
  `status` enum('pending','assigned','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
  `priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  `vehicle_id` int(11) DEFAULT NULL,
  `driver_id` int(11) DEFAULT NULL,
  `operator_id` int(11) NOT NULL,
  `notes` text,
  `cancel_reason` text,
  `estimated_duration` int(11),
  `actual_duration` int(11),
  `distance` decimal(8,2),
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_ride_number` (`ride_number`),
  KEY `idx_status` (`status`),
  KEY `idx_priority` (`priority`),
  KEY `fk_ride_vehicle` (`vehicle_id`),
  KEY `fk_ride_driver` (`driver_id`),
  KEY `fk_ride_operator` (`operator_id`),
  CONSTRAINT `fk_ride_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ride_driver` FOREIGN KEY (`driver_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ride_operator` FOREIGN KEY (`operator_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de localizações (histórico GPS)
CREATE TABLE IF NOT EXISTS `locations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `entity_type` enum('vehicle','user','ride') NOT NULL,
  `entity_id` int(11) NOT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `speed` decimal(5,2) DEFAULT 0.00,
  `heading` decimal(5,2) DEFAULT 0.00,
  `accuracy` decimal(6,2) DEFAULT 0.00,
  `address` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_entity` (`entity_type`, `entity_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de mensagens
CREATE TABLE IF NOT EXISTS `messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ride_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `message_type` enum('text','system','audio','image') NOT NULL DEFAULT 'text',
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_message_ride` (`ride_id`),
  KEY `fk_message_sender` (`sender_id`),
  KEY `idx_is_read` (`is_read`),
  CONSTRAINT `fk_message_ride` FOREIGN KEY (`ride_id`) REFERENCES `rides` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_message_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('info','success','warning','error') NOT NULL DEFAULT 'info',
  `entity_type` enum('ride','vehicle','user','system') DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_notification_user` (`user_id`),
  KEY `idx_is_read` (`is_read`),
  KEY `idx_type` (`type`),
  CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir usuário administrador padrão
INSERT INTO `users` (`name`, `email`, `password`, `role`, `position`) VALUES
('Administrador Sistema', 'admin@saude.gov.br', '$2b$10$rOz9QqVrXJjJx7CsQ1FdG.f4N4v.BXoF6tN6dYjXoKN.QYVfFjQOi', 'admin', 'Administrador do Sistema');

-- Inserir dados de exemplo
INSERT INTO `users` (`name`, `email`, `password`, `role`, `position`, `phone`) VALUES
('Maria Operadora', 'maria.operadora@saude.gov.br', '$2b$10$rOz9QqVrXJjJx7CsQ1FdG.f4N4v.BXoF6tN6dYjXoKN.QYVfFjQOi', 'operator', 'Operadora Central', '(11) 99999-1111'),
('João Supervisor', 'joao.supervisor@saude.gov.br', '$2b$10$rOz9QqVrXJjJx7CsQ1FdG.f4N4v.BXoF6tN6dYjXoKN.QYVfFjQOi', 'supervisor', 'Supervisor Geral', '(11) 99999-2222'),
('Pedro Motorista', 'pedro.motorista@saude.gov.br', '$2b$10$rOz9QqVrXJjJx7CsQ1FdG.f4N4v.BXoF6tN6dYjXoKN.QYVfFjQOi', 'driver', 'Motorista Ambulância', '(11) 99999-3333');

INSERT INTO `vehicles` (`plate`, `model`, `year`, `type`, `fuel_level`, `mileage`, `last_maintenance`, `next_maintenance`) VALUES
('AMB-001', 'Mercedes Sprinter', 2022, 'ambulancia_basica', 85, 45230, '2024-01-15', '2024-04-15'),
('AMB-002', 'Fiat Ducato', 2021, 'ambulancia_utx', 62, 67840, '2023-12-20', '2024-03-20'),
('AMB-003', 'Renault Master', 2020, 'ambulancia_basica', 95, 89125, '2024-01-10', '2024-04-10');

-- Criar índices adicionais para performance
CREATE INDEX idx_rides_created_at ON rides(created_at);
CREATE INDEX idx_locations_coordinates ON locations(latitude, longitude);
CREATE INDEX idx_vehicles_gps ON vehicles(gps_latitude, gps_longitude);

COMMIT;