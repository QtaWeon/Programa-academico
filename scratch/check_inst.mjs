import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const config = { apiKey: 'AIzaSyA-XUdQYRvfApxbMOi6hWdf0GC_OVHIciE', authDomain: 'sistemadeplanillas.firebaseapp.com', projectId: 'sistemadeplanillas', storageBucket: 'sistemadeplanillas.firebasestorage.app', messagingSenderId: '128567308362', appId: '1:128567308362:web:f0a782a56b3909071e76b3', measurementId: 'G-QM9BV5Q9B9' };
const app = initializeApp(config);
const db = getFirestore(app);
const snap = await getDocs(collection(db, 'planillas'));
const inst = snap.docs.map(d => ({id: d.id, ...d.data()})).filter(p => p.planillaType === 'institucional');
inst.forEach(p => {
  console.log('ID:', p.id, '| subjectId:', p.subjectId, '| Month:', p.month, '| Tasks:', JSON.stringify(p.tasks?.map(t => t.name)));
});
process.exit(0);
