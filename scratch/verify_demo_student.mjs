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

async function verify() {
  console.log("Verifying Ximena Portillo scores...");

  const usersSnap = await getDocs(collection(db, "users"));
  const ximena = usersSnap.docs.find(d =>
    d.data().firstName === 'XIMENA' && d.data().lastName === 'PORTILLO'
  );

  if (!ximena) {
    console.error("Ximena Portillo not found!");
    process.exit(1);
  }

  const ximenaId = ximena.id;
  console.log(`Found Ximena Portillo (ID: ${ximenaId}, CI: ${ximena.data().ci}, Email: ${ximena.data().email})`);

  const planillasSnap = await getDocs(collection(db, "planillas"));
  const planillas = planillasSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const approved = planillas.filter(p => p.status === 'aprobado');
  console.log(`Total planillas in database: ${planillas.length}`);
  console.log(`Total approved planillas: ${approved.length}`);

  let totalPlanillas = 0;
  let hasScoresCount = 0;
  let perfectScoresCount = 0;
  let missingPlanillas = [];
  let nonPerfectPlanillas = [];

  for (const p of approved) {
    totalPlanillas++;
    const scoreObj = p.scores.find(s => s.studentId === ximenaId);
    if (!scoreObj) {
      missingPlanillas.push(p);
      continue;
    }
    hasScoresCount++;

    let isPerfect = true;
    for (const task of p.tasks) {
      const score = scoreObj.scores[task.id];
      if (score === undefined || score !== task.maxPoints) {
        isPerfect = false;
        nonPerfectPlanillas.push({ planilla: p, taskId: task.id, max: task.maxPoints, got: score });
      }
    }
    if (isPerfect) {
      perfectScoresCount++;
    }
  }

  console.log(`\nResults:`);
  console.log(`- Approved planillas evaluated: ${totalPlanillas}`);
  console.log(`- Planillas where Ximena has scores registered: ${hasScoresCount}`);
  console.log(`- Planillas with perfect scores (100%): ${perfectScoresCount}`);

  if (missingPlanillas.length > 0) {
    console.log(`\n❌ Missing scores in ${missingPlanillas.length} planillas:`);
    for (const p of missingPlanillas) {
      console.log(`  - Month ${p.month}, ${p.subjectName} (Type: ${p.planillaType || 'proceso'})`);
    }
  } else {
    console.log("\n✅ Ximena has scores in all approved planillas.");
  }

  if (nonPerfectPlanillas.length > 0) {
    console.log(`\n❌ Non-perfect scores in ${nonPerfectPlanillas.length} items:`);
    for (const item of nonPerfectPlanillas) {
      console.log(`  - Month ${item.planilla.month}, ${item.planilla.subjectName} (Type: ${item.planilla.planillaType || 'proceso'}), Task ID: ${item.taskId}. Max: ${item.max}, Got: ${item.got}`);
    }
  } else {
    console.log("✅ All of Ximena's scores are perfect (100% of max points).");
  }

  process.exit(0);
}

verify().catch(console.error);
