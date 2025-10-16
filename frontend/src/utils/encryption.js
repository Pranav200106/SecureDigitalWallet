import CryptoJS from 'crypto-js';

// Encryption key - In production, this should be stored securely
const ENCRYPTION_KEY = 'SecureDigitalWallet2024!@#$%^&*()_+';

/**
 * Encrypt sensitive data
 * @param {string} data - Data to encrypt
 * @returns {string} - Encrypted data
 */
export const encryptData = (data) => {
  try {
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt sensitive data
 * @param {string} encryptedData - Encrypted data to decrypt
 * @returns {object} - Decrypted data
 */
export const decryptData = (encryptedData) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Encrypt specific sensitive fields in submission data
 * @param {object} submissionData - Original submission data
 * @returns {object} - Submission data with encrypted sensitive fields
 */
export const encryptSubmissionData = (submissionData) => {
  try {
    // Fields that should be encrypted
    const sensitiveFields = ['name', 'dob', 'address', 'mobile', 'aadhaar'];
    
    const encryptedSubmission = { ...submissionData };
    
    // Encrypt each sensitive field
    sensitiveFields.forEach(field => {
      if (submissionData[field] && submissionData[field] !== 'Not found' && submissionData[field] !== 'N/A') {
        encryptedSubmission[field] = {
          encrypted: true,
          data: encryptData(submissionData[field])
        };
      }
    });
    
    // Also encrypt original data if it exists
    if (submissionData.originalData) {
      encryptedSubmission.originalData = {
        encrypted: true,
        data: encryptData(submissionData.originalData)
      };
    }
    
    console.log('Encrypted submission data for user:', submissionData.username);
    return encryptedSubmission;
  } catch (error) {
    console.error('Error encrypting submission data:', error);
    return submissionData; // Return original data if encryption fails
  }
};

/**
 * Decrypt specific sensitive fields in submission data
 * @param {object} encryptedSubmission - Submission data with encrypted fields
 * @returns {object} - Submission data with decrypted sensitive fields
 */
export const decryptSubmissionData = (encryptedSubmission) => {
  try {
    const decryptedSubmission = { ...encryptedSubmission };
    
    // Fields that might be encrypted
    const sensitiveFields = ['name', 'dob', 'address', 'mobile', 'aadhaar'];
    
    // Decrypt each field if it's encrypted
    sensitiveFields.forEach(field => {
      if (encryptedSubmission[field] && 
          typeof encryptedSubmission[field] === 'object' && 
          encryptedSubmission[field].encrypted) {
        try {
          decryptedSubmission[field] = decryptData(encryptedSubmission[field].data);
        } catch (error) {
          console.error(`Error decrypting field ${field}:`, error);
          decryptedSubmission[field] = 'Decryption Error';
        }
      }
    });
    
    // Decrypt original data if it exists and is encrypted
    if (encryptedSubmission.originalData && 
        typeof encryptedSubmission.originalData === 'object' && 
        encryptedSubmission.originalData.encrypted) {
      try {
        decryptedSubmission.originalData = decryptData(encryptedSubmission.originalData.data);
      } catch (error) {
        console.error('Error decrypting original data:', error);
        decryptedSubmission.originalData = null;
      }
    }
    
    return decryptedSubmission;
  } catch (error) {
    console.error('Error decrypting submission data:', error);
    return encryptedSubmission; // Return original data if decryption fails
  }
};

/**
 * Hash sensitive data for comparison (one-way)
 * @param {string} data - Data to hash
 * @returns {string} - Hashed data
 */
export const hashData = (data) => {
  try {
    return CryptoJS.SHA256(data.toString()).toString();
  } catch (error) {
    console.error('Hashing error:', error);
    return data;
  }
};

/**
 * Create a masked version of sensitive data for display
 * @param {string} data - Original data
 * @param {string} type - Type of data (mobile, aadhaar, etc.)
 * @returns {string} - Masked data
 */
export const maskSensitiveData = (data, type) => {
  if (!data || data === 'Not found' || data === 'N/A') return data;
  
  switch (type) {
    case 'mobile':
      return data.length >= 4 ? `****${data.slice(-4)}` : '****';
    case 'aadhaar':
      return data.length >= 4 ? `****-****-${data.slice(-4)}` : '****-****-****';
    case 'name':
      const names = data.split(' ');
      return names.length > 1 ? `${names[0]} ${'*'.repeat(names[names.length - 1].length)}` : `${data[0]}${'*'.repeat(data.length - 1)}`;
    case 'address':
      return data.length > 20 ? `${data.substring(0, 20)}...` : data;
    default:
      return data.length > 4 ? `${data.substring(0, 2)}${'*'.repeat(data.length - 4)}${data.slice(-2)}` : '****';
  }
};