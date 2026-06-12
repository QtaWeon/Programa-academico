export const MONTHS_ETAPA_1 = [
  { month: 2, name: 'Febrero' },
  { month: 3, name: 'Marzo' },
  { month: 4, name: 'Abril' },
  { month: 5, name: 'Mayo' },
];

export const MONTHS_ETAPA_2 = [
  { month: 6, name: 'Junio' },
  { month: 7, name: 'Julio' },
  { month: 8, name: 'Agosto' },
  { month: 9, name: 'Septiembre' },
  { month: 10, name: 'Octubre' },
  { month: 11, name: 'Noviembre' },
  { month: 12, name: 'Diciembre' },
];

export const ALL_MONTHS = [
  { month: 2, name: 'Febrero' },
  { month: 3, name: 'Marzo' },
  { month: 4, name: 'Abril' },
  { month: 5, name: 'Mayo' },
  { month: 6, name: 'Junio' },
  { month: 7, name: 'Julio' },
  { month: 8, name: 'Agosto' },
  { month: 9, name: 'Septiembre' },
  { month: 10, name: 'Octubre' },
  { month: 11, name: 'Noviembre' },
  { month: 12, name: 'Diciembre' },
];

export const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export const gradeLabel = (g: number) => {
  switch (g) {
    case 1: return 'Deficiente';
    case 2: return 'Insuficiente';
    case 3: return 'Aceptable';
    case 4: return 'Bueno';
    case 5: return 'Excelente';
    default: return '-';
  }
};

export const gradeColor = (g: number) => {
  if (g >= 4) return 'text-success';
  if (g === 3) return 'text-warning';
  return 'text-destructive';
};

export const formatGuaranies = (amount: number) => {
  return new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', minimumFractionDigits: 0 }).format(amount);
};
