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

const MONTH_NAMES = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

async function fix() {
  const snapshot = await getDocs(collection(db, "planillas"));
  const instPlanillas = snapshot.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(p => p.planillaType === 'institucional');
  
  console.log(`Found ${instPlanillas.length} institutional planillas to fix...`);

  for (const planilla of instPlanillas) {
    const monthLabel = MONTH_NAMES[planilla.month] || `M${planilla.month}`;
    
    // New tasks: 3 fixed tasks
    const newTasks = [
      { id: `task-clubes-${planilla.id}`, name: 'Puntaje de Clubes', maxPoints: 2 },
      { id: `task-asistencia-${planilla.id}`, name: 'Asistencia', maxPoints: 1 },
      { id: `task-puntualidad-${planilla.id}`, name: 'Puntualidad', maxPoints: 1 },
    ];

    // Remap scores: old task was 'inst1' with max 10, distribute to new tasks
    // We'll set clubes=max(2, old/10*2 rounded), asistencia=max(1,...), puntualidad=max(1,...)
    const newScores = planilla.scores.map(entry => {
      const oldScore = entry.scores['inst1'] || 0;
      const pct = Math.min(oldScore / 10, 1);
      const clubes = Math.round(pct * 2);
      const asistencia = pct >= 0.5 ? 1 : 0;
      const puntualidad = pct >= 0.5 ? 1 : 0;
      return {
        studentId: entry.studentId,
        scores: {
          [`task-clubes-${planilla.id}`]: clubes,
          [`task-asistencia-${planilla.id}`]: asistencia,
          [`task-puntualidad-${planilla.id}`]: puntualidad,
        }
      };
    });

    await updateDoc(doc(db, "planillas", planilla.id), {
      tasks: newTasks,
      scores: newScores,
      updatedAt: new Date().toISOString(),
    });
    console.log(`✓ Fixed planilla ${planilla.id} (${monthLabel} - ${planilla.subjectName})`);
  }

  console.log("\nDone! All institutional planillas updated.");
  process.exit(0);
}

fix().catch(err => {
  console.error("Failed:", err);
  process.exit(1);
});
