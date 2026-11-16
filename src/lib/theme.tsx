import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getCategorias, updateCategoria } from '../services/dataService';

export interface AppTheme {
  id: string;
  name: string;
  description: string;
  accent: string;
  accentFg: string;
  accentHover: string;
  pageBg: string;
  sidebarBg: string;
  cardBg: string;
  cardMuted: string;
  cardBorder: string;
  chartSecondary: string;
  chartGrid: string;
  chartTick: string;
  donutStroke: string;
  categoryPalette: string[];
}

interface ThemePreset {
  id: string;
  name: string;
  description: string;
  light: Omit<AppTheme, 'id' | 'name' | 'description'>;
  dark: Omit<AppTheme, 'id' | 'name' | 'description'>;
}

const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'petroleo',
    name: 'Petróleo Clásico',
    description: 'Sobrio, neutro y editorial',
    light: {
      accent: '#0F4C5C',
      accentFg: '#0F4C5C',
      accentHover: '#0B3945',
      pageBg: '#F8FAFC',
      sidebarBg: '#FFFFFF',
      cardBg: '#FFFFFF',
      cardMuted: '#F1F5F9',
      cardBorder: '#E2E8F0',
      chartSecondary: '#CBD5E1',
      chartGrid: '#F1F5F9',
      chartTick: '#64748B',
      donutStroke: '#FFFFFF',
      categoryPalette: ['#0F4C5C', '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51', '#457B9D', '#64748B'],
    },
    dark: {
      accent: '#16697F',
      accentFg: '#38B6CC',
      accentHover: '#1D7E97',
      pageBg: '#0B1116',
      sidebarBg: '#101820',
      cardBg: '#121B24',
      cardMuted: '#182430',
      cardBorder: '#243445',
      chartSecondary: '#354A5E',
      chartGrid: '#1D2B38',
      chartTick: '#94A3B8',
      donutStroke: '#121B24',
      categoryPalette: ['#2BA3BA', '#34C3B0', '#E9C46A', '#F4A261', '#E76F51', '#6495B8', '#94A3B8'],
    },
  },
  {
    id: 'bosque',
    name: 'Bosque & Salvia',
    description: 'Orgánico y sereno',
    light: {
      accent: '#2D6A4F',
      accentFg: '#2D6A4F',
      accentHover: '#1F4E39',
      pageBg: '#F5F8F6',
      sidebarBg: '#FFFFFF',
      cardBg: '#FFFFFF',
      cardMuted: '#EEF4F0',
      cardBorder: '#DCE6E0',
      chartSecondary: '#BFD3C7',
      chartGrid: '#EDF3EF',
      chartTick: '#64748B',
      donutStroke: '#FFFFFF',
      categoryPalette: ['#2D6A4F', '#52796F', '#84A98C', '#E07A5F', '#B56576', '#3D405B', '#6D597A'],
    },
    dark: {
      accent: '#2D6A4F',
      accentFg: '#52B788',
      accentHover: '#378160',
      pageBg: '#0A110E',
      sidebarBg: '#0F1814',
      cardBg: '#111C17',
      cardMuted: '#18261F',
      cardBorder: '#24382E',
      chartSecondary: '#344F41',
      chartGrid: '#1B2B23',
      chartTick: '#94A3B8',
      donutStroke: '#111C17',
      categoryPalette: ['#52B788', '#74C69D', '#95D5B2', '#E07A5F', '#C97B8D', '#7E82A8', '#9A86A8'],
    },
  },
  {
    id: 'indigo',
    name: 'Índigo Editorial',
    description: 'Preciso y contemporáneo',
    light: {
      accent: '#3730A3',
      accentFg: '#3730A3',
      accentHover: '#2A2480',
      pageBg: '#F7F8FC',
      sidebarBg: '#FFFFFF',
      cardBg: '#FFFFFF',
      cardMuted: '#EEF0F8',
      cardBorder: '#E0E4F0',
      chartSecondary: '#C7D2FE',
      chartGrid: '#EFF1F8',
      chartTick: '#64748B',
      donutStroke: '#FFFFFF',
      categoryPalette: ['#3730A3', '#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#EC4899', '#64748B'],
    },
    dark: {
      accent: '#4F46E5',
      accentFg: '#818CF8',
      accentHover: '#6366F1',
      pageBg: '#0B0C14',
      sidebarBg: '#10121E',
      cardBg: '#131624',
      cardMuted: '#1B1E30',
      cardBorder: '#292D46',
      chartSecondary: '#3A4169',
      chartGrid: '#1F2336',
      chartTick: '#94A3B8',
      donutStroke: '#131624',
      categoryPalette: ['#818CF8', '#6366F1', '#38BDF8', '#34D399', '#FBBF24', '#F472B6', '#94A3B8'],
    },
  },
  {
    id: 'terracota',
    name: 'Terracota & Arena',
    description: 'Cálido y contrastado',
    light: {
      accent: '#9A3412',
      accentFg: '#9A3412',
      accentHover: '#7C2D12',
      pageBg: '#FAF8F5',
      sidebarBg: '#FFFFFF',
      cardBg: '#FFFFFF',
      cardMuted: '#F5EFE9',
      cardBorder: '#EAE2DA',
      chartSecondary: '#E5D3C8',
      chartGrid: '#F4EEE8',
      chartTick: '#78716C',
      donutStroke: '#FFFFFF',
      categoryPalette: ['#9A3412', '#C2410C', '#D97706', '#0F766E', '#475569', '#B45309', '#78716C'],
    },
    dark: {
      accent: '#B4441B',
      accentFg: '#FB923C',
      accentHover: '#CA5224',
      pageBg: '#120D0B',
      sidebarBg: '#18120F',
      cardBg: '#1B1411',
      cardMuted: '#251C18',
      cardBorder: '#382A24',
      chartSecondary: '#523C32',
      chartGrid: '#291F1B',
      chartTick: '#A8A29E',
      donutStroke: '#1B1411',
      categoryPalette: ['#FB923C', '#F97316', '#FBBF24', '#2DD4BF', '#94A3B8', '#F59E0B', '#A8A29E'],
    },
  },
  {
    id: 'grafito',
    name: 'Grafito Ejecutivo',
    description: 'Monocromático de alto contraste',
    light: {
      accent: '#1E293B',
      accentFg: '#1E293B',
      accentHover: '#0F172A',
      pageBg: '#F8FAFC',
      sidebarBg: '#FFFFFF',
      cardBg: '#FFFFFF',
      cardMuted: '#F1F5F9',
      cardBorder: '#E2E8F0',
      chartSecondary: '#CBD5E1',
      chartGrid: '#F1F5F9',
      chartTick: '#64748B',
      donutStroke: '#FFFFFF',
      categoryPalette: ['#1E293B', '#475569', '#0F4C5C', '#059669', '#D97706', '#BE123C', '#64748B'],
    },
    dark: {
      accent: '#334155',
      accentFg: '#E2E8F0',
      accentHover: '#475569',
      pageBg: '#0B0E14',
      sidebarBg: '#10141C',
      cardBg: '#131822',
      cardMuted: '#1A202D',
      cardBorder: '#273042',
      chartSecondary: '#3C485E',
      chartGrid: '#1E2533',
      chartTick: '#94A3B8',
      donutStroke: '#131822',
      categoryPalette: ['#E2E8F0', '#94A3B8', '#38B6CC', '#34D399', '#FBBF24', '#FB7185', '#64748B'],
    },
  },
];

