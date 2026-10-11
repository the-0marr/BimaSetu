// frontend/src/context/AuthContext.jsx
// Single source of truth for auth (local session + Firebase)

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  updateProfile as updateFirebaseProfile
} from 'firebase/auth'
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, googleProvider, isFirebaseConfigured, db } from '../firebase'

const AuthContext = createContext(null)

const TOKEN_KEY = 'bimasetu_token'
const USER_KEY = 'bimasetu_user'
const MOCK_KEY = 'bimasetu_mock_user'

export function farmerIdFromUid(uid) {
  if (!uid) return '#BMS0000'
  const compact = uid.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()
  return `#BMS${compact.padStart(4, '0').slice(-4)}`
}

function normalizeLocalUser(stored, token) {
  const email = stored.email || ''
  const name = stored.name || stored.displayName || email.split('@')[0] || 'Farmer'
  const uid = stored.uid || `local-${email || token || Date.now()}`
  return {
    uid,
    name,
    email,
    displayName: name,
    photoURL: stored.photoURL || null,
  }
}

function normalizeFirebaseUser(firebaseUser) {
  return {
    uid: firebaseUser.uid,
    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || firebaseUser.phoneNumber || 'Farmer',
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || firebaseUser.phoneNumber || 'Farmer',
    photoURL: firebaseUser.photoURL || null,
    phoneNumber: firebaseUser.phoneNumber || null,
    _firebase: firebaseUser,
  }
}

async function findFarmerByPhone(phoneNumber) {
  if (!phoneNumber) return null
  try {
    const farmersRef = collection(db, 'farmers')
    const q = query(farmersRef, where('phone', '==', phoneNumber))
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null
    const farmerDoc = snapshot.docs[0]
    return { id: farmerDoc.id, ...farmerDoc.data() }
  } catch (err) {
    console.error('Error querying farmer by phone:', err)
    return null
  }
}

async function findFarmerByUid(uid) {
  if (!uid) return null
  try {
    const farmerRef = doc(db, 'farmers', uid)
    const farmerSnap = await getDoc(farmerRef)
    return farmerSnap.exists() ? { id: farmerSnap.id, ...farmerSnap.data() } : null
  } catch (err) {
    console.error('Error querying farmer by uid:', err)
    return null
  }
}

async function ensureFarmerRecord(firebaseUser) {
  if (!firebaseUser) return { exists: false, phoneNumber: null, user: normalizeFirebaseUser(firebaseUser) }

  let farmer = await findFarmerByUid(firebaseUser.uid)
  if (!farmer && firebaseUser.phoneNumber) {
    farmer = await findFarmerByPhone(firebaseUser.phoneNumber)
  }

  if (farmer) {
    if (!firebaseUser.displayName && farmer.fullName) {
      try {
        await updateFirebaseProfile(firebaseUser, { displayName: farmer.fullName })
      } catch (err) {
        console.warn('Could not update Firebase displayName from Firestore:', err)
      }
    }
    return { exists: true, profile: farmer, user: normalizeFirebaseUser(firebaseUser) }
  }

  return { exists: false, phoneNumber: firebaseUser.phoneNumber || null, user: normalizeFirebaseUser(firebaseUser) }
}

async function createFarmerRecord(firebaseUser, profileData) {
  if (!firebaseUser?.uid) throw new Error('No authenticated Firebase user available.')
  const phone = firebaseUser.phoneNumber || profileData.phone
  const fullName = profileData.fullName?.trim() || firebaseUser.displayName || phone || ''
  const payload = {
    uid: firebaseUser.uid,
    fullName,
    phone,
    village: profileData.village?.trim() || '',
    state: profileData.state?.trim() || '',
    email: firebaseUser.email || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    authProvider: 'phone',
  }

  await setDoc(doc(db, 'farmers', firebaseUser.uid), payload)
  if (!firebaseUser.displayName && fullName) {
    await updateFirebaseProfile(firebaseUser, { displayName: fullName })
  }

  return payload
}

function readLocalSession() {
  const token = localStorage.getItem(TOKEN_KEY)
  const raw = localStorage.getItem(USER_KEY)
  if (!token || !raw) return null
  try {
    return normalizeLocalUser(JSON.parse(raw), token)
  } catch {
    return null
  }
}

function persistLocalSession(user, tokenPrefix = 'token') {
  const token = `${tokenPrefix}_${Date.now()}`
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({
      uid: user.uid,
      name: user.name,
      email: user.email,
      displayName: user.displayName,
    })
  )
  localStorage.removeItem(MOCK_KEY)
}

