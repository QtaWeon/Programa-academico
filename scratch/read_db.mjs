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

async function run() {
  const snapshot = await getDocs(collection(db, "planillas"));
  const instPlanillas = snapshot.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(p => p.planillaType === 'institucional' || p.subjectName.toLowerCase().includes('inst'));
  
  console.log(`Found ${instPlanillas.length} institutional planillas:`);
  instPlanillas.forEach(p => {
    console.log(`- ID: ${p.id}, Subject: ${p.subjectName}, Type: ${p.planillaType}, Month: ${p.month}, Teacher: ${p.teacherName}, Status: ${p.status}`);
    console.log("  Tasks:", p.tasks);
  });
  
  const coursesSnapshot = await getDocs(collection(db, "courses"));
  const courses = coursesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log("\nCourses:");
  courses.forEach(c => {
    console.log(`- ID: ${c.id}, Name: ${c.name}, Grade: ${c.grade}`);
    console.log("  Subjects:", c.subjects);
  });

  process.exit(0);
}

run().catch(console.error);
