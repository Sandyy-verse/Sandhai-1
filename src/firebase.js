// Firebase setup for Sandhai — auth + Firestore.
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD6Pw-DP3SvlEA1QluuduQE4JWt3i5scfc",
  authDomain: "sandhai-1-81edd.firebaseapp.com",
  projectId: "sandhai-1-81edd",
  storageBucket: "sandhai-1-81edd.firebasestorage.app",
  messagingSenderId: "588452819962",
  appId: "1:588452819962:web:fdd59e359eea4bd1b6aa43",
  measurementId: "G-G11YNBPD2J",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics only works in a real browser with support (not during SSR/build), guard it.
isSupported().then((ok) => {
  if (ok) getAnalytics(app);
});
