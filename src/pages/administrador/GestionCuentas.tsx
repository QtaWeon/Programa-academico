import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { UserPlus, Users, BookOpen, GraduationCap, Trash2, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAccountsStore, Account } from '@/lib/accounts-store';
import { usePlanillasStore } from '@/lib/planillas-store';
import { useCoursesStore } from '@/lib/courses-store';
import { toPascalCase } from '@/lib/utils';

const GestionCuentas = () => {
  const { toast } = useToast();
  const { accounts, loading, fetchAccounts, createAccount, updateAccount, deleteAccount: removeAccount } = useAccountsStore();
  const { planillas, fetchPlanillas } = usePlanillasStore();
  const { courses, fetchCourses, updateCourse } = useCoursesStore();

  useEffect(() => { 
    fetchAccounts(true); 
    fetchPlanillas(true);
    fetchCourses(true);
  }, [fetchAccounts, fetchPlanillas, fetchCourses]);

  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'alumno';

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('Todos');
  const [newAccount, setNewAccount] = useState({
    firstName: '', lastName: '', ci: '', grade: '',
  });

  const handleCreateAccount = async () => {
    const currentRole = activeTab === 'egresado' ? 'alumno' : activeTab;
    if (!newAccount.firstName || !newAccount.lastName || !newAccount.ci) return;
    if (currentRole === 'alumno' && !newAccount.grade) {
      toast({ title: 'Error', description: 'Debés seleccionar el curso del alumno.', variant: 'destructive' });
      return;
    }
    const email = `${newAccount.ci}@cpcc.com`;
    
    // Check if CI already exists (normalizing dots)
    const normalizedNewCI = newAccount.ci.replace(/\./g, '');
    const existing = accounts.find(a => a.ci.replace(/\./g, '') === normalizedNewCI);
    
    if (existing) {
      toast({ title: 'Error', description: 'Ya existe una cuenta con esa cédula', variant: 'destructive' });
      return;
    }

    const formattedFirstName = newAccount.firstName.trim();
    const formattedLastName = newAccount.lastName.trim();

    try {
      await createAccount({
        firstName: formattedFirstName,
        lastName: formattedLastName,
        ci: newAccount.ci,
        email,
        role: currentRole as Account['role'],
        grade: currentRole === 'alumno' ? newAccount.grade : undefined,
        status: activeTab === 'egresado' ? 'egresado' : 'activo',
      });
      setNewAccount({ firstName: '', lastName: '', ci: '', grade: '' });
      setShowCreateDialog(false);
      toast({
        title: 'Cuenta creada',
        description: `${formattedFirstName} ${formattedLastName} — Email: ${email} — Contraseña: ${newAccount.ci}cpcc`,
        variant: 'success'
      });
    } catch {
      toast({ title: 'Error', description: 'No se pudo crear la cuenta', variant: 'destructive' });
    }
  };



  const handleToggleStatus = async (account: Account) => {
    const action = account.status === 'activo' ? 'desactivar' : 'activar';
    if (!confirm(`¿Estás seguro que deseas ${action} la cuenta de ${account.firstName} ${account.lastName}?`)) return;
    try {
      await updateAccount(account.id, {
        status: account.status === 'activo' ? 'inactivo' : 'activo',
      });
      toast({ title: `Cuenta ${account.status === 'activo' ? 'desactivada' : 'activada'}` });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handlePromoteToEgresado = async (account: Account) => {
    if (account.grade !== '3° Año') {
      toast({ title: 'Error', description: 'Sólo alumnos de 3° Año pueden ser egresados.', variant: 'destructive' });
      return;
    }

    if (!confirm(`¿Estás seguro que deseas promover a ${account.firstName} ${account.lastName} como Egresado de forma manual?`)) return;

    try {
      await updateAccount(account.id, {
        status: 'egresado',
      });
      // Remove student from any courses
      const studentCourses = courses.filter(c => c.students.includes(account.id));
      for (const course of studentCourses) {
        await updateCourse(course.id, {
          students: course.students.filter(sid => sid !== account.id)
        });
      }
      toast({ title: 'Alumno promovido a Egresado con éxito.' });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const roleLabel = (role: string) => {
    switch (role) {
      case 'administrador': return 'Administrador';
      case 'coordinador': return 'Coordinador';
      case 'docente': return 'Profesor';
      case 'alumno': return 'Alumno';
      default: return role;
    }
  };

  const roleIcon = (role: string) => {
    switch (role) {
      case 'administrador': return <Shield className="h-4 w-4" />;
      case 'coordinador': return <Users className="h-4 w-4" />;
      case 'docente': return <BookOpen className="h-4 w-4" />;
      case 'alumno': return <GraduationCap className="h-4 w-4" />;
      default: return null;
    }
  };

  const normalizeString = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filterByView = (view: string) => {
    return accounts
      .filter(a => {
        if (view === 'egresado') return a.status === 'egresado';
        if (view === 'alumno') return a.role === 'alumno' && a.status !== 'egresado';
        return a.role === view;
      })
      .filter(a => {
        if ((view === 'alumno' || view === 'egresado') && gradeFilter !== 'Todos' && a.grade !== gradeFilter) return false;
        if (!searchTerm) return true;
        const term = normalizeString(searchTerm);
        return normalizeString(a.firstName).includes(term) ||
               normalizeString(a.lastName).includes(term) ||
               a.ci.includes(term);
      })
      .sort((a, b) => a.lastName.localeCompare(b.lastName));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <UserPlus className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Gestión de Cuentas</h2>
            <p className="text-sm text-muted-foreground">Administración de usuarios: Administradores, Coordinadores, Profesores y Alumnos</p>
          </div>
        </div>
        {activeTab !== 'egresado' && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" /> Crear Cuenta
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <Input
          placeholder="Buscar cuenta por nombre, apellido o cédula..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        {(activeTab === 'alumno' || activeTab === 'egresado') && (
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar curso" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos los Cursos</SelectItem>
              <SelectItem value="1° Año">1° Año</SelectItem>
              <SelectItem value="2° Año">2° Año</SelectItem>
              <SelectItem value="3° Año">3° Año</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {loading && <p className="text-center text-muted-foreground py-8">Cargando cuentas...</p>}

      <div className="space-y-3 mt-4">
        {filterByView(activeTab).map(account => (
          <Card key={account.id}>
            <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  {roleIcon(account.role)}
                </div>
                <div>
                  <p className="font-medium">{account.lastName}, {account.firstName}</p>
                  <p className="text-xs text-muted-foreground">
                    CI: {account.ci} · Email: {account.email}
                    {account.grade && ` · ${account.grade}`}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {account.role === 'alumno' && account.grade === '3° Año' && account.status === 'activo' && (
                  <Button variant="outline" size="sm" onClick={() => handlePromoteToEgresado(account)} className="border-green-500 text-green-700 hover:bg-green-50">
                    <GraduationCap className="h-4 w-4 mr-1" /> Graduar
                  </Button>
                )}
                <Badge variant={account.status === 'activo' ? 'default' : account.status === 'egresado' ? 'outline' : 'secondary'} className={account.status === 'egresado' ? 'border-yellow-500 text-yellow-700' : ''}>
                  {account.status}
                </Badge>
                {account.status !== 'egresado' && (
                  <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(account)}>
                    {account.status === 'activo' ? 'Desactivar' : 'Activar'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {filterByView(activeTab).length === 0 && (
          <p className="text-center text-muted-foreground py-8">No hay cuentas aquí.</p>
        )}
      </div>

      {/* Create Account Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nueva Cuenta</DialogTitle>
            <p className="text-sm text-muted-foreground">Completá los datos para crear una cuenta institucional</p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={newAccount.firstName} onChange={(e) => setNewAccount(p => ({ ...p, firstName: e.target.value.toUpperCase() }))} />
              </div>
              <div className="space-y-2">
                <Label>Apellido</Label>
                <Input value={newAccount.lastName} onChange={(e) => setNewAccount(p => ({ ...p, lastName: e.target.value.toUpperCase() }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cédula de Identidad</Label>
              <Input value={newAccount.ci} onChange={(e) => setNewAccount(p => ({ ...p, ci: e.target.value }))} placeholder="Ej: 5845123" />
              <p className="text-xs text-muted-foreground">El email será: {newAccount.ci || 'cedula'}@cpcc.com · Contraseña: {newAccount.ci || 'cedula'}cpcc</p>
            </div>
            {(activeTab === 'alumno' || activeTab === 'egresado') && (
              <div className="space-y-2">
                <Label>Curso</Label>
                <Select value={newAccount.grade} onValueChange={(v) => setNewAccount(p => ({ ...p, grade: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar curso" /></SelectTrigger>
                  <SelectContent className="z-[200]">
                    <SelectItem value="1° Año">1° Año</SelectItem>
                    <SelectItem value="2° Año">2° Año</SelectItem>
                    <SelectItem value="3° Año">3° Año</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateAccount} disabled={!newAccount.firstName || !newAccount.lastName || !newAccount.ci || ((activeTab === 'alumno' || activeTab === 'egresado') && !newAccount.grade)}>
              Crear Cuenta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GestionCuentas;
