const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Appointment = sequelize.define('Appointment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    appointmentNumber: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false,
      comment: 'Número único do agendamento (ex: AGD-20250925-001)'
    },
    
    // Dados do solicitante
    requesterName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Nome do solicitante'
    },
    requesterPhone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: 'Telefone do solicitante'
    },
    requesterEmail: {
      type: DataTypes.STRING(100),
      comment: 'Email do solicitante'
    },
    institution: {
      type: DataTypes.STRING(100),
      comment: 'Instituição/Hospital solicitante'
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
    patientPhone: {
      type: DataTypes.STRING(20),
      comment: 'Telefone do paciente'
    },
    
    // Tipo e finalidade do transporte
    appointmentType: {
      type: DataTypes.ENUM(
        'Consulta',           // Ida para consulta médica
        'Exame',             // Transporte para exames
        'Cirurgia',          // Transporte para cirurgia
        'Terapia',           // Sessões de terapia
        'Transferência',     // Entre hospitais
        'Alta hospitalar',   // Retorno para casa
        'Hemodiálise',       // Sessões de hemodiálise
        'Quimioterapia',     // Tratamento oncológico
        'Fisioterapia',      // Sessões de fisioterapia
        'Retorno',           // Consulta de retorno
        'Outros'             // Outros tipos
      ),
      allowNull: false,
      comment: 'Tipo de agendamento'
    },
    
    specialty: {
      type: DataTypes.STRING(100),
      comment: 'Especialidade médica (cardiologia, ortopedia, etc.)'
    },
    
    // Condição do paciente
    medicalCondition: {
      type: DataTypes.TEXT,
      comment: 'Condição médica do paciente'
    },
    mobility: {
      type: DataTypes.ENUM('Caminhando', 'Maca', 'Cadeira de rodas', 'Cadeirante', 'Suporte'),
      allowNull: false,
      defaultValue: 'Caminhando',
      comment: 'Condição de mobilidade'
    },
    requiresOxygen: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Necessita oxigênio'
    },
    requiresSpecialCare: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Necessita cuidados especiais'
    },
    specialCareNotes: {
      type: DataTypes.TEXT,
      comment: 'Detalhes dos cuidados especiais'
    },
    
    // Agendamento - Data e hora
    scheduledDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Data agendada'
    },
    scheduledTime: {
      type: DataTypes.TIME,
      allowNull: false,
      comment: 'Horário agendado'
    },
    estimatedDuration: {
      type: DataTypes.INTEGER,
      comment: 'Duração estimada em minutos'
    },
    
    // Recorrência (para tratamentos regulares)
    isRecurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'É um agendamento recorrente'
    },
    recurrenceType: {
      type: DataTypes.ENUM('Diário', 'Semanal', 'Quinzenal', 'Mensal'),
      comment: 'Tipo de recorrência'
    },
    recurrenceEnd: {
      type: DataTypes.DATE,
      comment: 'Data fim da recorrência'
    },
    parentAppointmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID do agendamento pai (para recorrências)'
    },
    
    // Localização origem
    originAddress: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Endereço de origem (casa do paciente)'
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
      comment: 'Pontos de referência'
    },
    originContact: {
      type: DataTypes.STRING(20),
      comment: 'Telefone no local de origem'
    },
    
    // Localização destino
    destinationAddress: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Endereço de destino (hospital/clínica)'
    },
    destinationLatitude: {
      type: DataTypes.DECIMAL(10, 8),
      comment: 'Latitude do destino'
    },
    destinationLongitude: {
      type: DataTypes.DECIMAL(11, 8),
      comment: 'Longitude do destino'
    },
    destinationContact: {
      type: DataTypes.STRING(20),
      comment: 'Telefone no destino'
    },
    
    // Tipo de transporte
    transportType: {
      type: DataTypes.ENUM('Só ida', 'Ida e volta', 'Só volta'),
      allowNull: false,
      defaultValue: 'Ida e volta',
      comment: 'Tipo de transporte necessário'
    },
    returnTime: {
      type: DataTypes.TIME,
      comment: 'Horário previsto para volta (se aplicável)'
    },
    
    // Status do agendamento
    status: {
      type: DataTypes.ENUM(
        'Solicitado',      // Solicitação recebida
        'Análise',         // Em análise pela equipe
        'Aprovado',        // Aprovado e confirmado
        'Agendado',        // Ambulância agendada
        'Confirmado',      // Confirmado com paciente
        'Em andamento',    // Transporte em execução
        'Finalizado',      // Concluído com sucesso
        'Cancelado',       // Cancelado
        'Reagendado',      // Reagendado para outra data
        'Não compareceu'   // Paciente não compareceu
      ),
      allowNull: false,
      defaultValue: 'Solicitado'
    },
    
    // Dados do operador
    operatorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID do operador que fez o agendamento'
    },
    
    // Relacionamentos
    rideId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID da corrida criada'
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
    
    // Observações e controle
    observations: {
      type: DataTypes.TEXT,
      comment: 'Observações gerais'
    },
    internalNotes: {
      type: DataTypes.TEXT,
      comment: 'Notas internas da equipe'
    },
    cancelReason: {
      type: DataTypes.TEXT,
      comment: 'Motivo do cancelamento'
    },
    
    // Dados de confirmação
    confirmedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Data/hora da confirmação'
    },
    confirmedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID do usuário que confirmou o agendamento'
    },
    
    // Dados de veículo e motorista
    vehicleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID do veículo designado'
    },
    driverId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID do motorista designado'
    },
    
    // Cancelamento
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Data/hora do cancelamento'
    },
    cancelledBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID do usuário que cancelou'
    },
    cancellationReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Motivo do cancelamento'
    },
    
    // Criação/Atualização
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID do usuário que criou'
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID do usuário que atualizou'
    },
    
    // Lembrete/notificação
    reminderSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Lembrete enviado'
    },
    reminderDate: {
      type: DataTypes.DATE,
      comment: 'Data do envio do lembrete'
    },
    
    // Prioridade (para casos especiais)
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
      defaultValue: 'normal',
      comment: 'Prioridade do agendamento'
    }
    
  }, {
    tableName: 'appointments',
    timestamps: true,
    indexes: [
      { fields: ['appointmentNumber'] },
      { fields: ['scheduledDate', 'scheduledTime'] },
      { fields: ['status'] },
      { fields: ['appointmentType'] },
      { fields: ['operatorId'] },
      { fields: ['patientDocument'] },
      { fields: ['isRecurring'] }
    ],
    comment: 'Agendamentos de transporte programado'
  });

  return Appointment;
};