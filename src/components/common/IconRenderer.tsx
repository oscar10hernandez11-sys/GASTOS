import React from 'react';
import * as LucideIcons from 'lucide-react';

interface IconRendererProps {
  name: string;
  className?: string;
  size?: number;
}

export const IconRenderer: React.FC<IconRendererProps> = ({ name, className = 'w-5 h-5', size = 20 }) => {
  // Buscar coincidencia en lucide-react
  const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
  const IconComponent = (LucideIcons as Record<string, any>)[formattedName] ||
    (LucideIcons as Record<string, any>)[name] ||
    LucideIcons.Tag;

  return <IconComponent className={className} size={size} />;
};

export const AVAILABLE_CATEGORY_ICONS = [
  'ShoppingCart',
  'Home',
  'Car',
  'HeartPulse',
  'GraduationCap',
  'Film',
  'MoreHorizontal',
  'Utensils',
  'Coffee',
  'Briefcase',
  'Plane',
  'Gift',
  'Smartphone',
  'Wifi',
  'Zap',
  'Shirt',
  'Tv',
  'BookOpen',
  'Dumbbell',
  'Wrench',
  'CreditCard',
];

export const AVAILABLE_CATEGORY_COLORS = [
  '#0F4C5C', // Azul Petróleo (acento principal)
  '#16A34A', // Verde Esmeralda
  '#2563EB', // Azul Cobalto
  '#D97706', // Ámbar Cálido
  '#DC2626', // Rojo Carmesí
  '#7C3AED', // Violeta Intenso
  '#DB2777', // Rosa Fucsia
  '#0284C7', // Celeste
  '#059669', // Verde Mar
  '#EA580C', // Naranja
  '#475569', // Gris Pizarra
  '#4B5563', // Gris Carbón
];
