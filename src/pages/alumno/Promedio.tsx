import { useCallback, useEffect, useMemo } from 'react';
import { usePlanillasStore } from '@/lib/planillas-store';
import { useAppStore } from '@/lib/store';
import { useCoursesStore } from '@/lib/courses-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MONTHS_ETAPA_1, MONTHS_ETAPA_2 } from '@/lib/constants';
import { BookOpen } from 'lucide-react';

const ETAPA_1_MONTHS = MONTHS_ETAPA_1.map(m => m.month); // [2,3,4,5]
const ETAPA_2_MONTHS = MONTHS_ETAPA_2.map(m => m.month); // [6,7,8,9,10,11,12]

const calculateGrade = (pct: number) => {
  if (pct < 70) return 1;
  if (pct < 79) return 2;
  if (pct < 88) return 3;
  if (pct < 95) return 4;
  return 5;
};

const gradeLabel = (g: number) => {
  switch (g) {
    case 1: return 'Deficiente';
    case 2: return 'Insuficiente';
    case 3: return 'Aceptable';
    case 4: return 'Bueno';
    case 5: return 'Excelente';
    default: return '-';
  }
};

interface SubjectEtapaStat {
  subjectName: string;
  teacherName: string;
  months: Record<number, { studentTotal: number; maxTotal: number }>;
  totalStudentPoints: number;
  totalMaxPoints: number;
}

