

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDD4Zz-RlHD0V-nrjnlxuxxwSwx5bJnq3I",
  authDomain: "cemxpress-e78d0.firebaseapp.com",
  projectId: "cemxpress-e78d0",
  storageBucket: "cemxpress-e78d0.firebasestorage.app",
  messagingSenderId: "742057282514",
  appId: "1:742057282514:web:149299f641d5e5d8f5160b"
};

const app = initializeApp(firebaseConfig);

export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app);

export default app;