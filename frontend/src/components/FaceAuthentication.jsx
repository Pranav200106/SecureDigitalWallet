// src/components/FaceAuthentication.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import * as faceapi from "face-api.js";
import { Box, Button, Typography, Alert, CircularProgress, Card, CardContent, Divider, Snackbar, useTheme, useMediaQuery } from "@mui/material";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import LightModeIcon from "@mui/icons-material/LightMode";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import PersonIcon from "@mui/icons-material/Person";
import CakeIcon from "@mui/icons-material/Cake";
import HomeIcon from "@mui/icons-material/Home";
import ReactWebcam from "react-webcam";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import VideocamIcon from "@mui/icons-material/Videocam";
import { motion } from "framer-motion";


const FaceAuthentication = ({
  onAuthenticated,
  scannedIdFaceDescriptor,
  scannedIdFaceImage,
  extractedDocumentData, // NEW PROP: Data extracted from document (name, dob, age, address)
  modelsLoaded,
  loadingError,
  hashVerificationError
}) => {
  // --- ADD THIS CONSOLE LOG ---
  console.log("FaceAuthentication: Received extractedDocumentData prop:", extractedDocumentData);

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facesStatus, setFacesStatus] = useState("no-face");
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [comparisonResult, setComparisonResult] = useState(null); // null, 'match', 'no-match'

  const webcamRef = useRef(null);
  const intervalRef = useRef(null);

  const toggleCamera = () => {
    setIsCameraEnabled(!isCameraEnabled);
    if (!isCameraEnabled) {
      setFacesStatus("no-face");
    }
  };

  useEffect(() => {
    const checkCameraAccess = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        setCameraError(null);
      } catch (err) {
        setCameraError("Camera access denied. Please allow access to your camera.");
      }
    };
    checkCameraAccess();
  }, []);

  const analyzeTexture = async (image) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const grayscale = new Uint8Array(imageData.width * imageData.height);

    for (let i = 0; i < imageData.data.length; i += 4) {
      const avg = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
      grayscale[i / 4] = avg;
    }

    const lbpHistogram = new Array(256).fill(0);

    for (let y = 1; y < imageData.height - 1; y++) {
      for (let x = 1; x < imageData.width - 1; x++) {
        const centerIdx = y * imageData.width + x;
        const centerValue = grayscale[centerIdx];

        let binaryPattern = 0;
        let bitPos = 0;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;

            const neighborIdx = (y + dy) * imageData.width + (x + dx);
            const neighborValue = grayscale[neighborIdx];

            binaryPattern |= (neighborValue >= centerValue ? 1 : 0) << bitPos;
            bitPos++;
          }
        }

        lbpHistogram[binaryPattern]++;
      }
    }

    const totalPixels = (imageData.width - 2) * (imageData.height - 2);
    const normalizedHist = lbpHistogram.map((count) => count / totalPixels);

    const textureScore = normalizedHist.reduce((sum, p) => {
      return p > 0 ? sum - p * Math.log2(p) : sum;
    }, 0);

    return textureScore;
  };

  const handleFaceDetection = useCallback(async () => {
    const videoElement = webcamRef.current?.video;
    if (!videoElement || !modelsLoaded) return;

    try {
      const detections = await faceapi.detectAllFaces(videoElement).withFaceLandmarks();

      if (detections.length === 0) {
        setFacesStatus("no-face");
      } else if (detections.length === 1) {
        setFacesStatus("one-face");
      } else {
        setFacesStatus("multiple-faces");
      }
    } catch (error) {
      console.error("Error during face detection:", error);
    }
  }, [modelsLoaded]);

  useEffect(() => {
    if (isCameraEnabled && modelsLoaded && !cameraError) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(() => {
        handleFaceDetection();
      }, 500);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isCameraEnabled, modelsLoaded, cameraError, handleFaceDetection]);

  const handleAuthentication = async () => {
    if (!scannedIdFaceDescriptor) {
      alert("No ID face data available for comparison. Please go back and scan your ID.");
      return;
    }

    setIsAuthenticating(true);
    setIsProcessing(true);
    setComparisonResult(null);

    try {
      const videoElement = webcamRef.current?.video;
      if (!videoElement) {
        throw new Error("Webcam not ready.");
      }

      const liveImageSrc = webcamRef.current.getScreenshot();
      const liveImg = new Image();
      liveImg.src = liveImageSrc;

      liveImg.onload = async () => {
        try {
          const liveDetections = await faceapi
            .detectSingleFace(liveImg)
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (!liveDetections) {
            alert("No face detected in live feed. Please ensure your face is clearly visible.");
            setIsAuthenticating(false);
            setIsProcessing(false);
            return;
          }

          const textureScore = await analyzeTexture(liveImg);

          if (textureScore < 0.8) {
            alert("Potential spoof detected. Authentication failed.");
            setIsAuthenticating(false);
            setIsProcessing(false);
            return;
          }

          const faceMatcher = new faceapi.FaceMatcher(scannedIdFaceDescriptor, 0.6);
          const match = faceMatcher.findBestMatch(liveDetections.descriptor);

          console.log("Comparison result:", match.toString());

          if (match.distance < 0.6) {
            setComparisonResult('match');
            // Pass the extracted document data along with authentication result
            onAuthenticated("User", { 
              authenticated: true, 
              description: "Face matched with ID.",
              documentData: extractedDocumentData
            });
            alert("Face authentication successful! Face matched with document.");
          } else {
            setComparisonResult('no-match');
            alert("Face authentication failed. Live face does not match the document face.");
          }

        } catch (error) {
          console.error("Authentication/Comparison error:", error);
          alert("Authentication failed. An error occurred during face comparison. Please try again.");
          setComparisonResult('no-match');
        } finally {
          setIsAuthenticating(false);
          setIsProcessing(false);
        }
      };

      liveImg.onerror = () => {
        alert("Failed to load live image. Please try again.");
        setIsAuthenticating(false);
        setIsProcessing(false);
      };

    } catch (error) {
      console.error("Image processing error for live feed:", error);
      alert("Failed to process live image for authentication. Please try again.");
      setIsAuthenticating(false);
      setIsProcessing(false);
    }
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');

  const showSnackbar = (message, severity = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        minHeight: "100vh",
        backgroundColor: theme.palette.background.default,
        padding: "20px",
        gap: 3,
        flexWrap: "wrap",
      }}
    >
      {/* Left Section - Document Information */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          flex: 1,
          minWidth: "300px",
          maxWidth: "400px",
        }}
      >
        {/* Document Face Card */}
        <Card sx={{ boxShadow: 3, borderRadius: "12px" }}>
          <CardContent>
            <Typography
              variant="h6"
              sx={{
                color: "#333",
                fontWeight: "bold",
                borderBottom: "2px solid #006FB9",
                paddingBottom: "8px",
                marginBottom: "16px",
              }}
            >
              Document Face
            </Typography>

            {scannedIdFaceImage ? (
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <img
                  src={scannedIdFaceImage}
                  alt="Scanned ID Face"
                  style={{ 
                    maxWidth: "120px", 
                    maxHeight: "120px", 
                    borderRadius: "50%", 
                    border: "3px solid #006FB9",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
                  }}
                />
                <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
                  Face extracted from ID
                </Typography>
              </Box>
            ) : (
              <Alert severity="warning">
                No document face found. Please go back to the previous step.
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Document Details Card */}
        <Card sx={{ boxShadow: 3, borderRadius: "12px" }}>
          <CardContent>
            <Typography
              variant="h6"
              sx={{
                color: "#333",
                fontWeight: "bold",
                borderBottom: "2px solid #006FB9",
                paddingBottom: "8px",
                marginBottom: "16px",
              }}
            >
              Document Information
            </Typography>

            {extractedDocumentData ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PersonIcon sx={{ color: "#006FB9", fontSize: "20px" }} />
                  <Box>
                    <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "12px" }}>
                      Full Name
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: "500" }}>
                      {extractedDocumentData.name !== 'Not found' ? extractedDocumentData.name : 'Not available'}
                    </Typography>
                  </Box>
                </Box>

                <Divider />

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CakeIcon sx={{ color: "#006FB9", fontSize: "20px" }} />
                  <Box>
                    <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "12px" }}>
                      Date of Birth
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: "500" }}>
                      {extractedDocumentData.dob !== 'Not found' ? extractedDocumentData.dob : 'Not available'}
                    </Typography>
                    {extractedDocumentData.age !== 'Not found' && (
                      <Typography variant="body2" sx={{ 
                        color: extractedDocumentData.age >= 18 ? "#00C853" : "#f44336", 
                        fontSize: "11px",
                        fontWeight: "bold"
                      }}>
                        {extractedDocumentData.age >= 18 
                          ? `✓ User is above 18 and verified (${extractedDocumentData.age} years)` 
                          : `✗ User is below 18 (${extractedDocumentData.age} years)`
                        }
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Divider />

                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                  <HomeIcon sx={{ color: "#006FB9", fontSize: "20px", mt: 0.5 }} />
                  <Box>
                    <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "12px" }}>
                      Permanent Address
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: "500", lineHeight: 1.4 }}>
                      {extractedDocumentData.address !== 'Not found' ? extractedDocumentData.address : 'Not available'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ) : (
              <Alert severity="info">
                No document information available. Please scan your ID first.
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Status Cards */}
        <Card sx={{ boxShadow: 3, borderRadius: "12px" }}>
          <CardContent>
            <Typography
              variant="h6"
              sx={{
                color: "#333",
                fontWeight: "bold",
                borderBottom: "2px solid #006FB9",
                paddingBottom: "8px",
                marginBottom: "16px",
              }}
            >
              Authentication Status
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* Models Status */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  border: "2px solid",
                  borderColor: modelsLoaded ? "#00C853" : "orange",
                  borderRadius: "8px",
                  padding: "10px",
                  backgroundColor: modelsLoaded ? (theme.palette.mode === 'dark' ? 'rgba(0, 200, 83, 0.1)' : '#f1f8e9') : (theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.1)' : '#fff8e1'),
                }}
              >
                {modelsLoaded ? (
                  <Box sx={{ color: "#00C853", display: "flex", alignItems: "center" }}>
                    <CheckCircleIcon sx={{ mr: 1 }} />
                    <Typography variant="body2">Models Loaded</Typography>
                  </Box>
                ) : (
                  <Box sx={{ color: "orange", display: "flex", alignItems: "center" }}>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    <Typography variant="body2">Loading models...</Typography>
                  </Box>
                )}
              </Box>

              {/* Face Detection Status */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  border: "2px solid",
                  borderColor:
                    facesStatus === "no-face"
                      ? "red"
                      : facesStatus === "multiple-faces"
                      ? "orange"
                      : "#00C853",
                  borderRadius: "8px",
                  padding: "10px",
                  backgroundColor:
                    facesStatus === "no-face"
                      ? "#ffebee"
                      : facesStatus === "multiple-faces"
                      ? "#fff8e1"
                      : "#f1f8e9",
                }}
              >
                {facesStatus === "no-face" && (
                  <Box sx={{ color: "red", display: "flex", alignItems: "center" }}>
                    <WarningIcon sx={{ mr: 1 }} />
                    <Typography variant="body2">No face detected</Typography>
                  </Box>
                )}
                {facesStatus === "multiple-faces" && (
                  <Box sx={{ color: "orange", display: "flex", alignItems: "center" }}>
                    <WarningIcon sx={{ mr: 1 }} />
                    <Typography variant="body2">Multiple faces detected</Typography>
                  </Box>
                )}
                {facesStatus === "one-face" && (
                  <Box sx={{ color: "#00C853", display: "flex", alignItems: "center" }}>
                    <CheckCircleIcon sx={{ mr: 1 }} />
                    <Typography variant="body2">Ready to authenticate</Typography>
                  </Box>
                )}
              </Box>

              {/* Comparison Result */}
              {comparisonResult && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    border: "2px solid",
                    borderColor: comparisonResult === 'match' ? "#00C853" : "red",
                    borderRadius: "8px",
                    padding: "10px",
                    backgroundColor: comparisonResult === "match" ? (theme.palette.mode === "dark" ? "rgba(0, 200, 83, 0.1)" : "#f1f8e9") : (theme.palette.mode === "dark" ? "rgba(244, 67, 54, 0.1)" : "#ffebee"),
                  }}
                >
                  {comparisonResult === 'match' ? (
                    <Box sx={{ color: "#00C853", display: "flex", alignItems: "center" }}>
                      <CheckCircleIcon sx={{ mr: 1 }} />
                      <Typography variant="body2">Face Match Successful!</Typography>
                    </Box>
                  ) : (
                    <Box sx={{ color: "red", display: "flex", alignItems: "center" }}>
                      <ErrorOutlineIcon sx={{ mr: 1 }} />
                      <Typography variant="body2">Face Match Failed</Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Center Section - Live Camera */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          flex: 1,
          minWidth: "400px",
          maxWidth: "500px",
        }}
      >
        <Card sx={{ boxShadow: 3, borderRadius: "12px", width: "100%" }}>
          <CardContent>
            <Typography
              variant="h6"
              sx={{
                color: "#333",
                fontWeight: "bold",
                borderBottom: "2px solid #006FB9",
                paddingBottom: "8px",
                marginBottom: "16px",
                textAlign: "center",
              }}
            >
              Live Face Authentication
            </Typography>

            {cameraError ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "300px",
                  gap: 1,
                }}
              >
                <ErrorOutlineIcon sx={{ color: "#c30010", fontSize: "50px" }} />
                <Typography
                  variant="body2"
                  sx={{
                    color: "#c30010",
                    textAlign: "center",
                    fontWeight: "bold",
                  }}
                >
                  {cameraError}
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  height: "300px",
                  borderRadius: "16px",
                  overflow: "hidden",
                  boxShadow: 2,
                  border: "2px solid #006FB9",
                  marginBottom: "16px",
                }}
              >
                {isCameraEnabled ? (
                  <ReactWebcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{
                      facingMode: "user",
                    }}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '100%',
                      backgroundColor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "#f0f0f0",
                    }}
                  >
                    <Typography variant="body1" color="textSecondary">
                      Camera Disabled
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Control Buttons */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={toggleCamera}
                startIcon={isCameraEnabled ? <VideocamOffIcon /> : <VideocamIcon />}
                sx={{
                  borderRadius: "12px",
                  fontSize: "14px",
                  padding: "8px 16px",
                  textTransform: "none",
                }}
              >
                {isCameraEnabled ? "Disable Camera" : "Enable Camera"}
              </Button>

              <Button
                variant="contained"
                onClick={handleAuthentication}
                disabled={
                  isAuthenticating ||
                  cameraError ||
                  facesStatus !== "one-face" ||
                  !isCameraEnabled ||
                  !modelsLoaded ||
                  !scannedIdFaceDescriptor
                }
                startIcon={isAuthenticating ? <CircularProgress size={24} /> : <CameraAltIcon />}
                sx={{
                  borderRadius: "12px",
                  fontSize: "16px",
                  padding: "12px 24px",
                  textTransform: "none",
                  backgroundColor: "#006FB9",
                  '&:hover': {
                    backgroundColor: "#005a9c",
                  },
                }}
              >
                {isAuthenticating ? "Authenticating..." :
                 !modelsLoaded ? "Waiting for models..." :
                 !scannedIdFaceDescriptor ? "Waiting for ID scan..." :
                 "Compare Faces"}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Right Section - Instructions */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          flex: 1,
          minWidth: "280px",
          maxWidth: "320px",
        }}
      >
        <Card sx={{ boxShadow: 3, borderRadius: "12px" }}>
          <CardContent>
            <Typography
              variant="h6"
              sx={{
                color: "#333",
                fontWeight: "bold",
                borderBottom: "2px solid #006FB9",
                paddingBottom: "8px",
                marginBottom: "16px",
              }}
            >
              Instructions
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <RemoveRedEyeIcon sx={{ color: "#006FB9", fontSize: "20px" }} />
                <Typography variant="body2" sx={{ color: "#333" }}>
                  Look directly at your camera
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CheckCircleIcon sx={{ color: "#006FB9", fontSize: "20px" }} />
                <Typography variant="body2" sx={{ color: "#333" }}>
                  Position your face in the center
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LightModeIcon sx={{ color: "#006FB9", fontSize: "20px" }} />
                <Typography variant="body2" sx={{ color: "#333" }}>
                  Ensure good lighting
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <VisibilityOffIcon sx={{ color: "#006FB9", fontSize: "20px" }} />
                <Typography variant="body2" sx={{ color: "#333" }}>
                  Remove masks or sunglasses
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default FaceAuthentication;