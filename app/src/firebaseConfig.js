// Fill these in from Firebase console → Project settings → Your apps → Web app config.
// This is safe to commit (Firebase web config is not a secret) as long as your
// Firestore/Storage security rules actually enforce access control (see firestore.rules).

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.appspot.com",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME",
};

// Lets screens show a clear, specific message ("Firebase isn't configured
// yet") instead of a cryptic SDK error (auth/invalid-api-key, etc.) when
// someone hasn't filled in their real project keys yet.
export function isFirebaseConfigured() {
  return Object.values(firebaseConfig).every((v) => !String(v).includes("REPLACE_ME"));
}

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
