import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";

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

async function fixInstitutionalCorrect() {
  const snapshot = await getDocs(collection(db, "planillas"));
  const instPlanillas = snapshot.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(p => p.planillaType === 'institucional');
  
  console.log(`Found ${instPlanillas.length} institutional planillas to fix.`);
  
  for (const planilla of instPlanillas) {
    // Keep only the 3 standard tasks
    const validTaskNames = ['Puntaje de Clubes', 'Asistencia', 'Puntualidad'];
    const newTasks = planilla.tasks.filter(t => 
      validTaskNames.some(name => t.name.toLowerCase().includes(name.toLowerCase()))
    );
    const validTaskIds = new Set(newTasks.map(t => t.id));
    
    // Keep only the scores for the valid tasks
    const newScores = planilla.scores.map(entry => {
      const filteredScores = {};
      Object.keys(entry.scores).forEach(kid => {
        if (validTaskIds.has(kid)) {
          filteredScores[kid] = entry.scores[kid];
        }
      });
      return {
        studentId: entry.studentId,
        scores: filteredScores
      };
    });
    
    await updateDoc(doc(db, "planillas", planilla.id), {
      tasks: newTasks,
      scores: newScores,
      updatedAt: new Date().toISOString()
    });
    
    console.log(`Fixed institutional planilla ID: ${planilla.id}`);
  }
  
  console.log("Done fixing institutional planillas.");
  process.exit(0);
}

fixInstitutionalCorrect().catch(console.error);
