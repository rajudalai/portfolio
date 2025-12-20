import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyAxFp2CGRiTFkCBvpwTVgPkH4s7sKFAPho",
    authDomain: "rajudalai-portfolio.firebaseapp.com",
    projectId: "rajudalai-portfolio",
    storageBucket: "rajudalai-portfolio.firebasestorage.app",
    messagingSenderId: "23842439102",
    appId: "1:23842439102:web:44e71e4059fb00653e83ef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
