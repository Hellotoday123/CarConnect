// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDnIPnKgDepdiWQuNJPJDraP_t7W_6zlmc",
  authDomain: "carconnect-a07ac.firebaseapp.com",
  projectId: "carconnect-a07ac",
  storageBucket: "carconnect-a07ac.firebasestorage.app",
  messagingSenderId: "508871960737",
  appId: "1:508871960737:web:54a06cf151fe2f7fd3e8e0",
  measurementId: "G-3JXQXRDB4C"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
export const googleProvider = new GoogleAuthProvider();
