import { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsub;
  }, []);

  const clearError = () => setAuthError('');

  const loginWithGoogle = async () => {
    setAuthError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(friendlyError(err.code));
      throw err;
    }
  };

  const loginWithEmail = async (email, password) => {
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setAuthError(friendlyError(err.code));
      throw err;
    }
  };

  const registerWithEmail = async (email, password, displayName) => {
    setAuthError('');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }
    } catch (err) {
      setAuthError(friendlyError(err.code));
      throw err;
    }
  };

  const resetPassword = async (email) => {
    setAuthError('');
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setAuthError(friendlyError(err.code));
      throw err;
    }
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{
      user, loading, authError, clearError,
      loginWithGoogle, loginWithEmail,
      registerWithEmail, resetPassword, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

function friendlyError(code) {
  const map = {
    'auth/user-not-found':       'No account found with this email.',
    'auth/wrong-password':       'Incorrect password. Please try again.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password':        'Password must be at least 6 characters.',
    'auth/invalid-email':        'Please enter a valid email address.',
    'auth/too-many-requests':    'Too many failed attempts. Try again later.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/invalid-credential':   'Invalid email or password.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}
