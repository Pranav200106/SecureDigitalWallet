/**
 * Submission Store using Firebase Firestore
 * This module handles admin submission queue using Firebase
 */

import CryptoJS from 'crypto-js';
import firebaseService from './firebaseService';

const ENCRYPTION_KEY = 'secure-digital-wallet-2024';

// Initialize Firebase connection
let initPromise = null;

function ensureInitialized() {
  if (!initPromise) {
    initPromise = firebaseService.connect();
  }
  return initPromise;
}

/**
 * Encrypt submission data
 */
function encryptSubmissionData(data) {
  try {
    const jsonString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
}

/**
 * Decrypt submission data
 */
function decryptSubmissionData(encryptedData) {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

// Subscribers for real-time updates
const subscribers = [];

/**
 * Submission Store Object
 */
export const submissionStore = {
  /**
   * Add a submission to the admin queue
   */
  async addSubmission(submissionData) {
    try {
      console.log('🔧 [SubmissionStore] Starting addSubmission...');
      console.log('🔧 [SubmissionStore] Input data:', JSON.stringify(submissionData, null, 2));
      
      await ensureInitialized();
      console.log('🔧 [SubmissionStore] Firebase initialized');
      
      console.log('🔒 [SubmissionStore] Encrypting data...');
      const encryptedData = encryptSubmissionData(submissionData);
      
      if (!encryptedData) {
        console.error('❌ [SubmissionStore] Encryption failed!');
        throw new Error('Failed to encrypt submission data');
      }
      
      console.log('✅ [SubmissionStore] Encryption successful, length:', encryptedData.length);

      const submission = {
        id: Date.now(),
        encryptedData,
        submittedAt: new Date().toISOString(),
        status: 'pending',
      };

      console.log('📦 [SubmissionStore] Submission object created:', { 
        id: submission.id, 
        status: submission.status, 
        submittedAt: submission.submittedAt,
        encryptedDataLength: submission.encryptedData.length
      });
      
      console.log('💾 [SubmissionStore] Calling firebaseService.addSubmission...');
      await firebaseService.addSubmission(submission);
      console.log('✅ [SubmissionStore] Firebase save successful');
      
      // Notify subscribers
      console.log('📢 [SubmissionStore] Notifying subscribers...');
      await this.notifySubscribers();
      console.log('✅ [SubmissionStore] Subscribers notified');
      
      console.log('🎉 [SubmissionStore] addSubmission completed successfully');
    } catch (error) {
      console.error('❌ [SubmissionStore] addSubmission failed:', {
        message: error.message,
        stack: error.stack,
        error: error
      });
      throw error;
    }
  },

  /**
   * Get all submissions from the admin queue
   */
  async getSubmissions() {
    await ensureInitialized();
    
    console.log('📥 Fetching submissions from Firebase...');
    const submissions = await firebaseService.getAllSubmissions();
    console.log('📥 Raw submissions from Firebase:', submissions.length, 'items');
    
    if (submissions.length > 0) {
      console.log('📥 First raw submission:', {
        id: submissions[0].id,
        _id: submissions[0]._id,
        hasEncryptedData: !!submissions[0].encryptedData,
        encryptedDataPreview: submissions[0].encryptedData?.substring(0, 50) + '...',
        status: submissions[0].status,
        submittedAt: submissions[0].submittedAt
      });
    }
    
    // Decrypt all submissions
    const decryptedSubmissions = submissions.map((submission, index) => {
      console.log(`📥 Decrypting submission ${index + 1}/${submissions.length}...`);
      
      if (!submission.encryptedData) {
        console.error('❌ Submission missing encryptedData field:', submission.id, 'Keys:', Object.keys(submission));
        return null;
      }
      
      const decryptedData = decryptSubmissionData(submission.encryptedData);
      if (!decryptedData) {
        console.error('❌ Failed to decrypt submission:', submission.id);
        console.error('❌ Encrypted data length:', submission.encryptedData?.length);
        return null;
      }
      
      console.log(`✅ Successfully decrypted submission ${submission.id}:`, {
        name: decryptedData.name,
        username: decryptedData.username,
        hasAddress: !!decryptedData.address,
        hasMobile: !!decryptedData.mobile,
        hasAadhaar: !!decryptedData.aadhaar
      });
      
      return {
        id: submission.id,
        ...decryptedData,
        submittedAt: submission.submittedAt,
        status: submission.status || 'pending',
      };
    }).filter(submission => submission !== null);
    
    console.log('📥 Decrypted submissions:', decryptedSubmissions.length, 'items');
    console.log('📥 Submission data:', decryptedSubmissions);
    
    return decryptedSubmissions;
  },

  /**
   * Update submission status
   */
  async updateSubmissionStatus(submissionId, status) {
    await ensureInitialized();
    
    const submissions = await firebaseService.getAllSubmissions();
    const submission = submissions.find(s => s.id === submissionId);
    
    if (submission) {
      submission.status = status;
      await firebaseService.updateSubmission(submissionId, submission);
      console.log(`Submission ${submissionId} status updated to ${status}`);
      
      // Notify subscribers
      this.notifySubscribers();
    }
  },

  /**
   * Delete a submission from the admin queue
   */
  async deleteSubmission(submissionId) {
    await ensureInitialized();
    await firebaseService.deleteSubmission(submissionId);
    console.log('Submission deleted from Firebase');
    
    // Notify subscribers
    this.notifySubscribers();
  },

  /**
   * Clear all submissions from the admin queue
   */
  async clearAllSubmissions() {
    await ensureInitialized();
    await firebaseService.clearAllSubmissions();
    console.log('All submissions cleared from Firebase');
    
    // Notify subscribers
    this.notifySubscribers();
  },

  /**
   * Subscribe to submission changes
   */
  subscribe(callback) {
    subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = subscribers.indexOf(callback);
      if (index > -1) {
        subscribers.splice(index, 1);
      }
    };
  },

  /**
   * Notify all subscribers of changes
   */
  async notifySubscribers() {
    console.log('📢 Notifying', subscribers.length, 'subscribers of submission changes');
    const submissions = await this.getSubmissions();
    console.log('📢 Broadcasting', submissions.length, 'submissions to subscribers');
    subscribers.forEach(callback => callback(submissions));
    console.log('✅ All subscribers notified');
  },
};
