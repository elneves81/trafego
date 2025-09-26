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
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider,
  IconButton
} from '@mui/material';
import {
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Save as SaveIcon,
  Clear as ClearIcon,
  ArrowBack as BackIcon,
  ArrowForward as ForwardIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import CepSearch from '../Common/CepSearch';

const BasicAttendance = ({ onSuccess }) => {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    // Dados do solicitante
    callerName: '',
    callerPhone: '',
    callerCpf: '',
    
    // Dados do paciente
    patientName: '',
    patientPhone: '',
    patientCpf: '',
    patientAge: '',
    patientGender: '',
    
    // Endereço de origem (casa do paciente)
    originAddress: '',
    cidade: '',
    estado: '',
    originZipCode: '',
    originNeighborhood: '',
    originReference: '',
    originContact: '',
    
    // Dados do atendimento
    attendanceType: '',
    priority: 'normal',
    description: '',
    
    // Destino
    destinationAddress: '',
    destinationContact: '',
    
    // Observações
    observations: ''
  });

  const steps = [
    'Dados do Paciente',
    'Endereço de Origem',
    'Dados do Atendimento'
  ];

  const attendanceTypeOptions = [
    { value: 'consultation', label: 'Consulta Médica' },
    { value: 'exam', label: 'Exame' },
    { value: 'treatment', label: 'Tratamento' },
    { value: 'transfer', label: 'Transferência' },
    { value: 'discharge', label: 'Alta Hospitalar' },
    { value: 'return', label: 'Retorno' },
    { value: 'therapy', label: 'Terapia/Fisioterapia' },
    { value: 'other', label: 'Outros' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Baixa' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'Alta' },
    { value: 'urgent', label: 'Urgente' }
  ];

  // Função para converter campos de texto para maiúsculas
  const toUpperCaseFields = [
    'callerName', 'patientName', 'originAddress', 'cidade', 'estado', 
    'originNeighborhood', 'originReference', 'destinationAddress', 
    'description', 'observations', 'originContact', 'destinationContact'
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
    switch (step) {
      case 0: // Dados do Solicitante e Paciente
        // Validações do solicitante
        if (!formData.callerName.trim()) {
          setError('Nome do solicitante é obrigatório');
          return false;
        }
        if (!formData.callerPhone.trim()) {
          setError('Telefone do solicitante é obrigatório');
          return false;
        }
        // Validações do paciente
        if (!formData.patientName.trim()) {
          setError('Nome do paciente é obrigatório');
          return false;
        }
        if (!formData.patientGender) {
          setError('Sexo do paciente é obrigatório');
          return false;
        }
        break;
      case 1: // Endereço de Origem
        if (!formData.originAddress.trim()) {
          setError('Endereço de origem é obrigatório');
          return false;
        }
        if (!formData.originContact.trim()) {
          setError('Telefone de contato no local de origem é obrigatório');
          return false;
        }
        break;
      case 2: // Dados do Atendimento
        if (!formData.attendanceType) {
          setError('Tipo de atendimento é obrigatório');
          return false;
        }
        if (!formData.destinationAddress.trim()) {
          setError('Endereço de destino é obrigatório');
          return false;
        }
        break;
      default:
        break;
    }
    setError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Preparar dados para envio - mapear para os campos esperados pelo backend
      const attendanceData = {
        // Dados do solicitante
        callerName: formData.callerName || user?.name || 'Operador',
        callerPhone: formData.callerPhone || formData.originContact,
        callerCpf: formData.callerCpf,
        
        // Dados do paciente
        patientName: formData.patientName,
        patientPhone: formData.patientPhone,
        patientCpf: formData.patientCpf,
        patientAge: formData.patientAge ? parseInt(formData.patientAge) : null,
        patientGender: formData.patientGender,
        
        // Endereço básico (novos campos)
        address: formData.originAddress,
        city: formData.cidade,
        state: formData.estado,
        cep: formData.originZipCode,
        
        // Endereço detalhado (campos originais)
        originAddress: formData.originAddress,
        originReference: formData.originReference,
        originContact: formData.originContact,
        
        // Mapear prioridade para formato esperado
        priority: mapPriority(formData.priority),
        
        // Campos opcionais
        medicalCondition: formData.description || 'Atendimento básico',
        observations: formData.observations,
        
        // Campos adicionais
        destinationAddress: formData.destinationAddress,
        destinationContact: formData.destinationContact,
        
        // Informações específicas do atendimento básico
        attendanceType: formData.attendanceType,
        category: 'basic'
      };

      const response = await api.post('/attendances', attendanceData);

      if (response.data.success) {
        setSuccess(`Atendimento básico criado com sucesso! Número: ${response.data.data.attendanceNumber}`);
        
        // Chamar callback para redirecionar para aba de corridas
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          }
        }, 2000);
        
        // Reset form after success
        setTimeout(() => {
          setFormData({
            callerName: '',
            callerPhone: '',
            callerCpf: '',
            patientName: '',
            patientPhone: '',
            patientCpf: '',
            patientAge: '',
            patientGender: '',
            originAddress: '',
            cidade: '',
            estado: '',
            originZipCode: '',
            originNeighborhood: '',
            originReference: '',
            originContact: '',
            attendanceType: '',
            priority: 'normal',
            description: '',
            destinationAddress: '',
            destinationContact: '',
            observations: ''
          });
          setActiveStep(0);
          setSuccess('');
        }, 3000);
      } else {
        setError(response.data.message || 'Erro ao criar atendimento');
      }
    } catch (err) {
      console.error('Erro ao criar atendimento:', err);
      setError('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const mapPriority = (priority) => {
    const priorityMap = {
      'low': 'Baixa',
      'normal': 'Média',
      'high': 'Alta',
      'urgent': 'Crítica'
    };
    return priorityMap[priority] || 'Média';
  };

  const handleCepFound = (addressData) => {
    console.log('🏠 CEP Data received:', addressData);
    setFormData(prev => ({
      ...prev,
      originAddress: addressData.logradouro || '',
      cidade: (addressData.cidade || addressData.localidade || '').toUpperCase(),
      estado: (addressData.estado || addressData.uf || '').toUpperCase(),
      originZipCode: addressData.cep || '',
      originNeighborhood: addressData.bairro || ''
    }));
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Dados do Solicitante e Paciente
        return (
          <Grid container spacing={3}>
            {/* Dados do Solicitante */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                <PhoneIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Dados do Solicitante
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Nome do Solicitante"
                value={formData.callerName}
                onChange={(e) => handleInputChange('callerName', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Telefone do Solicitante"
                value={formData.callerPhone}
                onChange={(e) => handleInputChange('callerPhone', e.target.value)}
                placeholder="(00) 00000-0000"
                required
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="CPF do Solicitante (opcional)"
                value={formData.callerCpf}
                onChange={(e) => handleInputChange('callerCpf', e.target.value)}
                placeholder="000.000.000-00"
              />
            </Grid>

            {/* Dados do Paciente */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Dados do Paciente
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome Completo do Paciente"
                value={formData.patientName}
                onChange={(e) => handleInputChange('patientName', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefone do Paciente (opcional)"
                value={formData.patientPhone}
                onChange={(e) => handleInputChange('patientPhone', e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="CPF do Paciente (opcional)"
                value={formData.patientCpf}
                onChange={(e) => handleInputChange('patientCpf', e.target.value)}
                placeholder="000.000.000-00"
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
                  <MenuItem value="male">Masculino</MenuItem>
                  <MenuItem value="female">Feminino</MenuItem>
                  <MenuItem value="other">Outros</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 1: // Endereço de Origem
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                <LocationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Endereço de Origem (Casa do Paciente)
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <CepSearch
                onAddressFound={handleCepFound}
                initialValue={formData.originZipCode}
                onCepChange={(cep) => handleInputChange('originZipCode', cep)}
              />
            </Grid>
            
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Endereço Completo"
                value={formData.originAddress}
                onChange={(e) => handleInputChange('originAddress', e.target.value)}
                placeholder="Rua, número, complemento"
                required
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Bairro"
                value={formData.originNeighborhood}
                onChange={(e) => handleInputChange('originNeighborhood', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Cidade"
                value={formData.cidade}
                onChange={(e) => handleInputChange('cidade', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Estado"
                value={formData.estado}
                onChange={(e) => handleInputChange('estado', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ponto de Referência"
                value={formData.originReference}
                onChange={(e) => handleInputChange('originReference', e.target.value)}
                placeholder="Próximo ao supermercado, esquina com..."
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefone de Contato no Local"
                value={formData.originContact}
                onChange={(e) => handleInputChange('originContact', e.target.value)}
                placeholder="(00) 00000-0000"
                required
              />
            </Grid>
          </Grid>
        );

      case 2: // Dados do Atendimento
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Dados do Atendimento
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Tipo de Atendimento</InputLabel>
                <Select
                  value={formData.attendanceType}
                  onChange={(e) => handleInputChange('attendanceType', e.target.value)}
                >
                  {attendanceTypeOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Descrição do Caso"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descreva brevemente o motivo do atendimento..."
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Endereço de Destino"
                value={formData.destinationAddress}
                onChange={(e) => handleInputChange('destinationAddress', e.target.value)}
                placeholder="Hospital, clínica, posto de saúde..."
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefone do Destino"
                value={formData.destinationContact}
                onChange={(e) => handleInputChange('destinationContact', e.target.value)}
                placeholder="(00) 0000-0000"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Observações Adicionais"
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
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom color="primary">
            Novo Atendimento Básico
          </Typography>

          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step Content */}
          <Box sx={{ mb: 4 }}>
            {renderStepContent()}
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              startIcon={<BackIcon />}
            >
              Voltar
            </Button>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setFormData({
                    callerName: '',
                    callerPhone: '',
                    callerCpf: '',
                    patientName: '',
                    patientPhone: '',
                    patientCpf: '',
                    patientAge: '',
                    patientGender: '',
                    originAddress: '',
                    cidade: '',
                    estado: '',
                    originZipCode: '',
                    originNeighborhood: '',
                    originReference: '',
                    originContact: '',
                    attendanceType: '',
                    priority: 'normal',
                    description: '',
                    destinationAddress: '',
                    destinationContact: '',
                    observations: ''
                  });
                  setActiveStep(0);
                  setError('');
                }}
                startIcon={<ClearIcon />}
              >
                Limpar
              </Button>

              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                  startIcon={<SaveIcon />}
                >
                  {loading ? 'Salvando...' : 'Salvar Atendimento'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ForwardIcon />}
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

export default BasicAttendance;