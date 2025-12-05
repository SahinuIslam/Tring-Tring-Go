// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// (analytics is optional; we’re not using it right now)

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCkl8wmiH7mym1MyS9dfxko2ViFPauLoe8",
  authDomain: "tringtringgo-11735.firebaseapp.com",
  projectId: "tringtringgo-11735",
  storageBucket: "tringtringgo-11735.firebasestorage.app",
  messagingSenderId: "138931811496",
  appId: "1:138931811496:web:9cf390114d80c7115b7e9d",
  measurementId: "G-PYNXYLZNH2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export what SignupPage needs
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
