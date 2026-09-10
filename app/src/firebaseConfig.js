// Fill these in from Firebase console → Project settings → Your apps → Web app config.
// This is safe to commit (Firebase web config is not a secret) as long as your
// Firestore/Storage security rules actually enforce access control (see firestore.rules).

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC7YnH27cYfIu-09uwcVgxC_P4oqhUe7hg",
  authDomain: "walkie-talkie-6f866.firebaseapp.com",
  projectId: "walkie-talkie-6f866",
  storageBucket: "walkie-talkie-6f866.firebasestorage.app",
  messagingSenderId: "1007349613163",
  appId: "1:1007349613163:web:a60f73928a39fa103f272e",
  measurementId: "G-P8G8E6MCXT"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
