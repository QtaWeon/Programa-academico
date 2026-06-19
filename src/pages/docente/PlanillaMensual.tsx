import { useState, useEffect, useMemo, useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ALL_MONTHS } from '@/lib/constants';
import { Label } from '@/components/ui/label';
import { Save, Send, Layers, Plus, Trash2, Edit2, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { usePlanillasStore, TaskRow, Planilla, Claim } from '@/lib/planillas-store';
import { useAppStore } from '@/lib/store';
import { useAccountsStore } from '@/lib/accounts-store';
import { useCoursesStore } from '@/lib/courses-store';

const PlanillaMensual = () => {
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { currentRole, user } = useAppStore();
  const { planillas, loading, fetchPlanillas, savePlanilla, updatePlanilla, deletePlanilla } = usePlanillasStore();
  const { accounts, fetchAccounts } = useAccountsStore();
  const { courses, fetchCourses } = useCoursesStore();

  const TEACHER_ID = user?.id || '';
  const teacherName = user?.name || 'Profesor';
  const CURRENT_YEAR = new Date().getFullYear();

  useEffect(() => {
    fetchPlanillas(true);
    fetchAccounts(true);
    fetchCourses(true);
  }, [fetchPlanillas, fetchAccounts, fetchCourses]);

  const teacherSubjects = useMemo(() => {
    // 1. Get subjects where they are the assigned teacher
    const assigned = courses.flatMap(course => {
      const teacherAssignments = course.teacherAssignments || [];

      if (teacherAssignments.length > 0) {
        return teacherAssignments
          .filter(assignment => assignment.teacherId === TEACHER_ID)
          .map(assignment => ({
            subjectId: assignment.id,
            courseId: course.id,
            name: assignment.subjectName,
            courseName: course.name,
            grade: course.grade,
            hoursPerWeek: 4,
            isCoordinatedOnly: false,
          }));
      }

      if (!course.teachers.includes(TEACHER_ID)) {
        return [];
      }

      return [{
        subjectId: course.id,
        courseId: course.id,
        name: course.name,
        courseName: course.name,
        grade: course.grade,
        hoursPerWeek: 4,
        isCoordinatedOnly: false,
      }];
    });

    // 2. If coordinator, also add a virtual "Institucional" subject for each course they coordinate
    if (currentRole === 'coordinador') {
      const coordinated = courses
        .filter(course => course.coordinatorId === TEACHER_ID)
        .map(course => ({
          subjectId: `coordinated-inst-${course.id}`,
          courseId: course.id,
          name: 'Institucional',
          courseName: course.name,
          grade: course.grade,
          hoursPerWeek: 0,
          isCoordinatedOnly: true,
        }));
      
      return [...assigned, ...coordinated];
    }

    return assigned;
  }, [courses, TEACHER_ID, currentRole]);

  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('5');
  const [selectedPlanillaType, setSelectedPlanillaType] = useState<'proceso' | 'tp' | 'parcial' | 'examen' | 'institucional'>('proceso');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = searchParams.get('tab') || 'crear';


  useEffect(() => {
    if (teacherSubjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(teacherSubjects[0].subjectId);
    }
  }, [teacherSubjects, selectedSubjectId]);

  const subject = teacherSubjects.find(s => s.subjectId === selectedSubjectId);

  // Auto-switch and lock type when a coordinated virtual subject is selected
  useEffect(() => {
    if (subject?.isCoordinatedOnly) {
      setSelectedPlanillaType('institucional');
    } else if (selectedPlanillaType === 'institucional' && !subject?.isCoordinatedOnly) {
      setSelectedPlanillaType('proceso');
    }
  }, [subject, selectedPlanillaType]);

  // Force valid months (Mayo = 5 or Noviembre = 11) for institutional sheets
  useEffect(() => {
    if (selectedPlanillaType === 'institucional') {
      const currentMonth = parseInt(selectedMonth);
      if (currentMonth !== 5 && currentMonth !== 11) {
        setSelectedMonth('5'); // Force default to Mayo
      }
    }
  }, [selectedPlanillaType, selectedMonth]);

  const month = parseInt(selectedMonth);
  const monthName = ALL_MONTHS.find(m => m.month === month)?.name || '';
  const selectedCourse = courses.find(course => course.id === subject?.courseId);
  const courseCoordinatorId = selectedCourse?.coordinatorId;


  const generateDefaultTasks = useCallback((hours: number, targetMonth: number, type: 'proceso' | 'tp' | 'parcial' | 'examen' | 'institucional', hasParcial?: boolean): TaskRow[] => {
    if (type === 'tp') {
      return [{ id: `task-tp-${Date.now()}`, name: 'Trabajo Práctico', maxPoints: 10 }];
    }
    if (type === 'parcial') {
      return [{ id: `task-parcial-${Date.now()}`, name: 'Examen Parcial', maxPoints: 12 }];
    }
    if (type === 'examen') {
      // If there's a parcial already, the final exam is 18pts; otherwise 30pts
      const maxPts = hasParcial ? 18 : 30;
      return [{ id: `task-exam-${Date.now()}`, name: 'Examen Final', maxPoints: maxPts }];
    }
    if (type === 'institucional') {
      return [
        { id: `task-clubes-${Date.now()}`, name: 'Clubes', maxPoints: 2 },
        { id: `task-asistencia-${Date.now() + 1}`, name: 'Asistencia', maxPoints: 1 },
        { id: `task-puntualidad-${Date.now() + 2}`, name: 'Puntualidad', maxPoints: 1 },
      ];
    }

    const baseTasks = Array.from({ length: hours }, (_, index) => ({
      id: `task-${index + 1}`,
      name: `Tarea ${index + 1}`,
      maxPoints: 2,
    }));

    return baseTasks;
  }, []);

  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [scores, setScores] = useState<Record<string, Record<string, number>>>({});

  // Detect if there's a parcial planilla already for this subject in the same etapa
  const etapaMonths = month <= 5 ? [2, 3, 4, 5] : [6, 7, 8, 9, 10, 11, 12];
  const hasParcialInEtapa = planillas.some(
    p => p.subjectId === selectedSubjectId &&
         p.planillaType === 'parcial' &&
         p.year === CURRENT_YEAR &&
         etapaMonths.includes(p.month)
  );

  useEffect(() => {
    if (subject) {
      setTasks(generateDefaultTasks(subject.hoursPerWeek || 4, month, selectedPlanillaType, hasParcialInEtapa));
      setScores({});
    }
  }, [selectedSubjectId, month, generateDefaultTasks, subject, selectedPlanillaType, hasParcialInEtapa]);

  const totalMaxPoints = tasks.reduce((sum, task) => sum + task.maxPoints, 0);

  const getScore = (studentId: string, taskId: string): number => scores[studentId]?.[taskId] || 0;

  const setScore = useCallback((studentId: string, taskId: string, value: string, max: number) => {
    const num = parseInt(value);
    const newVal = value === '' ? 0 : (num >= 0 && num <= max ? num : undefined);
    if (newVal === undefined) return;

    setScores(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [taskId]: newVal },
    }));
  }, []);

  const getStudentTotal = (studentId: string): number =>
    tasks.reduce((sum, task) => sum + getScore(studentId, task.id), 0);

  const addTask = () => {
    setTasks(prev => [...prev, { id: `task-${Date.now()}`, name: `Tarea ${prev.length + 1}`, maxPoints: 2 }]);
  };

  const addSpecialTask = (name: string, maxPoints: number) => {
    setTasks(prev => [...prev, { id: `task-${Date.now()}`, name, maxPoints }]);
  };

  const removeTask = (taskId: string) => {
    if (tasks.length <= 1) return;
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const [editingTask, setEditingTask] = useState<TaskRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editMaxPoints, setEditMaxPoints] = useState<number>(2);

  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [teacherReply, setTeacherReply] = useState('');

  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestReason, setRequestReason] = useState('');

  const handleResolveClaim = async () => {
    if (!selectedClaim || !existingPlanilla) return;
    try {
      const nextClaims = (existingPlanilla.claims || []).map(c =>
        c.id === selectedClaim.id ? { ...c, resolved: true, teacherMessage: teacherReply, teacherDate: new Date().toISOString() } : c
      );
      await updatePlanilla(existingPlanilla.id, { claims: nextClaims });
      toast({ title: 'Reclamo resuelto', description: 'La respuesta fue enviada al alumno.' });
      setSelectedClaim(null);
      await fetchPlanillas(true);
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const startEditTask = (task: TaskRow) => {
    setEditingTask(task);
    setEditName(task.name);
    setEditMaxPoints(task.maxPoints);
  };

  const saveEditTask = () => {
    if (!editingTask || !editName.trim() || editMaxPoints <= 0) return;
    setTasks(prev => prev.map(task => task.id === editingTask.id ? { ...task, name: editName.trim(), maxPoints: editMaxPoints } : task));
    setEditingTask(null);
  };


  const existingPlanilla = planillas.find(
    planilla => {
      const matchMonth = planilla.month === month;
      const matchYear = planilla.year === CURRENT_YEAR;
      if (selectedPlanillaType === 'institucional') {
        return planilla.planillaType === 'institucional' &&
               planilla.courseId === subject?.courseId &&
               matchMonth &&
               matchYear;
      }
      return planilla.subjectId === selectedSubjectId &&
             matchMonth &&
             matchYear &&
             (planilla.planillaType === selectedPlanillaType || (!planilla.planillaType && selectedPlanillaType === 'proceso'));
    }
  );

  const students = selectedCourse
    ? accounts
      .filter(account => {
        const isInCourse = selectedCourse.students.includes(account.id) && account.status === 'activo';
        const hasScoreInExisting = existingPlanilla?.scores.some(s => s.studentId === account.id);
        return account.role === 'alumno' && (isInCourse || hasScoreInExisting);
      })
      .sort((a, b) => a.lastName.localeCompare(b.lastName))
    : [];

  const canEdit = !existingPlanilla ||
    existingPlanilla.status === 'borrador' ||
    existingPlanilla.status === 'rechazado' ||
    existingPlanilla.editRequestStatus === 'approved';

  const handleRequestEdit = async () => {
    if (!existingPlanilla || !requestReason.trim()) return;
    try {
      await updatePlanilla(existingPlanilla.id, {
        editRequestStatus: 'pending',
        editRequestReason: requestReason,
        editRequestDate: new Date().toISOString(),
      });
      toast({ title: 'Solicitud enviada', description: 'El coordinador revisará tu pedido.' });
      setRequestDialogOpen(false);
      setRequestReason('');
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const buildPlanillaScores = () => students.map(student => ({
    studentId: student.id,
    scores: scores[student.id] || {},
  }));

  const handleDownloadPDF = () => {
    if (!subject) return;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header institucional
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Colegio Politécnico Cooperativa Capiatá - Nivel Medio', pageWidth / 2, 36, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Planilla de Informe Mensual', pageWidth / 2, 52, { align: 'center' });

    // Info de la planilla
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Materia: `, 40, 72);
    doc.setFont('helvetica', 'normal');
    doc.text(subject.name, 90, 72);

    doc.setFont('helvetica', 'bold');
    doc.text(`Curso: `, 40, 86);
    doc.setFont('helvetica', 'normal');
    doc.text(`${subject.courseName} (${subject.grade})`, 72, 86);

    doc.setFont('helvetica', 'bold');
    doc.text(`Mes: `, pageWidth / 2, 72);
    doc.setFont('helvetica', 'normal');
    doc.text(`${monthName} de ${CURRENT_YEAR}`, pageWidth / 2 + 28, 72);

    doc.setFont('helvetica', 'bold');
    doc.text(`Profesor/a: `, pageWidth / 2, 86);
    doc.setFont('helvetica', 'normal');
    doc.text(teacherName, pageWidth / 2 + 58, 86);

    // Tabla
    const head = [
      ['N°', 'Apellidos y Nombres', ...tasks.map(t => `${t.name}\n(${t.maxPoints}pts)`), 'TOTAL']
    ];

    const body = students.map((student, idx) => {
      const total = tasks.reduce((sum, task) => sum + getScore(student.id, task.id), 0);
      return [
        String(idx + 1),
        `${student.lastName}, ${student.firstName}`,
        ...tasks.map(task => {
          const s = getScore(student.id, task.id);
          return s > 0 ? String(s) : '-';
        }),
        total > 0 ? String(total) : '-',
      ];
    });

    const colStyles: Record<number, object> = { 0: { halign: 'center', cellWidth: 28 } };
    tasks.forEach((_, i) => { colStyles[i + 2] = { halign: 'center', cellWidth: 46 }; });
    colStyles[tasks.length + 2] = { halign: 'center', cellWidth: 46, fontStyle: 'bold' };

    autoTable(doc, {
      head,
      body,
      startY: 102,
      styles: { fontSize: 9, cellPadding: 4, lineColor: [180, 180, 180], lineWidth: 0.5 },
      headStyles: { fillColor: [50, 50, 100], textColor: 255, fontStyle: 'bold', halign: 'center' },
      alternateRowStyles: { fillColor: [245, 245, 255] },
      columnStyles: colStyles,
      tableWidth: 'auto',
      margin: { left: 40, right: 40 },
    });

    const fileName = `Planilla_${subject.name.replace(/\s+/g, '_')}_${monthName}_${CURRENT_YEAR}.pdf`;
    doc.save(fileName);
  };

  const handleSave = async () => {
    if (!subject || submitting) return;

    setSubmitting(true);
    const planillaScores = buildPlanillaScores();
    const isInst = selectedPlanillaType === 'institucional';

    try {
      if (existingPlanilla) {
        await updatePlanilla(existingPlanilla.id, {
          tasks,
          scores: planillaScores,
          courseId: subject.courseId,
          courseName: subject.courseName,
          coordinatorId: courseCoordinatorId,
          planillaType: selectedPlanillaType,
          status: 'borrador',
          rejectionReason: undefined,
          editRequestStatus: existingPlanilla.editRequestStatus,
        });
      } else {
        await savePlanilla({
          subjectId: isInst ? 'institucional' : subject.subjectId,
          subjectName: isInst ? 'Institucional' : subject.name,
          courseId: subject.courseId,
          courseName: subject.courseName,
          teacherId: TEACHER_ID,
          teacherName,
          coordinatorId: courseCoordinatorId,
          grade: subject.grade,
          month,
          year: CURRENT_YEAR,
          etapa: month <= 5 ? 1 : 2,
          planillaType: selectedPlanillaType,
          tasks,
          scores: planillaScores,
          status: 'borrador',
        });
      }

      toast({ title: 'Planilla guardada', description: `Borrador de ${isInst ? 'Institucional' : subject.name} - ${monthName} guardado` });
    } catch {
      toast({ title: 'Error', description: 'No se pudo guardar la planilla', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!subject || submitting) return;
    if (!courseCoordinatorId) {
      toast({
        title: 'Falta coordinador',
        description: 'Este curso necesita un coordinador asignado antes de enviar la planilla.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    const planillaScores = buildPlanillaScores();
    const isInst = selectedPlanillaType === 'institucional';

    try {
      if (existingPlanilla) {
        await updatePlanilla(existingPlanilla.id, {
          tasks,
          scores: planillaScores,
          courseId: subject.courseId,
          courseName: subject.courseName,
          coordinatorId: courseCoordinatorId,
          planillaType: selectedPlanillaType,
          status: isInst ? 'aprobado' : 'enviado',
          submittedDate: new Date().toISOString(),
          approvedDate: isInst ? new Date().toISOString() : undefined,
          approvedBy: isInst ? (user?.name || 'Coordinador') : undefined,
          rejectionReason: undefined,
          editRequestStatus: 'none',
        });
      } else {
        await savePlanilla({
          subjectId: isInst ? 'institucional' : subject.subjectId,
          subjectName: isInst ? 'Institucional' : subject.name,
          courseId: subject.courseId,
          courseName: subject.courseName,
          teacherId: TEACHER_ID,
          teacherName,
          coordinatorId: courseCoordinatorId,
          grade: subject.grade,
          month,
          year: CURRENT_YEAR,
          etapa: month <= 5 ? 1 : 2,
          planillaType: selectedPlanillaType,
          tasks,
          scores: planillaScores,
          status: isInst ? 'aprobado' : 'enviado',
          submittedDate: new Date().toISOString(),
          approvedDate: isInst ? new Date().toISOString() : undefined,
          approvedBy: isInst ? (user?.name || 'Coordinador') : undefined,
        });
      }

      toast({
        title: isInst ? 'Planilla publicada' : 'Planilla enviada',
        description: isInst ? 'La planilla institucional ha sido publicada directamente' : 'Planilla enviada al Coordinador para aprobación'
      });
    } catch {
      toast({ title: 'Error', description: 'No se pudo enviar la planilla', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleForceEnableEdit = async () => {
    if (!existingPlanilla || submitting) return;
    setSubmitting(true);
    try {
      await updatePlanilla(existingPlanilla.id, {
        editRequestStatus: 'approved'
      });
      toast({
        title: 'Edición habilitada',
        description: 'Se ha habilitado la edición para esta planilla.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo habilitar la edición.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };
  const handleCloseEdit = async () => {
    if (!existingPlanilla || submitting) return;
    setSubmitting(true);
    try {
      await updatePlanilla(existingPlanilla.id, {
        editRequestStatus: 'none',
      });
      toast({ title: 'Edición finalizada', description: 'Has finalizado la edición de esta planilla.' });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (existingPlanilla) {
      setTasks(existingPlanilla.tasks);
      const scoresMap: Record<string, Record<string, number>> = {};
      existingPlanilla.scores.forEach(score => {
        scoresMap[score.studentId] = score.scores;
      });
      setScores(scoresMap);
    } else if (subject) {
      // Reset to default tasks and empty scores if no draft exists for this month/subject
      setTasks(generateDefaultTasks(subject.hoursPerWeek || 4, month, selectedPlanillaType, hasParcialInEtapa));
      setScores({});
    }
  }, [existingPlanilla, subject, generateDefaultTasks, month, selectedSubjectId, selectedMonth, selectedPlanillaType, hasParcialInEtapa]);

  const handleDeletePlanilla = async (id: string) => {
    try {
      await deletePlanilla(id);
      toast({ title: 'Planilla eliminada' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' });
    }
  };

  const myPlanillas = planillas.filter(planilla => planilla.teacherId === TEACHER_ID);

  const statusBadge = (status: Planilla['status']) => {
    switch (status) {
      case 'borrador':
        return <Badge variant="secondary">Borrador</Badge>;
      case 'enviado':
        return <Badge className="bg-amber-500/20 text-amber-700 border-amber-300">Enviado</Badge>;
      case 'aprobado':
        return <Badge className="bg-green-500/20 text-green-700 border-green-300">Aprobado</Badge>;
      case 'rechazado':
        return <Badge variant="destructive">Rechazado</Badge>;
    }
  };

  if (teacherSubjects.length === 0 && (currentRole === 'docente' || currentRole === 'coordinador' || currentRole === 'administrador')) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No tenés materias asignadas todavía.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Layers className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Planilla de Informe Mensual</h2>
          <p className="text-sm text-muted-foreground">Colegio Politécnico Cooperativa Capiatá - Nivel Medio</p>
        </div>
      </div>

      {activeTab === 'crear' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Materia / Curso</Label>
              <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Seleccionar materia" /></SelectTrigger>
                <SelectContent>
                  {teacherSubjects.map(teacherSubject => (
                    <SelectItem key={teacherSubject.subjectId} value={teacherSubject.subjectId}>
                      {teacherSubject.name} - {teacherSubject.courseName} ({teacherSubject.grade})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Mes</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_MONTHS.filter(item => {
                    if (selectedPlanillaType === 'institucional') {
                      return item.month === 5 || item.month === 11;
                    }
                    return true;
                  }).map(item => (
                    <SelectItem key={item.month} value={String(item.month)}>{item.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 col-span-1 sm:col-span-2 md:col-span-1">
              <Label>Tipo de Planilla</Label>
              <Select value={selectedPlanillaType} onValueChange={(v) => setSelectedPlanillaType(v as typeof selectedPlanillaType)} disabled={subject?.isCoordinatedOnly}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {subject?.isCoordinatedOnly ? (
                    <SelectItem value="institucional">Institucional</SelectItem>
                  ) : (
                    <>
                      <SelectItem value="proceso">Tareas (Proceso)</SelectItem>
                      <SelectItem value="tp">Trabajo Práctico</SelectItem>
                      <SelectItem value="parcial">Examen Parcial (12pts)</SelectItem>
                      <SelectItem value="examen">
                        {hasParcialInEtapa ? 'Examen Final (18pts — con parcial)' : 'Examen Final (30pts — sin parcial)'}
                      </SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              {selectedPlanillaType === 'examen' && (
                <p className="text-xs text-muted-foreground mt-1">
                  {hasParcialInEtapa
                    ? '✓ Parcial detectado en esta etapa → el examen final vale 18pts'
                    : '⚠ No hay parcial en esta etapa → el examen final vale 30pts'}
                </p>
              )}
            </div>
          </div>



          {existingPlanilla && (
            <div className="bg-accent/50 border border-border rounded-lg p-3 text-sm flex items-center justify-between">
              <span>Esta planilla ya existe - Estado: {statusBadge(existingPlanilla.status)}</span>
              {existingPlanilla.status === 'rechazado' && existingPlanilla.rejectionReason && (
                <span className="text-destructive text-xs">Motivo: {existingPlanilla.rejectionReason}</span>
              )}
            </div>
          )}

          {subject && (
            <>
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm">
                <strong>{subject.name}</strong> - {subject.grade}
                <Badge variant="secondary" className="ml-2">TP Máximo: {totalMaxPoints} pts</Badge>
                <span className="text-muted-foreground ml-2">(cada tarea = 2 pts)</span>
                <span className="text-muted-foreground ml-2">- {students.length} alumnos</span>
                {!courseCoordinatorId && (
                  <span className="text-destructive ml-2">- Este curso no tiene coordinador asignado</span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">Tareas del mes:</span>
                {tasks.map(task => {
                  const isSpecial = task.id.startsWith('task-clubes') || task.id.startsWith('task-asistencia') || task.id.startsWith('task-puntualidad');
                  const isFixedType = selectedPlanillaType === 'parcial' || selectedPlanillaType === 'examen';
                  return (
                    <Badge key={task.id} variant="outline" className="gap-1 pr-1">
                      {task.name} ({task.maxPoints}pts)
                      {!isSpecial && !isFixedType && canEdit && (
                        <button onClick={() => startEditTask(task)} className="ml-1 hover:text-primary">
                          <Edit2 className="h-3 w-3" />
                        </button>
                      )}
                      {!isSpecial && !isFixedType && tasks.length > 1 && canEdit && (
                        <button onClick={() => removeTask(task.id)} className="hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  );
                })}
                {selectedPlanillaType === 'proceso' || selectedPlanillaType === 'tp' ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Button variant="outline" size="sm" onClick={addTask} disabled={!canEdit}>Agregar Tarea</Button>
                  </div>
                ) : null}
                {selectedPlanillaType === 'institucional' ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Button variant="outline" size="sm" onClick={() => addSpecialTask('Anteproyecto', 8)} disabled={!canEdit}>Añadir Anteproyecto</Button>
                    <Button variant="outline" size="sm" onClick={() => addSpecialTask('Proyecto Final', 20)} disabled={!canEdit}>Añadir Proyecto Final</Button>
                  </div>
                ) : null}
              </div>              {students.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 border border-dashed rounded-lg">
                  <p>No hay alumnos asignados a este curso.</p>
                  <p className="text-xs mt-1">El Coordinador debe asignar alumnos desde Gestión de Cursos.</p>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-0 overflow-x-auto">
                    <div className="py-3 border-b border-border px-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="font-bold text-lg text-left">Planilla de Informe Mensual - {subject.name}</h3>
                        <p className="font-semibold text-primary text-left">{monthName} de {CURRENT_YEAR}</p>
                        <p className="text-sm text-muted-foreground text-left">
                          <strong>Curso:</strong> {subject.courseName}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                        <FileText className="h-4 w-4 mr-2" /> Descargar PDF
                      </Button>
                    </div>

                    <table className="w-full text-sm min-w-[600px]">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-center py-2 px-2 border-r border-border w-10 bg-muted/50">N°</th>
                          <th className="text-left py-2 px-3 border-r border-border min-w-[200px] bg-muted/50">Apellidos y Nombres</th>
                          {tasks.map(task => (
                            <th key={task.id} className="text-center py-2 px-1 border-r border-border bg-muted/50 min-w-[60px]">
                              <div className="text-sm leading-tight font-semibold">{task.name}</div>
                              <div className="text-xs text-muted-foreground">({task.maxPoints}pts)</div>
                            </th>
                          ))}
                          <th className="text-center py-2 px-2 bg-primary/10 min-w-[60px]">
                            <div className="text-base font-bold">TOTAL</div>
                            <div className="text-xs text-muted-foreground">/{totalMaxPoints}</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student, index) => {
                          const total = getStudentTotal(student.id);
                          const pct = totalMaxPoints > 0 ? (total / totalMaxPoints) * 100 : 0;

                          return (
                            <tr key={student.id} className="border-b border-border hover:bg-muted/20">
                              <td className="text-center py-1 px-2 border-r border-border text-muted-foreground font-medium">{index + 1}</td>
                              <td className="py-1 px-3 border-r border-border font-medium whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  {student.lastName}, {student.firstName}
                                  {existingPlanilla?.claims?.find(c => c.studentId === student.id && !c.resolved) && (
                                    <button onClick={() => {
                                      const claim = existingPlanilla.claims!.find(c => c.studentId === student.id && !c.resolved)!;
                                      setSelectedClaim(claim);
                                      setTeacherReply('');
                                    }} className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded" title="Reclamo pendiente">
                                      <AlertTriangle className="h-4 w-4" />
                                    </button>
                                  )}
                                  {existingPlanilla?.claims?.find(c => c.studentId === student.id && c.resolved) && (
                                    <button className="text-green-500 hover:text-green-700" title="Reclamo resuelto" onClick={() => {
                                      const claim = existingPlanilla.claims!.find(c => c.studentId === student.id && c.resolved)!;
                                      setSelectedClaim(claim);
                                      setTeacherReply(claim.teacherMessage || '');
                                    }}>
                                      <CheckCircle className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                              {tasks.map(task => (
                                <td key={task.id} className="text-center py-1 px-1 border-r border-border">
                                  <Input
                                    type="number"
                                    min={0}
                                    max={task.maxPoints}
                                    value={getScore(student.id, task.id) || ''}
                                    onChange={(e) => setScore(student.id, task.id, e.target.value, task.maxPoints)}
                                    className="w-14 h-7 mx-auto text-center text-sm font-bold p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    placeholder="-"
                                    disabled={!canEdit}
                                  />
                                </td>
                              ))}
                              <td className={`text-center py-1 px-2 font-bold text-base ${pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : total > 0 ? 'text-red-600' : 'text-muted-foreground'
                                }`}>
                                {total > 0 ? total : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              )}

              {(() => {
                const isLocked = existingPlanilla && (existingPlanilla.status === 'aprobado' || existingPlanilla.status === 'enviado');
                const hasPendingRequest = existingPlanilla?.editRequestStatus === 'pending';
                const showFooter = students.length > 0 && (canEdit || (isLocked && existingPlanilla?.editRequestStatus !== 'approved'));
                if (!showFooter) return null;
                return (
                  <div className="flex gap-3 flex-wrap">
                    {canEdit && (
                      <>
                        <Button variant="outline" onClick={handleSave} disabled={loading || submitting}>
                          <Save className="h-4 w-4 mr-2" />Guardar Borrador
                        </Button>
                        <Button onClick={handleSubmit} disabled={loading || submitting || !courseCoordinatorId}>
                          <Send className="h-4 w-4 mr-2" />
                          {submitting 
                            ? (selectedPlanillaType === 'institucional' ? 'Publicando...' : 'Enviando...') 
                            : (selectedPlanillaType === 'institucional' ? 'Publicar' : 'Enviar al Coordinador')}
                        </Button>
                      </>
                    )}
                    {existingPlanilla?.editRequestStatus === 'approved' && (
                      <Button variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200" onClick={handleCloseEdit} disabled={loading || submitting}>
                        <CheckCircle className="h-4 w-4 mr-2" /> Finalizar Edición
                      </Button>
                    )}
                    {isLocked && !hasPendingRequest && existingPlanilla?.editRequestStatus !== 'approved' && (
                      currentRole === 'coordinador' ? (
                        <Button variant="secondary" onClick={handleForceEnableEdit} disabled={submitting || loading}>
                          <AlertTriangle className="h-4 w-4 mr-2" /> Habilitar edición
                        </Button>
                      ) : (
                        <Button variant="secondary" onClick={() => setRequestDialogOpen(true)}>
                          <AlertTriangle className="h-4 w-4 mr-2" /> Pedir permiso para editar
                        </Button>
                      )
                    )}
                    {hasPendingRequest && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 py-2 px-4">
                        Solicitud de edición pendiente de aprobación
                      </Badge>
                    )}
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}

      {activeTab === 'mis' && (
        <div className="space-y-4">
          {loading && <p className="text-center text-muted-foreground py-8">Cargando planillas...</p>}
          {!loading && myPlanillas.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No tenés planillas guardadas aún.</p>
          )}
          {myPlanillas.map(planilla => {
            const monthLabel = ALL_MONTHS.find(item => item.month === planilla.month)?.name || '';

            return (
              <Card key={planilla.id}>
                <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{planilla.subjectName}</p>
                    <p className="text-xs text-muted-foreground">
                      {planilla.courseName} - {monthLabel} {planilla.year} - {planilla.tasks.length} tareas - {planilla.scores.length} alumnos
                    </p>
                    {planilla.rejectionReason && (
                      <p className="text-xs text-destructive mt-1">Motivo rechazo: {planilla.rejectionReason}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {statusBadge(planilla.status)}
                    {(planilla.status === 'borrador' || planilla.status === 'rechazado') && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSubjectId(planilla.subjectId);
                            setSelectedMonth(String(planilla.month));
                            navigate('?tab=crear');
                          }}
                        >
                          <Edit2 className="h-3 w-3 mr-1" /> Editar
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeletePlanilla(planilla.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Editar Tarea</DialogTitle>
            <p className="text-sm text-muted-foreground">Modificá el nombre de la tarea</p>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nombre de la tarea</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Puntaje Máximo</Label>
              <Input type="number" min={1} value={editMaxPoints} onChange={(e) => setEditMaxPoints(parseInt(e.target.value) || 0)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTask(null)}>Cancelar</Button>
            <Button onClick={saveEditTask}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!selectedClaim} onOpenChange={(open) => !open && setSelectedClaim(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{selectedClaim?.resolved ? 'Reclamo Resuelto' : 'Reclamo del Alumno'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-3 rounded-md text-sm">
              <span className="font-semibold">{selectedClaim?.studentDate ? new Date(selectedClaim.studentDate).toLocaleDateString() : 'Sin fecha registrado'}</span>
              <p className="mt-1">{selectedClaim?.studentMessage}</p>
            </div>

            <div className="space-y-2">
              <Label>Respuesta del Profesor</Label>
              <textarea
                className="w-full h-24 p-2 text-sm border rounded-md"
                placeholder={selectedClaim?.resolved ? 'No se incluyó comentario del profesor' : 'Describe la resolución...'}
                value={teacherReply}
                onChange={(e) => setTeacherReply(e.target.value)}
                disabled={selectedClaim?.resolved}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedClaim(null)}>Cerrar</Button>
            {!selectedClaim?.resolved && (
              <Button onClick={handleResolveClaim}>Resolver Reclamo</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Solicitar permiso de edición</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Explicá por qué necesitas editar esta planilla que ya fue enviada o aprobada.
            </p>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo de la edición</Label>
              <textarea
                id="reason"
                className="w-full h-32 p-2 text-sm border rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
                placeholder="Ej: Me equivoqué en la nota de un alumno, necesito agregar una tarea extra..."
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleRequestEdit} disabled={!requestReason.trim()}>Enviar Solicitud</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlanillaMensual;
