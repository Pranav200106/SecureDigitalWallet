/**
 * Backend OCR Service
 * Communicates with Python Flask backend for OCR processing using GPT-4o Vision
 */

const BACKEND_URL = 'http://localhost:5000';

/**
 * Convert image element to base64 data URL
 */
const imageToBase64 = (imageElement) => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = imageElement.width || imageElement.naturalWidth;
      canvas.height = imageElement.height || imageElement.naturalHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imageElement, 0, 0);
      
      // Convert to blob then to base64
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to convert image to blob'));
          return;
        }
        
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.95);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Convert base64 data URL to File object
 */
const base64ToFile = (base64String, filename = 'document.jpg') => {
  const arr = base64String.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
};

/**
 * Initialize backend OCR service (check if backend is available)
 */
export const initBackendOCR = async () => {
  try {
    console.log('Checking backend OCR service availability...');
    
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Backend health check failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Backend OCR service is available:', data);
    
    return true;
  } catch (error) {
    console.error('Backend OCR service initialization failed:', error);
    throw new Error(`Backend OCR service is not available. Please ensure the Python backend is running on ${BACKEND_URL}`);
  }
};

/**
 * Perform OCR on an image using the backend API
 * @param {HTMLImageElement|HTMLCanvasElement|File|Blob|string} image - Image to process
 * @param {Object} options - OCR options
 * @returns {Promise<string>} - Extracted text (formatted for compatibility)
 */
export const recognizeText = async (image, options = {}) => {
  try {
    console.log('Starting Backend OCR recognition...');
    const startTime = Date.now();

    let fileToUpload;

    // Handle different input types
    if (typeof image === 'string') {
      // Base64 or URL
      if (image.startsWith('data:')) {
        // Base64 data URL
        fileToUpload = base64ToFile(image);
      } else {
        // URL - fetch and convert to file
        const response = await fetch(image);
        const blob = await response.blob();
        fileToUpload = new File([blob], 'document.jpg', { type: blob.type });
      }
    } else if (image instanceof File || image instanceof Blob) {
      // File or Blob
      fileToUpload = image instanceof File ? image : new File([image], 'document.jpg', { type: image.type });
    } else if (image instanceof HTMLImageElement || image instanceof HTMLCanvasElement) {
      // Image or Canvas element - convert to base64 then to file
      const base64 = await imageToBase64(image);
      fileToUpload = base64ToFile(base64);
    } else {
      throw new Error('Unsupported image type');
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('enhance', options.enhance !== false ? 'true' : 'false');

    // Send request to backend
    console.log('Uploading image to backend for OCR processing...');
    const response = await fetch(`${BACKEND_URL}/extract-upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error_message || `Backend OCR failed: ${response.status}`);
    }

    const result = await response.json();
    
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Backend OCR completed in ${processingTime}s`);

    if (result.status !== 'success') {
      throw new Error(result.error_message || 'OCR extraction failed');
    }

    // Extract the data from backend response
    const extractedData = result.extracted_data || {};
    
    // Format the response to match the expected text format for existing code
    const textLines = [];
    
    if (extractedData.name && extractedData.name !== 'Not found') {
      textLines.push(extractedData.name);
    }
    if (extractedData.father_name && extractedData.father_name !== 'Not found') {
      textLines.push(`S/O: ${extractedData.father_name}`);
    }
    if (extractedData.gender && extractedData.gender !== 'Not found') {
      textLines.push(extractedData.gender);
    }
    if (extractedData.dob && extractedData.dob !== 'Not found') {
      textLines.push(`DOB: ${extractedData.dob}`);
    }
    if (extractedData.address && extractedData.address !== 'Not found') {
      textLines.push(`Address: ${extractedData.address}`);
    }
    if (extractedData.aadhar_number && extractedData.aadhar_number !== 'Not found') {
      textLines.push(`Aadhaar: ${extractedData.aadhar_number}`);
    }

    const formattedText = textLines.join('\n');
    
    console.log('Backend OCR extracted data:', extractedData);
    console.log('Formatted text:', formattedText);

    // Return text for compatibility with existing code
    return formattedText;

  } catch (error) {
    console.error('Backend OCR recognition error:', error);
    throw new Error(`Backend OCR failed: ${error.message}`);
  }
};

/**
 * Cleanup function (no-op for backend service, but kept for API compatibility)
 */
export const terminateBackendOCR = async () => {
  console.log('Backend OCR service cleanup (no action needed)');
};

export default {
  init: initBackendOCR,
  recognize: recognizeText,
  terminate: terminateBackendOCR
};
