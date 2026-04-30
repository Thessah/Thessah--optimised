// lib/firebase-admin.js
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let firebaseAdminReady = false;
let firebaseAdminInitError = null;

function initFirebaseAdmin() {
  if (firebaseAdminReady || firebaseAdminInitError) return firebaseAdminReady;

  const keyEnv = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!keyEnv) {
    firebaseAdminInitError = new Error('FIREBASE_SERVICE_ACCOUNT_KEY env variable is missing');
    console.error('❌ Firebase Admin not initialized:', firebaseAdminInitError.message);
    return false;
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(keyEnv);
    console.log('✅ Service account parsed successfully');
    console.log('📋 Project ID:', serviceAccount.project_id);
    console.log('📋 Client Email:', serviceAccount.client_email);

    if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
      throw new Error('Service account is missing required fields (project_id, private_key, or client_email)');
    }
  } catch (e) {
    firebaseAdminInitError = e;
    console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY parsing error:', e.message);
    return false;
  }

  if (!getApps().length) {
    console.log('🔥 Initializing Firebase Admin SDK...');
    try {
      if (!process.env.GOOGLE_CLOUD_PROJECT) {
        process.env.GOOGLE_CLOUD_PROJECT = serviceAccount.project_id;
      }
      if (!process.env.GCLOUD_PROJECT) {
        process.env.GCLOUD_PROJECT = serviceAccount.project_id;
      }
      if (!process.env.FIREBASE_CONFIG) {
        process.env.FIREBASE_CONFIG = JSON.stringify({ projectId: serviceAccount.project_id });
      }

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

initFirebaseAdmin();

export const db = firebaseAdminReady ? getFirestore() : null;
export { getAuth };
// Convenience export to align with existing imports
export const auth = firebaseAdminReady ? getAuth() : null;