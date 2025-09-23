-- Criar usuário admin para o sistema de trafego
USE trafego;

-- Inserir usuário administrador com hash da senha 'admin123'
INSERT INTO users (
  name, 
  email, 
  password, 
  userType, 
  status,
  phone,
  cpf
) VALUES (
  'Administrador Sistema',
  'admin@admin.com',
  '$2a$10$Undyr2MvQpbI5hxiKxqTDeI65c5EO.Rb5llb13J0jOynIh1UV.nsi',
  'admin',
  'active',
  '(11) 99999-0000',
  '00000000000'
) ON DUPLICATE KEY UPDATE
  password = VALUES(password),
  userType = VALUES(userType),
  status = VALUES(status);