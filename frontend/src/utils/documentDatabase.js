/**
 * Document Database using Firebase Firestore
 * This module handles document storage and retrieval using Firebase
 */

import firebaseService from './firebaseService';

/**
 * Document Database Object
 */
export const documentDB = {
  /**
   * Store document data for a user
   */
  async storeDocument(username, documentData) {
    return await firebaseService.storeDocument(username, documentData);
  },

  /**
   * Get document by username
   */
  async getDocumentByUsername(username) {
    return await firebaseService.getDocumentByUsername(username);
  },

  /**
   * Get all documents for a user
   */
  async getAllDocumentsByUsername(username) {
    return await firebaseService.getAllDocumentsByUsername(username);
  },

  /**
   * Check if user has a document
   */
  async hasDocument(username) {
    return await firebaseService.hasDocument(username);
  },

  /**
   * Update document data
   */
  async updateDocument(username, documentData) {
    return await firebaseService.updateDocument(username, documentData);
  },
};

// Also export individual functions for backward compatibility
export const storeDocument = documentDB.storeDocument.bind(documentDB);
export const getDocumentByUsername = documentDB.getDocumentByUsername.bind(documentDB);
export const getAllDocumentsByUsername = documentDB.getAllDocumentsByUsername.bind(documentDB);
export const hasDocument = documentDB.hasDocument.bind(documentDB);
export const updateDocument = documentDB.updateDocument.bind(documentDB);
