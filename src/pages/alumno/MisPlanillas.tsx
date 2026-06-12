import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ALL_MONTHS } from '@/lib/constants';
import { Label } from '@/components/ui/label';
import { Eye, Layers, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { usePlanillasStore, Planilla, Claim } from '@/lib/planillas-store';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/lib/store';
import { useCoursesStore } from '@/lib/courses-store';
import { useSearchParams } from 'react-router-dom';

const MisPlanillas = () => {
  const { user } = useAppStore();
  const { planillas, fetchPlanillas, updatePlanilla, loading } = usePlanillasStore();
  const { courses, fetchCourses } = useCoursesStore();
  const { toast } = useToast();

  const [claimDialogPlanilla, setClaimDialogPlanilla] = useState<Planilla | null>(null);
  const [claimText, setClaimText] = useState('');
  const [viewClaim, setViewClaim] = useState<Claim | null>(null);

  const handleSubmitClaim = async () => {
    if (!claimDialogPlanilla || !claimText.trim()) return;
    try {
      const newClaim: Claim = {
        id: `claim-${Date.now()}`,
        studentId: user?.id || '',
        studentMessage: claimText,
        studentDate: new Date().toISOString(),
        resolved: false
      };
      const nextClaims = [...(claimDialogPlanilla.claims || []), newClaim];
      await updatePlanilla(claimDialogPlanilla.id, { claims: nextClaims });
      toast({ title: 'Reclamo enviado', description: 'El profesor ha sido notificado.' });
      setClaimDialogPlanilla(null);
      await fetchPlanillas(true);
    } catch {
      toast({ title: 'Error al enviar el reclamo', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchPlanillas(true);
    fetchCourses(true);
  }, [fetchPlanillas, fetchCourses]);

  const STUDENT_ID = user?.id || '';
  const studentName = user?.name || '';
  const studentGrade = user?.grade || '';

  // Find the course this student belongs to
  const studentCourse = courses.find(c => c.students.includes(STUDENT_ID));
  const grade = studentCourse?.grade || studentGrade;

  const [selectedMonth, setSelectedMonth] = useState('3');
  const [searchParams] = useSearchParams();
  const taskFilter = searchParams.get('tab') || 'todas';
  const month = parseInt(selectedMonth);
  const monthName = ALL_MONTHS.find(m => m.month === month)?.name || '';
  const CURRENT_YEAR = new Date().getFullYear();

  const approvedPlanillas = planillas.filter(
    p =>
      p.status === 'aprobado' &&
      p.month === month &&
      p.year === CURRENT_YEAR &&
      p.scores.some(s => s.studentId === STUDENT_ID)
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Layers className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Mis Planillas</h2>
            <p className="text-sm text-muted-foreground">Consultá tus puntajes por materia</p>
          </div>
        </div>

        {/* Month selector */}
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Mes:</Label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_MONTHS.map(m => (
                <SelectItem key={m.month} value={String(m.month)}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Student + month info banner */}
      <div className="text-center bg-primary/10 border border-primary/20 rounded-lg p-3">
        <h3 className="font-bold text-lg">Puntajes de {monthName} {CURRENT_YEAR}</h3>
        <p className="text-sm text-muted-foreground">
          {studentName}
          {grade ? ` — ${grade} Bachillerato Técnico en Informática` : ''}
        </p>
      </div>

      {loading && <p className="text-center text-muted-foreground py-8">Cargando planillas...</p>}

      {!loading && approvedPlanillas.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No hay planillas aprobadas para este mes.
        </p>
      )}

      {!loading && approvedPlanillas.length > 0 && approvedPlanillas.filter(p => {
        if (taskFilter === 'todas') return true;
        if (taskFilter === 'tp') return p.planillaType === 'tp';
        if (taskFilter === 'examen') return p.planillaType === 'examen';
        if (taskFilter === 'tareas') return p.planillaType === 'proceso' || !p.planillaType;
        if (taskFilter === 'institucional') return p.planillaType === 'institucional';
        return true;
      }).length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No hay actividades de este tipo para el mes seleccionado.
        </p>
      )}

      {!loading && approvedPlanillas.map(planilla => {
        const myScores = planilla.scores.find(s => s.studentId === STUDENT_ID);
        if (!myScores) return null;

        const filteredTasks = planilla.tasks.filter(task => {
          if (taskFilter === 'todas') return true;
          if (taskFilter === 'tp') return planilla.planillaType === 'tp';
          if (taskFilter === 'examen') return planilla.planillaType === 'examen';
          if (taskFilter === 'tareas') return planilla.planillaType === 'proceso' || !planilla.planillaType;
          if (taskFilter === 'institucional') return planilla.planillaType === 'institucional';
          return true;
        });

        if (taskFilter !== 'todas' && filteredTasks.length === 0) return null;

        const totalMax = filteredTasks.reduce((s, t) => s + t.maxPoints, 0);
        const myTotal = filteredTasks.reduce((s, t) => s + (myScores.scores[t.id] || 0), 0);

        const pct = totalMax > 0 ? myTotal / totalMax : 0;
        const colorClass =
          pct >= 0.8 ? 'text-green-600' :
          pct >= 0.5 ? 'text-amber-600' :
          'text-red-600';
        const barClass =
          pct >= 0.8 ? 'bg-green-500' :
          pct >= 0.5 ? 'bg-amber-500' :
          'bg-red-500';

        const approvedDate = new Date(planilla.approvedDate || planilla.updatedAt || new Date());
        const diffDays = Math.floor(Math.abs(new Date().getTime() - approvedDate.getTime()) / (1000 * 60 * 60 * 24));
        const canClaim = diffDays <= 3;
        const myClaim = planilla.claims?.find(c => c.studentId === STUDENT_ID);

        return (
          <Card key={planilla.id}>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                <div>
                  <h4 className="font-semibold">{planilla.subjectName}</h4>
                  <p className="text-xs text-muted-foreground">
                    Prof. {planilla.teacherName} · TP máx: {totalMax} pts
                  </p>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-1">
                  <Badge className="bg-green-500/20 text-green-700 border-green-300">Publicado</Badge>
                  {!myClaim && canClaim && (
                    <Button variant="outline" size="sm" className="h-6 text-xs mt-1 border-yellow-300 text-yellow-700 bg-yellow-50 hover:bg-yellow-100" onClick={() => { setClaimDialogPlanilla(planilla); setClaimText(''); }}>
                      <AlertTriangle className="h-3 w-3 mr-1" /> Reclamar Puntaje
                    </Button>
                  )}
                  {!myClaim && !canClaim && (
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center">
                      <Clock className="h-3 w-3 mr-1" /> Plazo agotado para reclamos
                    </p>
                  )}
                  {myClaim && !myClaim.resolved && (
                    <Button variant="outline" size="sm" className="h-6 text-xs mt-1 border-blue-300 text-blue-700 bg-blue-50" onClick={() => setViewClaim(myClaim)}>
                      Reclamo Pendiente
                    </Button>
                  )}
                  {myClaim && myClaim.resolved && (
                    <Button variant="outline" size="sm" className="h-6 text-xs mt-1 border-green-300 text-green-700 bg-green-50" onClick={() => setViewClaim(myClaim)}>
                      Reclamo Resuelto
                    </Button>
                  )}
                </div>
              </div>

              {/* Individual task scores */}
              <div className="flex flex-wrap gap-2 mb-3">
                {filteredTasks.map(task => (
                  <div key={task.id} className="text-center border rounded-lg p-2 min-w-[60px]">
                    <div className="text-[10px] text-muted-foreground truncate max-w-[80px]">{task.name}</div>
                    <div className="font-bold text-sm">{myScores.scores[task.id] || 0}</div>
                    <div className="text-[9px] text-muted-foreground">/{task.maxPoints}</div>
                  </div>
                ))}
              </div>

              {/* Total score + progress bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className={`text-3xl font-bold ${colorClass}`}>
                    {myTotal}
                  </div>
                  <div className="text-sm text-muted-foreground">/ {totalMax} puntos</div>
                </div>
                <div className="flex-1 w-full">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barClass}`}
                      style={{ width: `${Math.min(pct * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalMax > 0 ? (pct * 100).toFixed(0) : 0}% del puntaje total
                  </p>
                </div>
                {pct < 0.5 && (
                  <div className="flex w-full sm:w-auto items-center gap-1 text-xs text-red-600 mt-2 sm:mt-0 bg-red-50 p-2 rounded">
                    <AlertTriangle className="h-3 w-3" /> Leyenda: Consulte con un profesor.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
      <Dialog open={!!claimDialogPlanilla} onOpenChange={(open) => !open && setClaimDialogPlanilla(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Reclamar Puntaje</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200">
              Estás por realizar un reclamo de notas sobre la materia <b>{claimDialogPlanilla?.subjectName}</b>. Tienes un plazo de 3 días desde la publicación.
            </p>
            <div className="space-y-1">
              <Label>Justificación del Reclamo</Label>
              <textarea
                className="w-full min-h-[100px] p-2 text-sm border rounded-md"
                placeholder="Hola profe, me gustaría reclamar la nota del trabajo práctico número..."
                value={claimText}
                onChange={(e) => setClaimText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClaimDialogPlanilla(null)}>Cancelar</Button>
            <Button onClick={handleSubmitClaim} disabled={!claimText.trim()}>Enviar Reclamo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewClaim} onOpenChange={(open) => !open && setViewClaim(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Detalles del Reclamo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-3 rounded-md text-sm border">
              <span className="font-semibold text-xs text-muted-foreground">Tu reclamo:</span>
              <p className="mt-1 font-medium">{viewClaim?.studentMessage}</p>
            </div>
            
            <div className="space-y-2">
              <Label>Respuesta del Profesor</Label>
              {viewClaim?.resolved ? (
                <div className="bg-green-50 p-3 rounded-md text-sm border border-green-200">
                  <p className="text-green-800">{viewClaim.teacherMessage || 'El profesor resolvió el reclamo pero no dejó comentarios.'}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic bg-secondary p-2 rounded">El profesor todavía no ha resuelto este reclamo.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setViewClaim(null)}>Entendido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MisPlanillas;
