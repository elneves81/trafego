const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Attendance = sequelize.define('Attendance', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    attendanceNumber: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false,
      comment: 'Número único do atendimento (ex: ATD-20250925-001)'
    },
    // Dados da chamada
    callDateTime: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Data/hora da chamada recebida'
    },
    callerName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Nome de quem está ligando'
    },
    callerPhone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: 'Telefone de quem está ligando'
    },
    callerCpf: {
      type: DataTypes.STRING(20),
      comment: 'CPF do solicitante'
    },
    relationship: {
      type: DataTypes.STRING(50),
      comment: 'Relação com o paciente (próprio, familiar, terceiro)'
    },
    
    // Campos de endereço básicos
    address: {
      type: DataTypes.TEXT,
      comment: 'Endereço completo'
    },
    city: {
      type: DataTypes.STRING(100),
      comment: 'Cidade'
    },
    state: {
      type: DataTypes.STRING(10),
      comment: 'Estado (UF)'
    },
    cep: {
      type: DataTypes.STRING(20),
      comment: 'CEP'
    },
    
    // Dados do paciente
    patientName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Nome completo do paciente'
    },
    patientDocument: {
      type: DataTypes.STRING(20),
      comment: 'CPF ou RG do paciente'
    },
    patientCpf: {
      type: DataTypes.STRING(20),
      comment: 'CPF do paciente'
    },
    patientPhone: {
      type: DataTypes.STRING(20),
      comment: 'Telefone do paciente'
    },
    patientAge: {
      type: DataTypes.INTEGER,
      comment: 'Idade do paciente'
    },
    patientGender: {
      type: DataTypes.ENUM('M', 'F', 'Outro'),
      comment: 'Sexo do paciente'
    },
    patientWeight: {
      type: DataTypes.DECIMAL(5, 2),
      comment: 'Peso do paciente em kg'
    },
    
    // Condição médica
    medicalCondition: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Descrição da condição médica/sintomas'
    },
    consciousness: {
      type: DataTypes.ENUM('Consciente', 'Inconsciente', 'Confuso', 'Agitado'),
      comment: 'Estado de consciência'
    },
    breathing: {
      type: DataTypes.ENUM('Normal', 'Dificuldade', 'Parou', 'Artificial'),
      comment: 'Situação respiratória'
    },
    bleeding: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Presença de sangramento'
    },
    mobility: {
      type: DataTypes.ENUM('Caminhando', 'Maca', 'Cadeira de rodas', 'Carregado'),
      comment: 'Condição de mobilidade'
    },
    
    // Prioridade e classificação
    priority: {
      type: DataTypes.ENUM('Baixa', 'Média', 'Alta', 'Crítica'),
      allowNull: false,
      defaultValue: 'Média',
      comment: 'Prioridade do atendimento'
    },
    attendanceType: {
      type: DataTypes.ENUM('emergency', 'consultation', 'transport', 'exam', 'other'),
      defaultValue: 'other',
      comment: 'Tipo de atendimento solicitado'
    },
    urgencyCode: {
      type: DataTypes.ENUM('Verde', 'Amarelo', 'Laranja', 'Vermelho'),
      comment: 'Código de urgência por cores'
    },
    
    // Localização origem
    originAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Endereço completo de origem'
    },
    originLatitude: {
      type: DataTypes.DECIMAL(10, 8),
      comment: 'Latitude da origem'
    },
    originLongitude: {
      type: DataTypes.DECIMAL(11, 8),
      comment: 'Longitude da origem'
    },
    originReference: {
      type: DataTypes.TEXT,
      comment: 'Pontos de referência do local'
    },
    originContact: {
      type: DataTypes.STRING(20),
      comment: 'Telefone de contato no local'
    },
    
    // Localização destino
    destinationAddress: {
      type: DataTypes.TEXT,
      comment: 'Endereço do hospital/destino'
    },
    destinationLatitude: {
      type: DataTypes.DECIMAL(10, 8),
      comment: 'Latitude do destino'
    },
    destinationLongitude: {
      type: DataTypes.DECIMAL(11, 8),
      comment: 'Longitude do destino'
    },
    preferredHospital: {
      type: DataTypes.STRING(100),
      comment: 'Hospital preferido pelo paciente'
    },
    
    // Status do atendimento
    status: {
      type: DataTypes.ENUM(
        'Recebida',        // Chamada recebida
        'Triagem',         // Em processo de triagem
        'Aprovada',        // Aprovada para despacho
        'Despachada',      // Enviada para criar corrida
        'Em andamento',    // Corrida em andamento  
        'Finalizada',      // Atendimento concluído
        'Cancelada',       // Cancelada
        'Negada'          // Negada por critérios
      ),
      allowNull: false,
      defaultValue: 'Recebida'
    },
    
    // Dados do atendente
    operatorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID do operador que recebeu a chamada'
    },
    supervisorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID do supervisor que aprovou (se necessário)'
    },
    
    // Relacionamentos
    rideId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID da corrida criada (se aprovada)'
    },
    
    // Observações e controle
    observations: {
      type: DataTypes.TEXT,
      comment: 'Observações gerais do atendimento'
    },
    cancelReason: {
      type: DataTypes.TEXT,
      comment: 'Motivo do cancelamento/negação'
    },
    
    // Tempos de controle
    responseTime: {
      type: DataTypes.INTEGER,
      comment: 'Tempo de resposta em segundos'
    },
    dispatchTime: {
      type: DataTypes.DATE,
      comment: 'Momento do despacho da ambulância'
    },
    completedAt: {
      type: DataTypes.DATE,
      comment: 'Momento da finalização'
    },
    
    // Informações adicionais
    requiresSpecialEquipment: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Necessita equipamento especial'
    },
    specialEquipmentNotes: {
      type: DataTypes.TEXT,
      comment: 'Detalhes sobre equipamentos especiais'
    },
    
    // Acompanhantes
    companionCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Número de acompanhantes'
    },
    companionNotes: {
      type: DataTypes.TEXT,
      comment: 'Observações sobre acompanhantes'
    },
    
    // Categoria do atendimento
    category: {
      type: DataTypes.ENUM('emergency', 'basic', 'scheduled'),
      defaultValue: 'emergency',
      comment: 'Categoria do atendimento (emergência, básico, agendado)'
    }
  }, {
    tableName: 'attendances',
    timestamps: true,
    indexes: [
      { fields: ['attendanceNumber'] },
      { fields: ['callDateTime'] },
      { fields: ['status'] },
      { fields: ['priority'] },
      { fields: ['operatorId'] },
      { fields: ['patientDocument'] }
    ],
    comment: 'Registro de atendimentos de emergência recebidos pela central'
  });

  return Attendance;
};