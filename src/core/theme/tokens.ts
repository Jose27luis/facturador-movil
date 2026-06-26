export interface Paleta {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  muted: string;
  faint: string;
  brand: string;
  onBrand: string;
  ok: string;
  warn: string;
  danger: string;
}

export const paletaClara: Paleta = {
  bg: '#F3EEE3',
  surface: '#FFFFFF',
  surfaceAlt: '#EFE9DC',
  border: '#E6DFD1',
  text: '#211D17',
  muted: '#8A8273',
  faint: '#A89F8F',
  brand: '#8A5A00',
  onBrand: '#FFFFFF',
  ok: '#3F7A52',
  warn: '#B5791A',
  danger: '#B23B3B',
};

export const paletaOscura: Paleta = {
  bg: '#1A1712',
  surface: '#221E18',
  surfaceAlt: '#2A251E',
  border: '#39342B',
  text: '#F3EEE3',
  muted: '#A89F8F',
  faint: '#7A7163',
  brand: '#D69A3C',
  onBrand: '#1A1712',
  ok: '#5FA877',
  warn: '#E0A93C',
  danger: '#D96C6C',
};

export const tipografia = {
  sans: 'Inter',
  mono: 'IBM Plex Mono',
};

export const radios = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
};

export const espacios = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};
