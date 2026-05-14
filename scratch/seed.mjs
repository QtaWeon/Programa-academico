
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc, setDoc, addDoc, writeBatch } from "firebase/firestore";

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

async function clearCollection(collectionName, keepFilter = () => false) {
  const snapshot = await getDocs(collection(db, collectionName));
  const batch = writeBatch(db);
  let count = 0;
  snapshot.docs.forEach((d) => {
    if (!keepFilter(d.data(), d.id)) {
      batch.delete(d.ref);
      count++;
    }
  });
  if (count > 0) await batch.commit();
  console.log(`Cleared ${count} docs from ${collectionName}`);
}

async function seed() {
  console.log("Starting seed...");

  // 1. Clear everything
  await clearCollection("users", (data) => data.email === "11111@cpcc.com");
  await clearCollection("courses");
  await clearCollection("planillas");

  // 2. Create Coordinator
  const coordRef = await addDoc(collection(db, "users"), {
    firstName: "CARLOS",
    lastName: "COORDINADOR",
    ci: "22222",
    email: "22222@cpcc.com",
    role: "coordinador",
    status: "activo",
    createdAt: new Date().toISOString()
  });
  const coordId = coordRef.id;

  // 3. Create 10 Teachers
  const teachers = [];
  for (let i = 1; i <= 10; i++) {
    const tRef = await addDoc(collection(db, "users"), {
      firstName: `PROFESOR ${i}`,
      lastName: `APELLIDO ${i}`,
      ci: `3333${i}`,
      email: `3333${i}@cpcc.com`,
      role: "docente",
      status: "activo",
      createdAt: new Date().toISOString()
    });
    teachers.push({ id: tRef.id, name: `APELLIDO ${i}, PROFESOR ${i}` });
  }

  // 4. Create 30 Students
  const students = [];
  const grades = ["1° Año", "2° Año", "3° Año"];
  for (let i = 1; i <= 30; i++) {
    const grade = grades[Math.floor((i - 1) / 10)];
    const sRef = await addDoc(collection(db, "users"), {
      firstName: `ALUMNO ${i}`,
      lastName: `APELLIDO ${i}`,
      ci: `4444${i}`,
      email: `4444${i}@cpcc.com`,
      role: "alumno",
      grade: grade,
      status: "activo",
      createdAt: new Date().toISOString()
    });
    students.push({ id: sRef.id, name: `APELLIDO ${i}, ALUMNO ${i}`, grade });
  }

  // 5. Create 3 Courses
  const courseIds = [];
  const subjects = ["MATEMÁTICA", "PROGRAMACIÓN", "LABORATORIO", "SISTEMAS", "LENGUA"];
  
  for (let i = 0; i < 3; i++) {
    const grade = grades[i];
    const courseStudents = students.filter(s => s.grade === grade).map(s => s.id);
    
    // Assign teachers to subjects
    const teacherAssignments = subjects.map((sub, idx) => ({
      id: Math.random().toString(36).substr(2, 9),
      subjectName: sub,
      teacherId: teachers[(i * 3 + idx) % teachers.length].id
    }));

    const cRef = await addDoc(collection(db, "courses"), {
      name: `${grade} - Bachillerato Técnico en Informática`,
      grade: grade,
      year: 2026,
      coordinatorId: coordId,
      students: courseStudents,
      teachers: Array.from(new Set(teacherAssignments.map(a => a.teacherId))),
      teacherAssignments: teacherAssignments,
      subjects: subjects,
      createdAt: new Date().toISOString()
    });
    courseIds.push({ id: cRef.id, name: `${grade} - BT Informática`, grade, teacherAssignments, students: courseStudents });
  }

  // 6. Create Planillas (Feb, Mar, Apr)
  const months = [2, 3, 4]; // Feb, Mar, Apr
  for (const month of months) {
    for (const course of courseIds) {
      for (const assignment of course.teacherAssignments) {
        const teacher = teachers.find(t => t.id === assignment.teacherId);
        
        const tasks = [
          { id: "t1", name: "Tarea 1", maxPoints: 2 },
          { id: "t2", name: "Tarea 2", maxPoints: 2 },
          { id: "t3", name: "Trabajo Práctico", maxPoints: 5 }
        ];

        const scores = course.students.map(sid => ({
          studentId: sid,
          scores: {
            t1: Math.floor(Math.random() * 3),
            t2: Math.floor(Math.random() * 3),
            t3: Math.floor(Math.random() * 6)
          }
        }));

        await addDoc(collection(db, "planillas"), {
          subjectId: assignment.id,
          subjectName: assignment.subjectName,
          courseId: course.id,
          courseName: course.name,
          teacherId: teacher.id,
          teacherName: teacher.name,
          coordinatorId: coordId,
          grade: course.grade,
          month: month,
          year: 2026,
          etapa: 1,
          tasks: tasks,
          scores: scores,
          status: "aprobado",
          submittedDate: new Date().toISOString(),
          approvedDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }
  }

  console.log("Seed completed successfully!");
}

seed().catch(console.error);
