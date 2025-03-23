

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // If using Firebase Authentication
import { getFirestore } from "firebase/firestore"; // If using Firestore

const firebaseConfig = {
    apiKey: "AIzaSyA3XJn5fAi2aMu7Rz0m4GUoxmnYcjyrDns",
    authDomain: "naviq-a92a3.firebaseapp.com",
    projectId: "naviq-a92a3",
    storageBucket: "naviq-a92a3.firebasestorage.app",
    messagingSenderId: "779346389665",
    appId: "1:779346389665:web:89de19f64ed75493c0dee0"
};


const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };