import React, { useState, useRef, useEffect } from "react";
import * as faceapi from "face-api.js";
import { 
  Box, Button, Typography, IconButton, CircularProgress, 
  Alert, useTheme, Chip 
} from "@mui/material";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ReactWebcam from "react-webcam";
import { styled } from '@mui/material/styles';
import ocrApiService from './ocrApiService'; // Import the API service

const VisuallyHiddenInput = styled('input')({
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const DocumentScanner = ({ onFaceScanned, modelsLoaded, loadingError, hashVerificationError }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const theme = useTheme();

  const [scannedFaceDescriptor, setScannedFaceDescriptor] = useState(null);
  const [scannedFaceImage, setScannedFaceImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [apiHealth, setApiHealth] = useState(null);

  const webcamRef = useRef(null);
  const imageRef = useRef(null);

  // Check API health on component mount
  useEffect(() => {
    checkApiHealth();
  }, []);

  useEffect(() => {
    if (loadingError || hashVerificationError) {
      setScanError(loadingError || hashVerificationError);
    } else if (modelsLoaded && scanError) {
      setScanError(null);
    }
  }, [modelsLoaded, loadingError, hashVerificationError, scanError]);

  const checkApiHealth = async () => {
    try {
      const health = await ocrApiService.healthCheck();
      setApiHealth(health);
      console.log('API Health:', health);
    } catch (error) {
      console.error('API health check failed:', error);
      setApiHealth({ status: 'unhealthy', error: error.message });
    }
  };

  /**
   * Perform OCR using Flask Backend API
   * @param {File|string} source - File object or data URL
   * @returns {Promise<Object>} Extracted data
   */
  const performOCR = async (source) => {
    setOcrProcessing(true);
    setScanError(null);

    try {
      console.log('Starting OCR extraction via API...');
      
      let apiResponse;
      
      // Check if source is a File or data URL
      if (source instanceof File) {
        apiResponse = await ocrApiService.extractFromFile(source, true);
      } else if (typeof source === 'string') {
        // Data URL from webcam
        apiResponse = await ocrApiService.extractFromDataUrl(source, true);
      } else {
        throw new Error('Invalid source type for OCR');
      }

      console.log('API Response:', apiResponse);

      // Format the response
      const formattedData = ocrApiService.formatExtractedData(apiResponse);
      
      if (!formattedData) {
        throw new Error('Failed to format extracted data');
      }

      setExtractedData(formattedData);
      console.log('Formatted Extracted Data:', formattedData);

      return formattedData;
    } catch (error) {
      console.error('OCR API Error:', error);
      setScanError(`OCR Failed: ${error.message}`);
      return null;
    } finally {
      setOcrProcessing(false);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setProcessing(true);
      setScanError(null);
      setExtractedData(null);
      setUploadedFile(file);
      setImageSrc(URL.createObjectURL(file));
      setIsCameraActive(false);

      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = async () => {
        imageRef.current = img;
        await scanDocumentForFace(img, file);
        setProcessing(false);
      };
      img.onerror = () => {
        setScanError("Failed to load image. Please try again.");
        setProcessing(false);
      };
    }
  };

  const capturePhoto = async () => {
    if (webcamRef.current) {
      setProcessing(true);
      setScanError(null);
      setExtractedData(null);
      
      const screenshot = webcamRef.current.getScreenshot();
      setImageSrc(screenshot);
      setIsCameraActive(false);

      const img = new Image();
      img.src = screenshot;
      img.onload = async () => {
        imageRef.current = img;
        await scanDocumentForFace(img, screenshot);
        setProcessing(false);
      };
      img.onerror = () => {
        setScanError("Failed to capture image. Please try again.");
        setProcessing(false);
      };
    }
  };

  const scanDocumentForFace = async (img, source) => {
    if (!modelsLoaded) {
      setScanError("Face detection models not loaded yet. Please wait.");
      return;
    }

    try {
      // Step 1: Detect face using face-api.js
      console.log('Detecting face...');
      const detections = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detections) {
        setScanError("No face detected in the document. Please try a different image.");
        setScannedFaceDescriptor(null);
        setScannedFaceImage(null);
        setExtractedData(null);
        return;
      }

      console.log('Face detected successfully');
      setScannedFaceDescriptor(detections.descriptor);

      // Extract face image from the detected box
      const box = detections.detection.box;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = box.width;
      tempCanvas.height = box.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(
        img, 
        box.x, box.y, box.width, box.height, 
        0, 0, box.width, box.height
      );
      const faceImage = tempCanvas.toDataURL('image/jpeg');
      setScannedFaceImage(faceImage);

      // Step 2: Perform OCR via Flask API
      console.log('Extracting document data via API...');
      const ocrData = await performOCR(source);

      if (ocrData) {
        console.log("DocumentScanner: OCR Data prepared for onFaceScanned:", ocrData);
        setScanError(null);
        
        // Pass data to parent component
        onFaceScanned(detections.descriptor, faceImage, ocrData);
      }
    } catch (error) {
      console.error("Error scanning document for face:", error);
      setScanError(`Scanning error: ${error.message}`);
    }
  };

  const toggleCameraMode = () => {
    setIsCameraActive(prev => !prev);
    setImageSrc(null);
    setUploadedFile(null);
    setScannedFaceDescriptor(null);
    setScannedFaceImage(null);
    setExtractedData(null);
    setScanError(null);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: theme.palette.background.default,
        padding: "20px",
        gap: 3,
      }}
    >
      <Typography variant="h4" sx={{ color: "#333", fontWeight: "bold", mb: 2 }}>
        Upload or Capture Government ID
      </Typography>

      {/* API Health Status */}
      {apiHealth && (
        <Chip 
          label={`API: ${apiHealth.status === 'healthy' ? 'Online' : 'Offline'}`}
          color={apiHealth.status === 'healthy' ? 'success' : 'error'}
          size="small"
          sx={{ mb: 1 }}
        />
      )}

      {(loadingError || hashVerificationError) && (
        <Alert severity="error" sx={{ width: '100%', maxWidth: '500px', mb: 2 }}>
          {loadingError || hashVerificationError}
        </Alert>
      )}

      {!modelsLoaded && !loadingError && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
          <CircularProgress size={20} />
          <Typography variant="body1">Loading face detection models...</Typography>
        </Box>
      )}

      {scanError && (
        <Alert 
          severity="error" 
          sx={{ width: '100%', maxWidth: '500px', mb: 2 }}
          icon={<ErrorIcon />}
        >
          {scanError}
        </Alert>
      )}

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          backgroundColor: theme.palette.background.paper,
          boxShadow: 3,
          borderRadius: "12px",
          padding: "30px",
          width: "100%",
          maxWidth: "500px",
          alignItems: "center",
        }}
      >
        {!isCameraActive ? (
          <>
            <Button
              component="label"
              variant="contained"
              startIcon={<CloudUploadIcon />}
              sx={{ width: "100%", padding: "12px", fontSize: "16px", borderRadius: "8px" }}
              disabled={!modelsLoaded || processing || apiHealth?.status !== 'healthy'}
            >
              Upload Document Image
              <VisuallyHiddenInput 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
            </Button>
            <Typography variant="body2" sx={{ color: "text.secondary", my: 1 }}>
              OR
            </Typography>
            <Button
              variant="outlined"
              startIcon={<CameraAltIcon />}
              onClick={toggleCameraMode}
              sx={{ width: "100%", padding: "12px", fontSize: "16px", borderRadius: "8px" }}
              disabled={!modelsLoaded || processing || apiHealth?.status !== 'healthy'}
            >
              Capture Document with Camera
            </Button>
          </>
        ) : (
          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: "300px",
              borderRadius: "12px",
              overflow: "hidden",
              border: "2px solid #ddd",
            }}
          >
            <ReactWebcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "environment" }}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <IconButton
              onClick={capturePhoto}
              disabled={processing || !modelsLoaded}
              sx={{ 
                position: "absolute", 
                bottom: 10, 
                left: '50%', 
                transform: 'translateX(-50%)', 
                backgroundColor: 'rgba(0,0,0,0.5)', 
                color: 'white', 
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)'} 
              }}
            >
              <CameraAltIcon sx={{ fontSize: 40 }} />
            </IconButton>
            <Button 
              variant="text" 
              onClick={toggleCameraMode} 
              sx={{ 
                position: "absolute", 
                top: 10, 
                right: 10, 
                color: 'white', 
                backgroundColor: 'rgba(0,0,0,0.5)' 
              }}
            >
              Cancel
            </Button>
          </Box>
        )}

        {imageSrc && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Preview:</Typography>
            <img 
              src={imageSrc} 
              alt="Document Preview" 
              style={{ maxWidth: "100%", maxHeight: "250px", borderRadius: "8px" }} 
            />
          </Box>
        )}

        {(processing || ocrProcessing) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
            <CircularProgress size={24} />
            <Typography variant="body1">
              {ocrProcessing ? "Extracting text via AI..." : "Scanning for face..."}
            </Typography>
          </Box>
        )}

        {scannedFaceDescriptor && !processing && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1, color: 'green' }}>
            <CheckCircleIcon />
            <Typography variant="body1">Face Scanned Successfully!</Typography>
          </Box>
        )}

        {scannedFaceImage && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Extracted Face:</Typography>
            <img 
              src={scannedFaceImage} 
              alt="Extracted Face" 
              style={{ 
                width: "150px", 
                height: "150px", 
                borderRadius: "50%", 
                border: "2px solid #006FB9",
                objectFit: "cover"
              }} 
            />
          </Box>
        )}

        {/* Enhanced Extracted Data Display */}
        {extractedData && (
          <Box 
            sx={{ 
              mt: 2, 
              width: '100%', 
              backgroundColor: theme.palette.mode === "dark" 
                ? "rgba(255, 255, 255, 0.05)" 
                : "#f8f9fa", 
              padding: 2, 
              borderRadius: '8px', 
              border: `1px solid ${theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : '#e9ecef'}` 
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, color: '#006FB9', fontWeight: 'bold' }}>
              Extracted Information
            </Typography>

            {/* Document Type Badge */}
            {extractedData.documentType && extractedData.documentType !== 'unknown' && (
              <Chip 
                label={extractedData.documentType.toUpperCase().replace('_', ' ')}
                color="primary"
                size="small"
                sx={{ mb: 2 }}
              />
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <DataRow label="Name" value={extractedData.name} />
              <DataRow label="Date of Birth" value={extractedData.dob} />
              <DataRow label="Age" value={extractedData.age} />
              <DataRow label="Gender" value={extractedData.gender} />
              
              {extractedData.fatherName && extractedData.fatherName !== 'Not found' && (
                <DataRow label="Father's Name" value={extractedData.fatherName} />
              )}
              
              {extractedData.bloodGroup && extractedData.bloodGroup !== 'Not found' && (
                <DataRow label="Blood Group" value={extractedData.bloodGroup} />
              )}
              
              <DataRow label="Address" value={extractedData.address} multiline />
              
              {extractedData.pinCode && extractedData.pinCode !== 'Not found' && (
                <DataRow label="PIN Code" value={extractedData.pinCode} />
              )}
              
              {extractedData.state && extractedData.state !== 'Not found' && (
                <DataRow label="State" value={extractedData.state} />
              )}
              
              {/* Document-specific fields */}
              {extractedData.aadharNumber && (
                <DataRow label="Aadhaar Number" value={extractedData.aadharNumber} />
              )}
              
              {extractedData.panNumber && (
                <DataRow label="PAN Number" value={extractedData.panNumber} />
              )}
              
              {extractedData.dlNumber && (
                <DataRow label="DL Number" value={extractedData.dlNumber} />
              )}
              
              {extractedData.issueDate && extractedData.issueDate !== 'Not found' && (
                <DataRow label="Issue Date" value={extractedData.issueDate} />
              )}
              
              {extractedData.validity && extractedData.validity !== 'Not found' && (
                <DataRow label="Validity" value={extractedData.validity} />
              )}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

// Helper component for data rows
const DataRow = ({ label, value, multiline = false }) => (
  <Box>
    <Typography variant="body2" component="span" sx={{ fontWeight: 'bold', color: '#555' }}>
      {label}:{' '}
    </Typography>
    <Typography 
      variant="body2" 
      component="span" 
      sx={{ 
        color: value === 'Not found' ? 'red' : '#333',
        fontStyle: value === 'Not found' ? 'italic' : 'normal',
        wordBreak: multiline ? 'break-word' : 'normal'
      }}
    >
      {value}
    </Typography>
  </Box>
);

export default DocumentScanner;
