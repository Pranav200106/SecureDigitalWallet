import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Chip,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  UploadFile,
  QrCode2,
  LocationOn,
  Person,
  VerifiedUser,
  Add,
  GppGood,
  ErrorOutline
} from '@mui/icons-material';
import { keyframes } from '@emotion/react';
import { AuthContext } from './AuthContext';
import {
  processDocumentImage,
  generateCustomVerificationQR,
  calculateAge,
  hasUserDocument,
  getUserDocument,

} from '../utils/documentUtils';
import { submissionStore } from '../utils/submissionStore';

// Animation for a modern feel
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Dashboard = () => {
  const { currentUser } = useContext(AuthContext);
  const [hasDocument, setHasDocument] = useState(false);
  const [documentData, setDocumentData] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(true); // Start loading until check is complete
  const [error, setError] = useState('');
  const [selectedAttributes, setSelectedAttributes] = useState({
    name: false,
    age: false,
    address: false,
  });

  useEffect(() => {
    const loadDocument = async () => {
      if (currentUser) {
        setLoading(true);
        const hasDoc = await hasUserDocument(currentUser.username);
        if (hasDoc) {
          const docData = await getUserDocument(currentUser.username);
          setDocumentData(docData);
          setHasDocument(true);
        }
        setLoading(false);
      }
    };
    loadDocument();
  }, [currentUser]);
  
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      console.log('🚀 [UPLOAD START] File:', file.name, 'Size:', file.size, 'Type:', file.type);
      console.log('🚀 [UPLOAD START] Username:', currentUser.username);
      
      console.log('📄 [STEP 1] Starting OCR processing...');
      const processedData = await processDocumentImage(file, currentUser.username);
      console.log('✅ [STEP 1 COMPLETE] OCR processing finished');
      console.log('📊 [STEP 1 DATA]', JSON.stringify(processedData, null, 2));
      
      // CRITICAL FIX: Wait for submission to be saved to Firebase
      console.log('📤 [STEP 2] Submitting to admin queue...');
      console.log('📤 [STEP 2] Data to submit:', processedData);
      
      await submissionStore.addSubmission(processedData);
      
      console.log('✅ [STEP 2 COMPLETE] Submission saved to Firebase successfully');
      
      setDocumentData(processedData);
      setHasDocument(true);
      setUploadDialogOpen(false);
      
      console.log('✅ [UPLOAD COMPLETE] Document processed and added to admin submissions');
      
      setTimeout(() => {
        alert('Document uploaded successfully! Your data has been encrypted and submitted to an admin for verification. You can now generate QR codes.');
      }, 500);
    } catch (err) {
      console.error('❌ [UPLOAD FAILED] Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
        fullError: err
      });
      setError(`Failed to process document: ${err.message}`);
    } finally {
      setLoading(false);
      console.log('🏁 [UPLOAD END] Loading state cleared');
    }
  };

  const handleAttributeChange = (attribute) => {
    setSelectedAttributes((prev) => ({
      ...prev,
      [attribute]: !prev[attribute],
    }));
  };

  const generateCustomQR = async () => {
    const selectedCount = Object.values(selectedAttributes).filter(Boolean).length;
    if (selectedCount === 0) {
      setError('Please select at least one attribute to generate a QR code.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const qrCodeDataURL = await generateCustomVerificationQR(documentData, selectedAttributes);
      setQrCode(qrCodeDataURL);
      setQrDialogOpen(true);
    } catch (err) {
      setError('Failed to generate QR code.');
    } finally {
      setLoading(false);
    }
  };

  const cardStyles = {
    p: { xs: 2, sm: 4 },
    borderRadius: '24px',
    boxShadow: '0 8px 40px -12px rgba(0,0,0,0.1)',
    border: '1px solid',
    borderColor: 'divider',
    animation: `${fadeIn} 0.5s ease-out`,
    background: (theme) => theme.palette.mode === 'dark' ? 'rgba(33, 41, 54, 0.7)' : 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(20px)',
  };

  if (loading && !documentData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      <Stack spacing={2} sx={{ mb: 4, textAlign: 'center', animation: `${fadeIn} 0.5s ease-out` }}>
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
          User Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Welcome back, <Box component="span" sx={{ color: 'primary.main', fontWeight: '600' }}>{currentUser?.username}</Box>!
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Main Status & Action Card */}
      <Paper sx={cardStyles}>
        {!hasDocument ? (
          // State 1: No Document Uploaded
          <Stack spacing={3} alignItems="center" sx={{ textAlign: 'center', py: 4 }}>
            <ErrorOutline color="warning" sx={{ fontSize: 60 }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>Verification Required</Typography>
            <Typography color="text.secondary" sx={{ maxWidth: '450px' }}>
              To access verification features, please upload a government-issued ID like an Aadhaar card.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 2 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<UploadFile />}
                onClick={() => setUploadDialogOpen(true)}
                sx={{ borderRadius: '16px', px: 4, py: 1.5, textTransform: 'none', fontSize: '1rem' }}
              >
                Upload Document
              </Button>
            </Stack>
          </Stack>
        ) : (
          // State 2: Document Uploaded
          <Stack spacing={4}>
            {/* Header section */}
            <Box sx={{ textAlign: 'center' }}>
              <GppGood color="success" sx={{ fontSize: 60, mb: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 600 }}>Document Verified</Typography>
              <Typography color="text.secondary">
                Your document is ready. You can now generate verification QR codes or view details.
              </Typography>
              <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
                <Chip label={documentData.name} icon={<Person />} variant="outlined" color="primary" />
                <Chip label={`${calculateAge(documentData.dob)} Years Old`} variant="outlined" color="secondary" />
              </Stack>
            </Box>

            <Divider />

            {/* Actions section */}
            <Grid container spacing={4}>
              {/* Generate QR */}
              <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                    <QrCode2 sx={{ verticalAlign: 'bottom', mr: 1 }} />
                    Generate Verification QR
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Select which attributes you want to prove to a verifier.
                  </Typography>
                  <FormGroup>
                    {['name', 'age', 'address'].map((attr) => (
                      <FormControlLabel
                        key={attr}
                        control={<Checkbox checked={selectedAttributes[attr]} onChange={() => handleAttributeChange(attr)} />}
                        label={`${attr.charAt(0).toUpperCase() + attr.slice(1)} Verification`}
                        sx={{ '&:hover': { bgcolor: 'action.hover' }, borderRadius: '8px', p: 0.5 }}
                      />
                    ))}
                  </FormGroup>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<QrCode2 />}
                    onClick={generateCustomQR}
                    disabled={loading || Object.values(selectedAttributes).every(v => !v)}
                    sx={{ borderRadius: '12px', textTransform: 'none', fontSize: '1rem' }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Generate QR'}
                  </Button>
                </Stack>
              </Grid>

              {/* View Address */}
              <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                    <LocationOn sx={{ verticalAlign: 'bottom', mr: 1 }} />
                    View Document Details
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Check your securely stored address and other information from your document.
                  </Typography>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<LocationOn />}
                    onClick={() => setAddressDialogOpen(true)}
                    sx={{ borderRadius: '12px', textTransform: 'none', fontSize: '1rem', mt: 'auto' }}
                  >
                    Show Details
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        )}
      </Paper>

      {/* Dialogs */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <UploadFile sx={{ mr: 1 }} /> Upload Document
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ py: 3 }}>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Please select a clear image of your document. Your data will be processed securely and encrypted.
          </Typography>
          <Button variant="outlined" component="label" fullWidth disabled={loading} sx={{ py: 2, borderRadius: '12px' }}>
            {loading ? <CircularProgress size={24} /> : 'Choose Image File'}
            <input type="file" hidden accept="image/*" onChange={handleFileUpload} />
          </Button>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={qrDialogOpen} onClose={() => setQrDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <QrCode2 sx={{ mr: 1 }} /> Verification QR Code
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ py: 3, textAlign: 'center' }}>
          {qrCode && <img src={qrCode} alt="Verification QR Code" style={{ maxWidth: '100%', borderRadius: '16px' }} />}
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            A verifier can scan this to confirm the attributes you selected.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setQrDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      
      <Dialog open={addressDialogOpen} onClose={() => setAddressDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <LocationOn sx={{ mr: 1 }} /> Document Details
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ py: 3 }}>
          {documentData && (
            <List>
              <ListItem>
                <ListItemText primary="Name" secondary={documentData.name} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Date of Birth" secondary={`${documentData.dob} (${calculateAge(documentData.dob)} years old)`} />
              </ListItem>
               <ListItem>
                <ListItemText primary="Mobile" secondary={documentData.mobile} />
              </ListItem>
               <ListItem>
                <ListItemText primary="Aadhaar" secondary={documentData.aadhaar} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Address" secondary={documentData.address} secondaryTypographyProps={{ style: { whiteSpace: 'pre-line' } }}/>
              </ListItem>
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAddressDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;