const EtapaTable = ({
  title,
  etapaMonths,
  subjectStats,
}: {
  title: string;
  etapaMonths: number[];
  subjectStats: SubjectEtapaStat[];
}) => {
  const subjectGrades = subjectStats.map(subj => {
    const pct = subj.totalMaxPoints > 0 ? (subj.totalStudentPoints / subj.totalMaxPoints) * 100 : 0;
    return calculateGrade(pct);
  });

  const avgGrade = subjectGrades.length > 0
    ? subjectGrades.reduce((s, g) => s + g, 0) / subjectGrades.length
    : 0;

  const isAplazado = subjectGrades.some(g => g === 1);
  const hasData = subjectStats.some(s => s.totalMaxPoints > 0);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-3 px-4 bg-muted/30 border-b border-border">
        <CardTitle className="text-base font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto scrollbar-thin">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left py-2 px-2 sm:px-4 border-r border-border font-semibold min-w-[150px] sm:min-w-[200px]">Materia</th>
              {etapaMonths.map(month => (
                <th key={month} className="text-center py-2 px-1 border-r border-border font-medium w-10 sm:w-14">
                  {['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][month]}
                </th>
              ))}
              <th className="text-center py-2 px-2 border-r border-border font-bold bg-primary/5 w-16 sm:w-20">Total</th>
              <th className="text-center py-2 px-2 font-bold bg-primary/10 w-14 sm:w-16">Nota</th>
            </tr>
          </thead>
          <tbody>
            {subjectStats.map((subj, idx) => {
              const pct = subj.totalMaxPoints > 0 ? (subj.totalStudentPoints / subj.totalMaxPoints) * 100 : 0;
              const g = calculateGrade(pct);
              return (
                <tr key={idx} className="border-b border-border hover:bg-muted/20">
                  <td className="py-2 px-2 sm:px-4 border-r border-border">
                    <div className="font-medium text-xs sm:text-sm leading-tight">{subj.subjectName}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">Prof. {subj.teacherName}</div>
                  </td>
                  {etapaMonths.map(month => {
                    const d = subj.months[month];
                    return (
                      <td key={month} className="text-center py-2 px-0.5 sm:px-1 border-r border-border">
                        {d ? (
                          <div className="flex flex-col sm:block">
                            <span className="font-semibold">{d.studentTotal}</span>
                            <span className="text-[8px] sm:text-[9px] text-muted-foreground">/{d.maxTotal}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/30">-</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="text-center py-2 px-2 border-r border-border bg-primary/5">
                    <div className="font-bold">{subj.totalStudentPoints}</div>
                    <div className="text-[9px] sm:text-[10px] text-muted-foreground">/{subj.totalMaxPoints}</div>
                  </td>
                  <td className={`text-center py-2 px-2 font-bold text-base sm:text-lg bg-primary/10 ${g === 1 ? 'text-red-600' : g >= 4 ? 'text-green-600' : 'text-amber-600'}`}>
                    {subj.totalMaxPoints > 0 ? g : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-muted/60 border-t border-border">
            <tr>
              <td className="py-3 px-4 font-bold text-right border-r border-border text-xs uppercase tracking-wide" colSpan={etapaMonths.length + 1}>
                Promedio de Etapa
              </td>
              <td className="text-center py-3 px-3 border-r border-border">
                {/* empty total cell */}
              </td>
              <td className="text-center py-3 px-3">
                {hasData ? (
                  <div className="flex flex-col items-center gap-0.5">
                    <span className={`font-bold text-xl ${isAplazado ? 'text-red-600' : 'text-green-600'}`}>
                      {avgGrade.toFixed(2)}
                    </span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${isAplazado ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {isAplazado ? 'Aplazado' : gradeLabel(Math.round(avgGrade))}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs">Sin datos</span>
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </CardContent>
    </Card>
  );
};

const Promedio = () => {
  const { user } = useAppStore();
  const { planillas, fetchPlanillas, loading } = usePlanillasStore();
  const { courses, fetchCourses } = useCoursesStore();

  useEffect(() => {
    fetchPlanillas(true);
    fetchCourses(true);
  }, [fetchCourses, fetchPlanillas]);

  const STUDENT_ID = user?.id || '';

  const studentCourse = courses.find(c => c.students.includes(STUDENT_ID));
  const grade = studentCourse?.grade || user?.grade || '';

  const approvedPlanillas = planillas.filter(
    p => p.status === 'aprobado' &&
         p.scores.some(s => s.studentId === STUDENT_ID)
  );

  const buildStats = useCallback((monthFilter: number[]) => {
    const stats: Record<string, SubjectEtapaStat> = {};
    approvedPlanillas
      .filter(p => monthFilter.includes(p.month))
      .forEach(planilla => {
        const { subjectName, teacherName, month, tasks, scores, planillaType } = planilla;
        const myScoreObj = scores.find(s => s.studentId === STUDENT_ID);
        if (!myScoreObj) return;
        const maxTotal = tasks.reduce((s, t) => s + t.maxPoints, 0);
        const studentTotal = tasks.reduce((s, t) => s + (myScoreObj.scores[t.id] || 0), 0);
        // Group all institutional planillas under a single virtual key
        const key = planillaType === 'institucional' ? '__institucional__' : planilla.subjectId;
        const displayName = planillaType === 'institucional' ? 'Institucional' : subjectName;
        if (!stats[key]) {
          stats[key] = { subjectName: displayName, teacherName, months: {}, totalStudentPoints: 0, totalMaxPoints: 0 };
        }
        // For institutional, accumulate across months into the same month bucket
        if (stats[key].months[month]) {
          stats[key].months[month].studentTotal += studentTotal;
          stats[key].months[month].maxTotal += maxTotal;
        } else {
          stats[key].months[month] = { studentTotal, maxTotal };
        }
        stats[key].totalStudentPoints += studentTotal;
        stats[key].totalMaxPoints += maxTotal;
      });
    return Object.values(stats).sort((a, b) => a.subjectName.localeCompare(b.subjectName));
  }, [approvedPlanillas, STUDENT_ID]);

  const etapa1Stats = useMemo(() => buildStats(ETAPA_1_MONTHS), [buildStats]);
  const etapa2Stats = useMemo(() => buildStats(ETAPA_2_MONTHS), [buildStats]);

  // Final average: average of all per-subject grades across both etapas combined
  const allStats = useMemo(() => buildStats([...ETAPA_1_MONTHS, ...ETAPA_2_MONTHS]), [buildStats]);
  const finalGrades = allStats.map(subj => {
    const pct = subj.totalMaxPoints > 0 ? (subj.totalStudentPoints / subj.totalMaxPoints) * 100 : 0;
    return calculateGrade(pct);
  });
  const finalAvg = finalGrades.length > 0 ? finalGrades.reduce((s, g) => s + g, 0) / finalGrades.length : 0;
  const isFinalAplazado = finalGrades.some(g => g === 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Promedio Final</h2>
          <p className="text-sm text-muted-foreground">Resumen anual de tus calificaciones por etapa</p>
        </div>
      </div>

      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <h3 className="font-bold text-lg">{user?.name}</h3>
        <p className="text-sm text-muted-foreground">
          {grade ? `${grade} Bachillerato Técnico en Informática` : 'Sin curso asignado'}
        </p>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Cargando datos...</p>
      ) : allStats.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No hay planillas aprobadas para calcular el promedio.</p>
      ) : (
        <div className="space-y-6">
          {/* Etapa 1 */}
          <EtapaTable
            title="1ra Etapa (Febrero — Mayo)"
            etapaMonths={ETAPA_1_MONTHS}
            subjectStats={etapa1Stats}
          />

          {/* Etapa 2 */}
          <EtapaTable
            title="2da Etapa (Junio — Diciembre)"
            etapaMonths={ETAPA_2_MONTHS}
            subjectStats={etapa2Stats}
          />

          {/* Promedio Final Anual */}
          <Card className={`border-2 ${isFinalAplazado ? 'border-red-300 bg-red-50/30' : 'border-green-300 bg-green-50/30'}`}>
            <CardContent className="py-5 px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-bold text-base uppercase tracking-wide text-muted-foreground">Promedio Final Anual</p>
                <p className="text-xs text-muted-foreground mt-0.5">Promedio de calificaciones finales de todas las materias</p>
              </div>
              <div className="flex items-center gap-4">
                <div className={`text-5xl font-bold ${isFinalAplazado ? 'text-red-600' : 'text-green-600'}`}>
                  {finalAvg.toFixed(2)}
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-bold ${isFinalAplazado ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {isFinalAplazado ? '⚠ Aplazado' : '✓ Pasa de curso'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Promedio;
