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
  updateProfile
} from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

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
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Password reset error:', error);
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
      throw new Error('An account already exists with the same email. Please sign in with the provider you originally used (e.g., GitHub) or enable "Link accounts that use the same email" in the Firebase console.');
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
      throw new Error('An account already exists with the same email. Please sign in with the provider you originally used (e.g., Google) or enable "Link accounts that use the same email" in the Firebase Authentication console.');
    }
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
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
  }
};
