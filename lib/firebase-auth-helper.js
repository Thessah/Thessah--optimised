/**
 * Firebase Authentication Helper
 * Provides centralized token verification and user ID extraction
 */

import { auth, ensureFirebaseAdminInitialized } from './firebase-admin';

/**
 * Extract Firebase token from Authorization header
 * @param {Request} request - Next.js request object
 * @returns {string|null} - The ID token or null if not present
 */
export function extractToken(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split('Bearer ')[1];
}

/**
 * Verify Firebase ID token and extract user ID
 * @param {string} idToken - Firebase ID token
 * @returns {Promise<{uid: string, email: string}>} - Decoded token data
 * @throws {Error} - If token is invalid or Firebase not initialized
 */
export async function verifyFirebaseToken(idToken) {
  if (!idToken) {
    throw new Error('No token provided');
  }

  // Ensure Firebase Admin is initialized
  ensureFirebaseAdminInitialized();

  if (!auth) {
    throw new Error('Firebase Admin Auth not available');
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      customClaims: decodedToken.custom_claims || {},
    };
  } catch (err) {
    console.error('Token verification failed:', err.message);
    throw new Error(`Invalid or expired token: ${err.message}`);
  }
}

/**
 * Middleware: Verify Firebase token from Authorization header
 * @param {Request} request - Next.js request object
 * @returns {Promise<{uid: string, email: string}>} - User data or throws error
 * @throws {Error} - If token is missing or invalid
 */
export async function requireFirebaseAuth(request) {
  const token = extractToken(request);
  if (!token) {
    throw new Error('Authorization header missing or invalid');
  }

  return verifyFirebaseToken(token);
}

/**
 * Optionally verify Firebase token - returns null if no token or verification fails
 * Useful for routes that support both authenticated and guest users
 * @param {Request} request - Next.js request object
 * @returns {Promise<{uid: string, email: string}|null>} - User data or null
 */
export async function optionalFirebaseAuth(request) {
  const token = extractToken(request);
  if (!token) {
    return null;
  }

  try {
    return await verifyFirebaseToken(token);
  } catch (err) {
    console.warn('Optional auth verification failed:', err.message);
    return null;
  }
}
