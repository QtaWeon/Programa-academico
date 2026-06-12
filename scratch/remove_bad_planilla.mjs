import { initializeApp } from "firebase/app";
import { getFirestore, doc, deleteDoc } from "firebase/firestore";

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

async function removeBadPlanilla() {
  const badId = 'oi62wDlJz3CWrlsfgiQu';
  await deleteDoc(doc(db, 'planillas', badId));
  console.log(`✓ Planilla incoherente ${badId} eliminada exitosamente.`);
  process.exit(0);
}

removeBadPlanilla().catch(console.error);
