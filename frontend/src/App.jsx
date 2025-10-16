import React, { useState, useEffect, lazy, Suspense } from "react";
import { Container, Box, CircularProgress, Typography, Alert, CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { BrowserRouter as Router, Route, Routes, useNavigate, Navigate } from "react-router-dom";
import { loadModels } from "./components/loadModels";
import { AuthContext } from "./components/AuthContext";
import firebaseService from "./utils/firebaseService";

// Lazy load components with organized imports
const {
  DocumentScanner,
  FaceAuthentication,
  Header,
  TeamPage,
  HomePage,
  AuthPage,
  Dashboard,
  QRVerification,
  AdminDashboard,
  AdminLogin
} = {
  DocumentScanner: lazy(() => import("./components/DocumentScanner")),
  FaceAuthentication: lazy(() => import("./components/FaceAuthentication")),
  Header: lazy(() => import("./components/Header")),
  TeamPage: lazy(() => import("./components/TeamPage")),
  HomePage: lazy(() => import("./components/HomePage")),
  AuthPage: lazy(() => import("./components/AuthPage")),
  Dashboard: lazy(() => import("./components/Dashboard")),
  QRVerification: lazy(() => import("./components/QRVerification")),
  AdminDashboard: lazy(() => import("./components/AdminDashboard")),
  AdminLogin: lazy(() => import("./components/AdminLogin"))
};

/**
 * ProtectedRoute component - Guards routes that require authentication
 * Redirects to auth page if user is not authenticated
 */
const ProtectedRoute = ({ children, isAuthenticated }) => {
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return isAuthenticated ? children : null;
};

function App() {
  // Theme State
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');

  // Create theme based on dark mode preference
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#0ea5e9',
      },
      secondary: {
        main: '#10b981',
      },
      background: {
        default: darkMode ? '#0f172a' : '#f8fafc',
        paper: darkMode ? '#1e293b' : '#ffffff',
      },
      text: {
        primary: darkMode ? '#f8fafc' : '#1e293b',
        secondary: darkMode ? '#cbd5e1' : '#64748b',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      button: {
        textTransform: 'none',
      },
    },
    custom: {
      gradient: 'linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)',
    },
    shape: {
      borderRadius: 16,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            height: '100%',
            width: '100%',
          },
          body: {
            margin: 0,
            padding: 0,
            minHeight: '100%',
            width: '100%',
            overflowX: 'hidden',
            backgroundColor: darkMode ? '#0f172a' : '#f8fafc',
            color: darkMode ? '#f8fafc' : '#1e293b',
          },
          '#root': {
            minHeight: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '16px',
            padding: '12px 24px',
            boxShadow: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: darkMode
                ? '0 8px 25px rgba(0, 0, 0, 0.3)'
                : '0 8px 25px rgba(14, 165, 233, 0.2)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: '20px',
            boxShadow: darkMode
              ? '0 8px 32px rgba(0, 0, 0, 0.3)'
              : '0 8px 32px rgba(0, 0, 0, 0.08)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '20px',
            boxShadow: darkMode
              ? '0 8px 32px rgba(0, 0, 0, 0.3)'
              : '0 8px 32px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: darkMode
                ? '0 12px 40px rgba(0, 0, 0, 0.4)'
                : '0 12px 40px rgba(14, 165, 233, 0.15)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: '16px',
              transition: 'all 0.2s ease-in-out',
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#0ea5e9',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderWidth: '2px',
              },
            },
          },
        },
      },
    },
  });

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [authenticationResult, setAuthenticationResult] = useState(null);

  // Face Recognition & Document Data States
  const [scannedIdFaceDescriptor, setScannedIdFaceDescriptor] = useState(null);
  const [scannedIdFaceImage, setScannedIdFaceImage] = useState(null);
  const [extractedDocumentData, setExtractedDocumentData] = useState(null);

  // Model Loading States
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState(null);
  const [hashVerificationError, setHashVerificationError] = useState(null);

  const navigate = useNavigate();
  
  // Toggle dark mode function
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
  };

  // Auth Context Functions
  const handleLogin = (username) => {
    setIsAuthenticated(true);
    setCurrentUser({ username });
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('currentUser', JSON.stringify({ username }));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setAuthenticatedUser(null); // Clear authenticated user
    setAuthenticationResult(null); // Clear authentication result
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUser');
    // Clear sensitive data
    setScannedIdFaceDescriptor(null);
    setScannedIdFaceImage(null);
    setExtractedDocumentData(null);
    navigate('/');
  };

  // Initial Load
  useEffect(() => {
    // Check local storage for persistent authentication
    const storedAuth = localStorage.getItem('isAuthenticated');
    const storedUser = localStorage.getItem('currentUser');
    if (storedAuth === 'true' && storedUser) {
      setIsAuthenticated(true);
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (error) {
        // Handle legacy format where storedUser might be just a string
        setCurrentUser({ username: storedUser });
      }
    }

    // Load Face API models
    loadModels(setModelsLoaded, setLoadingError, setHashVerificationError);
  }, []);

  // Handler for when face is scanned from document
  const handleFaceScannedFromDocument = (descriptor, image, ocrData) => {
    setScannedIdFaceDescriptor(descriptor);
    setScannedIdFaceImage(image);
    setExtractedDocumentData(ocrData);
    navigate("/face-authentication");
  };

  // Handler for successful live face authentication
  const handleAuthenticated = async (user, result) => {
    if (user && result) {
      setAuthenticatedUser(user);
      setAuthenticationResult(result);
      
      // Save the extracted document data to database
      if (result.documentData && currentUser) {
        try {
          console.log('Saving document data to database:', result.documentData);
          
          // Import documentDB dynamically
          const { documentDB } = await import('./utils/documentDatabase');
          
          // Prepare document data for storage - map API fields to database fields
          const documentToStore = {
            name: result.documentData.name || 'Not found',
            dob: result.documentData.dob || 'Not found',
            address: result.documentData.address || 'Not found',
            mobile: result.documentData.mobile || 'Not found',
            aadhaar: result.documentData.aadharNumber || 'Not found', // Note: aadharNumber -> aadhaar
            gender: result.documentData.gender || 'Not found',
            documentType: result.documentData.documentType || 'unknown',
            bloodGroup: result.documentData.bloodGroup || null,
            fatherName: result.documentData.fatherName || null,
            pinCode: result.documentData.pinCode || null,
            state: result.documentData.state || null,
            panNumber: result.documentData.panNumber || null,
            dlNumber: result.documentData.dlNumber || null,
            issueDate: result.documentData.issueDate || null,
            validity: result.documentData.validity || null,
            uploadedAt: new Date().toISOString()
          };
          
          // Store in database
          await documentDB.storeDocument(currentUser.username, documentToStore);
          console.log('Document data saved successfully to database');
        } catch (error) {
          console.error('Error saving document data to database:', error);
          // Don't block navigation on database error
        }
      }
      
      navigate("/dashboard");
    }
  };

  // Helper to check admin auth
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  // Loading and Error States
  if (loadingError || hashVerificationError) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {loadingError || hashVerificationError}
          </Alert>
          <Typography variant="body1" sx={{ mt: 1, textAlign: 'center' }}>
            There was an issue loading the necessary models. Please ensure your network is stable and try again.
          </Typography>
        </Box>
      </Container>
    );
  }

  if (!modelsLoaded) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading Face Recognition Models...
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary', textAlign: 'center' }}>
            This might take a moment depending on your connection.
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
        <AuthContext.Provider value={{ 
          isAuthenticated, 
          currentUser, 
          login: handleLogin, 
          logout: handleLogout,
          darkMode,
          toggleDarkMode
        }}>
          <Container
            maxWidth={false}
            disableGutters
            sx={{
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
            }}
          >
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                px: 0,
                py: { xs: 4, md: 6 },
                boxSizing: 'border-box',
              }}
            >
              <Suspense fallback={<CircularProgress sx={{ display: 'block', margin: 'auto', mt: 5 }} />}>
                <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/auth" element={<AuthPage />} />

                {/* Protected Routes */}
                <Route
                  path="/scan-id"
                  element={
                    <ProtectedRoute isAuthenticated={isAuthenticated}>
                      <DocumentScanner
                        onFaceScanned={handleFaceScannedFromDocument}
                        modelsLoaded={modelsLoaded}
                        loadingError={loadingError}
                        hashVerificationError={hashVerificationError}
                      />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/face-authentication"
                  element={
                    <ProtectedRoute isAuthenticated={isAuthenticated}>
                      <FaceAuthentication
                        onAuthenticated={handleAuthenticated}
                        scannedIdFaceDescriptor={scannedIdFaceDescriptor}
                        scannedIdFaceImage={scannedIdFaceImage}
                        extractedDocumentData={extractedDocumentData}
                        modelsLoaded={modelsLoaded}
                        loadingError={loadingError}
                        hashVerificationError={hashVerificationError}
                      />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute isAuthenticated={isAuthenticated}>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />

                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/admin" element={isAdmin ? <AdminDashboard /> : <Navigate to="/admin-login" replace />} />

                <Route path="/team" element={<TeamPage />} />
                <Route path="/TeamPage" element={<Navigate to="/team" replace />} />

                <Route path="/qr-verification" element={<QRVerification />} />
                <Route path="/help" element={<TeamPage />} />

                <Route path="*" element={
                  <Typography variant="h4" sx={{ textAlign: 'center', mt: 10 }}>
                    404 - Page Not Found
                  </Typography>
                } />
              </Routes>
            </Suspense>
          </Box>
        </Container>
      </AuthContext.Provider>
      </Box>
    </ThemeProvider>
  );
}

// Wrapper for BrowserRouter
export default function AppWithRouter() {
  return (
    <Router>
      <App />
    </Router>
  );
}