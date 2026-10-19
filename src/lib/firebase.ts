import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyPlaceholderKeyForDevelopmentTesting',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'smartparking-d5ee3.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'smartparking-d5ee3',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'smartparking-d5ee3.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '200568943465',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:200568943465:web:869ce5ddef0786ab1b43f8',
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.warn('Firebase initialization notice:', error);
  // Create fallback mock containers if Firebase config is invalid in offline mode
  app = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
}

export { app, auth, db };
