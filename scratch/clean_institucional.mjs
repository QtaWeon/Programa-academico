import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

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

// Months that should NOT have institutional planillas (only May=5 and Nov=11 are valid "once per etapa" months)
// For now etapa 1 only has May. Delete everything else.
const KEEP_MONTHS = [5, 11]; // May (etapa 1), November (etapa 2)

const snap = await getDocs(collection(db, 'planillas'));
const instPlanillas = snap.docs
  .map(d => ({ id: d.id, ...d.data() }))
  .filter(p => p.planillaType === 'institucional');

console.log(`Found ${instPlanillas.length} institutional planillas:`);
instPlanillas.forEach(p => console.log(`  Month ${p.month} (${p.subjectId}) - keep: ${KEEP_MONTHS.includes(p.month)}`));

let deleted = 0;
for (const p of instPlanillas) {
  if (!KEEP_MONTHS.includes(p.month)) {
    await deleteDoc(doc(db, 'planillas', p.id));
    console.log(`✓ Deleted institutional planilla for month ${p.month} (ID: ${p.id})`);
    deleted++;
  }
}

console.log(`\nDone. Deleted ${deleted} planillas. Kept ${instPlanillas.length - deleted} (valid etapa months).`);
process.exit(0);
