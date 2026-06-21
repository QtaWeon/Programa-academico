import { Award, Clock } from 'lucide-react';
import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { usePlanillasStore } from '@/lib/planillas-store';
import { ALL_MONTHS } from '@/lib/constants';

const AlumnoDashboard = () => {
  const { user } = useAppStore();
  const { planillas, loading, fetchPlanillas } = usePlanillasStore();

  useEffect(() => {
    fetchPlanillas(true);
  }, [fetchPlanillas]);

  const treintaDiasAtras = new Date();
  treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30);

  const misUltimasPlanillas = planillas
    .filter(p => p.status === 'aprobado' && p.approvedDate && new Date(p.approvedDate) >= treintaDiasAtras)
    .filter(p => p.scores.some(s => s.studentId === user?.id))
    .sort((a, b) => new Date(b.approvedDate!).getTime() - new Date(a.approvedDate!).getTime())
    .slice(0, 5);

  const totalPlanillas = planillas.filter(
    p => p.status === 'aprobado' && p.scores.some(s => s.studentId === user?.id)
  ).length;

  return (
    <div className="space-y-5">
      {/* Saludo */}
      <div>
        <h2 className="text-xl font-bold text-foreground leading-tight">
          Hola, {user?.name?.split(' ')[0] ?? 'Alumno'} 👋
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">Bienvenido a tu panel de notas</p>
      </div>

      {/* Stats - siempre en 2 columnas */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-xs text-muted-foreground font-medium">Últimos 30 días</p>
          <p className="text-3xl font-bold text-primary mt-1">{misUltimasPlanillas.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Planillas nuevas</p>
        </div>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-xs text-muted-foreground font-medium">Total histórico</p>
          <p className="text-3xl font-bold text-primary mt-1">{totalPlanillas}</p>
          <p className="text-xs text-muted-foreground mt-1">Planillas totales</p>
        </div>
      </div>

      {/* Últimas notas */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm flex items-center gap-2 text-foreground">
          <Clock className="h-4 w-4 text-primary" />
          Notas recientes (últimos 30 días)
        </h3>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded-xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : misUltimasPlanillas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
            <Clock className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No hay notas publicadas en los últimos 30 días.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {misUltimasPlanillas.map(planilla => {
              const miPuntaje = planilla.scores.find(s => s.studentId === user?.id);
              const totalMio = planilla.tasks.reduce((sum, task) => sum + (miPuntaje?.scores[task.id] || 0), 0);
              const maxTotal = planilla.tasks.reduce((sum, task) => sum + task.maxPoints, 0);
              const mesName = ALL_MONTHS.find(m => m.month === planilla.month)?.name;

              return (
                <div
                  key={planilla.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-1.5 rounded-lg bg-primary/10 shrink-0">
                      <Award className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm leading-tight truncate">{planilla.subjectName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{mesName} {planilla.year}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-lg font-bold text-primary">{totalMio}</span>
                    <span className="text-xs text-muted-foreground font-normal whitespace-nowrap"> / {maxTotal} pts</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlumnoDashboard;