function clearAllSessionKeys() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(MOCK_KEY)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const recaptchaVerifierRef = useRef(null)
  const confirmationResultRef = useRef(null)

  useEffect(() => {
    const local = readLocalSession()
    if (local) {
      setUser(local)
      setLoading(false)
      return
    }

    const mockSession = localStorage.getItem(MOCK_KEY)
    if (mockSession) {
      try {
        const parsed = JSON.parse(mockSession)
        setUser(normalizeLocalUser(parsed, 'mock'))
      } catch {
        /* ignore */
      }
      setLoading(false)
      return
    }

    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser ? normalizeFirebaseUser(firebaseUser) : null)
        setLoading(false)
      })
      return unsubscribe
    }

    setLoading(false)
  }, [])

  const login = useCallback((credentials) => {
    const { email, name, tokenPrefix = 'token' } = credentials
    const displayName = name || email?.split('@')[0] || 'Farmer'
    const sessionUser = {
      uid: `local-${(email || displayName).replace(/\s/g, '-').toLowerCase()}`,
      name: displayName,
      email: email || '',
      displayName,
    }
    persistLocalSession(sessionUser, tokenPrefix)
    setUser(sessionUser)
    return sessionUser
  }, [])

  const loginWithEmail = useCallback(async (email, password) => {
    if (isFirebaseConfigured && auth) {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const normalized = normalizeFirebaseUser(userCredential.user)
      setUser(normalized)
      return normalized
    } else {
      return login({ email, tokenPrefix: 'token' })
    }
  }, [login])

  const signUpWithEmail = useCallback(async (email, password, fullName) => {
    if (isFirebaseConfigured && auth) {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      await updateFirebaseProfile(userCredential.user, {
        displayName: fullName
      })
      const normalized = normalizeFirebaseUser({
        ...userCredential.user,
        displayName: fullName
      })
      setUser(normalized)
      return normalized
    } else {
      return login({ email, name: fullName, tokenPrefix: 'signup' })
    }
  }, [login])

  const loginWithGoogle = useCallback(async () => {
    if (isFirebaseConfigured && auth && googleProvider) {
      const userCredential = await signInWithPopup(auth, googleProvider)
      const normalized = normalizeFirebaseUser(userCredential.user)
      setUser(normalized)
      return normalized
    } else {
      return login({ email: 'google@gmail.com', name: 'Google User', tokenPrefix: 'google' })
    }
  }, [login])

  // Send OTP to a phone number. containerId = id of the invisible recaptcha div
  const loginWithPhone = useCallback(async (phoneNumber, containerId = 'recaptcha-container') => {
    if (isFirebaseConfigured && auth) {
      // Clear any previous verifier
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear()
        recaptchaVerifierRef.current = null
      }
      const verifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {},
      })
      recaptchaVerifierRef.current = verifier
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier)
      confirmationResultRef.current = confirmationResult
      return confirmationResult
    } else {
      // Mock fallback: just resolve
      confirmationResultRef.current = { _mock: true }
      return confirmationResultRef.current
    }
  }, [])

  // Verify OTP code returned by the user
  const verifyOtp = useCallback(async (otp) => {
    if (!confirmationResultRef.current) throw new Error('No OTP session. Request OTP first.')
    if (confirmationResultRef.current._mock) {
      // Mock fallback
      return login({ email: 'phone@bimasetu.app', name: 'Farmer', tokenPrefix: 'otp' })
    }
    const userCredential = await confirmationResultRef.current.confirm(otp)
    const firebaseUser = userCredential.user
    const normalized = normalizeFirebaseUser(firebaseUser)
    setUser(normalized)

    const accountCheck = await ensureFarmerRecord(firebaseUser)
    if (!accountCheck.exists && accountCheck.phoneNumber) {
      return { newFarmer: true, phoneNumber: accountCheck.phoneNumber }
    }

    return normalized
  }, [login])

  const createFarmerProfile = useCallback(async (profileData) => {
    const firebaseUser = auth?.currentUser
    if (!firebaseUser) throw new Error('Unable to create farmer profile without a logged-in user.')
    const profile = await createFarmerRecord(firebaseUser, profileData)
    const normalized = normalizeFirebaseUser({ ...firebaseUser, displayName: profile.fullName })
    setUser(normalized)
    return profile
  }, [])

  const loginAsMockUser = useCallback((mockUser) => {
    const normalized = normalizeLocalUser(mockUser, 'mock')
    localStorage.setItem(MOCK_KEY, JSON.stringify(normalized))
    setUser(normalized)
  }, [])

  const updateProfile = useCallback((updates) => {
    setUser((prev) => {
      if (!prev) return prev
      const next = {
        ...prev,
        name: updates.name ?? prev.name,
        displayName: updates.name ?? prev.displayName,
        email: updates.email ?? prev.email,
      }
      const token = localStorage.getItem(TOKEN_KEY)
      if (token) {
        localStorage.setItem(
          USER_KEY,
          JSON.stringify({
            uid: next.uid,
            name: next.name,
            email: next.email,
            displayName: next.displayName,
          })
        )
      }
      return next
    })
  }, [])

  const logout = useCallback(async () => {
    clearAllSessionKeys()
    if (isFirebaseConfigured && auth) {
      try {
        await signOut(auth)
      } catch (err) {
        console.error('Firebase signOut failed:', err)
      }
    }
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithEmail,
        signUpWithEmail,
        loginWithGoogle,
        loginWithPhone,
        verifyOtp,
        createFarmerProfile,
        logout,
        loginAsMockUser,
        updateProfile,
        farmerId: farmerIdFromUid(user?.uid),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
