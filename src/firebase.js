import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBmVwXV6Yyr9XaAIwVvnyZRbtw4-slqEXs",
  authDomain: "expenzo-d1891.firebaseapp.com",
  projectId: "expenzo-d1891",
  storageBucket: "expenzo-d1891.firebasestorage.app",
  messagingSenderId: "974630658975",
  appId: "1:974630658975:web:064b2c730327eddae653aa",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

console.log("firebase loaded", app);