export const APP_THEMES: AppTheme[] = THEME_PRESETS.map((p) => ({
  id: p.id,
  name: p.name,
  description: p.description,
  ...p.light,
}));

const THEME_STORAGE_KEY = 'kakebo_ui_theme_v1';

interface StoredThemePrefs {
  themeId: string;
  customAccent: string | null;
  syncCategories: boolean;
  isDark: boolean;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '').trim();
  const normalized =
    clean.length === 3
      ? clean
          .split('')
          .map((ch) => ch + ch)
          .join('')
      : clean.padEnd(6, '0').slice(0, 6);
  const num = parseInt(normalized, 16);
  if (Number.isNaN(num)) return { r: 15, g: 76, b: 92 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
  );
}

function mixHex(hexA: string, hexB: string, ratioB: number): string {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  return rgbToHex(
    a.r + (b.r - a.r) * ratioB,
    a.g + (b.g - a.g) * ratioB,
    a.b + (b.b - a.b) * ratioB
  );
}

function darkenHex(hex: string, factor: number = 0.2): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r * (1 - factor), g * (1 - factor), b * (1 - factor));
}

function lightenHex(hex: string, ratio: number = 0.75): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * ratio, g + (255 - g) * ratio, b + (255 - b) * ratio);
}

function buildCustomPalette(primaryHex: string, isDark: boolean): string[] {
  const base = isDark ? lightenHex(primaryHex, 0.3) : primaryHex;
  const tint1 = lightenHex(base, 0.28);
  const tint2 = lightenHex(base, 0.5);
  return [
    base,
    tint1,
    isDark ? '#34C3B0' : '#2A9D8F',
    isDark ? '#FBBF24' : '#D97706',
    '#E07A5F',
    tint2,
    isDark ? '#94A3B8' : '#64748B',
  ];
}

