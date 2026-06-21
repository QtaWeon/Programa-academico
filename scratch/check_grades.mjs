import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";

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

const getScale = (maxPoints) => {
  if (maxPoints === 0) return null;
  const C = Math.round(maxPoints * 0.7);
  const R = maxPoints - C + 1;
  const base = Math.floor(R / 4);
  const r = R % 4;

  const s2 = base + (r >= 3 ? 1 : 0);
  const s3 = base + (r >= 1 ? 1 : 0);
  const s4 = base + (r >= 2 ? 1 : 0);

  return {
    1: { min: 0, max: C - 1 },
    2: { min: C, max: C + s2 - 1 },
    3: { min: C + s2, max: C + s2 + s3 - 1 },
    4: { min: C + s2 + s3, max: C + s2 + s3 + s4 - 1 },
    5: { min: C + s2 + s3 + s4, max: maxPoints }
  };
};

const calculateGrade = (studentPoints, maxPoints) => {
  if (maxPoints === 0) return 0;
  const scale = getScale(maxPoints);
  if (!scale) return 0;
  if (studentPoints <= scale[1].max) return 1;
  if (studentPoints <= scale[2].max) return 2;
  if (studentPoints <= scale[3].max) return 3;
  if (studentPoints <= scale[4].max) return 4;
  return 5;
};

async function checkGrades() {
  const usersSnap = await getDocs(collection(db, "users"));
  const students = usersSnap.docs.filter(d => d.data().role === 'alumno').map(d => ({ id: d.id, ...d.data() }));
  
  console.log(`Found ${students.length} students.`);
  
  const planillasSnap = await getDocs(collection(db, "planillas"));
  const planillas = planillasSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`Found ${planillas.length} planillas.`);
  
  const approvedPlanillas = planillas.filter(p => p.status === 'aprobado');
  console.log(`Found ${approvedPlanillas.length} approved planillas.`);
  
  // Let's analyze Ximena Portillo if she exists
  const ximena = students.find(s => s.firstName.toLowerCase().includes('ximena') && s.lastName.toLowerCase().includes('portillo'));
  if (ximena) {
    console.log(`\nAnalyzing student Ximena Portillo (ID: ${ximena.id}):`);
    const myPlanillas = approvedPlanillas.filter(p => p.scores.some(s => s.studentId === ximena.id));
    console.log(`Ximena has ${myPlanillas.length} approved planillas with scores.`);
    
    const ETAPA_1_MONTHS = [2, 3, 4, 5];
    const ETAPA_2_MONTHS = [6, 7, 8, 9, 10, 11, 12];
    
    const analyzeStage = (months, stageName) => {
      console.log(`\n--- ${stageName} ---`);
      const instColumns = {};
      
      // Institutional
      myPlanillas
        .filter(p => months.includes(p.month) && p.planillaType === 'institucional')
        .forEach(planilla => {
          const myScoreObj = planilla.scores.find(s => s.studentId === ximena.id);
          planilla.tasks.forEach(t => {
            const taskName = t.name === 'Puntaje de Clubes' ? 'Clubes' : t.name;
            if (!instColumns[taskName]) {
              instColumns[taskName] = { max: 0, student: 0 };
            }
            instColumns[taskName].student += (myScoreObj.scores[t.id] || 0);
            instColumns[taskName].max += t.maxPoints;
          });
        });
        
      const instMaxTotal = Object.values(instColumns).reduce((s, c) => s + c.max, 0);
      const instStudentTotal = Object.values(instColumns).reduce((s, c) => s + c.student, 0);
      console.log(`Institutional total: ${instStudentTotal}/${instMaxTotal}`);
      
      const stats = {};
      myPlanillas
        .filter(p => months.includes(p.month) && p.planillaType !== 'institucional')
        .forEach(planilla => {
          const { subjectId, subjectName, month, tasks, scores, planillaType } = planilla;
          const myScoreObj = scores.find(s => s.studentId === ximena.id);
          const maxTotal = tasks.reduce((s, t) => s + t.maxPoints, 0);
          const studentTotal = tasks.reduce((s, t) => s + (myScoreObj.scores[t.id] || 0), 0);
          
          if (!stats[subjectId]) {
            stats[subjectId] = {
              subjectName,
              totalStudentPoints: instStudentTotal,
              totalMaxPoints: instMaxTotal,
              planillas: []
            };
          }
          stats[subjectId].planillas.push({ month, planillaType, studentTotal, maxTotal });
          stats[subjectId].totalStudentPoints += studentTotal;
          stats[subjectId].totalMaxPoints += maxTotal;
        });
        
      Object.keys(stats).forEach(sid => {
        const s = stats[sid];
        const grade = calculateGrade(s.totalStudentPoints, s.totalMaxPoints);
        console.log(`Subject: ${s.subjectName}`);
        console.log(`  Total points: ${s.totalStudentPoints}/${s.totalMaxPoints}`);
        console.log(`  Grade (Nota): ${grade}`);
        s.planillas.forEach(p => {
          console.log(`    Month: ${p.month}, Type: ${p.planillaType || 'proceso'}, Points: ${p.studentTotal}/${p.maxTotal}`);
        });
      });
    };
    
    analyzeStage(ETAPA_1_MONTHS, "Etapa 1");
    analyzeStage(ETAPA_2_MONTHS, "Etapa 2");
  } else {
    console.log("Ximena not found.");
  }
}

checkGrades().catch(console.error);
