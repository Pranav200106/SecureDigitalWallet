import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, TextField, Button, Alert, CircularProgress, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import firebaseService from '../utils/firebaseService';

const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
};

const AdminLogin = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Get stored password from Firebase
      const storedPassword = await firebaseService.getSetting('adminPassword') || ADMIN_CREDENTIALS.password;
      
      if (username === ADMIN_CREDENTIALS.username && password === storedPassword) {
        localStorage.setItem('isAdmin', 'true');
        navigate('/admin');
      } else {
        setError('Invalid admin credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to authenticate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      background: theme.palette.background.default 
    }}>
      <Paper elevation={6} sx={{ 
        p: 4, 
        borderRadius: '20px', 
        maxWidth: 400, 
        width: '100%',
        backgroundColor: theme.palette.background.paper,
        boxShadow: isDark 
          ? '0 10px 40px rgba(0,0,0,0.5)' 
          : '0 10px 40px rgba(0,0,0,0.1)'
      }}>
        <Typography variant="h4" sx={{ 
          mb: 3, 
          fontWeight: 700, 
          textAlign: 'center',
          background: 'linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Admin Login
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField
            label="Username"
            variant="outlined"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              }
            }}
          />
          <TextField
            label="Password"
            variant="outlined"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              }
            }}
          />
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            fullWidth 
            sx={{ 
              mt: 2, 
              fontWeight: 600,
              borderRadius: '12px',
              py: 1.5,
              background: 'linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: isDark 
                  ? '0 8px 25px rgba(14, 165, 233, 0.4)' 
                  : '0 8px 25px rgba(14, 165, 233, 0.3)',
              },
              transition: 'all 0.3s ease',
            }} 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default AdminLogin;
