import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/documents.readonly');

const githubProvider = new GithubAuthProvider();
githubProvider.addScope('repo'); // for checking repositories

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
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
    
    // AdditionalUserInfo from credential handles the username for github
    // but the username is present on result.user for most part, but we can also get it via REST API.
    // Better to just fetch it using API.
    const token = credential.accessToken;
    let username = '';
    
    try {
        const ghRes = await fetch('https://api.github.com/user', {
           headers: { Authorization: `token ${token}` }
        });
        const ghUser = await ghRes.json();
        if (ghUser && ghUser.login) username = ghUser.login;
    } catch(e) {}
    
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
};
