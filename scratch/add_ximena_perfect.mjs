import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";

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

async function addXimenaPerfect() {
  console.log("Adding Ximena Portillo with perfect scores...");

  // 1. Create Ximena's account
  const ximenaRef = await addDoc(collection(db, "users"), {
    firstName: "XIMENA",
    lastName: "PORTILLO",
    ci: "4.400.023",
    email: "4400023@cpcc.com",
    role: "alumno",
    grade: "3° Año",
    status: "activo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  const ximenaId = ximenaRef.id;
  console.log(`Created Ximena Portillo (ID: ${ximenaId})`);

  // 2. Add her to the course
  const coursesSnap = await getDocs(collection(db, "courses"));
  let courseId = null;
  for (const courseDoc of coursesSnap.docs) {
    const data = courseDoc.data();
    if (data.grade === "3° Año") {
      const updatedStudents = [...(data.students || []), ximenaId];
      await updateDoc(doc(db, "courses", courseDoc.id), {
        students: updatedStudents,
        updatedAt: new Date().toISOString()
      });
      courseId = courseDoc.id;
      console.log(`Added Ximena to course: ${data.name} (ID: ${courseDoc.id})`);
      break;
    }
  }

  // 3. Add perfect scores to every existing planilla
  const planillasSnap = await getDocs(collection(db, "planillas"));
  let updatedCount = 0;

  for (const planillaDoc of planillasSnap.docs) {
    const data = planillaDoc.data();

    // Build perfect score object: max points for every task
    const perfectScores = {};
    for (const task of (data.tasks || [])) {
      perfectScores[task.id] = task.maxPoints;
    }

    const currentScores = data.scores || [];
    
    // Skip if Ximena is somehow already in this planilla
    if (currentScores.some(s => s.studentId === ximenaId)) continue;

    const updatedScores = [...currentScores, {
      studentId: ximenaId,
      scores: perfectScores
    }];

    await updateDoc(doc(db, "planillas", planillaDoc.id), {
      scores: updatedScores,
      updatedAt: new Date().toISOString()
    });
    updatedCount++;
  }

  console.log(`Updated ${updatedCount} planillas with Ximena's perfect scores.`);
  console.log("Done! Ximena Portillo is now the top student.");
  process.exit(0);
}

addXimenaPerfect().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
