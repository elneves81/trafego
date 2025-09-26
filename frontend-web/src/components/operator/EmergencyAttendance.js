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
  Chip
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Person as PersonIcon,
  LocalHospital as HospitalIcon,
  LocationOn as LocationIcon,
  Save as SaveIcon,
  Clear as ClearIcon,
  MedicalServices as EmergencyIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import CepSearch from '../Common/CepSearch';

const EmergencyAttendance = () => {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    // Dados da chamada
    callDateTime: new Date().toISOString().slice(0, 16),
    callerName: '',
    callerPhone: '',
    relationship: '',
    
    // Dados do paciente
    patientName: '',
    patientDocument: '',
    patientAge: '',
    patientGender: '',
    patientWeight: '',
    
    // Condição médica
    medicalCondition: '',
    consciousness: '',
    breathing: '',
    bleeding: false,
    mobility: '',
    priority: 'Média',
    urgencyCode: '',
    
    // Localização
    originAddress: '',
    originLatitude: '',
    originLongitude: '',
    originReference: '',
    originContact: '',
    destinationAddress: '',
    preferredHospital: '',
    
    // Equipamentos e observações
    requiresSpecialEquipment: false,
    specialEquipmentNotes: '',
    companionCount: 0,
    companionNotes: '',
    observations: ''
  });

  const steps = [
    'Dados da Chamada',
    'Dados do Paciente',
    'Condição Médica',
    'Localização',
    'Observações'
  ];

  const relationshipOptions = [
    { value: 'proprio', label: 'O próprio paciente' },
    { value: 'familiar', label: 'Familiar' },
    { value: 'amigo', label: 'Amigo' },
    { value: 'vizinho', label: 'Vizinho' },
    { value: 'cuidador', label: 'Cuidador' },
    { value: 'profissional', label: 'Profissional de saúde' },
    { value: 'terceiro', label: 'Terceiro (desconhecido)' }
  ];

  const consciousnessOptions = [
    { value: 'Consciente', label: 'Consciente', color: 'success' },
    { value: 'Confuso', label: 'Confuso', color: 'warning' },
    { value: 'Inconsciente', label: 'Inconsciente', color: 'error' },
    { value: 'Agitado', label: 'Agitado', color: 'warning' }
  ];

  const breathingOptions = [
    { value: 'Normal', label: 'Normal', color: 'success' },
    { value: 'Dificuldade', label: 'Dificuldade respiratória', color: 'warning' },
    { value: 'Parou', label: 'Parada respiratória', color: 'error' },
    { value: 'Artificial', label: 'Respiração artificial', color: 'info' }
  ];

  const mobilityOptions = [
    { value: 'Caminhando', label: 'Caminhando' },
    { value: 'Maca', label: 'Necessita maca' },
    { value: 'Cadeira de rodas', label: 'Cadeira de rodas' },
    { value: 'Carregado', label: 'Precisa ser carregado' }
  ];

  const priorityOptions = [
    { value: 'Baixa', label: 'Baixa', color: 'success' },
    { value: 'Média', label: 'Média', color: 'info' },
    { value: 'Alta', label: 'Alta', color: 'warning' },
    { value: 'Crítica', label: 'Crítica', color: 'error' }
  ];

  const urgencyCodeOptions = [
    { value: 'Verde', label: 'Verde - Não urgente', color: 'success' },
    { value: 'Amarelo', label: 'Amarelo - Pouco urgente', color: 'warning' },
    { value: 'Laranja', label: 'Laranja - Urgente', color: 'warning' },
    { value: 'Vermelho', label: 'Vermelho - Muito urgente', color: 'error' }
  ];

  // Função para converter campos de texto para maiúsculas
  const toUpperCaseFields = [
    'callerName', 'patientName', 'patientDocument', 'medicalCondition', 
    'originAddress', 'originReference', 'originContact', 'destinationAddress',
    'destinationContact', 'observations', 'preferredHospital', 'relationship'
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
      case 0: // Dados da chamada
        if (!formData.callerName.trim()) {
          setError('Nome do solicitante é obrigatório');
          return false;
        }
        if (!formData.callerPhone.trim()) {
          setError('Telefone do solicitante é obrigatório');
          return false;
        }
        if (!formData.relationship) {
          setError('Relação com o paciente é obrigatória');
          return false;
        }
        break;
        
      case 1: // Dados do paciente
        if (!formData.patientName.trim()) {
          setError('Nome do paciente é obrigatório');
          return false;
        }
        if (!formData.patientGender) {
          setError('Sexo do paciente é obrigatório');
          return false;
        }
        break;
        
      case 2: // Condição médica
        if (!formData.medicalCondition.trim()) {
          setError('Descrição da condição médica é obrigatória');
          return false;
        }
        if (!formData.priority) {
          setError('Prioridade deve ser definida');
          return false;
        }
        break;
        
      case 3: // Localização
        if (!formData.originAddress.trim()) {
          setError('Endereço de origem é obrigatório');
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
      const response = await api.post('/attendances', {
        ...formData,
        operatorId: user.id
      });

      if (response.data.success) {
        setSuccess(`Atendimento registrado com sucesso! Número: ${response.data.attendance.attendanceNumber}`);
        // Reset form after success
        setTimeout(() => {
          setFormData({
            callDateTime: new Date().toISOString().slice(0, 16),
            callerName: '',
            callerPhone: '',
            relationship: '',
            patientName: '',
            patientDocument: '',
            patientAge: '',
            patientGender: '',
            patientWeight: '',
            medicalCondition: '',
            consciousness: '',
            breathing: '',
            bleeding: false,
            mobility: '',
            priority: 'Média',
            urgencyCode: '',
            originAddress: '',
            originLatitude: '',
            originLongitude: '',
            originReference: '',
            originContact: '',
            destinationAddress: '',
            preferredHospital: '',
            requiresSpecialEquipment: false,
            specialEquipmentNotes: '',
            companionCount: 0,
            companionNotes: '',
            observations: ''
          });
          setActiveStep(0);
          setSuccess('');
        }, 3000);
      } else {
        setError(data.message || 'Erro ao registrar atendimento');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                <PhoneIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Informações da Chamada
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Data/Hora da Chamada"
                type="datetime-local"
                value={formData.callDateTime}
                onChange={(e) => handleInputChange('callDateTime', e.target.value)}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome do Solicitante"
                value={formData.callerName}
                onChange={(e) => handleInputChange('callerName', e.target.value)}
                required
                placeholder="Quem está fazendo a chamada"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefone do Solicitante"
                value={formData.callerPhone}
                onChange={(e) => handleInputChange('callerPhone', e.target.value)}
                required
                placeholder="(xx) xxxxx-xxxx"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Relação com o Paciente</InputLabel>
                <Select
                  value={formData.relationship}
                  onChange={(e) => handleInputChange('relationship', e.target.value)}
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

      case 1:
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
                label="CPF ou RG"
                value={formData.patientDocument}
                onChange={(e) => handleInputChange('patientDocument', e.target.value)}
                placeholder="xxx.xxx.xxx-xx"
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Idade"
                type="number"
                value={formData.patientAge}
                onChange={(e) => handleInputChange('patientAge', e.target.value)}
                inputProps={{ min: 0, max: 120 }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Sexo</InputLabel>
                <Select
                  value={formData.patientGender}
                  onChange={(e) => handleInputChange('patientGender', e.target.value)}
                >
                  <MenuItem value="M">Masculino</MenuItem>
                  <MenuItem value="F">Feminino</MenuItem>
                  <MenuItem value="Outro">Outros</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Peso (kg)"
                type="number"
                value={formData.patientWeight}
                onChange={(e) => handleInputChange('patientWeight', e.target.value)}
                inputProps={{ min: 0, max: 300, step: 0.5 }}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                <HospitalIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Condição Médica e Urgência
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Descrição da Condição Médica/Sintomas"
                value={formData.medicalCondition}
                onChange={(e) => handleInputChange('medicalCondition', e.target.value)}
                required
                placeholder="Descreva detalhadamente os sintomas e a situação do paciente..."
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Estado de Consciência</InputLabel>
                <Select
                  value={formData.consciousness}
                  onChange={(e) => handleInputChange('consciousness', e.target.value)}
                >
                  {consciousnessOptions.map(option => (
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
              <FormControl fullWidth>
                <InputLabel>Situação Respiratória</InputLabel>
                <Select
                  value={formData.breathing}
                  onChange={(e) => handleInputChange('breathing', e.target.value)}
                >
                  {breathingOptions.map(option => (
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
              <FormControl fullWidth>
                <InputLabel>Condição de Mobilidade</InputLabel>
                <Select
                  value={formData.mobility}
                  onChange={(e) => handleInputChange('mobility', e.target.value)}
                >
                  {mobilityOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.bleeding}
                    onChange={(e) => handleInputChange('bleeding', e.target.checked)}
                  />
                }
                label="Presença de sangramento"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
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
              <FormControl fullWidth>
                <InputLabel>Código de Urgência</InputLabel>
                <Select
                  value={formData.urgencyCode}
                  onChange={(e) => handleInputChange('urgencyCode', e.target.value)}
                >
                  {urgencyCodeOptions.map(option => (
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
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                <LocationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Localização
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <CepSearch
                label="CEP de Origem"
                placeholder="Digite o CEP (ex: 85010-260)"
                onAddressFound={(address) => {
                  if (address) {
                    handleInputChange('originAddress', `${address.logradouro || ''}, ${address.bairro || ''}, ${address.cidade || ''} - ${address.estado || ''}`);
                  }
                }}
                showFullAddress={false}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Endereço Completo de Origem"
                value={formData.originAddress}
                onChange={(e) => handleInputChange('originAddress', e.target.value)}
                required
                placeholder="Rua, número, bairro, cidade... (preenche automaticamente com o CEP)"
                helperText="Digite o CEP acima para preenchimento automático ou digite manualmente"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Pontos de Referência"
                value={formData.originReference}
                onChange={(e) => handleInputChange('originReference', e.target.value)}
                placeholder="Próximo ao mercado X, em frente à escola Y..."
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefone no Local"
                value={formData.originContact}
                onChange={(e) => handleInputChange('originContact', e.target.value)}
                placeholder="(xx) xxxxx-xxxx"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Hospital/Destino Preferido"
                value={formData.preferredHospital}
                onChange={(e) => handleInputChange('preferredHospital', e.target.value)}
                placeholder="Hospital São José, UPA Central..."
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Endereço do Destino"
                value={formData.destinationAddress}
                onChange={(e) => handleInputChange('destinationAddress', e.target.value)}
                placeholder="Se diferente do hospital preferido"
              />
            </Grid>
          </Grid>
        );

      case 4:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                <EmergencyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Equipamentos e Observações
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.requiresSpecialEquipment}
                    onChange={(e) => handleInputChange('requiresSpecialEquipment', e.target.checked)}
                  />
                }
                label="Necessita equipamento especial"
              />
            </Grid>
            
            {formData.requiresSpecialEquipment && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Detalhes dos Equipamentos Especiais"
                  value={formData.specialEquipmentNotes}
                  onChange={(e) => handleInputChange('specialEquipmentNotes', e.target.value)}
                  placeholder="Oxigênio, desfibrilador, prancha rígida..."
                />
              </Grid>
            )}
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Número de Acompanhantes"
                type="number"
                value={formData.companionCount}
                onChange={(e) => handleInputChange('companionCount', parseInt(e.target.value) || 0)}
                inputProps={{ min: 0, max: 5 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Observações sobre Acompanhantes"
                value={formData.companionNotes}
                onChange={(e) => handleInputChange('companionNotes', e.target.value)}
                placeholder="Familiar idoso, criança pequena..."
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
                placeholder="Informações adicionais importantes para o atendimento..."
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
            <EmergencyIcon sx={{ mr: 2, verticalAlign: 'middle', color: 'error.main' }} />
            Registro de Atendimento de Emergência
          </Typography>
          <Box display="flex" alignItems="center">
            <TimeIcon sx={{ mr: 1 }} />
            <Typography variant="subtitle1">
              {new Date().toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Typography>
          </Box>
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
                  {loading ? 'Salvando...' : 'Registrar Atendimento'}
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

export default EmergencyAttendance;