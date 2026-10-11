// frontend/src/firebase.js
// Firebase app initialization — keys loaded from .env (never hardcoded)

import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

let app = null
let auth = null
let db = null
let storage = null
let googleProvider = null

const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== 'your-api-key' && firebaseConfig.apiKey.trim() !== ''

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)
    storage = getStorage(app)
    googleProvider = new GoogleAuthProvider()
  } catch (err) {
    console.error("Firebase init failed:", err)
  }
} else {
  console.warn("Firebase is not configured. Running in Mock Auth / Local Mode.")
}

export { auth, db, storage, googleProvider, isFirebaseConfigured }
export default app
