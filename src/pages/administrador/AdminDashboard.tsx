import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layers, FolderOpen, UserPlus, Shield, ClipboardCheck, Sparkles, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useAccountsStore } from '@/lib/accounts-store';
import { useCoursesStore } from '@/lib/courses-store';
import { usePlanillasStore } from '@/lib/planillas-store';

const AdminDashboard = () => {
  const { toast } = useToast();
  const { accounts, fetchAccounts } = useAccountsStore();
  const { courses, fetchCourses } = useCoursesStore();
  const { planillas, fetchPlanillas } = usePlanillasStore();

  useEffect(() => {
    fetchAccounts(true);
    fetchCourses(true);
    fetchPlanillas(true);
  }, [fetchAccounts, fetchCourses, fetchPlanillas]);

  const totalAlumnos = accounts.filter(a => a.role === 'alumno' && a.status === 'activo').length;
  const totalDocentes = accounts.filter(a => a.role === 'docente' && a.status === 'activo').length;
  const totalCursos = courses.length;
  const planillasPendientes = planillas.filter(p => p.status === 'enviado').length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Alumnos Activos</h3>
            <p className="text-3xl font-bold text-primary">{totalAlumnos}</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Profesores Activos</h3>
            <p className="text-3xl font-bold text-primary">{totalDocentes}</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Cursos Creados</h3>
            <p className="text-3xl font-bold text-primary">{totalCursos}</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Planillas Pendientes</h3>
            <p className="text-3xl font-bold text-primary">{planillasPendientes}</p>
          </CardContent>
        </Card>
      </div>


    </div>
  );
};

export default AdminDashboard;
