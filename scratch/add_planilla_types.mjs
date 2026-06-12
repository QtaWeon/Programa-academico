/**
 * Script: add_planilla_types.mjs
 *
 * 1. Actualiza todas las planillas existentes (tipo "Proceso") con planillaType: 'proceso'
 * 2. Para las planillas de Mayo que tienen tarea "Examen Parcial":
 *    - Separa la tarea de examen en una planilla propia con planillaType: 'examen'
 *    - Deja la planilla original solo con la tarea de proceso (planillaType: 'proceso')
 * 3. Crea planillas de tipo 'tp' (Trabajo Práctico) con puntaje máximo para cada materia/mes
 * 4. Crea planillas de tipo 'institucional' con puntaje máximo para cada mes
 */

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

// TP max points per month per subject (roughly 40% of proceso points)
const tpPts = {
  2: { "Lengua Castellana y Literatura": 4, "Ciencias Naturales y Salud": 2, "Matemática": 4, "Historia y Geografía": 3, "Economía y Gestión": 4, "Psicología": 4, "Educación Física": 2, "Orientación Educacional y Sociolaboral": 2, "Gabinete de Informática Laboratorio": 4, "Algorítmica": 4, "Administración Financiera": 4, "Matemática Aplicada a la Informática": 4, "Plan Optativo Cooperativismo": 6 },
  3: { "Lengua Castellana y Literatura": 6, "Ciencias Naturales y Salud": 4, "Matemática": 8, "Historia y Geografía": 5, "Economía y Gestión": 10, "Psicología": 8, "Educación Física": 4, "Orientación Educacional y Sociolaboral": 4, "Gabinete de Informática Laboratorio": 8, "Algorítmica": 8, "Administración Financiera": 8, "Matemática Aplicada a la Informática": 8, "Plan Optativo Cooperativismo": 7 },
  4: { "Lengua Castellana y Literatura": 6, "Ciencias Naturales y Salud": 3, "Matemática": 6, "Historia y Geografía": 4, "Economía y Gestión": 8, "Psicología": 8, "Educación Física": 3, "Orientación Educacional y Sociolaboral": 4, "Gabinete de Informática Laboratorio": 8, "Algorítmica": 8, "Administración Financiera": 6, "Matemática Aplicada a la Informática": 8, "Plan Optativo Cooperativismo": 5 },
  5: { "Lengua Castellana y Literatura": 4, "Ciencias Naturales y Salud": 3, "Matemática": 6, "Historia y Geografía": 4, "Economía y Gestión": 8, "Psicología": 6, "Educación Física": 3, "Orientación Educacional y Sociolaboral": 3, "Gabinete de Informática Laboratorio": 9, "Algorítmica": 4, "Administración Financiera": 6, "Matemática Aplicada a la Informática": 8, "Plan Optativo Cooperativismo": 5 }
};

// Institucional max points per month (applies to whole course)
const instPts = { 2: 10, 3: 10, 4: 10, 5: 10 };

