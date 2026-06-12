import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAppStore } from "@/lib/store";
import { UserRole } from "@/lib/types";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import AppLayout from "./components/AppLayout";

// Lazy-loaded Pages
const AlumnoDashboard = lazy(() => import("./pages/alumno/AlumnoDashboard"));
const MisPlanillas = lazy(() => import("./pages/alumno/MisPlanillas"));
const Promedio = lazy(() => import("./pages/alumno/Promedio"));

const DocenteDashboard = lazy(() => import("./pages/docente/DocenteDashboard"));
const PlanillaMensual = lazy(() => import("./pages/docente/PlanillaMensual"));

const CoordinadorDashboard = lazy(() => import("./pages/coordinador/CoordinadorDashboard"));
const GestionCursos = lazy(() => import("./pages/coordinador/GestionCursos"));
const RevisarPlanillas = lazy(() => import("./pages/coordinador/RevisarPlanillas"));

const AdminDashboard = lazy(() => import("./pages/administrador/AdminDashboard"));
const GestionCuentas = lazy(() => import("./pages/administrador/GestionCuentas"));

const queryClient = new QueryClient();

const roleHomePath: Record<UserRole, string> = {
  administrador: "/administrador",
  coordinador: "/coordinador",
  docente: "/docente",
  alumno: "/alumno",
};

const PageLoader = () => (
  <div className="h-[50vh] flex flex-col items-center justify-center text-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary opacity-80" />
    <p className="text-xs text-muted-foreground mt-2 animate-pulse">Cargando sección...</p>
  </div>
);

const ProtectedRoutes = () => {
  const currentRole = useAppStore((s) => s.currentRole);
  const location = useLocation();

  if (!currentRole) return <Navigate to="/" replace />;

  const allowedPrefix = roleHomePath[currentRole];
  const isAuthorizedPath =
    location.pathname === allowedPrefix ||
    location.pathname.startsWith(`${allowedPrefix}/`);

  if (!isAuthorizedPath) {
    return <Navigate to={allowedPrefix} replace />;
  }

  return (
    <AppLayout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Alumno */}
          <Route path="/alumno" element={<AlumnoDashboard />} />
          <Route path="/alumno/planillas" element={<MisPlanillas />} />
          <Route path="/alumno/promedio" element={<Promedio />} />

          {/* Profesor */}
          <Route path="/docente" element={<DocenteDashboard />} />
          <Route path="/docente/planillas" element={<PlanillaMensual />} />

          {/* Coordinador - hereda planillas + gestión cursos */}
          <Route path="/coordinador" element={<CoordinadorDashboard />} />
          <Route path="/coordinador/planillas" element={<PlanillaMensual />} />
          <Route path="/coordinador/revisar" element={<RevisarPlanillas />} />
          <Route path="/coordinador/cursos" element={<GestionCursos />} />

          {/* Administrador - hereda todo + gestión cuentas */}
          <Route path="/administrador" element={<AdminDashboard />} />
          <Route path="/administrador/planillas" element={<PlanillaMensual />} />
          <Route path="/administrador/revisar" element={<RevisarPlanillas />} />
          <Route path="/administrador/cursos" element={<GestionCursos />} />
          <Route path="/administrador/cuentas" element={<GestionCuentas />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AppLayout>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
