import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
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
import { initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager, doc, collection, setLogLevel, disableNetwork, setDoc, addDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(v => sanitizeForFirestore(v)).filter(v => v !== undefined && v !== null);
  if (typeof obj === 'object') {
    const res: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined && val !== null) {
        res[key] = sanitizeForFirestore(val);
      }
    }
    return res;
  }
  return obj;
}

export async function setDocWithSanitize(ref: any, data: any, options?: any) {
  try {
    if (options) return await setDoc(ref, sanitizeForFirestore(data), options);
    return await setDoc(ref, sanitizeForFirestore(data));
  } catch (err) {
    console.warn("[Auth] setDocWithSanitize error:", err);
  }
}

export async function addDocWithSanitize(ref: any, data: any) {
  try {
    return await addDoc(ref, sanitizeForFirestore(data));
  } catch (err) {
    console.warn("[Auth] addDocWithSanitize error:", err);
  }
}

try {
  setLogLevel('silent');
} catch (e) {}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

let firestoreInstance: any;
try {
  const dbId = (firebaseConfig as any).firestoreDatabaseId;
  firestoreInstance = dbId ? getFirestore(app, dbId) : getFirestore(app);
} catch (e1) {
  try {
    firestoreInstance = getFirestore(app);
  } catch (e2) {
    console.warn("[Auth] Failed to initialize Firestore instance:", e2);
    firestoreInstance = null;
  }
}
export const db = firestoreInstance;

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
provider.addScope('https://www.googleapis.com/auth/calendar.events');

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
  if (typeof window !== 'undefined') {
    getRedirectResult(auth).then(async (result) => {
      if (result && result.user) {
        const googleCred = GoogleAuthProvider.credentialFromResult(result);
        const githubCred = GithubAuthProvider.credentialFromResult(result);
        const token = googleCred?.accessToken || githubCred?.accessToken || null;
        if (token) {
          cachedAccessToken = token;
          window.localStorage.setItem('app_google_token', token);
        }
        try {
          const userDocRef = doc(db, 'users', result.user.uid);
          const email = (result.user.email || '').toLowerCase().trim();
          const username = result.user.displayName || email.split('@')[0] || 'User';
          await setDocWithSanitize(userDocRef, {
            uid: result.user.uid,
            email: email,
            username: username,
            displayName: result.user.displayName || username,
            avatarColor: ['#eab308', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f97316'][Math.floor(Math.random() * 6)],
            title: 'Full-Stack Developer',
            createdAt: Date.now(),
            updatedAt: Date.now()
          }, { merge: true });
        } catch (e) {
          console.warn('Could not register redirect result user:', e);
        }
      }
    }).catch((err) => {
      console.warn('getRedirectResult warning:', err);
    });
  }

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
      window.sessionStorage.setItem('is_new_signup', 'true');
    }
    const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const user = credential.user;
    
    // Update profile displayName
    await updateProfile(user, { displayName: cleanUsername });
    
    // Create User record in Firestore
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDocWithSanitize(userDocRef, {
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
    } catch (docErr) {
      console.warn("Failed to set user document in Firestore during signup (may be offline/quota mode):", docErr);
    }

    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('signup_username');
    }

    return user;
  } catch (error: any) {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('signup_username');
    }
    if (error?.code === 'auth/operation-not-allowed' || error?.message?.includes('operation-not-allowed')) {
      console.warn('Email sign up provider not enabled (auth/operation-not-allowed). This is expected if the provider has not been turned on in the Firebase Console.');
    } else {
      console.error('Email sign up error:', error);
    }
    throw error;
  }
};

export const loginWithEmailPassword = async (email: string, password: string): Promise<User> => {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    return credential.user;
  } catch (error: any) {
    if (error?.code === 'auth/operation-not-allowed' || error?.message?.includes('operation-not-allowed')) {
      console.warn('Email sign in provider not enabled (auth/operation-not-allowed). This is expected if the provider has not been turned on in the Firebase Console.');
    } else {
      console.error('Email sign in error:', error);
    }
    throw error;
  }
};

