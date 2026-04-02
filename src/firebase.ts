/// <reference types="vite/client" />
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';

// Fallback to the local config file if environment variables are not set (e.g., in AI Studio)
import defaultFirebaseConfig from '../firebase-applet-config.json';

const envFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID,
};

const hasAllEnvFirebaseValues = Object.values(envFirebaseConfig).every(Boolean);

// Avoid mixing different projects between env and fallback JSON.
const firebaseConfig = hasAllEnvFirebaseValues
  ? envFirebaseConfig
  : {
    apiKey: defaultFirebaseConfig.apiKey,
    authDomain: defaultFirebaseConfig.authDomain,
    projectId: defaultFirebaseConfig.projectId,
    appId: defaultFirebaseConfig.appId,
    firestoreDatabaseId: defaultFirebaseConfig.firestoreDatabaseId,
  };

if (!hasAllEnvFirebaseValues) {
  console.warn(
    'Using firebase-applet-config.json because one or more VITE_FIREBASE_* env vars are missing. ' +
    'Create a .env file with complete Firebase web config to target your own Firebase project.'
  );
}

const app = initializeApp(firebaseConfig);
const firestoreDatabaseId = firebaseConfig.firestoreDatabaseId;
const isDefaultFirestoreDb = !firestoreDatabaseId || firestoreDatabaseId === '(default)';

export const db = isDefaultFirestoreDb
  ? getFirestore(app)
  : getFirestore(app, firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp
};