async function main() {
  console.log("Starting planillaType update...");

  // Load current data
  const planillasSnap = await getDocs(collection(db, "planillas"));
  const planillas = planillasSnap.docs.map(d => ({ id: d.id, ref: d.ref, ...d.data() }));

  const usersSnap = await getDocs(collection(db, "users"));
  const studentIds = usersSnap.docs
    .filter(d => d.data().role === 'alumno')
    .map(d => d.id);

  // Get Ximena's ID
  const ximena = usersSnap.docs.find(d =>
    d.data().firstName === 'XIMENA' && d.data().lastName === 'PORTILLO'
  );
  const ximenaId = ximena?.id;

  // Step 1: Mark all existing planillas as 'proceso' or 'examen'
  let updatedCount = 0;
  for (const p of planillas) {
    const hasExamTask = (p.tasks || []).some(t => t.name.toLowerCase().includes('examen'));
    const hasProceso = (p.tasks || []).some(t => !t.name.toLowerCase().includes('examen'));

    if (hasExamTask && hasProceso) {
      // Split: keep only proceso task in original, create new examen planilla
      const procesoTasks = p.tasks.filter(t => !t.name.toLowerCase().includes('examen'));
      const examenTasks = p.tasks.filter(t => t.name.toLowerCase().includes('examen'));

      // Update existing to proceso only
      const procesoScores = (p.scores || []).map(s => {
        const newScores = {};
        for (const t of procesoTasks) { newScores[t.id] = s.scores[t.id] || 0; }
        return { studentId: s.studentId, scores: newScores };
      });
      await updateDoc(p.ref, {
        planillaType: 'proceso',
        tasks: procesoTasks,
        scores: procesoScores,
        updatedAt: new Date().toISOString()
      });

      // Create new examen planilla
      const examenScores = (p.scores || []).map(s => {
        const newScores = {};
        for (const t of examenTasks) { newScores[t.id] = s.scores[t.id] || 0; }
        return { studentId: s.studentId, scores: newScores };
      });
      await addDoc(collection(db, "planillas"), {
        subjectId: p.subjectId,
        subjectName: p.subjectName,
        courseId: p.courseId,
        courseName: p.courseName,
        teacherId: p.teacherId,
        teacherName: p.teacherName,
        coordinatorId: p.coordinatorId,
        grade: p.grade,
        month: p.month,
        year: p.year,
        etapa: p.etapa,
        planillaType: 'examen',
        tasks: examenTasks,
        scores: examenScores,
        status: 'aprobado',
        submittedDate: p.submittedDate || new Date().toISOString(),
        approvedDate: p.approvedDate || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      console.log(`  Split planilla ${p.subjectName} M${p.month}: proceso + examen`);
    } else {
      // Just mark type
      const type = hasExamTask ? 'examen' : 'proceso';
      await updateDoc(p.ref, { planillaType: type, updatedAt: new Date().toISOString() });
    }
    updatedCount++;
  }
  console.log(`Updated ${updatedCount} existing planillas with planillaType.`);

  // Get unique assignments from existing planillas
  const assignmentsBySubject = {};
  for (const p of planillas) {
    if (!assignmentsBySubject[p.subjectId]) {
      assignmentsBySubject[p.subjectId] = {
        subjectId: p.subjectId,
        subjectName: p.subjectName,
        courseId: p.courseId,
        courseName: p.courseName,
        teacherId: p.teacherId,
        teacherName: p.teacherName,
        coordinatorId: p.coordinatorId,
        grade: p.grade,
        year: p.year
      };
    }
  }

  const assignments = Object.values(assignmentsBySubject);

  // Build perfect score for a student given tasks
  const makeScores = (ids, tasks, forXimena = false) => {
    return ids.map(studentId => {
      const scores = {};
      for (const t of tasks) { scores[t.id] = forXimena ? t.maxPoints : t.maxPoints; }
      return { studentId, scores };
    });
  };

  // Students present per month
  const studentsByMonth = {};
  const allStudentDocs = usersSnap.docs.filter(d => d.data().role === 'alumno');

  // For simplicity: all active students + ximena in all months
  const activeStudentIds = allStudentDocs.map(d => d.id);

  // Step 2: Create TP planillas (one per subject per month)
  let tpCount = 0;
  for (const month of [2, 3, 4, 5]) {
    for (const asgn of assignments) {
      const maxPts = tpPts[month]?.[asgn.subjectName];
      if (!maxPts) continue;

      const tasks = [{ id: 'tp1', name: `T.P. ${['', 'Ene', 'Feb', 'Mar', 'Abr', 'May'][month]}`, maxPoints: maxPts }];
      const scores = makeScores(activeStudentIds, tasks);

      await addDoc(collection(db, "planillas"), {
        ...asgn,
        month,
        etapa: 1,
        planillaType: 'tp',
        tasks,
        scores,
        status: 'aprobado',
        submittedDate: new Date().toISOString(),
        approvedDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      tpCount++;
    }
  }
  console.log(`Created ${tpCount} TP planillas.`);

  // Step 3: Create Institucional planillas (one per month, shared across course)
  let instCount = 0;
  // Use the first assignment for course/teacher info for institucional
  const firstAsgn = assignments[0];
  if (firstAsgn) {
    for (const month of [2, 3, 4, 5]) {
      const maxPts = instPts[month];
      const tasks = [{ id: 'inst1', name: `Institucional ${['', 'Ene', 'Feb', 'Mar', 'Abr', 'May'][month]}`, maxPoints: maxPts }];
      const scores = makeScores(activeStudentIds, tasks);

      await addDoc(collection(db, "planillas"), {
        subjectId: `institucional-${month}`,
        subjectName: 'Institucional',
        courseId: firstAsgn.courseId,
        courseName: firstAsgn.courseName,
        teacherId: firstAsgn.teacherId,
        teacherName: firstAsgn.teacherName,
        coordinatorId: firstAsgn.coordinatorId,
        grade: firstAsgn.grade,
        year: firstAsgn.year,
        month,
        etapa: 1,
        planillaType: 'institucional',
        tasks,
        scores,
        status: 'aprobado',
        submittedDate: new Date().toISOString(),
        approvedDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      instCount++;
    }
  }
  console.log(`Created ${instCount} Institucional planillas.`);

  console.log("Done! All planilla types set up correctly.");
  process.exit(0);
}

main().catch(err => {
  console.error("Failed:", err);
  process.exit(1);
});
