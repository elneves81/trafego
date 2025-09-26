import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';

const TestAppointmentList = () => {
  console.log('🧪 TestAppointmentList component renderizado');
  
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" color="primary">
          🧪 TESTE - Lista de Agendamentos Carregada
        </Typography>
        <Typography variant="body2">
          Se você está vendo esta mensagem, o componente está sendo renderizado corretamente.
        </Typography>
      </CardContent>
    </Card>
  );
};

export default TestAppointmentList;