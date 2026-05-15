import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Eye, Clock, Layers, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePlanillasStore, Planilla } from '@/lib/planillas-store';
import { ALL_MONTHS } from '@/lib/constants';
import { useAppStore } from '@/lib/store';
import { useAccountsStore } from '@/lib/accounts-store';

const RevisarPlanillas = () => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'pendientes';
  const { toast } = useToast();
  const { user, currentRole } = useAppStore();
  const { planillas, loading, fetchPlanillas, updatePlanilla } = usePlanillasStore();
  const { accounts, fetchAccounts } = useAccountsStore();

  const [viewPlanilla, setViewPlanilla] = useState<Planilla | null>(null);
  const [rejectPlanilla, setRejectPlanilla] = useState<Planilla | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchPlanillas(true);
    fetchAccounts(true);
  }, [fetchPlanillas, fetchAccounts]);

  const CURRENT_YEAR = new Date().getFullYear();

  const visiblePlanillas = (currentRole === 'administrador'
    ? planillas
    : planillas.filter(planilla => planilla.coordinatorId === user?.id)
  ).filter(p => p.year === CURRENT_YEAR);

  const pendientes = visiblePlanillas.filter(planilla => planilla.status === 'enviado');
  const aprobadas = visiblePlanillas.filter(planilla => planilla.status === 'aprobado');
  const rechazadas = visiblePlanillas.filter(planilla => planilla.status === 'rechazado');
  const solicitudesEdicion = visiblePlanillas.filter(planilla => planilla.editRequestStatus === 'pending');

  const handleApprove = async (planilla: Planilla) => {
    try {
      await updatePlanilla(planilla.id, {
        status: 'aprobado',
        approvedDate: new Date().toISOString(),
        approvedBy: user?.name || 'Coordinador',
      });
      toast({ title: 'Planilla aprobada', description: `${planilla.subjectName} - ahora es visible para los alumnos` });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleReject = async () => {
    if (!rejectPlanilla || !rejectionReason.trim()) return;

    try {
      await updatePlanilla(rejectPlanilla.id, {
        status: 'rechazado',
        rejectionReason: rejectionReason.trim(),
      });
      toast({ title: 'Planilla rechazada', description: 'El profesor verá el motivo del rechazo.' });
      setRejectPlanilla(null);
      setRejectionReason('');
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleApproveEdit = async (planilla: Planilla) => {
    try {
      await updatePlanilla(planilla.id, {
        editRequestStatus: 'approved',
      });
      toast({ title: 'Edición permitida', description: `El profesor ahora puede editar la planilla de ${planilla.subjectName}` });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleDenyEdit = async (planilla: Planilla) => {
    try {
      await updatePlanilla(planilla.id, {
        editRequestStatus: 'none',
      });
      toast({ title: 'Edición denegada', description: 'Se ha rechazado el pedido de edición.' });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const getStudentName = (id: string) => {
    const account = accounts.find(acc => acc.id === id);
    return account ? `${account.lastName}, ${account.firstName}` : id;
  };

  const renderPlanillaCard = (planilla: Planilla, showActions: boolean, isEditRequest: boolean = false) => {
    const monthLabel = ALL_MONTHS.find(month => month.month === planilla.month)?.name || '';

    return (
      <Card key={planilla.id} className={isEditRequest ? 'border-amber-200 bg-amber-50/30' : ''}>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold">{planilla.subjectName}</p>
              <p className="text-xs text-muted-foreground">
                {planilla.courseName} - {monthLabel} {planilla.year} - Prof. {planilla.teacherName}
              </p>
              <p className="text-xs text-muted-foreground">
                {planilla.tasks.length} tareas - {planilla.scores.length} alumnos
                {planilla.submittedDate && ` - Enviada: ${new Date(planilla.submittedDate).toLocaleDateString('es-PY')}`}
              </p>
              {isEditRequest && planilla.editRequestReason && (
                <div className="mt-2 p-2 bg-amber-100/50 rounded border border-amber-200">
                  <p className="text-xs font-semibold text-amber-800">Motivo de edición:</p>
                  <p className="text-xs text-amber-700 italic">"{planilla.editRequestReason}"</p>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setViewPlanilla(planilla)}>
                <Eye className="h-4 w-4 mr-1" /> Ver
              </Button>
              {showActions && !isEditRequest && (
                <>
                  <Button size="sm" onClick={() => handleApprove(planilla)} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-4 w-4 mr-1" /> Aprobar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => { setRejectPlanilla(planilla); setRejectionReason(''); }}>
                    <XCircle className="h-4 w-4 mr-1" /> Rechazar
                  </Button>
                </>
              )}
              {isEditRequest && (
                <>
                  <Button size="sm" onClick={() => handleApproveEdit(planilla)} className="bg-amber-600 hover:bg-amber-700">
                    <CheckCircle className="h-4 w-4 mr-1" /> Permitir Edición
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDenyEdit(planilla)} className="text-destructive border-destructive hover:bg-destructive/10">
                    <XCircle className="h-4 w-4 mr-1" /> Denegar
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Layers className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Revisar Planillas</h2>
          <p className="text-sm text-muted-foreground">
            {currentRole === 'administrador'
              ? `Año ${CURRENT_YEAR} — Ves todas las planillas del sistema.`
              : `Año ${CURRENT_YEAR} — Solo ves las planillas de los cursos que coordinás.`}
          </p>
        </div>
      </div>

      {loading && <p className="text-center text-muted-foreground py-8">Cargando...</p>}

      <div className="space-y-3">
        {solicitudesEdicion.length > 0 && (
          <div className="mb-6 space-y-3">
            <h3 className="font-semibold flex items-center gap-2 text-amber-700"><AlertTriangle className="h-4 w-4" /> Solicitudes de Edición ({solicitudesEdicion.length})</h3>
            {solicitudesEdicion.map(planilla => renderPlanillaCard(planilla, false, true))}
            <hr className="my-4" />
          </div>
        )}

        {activeTab === 'pendientes' && (
          <>
            <h3 className="font-semibold flex items-center gap-2 mb-2"><Clock className="h-4 w-4" /> Pendientes ({pendientes.length})</h3>
            {pendientes.length === 0 && <p className="text-center text-muted-foreground py-8">No hay planillas pendientes de revisión.</p>}
            {pendientes.map(planilla => renderPlanillaCard(planilla, true))}
          </>
        )}

        {activeTab === 'aprobadas' && (
          <>
            <h3 className="font-semibold flex items-center gap-2 mb-2"><CheckCircle className="h-4 w-4" /> Aprobadas ({aprobadas.length})</h3>
            {aprobadas.length === 0 && <p className="text-center text-muted-foreground py-8">No hay planillas aprobadas.</p>}
            {aprobadas.map(planilla => renderPlanillaCard(planilla, false))}
          </>
        )}

        {activeTab === 'rechazadas' && (
          <>
            <h3 className="font-semibold flex items-center gap-2 mb-2"><XCircle className="h-4 w-4" /> Rechazadas ({rechazadas.length})</h3>
            {rechazadas.length === 0 && <p className="text-center text-muted-foreground py-8">No hay planillas rechazadas.</p>}
            {rechazadas.map(planilla => (
              <div key={planilla.id}>
                {renderPlanillaCard(planilla, false)}
                {planilla.rejectionReason && (
                  <p className="text-xs text-destructive ml-4 mt-1">Motivo: {planilla.rejectionReason}</p>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      <Dialog open={!!viewPlanilla} onOpenChange={(open) => !open && setViewPlanilla(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {viewPlanilla?.subjectName} - {ALL_MONTHS.find(month => month.month === viewPlanilla?.month)?.name} {viewPlanilla?.year}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">Detalle de puntajes por alumno</p>
          </DialogHeader>
          {viewPlanilla && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border min-w-[600px]">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="py-2 px-2 border-r text-center">N°</th>
                    <th className="py-2 px-3 border-r text-left min-w-[180px]">Alumno</th>
                    {viewPlanilla.tasks.map(task => (
                      <th key={task.id} className="py-2 px-1 border-r text-center min-w-[50px]">
                        <div className="text-sm font-semibold">{task.name}</div>
                        <div className="text-xs text-muted-foreground">({task.maxPoints}pts)</div>
                      </th>
                    ))}
                    <th className="py-2 px-2 text-center bg-primary/10 text-base">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {viewPlanilla.scores.map((entry, index) => {
                    const total = viewPlanilla.tasks.reduce((sum, task) => sum + (entry.scores[task.id] || 0), 0);
                    return (
                      <tr key={entry.studentId} className="border-b hover:bg-muted/30">
                        <td className="py-2 px-2 border-r text-center">{index + 1}</td>
                        <td className="py-2 px-3 border-r">{getStudentName(entry.studentId)}</td>
                        {viewPlanilla.tasks.map(task => (
                          <td key={task.id} className="py-2 px-1 border-r text-center font-medium text-base">
                            {entry.scores[task.id] || 0}
                          </td>
                        ))}
                        <td className="py-2 px-2 text-center font-bold text-base bg-primary/5">{total}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectPlanilla} onOpenChange={(open) => !open && setRejectPlanilla(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Planilla</DialogTitle>
            <p className="text-sm text-muted-foreground">Indicá el motivo del rechazo</p>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm">
              Planilla: <strong>{rejectPlanilla?.subjectName}</strong> - {rejectPlanilla?.teacherName}
            </p>
            <div className="space-y-1">
              <Label>Motivo del rechazo</Label>
              <Input value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Ej: Faltan puntajes de algunos alumnos" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectPlanilla(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason.trim()}>Rechazar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RevisarPlanillas;
