import React, { useState, useContext } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Link,
  useTheme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import firebaseService from '../utils/firebaseService';

const AuthPage = () => {
  const theme = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useContext(AuthContext); // Get the login function from context

  const isDark = theme.palette.mode === 'dark';
  const modernColors = {
    primary: "#0ea5e9",
    secondary: "#10b981",
    accent: "#f59e0b",
    dark: isDark ? "#0f172a" : "#1e293b",
    light: isDark ? "#1e293b" : "#f8fafc",
    gradient: "linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)",
    background: theme.palette.background.default,
    surface: theme.palette.background.paper,
    textPrimary: theme.palette.text.primary,
    textSecondary: theme.palette.text.secondary,
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        // Login - check if user exists
        const existingUser = await firebaseService.getUser(username);
        
        if (!existingUser) {
          setError('User not found. Please register first.');
          return;
        }

        // Simple password check (in production, use proper hashing)
        if (existingUser.password !== password) {
          setError('Invalid password');
          return;
        }

        // Login successful
        login(username);
        localStorage.setItem('token', 'firebase-auth-token'); // Dummy token for compatibility
        localStorage.setItem('currentUser', username);
        navigate('/scan-id');
      } else {
        // Register - check if user already exists
        const existingUser = await firebaseService.getUser(username);
        
        if (existingUser) {
          setError('Username already exists. Please login instead.');
          return;
        }

        // Create new user
        await firebaseService.createUser({
          username,
          password, // In production, hash this!
          createdAt: new Date().toISOString(),
        });

        // Auto-login after registration
        login(username);
        localStorage.setItem('token', 'firebase-auth-token');
        localStorage.setItem('currentUser', username);
        navigate('/scan-id');
        alert('Registration successful! You are now logged in.');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'Something went wrong');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 64px)', // Adjust for AppBar height
        backgroundColor: modernColors.background,
        padding: 3,
      }}
    >
      <Paper
        elevation={6}
        sx={{
          padding: { xs: 3, md: 5 },
          borderRadius: '20px',
          maxWidth: '450px',
          width: '100%',
          boxShadow: isDark 
            ? '0 15px 40px rgba(0,0,0,0.4)' 
            : '0 15px 40px rgba(0,0,0,0.1)',
          textAlign: 'center',
          background: modernColors.surface,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            mb: 3,
            fontWeight: 700,
            background: modernColors.gradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {isLogin ? 'Login' : 'Register'}
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

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
            fullWidth
            size="large"
            sx={{
              mt: 3,
              py: 1.5,
              background: modernColors.gradient,
              color: 'white',
              fontWeight: 600,
              borderRadius: '12px',
              textTransform: 'none',
              fontSize: '1.1rem',
              boxShadow: isDark 
                ? '0 5px 20px rgba(14, 165, 233, 0.3)' 
                : '0 5px 20px rgba(14, 165, 233, 0.2)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: isDark 
                  ? '0 10px 25px rgba(14, 165, 233, 0.4)' 
                  : '0 10px 25px rgba(14, 165, 233, 0.3)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            {isLogin ? 'Login' : 'Register'}
          </Button>
        </form>

        <Typography variant="body2" sx={{ mt: 3, color: modernColors.textSecondary }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <Link
            component="button"
            onClick={() => setIsLogin(!isLogin)}
            sx={{
              color: modernColors.primary,
              fontWeight: 600,
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            {isLogin ? 'Register here' : 'Login here'}
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
};

export default AuthPage;