export const logPasswordResetAttempt = async (
  email: string,
  action: 'request' | 'confirm',
  status: 'success' | 'failure',
  errorCode?: string,
  errorMessage?: string
): Promise<void> => {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const logsRef = collection(db, 'password_reset_logs');
    await addDocWithSanitize(logsRef, {
      email: cleanEmail || 'unknown',
      action,
      status,
      errorCode: errorCode || null,
      errorMessage: errorMessage || null,
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      origin: typeof window !== 'undefined' ? window.location.origin : 'server'
    });
  } catch (err) {
    console.error('Failed to write password reset log:', err);
  }
};

export const sendPasswordReset = async (email: string): Promise<void> => {
  const cleanEmail = email.trim().toLowerCase();
  try {
    await sendPasswordResetEmail(auth, cleanEmail);
    await logPasswordResetAttempt(cleanEmail, 'request', 'success');
  } catch (error: any) {
    console.error('Password reset error:', error);
    await logPasswordResetAttempt(cleanEmail, 'request', 'failure', error.code || 'unknown', error.message || String(error));
    throw error;
  }
};

export const confirmReset = async (code: string, newPass: string): Promise<void> => {
  let email = 'unknown';
  try {
    email = await verifyPasswordResetCode(auth, code);
  } catch (e: any) {
    console.warn('Could not pre-verify password reset code for email:', e.message);
  }

  try {
    await confirmPasswordReset(auth, code, newPass);
    await logPasswordResetAttempt(email, 'confirm', 'success');
  } catch (error: any) {
    console.error('Confirm password reset error:', error);
    await logPasswordResetAttempt(email, 'confirm', 'failure', error.code || 'unknown', error.message || String(error));
    throw error;
  }
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    let result: any = null;
    try {
      result = await signInWithPopup(auth, provider);
    } catch (popupErr: any) {
      if (
        popupErr?.code === 'auth/popup-blocked' ||
        popupErr?.code === 'auth/popup-closed-by-user' ||
        popupErr?.message?.includes('popup')
      ) {
        console.warn('Popup blocked or closed, redirecting to Google auth page...');
        await signInWithRedirect(auth, provider);
        return null;
      }
      throw popupErr;
    }

    if (!result) return null;
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken || (credential as any)?.idToken || '';
    cachedAccessToken = token || null;
    if (token) {
      try {
        window.localStorage.setItem('app_google_token', token);
      } catch (e) {}
    }
    
    // Register Google User in users collection if not already there
    try {
      const userDocRef = doc(db, 'users', result.user.uid);
      const email = (result.user.email || '').toLowerCase().trim();
      const username = result.user.displayName || email.split('@')[0] || 'User';
      await setDocWithSanitize(userDocRef, {
        uid: result.user.uid,
        email: email,
        username: username,
        displayName: result.user.displayName || username,
        avatarColor: ['#eab308', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f97316'][Math.floor(Math.random() * 6)],
        title: 'Full-Stack Developer',
        bio: 'Active DevSpace collaborator and Google authenticated developer.',
        googleLinked: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }, { merge: true });
    } catch (e) {
      console.warn('Could not register Google user in users collection:', e);
    }

    return { user: result.user, accessToken: cachedAccessToken || '' };
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
    let result: any = null;
    try {
      result = await signInWithPopup(auth, githubProvider);
    } catch (popupErr: any) {
      if (
        popupErr?.code === 'auth/popup-blocked' ||
        popupErr?.code === 'auth/popup-closed-by-user' ||
        popupErr?.message?.includes('popup')
      ) {
        console.warn('Popup blocked or closed, redirecting to GitHub auth page...');
        await signInWithRedirect(auth, githubProvider);
        return null;
      }
      throw popupErr;
    }

    if (!result) return null;
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
    
    // Fetch primary email from GitHub API if not returned by Firebase Auth
    let email = (result.user.email || '').toLowerCase().trim();
    if (!email) {
      try {
        const emailsRes = await fetch('https://api.github.com/user/emails', {
          headers: { Authorization: `token ${token}` }
        });
        if (emailsRes.ok) {
          const emails = await emailsRes.json();
          if (Array.isArray(emails)) {
            const primaryEmailObj = emails.find((e: any) => e.primary);
            if (primaryEmailObj) {
              email = (primaryEmailObj.email || '').toLowerCase().trim();
            } else if (emails.length > 0) {
              email = (emails[0].email || '').toLowerCase().trim();
            }
          }
        }
      } catch (emailErr) {
        console.warn('[GitHub Auth] Failed to retrieve user emails:', emailErr);
      }
    }

    // Register Github User in users collection if not already there
    try {
      const userDocRef = doc(db, 'users', result.user.uid);
      const finalUsername = username || result.user.displayName || 'GithubUser';
      await setDocWithSanitize(userDocRef, {
        uid: result.user.uid,
        email: email,
        username: finalUsername,
        displayName: result.user.displayName || finalUsername,
        avatarColor: ['#eab308', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f97316'][Math.floor(Math.random() * 6)],
        title: 'Software Engineer',
        bio: 'Active DevSpace collaborator and GitHub certified developer.',
        githubToken: token,
        githubUser: finalUsername,
        githubProfile: { name: finalUsername, login: finalUsername },
        githubLinked: true,
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
  try {
    const result = await linkWithPopup(user, prov);
    const credential = providerName === 'github' ? GithubAuthProvider.credentialFromResult(result) : null;
    const token = credential?.accessToken;
    
    // Register/update user document upon successful linking
    try {
      const userDocRef = doc(db, 'users', user.uid);
      let email = user.email || '';
      let additionalFields: any = {};
      
      if (providerName === 'github' && token) {
        additionalFields.githubToken = token;
        try {
          const ghRes = await fetch('https://api.github.com/user', {
            headers: { Authorization: `token ${token}` }
          });
          const ghUser = await ghRes.json();
          if (ghUser && ghUser.login) {
            additionalFields.githubUser = ghUser.login;
            additionalFields.githubProfile = { name: ghUser.login, login: ghUser.login };
          }
        } catch (e) {}

        if (!email) {
          try {
            const emailsRes = await fetch('https://api.github.com/user/emails', {
              headers: { Authorization: `token ${token}` }
            });
            if (emailsRes.ok) {
              const emails = await emailsRes.json();
              if (Array.isArray(emails)) {
                const primaryEmailObj = emails.find((e: any) => e.primary);
                if (primaryEmailObj) {
                  email = primaryEmailObj.email;
                } else if (emails.length > 0) {
                  email = emails[0].email;
                }
              }
            }
          } catch (e) {}
        }
      }
      
      if (providerName === 'google') {
        additionalFields.googleLinked = true;
      } else {
        additionalFields.githubLinked = true;
      }
      
      await setDocWithSanitize(userDocRef, {
        uid: user.uid,
        email: email,
        ...additionalFields,
        updatedAt: Date.now()
      }, { merge: true });
    } catch (e) {
      console.warn('Could not update user collection after provider link:', e);
    }
    
    return result.user;
  } catch (error: any) {
    if (error?.code === 'auth/credential-already-in-use' || error?.message?.includes('credential-already-in-use')) {
      const enrichedError = new Error(`The selected ${providerName === 'google' ? 'Google' : 'GitHub'} account is already registered as a separate developer profile. Please sign in to that account directly.`) as any;
      enrichedError.code = 'auth/credential-already-in-use';
      enrichedError.originalError = error;
      throw enrichedError;
    }
    console.error(`Error linking ${providerName} provider:`, error);
    throw error;
  }
};

export const unlinkProvider = async (user: User, providerId: string): Promise<User> => {
  const result = await unlink(user, providerId);
  return result;
};

export const linkWithPendingCredential = async (user: User, credential: any): Promise<User> => {
  try {
    const result = await linkWithCredential(user, credential);
    
    // Register/update user document upon successful linking
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDocWithSanitize(userDocRef, {
        uid: user.uid,
        email: user.email || '',
        updatedAt: Date.now()
      }, { merge: true });
    } catch (e) {
      console.warn('Could not update user collection after linking credential:', e);
    }
    
    return result.user;
  } catch (error: any) {
    if (error?.code === 'auth/credential-already-in-use' || error?.message?.includes('credential-already-in-use')) {
      const enrichedError = new Error('This credential is already registered under another developer profile.') as any;
      enrichedError.code = 'auth/credential-already-in-use';
      enrichedError.originalError = error;
      throw enrichedError;
    }
    console.error('Error linking pending credential:', error);
    throw error;
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
    window.localStorage.removeItem('app_auth_mode');
    window.localStorage.removeItem('app_user_profile');
    window.localStorage.removeItem('app_github_token');
    window.localStorage.removeItem('app_github_profile');
    window.localStorage.removeItem('app_last_github_repo');
  }
};
