
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, query, where, limit } from "firebase/firestore";

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

async function createSpecificPlanillas() {
  console.log("Creating specific planillas for screenshots...");

  // Get a teacher
  const teacherSnap = await getDocs(query(collection(db, "users"), where("role", "==", "docente"), limit(1)));
  if (teacherSnap.empty) throw new Error("No teacher found");
  const teacher = { id: teacherSnap.docs[0].id, ...teacherSnap.docs[0].data() };

  // Get a course
  const courseSnap = await getDocs(query(collection(db, "courses"), limit(1)));
  if (courseSnap.empty) throw new Error("No course found");
  const course = { id: courseSnap.docs[0].id, ...courseSnap.docs[0].data() };

  // Get students for this course
  const students = course.students;

  const tasks = [
    { id: "t1", name: "Tarea 1", maxPoints: 2 },
    { id: "t2", name: "Tarea 2", maxPoints: 2 },
    { id: "t3", name: "Tarea 3", maxPoints: 2 }
  ];

  const scores = students.map(sid => ({
    studentId: sid,
    scores: { t1: 2, t2: 1, t3: 2 }
  }));

  // 1. Create PENDING planilla (Enviado) for MAYO
  await addDoc(collection(db, "planillas"), {
    subjectId: course.teacherAssignments[0].id,
    subjectName: course.teacherAssignments[0].subjectName,
    courseId: course.id,
    courseName: course.name,
    teacherId: teacher.id,
    teacherName: `${teacher.lastName}, ${teacher.firstName}`,
    coordinatorId: course.coordinatorId,
    grade: course.grade,
    month: 5, // Mayo
    year: 2026,
    etapa: 1,
    tasks: tasks,
    scores: scores,
    status: "enviado",
    submittedDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // 2. Create REJECTED planilla (Rechazado) for JUNIO
  await addDoc(collection(db, "planillas"), {
    subjectId: course.teacherAssignments[1].id,
    subjectName: course.teacherAssignments[1].subjectName,
    courseId: course.id,
    courseName: course.name,
    teacherId: teacher.id,
    teacherName: `${teacher.lastName}, ${teacher.firstName}`,
    coordinatorId: course.coordinatorId,
    grade: course.grade,
    month: 6, // Junio
    year: 2026,
    etapa: 1,
    tasks: tasks,
    scores: scores,
    status: "rechazado",
    rejectionReason: "El puntaje de la Tarea 2 parece incorrecto para varios alumnos. Por favor revisar.",
    submittedDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  console.log("Specific planillas created successfully!");
}

createSpecificPlanillas().catch(console.error);
