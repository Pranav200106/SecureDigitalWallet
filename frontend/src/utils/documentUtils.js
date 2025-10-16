import QRCode from 'qrcode';
import { documentDB } from './documentDatabase';


// Generate custom verification QR code
export const generateCustomVerificationQR = async (documentData, selectedAttributes) => {
  try {
    // Create QR data with fields that match admin expectations
    const qrData = {
      docType: 'Document Verification',
      verifiedAt: new Date().toISOString(),
      username: documentData.username,
      name: documentData.name,
      dob: documentData.dob,
      mobile: documentData.mobile,
      aadhaar: documentData.aadhaar,
      address: documentData.address
    };

    // Build filtered QR data based on selected attributes
    const filteredQrData = {
      docType: qrData.docType,
      verifiedAt: qrData.verifiedAt,
      username: qrData.username,
      name: qrData.name,
      dob: qrData.dob,
      mobile: qrData.mobile,
      aadhaar: qrData.aadhaar
    };

    // Add age field if age verification is selected
    if (selectedAttributes.age) {
      filteredQrData.age = qrData.dob; // Use dob as age field for verification
    }

    // Add address field if address verification is selected
    if (selectedAttributes.address) {
      filteredQrData.address = qrData.address;
    }

    console.log('Generating QR with data:', filteredQrData);
    console.log('Original document data:', documentData);
    console.log('Selected attributes:', selectedAttributes);

    // Generate QR code with verification URL
    const verificationUrl = `${window.location.origin}/qr-verification?data=${encodeURIComponent(JSON.stringify(filteredQrData))}`;
    const qrCodeDataURL = await QRCode.toDataURL(verificationUrl);
    
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

// Calculate age from date of birth
export const calculateAge = (dob) => {
  if (!dob || dob === 'Not found') return 0;
  
  try {
    let birthDate;
    
    // Handle different date formats
    if (dob.includes('/')) {
      // DD/MM/YYYY format
      const [day, month, year] = dob.split('/');
      birthDate = new Date(year, month - 1, day);
    } else if (dob.includes('-')) {
      // YYYY-MM-DD or DD-MM-YYYY format
      const parts = dob.split('-');
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        birthDate = new Date(dob);
      } else {
        // DD-MM-YYYY
        const [day, month, year] = parts;
        birthDate = new Date(year, month - 1, day);
      }
    } else if (dob.length === 4) {
      // Just year (YYYY)
      birthDate = new Date(dob, 0, 1);
    } else {
      // Try parsing as is
      birthDate = new Date(dob);
    }
    
    // Check if date is valid
    if (isNaN(birthDate.getTime())) {
      console.error('Invalid date format:', dob);
      return 0;
    }
    
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return Math.max(0, age);
  } catch (error) {
    console.error('Error calculating age from DOB:', dob, error);
    return 0;
  }
};

// Check if user has uploaded document
export const hasUserDocument = async (username) => {
  return await documentDB.hasDocument(username);
};

// Get user document data
export const getUserDocument = async (username) => {
  return await documentDB.getDocumentByUsername(username);
};

// Save user document data
export const saveUserDocument = async (documentData, username) => {
  return await documentDB.storeDocument(username, documentData);
};
