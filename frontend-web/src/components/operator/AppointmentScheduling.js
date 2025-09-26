import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider,
  IconButton,
  Chip,
  Switch
} from '@mui/material';
import {
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  LocalHospital as HospitalIcon,
  Save as SaveIcon,
  Clear as ClearIcon,
  Event as EventIcon,
  Repeat as RepeatIcon,
  DirectionsCar as TransportIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import CepSearch from '../Common/CepSearch';

const AppointmentScheduling = () => {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    // Dados do solicitante
    requesterName: '',
    requesterPhone: '',
    requesterEmail: '',
    requesterRelationship: '',
    
    // Dados do paciente
    patientName: '',
    patientCpf: '',
    patientRg: '',
    patientBirthDate: '',
    patientGender: '',
    patientPhone: '',
    patientAddress: '',
    patientCity: '',
    patientState: '',
    patientZipCode: '',
    patientNeighborhood: '',
    
    // Dados do agendamento
    appointmentType: '',
    transportType: '',
    scheduledDate: '',
    scheduledTime: '',
    estimatedDuration: 60,
    destinationName: '',
    destinationAddress: '',
    destinationCity: '',
    destinationState: '',
    destinationZipCode: '',
    destinationNeighborhood: '',
    destinationContact: '',
    
    // Dados médicos
    medicalSpecialty: '',
    doctorName: '',
    examType: '',
    treatmentType: '',
    medicalObservations: '',
    specialNeeds: '',
    mobilityRestrictions: '',
    oxygenRequired: false,
    accompaniedByFamily: false,
    
    // Recorrência
    isRecurring: false,
    recurrencePattern: '',
    recurrenceInterval: 1,
    recurrenceEndDate: '',
    maxOccurrences: '',
    
    // Outros
    observations: '',
    priority: 'normal'
  });

  const steps = [
    'Solicitante',
    'Paciente',
    'Agendamento',
    'Localização',
    'Médico/Observações'
  ];

  const relationshipOptions = [
    { value: 'self', label: 'O próprio paciente' },
    { value: 'parent', label: 'Pai/Mãe' },
    { value: 'child', label: 'Filho(a)' },
    { value: 'spouse', label: 'Cônjuge' },
    { value: 'sibling', label: 'Irmão/Irmã' },
    { value: 'relative', label: 'Outro familiar' },
    { value: 'friend', label: 'Amigo' },
    { value: 'caregiver', label: 'Cuidador' },
    { value: 'other', label: 'Outros' }
  ];

  const appointmentTypeOptions = [
    { value: 'consultation', label: 'Consulta' },
    { value: 'exam', label: 'Exame' },
    { value: 'treatment', label: 'Tratamento' },
    { value: 'surgery', label: 'Cirurgia' },
    { value: 'therapy', label: 'Terapia' },
    { value: 'vaccine', label: 'Vacinação' },
    { value: 'emergency', label: 'Emergência' },
    { value: 'return', label: 'Retorno' },
    { value: 'other', label: 'Outros' }
  ];

  const transportTypeOptions = [
    { value: 'basic', label: 'Básico - Ambulância simples' },
    { value: 'advanced', label: 'Avançado - UTI móvel' },
    { value: 'uti_mobile', label: 'UTI Móvel' },
    { value: 'wheelchair', label: 'Cadeira de rodas' },
    { value: 'stretcher', label: 'Maca simples' }
  ];

  const recurrencePatternOptions = [
    { value: 'daily', label: 'Diário' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'monthly', label: 'Mensal' },
    { value: 'yearly', label: 'Anual' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Baixa', color: 'success' },
    { value: 'normal', label: 'Normal', color: 'info' },
    { value: 'high', label: 'Alta', color: 'warning' },
    { value: 'urgent', label: 'Urgente', color: 'error' }
  ];

  // Função para converter campos de texto para maiúsculas
  const toUpperCaseFields = [
    'requesterName', 'requesterEmail', 'requesterRelationship', 'patientName', 
    'patientAddress', 'patientCity', 'patientState', 'patientNeighborhood',
    'specialRequirements', 'observations', 'destinationAddress', 'destinationContact'
  ];

  const handleInputChange = (field, value) => {
    // Converter para maiúsculas se for um campo de texto
    const finalValue = toUpperCaseFields.includes(field) ? value.toUpperCase() : value;
    setFormData(prev => ({
      ...prev,
      [field]: finalValue
    }));
    setError('');
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const validateStep = (step) => {
    setError('');
    
    switch (step) {
      case 0: // Solicitante
        if (!formData.requesterName.trim()) {
          setError('Nome do solicitante é obrigatório');
          return false;
        }
        if (!formData.requesterPhone.trim()) {
          setError('Telefone do solicitante é obrigatório');
          return false;
        }
        if (!formData.requesterRelationship) {
          setError('Parentesco/relação é obrigatório');
          return false;
        }
        break;
        
      case 1: // Paciente
        if (!formData.patientName.trim()) {
          setError('Nome do paciente é obrigatório');
          return false;
        }
        if (!formData.patientBirthDate) {
          setError('Data de nascimento é obrigatória');
          return false;
        }
        if (!formData.patientGender) {
          setError('Sexo do paciente é obrigatório');
          return false;
        }
        if (!formData.patientAddress.trim()) {
          setError('Endereço do paciente é obrigatório');
          return false;
        }
        break;
        
      case 2: // Agendamento
        if (!formData.appointmentType) {
          setError('Tipo de agendamento é obrigatório');
          return false;
        }
        if (!formData.transportType) {
          setError('Tipo de transporte é obrigatório');
          return false;
        }
        if (!formData.scheduledDate) {
          setError('Data do agendamento é obrigatória');
          return false;
        }
        if (!formData.scheduledTime) {
          setError('Horário do agendamento é obrigatório');
          return false;
        }
        // Validar se a data é futura
        const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
        if (scheduledDateTime <= new Date()) {
          setError('Data e horário devem ser futuros');
          return false;
        }
        break;
        
      case 3: // Localização
        if (!formData.destinationName.trim()) {
          setError('Nome do destino é obrigatório');
          return false;
        }
        if (!formData.destinationAddress.trim()) {
          setError('Endereço do destino é obrigatório');
          return false;
        }
        break;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/appointments', formData);

      if (response.data.success) {
        setSuccess(`Agendamento criado com sucesso! Número: ${response.data.appointment.appointmentNumber}`);
        // Reset form after success
        setTimeout(() => {
          setFormData({
            requesterName: '',
            requesterPhone: '',
            requesterEmail: '',
            requesterRelationship: '',
            patientName: '',
            patientCpf: '',
            patientRg: '',
            patientBirthDate: '',
            patientGender: '',
            patientPhone: '',
            patientAddress: '',
            patientCity: '',
            patientState: '',
            patientZipCode: '',
            patientNeighborhood: '',
            appointmentType: '',
            transportType: '',
            scheduledDate: '',
            scheduledTime: '',
            estimatedDuration: 60,
            destinationName: '',
            destinationAddress: '',
            destinationCity: '',
            destinationState: '',
            destinationZipCode: '',
            destinationNeighborhood: '',
            destinationContact: '',
            medicalSpecialty: '',
            doctorName: '',
            examType: '',
            treatmentType: '',
            medicalObservations: '',
            specialNeeds: '',
            mobilityRestrictions: '',
            oxygenRequired: false,
            accompaniedByFamily: false,
            isRecurring: false,
            recurrencePattern: '',
            recurrenceInterval: 1,
            recurrenceEndDate: '',
            maxOccurrences: '',
            observations: '',
            priority: 'normal'
          });
          setActiveStep(0);
          setSuccess('');
        }, 3000);
      } else {
        setError(data.message || 'Erro ao criar agendamento');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Solicitante
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Dados do Solicitante
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome do Solicitante"
                value={formData.requesterName}
                onChange={(e) => handleInputChange('requesterName', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefone"
                value={formData.requesterPhone}
                onChange={(e) => handleInputChange('requesterPhone', e.target.value)}
                required
                placeholder="(xx) xxxxx-xxxx"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="E-mail"
                type="email"
                value={formData.requesterEmail}
                onChange={(e) => handleInputChange('requesterEmail', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Parentesco/Relação</InputLabel>
                <Select
                  value={formData.requesterRelationship}
                  onChange={(e) => handleInputChange('requesterRelationship', e.target.value)}
                >
                  {relationshipOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 1: // Paciente
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Dados do Paciente
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Nome Completo do Paciente"
                value={formData.patientName}
                onChange={(e) => handleInputChange('patientName', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="CPF"
                value={formData.patientCpf}
                onChange={(e) => handleInputChange('patientCpf', e.target.value)}
                placeholder="xxx.xxx.xxx-xx"
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Data de Nascimento"
                type="date"
                value={formData.patientBirthDate}
                onChange={(e) => handleInputChange('patientBirthDate', e.target.value)}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Sexo</InputLabel>
                <Select
                  value={formData.patientGender}
                  onChange={(e) => handleInputChange('patientGender', e.target.value)}
                >
                  <MenuItem value="male">Masculino</MenuItem>
                  <MenuItem value="female">Feminino</MenuItem>
                  <MenuItem value="other">Outros</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Telefone do Paciente"
                value={formData.patientPhone}
                onChange={(e) => handleInputChange('patientPhone', e.target.value)}
                placeholder="(xx) xxxxx-xxxx"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <CepSearch
                label="CEP do Paciente"
                placeholder="Digite o CEP (ex: 85010-260)"
                onAddressFound={(address) => {
                  if (address) {
                    handleInputChange('patientAddress', address.logradouro || '');
                    handleInputChange('patientCity', (address.cidade || '').toUpperCase());
                    handleInputChange('patientState', (address.estado || '').toUpperCase());
                    handleInputChange('patientZipCode', address.cep || '');
                    handleInputChange('patientNeighborhood', address.bairro || '');
                  }
                }}
                showFullAddress={false}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Endereço Completo"
                value={formData.patientAddress}
                onChange={(e) => handleInputChange('patientAddress', e.target.value)}
                required
                helperText="Digite o CEP acima para preenchimento automático"
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Cidade"
                value={formData.patientCity}
                onChange={(e) => handleInputChange('patientCity', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Estado"
                value={formData.patientState}
                onChange={(e) => handleInputChange('patientState', e.target.value)}
                required
                placeholder="SP"
                inputProps={{ maxLength: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="CEP"
                value={formData.patientZipCode}
                onChange={(e) => handleInputChange('patientZipCode', e.target.value)}
                required
                placeholder="xxxxx-xxx"
              />
            </Grid>
          </Grid>
        );

      case 2: // Agendamento
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Dados do Agendamento
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Tipo de Agendamento</InputLabel>
                <Select
                  value={formData.appointmentType}
                  onChange={(e) => handleInputChange('appointmentType', e.target.value)}
                >
                  {appointmentTypeOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Tipo de Transporte</InputLabel>
                <Select
                  value={formData.transportType}
                  onChange={(e) => handleInputChange('transportType', e.target.value)}
                >
                  {transportTypeOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Data do Agendamento"
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                required
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: new Date().toISOString().split('T')[0] }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Horário"
                type="time"
                value={formData.scheduledTime}
                onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Duração Estimada (min)"
                type="number"
                value={formData.estimatedDuration}
                onChange={(e) => handleInputChange('estimatedDuration', parseInt(e.target.value))}
                inputProps={{ min: 15, max: 480 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Prioridade</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                >
                  {priorityOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      <Chip 
                        label={option.label} 
                        color={option.color} 
                        size="small" 
                        sx={{ mr: 1 }} 
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isRecurring}
                    onChange={(e) => handleInputChange('isRecurring', e.target.checked)}
                  />
                }
                label="Agendamento Recorrente"
              />
            </Grid>
            
            {formData.isRecurring && (
              <>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Padrão de Recorrência</InputLabel>
                    <Select
                      value={formData.recurrencePattern}
                      onChange={(e) => handleInputChange('recurrencePattern', e.target.value)}
                    >
                      {recurrencePatternOptions.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Intervalo"
                    type="number"
                    value={formData.recurrenceInterval}
                    onChange={(e) => handleInputChange('recurrenceInterval', parseInt(e.target.value))}
                    inputProps={{ min: 1, max: 12 }}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Data Final da Recorrência"
                    type="date"
                    value={formData.recurrenceEndDate}
                    onChange={(e) => handleInputChange('recurrenceEndDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: formData.scheduledDate }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        );

      case 3: // Localização
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                <LocationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Localização do Destino
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome do Destino"
                value={formData.destinationName}
                onChange={(e) => handleInputChange('destinationName', e.target.value)}
                required
                placeholder="Hospital São José, Clínica ABC..."
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefone do Destino"
                value={formData.destinationContact}
                onChange={(e) => handleInputChange('destinationContact', e.target.value)}
                placeholder="(xx) xxxxx-xxxx"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <CepSearch
                label="CEP do Destino"
                placeholder="Digite o CEP (ex: 85010-260)"
                onAddressFound={(address) => {
                  if (address) {
                    handleInputChange('destinationAddress', address.logradouro || '');
                    handleInputChange('destinationCity', (address.cidade || '').toUpperCase());
                    handleInputChange('destinationState', (address.estado || '').toUpperCase());
                    handleInputChange('destinationZipCode', address.cep || '');
                    handleInputChange('destinationNeighborhood', address.bairro || '');
                  }
                }}
                showFullAddress={false}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Endereço Completo do Destino"
                value={formData.destinationAddress}
                onChange={(e) => handleInputChange('destinationAddress', e.target.value)}
                required
                helperText="Digite o CEP acima para preenchimento automático"
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Cidade"
                value={formData.destinationCity}
                onChange={(e) => handleInputChange('destinationCity', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Estado"
                value={formData.destinationState}
                onChange={(e) => handleInputChange('destinationState', e.target.value)}
                required
                placeholder="SP"
                inputProps={{ maxLength: 2 }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="CEP"
                value={formData.destinationZipCode}
                onChange={(e) => handleInputChange('destinationZipCode', e.target.value)}
                required
                placeholder="xxxxx-xxx"
              />
            </Grid>
          </Grid>
        );

      case 4: // Médico/Observações
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                <HospitalIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Informações Médicas e Observações
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Especialidade Médica"
                value={formData.medicalSpecialty}
                onChange={(e) => handleInputChange('medicalSpecialty', e.target.value)}
                placeholder="Cardiologia, Ortopedia..."
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome do Médico"
                value={formData.doctorName}
                onChange={(e) => handleInputChange('doctorName', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tipo de Exame"
                value={formData.examType}
                onChange={(e) => handleInputChange('examType', e.target.value)}
                placeholder="Raio-X, Ressonância..."
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tipo de Tratamento"
                value={formData.treatmentType}
                onChange={(e) => handleInputChange('treatmentType', e.target.value)}
                placeholder="Fisioterapia, Quimioterapia..."
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Observações Médicas"
                value={formData.medicalObservations}
                onChange={(e) => handleInputChange('medicalObservations', e.target.value)}
                placeholder="Condições médicas, medicamentos..."
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Necessidades Especiais"
                value={formData.specialNeeds}
                onChange={(e) => handleInputChange('specialNeeds', e.target.value)}
                placeholder="Cadeira de rodas, oxigênio..."
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.oxygenRequired}
                    onChange={(e) => handleInputChange('oxygenRequired', e.target.checked)}
                  />
                }
                label="Necessita oxigênio"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.accompaniedByFamily}
                    onChange={(e) => handleInputChange('accompaniedByFamily', e.target.checked)}
                  />
                }
                label="Acompanhado pela família"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Observações Gerais"
                value={formData.observations}
                onChange={(e) => handleInputChange('observations', e.target.value)}
                placeholder="Informações adicionais importantes..."
              />
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h4" component="h1">
            <EventIcon sx={{ mr: 2, verticalAlign: 'middle', color: 'primary.main' }} />
            Agendamento de Transporte
          </Typography>
        </Box>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent sx={{ p: 4 }}>
          {renderStepContent()}
          
          <Divider sx={{ my: 3 }} />
          
          <Box display="flex" justifyContent="space-between">
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<ClearIcon />}
            >
              Voltar
            </Button>
            
            <Box>
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  disabled={loading}
                  startIcon={<SaveIcon />}
                  size="large"
                >
                  {loading ? 'Salvando...' : 'Criar Agendamento'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  size="large"
                >
                  Próximo
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AppointmentScheduling;