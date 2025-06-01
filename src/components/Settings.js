import React from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';

function Settings() {
  return (
    <Container component="main" maxWidth="md">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography variant="h4" gutterBottom>Settings Page</Typography>
          <Typography variant="body1">This is the user settings page. User preferences and application settings will be configured here.</Typography>
        </Paper>
      </Box>
    </Container>
  );
}

export default Settings; 