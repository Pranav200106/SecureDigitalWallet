import * as faceapi from "face-api.js";
// import * as CryptoJS from "crypto-js"; // Not needed for local file loading unless you implement custom security
// import localforage from "localforage"; // Not directly needed for faceapi.js loadFromUri on local files
// import axios from "axios"; // Not directly needed for faceapi.js loadFromUri

// Enhanced model loader for local asset loading
export const loadModels = async (setModelsLoaded, setLoadingError, setHashVerificationError) => {
  // IMPORTANT CHANGE: Point to the local 'public/models' directory
  const MODEL_URL = "/models";

  // --- Removed Localforage, CryptoJS, Axios, and custom caching logic ---
  // --- These are generally not needed when serving models directly from the public folder
  // --- unless you have a very specific advanced caching/security requirement.

  // Performance Monitoring Utility (Keep for general load time tracking)
  const performanceMonitor = {
    startTime: null,
    start() {
      this.startTime = performance.now();
    },
    end(label) {
      const duration = performance.now() - this.startTime;
      console.log(`${label} took ${duration.toFixed(2)}ms`);
      return duration;
    }
  };

  try {
    // Start performance tracking
    performanceMonitor.start();

    // Load models from the local MODEL_URL
    // face-api.js will handle fetching the manifest and shard files automatically
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      // If you're using face expression detection:
      // faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      // If you're using age and gender estimation:
      // faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL)
    ]);

    // Mark models as loaded
    setModelsLoaded(true);
    setLoadingError(null); // Clear any previous errors
    setHashVerificationError(null); // Clear any previous hash errors

    // Performance logging
    performanceMonitor.end('Initial Model Load');

    console.log("Face-API models loaded successfully from local public/models!");

    // You can remove the periodic model verification if it's not strictly necessary
    // for local development, or adapt it if you plan to implement custom hash checks
    // for local files. The default face-api.js loadFromUri does not perform hash checks itself.
    // The `verifyModelHashes` you had previously would be the place for that if external.
    // if (setModelsLoaded) {
    //   setInterval(async () => {
    //     console.log("Checking model integrity (placeholder)...");
    //     // Add any periodic checks or verification logic here if needed
    //   }, 30000);
    // }

  } catch (error) {
    console.error("Model loading failed:", error);
    setModelsLoaded(false);
    // Check if the error is related to files not being found (404)
    if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
        setLoadingError("Failed to fetch model files. Ensure they are in 'public/models' and correctly named.");
    } else {
        setLoadingError(error.message || "Failed to load face recognition models");
    }
    // You might still want setHashVerificationError if you're using your own verifyModelHashes elsewhere.
    setHashVerificationError("Model files might be missing or corrupted.");
  }
};