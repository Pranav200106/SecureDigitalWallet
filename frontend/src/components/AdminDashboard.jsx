import React, { useState, useEffect, ErrorBoundary } from 'react';
import { useTheme } from '@mui/material';
import { Box, Typography, useTheme as muiUseTheme, Card, CardContent, Button, Grid, Dialog, DialogTitle, DialogContent, DialogActions, Chip, TextField, Alert, Divider, CircularProgress, Select, MenuItem } from '@mui/material';
import { parseQRData } from '../utils/qrParser';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ErrorIcon from '@mui/icons-material/Error';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import QrScanner from 'react-qr-scanner';
import { useNavigate } from 'react-router-dom';
import { submissionStore } from '../utils/submissionStore';
import { maskSensitiveData } from '../utils/encryption';
import firebaseService from '../utils/firebaseService';

// Simple Error Boundary for QR Scanner
class QRScannerErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('QR Scanner Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          QR Scanner failed to load. Please use manual input below.
          <Typography variant="body2" sx={{ mt: 1 }}>
            Error: {this.state.error?.message || 'Unknown error'}
          </Typography>
        </Alert>
      );
    }

    return this.props.children;
  }
}

const AdminDashboard = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [submissions, setSubmissions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pwDialogOpen, setPwDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrValidationResult, setQrValidationResult] = useState(null);
  const [scannedData, setScannedData] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [scannerReady, setScannerReady] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [rawQrData, setRawQrData] = useState('');
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  // Admin list usability
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  // Load submissions from store on component mount
  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        const storeSubmissions = await submissionStore.getSubmissions();
        setSubmissions(storeSubmissions);
      } catch (error) {
        console.error('Error loading submissions:', error);
      }
    };

    // Load initial data
    loadSubmissions();

    // Subscribe to changes
    const unsubscribe = submissionStore.subscribe((updatedSubmissions) => {
      console.log('Admin dashboard received updated submissions:', updatedSubmissions);
      setSubmissions(updatedSubmissions);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const handleView = (submission) => {
    setSelected(submission);
    setDialogOpen(true);
  };

  const handleVerify = () => {
    if (selected) {
      submissionStore.updateSubmissionStatus(selected.id, 'verified');
      setDialogOpen(false);
    }
  };

  const handleReject = () => {
    if (selected) {
      submissionStore.updateSubmissionStatus(selected.id, 'rejected');
      setDialogOpen(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    navigate('/admin-login');
  };

  const handleOpenPwDialog = () => {
    setPwDialogOpen(true);
    setNewPassword('');
    setPwError('');
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 5) {
      setPwError('Password must be at least 5 characters.');
      return;
    }
    
    try {
      await firebaseService.setSetting('adminPassword', newPassword);
      setPwDialogOpen(false);
      alert('Password changed!');
    } catch (error) {
      console.error('Error changing password:', error);
      setPwError('Failed to change password. Please try again.');
    }
  };

  const handleScanQR = () => {
    setQrDialogOpen(true);
    setQrValidationResult(null);
    setScannedData(null);
    setCameraError(null);
    setScannerReady(false);
    
    // Set a timeout to show manual input if camera doesn't load
    setTimeout(() => {
      if (!scannerReady && !cameraError) {
        setCameraError('Camera is taking too long to load. Please try manual input.');
      }
    }, 10000); // 10 seconds timeout
  };

  const validateQRData = (qrData) => {
    try {
      console.log('Raw QR data received:', qrData);

      // Robust parse using utility
      const parsedData = parseQRData(qrData);

      console.log('Final parsed QR data:', parsedData);
      console.log('Available submissions:', submissions);

      // Find matching submission by comparing key attributes
      const matchingSubmission = submissions.find(submission => {
        // Check multiple attributes for validation (case-insensitive for name)
        const nameMatch = submission.name.toLowerCase().trim() === parsedData.name?.toLowerCase().trim();
        const dobMatch = submission.dob === parsedData.dob || 
                        (submission.dob === 'N/A' && !parsedData.dob) ||
                        (submission.dob === 'Not found' && !parsedData.dob) ||
                        (!parsedData.dob && (submission.dob === 'N/A' || submission.dob === 'Not found'));
        const aadhaarMatch = submission.aadhaar === parsedData.aadhaar;
        const mobileMatch = submission.mobile === parsedData.mobile;
        const usernameMatch = submission.username === parsedData.username;
        
        console.log('Checking submission:', submission.name);
        console.log('Name match:', nameMatch, `"${submission.name}" vs "${parsedData.name}"`);
        console.log('DOB match:', dobMatch, `"${submission.dob}" vs "${parsedData.dob}"`);
        console.log('Aadhaar match:', aadhaarMatch, `"${submission.aadhaar}" vs "${parsedData.aadhaar}"`);
        console.log('Mobile match:', mobileMatch, `"${submission.mobile}" vs "${parsedData.mobile}"`);
        console.log('Username match:', usernameMatch, `"${submission.username}" vs "${parsedData.username}"`);
        
        // Consider it a match if at least 3 out of 5 key attributes match
        const matchCount = [nameMatch, dobMatch, aadhaarMatch, mobileMatch, usernameMatch].filter(Boolean).length;
        console.log('Match count:', matchCount);
        return matchCount >= 3;
      });

      if (matchingSubmission) {
        // Check if the QR code is not too old (e.g., valid for 24 hours)
        const verifiedAt = new Date(parsedData.verifiedAt);
        const now = new Date();
        const hoursDiff = (now - verifiedAt) / (1000 * 60 * 60);
        const isExpired = hoursDiff > 24; // QR valid for 24 hours

        if (isExpired) {
          return {
            isValid: false,
            submission: matchingSubmission,
            scannedData: parsedData,
            message: 'QR code has expired. Please generate a new QR code for verification.',
            attributeVerification: null
          };
        }

        // Check if the data in QR matches the submission data exactly
        const nameValid = parsedData.name?.toLowerCase().trim() === matchingSubmission.name.toLowerCase().trim();
        const dobValid = parsedData.dob === matchingSubmission.dob ||
                        (matchingSubmission.dob === 'N/A' && !parsedData.dob) ||
                        (matchingSubmission.dob === 'Not found' && !parsedData.dob) ||
                        (!parsedData.dob && (matchingSubmission.dob === 'N/A' || matchingSubmission.dob === 'Not found'));
        const aadhaarValid = parsedData.aadhaar === matchingSubmission.aadhaar;
        const mobileValid = parsedData.mobile === matchingSubmission.mobile;
        const usernameValid = parsedData.username === matchingSubmission.username;

        const isDataValid = nameValid && dobValid && aadhaarValid && mobileValid && usernameValid;

        console.log('Data validation breakdown:');
        console.log('Name valid:', nameValid);
        console.log('DOB valid:', dobValid);
        console.log('Aadhaar valid:', aadhaarValid);
        console.log('Mobile valid:', mobileValid);
        console.log('Username valid:', usernameValid);
        console.log('Overall data validation result:', isDataValid);

        return {
          isValid: isDataValid,
          submission: matchingSubmission,
          scannedData: parsedData,
          message: isDataValid
            ? 'QR code data matches the submission records. User identity verified!'
            : 'QR code found matching user but some data discrepancies detected.',
          attributeVerification: {
            name: {
              verified: nameValid,
              scanned: parsedData.name,
              stored: matchingSubmission.name,
              requested: parsedData.verificationRequested?.name || false
            },
            age: {
              verified: dobValid,
              scanned: parsedData.dob,
              stored: matchingSubmission.dob,
              requested: parsedData.verificationRequested?.age || false
            },
            mobile: {
              verified: mobileValid,
              scanned: parsedData.mobile,
              stored: matchingSubmission.mobile,
              requested: parsedData.verificationRequested?.mobile || false
            },
            aadhaar: {
              verified: aadhaarValid,
              scanned: parsedData.aadhaar,
              stored: matchingSubmission.aadhaar,
              requested: parsedData.verificationRequested?.aadhaar || false
            },
            address: {
              verified: parsedData.address === matchingSubmission.address,
              scanned: parsedData.address,
              stored: matchingSubmission.address,
              requested: parsedData.verificationRequested?.address || false
            }
          }
        };
      } else {
        return {
          isValid: false,
          submission: null,
          scannedData: parsedData,
          message: 'No matching submission found for this QR code data.'
        };
      }
    } catch (error) {
      console.error('QR validation error:', error);
      console.error('Failed to parse QR data:', qrData);
      
      let errorMessage = 'Invalid QR code format. ';
      if (error.message.includes('Unexpected token')) {
        errorMessage += 'The QR code does not contain valid JSON data.';
      } else if (error.message.includes('No data parameter')) {
        errorMessage += 'The QR code URL does not contain a data parameter.';
      } else {
        errorMessage += `Parse error: ${error.message}`;
      }
      
      return {
        isValid: false,
        submission: null,
        scannedData: null,
        message: errorMessage
      };
    }
  };

  const handleQRScan = (data) => {
    if (!data) return;

    console.log('QR scan data received:', data);

    // Normalize scanner output to a string. Some scanners return an object like { text: '...' }.
    const content =
      typeof data === 'string'
        ? data
        : (data?.text ?? data?.data ?? '');

    if (!content) {
      console.warn('QR scan provided non-string data without text/data field.');
      setCameraError('Invalid QR: unreadable content.');
      return;
    }

    // Store raw for debugging (stringify objects)
    setRawQrData(typeof data === 'string' ? data : JSON.stringify(data));

    const validationResult = validateQRData(content);
    setQrValidationResult(validationResult);
    setScannedData(validationResult.scannedData);
    
    // If valid, automatically update the submission status
    if (validationResult.isValid && validationResult.submission) {
      submissionStore.updateSubmissionStatus(validationResult.submission.id, 'verified');
      console.log('Submission status updated to verified for:', validationResult.submission.name);
    }
  };

  const handleQRError = (err) => {
    console.error('QR scan error:', err);
    const errorMessage = err?.message || err?.toString() || 'Camera access failed. Please check permissions.';
    setCameraError(errorMessage);
    
    // Don't set validation result for camera errors, just show the error
    console.log('Camera error set:', errorMessage);
  };

  const handleScannerLoad = () => {
    setScannerReady(true);
    setCameraError(null);
  };

  const closeQRDialog = () => {
    setQrDialogOpen(false);
    setQrValidationResult(null);
    setScannedData(null);
    setCameraError(null);
    setScannerReady(false);
    setManualInput('');
    setShowManualInput(false);
    setRawQrData('');
  };

  const handleManualValidation = () => {
    if (manualInput.trim()) {
      handleQRScan(manualInput.trim());
    }
  };

  // Add test submission for demo purposes
  const addTestSubmission = () => {
    const testData = {
      username: 'user1',
      name: 'Vijaykumar Selvan Shenbaga',
      dob: 'N/A',
      address: 'NANDI CITADEL, DODDA KAMANAHALLI ROAD, OFF',
      mobile: '7071086940',
      aadhaar: '370710869406'
    };
    
    submissionStore.addSubmission(testData);
    console.log('Test submission added:', testData);
    console.log('Current submissions after adding:', submissionStore.getSubmissions());
    alert('Test submission added! You can now test QR scanning.');
  };

  // Test function to simulate QR scanning with demo data
  const handleTestQRScan = () => {
    // Get the first pending submission for testing
    const testSubmission = submissions.find(s => s.status === 'pending');
    
    if (!testSubmission) {
      alert('No pending submissions found. Click "Add Test Submission" first or upload a document from the user dashboard.');
      return;
    }

    // Create test QR data that matches the submission
    const testQRData = {
      docType: 'Document Verification',
      verifiedAt: new Date().toISOString(),
      username: testSubmission.username,
      name: testSubmission.name,
      dob: testSubmission.dob,
      mobile: testSubmission.mobile,
      aadhaar: testSubmission.aadhaar,
      address: testSubmission.address,
      verificationRequested: {
        name: true,
        age: true,
        address: true,
        mobile: true,
        aadhaar: true
      }
    };
    
    // Simulate the URL format that would be in a real QR code
    const testQRString = `${window.location.origin}/qr-verification?data=${encodeURIComponent(JSON.stringify(testQRData))}`;
    console.log('Testing with QR URL:', testQRString);
    console.log('Test QR Data:', testQRData);
    console.log('Should match submission:', testSubmission);
    handleQRScan(testQRString);
  };

  // Test function with mismatched data
  const handleTestQRScanMismatch = () => {
    const testSubmission = submissions.find(s => s.status === 'pending');
    
    if (!testSubmission) {
      alert('No pending submissions found. Click "Add Test Submission" first.');
      return;
    }

    // Create test QR data with some mismatched information
    const testQRData = {
      docType: 'Document Verification',
      verifiedAt: new Date().toISOString(),
      username: testSubmission.username,
      name: testSubmission.name, // This will match
      dob: testSubmission.dob, // This will match
      mobile: '9999999999', // This will NOT match
      aadhaar: '999999999999', // This will NOT match
      address: testSubmission.address, // This will match
      verificationRequested: {
        name: true,
        age: true,
        mobile: true, // Only these 3 attributes are requested
        // address and aadhaar are not requested, so won't be shown
      }
    };
    
    const testQRString = `${window.location.origin}/qr-verification?data=${encodeURIComponent(JSON.stringify(testQRData))}`;
    console.log('Testing MISMATCH with QR URL:', testQRString);
    handleQRScan(testQRString);
  };

  // Test function with only age verification requested
  const handleTestAgeOnly = () => {
    const testSubmission = submissions.find(s => s.status === 'pending');
    
    if (!testSubmission) {
      alert('No pending submissions found. Click "Add Test Submission" first.');
      return;
    }

    // Create test QR data requesting only age verification
    const testQRData = {
      docType: 'Document Verification',
      verifiedAt: new Date().toISOString(),
      username: testSubmission.username,
      name: testSubmission.name,
      dob: testSubmission.dob,
      mobile: testSubmission.mobile,
      aadhaar: testSubmission.aadhaar,
      address: testSubmission.address,
      verificationRequested: {
        age: true // Only age is requested for verification
      }
    };
    
    const testQRString = `${window.location.origin}/qr-verification?data=${encodeURIComponent(JSON.stringify(testQRData))}`;
    console.log('Testing AGE ONLY with QR URL:', testQRString);
    handleQRScan(testQRString);
  };



  return (
    <Box sx={{ 
      maxWidth: 1400, 
      mx: 'auto', 
      p: 3,
      background: theme.palette.background.default,
      minHeight: '100vh'
    }}>
      {/* Main Content Container */}
      <Box sx={{ 
        backgroundColor: theme.palette.background.paper, 
        borderRadius: 4, 
        p: 4, 
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom align="center" sx={{ 
          fontWeight: 700, 
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 2
        }}>
          Admin Dashboard - Attribute Verification
        </Typography>
        
        {/* Stats Row */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          mb: 2,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Chip 
            label={`Total: ${submissions.length}`} 
            color="primary" 
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
          <Chip 
            label={`Pending: ${submissions.filter(s => s.status === 'pending').length}`} 
            color="warning" 
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
          <Chip 
            label={`Verified: ${submissions.filter(s => s.status === 'verified').length}`} 
            color="success" 
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
          <Chip 
            label={`Rejected: ${submissions.filter(s => s.status === 'rejected').length}`} 
            color="error" 
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        </Box>

        {/* Simple filters */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search by name, username, mobile, aadhaar"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ minWidth: 320 }}
          />
          <Select value={statusFilter} size="small" onChange={(e) => setStatusFilter(e.target.value)}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="verified">Verified</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </Select>
        </Box>

        <Typography variant="caption" color="success.main" sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          mt: 1,
          fontWeight: 600
        }}>
          🔒 All sensitive data is encrypted in storage
        </Typography>
      </Box>

      {/* Action Buttons - Right Aligned */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        alignItems: 'center', 
        mb: 4,
        flexWrap: 'wrap',
        gap: 1
      }}>
        <Button 
          variant="contained" 
          color="secondary" 
          startIcon={<QrCodeScannerIcon />} 
          onClick={handleScanQR} 
          sx={{ 
            fontWeight: 600,
            borderRadius: 2,
            px: 3,
            py: 1,
            boxShadow: '0 4px 12px rgba(156, 39, 176, 0.3)',
            '&:hover': {
              boxShadow: '0 6px 16px rgba(156, 39, 176, 0.4)',
            }
          }}
        >
          Scan QR to Validate
        </Button>
        
        <Button 
          variant="outlined" 
          color="info" 
          onClick={addTestSubmission} 
          sx={{ 
            fontWeight: 600,
            borderRadius: 2,
            px: 2,
            py: 1
          }}
        >
          Add Test Submission
        </Button>
        
        <Button 
          variant="outlined" 
          color="info" 
          onClick={handleTestQRScan} 
          sx={{ 
            fontWeight: 600,
            borderRadius: 2,
            px: 2,
            py: 1
          }}
        >
          Test QR Scan
        </Button>
        
        <Button 
          variant="outlined" 
          color={showSensitiveData ? "warning" : "secondary"} 
          onClick={() => setShowSensitiveData(!showSensitiveData)} 
          sx={{ 
            fontWeight: 600,
            borderRadius: 2,
            px: 2,
            py: 1
          }}
        >
          {showSensitiveData ? '🔓 Hide' : '🔒 Show'} Data
        </Button>
        
        <Button 
          variant="outlined" 
          color="primary" 
          startIcon={<SettingsIcon />} 
          onClick={handleOpenPwDialog} 
          sx={{ 
            fontWeight: 600,
            borderRadius: 2,
            px: 2,
            py: 1
          }}
        >
          Settings
        </Button>
        
        <Button 
          variant="outlined" 
          color="error" 
          startIcon={<LogoutIcon />} 
          onClick={handleLogout} 
          sx={{ 
            fontWeight: 600,
            borderRadius: 2,
            px: 2,
            py: 1
          }}
        >
          Logout
        </Button>
      </Box>

      {submissions.length === 0 ? (
        <Box sx={{ 
          textAlign: 'center', 
          py: 8,
          px: 4,
          backgroundColor: 'rgba(99,102,241,0.02)',
          borderRadius: 3,
          border: '2px dashed rgba(99,102,241,0.2)'
        }}>
          <Typography variant="h5" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
            📋 No Submissions Yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Submissions will appear here when users upload their documents.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            💡 Try clicking "Add Test Submission" to see how it works!
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {submissions
            .filter((s) => statusFilter === 'all' ? true : s.status === statusFilter)
            .filter((s) => {
              const q = search.toLowerCase().trim();
              if (!q) return true;
              return (
                s.name?.toLowerCase().includes(q) ||
                s.username?.toLowerCase().includes(q) ||
                s.mobile?.toLowerCase().includes(q) ||
                s.aadhaar?.toLowerCase().includes(q)
              );
            })
            .map((submission) => (
          <Grid item xs={12} md={6} lg={4} key={submission.id}>
            <Card 
              elevation={6} 
              sx={{ 
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(99,102,241,0.12)',
                transition: 'all 0.3s ease-in-out',
                border: '1px solid rgba(99,102,241,0.1)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(99,102,241,0.2)',
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                {/* Header with Name and Status */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, flex: 1, mr: 1 }}>
                    {showSensitiveData ? submission.name : maskSensitiveData(submission.name, 'name')}
                  </Typography>
                  <Chip
                    label={submission.status.toUpperCase()}
                    size="small"
                    color={
                      submission.status === 'verified' ? 'success' :
                      submission.status === 'rejected' ? 'error' : 'warning'
                    }
                    icon={
                      submission.status === 'verified' ? <VerifiedUserIcon sx={{ fontSize: '16px !important' }} /> :
                      submission.status === 'rejected' ? <ErrorIcon sx={{ fontSize: '16px !important' }} /> : null
                    }
                    sx={{ fontWeight: 600 }}
                  />
                </Box>

                {/* User Details */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="primary" sx={{ fontWeight: 600, mb: 1 }}>
                    @{submission.username}
                  </Typography>
                  
                  <Box sx={{ display: 'grid', gap: 0.5 }}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                      <strong>DOB:</strong>&nbsp;
                      {showSensitiveData ? submission.dob : (submission.dob !== 'N/A' ? '****' : 'N/A')}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                      <strong>Mobile:</strong>&nbsp;
                      {showSensitiveData ? submission.mobile : maskSensitiveData(submission.mobile, 'mobile')}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                      <strong>Aadhaar:</strong>&nbsp;
                      {showSensitiveData ? submission.aadhaar : maskSensitiveData(submission.aadhaar, 'aadhaar')}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <strong>Address:</strong>&nbsp;
                      <span style={{ wordBreak: 'break-word' }}>
                        {showSensitiveData ? submission.address : maskSensitiveData(submission.address, 'address')}
                      </span>
                    </Typography>
                  </Box>
                </Box>

                {/* Timestamp */}
                {submission.submittedAt && (
                  <Typography variant="caption" color="text.secondary" sx={{ 
                    display: 'block', 
                    mb: 2,
                    fontStyle: 'italic',
                    textAlign: 'center',
                    py: 1,
                    px: 2,
                    backgroundColor: 'rgba(0,0,0,0.03)',
                    borderRadius: 1
                  }}>
                    📅 Submitted: {new Date(submission.submittedAt).toLocaleString()}
                  </Typography>
                )}

                {/* Action Button */}
                <Button 
                  variant="contained" 
                  fullWidth
                  onClick={() => handleView(submission)}
                  sx={{ 
                    mt: 1,
                    borderRadius: 2,
                    fontWeight: 600,
                    py: 1.5,
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1976D2 30%, #0288D1 90%)',
                    }
                  }}
                >
                  View & Verify
                </Button>
              </CardContent>
            </Card>
          </Grid>
          ))}
        </Grid>
      )}

      {/* View & Verify Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Verify Attributes</DialogTitle>
        <DialogContent>
          {selected && (
            <Box>
              <Typography variant="h6">{selected.name}</Typography>
              <Typography variant="body2" color="text.secondary">Username: {selected.username}</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>DOB: {selected.dob}</Typography>
              <Typography variant="body2">Address: {selected.address}</Typography>
              <Typography variant="body2">Mobile: {selected.mobile}</Typography>
              <Typography variant="body2">Aadhaar: {selected.aadhaar}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleReject} color="error" variant="outlined">Reject</Button>
          <Button onClick={handleVerify} color="success" variant="contained">Verify</Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={pwDialogOpen} onClose={() => setPwDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Change Admin Password</DialogTitle>
        <DialogContent>
          <TextField
            label="New Password"
            type="password"
            fullWidth
            margin="normal"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            error={!!pwError}
            helperText={pwError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPwDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleChangePassword} variant="contained">Change</Button>
        </DialogActions>
      </Dialog>

      {/* QR Scanner Dialog */}
      <Dialog open={qrDialogOpen} onClose={closeQRDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ 
          textAlign: 'center', 
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          color: 'white',
          fontWeight: 600
        }}>
          🔍 QR Code Verification
        </DialogTitle>
        <DialogContent>
          {!qrValidationResult && (
            <Box sx={{ width: '100%', maxWidth: 400, mx: 'auto' }}>
              {cameraError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Camera Error:</strong> {cameraError}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Please ensure:
                  </Typography>
                  <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                    <li>Camera permissions are granted</li>
                    <li>No other app is using the camera</li>
                    <li>You're using HTTPS or localhost</li>
                  </ul>
                </Alert>
              )}
              
              {!cameraError && (
                <Box sx={{ position: 'relative' }}>
                  <QRScannerErrorBoundary>
                    <QrScanner
                      delay={300}
                      onError={handleQRError}
                      onScan={handleQRScan}
                      onLoad={handleScannerLoad}
                      style={{ width: '100%' }}
                      constraints={{ 
                        video: { 
                          facingMode: 'environment',
                          width: { ideal: 640 },
                          height: { ideal: 480 }
                        } 
                      }}
                    />
                  </QRScannerErrorBoundary>
                  {!scannerReady && !cameraError && (
                    <Box sx={{ 
                      position: 'absolute', 
                      top: '50%', 
                      left: '50%', 
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center'
                    }}>
                      <CircularProgress />
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Loading camera...
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
              
              <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
                Point your camera at a QR code to validate user attributes.
              </Typography>
              
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={handleTestQRScan}
                  sx={{ mr: 1 }}
                  color="success"
                >
                  Test Valid QR
                </Button>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={handleTestQRScanMismatch}
                  sx={{ mr: 1 }}
                  color="warning"
                >
                  Test Mismatch QR
                </Button>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={handleTestAgeOnly}
                  sx={{ mr: 1 }}
                  color="info"
                >
                  Test Age Only
                </Button>
                <Button 
                  variant="text" 
                  size="small" 
                  onClick={() => {
                    setCameraError(null);
                    setScannerReady(false);
                    setQrValidationResult(null);
                  }}
                  sx={{ mr: 1 }}
                >
                  Retry Camera
                </Button>
                <Button 
                  variant="text" 
                  size="small" 
                  onClick={() => setShowManualInput(!showManualInput)}
                >
                  {showManualInput ? 'Hide' : 'Show'} Manual Input
                </Button>
              </Box>
              
              {/* Always show manual input as fallback */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, textAlign: 'center', color: 'text.secondary' }}>
                  Or paste QR data manually:
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={showManualInput ? 4 : 2}
                  label="Paste QR Data or URL"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Paste the QR code data or URL here..."
                  sx={{ mb: 2 }}
                  size={showManualInput ? 'medium' : 'small'}
                />
                <Button 
                  variant="contained" 
                  onClick={handleManualValidation}
                  disabled={!manualInput.trim()}
                  fullWidth
                  size="small"
                >
                  Validate Manual Input
                </Button>
              </Box>
            </Box>
          )}

          {qrValidationResult && (
            <Box sx={{ mt: 2 }}>
              <Alert 
                severity={qrValidationResult.isValid ? 'success' : 'error'}
                icon={qrValidationResult.isValid ? <CheckCircleIcon /> : <CancelIcon />}
                sx={{ mb: 2 }}
              >
                {qrValidationResult.message}
              </Alert>



              {qrValidationResult.attributeVerification && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#1976d2', textAlign: 'center' }}>
                    🔍 Attribute Verification Results
                  </Typography>
                  
                  {Object.entries(qrValidationResult.attributeVerification)
                    .filter(([, details]) => details.requested).length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {Object.entries(qrValidationResult.attributeVerification)
                        .filter(([, details]) => details.requested)
                        .map(([attribute, details]) => (
                        <Card 
                          key={attribute}
                          variant="outlined" 
                          sx={{ 
                            p: 3,
                            border: details.verified ? '2px solid #4caf50' : '2px solid #f44336',
                            backgroundColor: details.verified ? 'rgba(76, 175, 80, 0.08)' : 'rgba(244, 67, 54, 0.08)',
                            borderRadius: 3,
                            textAlign: 'center'
                          }}
                        >
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            {details.verified ? (
                              <CheckCircleIcon sx={{ color: '#4caf50', fontSize: '3rem' }} />
                            ) : (
                              <CancelIcon sx={{ color: '#f44336', fontSize: '3rem' }} />
                            )}
                            
                            <Typography variant="h5" sx={{ fontWeight: 600, textTransform: 'capitalize', color: '#424242' }}>
                              {attribute === 'age' ? 'Age/Date of Birth' : attribute}
                            </Typography>
                            
                            <Chip 
                              label={details.verified ? 'VERIFIED' : 'VERIFICATION FAILED'} 
                              size="large"
                              color={details.verified ? 'success' : 'error'}
                              sx={{ 
                                fontWeight: 700,
                                fontSize: '1rem',
                                px: 3,
                                py: 1
                              }}
                            />
                            
                            <Typography variant="body1" sx={{ 
                              color: details.verified ? '#2e7d32' : '#d32f2f',
                              fontWeight: 500,
                              mt: 1
                            }}>
                              {details.verified 
                                ? '✅ This attribute has been successfully verified against stored records'
                                : '❌ This attribute does not match the stored records'
                              }
                            </Typography>
                          </Box>
                        </Card>
                      ))}
                    </Box>
                  ) : (
                    <Alert severity="info" sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        ℹ️ No Specific Verification Requested
                      </Typography>
                      <Typography variant="body2">
                        This QR code does not contain any specific attribute verification requests.
                      </Typography>
                    </Alert>
                  )}
                </Box>
              )}


            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeQRDialog}>
            {qrValidationResult ? 'Close' : 'Cancel'}
          </Button>
          {qrValidationResult && !qrValidationResult.isValid && (
            <Button 
              onClick={() => {
                setQrValidationResult(null);
                setScannedData(null);
              }} 
              variant="outlined"
            >
              Scan Again
            </Button>
          )}
        </DialogActions>
      </Dialog>
      </Box> {/* End Main Content Container */}
    </Box>
  );
};

export default AdminDashboard;
