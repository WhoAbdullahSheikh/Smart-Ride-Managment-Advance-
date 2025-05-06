

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAeViH9GKSWEtwzdLSqLCS4wneH8YkkK6c",
    authDomain: "uts-db-65638.firebaseapp.com",
    projectId: "uts-db-65638",
    storageBucket: "uts-db-65638.firebasestorage.app",
    messagingSenderId: "398040249087",
    appId: "1:398040249087:web:7ac67fba0bb6466fd512ca",
    measurementId: "G-24KTYD51X4"
  };
  


const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };