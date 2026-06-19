import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useAccountsStore } from '@/lib/accounts-store';
import { LogIn, Loader2, IdCard, Shield, Users, BookOpen, GraduationCap, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserRole } from '@/lib/types';

const Login = () => {
  const { login, setRole, setUser, isLoading } = useAppStore();
  const { fetchAccounts } = useAccountsStore();
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!cedula || !password) {
      setError('Faltan credenciales.');
      return;
    }

    if (!cedula.includes('@') || !cedula.endsWith('@cpcc.com')) {
      setError('Correo inválido.');
      return;
    }

    const cedulaNumber = cedula.replace('@cpcc.com', '').replace(/\./g, '');
    const expectedPassword = `${cedulaNumber}cpcc`;

    if (password !== expectedPassword) {
      setError('Contraseña incorrecta.');
      return;
    }

    // Ensure accounts are loaded from Firestore
    await fetchAccounts();

    const success = await login(cedula, password);
    if (!success) {
      setError('Usuario no encontrado o inactivo.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4">
            <IdCard className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Colegio Politécnico Cooperativa Capiatá</h1>
          <p className="text-muted-foreground mt-1">Sistema de Gestión de Planillas Académicas</p>
        </div>

        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Iniciar Sesión</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="1234567@cpcc.com"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                className="mt-1"
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground mt-1">Formato: número_cédula@cpcc.com</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="cedulacpcc"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </CardContent>
        </Card>

        <Button className="w-full h-12 text-base gap-2 mb-6" onClick={handleLogin} disabled={isLoading}>
          {isLoading ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Iniciando sesión...</>
          ) : (
            <><LogIn className="h-5 w-5" /> Iniciar Sesión</>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground mt-6">
          CPCC · Paraguay 🇵🇾 · Planillas Mensuales
        </p>
      </div>
    </div>
  );
};

export default Login;
