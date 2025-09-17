import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork, doc, getDoc } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingFields = requiredFields.filter(field => !firebaseConfig[field]);

  if (missingFields.length > 0) {
    console.warn('Missing Firebase configuration fields:', missingFields);
    return false;
  }
  return true;
};

const app = initializeApp(firebaseConfig);

// Initialize Authentication
const auth = getAuth(app);

// Initialize Analytics only in production
let analytics = null;
try {
  if (typeof window !== 'undefined' && import.meta.env.PROD && validateFirebaseConfig()) {
    analytics = getAnalytics(app);
  }
} catch (error) {
  console.warn('Analytics initialization failed:', error);
}

// Initialize Firestore with enhanced error handling
const db = getFirestore(app);

// Enhanced Firestore error handling
let firestoreAvailable = true;
let currentUser = null;
let isAdmin = false;

// Test Firestore connectivity
const testFirestoreConnection = async () => {
  try {
    // Simple connectivity test - this should not trigger listeners
    await enableNetwork(db);
    return true;
  } catch (error) {
    console.warn('Firestore connection test failed:', error);
    firestoreAvailable = false;
    return false;
  }
};

// Initialize connectivity test
if (validateFirebaseConfig()) {
  testFirestoreConnection().catch(() => {
    console.warn('Firestore will operate in offline-first mode');
  });
}

// Enhanced error wrapper for Firestore operations
const withFirestoreErrorHandling = async (operation, fallback = null) => {
  try {
    if (!validateFirebaseConfig()) {
      console.warn('Firebase not properly configured, using fallback');
      return fallback;
    }
    return await operation();
  } catch (error) {
    console.warn('Firestore operation failed, using fallback:', error.message);
    firestoreAvailable = false;
    return fallback;
  }
};

// 🔑 Anonymous Authentication Setup
const initializeAuth = async () => {
  try {
    // Sign in anonymously on startup
    const userCredential = await signInAnonymously(auth);
    currentUser = userCredential.user;
    console.log('✅ Anonymous sign-in successful:', currentUser.uid);

    // Check if user is admin
    await checkAdminStatus(currentUser.uid);
  } catch (error) {
    console.error('❌ Anonymous sign-in failed:', error);
  }
};

// 🛡️ Admin Status Checker
const checkAdminStatus = async (uid) => {
  try {
    const adminDoc = await getDoc(doc(db, 'admins', uid));
    isAdmin = adminDoc.exists();
    console.log(`🔐 Admin status for ${uid}:`, isAdmin);
  } catch (error) {
    console.warn('Failed to check admin status:', error);
    isAdmin = false;
  }
};

// 🔄 Auth State Listener
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    await checkAdminStatus(user.uid);
  } else {
    currentUser = null;
    isAdmin = false;
  }
});

// Initialize authentication if Firebase is configured
if (validateFirebaseConfig()) {
  initializeAuth();
}

// 🛡️ Admin Permission Checker
const isUserAdmin = () => {
  return isAdmin && currentUser !== null;
};

// 🔐 Get Current User Info
const getCurrentUser = () => {
  return {
    user: currentUser,
    isAdmin: isAdmin,
    uid: currentUser?.uid || null
  };
};

export {
  analytics,
  db,
  auth,
  firebaseConfig,
  app,
  withFirestoreErrorHandling,
  firestoreAvailable,
  isUserAdmin,
  getCurrentUser
};
// Firebase init
