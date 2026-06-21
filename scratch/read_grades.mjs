import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA-XUdQYRvfApxbMOi6hWdf0GC_OVHIciE",
  authDomain: "sistemadeplanillas.firebaseapp.com",
  projectId: "sistemadeplanillas",
  storageBucket: "sistemadeplanillas.firebasestorage.app",
  messagingSenderId: "128567308362",
  appId: "1:128567308362:web:f0a782a56b3909071e76b3",
  measurementId: "G-QM9BV5Q9B9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkGradesCollection() {
  const snapshot = await getDocs(collection(db, "grades"));
  console.log(`Found ${snapshot.docs.length} documents in 'grades' collection.`);
  snapshot.docs.slice(0, 10).forEach(d => {
    console.log(d.id, JSON.stringify(d.data(), null, 2));
  });

  const snapshot2 = await getDocs(collection(db, "calificaciones"));
  console.log(`Found ${snapshot2.docs.length} documents in 'calificaciones' collection.`);
}

checkGradesCollection().catch(console.error);
