import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

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

async function deleteAllTPs() {
  const planillasSnap = await getDocs(collection(db, "planillas"));
  const planillas = planillasSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  const tps = planillas.filter(p => p.planillaType === 'tp');
  console.log(`Found ${tps.length} planillas of type 'tp' to delete.`);
  
  let deletedCount = 0;
  for (const planilla of tps) {
    await deleteDoc(doc(db, "planillas", planilla.id));
    deletedCount++;
    console.log(`Deleted TP planilla ID: ${planilla.id} (${planilla.subjectName} - month ${planilla.month})`);
  }
  
  console.log(`\nCompleted deletion. Deleted ${deletedCount} planillas of type 'tp'.`);
  process.exit(0);
}

deleteAllTPs().catch(console.error);
