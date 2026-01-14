/**
 * Firebase Utilities
 * - Initialize Firebase
 * - CRUD operations
 * - Real-time listeners
 */

// Firebase config untuk mbg-absensi project
const firebaseConfig = {
  apiKey: "AIzaSyBXGZVwfqPdRn3IXLTYe-yHHZrKFTgctq4",
  authDomain: "mbg-absensi.firebaseapp.com",
  projectId: "mbg-absensi",
  storageBucket: "mbg-absensi.firebasestorage.app",
  messagingSenderId: "671289880994",
  appId: "1:671289880994:web:d1fc011153143de518c2fb"
};

// Initialize Firebase
let db;
let initialized = false;

// Wait for Firebase SDK to be loaded
function waitForFirebase() {
  return new Promise((resolve) => {
    if (typeof firebase !== 'undefined') {
      console.log('✓ Firebase SDK available');
      resolve();
    } else {
      console.log('Waiting for Firebase SDK...');
      let attempts = 0;
      const checkInterval = setInterval(() => {
        attempts++;
        if (typeof firebase !== 'undefined') {
          clearInterval(checkInterval);
          console.log('✓ Firebase SDK loaded after ' + attempts + ' attempts');
          resolve();
        }
      }, 200);
      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        console.log('✗ Firebase SDK timeout - resolve anyway');
        resolve();
      }, 5000);
    }
  });
}

async function initFirebase() {
  try {
    // Wait for Firebase SDK to be available
    await waitForFirebase();
    
    // Pakai firebase.initializeApp (compat API)
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    
    db = firebase.firestore();
    initialized = true;
    console.log('✓ Firebase initialized');
    return true;
  } catch (error) {
    console.error('✗ Firebase init error:', error.message);
    return false;
  }
}

/**
 * Get semua documents dari collection
 * @param {string} collectionName - Nama collection
 * @returns {Promise<Array>} - Array of documents dengan id
 */