interface ThemeContextValue {
  theme: AppTheme;
  isDark: boolean;
  customAccent: string | null;
  syncCategories: boolean;
  setSyncCategories: (val: boolean) => void;
  setDarkMode: (val: boolean) => void;
  toggleDarkMode: () => void;
  selectTheme: (themeId: string, applyToCategories?: boolean) => Promise<void>;
  setCustomAccentColor: (hex: string, applyToCategories?: boolean) => Promise<void>;
  applyThemePaletteToCategories: (colors?: string[]) => Promise<void>;
  categorySyncVersion: number;
  applyingCategories: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [prefs, setPrefs] = useState<StoredThemePrefs>(() => {
    try {
      const raw = localStorage.getItem(THEME_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          themeId: parsed.themeId || 'petroleo',
          customAccent: parsed.customAccent || null,
          syncCategories: parsed.syncCategories !== false,
          isDark: Boolean(parsed.isDark),
        };
      }
    } catch {
      // Ignorar errores de almacenamiento
    }
    return { themeId: 'petroleo', customAccent: null, syncCategories: true, isDark: false };
  });

  const [categorySyncVersion, setCategorySyncVersion] = useState(0);
  const [applyingCategories, setApplyingCategories] = useState(false);

  const activeTheme: AppTheme = useMemo(() => {
    const preset = THEME_PRESETS.find((t) => t.id === prefs.themeId) || THEME_PRESETS[0];
    const modeTokens = prefs.isDark ? preset.dark : preset.light;

    if (!prefs.customAccent) {
      return {
        id: preset.id,
        name: preset.name,
        description: preset.description,
        ...modeTokens,
      };
    }

    const accent = prefs.customAccent;
    if (prefs.isDark) {
      return {
        id: 'custom',
        name: 'Personalizado',
        description: 'Color personalizado en modo oscuro',
        accent,
        accentFg: lightenHex(accent, 0.42),
        accentHover: lightenHex(accent, 0.14),
        pageBg: mixHex('#0B0F14', accent, 0.06),
        sidebarBg: mixHex('#10151D', accent, 0.07),
        cardBg: mixHex('#121822', accent, 0.07),
        cardMuted: mixHex('#18202D', accent, 0.09),
        cardBorder: mixHex('#243042', accent, 0.14),
        chartSecondary: mixHex('#334155', accent, 0.22),
        chartGrid: '#1D2533',
        chartTick: '#94A3B8',
        donutStroke: mixHex('#121822', accent, 0.07),
        categoryPalette: buildCustomPalette(accent, true),
      };
    }

    return {
      id: 'custom',
      name: 'Personalizado',
      description: 'Color personalizado en modo claro',
      accent,
      accentFg: accent,
      accentHover: darkenHex(accent, 0.22),
      pageBg: lightenHex(accent, 0.96),
      sidebarBg: '#FFFFFF',
      cardBg: '#FFFFFF',
      cardMuted: '#F1F5F9',
      cardBorder: '#E2E8F0',
      chartSecondary: lightenHex(accent, 0.72),
      chartGrid: '#F1F5F9',
      chartTick: '#64748B',
      donutStroke: '#FFFFFF',
      categoryPalette: buildCustomPalette(accent, false),
    };
  }, [prefs.themeId, prefs.customAccent, prefs.isDark]);

  // Aplicar clase .dark y CSS variables globales a todo el documento
  useEffect(() => {
    const root = document.documentElement;
    if (prefs.isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    const fgRgb = hexToRgb(activeTheme.accentFg);
    const softAlpha = prefs.isDark ? 0.16 : 0.10;
    const tintAlpha = prefs.isDark ? 0.09 : 0.05;
    const borderAlpha = prefs.isDark ? 0.36 : 0.28;

    root.style.setProperty('--accent', activeTheme.accent);
    root.style.setProperty('--accent-fg', activeTheme.accentFg);
    root.style.setProperty('--accent-hover', activeTheme.accentHover);
    root.style.setProperty('--accent-soft', `rgba(${fgRgb.r}, ${fgRgb.g}, ${fgRgb.b}, ${softAlpha})`);
    root.style.setProperty('--accent-tint', `rgba(${fgRgb.r}, ${fgRgb.g}, ${fgRgb.b}, ${tintAlpha})`);
    root.style.setProperty('--accent-border', `rgba(${fgRgb.r}, ${fgRgb.g}, ${fgRgb.b}, ${borderAlpha})`);
    root.style.setProperty('--page-bg', activeTheme.pageBg);
    root.style.setProperty('--sidebar-bg', activeTheme.sidebarBg);
    root.style.setProperty('--card-bg', activeTheme.cardBg);
    root.style.setProperty('--card-muted', activeTheme.cardMuted);
    root.style.setProperty('--card-border', activeTheme.cardBorder);
    root.style.setProperty('--chart-secondary', activeTheme.chartSecondary);
    root.style.setProperty('--chart-grid', activeTheme.chartGrid);
    root.style.setProperty('--chart-tick', activeTheme.chartTick);
    root.style.setProperty('--donut-stroke', activeTheme.donutStroke);

    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Ignorar
    }
  }, [activeTheme, prefs]);

  const applyThemePaletteToCategories = async (colors?: string[]) => {
    const palette = colors || activeTheme.categoryPalette;
    setApplyingCategories(true);
    try {
      const cats = await getCategorias();
      if (cats.length > 0) {
        await Promise.all(
          cats.map((cat, idx) =>
            updateCategoria(cat.id, cat.nombre, cat.icono, palette[idx % palette.length])
          )
        );
        setCategorySyncVersion((v) => v + 1);
      }
    } catch {
      // Si no hay sesión aún (ej. en AuthScreen), simplemente omite sincronizar BD
    } finally {
      setApplyingCategories(false);
    }
  };

  const selectTheme = async (themeId: string, applyToCategories?: boolean) => {
    const preset = THEME_PRESETS.find((t) => t.id === themeId) || THEME_PRESETS[0];
    setPrefs((prev) => ({ ...prev, themeId: preset.id, customAccent: null }));
    const shouldSync = applyToCategories ?? prefs.syncCategories;
    if (shouldSync) {
      const palette = prefs.isDark ? preset.dark.categoryPalette : preset.light.categoryPalette;
      await applyThemePaletteToCategories(palette);
    }
  };

  const setCustomAccentColor = async (hex: string, applyToCategories?: boolean) => {
    setPrefs((prev) => ({ ...prev, customAccent: hex }));
    const shouldSync = applyToCategories ?? prefs.syncCategories;
    if (shouldSync) {
      await applyThemePaletteToCategories(buildCustomPalette(hex, prefs.isDark));
    }
  };

  const setSyncCategories = (val: boolean) => {
    setPrefs((prev) => ({ ...prev, syncCategories: val }));
  };

  const setDarkMode = (val: boolean) => {
    setPrefs((prev) => ({ ...prev, isDark: val }));
  };

  const toggleDarkMode = () => {
    setPrefs((prev) => ({ ...prev, isDark: !prev.isDark }));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: activeTheme,
        isDark: prefs.isDark,
        customAccent: prefs.customAccent,
        syncCategories: prefs.syncCategories,
        setSyncCategories,
        setDarkMode,
        toggleDarkMode,
        selectTheme,
        setCustomAccentColor,
        applyThemePaletteToCategories,
        categorySyncVersion,
        applyingCategories,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }
  return ctx;
}
