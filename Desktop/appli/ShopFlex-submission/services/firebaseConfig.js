import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCHlQOeMY0I_8sPMOpbNHn0jcvRomMjXqQ",
  authDomain: "shopflex-5e1e2.firebaseapp.com",
  projectId: "shopflex-5e1e2",
  storageBucket: "shopflex-5e1e2.firebasestorage.app",
  messagingSenderId: "681925401865",
  appId: "1:681925401865:web:2631c145079fc3d27087d8"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize services with default configuration
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Log initialization for debugging
console.log("Firebase initialized in firebaseConfig.js");

// Export Firebase services
export { db, auth, storage };
