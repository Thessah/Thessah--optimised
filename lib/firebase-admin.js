/**
 * Firebase Admin SDK Initialization
 * Centralized setup supporting multiple credential sources:
 * 1. firebase-service-account.json file (local, not committed)
 * 2. FIREBASE_SERVICE_ACCOUNT_KEY env variable (JSON string)
 * 3. Individual env variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

let firebaseAdminReady = false;
let firebaseAdminInitError = null;

/**
 * Load service account from file if it exists
 */
function loadServiceAccountFromFile() {
  try {
    const filePath = path.join(process.cwd(), 'firebase-service-account.json');
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const account = JSON.parse(content);
      console.log('✅ Loaded service account from firebase-service-account.json');
      return account;
    }
  } catch (e) {
    console.warn('⚠️  Could not load service account from file:', e.message);
  }
  return null;
}

/**
 * Load service account from FIREBASE_SERVICE_ACCOUNT_KEY env variable
 */
function loadServiceAccountFromEnv() {
  try {
    const keyEnv = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!keyEnv) return null;

    const account = JSON.parse(keyEnv);
    console.log('✅ Loaded service account from FIREBASE_SERVICE_ACCOUNT_KEY env variable');
    return account;
  } catch (e) {
    console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY parsing error:', e.message);
    return null;
  }
}

/**
 * Build service account from individual environment variables
 */
function buildServiceAccountFromEnvVars() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return {
    type: 'service_account',
    project_id: projectId,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || 'key-id',
    private_key: privateKey.replace(/\\n/g, '\n'),
    client_email: clientEmail,
    client_id: process.env.FIREBASE_CLIENT_ID || '',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  };
}

/**
 * Validate service account has all required fields
 */
function validateServiceAccount(account) {
  if (!account) {
    throw new Error('Service account object is missing');
  }

  if (typeof account.project_id !== 'string') {
    throw new Error('Service account object must contain a string "project_id" property');
  }

  if (typeof account.private_key !== 'string') {
    throw new Error('Service account object must contain a string "private_key" property');
  }

  if (typeof account.client_email !== 'string') {
    throw new Error('Service account object must contain a string "client_email" property');
  }

  return true;
}

/**
 * Initialize Firebase Admin SDK
 */
function initFirebaseAdmin() {
  // Return early if already initialized or attempted
  if (firebaseAdminReady || firebaseAdminInitError) {
    return firebaseAdminReady;
  }

  console.log('🔥 Attempting to initialize Firebase Admin SDK...');

  let serviceAccount = null;

  // Try loading from file first
  serviceAccount = loadServiceAccountFromFile();

  // Fall back to env variable
  if (!serviceAccount) {
    serviceAccount = loadServiceAccountFromEnv();
  }

  // Fall back to individual env variables
  if (!serviceAccount) {
    serviceAccount = buildServiceAccountFromEnvVars();
  }

  // If still no service account, error out
  if (!serviceAccount) {
    firebaseAdminInitError = new Error(
      'Firebase service account not found. Provide one of: ' +
      '1) firebase-service-account.json file, ' +
      '2) FIREBASE_SERVICE_ACCOUNT_KEY env variable, or ' +
      '3) FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY env variables'
    );
    console.error('❌', firebaseAdminInitError.message);
    return false;
  }

  // Validate the service account
  try {
    validateServiceAccount(serviceAccount);
    console.log('✅ Service account validated');
    console.log('   Project ID:', serviceAccount.project_id);
    console.log('   Client Email:', serviceAccount.client_email);
  } catch (e) {
    firebaseAdminInitError = e;
    console.error('❌ Service account validation failed:', e.message);
    return false;
  }

  // Initialize Firebase Admin
  if (getApps().length === 0) {
    try {
      console.log('📝 Initializing Firebase Admin SDK with service account...');
      initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
      console.log('✅ Firebase Admin initialized successfully for project:', serviceAccount.project_id);
    } catch (e) {
      firebaseAdminInitError = e;
      console.error('❌ Firebase Admin initialization failed:', e.message);
      return false;
    }
  } else {
    console.log('ℹ️  Firebase Admin already initialized');
  }

  firebaseAdminReady = true;
  return true;
}

// Initialize on module load
initFirebaseAdmin();

// Export initialization function for manual retry
export function ensureFirebaseAdminInitialized() {
  if (!firebaseAdminReady && !firebaseAdminInitError) {
    return initFirebaseAdmin();
  }
  if (firebaseAdminInitError) {
    throw firebaseAdminInitError;
  }
  return firebaseAdminReady;
}

// Export auth and db interfaces
export const auth = firebaseAdminReady ? getAuth() : null;
export const db = firebaseAdminReady ? getFirestore() : null;

// Export functions that routes might need
export { getAuth, cert, getApps, initializeApp, getFirestore };