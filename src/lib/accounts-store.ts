import { create } from 'zustand';
import { collection, doc, addDoc, getDocs, updateDoc, deleteDoc, Timestamp, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { UserRole } from './types';
import { useCoursesStore } from './courses-store';
import { usePlanillasStore } from './planillas-store';

export interface Account {
  id: string;
  firstName: string;
  lastName: string;
  ci: string;
  email: string;
  role: UserRole;
  grade?: string;
  status: 'activo' | 'inactivo' | 'egresado';
  createdAt?: string;
  updatedAt?: string;
}

interface AccountsState {
  accounts: Account[];
  loading: boolean;
  loaded: boolean;
  fetchAccounts: (force?: boolean) => Promise<void>;
  createAccount: (account: Omit<Account, 'id'>) => Promise<string>;
  updateAccount: (id: string, data: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  reset: () => void;
  getByRole: (role: UserRole) => Account[];
  getByEmail: (email: string) => Account | undefined;
  getStudents: () => Account[];
  getTeachers: () => Account[];
  getStudentsByGrade: (grade: string) => Account[];
  getAccountName: (id: string) => string;
}

const COLLECTION = 'users';

const omitUndefined = <T extends Record<string, unknown>>(data: T): Partial<T> =>
  Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  ) as Partial<T>;

export const useAccountsStore = create<AccountsState>((set, get) => ({
  accounts: [],
  loading: false,
  loaded: false,

  fetchAccounts: async (force = false) => {
    if (get().loaded && !force) return;
    set({ loading: true });
    try {
      const snapshot = await getDocs(collection(db, COLLECTION));
      const accounts = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as Account[];
      set({ accounts, loading: false, loaded: true });
    } catch (error) {
      console.error('Error fetching accounts:', error);
      set({ loading: false });
    }
  },

  createAccount: async (account) => {
    try {
      const payload = omitUndefined({
        ...account,
        createdAt: Timestamp.now().toDate().toISOString(),
        updatedAt: Timestamp.now().toDate().toISOString(),
      });
      const docRef = await addDoc(collection(db, COLLECTION), {
        ...payload,
      });
      const newAccount = { ...account, id: docRef.id };
      set(state => ({ accounts: [...state.accounts, newAccount] }));
      return docRef.id;
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  },

  updateAccount: async (id, data) => {
    try {
      const docRef = doc(db, COLLECTION, id);
      const payload = omitUndefined({
        ...data,
        updatedAt: Timestamp.now().toDate().toISOString(),
      });
      await updateDoc(docRef, {
        ...payload,
      });
      set(state => ({
        accounts: state.accounts.map(a => a.id === id ? { ...a, ...data } : a),
      }));
    } catch (error) {
      console.error('Error updating account:', error);
      throw error;
    }
  },

  deleteAccount: async (id) => {
    try {
      const account = get().accounts.find(a => a.id === id);
      if (!account) return;

      const batch = writeBatch(db);
      const coursesSnapshot = await getDocs(collection(db, 'courses'));
      const planillasSnapshot = await getDocs(collection(db, 'planillas'));

      coursesSnapshot.docs.forEach(courseDoc => {
        const data = courseDoc.data() as {
          students?: string[];
          teachers?: string[];
          teacherAssignments?: { id: string; teacherId: string; subjectName: string }[];
          subjects?: string[];
          coordinatorId?: string;
        };

        const nextStudents = (data.students || []).filter(studentId => studentId !== id);
        const nextAssignments = (data.teacherAssignments || []).filter(assignment => assignment.teacherId !== id);
        const nextTeachers = Array.from(new Set(
          (data.teachers || []).filter(teacherId => teacherId !== id).concat(
            nextAssignments.map(assignment => assignment.teacherId)
          )
        ));
        const nextSubjects = Array.from(new Set(nextAssignments.map(assignment => assignment.subjectName)));
        const nextCoordinatorId = data.coordinatorId === id ? undefined : data.coordinatorId;

        if (
          nextStudents.length !== (data.students || []).length ||
          nextTeachers.length !== (data.teachers || []).length ||
          nextAssignments.length !== (data.teacherAssignments || []).length ||
          nextCoordinatorId !== data.coordinatorId
        ) {
          batch.update(courseDoc.ref, omitUndefined({
            students: nextStudents,
            teachers: nextTeachers,
            teacherAssignments: nextAssignments,
            subjects: nextAssignments.length > 0 ? nextSubjects : (nextTeachers.length > 0 ? data.subjects || [] : []),
            coordinatorId: nextCoordinatorId,
            updatedAt: Timestamp.now().toDate().toISOString(),
          }));
        }
      });

      planillasSnapshot.docs.forEach(planillaDoc => {
        const data = planillaDoc.data() as {
          teacherId?: string;
          coordinatorId?: string;
          scores?: { studentId: string; scores: Record<string, number> }[];
        };

        if (data.teacherId === id) {
          batch.delete(planillaDoc.ref);
          return;
        }

        const nextScores = (data.scores || []).filter(score => score.studentId !== id);
        const nextCoordinatorId = data.coordinatorId === id ? undefined : data.coordinatorId;

        if (
          nextScores.length !== (data.scores || []).length ||
          nextCoordinatorId !== data.coordinatorId
        ) {
          batch.update(planillaDoc.ref, omitUndefined({
            scores: nextScores,
            coordinatorId: nextCoordinatorId,
            updatedAt: Timestamp.now().toDate().toISOString(),
          }));
        }
      });

      batch.delete(doc(db, COLLECTION, id));
      await batch.commit();
      set(state => ({
        accounts: state.accounts.filter(a => a.id !== id),
      }));
      await useCoursesStore.getState().fetchCourses(true);
      await usePlanillasStore.getState().fetchPlanillas(true);
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  },

  reset: () => set({ accounts: [], loading: false, loaded: false }),

  getByRole: (role) => get().accounts.filter(a => a.role === role),
  
  getByEmail: (email) => {
    const normalize = (emailStr: string) => {
      const parts = emailStr.toLowerCase().split('@');
      if (parts.length === 2) {
        return `${parts[0].replace(/\./g, '')}@${parts[1]}`;
      }
      return emailStr.toLowerCase();
    };
    const searchNorm = normalize(email);
    return get().accounts.find(a => normalize(a.email) === searchNorm);
  },
  
  getStudents: () => get().accounts.filter(a => a.role === 'alumno'),
  
  getTeachers: () => get().accounts.filter(a => a.role === 'docente' || a.role === 'coordinador' || a.role === 'administrador'),
  
  getStudentsByGrade: (grade) => get().accounts.filter(a => a.role === 'alumno' && a.grade === grade),

  getAccountName: (id) => {
    const a = get().accounts.find(acc => acc.id === id);
    return a ? `${a.lastName}, ${a.firstName}` : id;
  },
}));
