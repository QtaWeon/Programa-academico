import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { UserRole } from '@/lib/types';
import { Link, useLocation } from 'react-router-dom';
import {
  GraduationCap, BookOpen, Shield, LogOut, Menu,
  Layers, Home, Users, UserPlus, FolderOpen, ClipboardCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  subItems?: { label: string; path: string }[];
}

const navItems: Record<UserRole, NavItem[]> = {
  administrador: [
    { label: 'Inicio', path: '/administrador', icon: <Home className="h-4 w-4" /> },
    { label: 'Revisar Planillas', path: '/administrador/revisar', icon: <ClipboardCheck className="h-4 w-4" />,
      subItems: [
        { label: 'Pendientes', path: '/administrador/revisar?tab=pendientes' },
        { label: 'Aprobadas', path: '/administrador/revisar?tab=aprobadas' },
        { label: 'Rechazadas', path: '/administrador/revisar?tab=rechazadas' },
      ]
    },
    { label: 'Gestión de Cursos', path: '/administrador/cursos', icon: <FolderOpen className="h-4 w-4" /> },
    { label: 'Gestión de Cuentas', path: '/administrador/cuentas', icon: <UserPlus className="h-4 w-4" />,
      subItems: [
        { label: 'Alumnos', path: '/administrador/cuentas?tab=alumno' },
        { label: 'Profesores', path: '/administrador/cuentas?tab=docente' },
        { label: 'Coordinadores', path: '/administrador/cuentas?tab=coordinador' },
        { label: 'Administradores', path: '/administrador/cuentas?tab=administrador' },
        { label: 'Egresados', path: '/administrador/cuentas?tab=egresado' },
      ]
    },
  ],
  coordinador: [
    { label: 'Inicio', path: '/coordinador', icon: <Home className="h-4 w-4" /> },
    { label: 'Planillas Mensuales', path: '/coordinador/planillas', icon: <Layers className="h-4 w-4" /> },
    { label: 'Revisar Planillas', path: '/coordinador/revisar', icon: <ClipboardCheck className="h-4 w-4" />,
      subItems: [
        { label: 'Pendientes', path: '/coordinador/revisar?tab=pendientes' },
        { label: 'Aprobadas', path: '/coordinador/revisar?tab=aprobadas' },
        { label: 'Rechazadas', path: '/coordinador/revisar?tab=rechazadas' },
      ]
    },
    { label: 'Gestión de Cursos', path: '/coordinador/cursos', icon: <FolderOpen className="h-4 w-4" /> },
  ],
  docente: [
    { label: 'Inicio', path: '/docente', icon: <Home className="h-4 w-4" /> },
    { label: 'Planillas Mensuales', path: '/docente/planillas', icon: <Layers className="h-4 w-4" />,
      subItems: [
        { label: 'Crear/Editar', path: '/docente/planillas?tab=crear' },
        { label: 'Mis Planillas', path: '/docente/planillas?tab=mis' },
      ]
    },
  ],
  alumno: [
    { label: 'Inicio', path: '/alumno', icon: <Home className="h-4 w-4" /> },
    { label: 'Mis Planillas', path: '/alumno/planillas', icon: <Layers className="h-4 w-4" />,
      subItems: [
        { label: 'Todas', path: '/alumno/planillas?tab=todas' },
        { label: 'T.P.', path: '/alumno/planillas?tab=tp' },
        { label: 'Examen', path: '/alumno/planillas?tab=examen' },
        { label: 'Tareas', path: '/alumno/planillas?tab=tareas' },
        { label: 'Institucional', path: '/alumno/planillas?tab=institucional' },
      ]
    },
    { label: 'Promedio Final', path: '/alumno/promedio', icon: <BookOpen className="h-4 w-4" /> },
  ],
};

const roleLabels: Record<UserRole, string> = {
  administrador: 'Administrador',
  coordinador: 'Coordinador',
  docente: 'Profesor',
  alumno: 'Alumno',
};

const roleIcons: Record<UserRole, React.ReactNode> = {
  administrador: <Shield className="h-5 w-5" />,
  coordinador: <Users className="h-5 w-5" />,
  docente: <BookOpen className="h-5 w-5" />,
  alumno: <GraduationCap className="h-5 w-5" />,
};

const SidebarItem = ({ item, setSidebarOpen }: { item: NavItem, setSidebarOpen: (v: boolean) => void }) => {
  const location = useLocation();
  const isActive = location.pathname === item.path && !item.subItems;
  const isSubActive = item.subItems?.some(sub => location.pathname + location.search === sub.path);
  const isExpandedByDefault = location.pathname === item.path;
  const [expanded, setExpanded] = useState(isExpandedByDefault);

  return (
    <div className="space-y-1">
      {item.subItems ? (
        <button
          onClick={() => setExpanded(!expanded)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-sidebar-accent text-sidebar-foreground`}
        >
          <div className="flex items-center gap-3">
            {item.icon}
            {item.label}
          </div>
          <span className="text-xs opacity-50">{expanded ? '▼' : '▶'}</span>
        </button>
      ) : (
        <Link
          to={item.path}
          onClick={() => setSidebarOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
            isActive
              ? 'bg-sidebar-primary text-sidebar-primary-foreground'
              : 'hover:bg-sidebar-accent text-sidebar-foreground'
          }`}
        >
          {item.icon}
          {item.label}
        </Link>
      )}

      {item.subItems && expanded && (
        <div className="pl-9 space-y-1">
          {item.subItems.map((sub) => {
            const isSubItemActive = location.pathname + location.search === sub.path;
            return (
              <Link
                key={sub.path}
                to={sub.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                  isSubItemActive
                    ? 'bg-sidebar-primary/20 text-sidebar-primary-foreground'
                    : 'hover:bg-sidebar-accent/50 text-sidebar-foreground opacity-80'
                }`}
              >
                {sub.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentRole, user, logout } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!currentRole) return null;

  const items = navItems[currentRole];

  return (
    <div className="min-h-screen flex bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-200 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3 mb-4">
          </div>
          
          <div className="flex items-center gap-2 px-1 py-1 bg-sidebar-accent/50 rounded-lg">
            <div className="p-1.5 flex items-center justify-center rounded-md bg-background/50 text-foreground">
              {roleIcons[currentRole]}
            </div>
            <div className="flex-1 overflow-hidden">
              <span className="text-sm font-medium block truncate">{user?.name || 'Usuario'}</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-2">
          {items.map((item) => (
            <SidebarItem key={item.path} item={item} setSidebarOpen={setSidebarOpen} />
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border mt-auto">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden">
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3 no-print lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">
            {roleLabels[currentRole]}
          </h1>
        </header>
        <main className="flex-1 p-4 md:p-6 animate-fade-in min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
