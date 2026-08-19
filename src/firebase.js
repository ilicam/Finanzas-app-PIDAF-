// ─────────────────────────────────────────────────────────────
// Configuración de Firebase
// ─────────────────────────────────────────────────────────────
// 1. Ve a https://console.firebase.google.com y crea un proyecto (gratis).
// 2. Dentro del proyecto: "Compilación" → Authentication → Sign-in method
//    → habilita "Anónimo".
// 3. "Compilación" → Firestore Database → Crear base de datos (modo producción).
//    Luego pega las reglas del archivo README.md en Firestore → Reglas.
// 4. "Configuración del proyecto" (ícono de engranaje) → en "Tus apps"
//    agrega una app Web (</>) y copia aquí los valores que te muestre.
// ─────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyD8nUJ2OlChxBjZvgy3hRZiZNfXBEw7DRM",
  authDomain: "finanzas-app-pidaf-3e075.firebaseapp.com",
  projectId: "finanzas-app-pidaf-3e075",
  storageBucket: "finanzas-app-pidaf-3e075.firebasestorage.app",
  messagingSenderId: "518495874443",
  appId: "1:518495874443:web:deefc085327efcba62d38e",
};

import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Inicia sesión anónima (no pide login, solo identifica el dispositivo/instalación
// para que tus datos siempre vuelvan a aparecer en la misma app).
export function ensureAuth() {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      if (user) {
        resolve(user);
      } else {
        signInAnonymously(auth)
          .then((cred) => resolve(cred.user))
          .catch(reject);
      }
    }, reject);
  });
}

// Trae todos los datos guardados de este usuario (o null si es la primera vez).
export async function getUserData(uid) {
  const ref = doc(db, "finanzas", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

// Guarda (sobrescribe) todos los datos de este usuario.
export async function setUserData(uid, data) {
  const ref = doc(db, "finanzas", uid);
  await setDoc(ref, data);
}
