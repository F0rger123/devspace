import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  GithubAuthProvider, 
  onAuthStateChanged, 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  confirmPasswordReset,
  verifyPasswordResetCode,
  linkWithPopup,
  linkWithCredential,
  unlink,
  EmailAuthProvider
} from 'firebase/auth';
import { initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager, doc, setDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

let firestoreInstance;
try {
  firestoreInstance = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
} catch (e) {
  firestoreInstance = getFirestore(app);
}
export const db = firestoreInstance;

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/documents');
provider.addScope('https://www.googleapis.com/auth/drive.readonly');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/gmail.send');

const githubProvider = new GithubAuthProvider();
githubProvider.addScope('repo'); // for checking repositories

let isSigningIn = false;
let cachedAccessToken: string | null = null;
try {
  const stored = typeof window !== 'undefined' ? window.localStorage.getItem('app_google_token') : null;
  if (stored) {
    if (stored.startsWith('"') && stored.endsWith('"')) {
      cachedAccessToken = JSON.parse(stored);
    } else {
      cachedAccessToken = stored;
    }
  }
} catch (e) {}

export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onAuthSuccess) {
        onAuthSuccess(user, cachedAccessToken);
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const signUpWithEmailPassword = async (email: string, password: string, username: string): Promise<User> => {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('signup_username', cleanUsername);
    }
    const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const user = credential.user;
    
    // Update profile displayName
    await updateProfile(user, { displayName: cleanUsername });
    
    // Create User record in Firestore
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      uid: user.uid,
      email: cleanEmail,
      username: cleanUsername,
      displayName: cleanUsername,
      avatarColor: ['#eab308', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f97316'][Math.floor(Math.random() * 6)],
      title: 'Full-Stack Developer',
      bio: 'Active DevSpace collaborator and software designer.',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('signup_username');
    }

    return user;
  } catch (error: any) {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('signup_username');
    }
    console.error('Email sign up error:', error);
    throw error;
  }
};

export const loginWithEmailPassword = async (email: string, password: string): Promise<User> => {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    return credential.user;
  } catch (error: any) {
    console.error('Email sign in error:', error);
    throw error;
  }
};

export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    const actionCodeSettings = {
      url: `${window.location.origin}/?mode=resetPassword`,
      handleCodeInApp: true,
    };
    await sendPasswordResetEmail(auth, email, actionCodeSettings);
  } catch (error: any) {
    if (error.code === 'auth/unauthorized-continue-uri' || error.message?.includes('unauthorized') || error.message?.includes('continue-uri')) {
      console.warn('Redirect URL not authorized in Firebase Console, falling back to default action handler page.');
      await sendPasswordResetEmail(auth, email);
    } else {
      console.error('Password reset error:', error);
      throw error;
    }
  }
};

export const confirmReset = async (code: string, newPass: string): Promise<void> => {
  try {
    await confirmPasswordReset(auth, code, newPass);
  } catch (error: any) {
    console.error('Confirm password reset error:', error);
    throw error;
  }
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    
    // Register Google User in users collection if not already there
    try {
      const userDocRef = doc(db, 'users', result.user.uid);
      const email = result.user.email || '';
      const username = result.user.displayName || email.split('@')[0] || 'User';
      await setDoc(userDocRef, {
        uid: result.user.uid,
        email: email,
        username: username,
        displayName: result.user.displayName || username,
        avatarColor: ['#eab308', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f97316'][Math.floor(Math.random() * 6)],
        title: 'Full-Stack Developer',
        bio: 'Active DevSpace collaborator and Google authenticated developer.',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }, { merge: true });
    } catch (e) {
      console.warn('Could not register Google user in users collection:', e);
    }

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    if (error?.code === 'auth/operation-not-allowed') {
      throw new Error('Firebase: Authentication provider not enabled. Please enable Google sign-in in the Firebase Console.');
    }
    if (error?.code === 'auth/account-exists-with-different-credential') {
      const enrichedError = new Error('An account already exists with the same email.') as any;
      enrichedError.code = error.code;
      enrichedError.email = error.customData?.email || error.email;
      enrichedError.credential = GoogleAuthProvider.credentialFromError(error);
      enrichedError.originalError = error;
      throw enrichedError;
    }
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const githubSignIn = async (): Promise<{ user: User; accessToken: string, username: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, githubProvider);
    const credential = GithubAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }
    
    const token = credential.accessToken;
    let username = '';
    
    try {
        const ghRes = await fetch('https://api.github.com/user', {
           headers: { Authorization: `token ${token}` }
        });
        const ghUser = await ghRes.json();
        if (ghUser && ghUser.login) username = ghUser.login;
    } catch(e) {}
    
    // Register Github User in users collection if not already there
    try {
      const userDocRef = doc(db, 'users', result.user.uid);
      const email = result.user.email || '';
      const finalUsername = username || result.user.displayName || 'GithubUser';
      await setDoc(userDocRef, {
        uid: result.user.uid,
        email: email,
        username: finalUsername,
        displayName: result.user.displayName || finalUsername,
        avatarColor: ['#eab308', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f97316'][Math.floor(Math.random() * 6)],
        title: 'Software Engineer',
        bio: 'Active DevSpace collaborator and GitHub certified developer.',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }, { merge: true });
    } catch (e) {
      console.warn('Could not register Github user in users collection:', e);
    }
    
    return { user: result.user, accessToken: token, username };
  } catch (error: any) {
    if (error?.code === 'auth/operation-not-allowed') {
      throw new Error('Firebase: Authentication provider not enabled. Please enable GitHub sign-in in the Firebase Console.');
    }
    if (error?.code === 'auth/account-exists-with-different-credential') {
      const enrichedError = new Error('An account already exists with the same email.') as any;
      enrichedError.code = error.code;
      enrichedError.email = error.customData?.email || error.email;
      enrichedError.credential = GithubAuthProvider.credentialFromError(error);
      enrichedError.originalError = error;
      throw enrichedError;
    }
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Account Linking helper functions
export const linkProvider = async (user: User, providerName: 'google' | 'github'): Promise<User> => {
  const prov = providerName === 'google' ? provider : githubProvider;
  const result = await linkWithPopup(user, prov);
  
  // Register/update user document upon successful linking
  try {
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      uid: user.uid,
      email: user.email || '',
      updatedAt: Date.now()
    }, { merge: true });
  } catch (e) {
    console.warn('Could not update user collection after provider link:', e);
  }
  
  return result.user;
};

export const unlinkProvider = async (user: User, providerId: string): Promise<User> => {
  const result = await unlink(user, providerId);
  return result;
};

export const linkWithPendingCredential = async (user: User, credential: any): Promise<User> => {
  const result = await linkWithCredential(user, credential);
  
  // Register/update user document upon successful linking
  try {
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      uid: user.uid,
      email: user.email || '',
      updatedAt: Date.now()
    }, { merge: true });
  } catch (e) {
    console.warn('Could not update user collection after linking credential:', e);
  }
  
  return result.user;
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('app_google_token');
    window.localStorage.removeItem('app_google_user');
    window.localStorage.removeItem('app_auth_mode');
    window.localStorage.removeItem('app_user_profile');
    window.localStorage.removeItem('app_github_token');
    window.localStorage.removeItem('app_github_profile');
    window.localStorage.removeItem('app_last_github_repo');
  }
};
