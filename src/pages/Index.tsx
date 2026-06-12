import { useEffect, useState } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import { useAccountsStore } from '@/lib/accounts-store';
import Login from './Login';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const currentRole = useAppStore((s) => s.currentRole);
  const loginAsUser = useAppStore((s) => s.loginAsUser);
  const { fetchAccounts } = useAccountsStore();
  const [searchParams] = useSearchParams();
  const [autoLoggingIn, setAutoLoggingIn] = useState(false);
  const [error, setError] = useState('');

  const demoParam = searchParams.get('demo');

  useEffect(() => {
    const performAutoLogin = async () => {
      if (demoParam === 'ximena') {
        setAutoLoggingIn(true);
        setError('');
        try {
          // Force fetch accounts from database
          await fetchAccounts(true);
          
          const targetAccount = useAccountsStore.getState().accounts.find(
            (a) =>
              a.role === 'alumno' &&
              a.firstName.toLowerCase().includes('ximena') &&
              a.lastName.toLowerCase().includes('portillo')
          );

          if (targetAccount) {
            const success = await loginAsUser(targetAccount.id);
            if (!success) {
              setError('No se pudo iniciar sesión de demostración.');
            }
          } else {
            setError('La estudiante "Ximena Portillo" no fue encontrada en la base de datos. Por favor, asegúrate de que el sembrador de datos haya inyectado la semilla correspondiente.');
          }
        } catch (err) {
          console.error(err);
          setError('Error de red al conectar con la base de datos.');
        } finally {
          setAutoLoggingIn(false);
        }
      }
    };

    performAutoLogin();
  }, [demoParam, fetchAccounts, loginAsUser]);

  if (autoLoggingIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <div className="relative flex items-center justify-center mb-4">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
          <Loader2 className="absolute h-6 w-6 animate-pulse text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground animate-pulse mb-1">Cargando Demostración</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          Accediendo al dashboard de demostración...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center animate-fade-in">
        <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Error de Demostración</h2>
        <p className="text-muted-foreground text-sm max-w-md mb-6">{error}</p>
        <Button 
          variant="outline"
          onClick={() => window.location.href = window.location.origin}
        >
          Ir al Inicio de Sesión Normal
        </Button>
      </div>
    );
  }

  if (currentRole) {
    return <Navigate to={`/${currentRole}`} replace />;
  }

  return <Login />;
};

export default Index;
