import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const config = {
  apiKey: 'AIzaSyA-XUdQYRvfApxbMOi6hWdf0GC_OVHIciE',
  authDomain: 'sistemadeplanillas.firebaseapp.com',
  projectId: 'sistemadeplanillas',
  storageBucket: 'sistemadeplanillas.firebasestorage.app',
  messagingSenderId: '128567308362',
  appId: '1:128567308362:web:f0a782a56b3909071e76b3',
  measurementId: 'G-QM9BV5Q9B9'
};
const app = initializeApp(config);
const db = getFirestore(app);

const snap = await getDocs(collection(db, 'users'));
const accs = snap.docs.map(d => ({id: d.id, ...d.data()}));
console.log("Accounts:");
accs.forEach(a => {
  console.log(`- ID: ${a.id} | Name: ${a.firstName} ${a.lastName} | Role: ${a.role} | Email/Cedula: ${a.email || a.cedula}`);
});
process.exit(0);
