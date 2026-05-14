
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore";

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

async function makePerfectStudent() {
  const studentEmail = "4400023@cpcc.com"; // Ximena Portillo
  const usersSnap = await getDocs(query(collection(db, "users"), where("email", "==", studentEmail)));
  if (usersSnap.empty) throw new Error("Student not found");
  const studentId = usersSnap.docs[0].id;

  const planillasSnap = await getDocs(collection(db, "planillas"));
  
  let count = 0;
  for (const d of planillasSnap.docs) {
    const data = d.data();
    let updated = false;
    
    const newScores = data.scores.map(scoreEntry => {
      if (scoreEntry.studentId === studentId) {
        updated = true;
        const perfectScores = {};
        data.tasks.forEach(task => {
          perfectScores[task.id] = task.maxPoints;
        });
        return { ...scoreEntry, scores: perfectScores };
      }
      return scoreEntry;
    });

    if (updated) {
      await updateDoc(doc(db, "planillas", d.id), { scores: newScores });
      count++;
    }
  }

  console.log(`Updated ${count} planillas. Ximena Portillo now has perfect grades!`);
}

makePerfectStudent().catch(console.error);
