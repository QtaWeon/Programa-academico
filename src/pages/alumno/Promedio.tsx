import { useCallback, useEffect, useMemo } from 'react';
import { usePlanillasStore } from '@/lib/planillas-store';
import { useAppStore } from '@/lib/store';
import { useCoursesStore } from '@/lib/courses-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MONTHS_ETAPA_1, MONTHS_ETAPA_2 } from '@/lib/constants';
import { BookOpen, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const ETAPA_1_MONTHS = MONTHS_ETAPA_1.map(m => m.month); // [2,3,4,5]
const ETAPA_2_MONTHS = MONTHS_ETAPA_2.map(m => m.month); // [6,7,8,9,10,11,12]

const getScale = (maxPoints: number) => {
  if (maxPoints === 0) return null;
  const C = Math.round(maxPoints * 0.7);
  const R = maxPoints - C + 1;
  const base = Math.floor(R / 4);
  const r = R % 4;

  const s2 = base + (r >= 3 ? 1 : 0);
  const s3 = base + (r >= 1 ? 1 : 0);
  const s4 = base + (r >= 2 ? 1 : 0);

  return {
    1: { min: 0, max: C - 1 },
    2: { min: C, max: C + s2 - 1 },
    3: { min: C + s2, max: C + s2 + s3 - 1 },
    4: { min: C + s2 + s3, max: C + s2 + s3 + s4 - 1 },
    5: { min: C + s2 + s3 + s4, max: maxPoints }
  };
};

const calculateGrade = (studentPoints: number, maxPoints: number) => {
  if (maxPoints === 0) return 0;
  const scale = getScale(maxPoints);
  if (!scale) return 0;
  if (studentPoints <= scale[1].max) return 1;
  if (studentPoints <= scale[2].max) return 2;
  if (studentPoints <= scale[3].max) return 3;
  if (studentPoints <= scale[4].max) return 4;
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
  parcial: { studentTotal: number; maxTotal: number };
  examen: { studentTotal: number; maxTotal: number };
  totalStudentPoints: number;
  totalMaxPoints: number;
}

interface InstColumnStat {
  max: number;
  student: number;
}

const EtapaTable = ({
  title,
  etapaMonths,
  subjectStats,
  instColumns,
}: {
  title: string;
  etapaMonths: number[];
  subjectStats: SubjectEtapaStat[];
  instColumns: Record<string, InstColumnStat>;
}) => {
  const subjectGrades = subjectStats.map(subj => {
    return calculateGrade(subj.totalStudentPoints, subj.totalMaxPoints);
  });

  const avgGrade = subjectGrades.length > 0
    ? subjectGrades.reduce((s, g) => s + g, 0) / subjectGrades.length
    : 0;

  const isAplazado = subjectGrades.some(g => g === 1);
  const hasData = subjectStats.some(s => s.totalMaxPoints > 0);
  const instNames = Object.keys(instColumns).sort();

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
                <th key={month} className="text-center py-2 px-2 border-r border-border font-medium min-w-[60px] sm:min-w-[70px] whitespace-nowrap">
                  {['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][month]}
                </th>
              ))}
              <th className="text-center py-2 px-2 border-r border-border font-medium min-w-[70px] sm:min-w-[80px] whitespace-nowrap bg-yellow-50/50">Parcial</th>
              <th className="text-center py-2 px-2 border-r border-border font-medium min-w-[70px] sm:min-w-[80px] whitespace-nowrap bg-red-50/50">Final</th>
              {instNames.map(instName => (
                <th key={instName} className="text-center py-2 px-2 border-r border-border font-medium min-w-[70px] sm:min-w-[80px] whitespace-nowrap bg-blue-50/50">
                  {instName}
                </th>
              ))}
              <th className="text-center py-2 px-2 border-r border-border font-bold bg-primary/5 min-w-[70px] sm:min-w-[80px] whitespace-nowrap">Total</th>
              <th className="text-center py-2 px-2 font-bold bg-primary/10 min-w-[70px] sm:min-w-[80px] whitespace-nowrap">Nota</th>
            </tr>
          </thead>
          <tbody>
            {subjectStats.map((subj, idx) => {
              const g = calculateGrade(subj.totalStudentPoints, subj.totalMaxPoints);
              const scale = getScale(subj.totalMaxPoints);
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
                          <div className="flex items-baseline justify-center gap-0.5 whitespace-nowrap">
                            <span className="font-semibold">{d.studentTotal}</span>
                            <span className="text-[9px] sm:text-[10px] text-muted-foreground">/{d.maxTotal}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/30">-</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="text-center py-2 px-0.5 sm:px-1 border-r border-border bg-yellow-50/20">
                    {subj.parcial.maxTotal > 0 ? (
                      <div className="flex items-baseline justify-center gap-0.5 whitespace-nowrap">
                        <span className="font-semibold text-yellow-700">{subj.parcial.studentTotal}</span>
                        <span className="text-[9px] sm:text-[10px] text-yellow-600/70">/{subj.parcial.maxTotal}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground/30">-</span>
                    )}
                  </td>
                  <td className="text-center py-2 px-0.5 sm:px-1 border-r border-border bg-red-50/20">
                    {subj.examen.maxTotal > 0 ? (
                      <div className="flex items-baseline justify-center gap-0.5 whitespace-nowrap">
                        <span className="font-semibold text-red-700">{subj.examen.studentTotal}</span>
                        <span className="text-[9px] sm:text-[10px] text-red-600/70">/{subj.examen.maxTotal}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground/30">-</span>
                    )}
                  </td>
                  {instNames.map(instName => {
                    const data = instColumns[instName];
                    return (
                      <td key={instName} className="text-center py-2 px-0.5 sm:px-1 border-r border-border bg-blue-50/20">
                        <div className="flex items-baseline justify-center gap-0.5 whitespace-nowrap">
                          <span className="font-semibold text-blue-700">{data.student}</span>
                          <span className="text-[9px] sm:text-[10px] text-blue-500/70">/{data.max}</span>
                        </div>
                      </td>
                    );
                  })}
                  <td className="text-center py-2 px-2 border-r border-border bg-primary/5">
                    <div className="flex items-baseline justify-center gap-0.5 whitespace-nowrap">
                      <span className="font-bold">{subj.totalStudentPoints}</span>
                      <span className="text-[9px] sm:text-[10px] text-muted-foreground">/{subj.totalMaxPoints}</span>
                    </div>
                  </td>
                  <td className="text-center py-2 px-1 sm:px-2 font-bold bg-primary/10 p-0">
                    {subj.totalMaxPoints > 0 ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <button className={`flex flex-col items-center justify-center w-full h-full min-h-[48px] hover:bg-primary/20 transition-colors ${g === 1 ? 'text-red-600' : g >= 4 ? 'text-green-600' : 'text-amber-600'}`}>
                            <span className="text-lg sm:text-xl">{g}</span>
                            <span className="text-[9px] sm:text-[10px] opacity-80 uppercase">{gradeLabel(g)}</span>
                          </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Escala de Calificaciones (70%)</DialogTitle>
                          </DialogHeader>
                          <div className="py-4">
                            <div className="text-center mb-4">
                              <p className="font-medium text-lg">Total de Puntos: {subj.totalMaxPoints}</p>
                              <p className="text-sm text-muted-foreground">Puntos logrados: {subj.totalStudentPoints}</p>
                            </div>
                            {scale ? (
                              <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                  <thead className="bg-muted/50">
                                    <tr>
                                      <th className="py-2 text-center border-r font-semibold">Nota</th>
                                      <th className="py-2 text-center font-semibold">Rango de Puntos</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {[5, 4, 3, 2, 1].map((nota) => {
                                      const min = scale[nota as keyof typeof scale].min;
                                      const max = scale[nota as keyof typeof scale].max;
                                      const isCurrent = g === nota;
                                      return (
                                        <tr key={nota} className={`border-t ${isCurrent ? 'bg-primary/10 font-bold' : ''}`}>
                                          <td className="py-2 text-center border-r">{nota}</td>
                                          <td className="py-2 text-center">{min} - {max}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-center text-muted-foreground">No hay puntos evaluados en esta etapa.</p>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <div className="flex items-center justify-center w-full h-full min-h-[48px]">-</div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-muted/60 border-t border-border">
            <tr>
              <td className="py-3 px-4 font-bold text-right border-r border-border text-xs uppercase tracking-wide" colSpan={etapaMonths.length + 2 + instNames.length + 1}>
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
    const instColumns: Record<string, InstColumnStat> = {};

    // First pass: extract institutional columns
    approvedPlanillas
      .filter(p => monthFilter.includes(p.month) && p.planillaType === 'institucional')
      .forEach(planilla => {
        const myScoreObj = planilla.scores.find(s => s.studentId === STUDENT_ID);
        if (!myScoreObj) return;
        planilla.tasks.forEach(t => {
          const taskName = t.name === 'Puntaje de Clubes' ? 'Clubes' : t.name;
          if (!instColumns[taskName]) {
            instColumns[taskName] = { max: 0, student: 0 };
          }
          instColumns[taskName].student += (myScoreObj.scores[t.id] || 0);
          instColumns[taskName].max += t.maxPoints;
        });
      });

    // Calculate total institutional points to add to each subject
    const instMaxTotal = Object.values(instColumns).reduce((s, c) => s + c.max, 0);
    const instStudentTotal = Object.values(instColumns).reduce((s, c) => s + c.student, 0);

    // Second pass: extract subject planillas
    approvedPlanillas
      .filter(p => monthFilter.includes(p.month) && p.planillaType !== 'institucional')
      .forEach(planilla => {
        const { subjectName, teacherName, month, tasks, scores, planillaType } = planilla;
        const myScoreObj = scores.find(s => s.studentId === STUDENT_ID);
        if (!myScoreObj) return;

        const maxTotal = tasks.reduce((s, t) => s + t.maxPoints, 0);
        const studentTotal = tasks.reduce((s, t) => s + (myScoreObj.scores[t.id] || 0), 0);
        
        const key = planilla.subjectId;
        if (!stats[key]) {
          // Initialize subject with the base institutional points already added
          stats[key] = { 
            subjectName, 
            teacherName, 
            months: {}, 
            parcial: { studentTotal: 0, maxTotal: 0 },
            examen: { studentTotal: 0, maxTotal: 0 },
            totalStudentPoints: instStudentTotal, 
            totalMaxPoints: instMaxTotal 
          };
        }

        if (planillaType === 'parcial') {
          stats[key].parcial.studentTotal += studentTotal;
          stats[key].parcial.maxTotal += maxTotal;
        } else if (planillaType === 'examen') {
          stats[key].examen.studentTotal += studentTotal;
          stats[key].examen.maxTotal += maxTotal;
        } else {
          if (stats[key].months[month]) {
            stats[key].months[month].studentTotal += studentTotal;
            stats[key].months[month].maxTotal += maxTotal;
          } else {
            stats[key].months[month] = { studentTotal, maxTotal };
          }
        }

        stats[key].totalStudentPoints += studentTotal;
        stats[key].totalMaxPoints += maxTotal;
      });

    return { 
      subjects: Object.values(stats).sort((a, b) => a.subjectName.localeCompare(b.subjectName)), 
      instColumns 
    };
  }, [approvedPlanillas, STUDENT_ID]);

  const { subjects: etapa1Stats, instColumns: etapa1Inst } = useMemo(() => buildStats(ETAPA_1_MONTHS), [buildStats]);
  const { subjects: etapa2Stats, instColumns: etapa2Inst } = useMemo(() => buildStats(ETAPA_2_MONTHS), [buildStats]);

  const finalGrades = [...etapa1Stats, ...etapa2Stats].map(subj => {
    return calculateGrade(subj.totalStudentPoints, subj.totalMaxPoints);
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
      ) : (etapa1Stats.length === 0 && etapa2Stats.length === 0) ? (
        <p className="text-center text-muted-foreground py-8">No hay planillas aprobadas para calcular el promedio.</p>
      ) : (
        <div className="space-y-6">
          {/* Etapa 1 */}
          {etapa1Stats.length > 0 && (
            <EtapaTable
              title="1ra Etapa (Febrero — Mayo)"
              etapaMonths={ETAPA_1_MONTHS}
              subjectStats={etapa1Stats}
              instColumns={etapa1Inst}
            />
          )}

          {/* Etapa 2 */}
          {etapa2Stats.length > 0 && (
            <EtapaTable
              title="2da Etapa (Junio — Diciembre)"
              etapaMonths={ETAPA_2_MONTHS}
              subjectStats={etapa2Stats}
              instColumns={etapa2Inst}
            />
          )}

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

