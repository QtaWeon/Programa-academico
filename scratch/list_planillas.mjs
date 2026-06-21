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

async function listPlanillas() {
  const planillasSnap = await getDocs(collection(db, "planillas"));
  const planillas = planillasSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  console.log(`Total planillas in db: ${planillas.length}`);
  
  const approved = planillas.filter(p => p.status === 'aprobado');
  console.log(`Approved planillas: ${approved.length}`);
  
  // Print each approved planilla
  approved.forEach((p, index) => {
    const totalMax = p.tasks.reduce((s, t) => s + t.maxPoints, 0);
    console.log(`${index + 1}. [${p.id}] Subject: ${p.subjectName}, Month: ${p.month}, Type: ${p.planillaType || 'proceso'}, Max Points: ${totalMax}, Course: ${p.courseName}`);
  });
}

listPlanillas().catch(console.error);
