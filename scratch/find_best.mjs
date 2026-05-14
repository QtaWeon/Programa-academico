
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

async function findBestStudent() {
  const planillasSnap = await getDocs(collection(db, "planillas"));
  const usersSnap = await getDocs(collection(db, "users"));
  
  const studentTotals = {}; // studentId -> { total: number, max: number }

  planillasSnap.docs.forEach(d => {
    const data = d.data();
    const max = data.tasks.reduce((sum, t) => sum + t.maxPoints, 0);
    
    data.scores.forEach(scoreEntry => {
      const studentTotal = Object.values(scoreEntry.scores).reduce((sum, s) => sum + s, 0);
      if (!studentTotals[scoreEntry.studentId]) {
        studentTotals[scoreEntry.studentId] = { total: 0, max: 0 };
      }
      studentTotals[scoreEntry.studentId].total += studentTotal;
      studentTotals[scoreEntry.studentId].max += max;
    });
  });

  let bestStudentId = null;
  let highestPercentage = -1;

  for (const [sid, stats] of Object.entries(studentTotals)) {
    const percentage = stats.total / stats.max;
    if (percentage > highestPercentage) {
      highestPercentage = percentage;
      bestStudentId = sid;
    }
  }

  const bestStudent = usersSnap.docs.find(d => d.id === bestStudentId)?.data();
  if (bestStudent) {
    console.log(`Best Student: ${bestStudent.firstName} ${bestStudent.lastName}`);
    console.log(`CI: ${bestStudent.ci}`);
    console.log(`Email: ${bestStudent.email}`);
    console.log(`Grade: ${bestStudent.grade}`);
    console.log(`Average: ${(highestPercentage * 100).toFixed(2)}%`);
  } else {
    console.log("No student found.");
  }
}

findBestStudent().catch(console.error);
