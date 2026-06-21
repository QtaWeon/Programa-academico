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

async function checkKeyMismatches() {
  const planillasSnap = await getDocs(collection(db, "planillas"));
  const planillas = planillasSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  let mismatchesCount = 0;
  
  planillas.forEach(p => {
    const taskIds = new Set(p.tasks.map(t => t.id));
    p.scores.forEach(s => {
      const scoreKeys = Object.keys(s.scores);
      scoreKeys.forEach(k => {
        if (!taskIds.has(k)) {
          console.warn(`Planilla [${p.id}] Subject: ${p.subjectName}, Month: ${p.month}: Student ${s.studentId} has score for task key "${k}" which does NOT exist in tasks!`);
          mismatchesCount++;
        }
      });
      p.tasks.forEach(t => {
        if (s.scores[t.id] === undefined) {
          console.warn(`Planilla [${p.id}] Subject: ${p.subjectName}, Month: ${p.month}: Student ${s.studentId} is missing score for task ID "${t.id}" (${t.name})`);
          mismatchesCount++;
        }
      });
    });
  });
  
  console.log(`\nCompleted check. Found ${mismatchesCount} key/score mismatches.`);
}

checkKeyMismatches().catch(console.error);
