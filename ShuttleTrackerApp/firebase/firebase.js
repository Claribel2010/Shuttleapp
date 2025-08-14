// firebase/firebase.js

import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDSxE2mFmPHrA4B8hI9-jdsJYzUsl-Z1-U",
  authDomain: "shuttletrackerapp-7106a.firebaseapp.com",
  projectId: "shuttletrackerapp-7106a",
  storageBucket: "shuttletrackerapp-7106a.firebasestorage.app",
  messagingSenderId: "481272105111",
  appId: "1:481272105111:web:a7e0529db06f8f5a6f41d2"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Initialize Auth with persistence for React Native
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// ✅ Firestore
const db = getFirestore(app);

// ✅ Export
export { auth, db };
