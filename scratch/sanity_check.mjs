import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const config = {
  apiKey: 'AIzaSyA-XUdQYRvfApxbMOi6hWdf0GC_OVHIciE',
  authDomain: 'sistemadeplanillas.firebaseapp.com',
  projectId: 'sistemadeplanillas',
  storageBucket: 'sistemadeplanillas.firebasestorage.app',
  messagingSenderId: '128567308362',
  appId: '1:128567308362:web:f0a782a56b3909071e76b3',
  measurementId: 'G-QM9BV5Q9B9'
};
const app = initializeApp(config);
const db = getFirestore(app);

async function runSanityCheck() {
  console.log("=== DB SANITY CHECK ===");
  
  // 1. Load data
  const usersSnap = await getDocs(collection(db, "users"));
  const coursesSnap = await getDocs(collection(db, "courses"));
  const planillasSnap = await getDocs(collection(db, "planillas"));

  const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const courses = coursesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const planillas = planillasSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  console.log(`Loaded ${users.length} users, ${courses.length} courses, ${planillas.length} planillas.`);

  let inconsistencies = 0;

  // 2. Validate users
  console.log("\n--- Checking Users ---");
  const userIds = new Set(users.map(u => u.id));
  users.forEach(u => {
    if (!u.firstName || !u.lastName || !u.role) {
      console.warn(`User ID ${u.id} is missing core fields!`, u);
      inconsistencies++;
    }
  });

  // 3. Validate courses
  console.log("\n--- Checking Courses ---");
  courses.forEach(c => {
    if (!c.name || !c.grade) {
      console.warn(`Course ID ${c.id} missing name or grade!`);
      inconsistencies++;
    }
    // Check students exist
    const cStudents = c.students || [];
    cStudents.forEach(sid => {
      if (!userIds.has(sid)) {
        console.warn(`Course ${c.name} references non-existent student ID ${sid}`);
        inconsistencies++;
      }
    });
    // Check coordinator
    if (c.coordinatorId && !userIds.has(c.coordinatorId)) {
      console.warn(`Course ${c.name} references non-existent coordinator ID ${c.coordinatorId}`);
      inconsistencies++;
    }
  });

  // 4. Validate planillas
  console.log("\n--- Checking Planillas ---");
  const courseIds = new Set(courses.map(c => c.id));
  
  // To detect duplicates: courseId_month_year_planillaType
  const seenPlanillas = new Set();

  planillas.forEach(p => {
    // Basic existence checks
    if (!p.subjectId || !p.subjectName || !p.courseId || !p.teacherId) {
      console.warn(`Planilla ID ${p.id} missing core references!`, p);
      inconsistencies++;
    }
    if (!courseIds.has(p.courseId)) {
      console.warn(`Planilla ID ${p.id} references non-existent course ID ${p.courseId}`);
      inconsistencies++;
    }
    if (!userIds.has(p.teacherId)) {
      console.warn(`Planilla ID ${p.id} references non-existent teacher ID ${p.teacherId}`);
      inconsistencies++;
    }

    // Duplicate detection
    const typeKey = p.planillaType || 'proceso';
    const dupKey = `${p.courseId}_${p.subjectId}_${p.month}_${p.year}_${typeKey}`;
    if (seenPlanillas.has(dupKey)) {
      console.warn(`Duplicate Planilla detected for Key: ${dupKey} (Planilla ID: ${p.id})`);
      inconsistencies++;
    } else {
      seenPlanillas.add(dupKey);
    }

    // Institutional specific validation
    if (p.planillaType === 'institucional') {
      // Month must be 5 (May) or 11 (Nov)
      if (p.month !== 5 && p.month !== 11) {
        console.warn(`Institutional Planilla ID ${p.id} is registered in month ${p.month} (Must be May=5 or Nov=11!)`);
        inconsistencies++;
      }
      
      // Tasks validation
      const tasks = p.tasks || [];
      if (tasks.length !== 3) {
        console.warn(`Institutional Planilla ID ${p.id} has ${tasks.length} tasks instead of exactly 3!`, tasks.map(t => t.name));
        inconsistencies++;
      } else {
        const expectedTasks = [
          { name: "Puntaje de Clubes", max: 2 },
          { name: "Asistencia", max: 1 },
          { name: "Puntualidad", max: 1 }
        ];
        
        expectedTasks.forEach(expected => {
          const match = tasks.find(t => t.name.toLowerCase().includes(expected.name.toLowerCase()));
          if (!match) {
            console.warn(`Institutional Planilla ID ${p.id} is missing task: "${expected.name}"`);
            inconsistencies++;
          } else if (match.maxPoints !== expected.max) {
            console.warn(`Institutional Planilla ID ${p.id} task "${match.name}" has maxPoints ${match.maxPoints} instead of ${expected.max}`);
            inconsistencies++;
          }
        });
      }

      // Check that it is approved and published
      if (p.status !== 'aprobado') {
        console.warn(`Institutional Planilla ID ${p.id} has status: "${p.status}" (Should be approved!)`);
        inconsistencies++;
      }
    }
  });

  console.log(`\n=== Sanity Check Completed with ${inconsistencies} inconsistencies found. ===`);
  process.exit(0);
}

runSanityCheck().catch(console.error);