async function getCollection(collectionName) {
  if (!initialized) await initFirebase();
  
  try {
    const snapshot = await db.collection(collectionName).get();
    const documents = [];
    snapshot.forEach(doc => {
      documents.push({
        id: doc.id,
        ...doc.data()
      });
    });
    return documents;
  } catch (error) {
    console.error(`Error getting ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Get single document
 * @param {string} collectionName
 * @param {string} docId
 * @returns {Promise<Object>} - Document data with id
 */
async function getDocument(collectionName, docId) {
  if (!initialized) await initFirebase();
  
  try {
    const doc = await db.collection(collectionName).doc(docId).get();
    if (!doc.exists) {
      console.warn(`Document ${docId} not found in ${collectionName}`);
      return null;
    }
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error(`Error getting ${docId}:`, error);
    throw error;
  }
}

/**
 * Set/create document
 * @param {string} collectionName
 * @param {string} docId
 * @param {Object} data
 * @returns {Promise<void>}
 */
async function setDocument(collectionName, docId, data) {
  if (!initialized) await initFirebase();
  
  try {
    await db.collection(collectionName).doc(docId).set(data, { merge: false });
    console.log(`✓ Set ${docId} in ${collectionName}`);
  } catch (error) {
    console.error(`Error setting ${docId}:`, error);
    throw error;
  }
}

/**
 * Add new document dengan auto ID
 * @param {string} collectionName
 * @param {Object} data
 * @returns {Promise<string>} - Document ID
 */
async function addDocument(collectionName, data) {
  if (!initialized) await initFirebase();
  
  try {
    const docRef = await db.collection(collectionName).add(data);
    console.log(`✓ Added to ${collectionName}: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error(`Error adding to ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Update document (merge dengan existing data)
 * @param {string} collectionName
 * @param {string} docId
 * @param {Object} data - Partial data to update
 * @returns {Promise<void>}
 */
async function updateDocument(collectionName, docId, data) {
  if (!initialized) await initFirebase();
  
  try {
    await db.collection(collectionName).doc(docId).update(data);
    console.log(`✓ Updated ${docId} in ${collectionName}`);
  } catch (error) {
    console.error(`Error updating ${docId}:`, error);
    throw error;
  }
}

/**
 * Delete document
 * @param {string} collectionName
 * @param {string} docId
 * @returns {Promise<void>}
 */
async function deleteDocument(collectionName, docId) {
  if (!initialized) await initFirebase();
  
  try {
    await db.collection(collectionName).doc(docId).delete();
    console.log(`✓ Deleted ${docId} from ${collectionName}`);
  } catch (error) {
    console.error(`Error deleting ${docId}:`, error);
    throw error;
  }
}

/**
 * Real-time listener untuk single document
 * @param {string} collectionName
 * @param {string} docId
 * @param {Function} callback - Called dengan (data, error)
 * @returns {Function} - Unsubscribe function
 */
function onDocumentChange(collectionName, docId, callback) {
  if (!initialized) {
    console.error('Firebase not initialized');
    return () => {};
  }
  
  return db.collection(collectionName).doc(docId).onSnapshot(
    (doc) => {
      if (doc.exists) {
        callback({
          id: doc.id,
          ...doc.data()
        }, null);
      } else {
        callback(null, new Error(`Document ${docId} not found`));
      }
    },
    (error) => {
      console.error('Listener error:', error);
      callback(null, error);
    }
  );
}

/**
 * Real-time listener untuk collection
 * @param {string} collectionName
 * @param {Function} callback - Called dengan (docs, error)
 * @returns {Function} - Unsubscribe function
 */
function onCollectionChange(collectionName, callback) {
  if (!initialized) {
    console.error('Firebase not initialized');
    return () => {};
  }
  
  return db.collection(collectionName).orderBy('timestamp', 'desc').onSnapshot(
    (snapshot) => {
      const docs = [];
      snapshot.forEach(doc => {
        docs.push({
          id: doc.id,
          ...doc.data()
        });
      });
      callback(docs, null);
    },
    (error) => {
      console.error('Collection listener error:', error);
      callback(null, error);
    }
  );
}

/**
 * Query dengan kondisi
 * @param {string} collectionName
 * @param {Array} conditions - [fieldName, operator, value]
 * @returns {Promise<Array>}
 */
async function queryDocuments(collectionName, conditions) {
  if (!initialized) await initFirebase();
  
  try {
    let query = db.collection(collectionName);
    
    // Apply conditions
    for (const [field, operator, value] of conditions) {
      query = query.where(field, operator, value);
    }
    
    const snapshot = await query.get();
    const docs = [];
    snapshot.forEach(doc => {
      docs.push({
        id: doc.id,
        ...doc.data()
      });
    });
    return docs;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}

/**
 * Update multiple documents dalam batch
 * @param {string} collectionName
 * @param {Array} updates - [{docId, data}, ...]
 * @returns {Promise<void>}
 */
async function batchUpdate(collectionName, updates) {
  if (!initialized) await initFirebase();
  
  try {
    const batch = db.batch();
    
    for (const { docId, data } of updates) {
      const docRef = db.collection(collectionName).doc(docId);
      batch.update(docRef, data);
    }
    
    await batch.commit();
    console.log(`✓ Batch updated ${updates.length} documents`);
  } catch (error) {
    console.error('Batch update error:', error);
    throw error;
  }
}

/**
 * Check connection status
 * @returns {boolean}
 */
function isConnected() {
  return initialized && db;
}

/**
 * Format rupiah
 * @param {number} amount
 * @returns {string}
 */
function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}

/**
 * Format date to YYYY-MM-DD
 * @param {Date|number} date
 * @returns {string}
 */
function formatDate(date) {
  if (typeof date === 'number') {
    date = new Date(date);
  }
  return date.toISOString().split('T')[0];
}

/**
 * Parse date string to Date
 * @param {string} dateStr - YYYY-MM-DD format
 * @returns {Date}
 */
function parseDate(dateStr) {
  return new Date(dateStr + 'T00:00:00Z');
}

// All functions are globally available (no export needed for non-module scripts)
