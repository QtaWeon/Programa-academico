import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FolderOpen, Plus, Users, BookOpen, Trash2, UserPlus, Shield, GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAccountsStore } from '@/lib/accounts-store';
import { Course, TeacherAssignment, useCoursesStore } from '@/lib/courses-store';

type AssignType = 'student' | 'teacher' | 'coordinator';

const GestionCursos = () => {
  const { toast } = useToast();
  const { accounts, fetchAccounts, updateAccount } = useAccountsStore();
  const { courses, loading, fetchCourses, createCourse, updateCourse, deleteCourse: removeCourse } = useCoursesStore();

  useEffect(() => {
    fetchAccounts(true);
    fetchCourses(true);
  }, []);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseGrade, setNewCourseGrade] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignType, setAssignType] = useState<AssignType>('student');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedSubjectName, setSelectedSubjectName] = useState('');

  const students = accounts.filter(a => a.role === 'alumno' && a.status === 'activo');
  const teachers = accounts.filter(a => (a.role === 'docente' || a.role === 'coordinador' || a.role === 'administrador') && a.status === 'activo');
  const coordinators = accounts.filter(a => a.role === 'coordinador' && a.status === 'activo');

  const handleCreateCourse = async () => {
    if (!newCourseName.trim() || !newCourseGrade) return;

    try {
      await createCourse({
        name: newCourseName.trim(),
        grade: newCourseGrade,
        year: new Date().getFullYear(),
        students: [],
        teachers: [],
        subjects: [],
        teacherAssignments: [],
      });
      setNewCourseName('');
      setNewCourseGrade('');
      setShowCreateDialog(false);
      toast({ title: 'Curso creado', description: `${newCourseName.trim()} fue creado exitosamente.`, variant: 'success' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo crear el curso', variant: 'destructive' });
    }
  };



  const handleEgresarCurso = async (studentIds: string[]) => {
    if (!studentIds.length) {
      toast({ title: 'Sin alumnos', description: 'No hay alumnos para graduar en este curso.', variant: 'destructive' });
      return;
    }
    if (!confirm('¿Estás seguro/a que deseas graduar este curso completo? Todos sus alumnos pasarán a Egresados permanentemente dentro de su historial.')) return;
    
    try {
      await Promise.all(studentIds.map(id => updateAccount(id, { status: 'egresado' })));
      await fetchAccounts(true);
      toast({ title: 'Curso Egresado', description: 'Todos los alumnos del curso fueron marcados como egresados exitosamente.' });
    } catch {
      toast({ title: 'Error', variant: 'destructive', description: 'Hubo un error al intentar egresar el curso.' });
    }
  };

  const openAssignDialog = (course: Course, type: AssignType) => {
    setSelectedCourse(course);
    setAssignType(type);
    setSelectedAccountId('');
    setSelectedSubjectName('');
    setShowAssignDialog(true);
  };

  const assignAccount = async () => {
    if (!selectedCourse || !selectedAccountId) return;

    try {
      if (assignType === 'student') {
        if (selectedCourse.students.includes(selectedAccountId)) return;

        await updateCourse(selectedCourse.id, {
          students: [...selectedCourse.students, selectedAccountId],
        });
      } else if (assignType === 'coordinator') {
        await updateCourse(selectedCourse.id, {
          coordinatorId: selectedAccountId,
        });
      } else {
        const subjectName = selectedSubjectName.trim();
        if (!subjectName) return;

        const teacherAssignments = selectedCourse.teacherAssignments || [];
        const alreadyAssigned = teacherAssignments.some(
          assignment =>
            assignment.teacherId === selectedAccountId &&
            assignment.subjectName.toLowerCase() === subjectName.toLowerCase()
        );

        if (alreadyAssigned) {
          toast({
            title: 'Asignación duplicada',
            description: 'Ese profesor ya tiene esa materia asignada en este curso.',
            variant: 'destructive',
          });
          return;
        }

        const newAssignment: TeacherAssignment = {
          id: `${selectedCourse.id}-${selectedAccountId}-${Date.now()}`,
          teacherId: selectedAccountId,
          subjectName,
        };

        await updateCourse(selectedCourse.id, {
          teachers: selectedCourse.teachers.includes(selectedAccountId)
            ? selectedCourse.teachers
            : [...selectedCourse.teachers, selectedAccountId],
          teacherAssignments: [...teacherAssignments, newAssignment],
          subjects: selectedCourse.subjects.includes(subjectName)
            ? selectedCourse.subjects
            : [...selectedCourse.subjects, subjectName],
        });
      }

      setShowAssignDialog(false);
      toast({
        title:
          assignType === 'student'
            ? 'Alumno asignado al curso'
            : assignType === 'teacher'
              ? 'Profesor asignado al curso'
              : 'Coordinador asignado al curso',
        description: assignType === 'teacher'
          ? `Materia: ${selectedSubjectName.trim()}`
          : undefined,
      });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const removeStudentFromCourse = async (courseId: string, accountId: string) => {
    if (!confirm('¿Estás seguro que deseas remover a este alumno del curso?')) return;
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    try {
      await updateCourse(courseId, {
        students: course.students.filter(id => id !== accountId),
      });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const removeTeacherAssignment = async (course: Course, assignmentId: string) => {
    if (!confirm('¿Estás seguro que deseas remover al profesor de esta materia asignada?')) return;
    const teacherAssignments = course.teacherAssignments || [];
    const nextAssignments = teacherAssignments.filter(assignment => assignment.id !== assignmentId);
    const nextTeacherIds = Array.from(new Set(nextAssignments.map(assignment => assignment.teacherId)));
    const nextSubjects = Array.from(new Set(nextAssignments.map(assignment => assignment.subjectName)));

    try {
      await updateCourse(course.id, {
        teachers: nextTeacherIds,
        teacherAssignments: nextAssignments,
        subjects: nextSubjects,
      });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const removeLegacyTeacherFromCourse = async (course: Course, teacherId: string) => {
    if (!confirm('¿Estás seguro que deseas remover a este profesor del curso?')) return;
    try {
      await updateCourse(course.id, {
        teachers: course.teachers.filter(id => id !== teacherId),
      });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const removeCoordinatorFromCourse = async (course: Course) => {
    if (!confirm('¿Estás seguro que deseas remover al coordinador actual?')) return;
    try {
      await updateCourse(course.id, {
        coordinatorId: undefined,
      });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const getAccountName = (id?: string) => {
    if (!id) return 'Sin asignar';
    const account = accounts.find(acc => acc.id === id);
    return account ? `${account.lastName}, ${account.firstName}` : id;
  };

  const availableStudents = selectedCourse
    ? students.filter(student => {
        // 1. El grado del alumno debe coincidir con el del curso
        const matchesGrade = student.grade === selectedCourse.grade;
        
        // 2. El alumno no debe estar ya asignado a este curso
        const notInThisCourse = !selectedCourse.students.includes(student.id);
        
        // 3. El alumno no debe estar asignado a NINGÚN otro curso del mismo año
        const notInOtherCourse = !courses.some(c => 
          c.id !== selectedCourse.id && 
          c.year === selectedCourse.year && 
          c.students.includes(student.id)
        );
        
        
        return matchesGrade && notInThisCourse && notInOtherCourse;
      }).sort((a, b) => a.lastName.localeCompare(b.lastName))
    : [];

  const availableTeachers = teachers.sort((a, b) => a.lastName.localeCompare(b.lastName));
  const availableCoordinators = coordinators.sort((a, b) => a.lastName.localeCompare(b.lastName));

  const MATERIAS_COMUNES = [
    'Matemática', 'Lengua Castellana y Literatura', 'Historia y Geografía',
    'Ciencias Básicas', 'Física', 'Química', 'Informática',
    'Programación', 'Educación Física', 'Inglés', 'Artes', 'Trabajo y Tecnología'
  ];

  const assignDialogTitle = () => {
    switch (assignType) {
      case 'student':
        return 'Añadir Alumno al Curso';
      case 'teacher':
        return 'Añadir Profesor al Curso';
      case 'coordinator':
        return 'Asignar Coordinador al Curso';
    }
  };

  const CURRENT_YEAR = new Date().getFullYear();

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <FolderOpen className="h-8 w-8 text-primary" />
          <div className="text-center">
            <h2 className="text-2xl font-bold">Gestión de Cursos</h2>
            <p className="text-sm text-muted-foreground">Año lectivo {CURRENT_YEAR} · Crear cursos y asignar alumnos, profesores y coordinadores</p>
          </div>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} size="lg" className="w-full sm:w-auto">
          <Plus className="h-5 w-5 mr-2" /> Crear Nuevo Curso
        </Button>
      </div>

      {loading && <p className="text-center text-muted-foreground py-8">Cargando cursos...</p>}

      <div className="grid gap-4">
        {courses.map(course => {
          const teacherAssignments = course.teacherAssignments || [];
          const legacyTeacherIds = course.teachers.filter(
            teacherId => !teacherAssignments.some(assignment => assignment.teacherId === teacherId)
          );

          return (
          <Card key={course.id}>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle className="text-lg">{course.name}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{course.grade}</Badge>
                  <Badge variant="outline" className="text-muted-foreground">{course.year}</Badge>
                  {course.grade === '3° Año' && course.students.length > 0 && (
                    <Button variant="ghost" size="icon" className="hover:text-yellow-600 hover:bg-yellow-100" onClick={() => handleEgresarCurso(course.students)} title="Graduar Curso Completo">
                      <GraduationCap className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
                  <span className="text-sm font-medium flex items-center gap-1">
                    <Shield className="h-4 w-4" /> Coordinador
                  </span>
                  <Button variant="outline" size="sm" onClick={() => openAssignDialog(course, 'coordinator')}>
                    <UserPlus className="h-3 w-3 mr-1" /> {course.coordinatorId ? 'Cambiar' : 'Asignar'}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {course.coordinatorId ? (
                    <Badge variant="outline" className="gap-1">
                      {getAccountName(course.coordinatorId)}
                      <button onClick={() => removeCoordinatorFromCourse(course)} className="hover:text-destructive ml-1">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Sin coordinador asignado</span>
                  )}
                </div>
              </div>

              <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
                  <span className="text-sm font-medium flex items-center gap-1">
                    <Users className="h-4 w-4" /> Alumnos ({course.students.length})
                  </span>
                  <Button variant="outline" size="sm" onClick={() => openAssignDialog(course, 'student')}>
                    <UserPlus className="h-3 w-3 mr-1" /> Añadir
                  </Button>
                </div>
                <div className="flex flex-col items-start gap-1">
                  {[...course.students].sort((aId, bId) => {
                    const a = getAccountName(aId);
                    const b = getAccountName(bId);
                    return a.localeCompare(b, undefined, { sensitivity: 'base' });
                  }).map(studentId => (
                    <Badge key={studentId} variant="outline" className="gap-1">
                      {getAccountName(studentId)}
                      <button onClick={() => removeStudentFromCourse(course.id, studentId)} className="hover:text-destructive ml-1">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {course.students.length === 0 && (
                    <span className="text-xs text-muted-foreground italic">Sin alumnos asignados</span>
                  )}
                </div>
              </div>

              <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
                  <span className="text-sm font-medium flex items-center gap-1">
                    <BookOpen className="h-4 w-4" /> Profesores ({teacherAssignments.length + legacyTeacherIds.length})
                  </span>
                  <Button variant="outline" size="sm" onClick={() => openAssignDialog(course, 'teacher')}>
                    <UserPlus className="h-3 w-3 mr-1" /> Añadir
                  </Button>
                </div>
                <div className="flex flex-col items-start gap-1">
                  {[...teacherAssignments].sort((a, b) => getAccountName(a.teacherId).localeCompare(getAccountName(b.teacherId), undefined, { sensitivity: 'base' })).map(assignment => (
                    <Badge key={assignment.id} variant="outline" className="gap-1">
                      {getAccountName(assignment.teacherId)} - {assignment.subjectName}
                      <button onClick={() => removeTeacherAssignment(course, assignment.id)} className="hover:text-destructive ml-1">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {[...legacyTeacherIds].sort((aId, bId) => getAccountName(aId).localeCompare(getAccountName(bId), undefined, { sensitivity: 'base' })).map(teacherId => (
                    <Badge key={teacherId} variant="outline" className="gap-1">
                      {getAccountName(teacherId)} - Sin materia definida
                      <button onClick={() => removeLegacyTeacherFromCourse(course, teacherId)} className="hover:text-destructive ml-1">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {teacherAssignments.length === 0 && legacyTeacherIds.length === 0 && (
                    <span className="text-xs text-muted-foreground italic">Sin profesores asignados</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )})}
        {!loading && courses.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No hay cursos creados aún.</p>
        )}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Curso</DialogTitle>
            <p className="text-sm text-muted-foreground">Definí el nombre y el año del curso</p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre de la Especialidad / Énfasis</Label>
              <Select value={newCourseName} onValueChange={setNewCourseName}>
                <SelectTrigger><SelectValue placeholder="Seleccionar especialidad..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bachillerato Técnico en Informática">Bachillerato Técnico en Informática (BTI)</SelectItem>
                  <SelectItem value="Bachillerato Técnico en Contabilidad">Bachillerato Técnico en Contabilidad (BTC)</SelectItem>
                  <SelectItem value="Bachillerato Técnico en Administración">Bachillerato Técnico en Administración (BTA)</SelectItem>
                  <SelectItem value="Bachillerato Técnico en Salud">Bachillerato Técnico en Salud</SelectItem>
                  <SelectItem value="Bachillerato Científico con Énfasis en Ciencias Básicas">Bachillerato Científico en Ciencias Básicas</SelectItem>
                  <SelectItem value="Bachillerato Científico con Énfasis en Ciencias Sociales">Bachillerato Científico en Ciencias Sociales</SelectItem>
                  <SelectItem value="Bachillerato Científico con Énfasis en Artes y Letras">Bachillerato Científico en Artes y Letras</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Curso (Año)</Label>
              <Select value={newCourseGrade} onValueChange={setNewCourseGrade}>
                <SelectTrigger><SelectValue placeholder="Seleccionar curso" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1° Año">1° Año</SelectItem>
                  <SelectItem value="2° Año">2° Año</SelectItem>
                  <SelectItem value="3° Año">3° Año</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateCourse} disabled={!newCourseName.trim() || !newCourseGrade}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{assignDialogTitle()}</DialogTitle>
            <p className="text-sm text-muted-foreground">Seleccioná la cuenta a asignar</p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                {assignType === 'student'
                  ? 'Alumno'
                  : assignType === 'teacher'
                    ? 'Profesor'
                    : 'Coordinador'}
              </Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {assignType === 'student' && availableStudents.map(student => (
                    <SelectItem key={student.id} value={student.id}>{student.lastName}, {student.firstName}</SelectItem>
                  ))}
                  {assignType === 'teacher' && availableTeachers.map(teacher => (
                    <SelectItem key={teacher.id} value={teacher.id}>{teacher.lastName}, {teacher.firstName}</SelectItem>
                  ))}
                  {assignType === 'coordinator' && availableCoordinators.map(coordinator => (
                    <SelectItem key={coordinator.id} value={coordinator.id}>{coordinator.lastName}, {coordinator.firstName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {assignType === 'teacher' && (
              <div className="space-y-2">
                <Label>Materia</Label>
                <Select value={selectedSubjectName} onValueChange={setSelectedSubjectName}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar materia..." /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {MATERIAS_COMUNES.map(materia => (
                      <SelectItem key={materia} value={materia}>{materia}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>Cancelar</Button>
            <Button
              onClick={assignAccount}
              disabled={!selectedAccountId || (assignType === 'teacher' && !selectedSubjectName.trim())}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GestionCursos;
