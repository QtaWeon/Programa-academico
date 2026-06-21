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

async function checkTPs() {
  const planillasSnap = await getDocs(collection(db, "planillas"));
  const planillas = planillasSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  const tps = planillas.filter(p => p.planillaType === 'tp');
  console.log(`Found ${tps.length} planillas of type 'tp'.`);
  tps.slice(0, 10).forEach(p => {
    console.log(`ID: ${p.id}, Subject: ${p.subjectName}, Month: ${p.month}, Tasks:`, JSON.stringify(p.tasks));
  });
}

checkTPs().catch(console.error);
