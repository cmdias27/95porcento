// frontend/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDmsY7aBfCpmcP4qlHWGt4Oob7Ztz9Gvow",
  authDomain: "aprendizadoativo-9d37f.firebaseapp.com",
  projectId: "aprendizadoativo-9d37f",
  storageBucket: "aprendizadoativo-9d37f.firebasestorage.app",
  messagingSenderId: "966465884676",
  appId: "1:966465884676:web:d230877cb47168e16edb51",
  measurementId: "G-3DCSRVWSVW"
};

// Evita recriar o app no Next.js durante o desenvolvimento
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app); // Usaremos o Firestore para salvar Nome, CEP e Telefone
const googleProvider = new GoogleAuthProvider();

export { db, auth, googleProvider };