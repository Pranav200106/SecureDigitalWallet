/**
 * OCR API Service - Communicates with Flask Backend
 * Handles all API calls for document extraction
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class OCRApiService {
  /**
   * Upload file and extract document data
   * @param {File} file - Image file from input or camera
   * @param {boolean} enhance - Whether to preprocess image
   * @returns {Promise<Object>} Extracted document data
   */
  async extractFromFile(file, enhance = true) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('enhance', enhance.toString());

      const response = await fetch(`${API_BASE_URL}/extract-upload`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - browser will set it with boundary
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error_message || 
          `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.error_message || 'Extraction failed');
      }

      return data;
    } catch (error) {
      console.error('OCR API Error:', error);
      throw new Error(`Failed to extract document data: ${error.message}`);
    }
  }

  /**
   * Extract from image data URL (base64)
   * @param {string} imageDataUrl - Base64 image data URL
   * @param {boolean} enhance - Whether to preprocess image
   * @returns {Promise<Object>} Extracted document data
   */
  async extractFromDataUrl(imageDataUrl, enhance = true) {
    try {
      // Convert data URL to Blob
      const blob = await this.dataUrlToBlob(imageDataUrl);
      const file = new File([blob], 'captured-image.jpg', { type: 'image/jpeg' });
      
      return await this.extractFromFile(file, enhance);
    } catch (error) {
      console.error('OCR API Error:', error);
      throw new Error(`Failed to extract from captured image: ${error.message}`);
    }
  }

  /**
   * Extract from file path (server-side path)
   * @param {string} imagePath - Server file path
   * @param {boolean} enhance - Whether to preprocess image
   * @returns {Promise<Object>} Extracted document data
   */
  async extractFromPath(imagePath, enhance = true) {
    try {
      const response = await fetch(`${API_BASE_URL}/extract-by-path`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_path: imagePath,
          enhance: enhance,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error_message || 
          `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.error_message || 'Extraction failed');
      }

      return data;
    } catch (error) {
      console.error('OCR API Error:', error);
      throw new Error(`Failed to extract document data: ${error.message}`);
    }
  }

  /**
   * Health check for API availability
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw new Error('API is not available');
    }
  }

  /**
   * Helper: Convert data URL to Blob
   * @param {string} dataUrl - Base64 data URL
   * @returns {Promise<Blob>} Blob object
   */
  async dataUrlToBlob(dataUrl) {
    const response = await fetch(dataUrl);
    return await response.blob();
  }

  /**
   * Format extracted data for display
   * @param {Object} apiResponse - Response from API
   * @returns {Object} Formatted data
   */
  formatExtractedData(apiResponse) {
    if (!apiResponse || apiResponse.status !== 'success') {
      return null;
    }

    const data = apiResponse.extracted_data || {};
    
    return {
      name: data.name || 'Not found',
      dob: data.dob || 'Not found',
      age: data.dob ? this.calculateAge(data.dob) : 'Not found',
      gender: data.gender || 'Not found',
      address: data.address || 'Not found',
      documentType: data.document_type || 'unknown',
      aadharNumber: data.aadhar_number || null,
      panNumber: data.pan_number || null,
      dlNumber: data.dl_number || null,
      bloodGroup: data.blood_group || null,
      fatherName: data.father_name || null,
      pinCode: data.pin_code || null,
      state: data.state || null,
      issueDate: data.issue_date || null,
      validity: data.validity || null,
    };
  }

  /**
   * Calculate age from DOB string
   * @param {string} dobString - Date of birth in DD/MM/YYYY format
   * @returns {number|null} Age in years
   */
  calculateAge(dobString) {
    if (!dobString || dobString === 'Not found') return null;

    try {
      // Parse DD/MM/YYYY or DD-MM-YYYY format
      const parts = dobString.split(/[\/\-]/);
      if (parts.length !== 3) return null;

      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
      const year = parseInt(parts[2], 10);

      if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

      const birthDate = new Date(year, month, day);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      return age;
    } catch (error) {
      console.error('Error calculating age:', error);
      return null;
    }
  }
}


export default new OCRApiService();
