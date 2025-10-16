/**
 * Firebase Firestore Service for Secure Digital Wallet
 * This service handles all database operations using Firebase Firestore
 * 
 * Collections:
 * - documents: User document data (Aadhaar, etc.)
 * - submissions: Admin submission queue
 * - users: User authentication data
 * - settings: App settings (dark mode, admin password, etc.)
 * 
 * Note: This uses Firebase SDK which works directly in the browser
 * API keys in frontend are safe for Firebase (they're meant to be public)
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore';

class FirebaseService {
  constructor() {
    this.app = null;
    this.db = null;
    this.connected = false;
    this.useLocalStorage = false;
    this.dbName = 'SecureDigitalWallet';
  }

  /**
   * Initialize Firebase connection
   */
  async connect() {
    // Return existing connection if already connected
    if (this.connected && this.db) {
      return this.db;
    }

    try {
      // Get Firebase config from environment variables
      const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID
      };

      // Check if Firebase is configured
      if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        console.warn('⚠️ Firebase not configured. Using localStorage fallback.');
        console.log('To use Firebase Firestore:');
        console.log('1. Create a Firebase project at https://console.firebase.google.com');
        console.log('2. Enable Firestore Database');
        console.log('3. Add Firebase config to frontend/.env');
        
        // Use localStorage fallback
        this.useLocalStorage = true;
        this.connected = true;
        console.log('✅ Firebase service initialized (localStorage mode)');
        return true;
      }

      console.log('🔥 Connecting to Firebase Firestore...');
      
      // Initialize Firebase
      this.app = initializeApp(firebaseConfig);
      
      // Get Firestore instance
      this.db = getFirestore(this.app);
      
      this.connected = true;
      this.useLocalStorage = false;
      
      console.log('✅ Connected to Firebase Firestore:', firebaseConfig.projectId);
      return this.db;
    } catch (error) {
      console.error('❌ Firebase connection error:', error);
      console.log('⚠️ Falling back to localStorage mode');
      
      // Fallback to localStorage
      this.useLocalStorage = true;
      this.connected = true;
      
      return true;
    }
  }

  /**
   * Get database instance (for compatibility)
   */
  async getDB() {
    if (!this.connected) {
      await this.connect();
    }
    return this;
  }

  /**
   * Execute Firestore operation - supports both Firestore and localStorage
   */
  async _executeOperation(collectionName, operation, queryData = {}, data = null) {
    // Ensure connection
    await this.getDB();

    // If connected to Firestore, use real Firestore operations
    if (!this.useLocalStorage && this.db) {
      return await this._executeFirestoreOperation(collectionName, operation, queryData, data);
    }
    
    // Otherwise, use localStorage fallback
    return await this._executeLocalStorageOperation(collectionName, operation, queryData, data);
  }

  /**
   * Execute operation on Firebase Firestore
   */
  async _executeFirestoreOperation(collectionName, operation, queryData = {}, data = null) {
    try {
      console.log(`🔥 Firestore: Executing ${operation} on ${collectionName}`);
      const collRef = collection(this.db, collectionName);
      
      switch (operation) {
        case 'find': {
          // Get all documents matching query
          if (Object.keys(queryData).length === 0) {
            // Get all documents
            console.log(`🔥 Firestore: Getting all documents from ${collectionName}`);
            const snapshot = await getDocs(collRef);
            const docs = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
            console.log(`✅ Firestore: Found ${docs.length} documents`);
            return docs;
          } else {
            // Query with where clause
            const queryKey = Object.keys(queryData)[0];
            const queryValue = queryData[queryKey];
            console.log(`🔥 Firestore: Querying ${collectionName} where ${queryKey} == ${queryValue}`);
            const q = query(collRef, where(queryKey, '==', queryValue));
            const snapshot = await getDocs(q);
            const docs = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
            console.log(`✅ Firestore: Found ${docs.length} documents`);
            return docs;
          }
        }
        
        case 'findOne': {
          if (queryData._id) {
            // Get by document ID
            const docRef = doc(this.db, collectionName, queryData._id);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? { _id: docSnap.id, ...docSnap.data() } : null;
          } else {
            // Query with where clause
            const queryKey = Object.keys(queryData)[0];
            const queryValue = queryData[queryKey];
            const q = query(collRef, where(queryKey, '==', queryValue));
            const snapshot = await getDocs(q);
            if (snapshot.empty) return null;
            const firstDoc = snapshot.docs[0];
            return { _id: firstDoc.id, ...firstDoc.data() };
          }
        }
        
        case 'insertOne': {
          // Generate ID if not provided
          const docId = data._id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const docRef = doc(this.db, collectionName, docId);
          
          // Remove _id from data (Firestore uses document ID separately)
          const { _id, ...docData } = data;
          
          console.log(`🔥 Firestore: Inserting document with ID ${docId} into ${collectionName}`);
          await setDoc(docRef, docData);
          console.log(`✅ Firestore: Document inserted successfully`);
          return { insertedId: docId };
        }
        
        case 'updateOne': {
          // Find document first
          let docId = queryData._id;
          
          if (!docId) {
            // Find by query
            const queryKey = Object.keys(queryData)[0];
            const queryValue = queryData[queryKey];
            const q = query(collRef, where(queryKey, '==', queryValue));
            const snapshot = await getDocs(q);
            
            if (!snapshot.empty) {
              docId = snapshot.docs[0].id;
            }
          }
          
          if (docId) {
            // Update existing document
            const docRef = doc(this.db, collectionName, docId);
            const updateData = data.$set || data;
            await updateDoc(docRef, updateData);
            return { matchedCount: 1, modifiedCount: 1, upsertedCount: 0 };
          } else {
            // Upsert - create new document
            const newDocId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const docRef = doc(this.db, collectionName, newDocId);
            const insertData = { ...queryData, ...(data.$set || data) };
            await setDoc(docRef, insertData);
            return { matchedCount: 0, modifiedCount: 0, upsertedCount: 1 };
          }
        }
        
        case 'deleteOne': {
          // Find document first
          let docId = queryData._id;
          
          if (!docId) {
            // Find by query
            const queryKey = Object.keys(queryData)[0];
            const queryValue = queryData[queryKey];
            const q = query(collRef, where(queryKey, '==', queryValue));
            const snapshot = await getDocs(q);
            
            if (!snapshot.empty) {
              docId = snapshot.docs[0].id;
            }
          }
          
          if (docId) {
            const docRef = doc(this.db, collectionName, docId);
            await deleteDoc(docRef);
            return { deletedCount: 1 };
          } else {
            return { deletedCount: 0 };
          }
        }
        
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }
    } catch (error) {
      console.error(`Firestore operation error (${operation} on ${collectionName}):`, error);
      throw error;
    }
  }

  /**
   * Execute operation on localStorage (fallback)
   */
  async _executeLocalStorageOperation(collectionName, operation, queryData = {}, data = null) {
    const storageKey = `firebase_${this.dbName}_${collectionName}`;
    
    // Get existing data
    let items = [];
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        items = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error reading from storage:', error);
    }

    let result = null;

    switch (operation) {
      case 'find':
        result = items.filter(item => {
          if (!queryData || Object.keys(queryData).length === 0) return true;
          return Object.keys(queryData).every(key => item[key] === queryData[key]);
        });
        break;

      case 'findOne':
        result = items.find(item => {
          if (!queryData || Object.keys(queryData).length === 0) return true;
          return Object.keys(queryData).every(key => item[key] === queryData[key]);
        });
        break;

      case 'insertOne':
        const newItem = {
          ...data,
          _id: data._id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
        items.push(newItem);
        localStorage.setItem(storageKey, JSON.stringify(items));
        result = { insertedId: newItem._id };
        break;

      case 'updateOne':
        const updateIndex = items.findIndex(item => {
          return Object.keys(queryData).every(key => item[key] === queryData[key]);
        });
        if (updateIndex >= 0) {
          items[updateIndex] = {
            ...items[updateIndex],
            ...(data.$set || data),
          };
          localStorage.setItem(storageKey, JSON.stringify(items));
          result = { matchedCount: 1, modifiedCount: 1, upsertedCount: 0 };
        } else {
          // Upsert
          const newItem = {
            ...queryData,
            ...(data.$set || data),
            _id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          };
          items.push(newItem);
          localStorage.setItem(storageKey, JSON.stringify(items));
          result = { matchedCount: 0, modifiedCount: 0, upsertedCount: 1 };
        }
        break;

      case 'deleteOne':
        const deleteIndex = items.findIndex(item => {
          return Object.keys(queryData).every(key => item[key] === queryData[key]);
        });
        if (deleteIndex >= 0) {
          items.splice(deleteIndex, 1);
          localStorage.setItem(storageKey, JSON.stringify(items));
          result = { deletedCount: 1 };
        } else {
          result = { deletedCount: 0 };
        }
        break;

      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }

    return result;
  }

  /**
   * Close connection
   */
  async disconnect() {
    this.connected = false;
    console.log('Disconnected from Firebase');
  }

  // ==================== DOCUMENT OPERATIONS ====================

  /**
   * Store document data for a user
   */
  async storeDocument(username, documentData) {
    try {
      await this.getDB();

      const documentRecord = {
        username,
        ...documentData,
        uploadedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Check if document already exists for this user
      const existing = await this._executeOperation('documents', 'findOne', { username });
      
      if (existing) {
        // Update existing document
        await this._executeOperation('documents', 'updateOne', 
          { username },
          { 
            $set: {
              ...documentRecord,
              createdAt: existing.createdAt || existing.uploadedAt,
            }
          }
        );
        console.log('Document updated for user:', username);
        return existing._id;
      } else {
        // Insert new document
        const result = await this._executeOperation('documents', 'insertOne', {}, {
          ...documentRecord,
          createdAt: new Date().toISOString(),
        });
        console.log('Document stored for user:', username, 'with ID:', result.insertedId);
        return result.insertedId;
      }
    } catch (error) {
      console.error('Error storing document:', error);
      throw error;
    }
  }

  /**
   * Get document by username
   */
  async getDocumentByUsername(username) {
    try {
      await this.getDB();
      const document = await this._executeOperation('documents', 'findOne', { username });
      return document;
    } catch (error) {
      console.error('Error retrieving document:', error);
      return null;
    }
  }

  /**
   * Get all documents for a user (returns array for compatibility)
   */
  async getAllDocumentsByUsername(username) {
    try {
      await this.getDB();
      const documents = await this._executeOperation('documents', 'find', { username });
      return documents;
    } catch (error) {
      console.error('Error retrieving documents:', error);
      return [];
    }
  }

  /**
   * Check if user has a document
   */
  async hasDocument(username) {
    const document = await this.getDocumentByUsername(username);
    return !!document;
  }

  /**
   * Update document data
   */
  async updateDocument(username, documentData) {
    try {
      await this.getDB();

      const result = await this._executeOperation('documents', 'updateOne',
        { username },
        { 
          $set: {
            ...documentData,
            updatedAt: new Date().toISOString(),
          }
        }
      );

      if (result.matchedCount === 0 && result.upsertedCount === 0) {
        throw new Error('Document not found');
      }

      console.log('Document updated for user:', username);
      return result;
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  // ==================== SUBMISSION OPERATIONS ====================

  /**
   * Add a submission to admin queue
   */
  async addSubmission(submissionData) {
    try {
      await this.getDB();

      const submissionId = submissionData.id || Date.now();
      const submission = {
        ...submissionData,
        id: submissionId,
        _id: String(submissionId), // Use id as _id for Firestore document ID
        submittedAt: submissionData.submittedAt || new Date().toISOString(),
      };

      console.log('🔥 Firebase: Adding submission to Firestore/localStorage...');
      console.log('🔥 Using mode:', this.useLocalStorage ? 'localStorage' : 'Firestore');
      console.log('🔥 Submission ID:', submission.id);
      console.log('🔥 Submission data structure:', {
        id: submission.id,
        hasEncryptedData: !!submission.encryptedData,
        encryptedDataLength: submission.encryptedData?.length,
        status: submission.status,
        submittedAt: submission.submittedAt
      });
      
      const result = await this._executeOperation('submissions', 'insertOne', {}, submission);
      console.log('✅ Firebase: Submission added with ID:', result.insertedId);
      
      // Verify the submission was actually stored by reading it back
      const verifySubmissions = await this._executeOperation('submissions', 'find', {});
      console.log('🔍 Verification: Total submissions in database:', verifySubmissions.length);
      console.log('🔍 Verification: Latest submission:', verifySubmissions[verifySubmissions.length - 1]);
      
      return result.insertedId;
    } catch (error) {
      console.error('❌ Firebase: Error adding submission:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Update a submission
   */
  async updateSubmission(submissionId, submissionData) {
    try {
      await this.getDB();
      console.log('🔥 Firebase: Updating submission:', submissionId);
      
      const result = await this._executeOperation('submissions', 'updateOne',
        { _id: String(submissionId) }, // Use _id for Firestore document ID
        { $set: submissionData }
      );
      console.log('✅ Firebase: Submission updated:', submissionId);
      return result;
    } catch (error) {
      console.error('❌ Firebase: Error updating submission:', error);
      throw error;
    }
  }

  /**
   * Get all submissions
   */
  async getAllSubmissions() {
    try {
      await this.getDB();
      console.log('🔥 Firebase: Fetching all submissions...');
      console.log('🔥 Using mode:', this.useLocalStorage ? 'localStorage' : 'Firestore');
      console.log('🔥 Connected:', this.connected);
      console.log('🔥 DB instance:', !!this.db);
      
      const submissions = await this._executeOperation('submissions', 'find', {});
      console.log('✅ Firebase: Retrieved', submissions.length, 'submissions');
      
      if (submissions.length > 0) {
        console.log('📋 First submission structure:', {
          id: submissions[0].id,
          _id: submissions[0]._id,
          hasEncryptedData: !!submissions[0].encryptedData,
          encryptedDataLength: submissions[0].encryptedData?.length,
          status: submissions[0].status,
          submittedAt: submissions[0].submittedAt,
          allKeys: Object.keys(submissions[0])
        });
      } else {
        console.warn('⚠️ No submissions found in database');
      }
      
      return submissions;
    } catch (error) {
      console.error('❌ Firebase: Error retrieving submissions:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      return [];
    }
  }

  /**
   * Delete a submission
   */
  async deleteSubmission(submissionId) {
    try {
      await this.getDB();
      console.log('🔥 Firebase: Deleting submission with _id:', submissionId);
      const result = await this._executeOperation('submissions', 'deleteOne', { _id: String(submissionId) });
      console.log('✅ Firebase: Submission deleted:', submissionId);
      return result.deletedCount > 0;
    } catch (error) {
      console.error('❌ Firebase: Error deleting submission:', error);
      throw error;
    }
  }

  /**
   * Clear all submissions
   */
  async clearAllSubmissions() {
    try {
      await this.getDB();
      
      // Get all submissions first
      const submissions = await this.getAllSubmissions();
      
      // Delete each one
      for (const submission of submissions) {
        await this.deleteSubmission(submission.id);
      }
      
      console.log('All submissions cleared');
      return true;
    } catch (error) {
      console.error('Error clearing submissions:', error);
      throw error;
    }
  }

  // ==================== SETTINGS OPERATIONS ====================

  /**
   * Get a setting value
   */
  async getSetting(key) {
    try {
      await this.getDB();
      const setting = await this._executeOperation('settings', 'findOne', { key });
      return setting ? setting.value : null;
    } catch (error) {
      console.error('Error retrieving setting:', error);
      return null;
    }
  }

  /**
   * Set a setting value
   */
  async setSetting(key, value) {
    try {
      await this.getDB();

      const result = await this._executeOperation('settings', 'updateOne',
        { key },
        { 
          $set: {
            key,
            value,
            updatedAt: new Date().toISOString(),
          }
        }
      );

      console.log('Setting updated:', key);
      return result;
    } catch (error) {
      console.error('Error setting value:', error);
      throw error;
    }
  }

  /**
   * Get all settings
   */
  async getAllSettings() {
    try {
      await this.getDB();
      const settings = await this._executeOperation('settings', 'find', {});
      
      // Convert array to object for easier access
      const settingsObj = {};
      settings.forEach(setting => {
        settingsObj[setting.key] = setting.value;
      });
      
      return settingsObj;
    } catch (error) {
      console.error('Error retrieving settings:', error);
      return {};
    }
  }

  // ==================== USER OPERATIONS ====================

  /**
   * Create or update user
   */
  async saveUser(username, userData) {
    try {
      await this.getDB();

      const result = await this._executeOperation('users', 'updateOne',
        { username },
        { 
          $set: {
            username,
            ...userData,
            updatedAt: new Date().toISOString(),
          }
        }
      );

      console.log('User saved:', username);
      return result;
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  }

  /**
   * Create a new user
   */
  async createUser(userData) {
    try {
      await this.getDB();
      
      const user = {
        ...userData,
        createdAt: userData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await this._executeOperation('users', 'insertOne', {}, user);
      console.log('User created:', userData.username);
      return result.insertedId;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Get user by username
   */
  async getUser(username) {
    try {
      await this.getDB();
      const user = await this._executeOperation('users', 'findOne', { username });
      return user;
    } catch (error) {
      console.error('Error retrieving user:', error);
      return null;
    }
  }

  /**
   * Get all users
   */
  async getAllUsers() {
    try {
      await this.getDB();
      const users = await this._executeOperation('users', 'find', {});
      return users;
    } catch (error) {
      console.error('Error retrieving users:', error);
      return [];
    }
  }
}

// Create and export singleton instance
const firebaseService = new FirebaseService();
export default firebaseService;