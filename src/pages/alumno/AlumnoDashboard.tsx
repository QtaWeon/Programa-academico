import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layers, GraduationCap, Clock, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
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
    .slice(0, 5); // Mostrar últimas 5

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Planillas Publicadas (Este mes)</h3>
            <p className="text-3xl font-bold text-primary">{misUltimasPlanillas.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Planillas</h3>
            <p className="text-3xl font-bold text-primary">
              {planillas.filter(p => p.status === 'aprobado' && p.scores.some(s => s.studentId === user?.id)).length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Últimas notas publicadas (30 días)</h3>
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : misUltimasPlanillas.length === 0 ? (
          <Card className="bg-muted/50">
            <CardContent className="p-6 text-center text-muted-foreground">
              No hay notas nuevas publicadas en los últimos 30 días.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {misUltimasPlanillas.map(planilla => {
              const miPuntaje = planilla.scores.find(s => s.studentId === user?.id);
              const totalMio = planilla.tasks.reduce((sum, task) => sum + (miPuntaje?.scores[task.id] || 0), 0);
              const maxTotal = planilla.tasks.reduce((sum, task) => sum + task.maxPoints, 0);
              const mesName = ALL_MONTHS.find(m => m.month === planilla.month)?.name;

              return (
                <Card key={planilla.id} className="border-l-4 border-l-primary hover:bg-muted/30 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-sm leading-tight">{planilla.subjectName}</p>
                      <p className="text-xs text-muted-foreground mt-1">{mesName} {planilla.year}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xl font-bold text-primary flex items-center gap-1 justify-end whitespace-nowrap">
                        <Award className="h-4 w-4 shrink-0" /> {totalMio} <span className="text-xs text-muted-foreground font-normal">/ {maxTotal} pts</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlumnoDashboard;
